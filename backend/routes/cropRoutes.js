import express from "express";
import jwt from "jsonwebtoken";
import Crop from "../models/Crop.js";
import Farmer from "../models/Farmer.js";
import upload from "../middleware/upload.js";
import { addCrop } from "../controllers/farmerController.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { callGeminiWithFallback } from "../services/geminiService.js";

const router = express.Router();

const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (token && token.startsWith("Bearer ")) {
      const tokenStr = token.split(" ")[1];
      const decoded = jwt.verify(tokenStr, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch (e) {}
  next();
};

// Add crop with image
router.post("/", optionalAuth, upload.single("image"), addCrop);
router.post("/add", optionalAuth, upload.single("image"), addCrop);

// Get my crops for logged in farmer
router.get("/farmer/my-crops", optionalAuth, async (req, res) => {
  try {
    const farmerId = req.user?._id || req.query.farmerId;
    if (!farmerId) return res.json([]);
    const crops = await Crop.find({ farmer: farmerId }).sort({ createdAt: -1 });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Sell crop to Admin (Clearance Sale)
router.put("/:id/sell-to-admin", optionalAuth, async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    // Mark as Admin Stock and apply clearance pricing
    crop.isAdminStock = true;
    crop.originalFarmer = crop.farmer; // track the source
    crop.clearanceDiscount = 40; // 40% discount given to farmer
    crop.price = Math.round(crop.price * 0.6); // Farmer takes 40% hit
    crop.coldStorageLocation = "RythuSethu Central Cold Storage, Hub 1";
    
    await crop.save();
    res.json({ success: true, message: "Crop sold to Admin for Clearance." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// Advanced Search Endpoint
// ──────────────────────────────────────────────
// GET /crops/search?q=tomato&category=vegetable&isOrganic=true&isPesticideFree=true
//                   &minPrice=10&maxPrice=100&maxDistance=25&lat=17.385&lng=78.487
//                   &sortBy=price_asc&page=1&limit=20
// ──────────────────────────────────────────────
// Simple In-Memory Cache for faster public reads
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

router.get("/search", async (req, res) => {
  const cacheKey = JSON.stringify(req.query);
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }
    cache.delete(cacheKey);
  }
  try {
    const {
      q,
      category,
      isOrganic,
      isPesticideFree,
      minPrice,
      maxPrice,
      maxDistance,
      lat,
      lng,
      sortBy,
      page = 1,
      limit = 50
    } = req.query;

    // Build MongoDB query
    const query = { isAvailable: { $ne: false }, isLive: { $ne: false }, quantity: { $gt: 0 } };

    // Case-insensitive text search on name + description
    if (q && q.trim()) {
      const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escapedQ, $options: "i" } },
        { description: { $regex: escapedQ, $options: "i" } },
        { category: { $regex: escapedQ, $options: "i" } },
        { location: { $regex: escapedQ, $options: "i" } }
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Organic filter
    if (isOrganic === "true") {
      query.isOrganic = true;
    }

    // Pesticide-free filter
    if (isPesticideFree === "true") {
      query.$or = query.$or || [];
      // Override the $or to include pesticide-free as an AND condition
      query.isPesticideFree = true;
    }

    // If both organic and pesticide-free are requested, use $or to match either
    if (isOrganic === "true" && isPesticideFree === "true") {
      delete query.isOrganic;
      delete query.isPesticideFree;
      // Text search $or already exists, add organic conditions as $and
      const organicCondition = { $or: [{ isOrganic: true }, { isPesticideFree: true }] };
      if (query.$or && query.$or.length > 0) {
        // Preserve text search, add organic as separate condition
        const textOr = query.$or;
        delete query.$or;
        query.$and = [
          { $or: textOr },
          organicCondition
        ];
      } else {
        query.$or = [{ isOrganic: true }, { isPesticideFree: true }];
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sortBy === "price_asc") sortOption = { price: 1 };
    else if (sortBy === "price_desc") sortOption = { price: -1 };
    else if (sortBy === "rating") sortOption = { rating: -1 };
    else if (sortBy === "trust_score") sortOption = { createdAt: -1 }; // will sort in-memory after populating farmer
    else if (sortBy === "distance") sortOption = { createdAt: -1 }; // will sort in-memory by distance

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch crops
    let crops = await Crop.find(query)
      .populate("farmer", "name email location latitude longitude farmName phone avatar trustScore")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Crop.countDocuments(query);

    // ─── Post-query: Distance filtering & sorting ───
    const customerLat = lat ? Number(lat) : null;
    const customerLng = lng ? Number(lng) : null;

    if (customerLat && customerLng) {
      // Compute distance for each crop
      crops = crops.map(c => {
        const cropObj = c.toObject();
        const cLat = cropObj.latitude || cropObj.farmer?.latitude;
        const cLng = cropObj.longitude || cropObj.farmer?.longitude;
        
        if (cLat && cLng) {
          cropObj.distance = haversineDistance(customerLat, customerLng, cLat, cLng);
        } else {
          cropObj.distance = null;
        }
        return cropObj;
      });

      // Filter by max distance
      if (maxDistance) {
        const maxDist = Number(maxDistance);
        crops = crops.filter(c => c.distance !== null && c.distance <= maxDist);
      }

      // Sort by distance if requested
      if (sortBy === "distance") {
        crops.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
    }

    // ─── Post-query: Trust score sorting ───
    if (sortBy === "trust_score") {
      // Get all unique farmer IDs
      const farmerIds = [...new Set(crops.map(c => {
        const fid = c.farmer?._id || c.farmer;
        return fid?.toString();
      }).filter(Boolean))];

      // Fetch trust scores from Farmer model
      const farmers = await Farmer.find({ user: { $in: farmerIds } });
      const trustMap = {};
      for (const f of farmers) {
        trustMap[f.user.toString()] = f.trustScore || 0;
      }

      crops.sort((a, b) => {
        const aFid = (a.farmer?._id || a.farmer)?.toString();
        const bFid = (b.farmer?._id || b.farmer)?.toString();
        return (trustMap[bFid] || 0) - (trustMap[aFid] || 0);
      });
    }

    // ─── Enrich with trust scores ───
    const farmerIds = [...new Set(crops.map(c => {
      const fid = c.farmer?._id || c.farmer;
      return fid?.toString();
    }).filter(Boolean))];

    const farmers = await Farmer.find({ user: { $in: farmerIds } });
    const trustMap = {};
    
    const GRADES = [
      { min: 90, grade: "Platinum", emoji: "🏆", label: "Exceptional" },
      { min: 75, grade: "Gold",     emoji: "🥇", label: "Highly Trusted" },
      { min: 60, grade: "Silver",   emoji: "🥈", label: "Trusted" },
      { min: 40, grade: "Bronze",   emoji: "🥉", label: "Building Trust" },
      { min: 0,  grade: "New",      emoji: "🌱", label: "Getting Started" },
    ];

    for (const f of farmers) {
      const score = f.trustScore || 0;
      const gradeInfo = GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1];
      trustMap[f.user.toString()] = {
        score,
        grade: gradeInfo.grade,
        emoji: gradeInfo.emoji,
        label: gradeInfo.label
      };
    }

    // Attach trust scores to crops
    const enrichedCrops = crops.map(c => {
      const cropObj = c.toObject ? c.toObject() : c;
      const fid = (cropObj.farmer?._id || cropObj.farmer)?.toString();
      cropObj.farmerTrust = trustMap[fid] || { score: 0, grade: "New", emoji: "🌱", label: "Getting Started" };
      return cropObj;
    });

    const result = {
      crops: enrichedCrops,
      total: maxDistance ? enrichedCrops.length : total,
      page: Number(page),
      totalPages: Math.ceil((maxDistance ? enrichedCrops.length : total) / Number(limit))
    };
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Search Suggestions Endpoint
// ──────────────────────────────────────────────
// GET /crops/suggestions?q=tom
// Returns matching crop names for autocomplete
router.get("/suggestions", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json([]);
    }

    const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Find distinct crops matching the query in name OR category
    const crops = await Crop.find(
      {
        $or: [
          { name: { $regex: escapedQ, $options: "i" } },
          { category: { $regex: escapedQ, $options: "i" } }
        ],
        isAvailable: { $ne: false },
        isLive: { $ne: false },
        quantity: { $gt: 0 }
      },
      { name: 1, category: 1, isOrganic: 1, isPesticideFree: 1, price: 1, location: 1 }
    ).populate("farmer", "trustScore").limit(20);

    // Generate advanced smart suggestions
    const suggestions = [];
    const seenNames = new Set();
    const seenCategories = new Set();

    for (const crop of crops) {
      const lowerName = crop.name.toLowerCase();
      
      // Advanced AI-style Category Suggestion
      if (crop.category && !seenCategories.has(crop.category.toLowerCase()) && crop.category.toLowerCase().includes(q.toLowerCase())) {
        seenCategories.add(crop.category.toLowerCase());
        suggestions.push({
          text: `Explore all ${crop.category}s`,
          type: "category",
          searchQuery: crop.category
        });
      }

      // Basic name suggestion
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        suggestions.push({
          text: crop.name,
          type: "name",
          category: crop.category
        });

        // Top Rated / High Trust Suggestion
        if (crop.farmer && crop.farmer.trustScore >= 75) {
          suggestions.push({
            text: `${crop.name} – From Top Rated Farmers 🏆`,
            type: "trust",
            searchQuery: crop.name
          });
        }

        // Organic variant
        if (crop.isOrganic) {
          suggestions.push({
            text: `${crop.name} – 100% Certified Organic 🌿`,
            type: "organic",
            filter: { isOrganic: true },
            searchQuery: crop.name
          });
        }

        // Pesticide-free variant
        if (crop.isPesticideFree && !crop.isOrganic) {
          suggestions.push({
            text: `${crop.name} – Pesticide Free 🛡️`,
            type: "pesticide_free",
            filter: { isPesticideFree: true },
            searchQuery: crop.name
          });
        }

        // Smart Budget Suggestions
        if (crop.price <= 100) {
          suggestions.push({
            text: `${crop.name} – Under ₹100 Deals 💰`,
            type: "budget",
            filter: { maxPrice: 100 },
            searchQuery: crop.name
          });
        }
      }
    }

    res.json(suggestions.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all crops
router.get("/", async (req, res) => {
  try {
    const crops = await Crop.find({ isLive: { $ne: false } }).populate("farmer", "name email location latitude longitude farmName phone avatar trustScore").sort({ createdAt: -1 });
    res.json(crops);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get Seasonal Crops based on current month
router.get("/seasonal/current", async (req, res) => {
  try {
    const currentMonth = new Date().getMonth(); // 0-11
    let currentSeason = "kharif";
    if (currentMonth >= 5 && currentMonth <= 9) currentSeason = "kharif"; // Jun - Oct
    else if (currentMonth >= 10 || currentMonth <= 2) currentSeason = "rabi"; // Nov - Mar
    else currentSeason = "zaid"; // Apr - May

    const seasonalMap = {
      kharif: ["rice", "maize", "cotton", "groundnut", "tomato", "chili", "okra"],
      rabi: ["wheat", "barley", "mustard", "peas", "potato", "onion", "carrot", "garlic", "spinach"],
      zaid: ["watermelon", "cucumber", "bitter gourd", "pumpkin", "mango"]
    };

    const allowedCrops = seasonalMap[currentSeason].map(name => new RegExp(name, "i"));

    const crops = await Crop.find({ 
      isLive: { $ne: false },
      $or: allowedCrops.map(regex => ({ name: regex }))
    }).populate("farmer", "name email location latitude longitude farmName phone avatar trustScore").sort({ createdAt: -1 });
    
    res.json(crops);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single crop
router.get("/:id", async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate("farmer", "name email location latitude longitude farmName phone avatar trustScore");
    if (!crop) return res.status(404).json({ error: "Crop not found" });
    res.json(crop);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update crop availability
router.put("/:id/availability", async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, { isAvailable: req.body.isAvailable }, { new: true });
    res.json(crop);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle crop live/offline status
router.put("/:id/live", async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ error: "Crop not found" });
    crop.isLive = req.body.isLive !== undefined ? req.body.isLive : !crop.isLive;
    await crop.save();
    const io = req.app?.get?.("io");
    if (io) io.emit("crop_updated", crop);
    res.json(crop);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete crop
router.delete("/:id", async (req, res) => {
  try {
    await Crop.findByIdAndDelete(req.params.id);
    res.json({ message: "Crop removed" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update crop price
router.put("/:id/price", async (req, res) => {
  try {
    const { price } = req.body;
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ error: "Crop not found" });
    
    // Anti-overpricing check
    if (price > 250) {
      const isCertified = 
        (crop.certificationStatus === "approved") || 
        (crop.organicVerification && crop.organicVerification.status === "certified_genuine");
      if (!isCertified) {
        return res.status(400).json({ error: `Anti-Overpricing Alert: You cannot set a price of ₹${price}/kg without an approved Organic Certification.` });
      }
    }

    crop.price = price;
    await crop.save();
    
    const io = req.app?.get?.("io");
    if (io) io.emit("crop_price_updated", { cropId: crop._id, price: crop.price, name: crop.name });
    
    res.json(crop);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update entire crop details
router.put("/:id", async (req, res) => {
  try {
    const { name, category, quantity, unit, price, priceRange, waterAvailability } = req.body;
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    // Anti-overpricing check
    const priceToCheck = price !== undefined ? price : (priceRange ? priceRange.max : crop.price);
    if (priceToCheck > 250) {
      const isCertified = 
        (crop.certificationStatus === "approved") || 
        (crop.organicVerification && crop.organicVerification.status === "certified_genuine");
      if (!isCertified) {
        return res.status(400).json({ error: `Anti-Overpricing Alert: You cannot set a price of ₹${priceToCheck}/kg without an approved Organic Certification.` });
      }
    }

    if (name) crop.name = name;
    if (category) crop.category = category;
    if (quantity !== undefined) crop.quantity = quantity;
    if (unit) crop.unit = unit;
    if (price !== undefined) crop.price = price;
    if (priceRange) crop.priceRange = priceRange;
    if (waterAvailability) crop.waterAvailability = waterAvailability;

    await crop.save();
    res.json(crop);
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// Update crop lifecycle stage
router.put("/:id/stage", upload.single("image"), async (req, res) => {
  try {
    const { lifecycleStage, notes } = req.body;
    const crop = await Crop.findById(req.params.id).populate("farmer");
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    crop.lifecycleStage = lifecycleStage;
    
    // Add to lifecycleUpdates array with optional image proof
    const updateEntry = {
      stage: lifecycleStage,
      notes: notes || "",
      imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
      timestamp: new Date()
    };
    if (!crop.lifecycleUpdates) crop.lifecycleUpdates = [];
    crop.lifecycleUpdates.push(updateEntry);

    await crop.save();

    // Emit real-time event for frontend
    const io = req.app?.get?.("io");
    if (io) io.emit("crop_updated", crop);

    // Notify Admin
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await Notification.create({
        user: admin._id,
        title: "Crop Lifecycle Updated",
        message: `Farmer ${crop.farmer?.name || "Unknown"} updated their ${crop.name} crop to stage: ${lifecycleStage}.`,
        type: "system"
      });
    }

    // AI Suggestion
    let aiSuggestion = "";
    const prompt = `A farmer is growing ${crop.name} and the crop has just entered the "${lifecycleStage}" stage. Give a one sentence specific farming suggestion for this stage. If it is "harvesting" or "post_harvest", suggest eco-friendly alternatives to stubble burning like turning it into hay bales.`;
    const resText = await callGeminiWithFallback(prompt);
    if (resText) {
      aiSuggestion = resText.trim();
    } else {
      if (lifecycleStage === "post_harvest") aiSuggestion = "Instead of burning stubble, consider turning it into hay bales to prevent pollution.";
      else if (lifecycleStage === "vegetative") aiSuggestion = "Apply nitrogen-rich fertilizer to support rapid growth.";
      else aiSuggestion = "Monitor for pests and ensure adequate watering.";
    }

    res.json({ crop, aiSuggestion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Farm Tour Video
router.put("/:id/tour", upload.single("video"), async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    if (req.file) {
      crop.farmTourVideo = `/uploads/${req.file.filename}`;
      await crop.save();
    }

    res.json(crop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Haversine Distance (km) ──
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Request Organic Certification ──
router.post("/:id/request-certification", upload.single("document"), async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id).populate("farmer");
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    crop.certificationStatus = "pending";
    if (req.file) {
      crop.certificationDocument = `/uploads/${req.file.filename}`;
    }
    await crop.save();

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await Notification.create({
        user: admin._id,
        title: "🌾 Organic Certification Request",
        message: `Farmer ${crop.farmer?.name || "Unknown"} requested organic certification for ${crop.name}.`,
        type: "system",
        priority: "high",
        metadata: { cropId: crop._id }
      });
    }

    res.json(crop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin Review Certification ──
router.post("/:id/review-certification", async (req, res) => {
  try {
    const { status, notifyOfficials } = req.body; 
    const crop = await Crop.findById(req.params.id).populate("farmer");
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    crop.certificationStatus = status;
    if (status === "approved") {
      crop.isOrganic = true;
      crop.isPesticideFree = true;
    } else {
      crop.isOrganic = false;
    }
    await crop.save();

    await Notification.create({
      user: crop.farmer._id,
      title: status === "approved" ? "✅ Certification Approved" : "❌ Certification Rejected",
      message: `Your organic certification for ${crop.name} was ${status}.`,
      type: "system",
      priority: "high"
    });

    res.json(crop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── Transfer Pre-booked Crop to Live Sale ──
router.put("/:id/transfer-to-sale", async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    crop.isPrebooking = false;
    crop.lifecycleStage = "ready";
    
    // Add timeline update
    crop.lifecycleUpdates.push({
      stage: "ready",
      notes: "Transferred from pre-booking to live sale",
      timestamp: new Date()
    });

    await crop.save();
    res.json({ success: true, message: "Crop transferred to live sale successfully", crop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FOOD SAFETY & ANTI-FAKE ORGANIC CERTIFICATION SYSTEM ───

// 1. Get crops pending organic verification / food safety monitoring (For Agents & Inspectors)
router.get("/organic/pending-verifications", async (req, res) => {
  try {
    const crops = await Crop.find({
      $or: [
        { "organicVerification.status": { $in: ["pending_inspection", "step_verified", "unverified"] }, isOrganic: true },
        { certificationStatus: "pending" },
        { isOrganic: true }
      ]
    })
    .populate("farmer", "name phone location farmLocation farmName")
    .sort({ updatedAt: -1 })
    .limit(50);

    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Farmer submits a step photo proof
router.post("/:id/submit-organic-step", upload.single("photo"), async (req, res) => {
  try {
    const { stepKey, notes, practiceName } = req.body;
    const crop = await Crop.findById(req.params.id).populate("farmer");
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    if (!crop.organicVerification) {
      crop.organicVerification = { status: "pending_inspection", stepPhotos: {}, auditTrail: [] };
    }
    if (!crop.organicVerification.stepPhotos) {
      crop.organicVerification.stepPhotos = {};
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.photoUrl || "");

    crop.organicVerification.stepPhotos[stepKey] = {
      practice: practiceName || crop.organicVerification.stepPhotos[stepKey]?.practice || "Organic Practice",
      photoUrl: photoUrl || crop.organicVerification.stepPhotos[stepKey]?.photoUrl || "",
      submittedAt: new Date(),
      verified: false,
      agentNotes: ""
    };

    crop.organicVerification.status = "pending_inspection";
    crop.organicVerification.auditTrail.push({
      action: `Step Photo Submitted: ${stepKey}`,
      agentId: "farmer",
      agentName: crop.farmer?.name || "Farmer",
      timestamp: new Date(),
      notes: notes || "Farmer submitted photographic evidence of organic practice"
    });

    await crop.save();

    res.json({ success: true, message: `Step ${stepKey} submitted for agent inspection`, crop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Agent verifies or flags a specific step photo
router.post("/:id/agent-verify-step", async (req, res) => {
  try {
    const { stepKey, verified, notes, agentId, agentName } = req.body;
    const crop = await Crop.findById(req.params.id).populate("farmer");
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    if (!crop.organicVerification) {
      crop.organicVerification = { status: "pending_inspection", stepPhotos: {}, auditTrail: [] };
    }

    if (crop.organicVerification.stepPhotos && crop.organicVerification.stepPhotos[stepKey]) {
      crop.organicVerification.stepPhotos[stepKey].verified = Boolean(verified);
      crop.organicVerification.stepPhotos[stepKey].verifiedAt = new Date();
      crop.organicVerification.stepPhotos[stepKey].agentNotes = notes || (verified ? "Verified genuine on-field practice." : "Flagged: insufficient evidence or chemical residues suspected.");
    }

    // Check how many steps are verified
    const steps = Object.values(crop.organicVerification.stepPhotos || {});
    const verifiedCount = steps.filter(s => s && s.verified).length;
    if (verifiedCount >= 4) {
      crop.organicVerification.status = "step_verified";
    }

    crop.organicVerification.auditTrail.push({
      action: verified ? `Step Verified: ${stepKey}` : `Step Flagged/Rejected: ${stepKey}`,
      agentId: agentId || "agent",
      agentName: agentName || "Field Agent",
      timestamp: new Date(),
      notes: notes || ""
    });

    await crop.save();

    if (crop.farmer?._id) {
      await Notification.create({
        user: crop.farmer._id,
        title: verified ? "✅ Organic Step Verified by Agent" : "⚠️ Organic Step Flagged",
        message: `Agent ${agentName || "Inspector"} reviewed step "${stepKey}" for ${crop.name}: ${notes || (verified ? "Approved" : "Needs re-submission")}.`,
        type: "system",
        priority: verified ? "normal" : "high",
        metadata: { cropId: crop._id }
      });
    }

    res.json({ success: true, crop, verifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Agent signs off on full Food Safety & Security Audit
router.post("/:id/agent-food-safety-audit", async (req, res) => {
  try {
    const { 
      agentId, 
      agentName, 
      isGenuine, 
      foodSafetyScore, 
      chemicalResidueStatus, 
      hygieneGrade, 
      notes,
      cornBorderVerified,
      nskeVerified,
      catchCropVerified
    } = req.body;

    const crop = await Crop.findById(req.params.id).populate("farmer");
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    if (!crop.organicVerification) {
      crop.organicVerification = { status: "unverified", stepPhotos: {}, auditTrail: [] };
    }

    crop.organicVerification.verifiedByAgent = agentId || null;
    crop.organicVerification.agentName = agentName || "Food Safety Officer";
    crop.organicVerification.agentBadge = "Certified Quality Inspector";
    crop.organicVerification.inspectedAt = new Date();
    crop.organicVerification.foodSafetyScore = Number(foodSafetyScore) || 90;
    crop.organicVerification.chemicalResidueStatus = chemicalResidueStatus || "zero_detected";
    crop.organicVerification.hygieneGrade = hygieneGrade || "A+";
    crop.organicVerification.auditNotes = notes || "";

    if (isGenuine) {
      crop.organicVerification.status = "certified_genuine";
      crop.isOrganic = true;
      crop.isPesticideFree = true;
      crop.certificationStatus = "approved";
      crop.pesticideType = nskeVerified ? "organic_neem" : "contact";

      // Mark corn border and botanical steps verified
      if (crop.organicVerification.stepPhotos?.step3_corn_border_catch_crop) {
        crop.organicVerification.stepPhotos.step3_corn_border_catch_crop.verified = Boolean(cornBorderVerified);
      }
      if (crop.organicVerification.stepPhotos?.step4_botanical_spray) {
        crop.organicVerification.stepPhotos.step4_botanical_spray.verified = Boolean(nskeVerified);
      }

      crop.organicVerification.auditTrail.push({
        action: "Certified 100% Genuine Organic & Food Safety Approved",
        agentId: agentId || "agent",
        agentName: agentName || "Food Safety Inspector",
        timestamp: new Date(),
        notes: `Passed: Zero chemical residues, Corn border & NSKE verified. Hygiene Grade: ${hygieneGrade || "A+"}. Score: ${foodSafetyScore}/100.`
      });

      // Reward farmer trust score
      if (crop.farmer?._id) {
        await User.findByIdAndUpdate(crop.farmer._id, { $inc: { trustScore: 5 } });
      }
    } else {
      crop.organicVerification.status = "rejected_fake";
      crop.isOrganic = false;
      crop.certificationStatus = "rejected";

      crop.organicVerification.auditTrail.push({
        action: "🚨 Organic Claim REJECTED (Fake / Chemical Residue Detected)",
        agentId: agentId || "agent",
        agentName: agentName || "Food Safety Inspector",
        timestamp: new Date(),
        notes: `Rejected: Failed food safety audit. ${notes || "Pesticide residues or missing barrier crops."}`
      });

      // Penalize farmer trust score for fake organic claim
      if (crop.farmer?._id) {
        await User.findByIdAndUpdate(crop.farmer._id, { $inc: { trustScore: -15 } });
      }
    }

    await crop.save();

    if (crop.farmer?._id) {
      await Notification.create({
        user: crop.farmer._id,
        title: isGenuine ? "🛡️ Genuine Organic Seal Awarded!" : "❌ Organic Certification Revoked",
        message: isGenuine 
          ? `Food Safety Agent ${agentName} verified ${crop.name} as 100% Genuine Organic! Grade: ${hygieneGrade}, Score: ${foodSafetyScore}/100.`
          : `Food Safety Agent flagged ${crop.name}. Organic claim revoked due to: ${notes}`,
        type: "system",
        priority: "high",
        metadata: { cropId: crop._id }
      });
    }

    res.json({ success: true, isGenuine, crop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get full organic audit history & photo proofs
router.get("/:id/organic-audit-history", async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate("farmer", "name phone farmName farmLocation")
      .select("name category isOrganic certificationStatus organicVerification realFarmDetails realSalePlace");
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    res.json(crop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
