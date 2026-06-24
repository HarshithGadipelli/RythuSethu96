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
    if (req.file) {
      cropData.image = `/uploads/${req.file.filename}`;
    }
    
    // Parse booleans from FormData
    if (cropData.isPrebooking === 'true' || cropData.isPrebooking === true) cropData.isPrebooking = true;
    else cropData.isPrebooking = false;

    if (cropData.isOrganic === 'true' || cropData.isOrganic === true) cropData.isOrganic = true;
    else cropData.isOrganic = false;

    if (cropData.isPesticideFree === 'true' || cropData.isPesticideFree === true) cropData.isPesticideFree = true;
    else cropData.isPesticideFree = false;

    // Backend geocoding fallback if frontend didn't send coordinates, OR if farmer typed a custom location
    // We prioritize the typed text `farmLocation` over the device's GPS if the text explicitly doesn't match
    const addr = cropData.location || cropData.farmLocation;
    
    // If a manual address was typed, ALWAYS try to geocode it instead of just trusting the browser's GPS
    // Because a farmer might be in Hyderabad but typing "Jagtial" to list their farm's crop.
    if (addr && addr.trim().length > 3) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}`;
        const r = await fetch(url, { headers: { "User-Agent": "RythuSethuApp/1.0" } });
        const data = await r.json();
        if (data && data.length > 0) {
          // Overwrite any device GPS with the actual geocoded location they typed
          cropData.latitude = parseFloat(data[0].lat);
          cropData.longitude = parseFloat(data[0].lon);
        }
      } catch (e) {
        console.error("Geocoding failed during crop creation:", e.message);
      }
    } else if (!cropData.latitude || cropData.latitude === "" || cropData.latitude === "null" ||
               !cropData.longitude || cropData.longitude === "" || cropData.longitude === "null") {
      // If no address was typed AND no coordinates were sent, we'll try to let mongoose handle it (will be null)
    }

    // Cleanup empty strings to prevent Mongoose CastError
    if (cropData.latitude === "" || cropData.latitude === "null" || isNaN(cropData.latitude)) delete cropData.latitude;
    if (cropData.longitude === "" || cropData.longitude === "null" || isNaN(cropData.longitude)) delete cropData.longitude;

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