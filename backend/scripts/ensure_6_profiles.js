import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Agent from "../models/Agent.js";
import Farmer from "../models/Farmer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const ensureSixProfiles = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rythu_sethu";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const hash = await bcrypt.hash("password123", 10);

    const profiles = [
      {
        email: "farmer@test.com",
        name: "Srinivas Reddy",
        role: "farmer",
        location: "Warangal, Telangana",
        latitude: 17.9784,
        longitude: 79.6003,
        trustScore: 95
      },
      {
        email: "ram@test.com",
        name: "Ram Sharma",
        role: "farmer",
        location: "Nalgonda, Telangana",
        latitude: 17.0575,
        longitude: 79.2684,
        trustScore: 92
      },
      {
        email: "customer@test.com",
        name: "Anand Verma",
        role: "customer",
        location: "Hyderabad, Telangana",
        latitude: 17.3850,
        longitude: 78.4867,
        trustScore: 88
      },
      {
        email: "agent@test.com",
        name: "Raju Delivery",
        role: "agent",
        location: "Khammam, Telangana",
        latitude: 17.2473,
        longitude: 80.1514,
        trustScore: 90
      },
      {
        email: "admin@test.com",
        name: "APMC Administrator",
        role: "admin",
        location: "Hyderabad, Telangana",
        latitude: 17.3850,
        longitude: 78.4867,
        trustScore: 99
      },
      {
        email: "raj@test.com",
        name: "Rajesh Kumar (Raj)",
        role: "admin",
        location: "Hyderabad, Telangana",
        latitude: 17.4065,
        longitude: 78.4772,
        trustScore: 96
      }
    ];

    for (const p of profiles) {
      let u = await User.findOne({ email: p.email });
      if (!u) {
        u = await User.create({
          name: p.name,
          email: p.email,
          password: hash,
          role: p.role,
          phone: "9876543210",
          location: p.location,
          latitude: p.latitude,
          longitude: p.longitude,
          isVerified: true,
          verificationStatus: "verified",
          acceptedTerms: true,
          trustScore: p.trustScore,
          rewardPoints: 150
        });
        console.log(`Created user: ${p.name} (${p.email})`);
      } else {
        u.password = hash;
        u.isVerified = true;
        u.verificationStatus = "verified";
        u.acceptedTerms = true;
        await u.save();
        console.log(`Updated user password & verified: ${p.name} (${p.email})`);
      }

      if (p.role === "customer") {
        let cust = await Customer.findOne({ user: u._id });
        if (!cust) {
          await Customer.create({
            user: u._id,
            address: p.location,
            city: "Hyderabad",
            state: "Telangana",
            latitude: p.latitude,
            longitude: p.longitude
          });
        }
      } else if (p.role === "agent") {
        let ag = await Agent.findOne({ user: u._id });
        if (!ag) {
          await Agent.create({
            user: u._id,
            vehicleType: "bike",
            isAvailable: true,
            activeHub: "APMC Central Hub",
            assignedPincodes: ["500001", "500002"]
          });
        }
      } else if (p.role === "farmer") {
        let f = await Farmer.findOne({ user: u._id });
        if (!f) {
          await Farmer.create({
            user: u._id,
            farmName: `${p.name}'s Organic Farm`,
            farmLocation: p.location,
            latitude: p.latitude,
            longitude: p.longitude,
            farmSize: 5,
            soilType: "loamy",
            experience: 12
          });
        }
      }
    }

    console.log("All 6 test profiles verified and seeded successfully in MongoDB!");
    process.exit(0);
  } catch (err) {
    console.error("Error ensuring profiles:", err);
    process.exit(1);
  }
};

ensureSixProfiles();
