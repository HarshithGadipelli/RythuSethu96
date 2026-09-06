import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Crop from "../models/Crop.js";

async function ensureRamRaj() {
  await connectDB();
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Ensure Ram (Farmer)
  let ram = await User.findOne({ email: "ram@test.com" });
  if (!ram) {
    ram = await User.create({
      name: "Ram Sharma",
      email: "ram@test.com",
      phone: "9876543210",
      password: hashedPassword,
      role: "farmer",
      location: "Medak, Telangana",
      latitude: 18.0478,
      longitude: 78.2612,
      isVerified: true,
      trustScore: 98,
      rewardPoints: 350,
      walletBalance: 4500,
      avatar: "http://localhost:5000/uploads/ai_farmer_1.jpg",
      farmerProfile: {
        farmName: "Shri Ram Natural Vedic Farms",
        farmLocation: "Medak Mandal, Telangana",
        farmSize: "6.5",
        soilType: "Red Sandy Loam",
        experience: "14",
        trustGrade: "Platinum",
        farmerPhoto: "http://localhost:5000/uploads/ai_farmer_1.jpg",
        farmPhoto: "http://localhost:5000/uploads/ai_farm_1.jpg"
      }
    });
    console.log("✅ Seeded Ram Sharma (Farmer)");
  } else {
    ram.farmerProfile = {
      farmName: "Shri Ram Natural Vedic Farms",
      farmLocation: "Medak Mandal, Telangana",
      farmSize: "6.5",
      soilType: "Red Sandy Loam",
      experience: "14",
      trustGrade: "Platinum",
      farmerPhoto: "http://localhost:5000/uploads/ai_farmer_1.jpg",
      farmPhoto: "http://localhost:5000/uploads/ai_farm_1.jpg"
    };
    ram.isVerified = true;
    await ram.save();
    console.log("✅ Updated Ram Sharma (Farmer)");
  }

  // Ensure Ram has crops
  const ramCropsCount = await Crop.countDocuments({ farmer: ram._id });
  if (ramCropsCount === 0) {
    await Crop.create([
      {
        name: "Organic Telangana Sona Rice (RNR 15048)",
        category: "grain",
        price: 65,
        quantity: 1200,
        unit: "kg",
        farmer: ram._id,
        isOrganic: true,
        isPesticideFree: true,
        image: "http://localhost:5000/uploads/ai_rice.jpg",
        location: "Medak, Telangana",
        description: "Low glycemic index diabetic-friendly aromatic slender grain rice, grown using natural Jeevamrutham.",
        shelfLife: "12 months",
        harvestDate: new Date(),
        nutritionalHighlights: "High zinc and protein, 51.5 GI score"
      },
      {
        name: "Desi Country Tomatoes (Naatu)",
        category: "vegetable",
        price: 32,
        quantity: 450,
        unit: "kg",
        farmer: ram._id,
        isOrganic: true,
        isPesticideFree: true,
        image: "http://localhost:5000/uploads/ai_tomato.jpg",
        location: "Medak, Telangana",
        description: "Naturally tangy desi country tomatoes, freshly hand-plucked from sun-ripened vines.",
        shelfLife: "7 days",
        harvestDate: new Date()
      },
      {
        name: "Fresh Palak Baby Spinach",
        category: "vegetable",
        price: 24,
        quantity: 180,
        unit: "kg",
        farmer: ram._id,
        isOrganic: true,
        isPesticideFree: true,
        image: "http://localhost:5000/uploads/ai_spinach.jpg",
        location: "Medak, Telangana",
        description: "Iron-rich, tender leafy greens cultivated chemical-free with organic vermicompost.",
        shelfLife: "4 days",
        harvestDate: new Date()
      }
    ]);
    console.log("✅ Added Ram's Crops");
  }

  // Ensure Raj (Admin & Customer)
  let raj = await User.findOne({ email: "raj@test.com" });
  if (!raj) {
    raj = await User.create({
      name: "Rajesh Kumar (Raj)",
      email: "raj@test.com",
      phone: "9123456780",
      password: hashedPassword,
      role: "admin",
      location: "Road No 36, Jubilee Hills, Hyderabad",
      latitude: 17.4319,
      longitude: 78.4073,
      isVerified: true,
      trustScore: 99,
      rewardPoints: 850,
      walletBalance: 8200,
      customerProfile: {
        address: "Villa 12, Jubilee Hills Road No 36, Hyderabad",
        customerType: "premium",
        requiresDailyDelivery: true
      }
    });
    console.log("✅ Seeded Rajesh Kumar (Raj - Admin & Customer)");
  } else {
    raj.role = "admin";
    raj.customerProfile = {
      address: "Villa 12, Jubilee Hills Road No 36, Hyderabad",
      customerType: "premium",
      requiresDailyDelivery: true
    };
    await raj.save();
    console.log("✅ Updated Rajesh Kumar (Raj)");
  }

  console.log("🎉 Ram & Raj Verified!");
  process.exit(0);
}

ensureRamRaj();
