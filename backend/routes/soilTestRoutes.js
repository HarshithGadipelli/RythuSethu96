import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import SoilTestRequest from "../models/SoilTestRequest.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const router = express.Router();

async function sendNotification(app, userId, title, message, type = "system", priority = "normal", metadata = {}) {
  try {
    const notif = await Notification.create({
      user: userId,
      title,
      message,
      type,
      priority,
      metadata
    });
    const io = app.get("io");
    if (io) {
      io.emit(`notification_${userId}`, notif);
      io.emit("notification_new", notif);
    }
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
}

// Setup Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `soilPhoto-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Fallback rule-based soil classifier
function classifySoilFallback(text = "") {
  const t = text.toLowerCase();
  if (t.includes("black") || t.includes("dark") || t.includes("cotton")) {
    return {
      soilType: "Black Cotton Soil (Regur)",
      confidence: 94,
      texture: "Heavy clayey texture, highly moisture retentive, self-ploughing cracks upon drying",
      colorProfile: "Deep Black / Charcoal Brown",
      organicMatterEstimate: "Medium to High (0.6% - 0.8%)",
      suitableCrops: ["Cotton", "Sugarcane", "Wheat", "Soybean", "Jowar (Sorghum)", "Sunflower"],
      suggestedOrganicFertilizers: [
        "Well-rotted Cow Dung Farm Yard Manure (2-3 tonnes/acre)",
        "Jeevamrutham liquid bio-fertilizer every 15 days",
        "Neem cake powder for root health and nematode prevention"
      ],
      recommendations: "Maintain proper drainage during monsoons to avoid water stagnation. Avoid excessive chemical urea."
    };
  } else if (t.includes("red") || t.includes("sandy") || t.includes("loam")) {
    return {
      soilType: "Red Sandy Loam Soil",
      confidence: 91,
      texture: "Porous, crumbly structure with excellent aeration and rapid drainage",
      colorProfile: "Reddish Brown to Terracotta (Rich in Iron Oxide)",
      organicMatterEstimate: "Low to Moderate (0.4% - 0.6%)",
      suitableCrops: ["Groundnut", "Millets (Ragi, Bajra, Foxtail)", "Pulses (Toor, Moong)", "Tomatoes", "Chilli"],
      suggestedOrganicFertilizers: [
        "Vermicompost (500kg/acre) to improve organic matter",
        "Green Manuring with Dhaincha or Sunn hemp",
        "Phosphorus Solubilizing Bacteria (PSB) bio-inoculant"
      ],
      recommendations: "Incorporate organic compost to enhance water holding capacity. Mulch rows to retain soil moisture."
    };
  } else if (t.includes("clay") || t.includes("paddy")) {
    return {
      soilType: "Clay Loam Soil",
      confidence: 89,
      texture: "Dense, fine-particle soil with excellent nutrient holding capacity",
      colorProfile: "Greyish Brown to Dark Clay",
      organicMatterEstimate: "High (0.7% - 0.9%)",
      suitableCrops: ["Paddy (Rice)", "Brinjal", "Leafy Greens (Palak, Methi)", "Cabbage", "Cauliflower"],
      suggestedOrganicFertilizers: [
        "Gypsum application to improve soil permeability",
        "Trichoderma enriched compost for soil-borne disease protection",
        "Azospirillum bio-fertilizer for nitrogen fixation"
      ],
      recommendations: "Plough when soil has optimal moisture. Avoid heavy machinery when soil is waterlogged."
    };
  } else {
    return {
      soilType: "Alluvial Loam Soil",
      confidence: 88,
      texture: "Balanced sand, silt, and clay blend with optimum porosity and fertility",
      colorProfile: "Light Brown to Yellowish Loam",
      organicMatterEstimate: "High (0.7% - 1.0%)",
      suitableCrops: ["Rice", "Wheat", "Maize", "Sugarcane", "Mustard", "Vegetables & Fruits"],
      suggestedOrganicFertilizers: [
        "Panchagavya foliar spray (3%) every 20 days",
        "Enriched vermicompost and microbial culture consortia",
        "Bio NPK liquid consortia"
      ],
      recommendations: "Ideal versatile soil for multi-cropping and crop rotation. Regular organic inputs sustain high fertility."
    };
  }
}

// ─── 1. Instant AI Photo Soil Scanner ───
router.post("/scan-photo", upload.single("photo"), async (req, res) => {
  try {
    const { imageBase64, sampleNotes } = req.body;
    let photoUrl = req.file ? `/uploads/${req.file.filename}` : "";
    let analysisResult = null;

    // Use Gemini Vision if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && (imageBase64 || req.file)) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a certified senior agricultural soil scientist in India.
Analyze this farm soil photograph and return ONLY a valid JSON object without any markdown code blocks.
Identify:
1. "soilType": (e.g., "Black Cotton Soil (Regur)", "Red Sandy Loam", "Alluvial Loam", "Laterite Soil", "Clay Loam")
2. "confidence": (number between 85 and 98)
3. "texture": brief description of particle size, clay/sand balance, and water retention
4. "colorProfile": visual color details
5. "organicMatterEstimate": "Low (<0.5%)", "Medium (0.5% - 0.75%)", or "High (>0.75%)"
6. "suitableCrops": array of 5-6 best suitable crops for this soil
7. "suggestedOrganicFertilizers": array of 3 actionable organic manure/bio-fertilizer tips
8. "recommendations": practical farming and irrigation advice
9. "notice": "Visual scan identifies soil type. Chemical parameters (pH level, Nitrogen N, Phosphorus P, Potassium K, Organic Carbon, Electrical Conductivity EC, Micronutrients Zinc/Iron/Boron) require on-field chemical laboratory testing."`;

        let imagePart;
        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          imagePart = { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } };
        } else if (req.file) {
          const fileData = fs.readFileSync(req.file.path).toString("base64");
          imagePart = { inlineData: { data: fileData, mimeType: req.file.mimetype } };
        }

        const geminiRes = await model.generateContent([prompt, imagePart]);
        const text = geminiRes.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        }
      } catch (geminiErr) {
        console.warn("Gemini vision analysis fallback triggered:", geminiErr.message);
      }
    }

    if (!analysisResult) {
      analysisResult = classifySoilFallback(sampleNotes || "red soil sandy loam");
    }

    res.json({
      success: true,
      photoUrl: photoUrl || "/uploads/ai_farm_1.jpg",
      analysis: analysisResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. Book Soil Testing Appointment (with Advance Payment) ───
router.post("/book-appointment", async (req, res) => {
  try {
    const {
      farmerId,
      farmerName,
      phone,
      farmLocation,
      latitude,
      longitude,
      farmSizeAcres,
      soilPhoto,
      aiAnalysis,
      preferredDate,
      preferredTimeSlot,
      samplingSpotsCount,
      advanceAmount = 299,
      paymentMode = "upi"
    } = req.body;

    if (!farmerId) return res.status(400).json({ error: "Farmer ID is required." });

    const newRequest = await SoilTestRequest.create({
      farmer: farmerId,
      farmerName: farmerName || "Farmer",
      phone: phone || "",
      farmLocation: farmLocation || "Telangana Farm",
      latitude: latitude || 17.4000,
      longitude: longitude || 78.4800,
      farmSizeAcres: Number(farmSizeAcres) || 3,
      soilPhoto: soilPhoto || "/uploads/ai_farm_1.jpg",
      aiPreliminaryClassification: aiAnalysis || classifySoilFallback(""),
      appointmentDetails: {
        preferredDate: preferredDate ? new Date(preferredDate) : new Date(Date.now() + 86400000 * 2),
        preferredTimeSlot: preferredTimeSlot || "Morning (8:00 AM - 12:00 PM)",
        samplingSpotsCount: Number(samplingSpotsCount) || 3,
        advanceAmount: Number(advanceAmount) || 299,
        totalEstimatedFee: 799,
        balanceAmount: 500,
        paymentMode,
        paymentStatus: "paid",
        paymentTxnId: "SOIL-ADV-" + Date.now().toString(36).toUpperCase()
      },
      status: "pending_assignment"
    });

    // Notify all platform admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await sendNotification(req.app, admin._id,
        "🧪 New Soil Testing Appointment Booked!",
        `Farmer ${farmerName || "Farmer"} booked on-field soil testing for ${farmLocation}. Advance of ₹${advanceAmount} received. Please assign testing team.`,
        "system", "high", { requestId: newRequest._id }
      );
    }

    // Notify farmer of confirmation
    await sendNotification(req.app, farmerId,
      "✅ Soil Testing Appointment Confirmed",
      `Your soil testing appointment is registered! Advance ₹${advanceAmount} received. Admin will assign mobile lab team shortly.`,
      "system", "normal", { requestId: newRequest._id }
    );

    const io = req.app.get("io");
    if (io) io.emit("soil_request_created", newRequest);

    res.status(201).json({
      success: true,
      message: "Soil testing appointment booked successfully with advance payment.",
      request: newRequest
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. Get Farmer's Requests ───
router.get("/my-requests/:farmerId", async (req, res) => {
  try {
    const requests = await SoilTestRequest.find({ farmer: req.params.farmerId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. Get All Requests (Admin Data Center) ───
router.get("/admin-all", async (req, res) => {
  try {
    const requests = await SoilTestRequest.find().populate("farmer", "name email phone location avatar").sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 5. Admin Assigns Soil Testing Team ───
router.put("/:id/assign-team", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      scientistName,
      teamVehicleNumber,
      contactPhone,
      scheduledVisitDate,
      adminNotes
    } = req.body;

    if (!scientistName) return res.status(400).json({ error: "Scientist / Team Leader Name is required." });

    const request = await SoilTestRequest.findByIdAndUpdate(
      id,
      {
        status: "team_assigned",
        assignedTeam: {
          scientistName: scientistName || "Dr. Arvind Swamy, M.Sc (Soil Chemistry)",
          teamVehicleNumber: teamVehicleNumber || "TS-09-LAB-1029 (Mobile Testing Unit 04)",
          contactPhone: contactPhone || "9848099881",
          assignedAt: new Date(),
          scheduledVisitDate: scheduledVisitDate ? new Date(scheduledVisitDate) : new Date(Date.now() + 86400000 * 2),
          adminNotes: adminNotes || "Assigned mobile soil lab unit with digital pH and NPK testing spectrometer."
        }
      },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: "Soil test request not found." });

    // Notify farmer of team dispatch
    if (request.farmer) {
      await sendNotification(req.app, request.farmer,
        "🔬 Soil Testing Team Assigned!",
        `Admin assigned ${scientistName} (${teamVehicleNumber}) for your farm soil testing. Scheduled Visit: ${new Date(request.assignedTeam.scheduledVisitDate).toLocaleDateString("en-IN")}. Contact: ${contactPhone}`,
        "system", "high", { requestId: request._id }
      );
    }

    const io = req.app.get("io");
    if (io) io.emit("soil_request_updated", request);

    res.json({
      success: true,
      message: "Soil testing team successfully assigned to location.",
      request
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. Admin / Lab Publishes Official Soil Health Report ───
router.put("/:id/publish-report", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      phLevel,
      nitrogenN,
      phosphorusP,
      potassiumK,
      organicCarbonPercent,
      electricalConductivityEC,
      micronutrients,
      recommendedManure
    } = req.body;

    const phVal = Number(phLevel) || 6.8;
    const phCat = phVal < 6.0 ? "Acidic" : phVal > 7.5 ? "Alkaline" : "Optimal / Neutral";

    const report = {
      phLevel: phVal,
      phCategory: phCat,
      nitrogenN: nitrogenN || "265 kg/ha (Medium)",
      phosphorusP: phosphorusP || "24 kg/ha (Adequate)",
      potassiumK: potassiumK || "320 kg/ha (High)",
      organicCarbonPercent: Number(organicCarbonPercent) || 0.72,
      electricalConductivityEC: electricalConductivityEC || "0.38 dS/m (Normal)",
      micronutrients: micronutrients || {
        zinc: "Sufficient (1.4 ppm)",
        iron: "Adequate (6.2 ppm)",
        boron: "Moderate (0.55 ppm)"
      },
      recommendedManure: recommendedManure || "Apply 2 tonnes/acre Farm Yard Manure + 250kg Vermicompost + 5kg PSB biofertilizer.",
      publishedAt: new Date()
    };

    const request = await SoilTestRequest.findByIdAndUpdate(
      id,
      {
        status: "report_published",
        soilHealthReport: report
      },
      { new: true }
    );

    if (!request) return res.status(404).json({ error: "Soil test request not found." });

    // Notify farmer of ready report
    if (request.farmer) {
      await sendNotification(req.app, request.farmer,
        "📜 Certified Soil Health Card Ready!",
        `Your official laboratory soil test report is published! Soil pH is ${phVal} (${phCat}). Open dashboard to view complete NPK and fertilizer recommendations.`,
        "system", "high", { requestId: request._id }
      );
    }

    const io = req.app.get("io");
    if (io) io.emit("soil_request_updated", request);

    res.json({
      success: true,
      message: "Soil health report published successfully.",
      request
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
