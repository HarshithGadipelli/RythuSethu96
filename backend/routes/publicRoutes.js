import express from "express";
import User from "../models/User.js";
import Crop from "../models/Crop.js";
import Order from "../models/Order.js";
import GlobalConfig from "../models/GlobalConfig.js";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const farmersCount = await User.countDocuments({ role: "farmer" });
    const customersCount = await User.countDocuments({ role: "customer" });
    const ordersCount = await Order.countDocuments({ status: "delivered" });
    
    // Sum total revenue
    const revenueAgg = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.json({
      farmers: farmersCount,
      customers: customersCount,
      orders: ordersCount,
      revenue: totalRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── FESTIVAL CONFIG ──
router.get("/festival", async (req, res) => {
  try {
    let config = await GlobalConfig.findOne();
    if (!config) config = { isFestivalActive: false, discountPercentage: 10, festivalMessage: "" };
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Delivery Agents for Map
router.get("/agents", async (req, res) => {
  try {
    // Fetch delivery agents who have valid coordinates
    const agents = await User.find({ 
      role: "delivery", 
      latitude: { $exists: true, $ne: null }, 
      longitude: { $exists: true, $ne: null } 
    }).select("name latitude longitude isVerified");
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SYSTEM TERMS & GLOBAL COMPLIANCE RULES ──
router.get("/system-terms", async (req, res) => {
  try {
    let config = await GlobalConfig.findOne();
    if (!config) config = await GlobalConfig.create({});
    res.json({
      systemTermsVersion: config.systemTermsVersion || 1,
      systemTermsTitle: config.systemTermsTitle || "RythuJanaSethu Mandatory System Rules & Operating Terms",
      systemTermsContent: config.systemTermsContent || "By accessing and continuing to use RythuJanaSethu, all users (Farmers, Agents, Customers, and Administrators) agree to comply with platform quality standards, zero-abandonment rules, verified doorstep delivery protocols, and fair trade practices.",
      systemTermsUpdatedAt: config.systemTermsUpdatedAt || new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
