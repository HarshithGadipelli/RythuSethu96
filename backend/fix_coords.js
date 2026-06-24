import mongoose from "mongoose";

// The script assumes MongoDB runs locally or on the env string
const MONGO_URI = "mongodb://127.0.0.1:27017/rythu_sethu";

// We don't want to import the whole app, just minimal Crop model
const cropSchema = new mongoose.Schema({
  location: String,
  farmLocation: String,
  latitude: Number,
  longitude: Number,
}, { strict: false });
const Crop = mongoose.model("Crop", cropSchema);

async function geocode(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    console.log("Geocoding:", address);
    const res = await fetch(url, { headers: { "User-Agent": "RythuSethuApp/1.0" } });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error("Geocode error for", address, err.message);
  }
  return null;
}

async function fixCrops() {
  try {
    await mongoose.connect(MONGO_URI);
    const allCrops = await Crop.find({}, 'name location farmLocation latitude longitude');
    console.log("All crops:");
    allCrops.forEach(c => console.log(`- ${c.name}: loc=${c.location}, farmLoc=${c.farmLocation}, lat=${c.latitude}, lng=${c.longitude}`));
    
    console.log("Finished querying crops.");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fixCrops();
