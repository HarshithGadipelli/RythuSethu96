import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Customer from "../models/Customer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const restoreDuniya = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rythu_sethu";
    await mongoose.connect(mongoUri);
    console.log("🟢 Connected to MongoDB:", mongoUri);

    const email = "duniya@gmail.com";
    let user = await User.findOne({ email });

    if (!user) {
      console.log("User Duniya not found. Restoring...");
      const passwordHash = await bcrypt.hash("password123", 10);
      user = await User.create({
        name: "Duniya",
        email: email,
        password: passwordHash,
        role: "customer",
        phone: "9999999999",
        location: "Hyderabad, Telangana",
        latitude: 17.385,
        longitude: 78.486,
        isVerified: true,
        verificationStatus: "verified",
        acceptedTerms: true
      });
      console.log("✅ User Duniya restored successfully.");
    } else {
      console.log("✅ User Duniya already exists.");
    }

    let customer = await Customer.findOne({ user: user._id });
    if (!customer) {
      await Customer.create({
        user: user._id,
        address: "Hyderabad, Telangana",
        latitude: 17.385,
        longitude: 78.486
      });
      console.log("✅ Customer profile for Duniya restored.");
    }

    console.log("\nDone! Duniya can log in using:");
    console.log("Email: duniya@gmail.com");
    console.log("Password: password123");

    process.exit(0);
  } catch (err) {
    console.error("Error restoring Duniya:", err);
    process.exit(1);
  }
};

restoreDuniya();
