import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../models/User.js';
import Crop from '../models/Crop.js';

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rythu_sethu";

async function fixTourData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB.");

    // Fix Farmers
    const farmers = await User.find({ role: 'farmer' });
    let fCount = 0;
    for (const f of farmers) {
      let updated = false;
      if (!f.location) {
        f.location = "Hyderabad, Telangana";
        f.latitude = 17.3850;
        f.longitude = 78.4867;
        updated = true;
      }
      if (f.farmTourEnabled === undefined) {
        f.farmTourEnabled = true;
        f.farmTourPrice = 100;
        f.farmTourDetails = "Welcome to our organic farm. We offer a guided tour of our fields and cattle.";
        f.farmTourVerified = true;
        updated = true;
      }
      if (updated) {
        await f.save();
        fCount++;
      }
    }
    console.log(`Updated ${fCount} farmers with valid location/tour data.`);

    // Fix Crops (for virtual tours)
    const crops = await Crop.find({});
    let cCount = 0;
    for (const c of crops) {
      let updated = false;
      if (!c.location && !c.farmLocation) {
        c.location = "Hyderabad, Telangana";
        updated = true;
      }
      if (!c.farmTourVideo) {
        // Mock a tour video from public assets (assuming one exists, else just text)
        // c.farmTourVideo = "/uploads/mock_tour.mp4"; 
        // We'll leave it empty unless they explicitly wanted it, or we can use a sample youtube link for virtual tours
        c.farmTourUrl = "https://www.youtube.com/embed/N-Zg_6z1yK0"; 
        updated = true;
      }
      if (updated) {
        await c.save();
        cCount++;
      }
    }
    console.log(`Updated ${cCount} crops with valid tour/location data.`);

    console.log("Fix completed successfully.");
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

fixTourData();
