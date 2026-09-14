import fs from "fs";
import Crop from "../models/Crop.js";
import User from "../models/User.js";
import Farmer from "../models/Farmer.js";

export const addCrop = async (req, res) => {
  try {
    // Check if farmer is verified
    const farmerId = req.body.farmer;
    if (farmerId) {
      const farmer = await User.findById(farmerId);
      if (farmer && farmer.role === "farmer" && !farmer.isVerified) {
        return res.status(403).json({ 
          error: "Your account is pending verification. Only verified farmers can list crops on the marketplace. Please wait for admin approval." 
        });
      }
    }

    const cropData = { ...req.body };
    if (!cropData.farmer && req.user) {
      cropData.farmer = req.user._id;
    }
    
    // Parse price range if provided
    if (cropData.priceRangeMin !== undefined) {
      cropData.priceRange = {
        min: Number(cropData.priceRangeMin),
        max: Number(cropData.priceRangeMax)
      };
      delete cropData.priceRangeMin;
      delete cropData.priceRangeMax;
    }

    // Anti-Overpricing Logic:
    // Restrict extreme prices unless the crop is officially certified organic.
    const priceToCheck = cropData.price || (cropData.priceRange ? cropData.priceRange.max : 0);
    if (priceToCheck > 250) {
      // If price is very high, check certification
      const isCertified = 
        (cropData.certificationStatus === "approved") || 
        (cropData.organicVerification && cropData.organicVerification.status === "certified_genuine");
        
      if (!isCertified) {
        return res.status(400).json({
          error: `Anti-Overpricing Alert: You cannot list a crop at ₹${priceToCheck}/kg without an approved Organic Certification. Please get certified first to unlock premium pricing.`
        });
      }
    }

    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        cropData.image = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
      } catch (err) {
        cropData.image = `/uploads/${req.file.filename}`;
      }
    } else if (!cropData.image || cropData.image.trim() === "") {
      const clean = ((cropData.name || "") + " " + (cropData.category || "")).toLowerCase();
      if (clean.includes("rice") || clean.includes("sona") || clean.includes("bpt") || clean.includes("paddy")) {
        cropData.image = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("wheat") || clean.includes("gehu") || clean.includes("godhuma")) {
        cropData.image = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("corn") || clean.includes("maize") || clean.includes("makka")) {
        cropData.image = "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("millet") || clean.includes("korralu") || clean.includes("ragi") || clean.includes("jowar") || clean.includes("bajra")) {
        cropData.image = "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("toor") || clean.includes("kandi") || clean.includes("arhar") || clean.includes("dal")) {
        cropData.image = "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("moong") || clean.includes("pesalu")) {
        cropData.image = "https://images.unsplash.com/photo-1515543904379-3d757abe9981?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("chana") || clean.includes("chickpea") || clean.includes("senagalu")) {
        cropData.image = "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("groundnut") || clean.includes("peanut") || clean.includes("palli")) {
        cropData.image = "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("onion") || clean.includes("ullipaya")) {
        cropData.image = "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("tomato") || clean.includes("tamota")) {
        cropData.image = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("potato") || clean.includes("aalu")) {
        cropData.image = "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("spinach") || clean.includes("palak")) {
        cropData.image = "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("brinjal") || clean.includes("eggplant") || clean.includes("vankaya")) {
        cropData.image = "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("bhindi") || clean.includes("ladyfinger") || clean.includes("okra") || clean.includes("bendakaya")) {
        cropData.image = "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("cabbage")) {
        cropData.image = "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("cauliflower")) {
        cropData.image = "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("turmeric") || clean.includes("pasupu") || clean.includes("haldi")) {
        cropData.image = "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("chilli") || clean.includes("mirchi")) {
        cropData.image = "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("soya") || clean.includes("soybean")) {
        cropData.image = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("carrot") || clean.includes("gajar")) {
        cropData.image = "https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("mango") || clean.includes("mamidi")) {
        cropData.image = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("banana") || clean.includes("arati")) {
        cropData.image = "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("pomegranate") || clean.includes("danimma") || clean.includes("anar")) {
        cropData.image = "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("ghee") || clean.includes("neyi")) {
        cropData.image = "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("honey") || clean.includes("thene")) {
        cropData.image = "https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("jaggery") || clean.includes("bellam")) {
        cropData.image = "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("oil") || clean.includes("nune")) {
        cropData.image = "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("cotton") || clean.includes("patti")) {
        cropData.image = "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80";
      } else if (clean.includes("sugarcane") || clean.includes("cheruku")) {
        cropData.image = "https://images.unsplash.com/photo-1596753392437-05c8733230c1?w=600&auto=format&fit=crop&q=80";
      } else if (cropData.category === "fruit") {
        cropData.image = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80";
      } else if (cropData.category === "grain") {
        cropData.image = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80";
      } else if (cropData.category === "pulse") {
        cropData.image = "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80";
      } else if (cropData.category === "spice") {
        cropData.image = "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80";
      } else if (cropData.category === "vegetable") {
        cropData.image = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80";
      } else {
        cropData.image = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80";
      }
    }
    
    // Parse booleans from FormData
    if (cropData.isPrebooking === 'true' || cropData.isPrebooking === true) cropData.isPrebooking = true;
    else cropData.isPrebooking = false;

    if (cropData.isOrganic === 'true' || cropData.isOrganic === true) cropData.isOrganic = true;
    else cropData.isOrganic = false;

    if (cropData.isPesticideFree === 'true' || cropData.isPesticideFree === true) cropData.isPesticideFree = true;
    else cropData.isPesticideFree = false;

    // Handle exact location & coordinates:
    let lat = cropData.latitude !== undefined && cropData.latitude !== null && cropData.latitude !== "" ? parseFloat(cropData.latitude) : null;
    let lng = cropData.longitude !== undefined && cropData.longitude !== null && cropData.longitude !== "" ? parseFloat(cropData.longitude) : null;

    const addr = (cropData.farmLocation || cropData.location || "").trim();

    // If explicit coordinates weren't sent, but an address was typed, try geocoding
    if ((lat === null || lng === null || isNaN(lat) || isNaN(lng)) && addr.length > 3) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`;
        const r = await fetch(url, { headers: { "User-Agent": "RythuSethuApp/1.0" } });
        const data = await r.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        }
      } catch (e) {
        console.error("Geocoding failed during crop creation:", e.message);
      }
    }

    // If still no coordinates, inherit from farmer user profile
    if ((lat === null || lng === null || isNaN(lat) || isNaN(lng)) && cropData.farmer) {
      try {
        const farmerUser = await User.findById(cropData.farmer);
        if (farmerUser) {
          if (farmerUser.latitude && farmerUser.longitude) {
            lat = parseFloat(farmerUser.latitude);
            lng = parseFloat(farmerUser.longitude);
          }
          if (!cropData.location && farmerUser.location) {
            cropData.location = farmerUser.location;
          }
          if (!cropData.farmLocation) {
            cropData.farmLocation = farmerUser.farmName || farmerUser.location || "";
          }
        }
      } catch (e) {
        console.error("Farmer profile coordinates inheritance error:", e.message);
      }
    }

    if (lat !== null && !isNaN(lat)) cropData.latitude = lat;
    else delete cropData.latitude;

    if (lng !== null && !isNaN(lng)) cropData.longitude = lng;
    else delete cropData.longitude;

    if (!cropData.farmLocation && cropData.location) cropData.farmLocation = cropData.location;
    if (!cropData.location && cropData.farmLocation) cropData.location = cropData.farmLocation;

    const crop = await Crop.create(cropData);
    
    // Emit real-time event
    const io = req.app?.get?.("io");
    if (io) io.emit("crop_added", crop);
    
    res.json(crop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyCrops = async (req, res) => {
  const crops = await Crop.find({ farmer: req.user._id });
  res.json(crops);
};

export const getTrustLeaderboard = async (req, res) => {
  try {
    const topFarmers = await Farmer.find()
      .sort({ trustScore: -1 })
      .limit(10)
      .populate("user", "name location phone");
    res.json(topFarmers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
