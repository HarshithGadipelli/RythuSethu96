import express from "express";
import mongoose from "mongoose";
import Group from "../models/Group.js";
import Crop from "../models/Crop.js";
import User from "../models/User.js";

const router = express.Router();

// Get active groups for a specific crop
router.get("/crop/:cropId", async (req, res) => {
  try {
    const cropId = req.params.cropId;
    let query = { status: "open" };
    if (cropId !== "all") query.crop = cropId;
    
    const groups = await Group.find(query)
      .populate("members.user", "name role")
      .populate("crop", "name price unit image category");

    // Filter out orphaned groups with deleted/null crops
    const validGroups = groups.filter(g => g.crop != null);
    res.json(validGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new group / bulk pool
router.post("/create", async (req, res) => {
  try {
    let { name, type, cropId, targetQuantity, userId, quantity, poolId, region } = req.body;
    
    // Fallback/resolve user ID if missing or invalid
    if (!userId || userId === "guest" || !mongoose.Types.ObjectId.isValid(userId)) {
      const fallbackUser = await User.findOne({ role: "customer" }) || await User.findOne();
      userId = fallbackUser ? fallbackUser._id : new mongoose.Types.ObjectId();
    }

    // Fallback/resolve crop ID if missing or invalid
    if (!cropId || !mongoose.Types.ObjectId.isValid(cropId)) {
      const fallbackCrop = await Crop.findOne({ isAvailable: true }) || await Crop.findOne();
      if (fallbackCrop) {
        cropId = fallbackCrop._id;
      } else {
        return res.status(400).json({ error: "A valid crop is required to create a pool" });
      }
    }

    const tQty = Math.max(1, Number(targetQuantity) || 50);
    const initQty = Math.max(1, Math.min(Number(quantity) || 5, tQty));

    // Auto calculate discount for customer buy groups based on target size
    let discountPercent = 0;
    let tiers = [];
    if (type === "customer_buy" || !type) {
      type = "customer_buy";
      tiers = [
        { qty: Math.max(1, Math.floor(tQty * 0.25)), discount: 5 },
        { qty: Math.max(2, Math.floor(tQty * 0.5)), discount: 10 },
        { qty: tQty, discount: 15 }
      ];
      if (tQty >= 100) discountPercent = 15;
      else if (tQty >= 50) discountPercent = 10;
      else if (tQty >= 20) discountPercent = 5;
    }

    const generatedPoolId = poolId || ("POOL-" + Math.random().toString(36).substring(2, 7).toUpperCase());

    const group = new Group({
      name: name || `Community Bulk Pool (${generatedPoolId})`,
      type,
      crop: cropId,
      targetQuantity: tQty,
      currentQuantity: initQty,
      members: [{ user: userId, quantity: initQty }],
      discountPercent,
      poolId: generatedPoolId,
      region: region || "Local Community Hub",
      tiers
    });

    await group.save();
    await group.populate("crop", "name price unit image category");
    await group.populate("members.user", "name role");

    res.status(201).json(group);
  } catch (error) {
    console.error("Group create error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Join an existing group
router.post("/join/:groupId", async (req, res) => {
  try {
    let { userId, quantity } = req.body;
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.status !== "open") return res.status(400).json({ error: "Group is closed" });

    if (!userId || userId === "guest" || !mongoose.Types.ObjectId.isValid(userId)) {
      const fallbackUser = await User.findOne({ role: "customer" }) || await User.findOne();
      userId = fallbackUser ? fallbackUser._id : new mongoose.Types.ObjectId();
    }

    const pledgeQty = Math.max(1, Number(quantity) || 1);

    // Check if user is already a member
    const existingMember = group.members.find(m => m.user && m.user.toString() === userId.toString());
    if (existingMember) {
      existingMember.quantity += pledgeQty;
    } else {
      group.members.push({ user: userId, quantity: pledgeQty });
    }

    group.currentQuantity += pledgeQty;

    if (group.currentQuantity >= group.targetQuantity) {
      group.status = "completed"; // Reached the target
    }

    await group.save();
    await group.populate("crop", "name price unit image category");
    await group.populate("members.user", "name role");
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join an existing group by its ID passed in the body
router.post("/join-by-id", async (req, res) => {
  try {
    let { poolId, userId, quantity } = req.body;
    const group = await Group.findOne({ poolId: poolId.trim().toUpperCase() });
    if (!group) return res.status(404).json({ error: "Group pool not found with that code" });
    if (group.status !== "open") return res.status(400).json({ error: "Group pool is already closed" });

    if (!userId || userId === "guest" || !mongoose.Types.ObjectId.isValid(userId)) {
      const fallbackUser = await User.findOne({ role: "customer" }) || await User.findOne();
      userId = fallbackUser ? fallbackUser._id : new mongoose.Types.ObjectId();
    }

    const pledgeQty = Math.max(1, Number(quantity) || 1);

    const existingMember = group.members.find(m => m.user && m.user.toString() === userId.toString());
    if (existingMember) {
      existingMember.quantity += pledgeQty;
    } else {
      group.members.push({ user: userId, quantity: pledgeQty });
    }

    group.currentQuantity += pledgeQty;
    if (group.currentQuantity >= group.targetQuantity) {
      group.status = "completed"; 
    }

    await group.save();
    await group.populate("crop", "name price unit image category");
    await group.populate("members.user", "name role");
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
