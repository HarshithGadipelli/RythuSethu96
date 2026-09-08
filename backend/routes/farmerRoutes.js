import express from "express";
import mongoose from "mongoose";
import Crop from "../models/Crop.js";
import Farmer from "../models/Farmer.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Settlement from "../models/Settlement.js";
import Notification from "../models/Notification.js";
import { calculateTrustScore, getCachedTrustScore } from "../services/trustScoreService.js";
import { getTrustLeaderboard } from "../controllers/farmerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/leaderboard", getTrustLeaderboard);

// Get current farmer's profile
router.get("/profile", protect, async (req, res) => {
  try {
    let farmer = await Farmer.findOne({ user: req.user._id }).populate("user", "-password");
    if (!farmer) {
      // Create minimal farmer document if missing
      farmer = await Farmer.create({ user: req.user._id });
      farmer = await Farmer.findById(farmer._id).populate("user", "-password");
    }
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current farmer's crops
router.get("/my-crops", protect, async (req, res) => {
  try {
    const crops = await Crop.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Farmer 2-Week (14-Day) Bi-Weekly Settlement Ledger ───
router.get("/settlements", protect, async (req, res) => {
  try {
    const farmerUser = await User.findById(req.user._id);
    if (!farmerUser) return res.status(404).json({ error: "Farmer user not found." });

    // Compute 14-day bi-weekly settlement cycle
    const now = new Date();
    const epoch = new Date(2026, 0, 1);
    const diffDays = Math.floor((now - epoch) / (1000 * 60 * 60 * 24));
    const cycleIndex = Math.floor(diffDays / 14);
    const cycleStartDate = new Date(epoch.getTime() + cycleIndex * 14 * 24 * 60 * 60 * 1000);
    const cycleEndDate = new Date(cycleStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(1, Math.ceil((cycleEndDate - now) / (1000 * 60 * 60 * 24)));

    const pastSettlements = await Settlement.find({ recipient: req.user._id, recipientRole: "farmer" }).sort({ createdAt: -1 });

    const deliveredOrders = await Order.find({ farmer: req.user._id, status: "delivered" })
      .populate("crop", "name unit price image")
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      settlementCycleDays: 14,
      cycleType: "Bi-Weekly (2-Week Settlement)",
      currentCycleStart: cycleStartDate.toISOString(),
      currentCycleEnd: cycleEndDate.toISOString(),
      nextPayoutDate: cycleEndDate.toISOString(),
      daysRemainingInCycle: daysRemaining,
      pendingSettlementBalance: farmerUser.pendingSettlement || 0,
      bankAccount: farmerUser.bankAccountNumber || "",
      upiId: farmerUser.upiId || "",
      pastSettlements,
      deliveredOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get farmer by user ID
router.get("/:id", async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next();
  }
  try {
    const farmer = await Farmer.findOne({ user: req.params.id });
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get farmer's crops
router.get("/my-crops/:id", async (req, res) => {
  try {
    const crops = await Crop.find({ farmer: req.params.id });
    res.json(crops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get farmer's trust score (full calculation with breakdown)
router.get("/trust-score/:farmerId", async (req, res) => {
  try {
    const result = await calculateTrustScore(req.params.farmerId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cached trust score (fast, for listings)
router.get("/trust-score-cached/:farmerId", async (req, res) => {
  try {
    const result = await getCachedTrustScore(req.params.farmerId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch: get trust scores for multiple farmers
router.post("/trust-scores-batch", async (req, res) => {
  try {
    const { farmerIds } = req.body;
    if (!farmerIds || !Array.isArray(farmerIds)) {
      return res.status(400).json({ error: "farmerIds array required" });
    }

    const farmers = await Farmer.find({ user: { $in: farmerIds } });
    const scoreMap = {};
    
    const GRADES = [
      { min: 90, grade: "Platinum", emoji: "🏆", label: "Exceptional" },
      { min: 75, grade: "Gold",     emoji: "🥇", label: "Highly Trusted" },
      { min: 60, grade: "Silver",   emoji: "🥈", label: "Trusted" },
      { min: 40, grade: "Bronze",   emoji: "🥉", label: "Building Trust" },
      { min: 0,  grade: "New",      emoji: "🌱", label: "Getting Started" },
    ];

    for (const f of farmers) {
      const score = f.trustScore || 0;
      const gradeInfo = GRADES.find(g => score >= g.min) || GRADES[GRADES.length - 1];
      scoreMap[f.user.toString()] = {
        score,
        grade: gradeInfo.grade,
        emoji: gradeInfo.emoji,
        label: gradeInfo.label
      };
    }

    for (const id of farmerIds) {
      if (!scoreMap[id]) {
        scoreMap[id] = { score: 0, grade: "New", emoji: "🌱", label: "Getting Started" };
      }
    }

    res.json(scoreMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book a physical farm visit with Escrow Payment
router.post("/visit/:farmerId", async (req, res) => {
  try {
    const { customerId, customerName, requestedDate, notes, amount } = req.body;

    const tourPrice = Number(amount) || 0;
    let farmerEscrow = 0;

    if (tourPrice > 0 && customerId) {
      const customer = await User.findById(customerId);
      const farmerUser = await User.findById(req.params.farmerId);
      const admins = await User.find({ role: "admin" });
      const admin = admins.length > 0 ? admins[0] : null;

      if (!customer || !farmerUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (customer.walletBalance < tourPrice) {
        return res.status(400).json({ error: "Insufficient wallet balance to book the tour." });
      }

      // 15% to admin, 85% to farmer escrow
      const adminFee = Math.round(tourPrice * 0.15);
      farmerEscrow = tourPrice - adminFee;

      customer.walletBalance -= tourPrice;
      await customer.save();

      if (admin) {
        admin.walletBalance = (admin.walletBalance || 0) + adminFee;
        await admin.save();
      }

      farmerUser.escrowBalance = (farmerUser.escrowBalance || 0) + farmerEscrow;
      await farmerUser.save();
    }
    
    const notif = await Notification.create({
      user: req.params.farmerId,
      title: "🗓️ Farm Visit Booked & Escrow Paid",
      message: `Customer ${customerName || "A customer"} booked a physical visit on ${requestedDate || "soon"}. ₹${farmerEscrow} has been securely held in your Escrow account until the visit. Notes: ${notes || "None"}`,
      type: "system",
      priority: "high",
      metadata: { customerId, requestedDate, notes, amount: tourPrice }
    });

    const io = req.app.get("io");
    if (io) io.emit("notification", notif);

    res.json({ message: "Visit booked and payment securely held in escrow!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── VERMI COMPOST ───
router.post("/vermi-compost/request", protect, async (req, res) => {
  try {
    const { requestedKg, totalCost } = req.body;
    if (!requestedKg || requestedKg <= 0 || !totalCost) return res.status(400).json({ error: "Invalid request data" });

    const VermiCompostRequest = (await import("../models/VermiCompostRequest.js")).default;
    const newRequest = await VermiCompostRequest.create({
      farmer: req.user._id,
      requestedKg,
      totalCost
    });

    res.status(201).json({ success: true, message: "Request submitted successfully", request: newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/vermi-compost/requests", protect, async (req, res) => {
  try {
    const VermiCompostRequest = (await import("../models/VermiCompostRequest.js")).default;
    const requests = await VermiCompostRequest.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
