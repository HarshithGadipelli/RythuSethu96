import mongoose from "mongoose";
import fetch from "node-fetch";

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
    console.log("Connected to MongoDB.");

    const crops = await Crop.find({
      $or: [
        { latitude: { $exists: false } },
        { latitude: null },
        { longitude: { $exists: false } },
        { longitude: null }
      ]
    });

    console.log(`Found ${crops.length} crops missing coordinates.`);

    for (const crop of crops) {
      const address = crop.location || crop.farmLocation;
      if (address) {
        const coords = await geocode(address);
        if (coords) {
          crop.latitude = coords.lat;
          crop.longitude = coords.lng;
          await crop.save();
          console.log(`Updated crop ${crop._id} (${address}) to lat: ${coords.lat}, lng: ${coords.lng}`);
        } else {
          console.log(`Could not geocode ${address}`);
        }
        // Sleep to respect Nominatim limits (1 req/sec)
        await new Promise(r => setTimeout(r, 1100));
      }
    }

    console.log("Finished updating crops.");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fixCrops();
