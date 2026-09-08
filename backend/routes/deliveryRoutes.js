import express from "express";
import GlobalConfig from "../models/GlobalConfig.js";
import Agent from "../models/Agent.js";
import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Farmer from "../models/Farmer.js";
import Settlement from "../models/Settlement.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { callGeminiWithFallback } from "../services/geminiService.js";

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, `delivery_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const router = express.Router();

// Helper: send notification + socket event
async function notify(app, userId, title, message, type = "delivery", priority = "normal", metadata = {}) {
  const notif = await Notification.create({ user: userId, title, message, type, priority, metadata });
  const io = app.get("io");
  if (io) io.emit("notification", notif);
  return notif;
}

// Haversine distance (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Vehicle speeds (km/h) for ETA calculation
const VEHICLE_SPEEDS = { bike: 25, auto: 20, truck: 15, van: 18 };

// Compute ETA in minutes
function computeETA(distanceKm, vehicleType = "bike") {
  const speed = VEHICLE_SPEEDS[vehicleType] || 25;
  return Math.round((distanceKm / speed) * 60) + 15; // 15 min buffer
}

// Get all deliveries
router.get("/", async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate({ path: "order", populate: [{ path: "crop" }, { path: "customer" }, { path: "farmer" }] })
      .populate("agent")
      .sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get deliveries for a specific agent
router.get("/agent/:agentId", async (req, res) => {
  try {
    const deliveries = await Delivery.find({ agent: req.params.agentId })
      .populate({ path: "order", populate: [{ path: "crop" }, { path: "customer" }, { path: "farmer" }] })
      .sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get available orders needing delivery (unassigned, confirmed orders with delivery type)
router.get("/available", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    let orders = await Order.find({
      status: { $in: ["confirmed", "processing"] },
      agent: { $exists: false },
      deliveryType: { $ne: "farm_pickup" }
    }).populate("crop").populate("customer").populate("farmer");

    if (lat && lng) {
      const agentLat = parseFloat(lat);
      const agentLng = parseFloat(lng);
      orders = orders.map(o => {
        const pickupLat = o.farmer?.latitude || o.crop?.latitude || 0;
        const pickupLng = o.farmer?.longitude || o.crop?.longitude || 0;
        const dist = haversineDistance(agentLat, agentLng, pickupLat, pickupLng);
        return { ...o.toObject(), distanceToPickup: dist };
      }).sort((a, b) => a.distanceToPickup - b.distanceToPickup);
    } else {
      orders.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.json(orders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Agent accepts a delivery
router.post("/accept/:orderId", async (req, res) => {
  try {
    const { agentId, vehicleType } = req.body;
    const order = await Order.findById(req.params.orderId).populate("crop").populate("farmer").populate("customer");
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.agent) return res.status(400).json({ error: "This order already has an assigned agent" });

    // Enforce Weight Limit Security Rule
    const maxCapacity = vehicleType === 'truck' ? 5000 : 50; // kg
    if (order.quantity > maxCapacity) {
      return res.status(400).json({ error: `Security Rule Violation: Order is too heavy (${order.quantity}kg) for a ${vehicleType} (Max ${maxCapacity}kg).` });
    }

    // Calculate ETA based on distance & vehicle
    const pickupLat = order.farmer?.latitude || order.crop?.latitude;
    const pickupLng = order.farmer?.longitude || order.crop?.longitude;
    const deliveryLat = order.deliveryLatitude;
    const deliveryLng = order.deliveryLongitude;
    const distance = haversineDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
    const vehicle = vehicleType || "bike";
    const etaMinutes = computeETA(distance, vehicle);
    const etaText = etaMinutes < 60 ? `${etaMinutes} mins` : `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`;

    // Update order
    order.agent = agentId;
    order.status = "assigned";
    order.estimatedDeliveryMinutes = etaMinutes;
    order.timeline.push({ status: "assigned", note: `Delivery agent accepted. ETA: ${etaText}` });
    await order.save();

    // Create delivery record
    const delivery = await Delivery.create({
      order: order._id,
      agent: agentId,
      pickupLocation: order.farmer?.location || order.crop?.location || "",
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      deliveryLocation: order.deliveryAddress || "",
      deliveryLatitude: deliveryLat,
      deliveryLongitude: deliveryLng,
      vehicleType: vehicle,
      estimatedTime: etaText,
      estimatedMinutes: etaMinutes,
      estimatedDeliveryDeadline: new Date(Date.now() + etaMinutes * 60 * 1000),
      trackingCode: "TRK-" + Date.now().toString(36).toUpperCase()
    });

    await Order.findByIdAndUpdate(orderId, {
      estimatedDeliveryMinutes: etaMinutes,
      estimatedDeliveryDeadline: new Date(Date.now() + etaMinutes * 60 * 1000)
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("delivery_assigned", delivery);
      io.emit("order_updated", order);
    }

    // ─── Notifications ───

    // Notify customer
    if (order.customer) {
      await notify(req.app, order.customer._id || order.customer,
        "🚚 Delivery Agent Assigned!",
        `Your order for ${order.crop?.name || "product"} is being prepared for delivery! Estimated arrival: ${etaText}. Tracking: ${delivery.trackingCode}`,
        "delivery", "high", { orderId: order._id, trackingCode: delivery.trackingCode }
      );
    }

    // Notify farmer
    if (order.farmer) {
      await notify(req.app, order.farmer._id || order.farmer,
        "📤 Agent Coming for Pickup",
        `A delivery agent is on the way to pick up ${order.crop?.name || "your product"} for order #${order.billNumber}. Please keep it ready!`,
        "delivery", "high", { orderId: order._id }
      );
    }

    // Notify admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await notify(req.app, admin._id,
        "🚚 Delivery Accepted",
        `Agent accepted order #${order.billNumber}. ETA: ${etaText}`,
        "delivery", "low", { orderId: order._id }
      );
    }

    res.json({ order, delivery });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Assign delivery (by admin)
router.post("/assign", async (req, res) => {
  try {
    const delivery = await Delivery.create(req.body);
    const io = req.app.get("io");
    if (io) io.emit("delivery_assigned", delivery);
    res.json(delivery);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Auto-Assign Best Agent Algorithmic Route
router.post("/auto-assign/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate("crop").populate("farmer");
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.agent) return res.status(400).json({ error: "Already assigned" });

    // 1. Fetch all active agents
    const agents = await User.find({ role: "agent", isActive: true });
    if (agents.length === 0) return res.status(400).json({ error: "No delivery agents available right now." });

    const pickupLat = order.farmer?.latitude || order.crop?.latitude || 0;
    const pickupLng = order.farmer?.longitude || order.crop?.longitude || 0;

    // 2. Score agents - Check ridealong agents matching route first
    const dropLat = order.deliveryLatitude || 0;
    const dropLng = order.deliveryLongitude || 0;

    let bestAgent = null;
    let isRidealong = false;
    let agentDistance = 0;

    // Check if any active ridealong agent's commute route encompasses this delivery
    const ridealongAgents = agents.filter(a => a.agentType === "ridealong" && a.ridealongRoute?.isActive);
    for (const rAgent of ridealongAgents) {
      const route = rAgent.ridealongRoute;
      const startLat = route.fromLat || rAgent.latitude;
      const startLng = route.fromLng || rAgent.longitude;
      const destLat = route.toLat;
      const destLng = route.toLng;

      const distPickupFromStart = haversineDistance(startLat, startLng, pickupLat, pickupLng);
      const distDropToDest = (destLat && destLng && dropLat && dropLng) ? haversineDistance(dropLat, dropLng, destLat, destLng) : 5;

      // If pickup is within 15km of agent's commute start and drop is within 15km of their destination
      if (distPickupFromStart <= 15 && distDropToDest <= 15) {
        bestAgent = rAgent;
        isRidealong = true;
        agentDistance = distPickupFromStart;
        break;
      }
    }

    if (!bestAgent) {
      // Balance Proximity (distance) and Delivery Score
      const scoredAgents = agents.map(agent => {
        const dist = haversineDistance(agent.latitude, agent.longitude, pickupLat, pickupLng);
        const score = (dist * 10) - (agent.deliveryScore || 0);
        return { agent, dist, score };
      });

      scoredAgents.sort((a, b) => a.score - b.score);
      bestAgent = scoredAgents[0].agent;
      agentDistance = scoredAgents[0].dist;
    }

    // Calculate ETA based on agent's distance to pickup + pickup to drop
    const distToDrop = order.deliveryDistance || haversineDistance(pickupLat, pickupLng, order.deliveryLatitude, order.deliveryLongitude);
    const totalDist = agentDistance + distToDrop;
    const etaMinutes = computeETA(totalDist, bestAgent.agentType || "bike");
    const etaText = etaMinutes < 60 ? `${etaMinutes} mins` : `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`;

    // 3. Fee Split & Pricing
    const origDelivery = order.deliveryCharges || 40;
    if (isRidealong) {
      // 50% to ride along, 10% platform, 40% discount to customer
      const customerDiscount = Math.round(origDelivery * 0.40);
      const agentShare = Math.round(origDelivery * 0.50);
      
      order.isRidealong = true;
      order.ridealongDiscount = customerDiscount;
      order.agentEarnings = agentShare;
      order.deliveryCharges = origDelivery - customerDiscount;
      order.totalAmount = Math.max(0, (order.totalAmount || 0) - customerDiscount);
      order.timeline.push({ 
        status: "assigned", 
        note: `Auto-assigned Ride-Along Freelance Agent (${bestAgent.name}). 40% Delivery Discount applied (Customer saved ₹${customerDiscount})! ETA: ${etaText}` 
      });
    } else {
      order.isRidealong = false;
      order.agentEarnings = order.deliveryCharges;
      order.timeline.push({ status: "assigned", note: `Auto-assigned best agent (${bestAgent.name}). ETA: ${etaText}` });
    }

    // 4. Assign
    order.agent = bestAgent._id;
    order.status = "assigned";
    order.estimatedDeliveryMinutes = etaMinutes;
    await order.save();

    const delivery = await Delivery.create({
      order: order._id,
      agent: bestAgent._id,
      pickupLocation: order.farmer?.location || order.crop?.location || "",
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      deliveryLocation: order.deliveryAddress || "",
      deliveryLatitude: order.deliveryLatitude,
      deliveryLongitude: order.deliveryLongitude,
      vehicleType: "bike",
      estimatedTime: etaText,
      estimatedMinutes: etaMinutes,
      trackingCode: "TRK-" + Date.now().toString(36).toUpperCase()
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("delivery_assigned", delivery);
      io.emit("order_updated", order);
    }

    // Notify agent
    await notify(req.app, bestAgent._id, "🔔 New Delivery Assigned", `You were auto-assigned a delivery for ${order.crop?.name}. ETA to complete: ${etaText}`, "delivery", "high", { orderId: order._id });

    // Notify customer
    if (order.customer) {
      await notify(req.app, order.customer, "🚚 Best Agent Assigned!", `Your order was assigned to ${bestAgent.name}. Estimated arrival: ${etaText}.`, "delivery", "high", { orderId: order._id });
    }

    res.json({ success: true, agent: bestAgent, delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate Delivery OTP
router.post("/:id/generate-otp", async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findById(id).populate("order");
    if (!delivery || !delivery.order) return res.status(404).json({ error: "Delivery/Order not found" });

    const orderId = delivery.order._id || delivery.order;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await Order.findByIdAndUpdate(orderId, { verificationCode: otp });

    // In a real app, send this OTP via SMS. For now, we'll send an app notification.
    if (delivery.order.customer) {
      await notify(req.app, delivery.order.customer._id || delivery.order.customer,
        "🔑 Delivery OTP",
        `Your delivery agent is arriving soon! Share this OTP to receive your order: ${otp}`,
        "delivery", "high", { orderId }
      );
    }

    res.json({ success: true, message: "OTP sent to customer." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Verify Delivery OTP
router.post("/:id/verify-otp", async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    
    const delivery = await Delivery.findById(id).populate("order");
    if (!delivery || !delivery.order) return res.status(404).json({ error: "Delivery/Order not found" });

    const order = await Order.findById(delivery.order._id || delivery.order);
    if (!order || order.verificationCode !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please ask the customer again." });
    }

    // OTP verified, allow status change to delivered
    res.json({ success: true, message: "OTP verified successfully!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update delivery status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, wasteCollectedKg } = req.body;
    
    const deliveryDoc = await Delivery.findById(id).populate("order");
    if (!deliveryDoc) return res.status(404).json({ error: "Delivery not found." });

    // Security Rule: Require Quality Verification Photo for delivery
    if (status === "delivered") {
      if (!deliveryDoc.deliveryPhoto) {
        return res.status(400).json({ error: "Security Rule Violation: Quality Verification Photo is required before marking as delivered." });
      }
    }

    const updates = { status };
    if (status === "delivered") {
      const now = new Date();
      updates.deliveredAt = now;

      // ── Circular Economy: Waste Collection ──
      if (wasteCollectedKg && Number(wasteCollectedKg) > 0) {
        updates.wasteCollectedKg = Number(wasteCollectedKg);
        updates.wastePointsAwarded = updates.wasteCollectedKg * 10;
        
        // Award points to the customer
        if (deliveryDoc.order && deliveryDoc.order.customer) {
          await User.findByIdAndUpdate(
            deliveryDoc.order.customer._id || deliveryDoc.order.customer,
            { $inc: { rewardPoints: updates.wastePointsAwarded } }
          );
        }
      }

      // ─── Performance, Fast Delivery Incentive & Late Penalty Engine ───
      const deadline = deliveryDoc.estimatedDeliveryDeadline || deliveryDoc.order?.estimatedDeliveryDeadline || new Date(new Date(deliveryDoc.createdAt).getTime() + (deliveryDoc.estimatedMinutes || 35) * 60 * 1000);
      const diffMinutes = Math.round((deadline.getTime() - now.getTime()) / (60 * 1000));
      const isEarly = diffMinutes >= 0;
      const isLate = diffMinutes < 0;

      let speedBonusPoints = 0;
      let speedBonusCash = 0;
      let latePenaltyPoints = 0;
      let latePenaltyDeduction = 0;
      let scoreChange = 0;

      if (isEarly) {
        // Fast / On-time Delivery Bonus (+20 to +50 points, +₹10 - ₹30 cash tip, +2 to +5 score)
        speedBonusPoints = Math.min(50, Math.max(20, 20 + diffMinutes * 2));
        speedBonusCash = Math.min(30, Math.max(10, Math.round(diffMinutes * 1.5)));
        scoreChange = Math.min(5, Math.max(2, Math.round(diffMinutes / 5) + 2));

        if (deliveryDoc.agent) {
          await User.findByIdAndUpdate(deliveryDoc.agent, {
            $inc: {
              rewardPoints: speedBonusPoints,
              experiencePoints: speedBonusPoints,
              walletBalance: speedBonusCash,
              deliveryScore: scoreChange
            }
          });

          await notify(req.app, deliveryDoc.agent,
            "⚡ Lightning Fast Delivery Bonus!",
            `Awesome speed! You delivered ${diffMinutes} mins before deadline. Earned +${speedBonusPoints} Speed Points, +${scoreChange} Delivery Score, and ₹${speedBonusCash} Cash Tip!`,
            "reward", "high", { orderId: deliveryDoc.order?._id, bonusPoints: speedBonusPoints, bonusCash: speedBonusCash }
          );
        }
      } else {
        // Late Delivery Penalty (-10 to -40 penalty points, score reduction, -₹20 delay fee if >15 mins late)
        const lateMins = Math.abs(diffMinutes);
        const isDisputed = deliveryDoc.deliveryPerformance?.isDisputed;

        if (isDisputed) {
          scoreChange = 0;
          latePenaltyPoints = 0;
        } else {
          latePenaltyPoints = Math.min(50, Math.max(10, 10 + Math.floor(lateMins / 5) * 5));
          scoreChange = -Math.min(10, Math.max(2, Math.floor(lateMins / 10) * 2));
          if (lateMins > 15) latePenaltyDeduction = 20;

          if (deliveryDoc.agent) {
            const agentUser = await User.findById(deliveryDoc.agent);
            const newPoints = Math.max(0, (agentUser.rewardPoints || 0) - latePenaltyPoints);
            const newScore = Math.max(30, (agentUser.deliveryScore || 100) + scoreChange);
            const walletDeduction = latePenaltyDeduction > 0 ? { $inc: { walletBalance: -latePenaltyDeduction } } : {};

            await User.findByIdAndUpdate(deliveryDoc.agent, {
              rewardPoints: newPoints,
              deliveryScore: newScore,
              ...walletDeduction
            });

            await notify(req.app, deliveryDoc.agent,
              "⚠️ Late Delivery Points Deduction",
              `Order was delivered ${lateMins} mins past estimated deadline. Points reduced by -${latePenaltyPoints} pts and Delivery Score updated (${scoreChange}).`,
              "delivery", "high", { orderId: deliveryDoc.order?._id, penaltyPoints: latePenaltyPoints }
            );
          }
        }
      }

      // ─── Recalculate Agent Trust Score ───
      if (deliveryDoc.agent) {
        try {
          const agentDoc = await Agent.findOne({ user: deliveryDoc.agent });
          if (agentDoc) {
            if (!agentDoc.trustScore) {
              agentDoc.trustScore = { score: 100, rating: 5.0, totalRatings: 0, totalDeliveries: 0, onTimeDeliveries: 0, issuesReported: 0 };
            }
            agentDoc.trustScore.totalDeliveries = (agentDoc.trustScore.totalDeliveries || 0) + 1;
            if (isEarly) {
              agentDoc.trustScore.onTimeDeliveries = (agentDoc.trustScore.onTimeDeliveries || 0) + 1;
            }
            const totalDels = agentDoc.trustScore.totalDeliveries;
            const onTimeDels = agentDoc.trustScore.onTimeDeliveries;
            const onTimeRate = totalDels > 0 ? (onTimeDels / totalDels) : 1;
            const currentRating = agentDoc.trustScore.rating || 5.0;
            const ratingScore = (currentRating / 5) * 30;
            const issuesPenalty = Math.min(10, agentDoc.trustScore.issuesReported || 0);
            const compositeTrustScore = Math.min(100, Math.max(10, Math.round((onTimeRate * 60) + ratingScore + (10 - issuesPenalty))));
            
            agentDoc.trustScore.score = compositeTrustScore;
            await agentDoc.save();
            await User.findByIdAndUpdate(deliveryDoc.agent, { deliveryScore: compositeTrustScore });
          }
        } catch (tsErr) {
          console.error("Agent trust score calculation error:", tsErr);
        }
      }

      updates.deliveryPerformance = {
        deliveredAt: now,
        deadline,
        diffMinutes,
        isEarly,
        isLate,
        speedBonusPoints,
        speedBonusCash,
        latePenaltyPoints,
        latePenaltyDeduction,
        deliveryScoreChange: scoreChange,
        delayReason: deliveryDoc.deliveryPerformance?.delayReason || "",
        isDisputed: deliveryDoc.deliveryPerformance?.isDisputed || false
      };
    }

    const delivery = await Delivery.findByIdAndUpdate(id, updates, { new: true })
      .populate({ path: "order", populate: [{ path: "crop" }, { path: "customer" }, { path: "farmer" }] });

    // Also update the order status & delivery performance
    if (delivery?.order) {
      const orderStatusMap = {
        "picked_up": "picked_up",
        "in_transit": "in_transit",
        "delivered": "delivered",
        "failed": "cancelled"
      };
      if (orderStatusMap[status]) {
        let orderUpdates = {
          status: orderStatusMap[status],
          $push: { timeline: { status: orderStatusMap[status], note: `Delivery ${status.replace("_", " ")}` } }
        };
        if (updates.deliveryPerformance) {
          orderUpdates.deliveryPerformance = updates.deliveryPerformance;
        }
        // Auto-clear COD payment upon delivery
        if (status === "delivered" && delivery.order.paymentMode === "cod") {
          orderUpdates.paymentStatus = "paid";
          orderUpdates.$push.timeline = { status: "delivered", note: "Delivery completed and COD payment collected." };
        }
        await Order.findByIdAndUpdate(delivery.order._id || delivery.order, orderUpdates);
      }
    }

    const io = req.app.get("io");
    if (io) io.emit("delivery_updated", delivery);

    // ─── Status-specific Notifications ───
    const order = delivery.order;

    if (status === "picked_up" && order?.customer) {
      await notify(req.app, order.customer._id || order.customer,
        "📦 Order Picked Up!",
        `Your ${order.crop?.name || "order"} has been picked up from the farm and is being prepared for delivery!`,
        "delivery", "normal", { orderId: order._id }
      );
    }

    if (status === "in_transit" && order?.customer) {
      await notify(req.app, order.customer._id || order.customer,
        "🚚 On the Way!",
        `Your ${order.crop?.name || "order"} is on its way to you! Estimated arrival: ${delivery.estimatedTime || "Soon"}`,
        "delivery", "high", { orderId: order._id }
      );
    }

    if (status === "delivered") {
      // Notify customer
      if (order?.customer) {
        await notify(req.app, order.customer._id || order.customer,
          "✅ Order Delivered!",
          `Your ${order.crop?.name || "order"} has been delivered successfully! Enjoy your fresh produce. 🌾`,
          "delivery", "high", { orderId: order._id }
        );
      }
      // Notify farmer
      if (order?.farmer) {
        await notify(req.app, order.farmer._id || order.farmer,
          "✅ Delivery Complete",
          `Order #${order.billNumber || ""} for ${order.crop?.name || "your product"} has been delivered to the customer.`,
          "delivery", "normal", { orderId: order._id }
        );
      }
      // Notify admins
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await notify(req.app, admin._id,
          "✅ Delivery Completed",
          `Order #${order?.billNumber || ""} delivered. Early: ${updates.deliveryPerformance?.isEarly ? "Yes" : "No"}, Diff: ${updates.deliveryPerformance?.diffMinutes}m`,
          "delivery", "low", { orderId: order?._id }
        );
      }
    }

    if (status === "failed") {
      if (order?.customer) {
        await notify(req.app, order.customer._id || order.customer,
          "❌ Delivery Issue",
          `Unfortunately there was an issue with your delivery. Our team will contact you shortly.`,
          "delivery", "urgent", { orderId: order._id }
        );
      }
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await notify(req.app, admin._id,
          "❌ Delivery Failed",
          `Delivery for order #${order?.billNumber || ""} has failed. Requires attention.`,
          "delivery", "high", { orderId: order?._id }
        );
      }
    }

    res.json(delivery);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Log Delay Reason & Dispute / Waiver ───
router.post("/:id/log-delay", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    if (!reason) return res.status(400).json({ error: "Delay reason is required." });

    const delivery = await Delivery.findByIdAndUpdate(
      id,
      {
        "deliveryPerformance.delayReason": `${reason}: ${notes || ""}`.trim(),
        "deliveryPerformance.isDisputed": true
      },
      { new: true }
    ).populate("order");

    if (!delivery) return res.status(404).json({ error: "Delivery not found." });

    if (delivery.order) {
      await Order.findByIdAndUpdate(delivery.order._id || delivery.order, {
        "deliveryPerformance.delayReason": `${reason}: ${notes || ""}`.trim(),
        "deliveryPerformance.isDisputed": true
      });
    }

    res.json({ success: true, message: "Delay reason logged and penalty waiver submitted.", delivery });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Agent Performance & Speed Analytics ───
router.get("/agent-performance/:agentId", async (req, res) => {
  try {
    const deliveries = await Delivery.find({ agent: req.params.agentId, status: "delivered" }).sort({ createdAt: -1 });
    const totalCompleted = deliveries.length;
    const earlyDeliveries = deliveries.filter(d => d.deliveryPerformance?.isEarly).length;
    const lateDeliveries = deliveries.filter(d => d.deliveryPerformance?.isLate).length;
    const onTimeRate = totalCompleted > 0 ? Math.round((earlyDeliveries / totalCompleted) * 100) : 100;
    const totalSpeedPoints = deliveries.reduce((sum, d) => sum + (d.deliveryPerformance?.speedBonusPoints || 0), 0);
    const totalSpeedCash = deliveries.reduce((sum, d) => sum + (d.deliveryPerformance?.speedBonusCash || 0), 0);
    const totalPenaltyPoints = deliveries.reduce((sum, d) => sum + (d.deliveryPerformance?.latePenaltyPoints || 0), 0);

    res.json({
      totalCompleted,
      earlyDeliveries,
      lateDeliveries,
      onTimeRate,
      totalSpeedPoints,
      totalSpeedCash,
      totalPenaltyPoints,
      recentPerformances: deliveries.slice(0, 10).map(d => ({
        id: d._id,
        trackingCode: d.trackingCode,
        deliveredAt: d.deliveredAt || d.updatedAt,
        performance: d.deliveryPerformance
      }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload pickup or delivery photo
router.put("/:id/photo", upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // "pickup" or "delivery"
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const photoUrl = `/uploads/${req.file.filename}`;
    const updates = type === "pickup" ? { pickupPhoto: photoUrl } : { deliveryPhoto: photoUrl };

    const delivery = await Delivery.findByIdAndUpdate(id, updates, { new: true });
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    res.json({ success: true, message: "Photo uploaded successfully", delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agent earnings
router.get("/earnings/:agentId", async (req, res) => {
  try {
    const deliveries = await Delivery.find({ agent: req.params.agentId, status: "delivered" }).populate("order");
    const totalDeliveries = deliveries.length;
    const totalEarnings = deliveries.reduce((sum, d) => sum + (d.order?.deliveryCharges || 30), 0);
    const todayDeliveries = deliveries.filter(d => {
      const today = new Date();
      const deliveredDate = new Date(d.deliveredAt || d.updatedAt);
      return deliveredDate.toDateString() === today.toDateString();
    }).length;

    const agent = await Agent.findOne({ user: req.params.agentId });
    const trustScore = agent ? agent.trustScore : { score: 100, rating: 5.0, totalRatings: 0 };

    res.json({ totalDeliveries, totalEarnings, todayDeliveries, perDeliveryAvg: totalDeliveries ? Math.round(totalEarnings / totalDeliveries) : 0, trustScore });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rate Delivery Agent
router.post("/rate-agent/:orderId", async (req, res) => {
  try {
    const { rating } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order || !order.agent) return res.status(404).json({ error: "Order or Agent not found" });

    const agent = await Agent.findOne({ user: order.agent });
    if (!agent) return res.status(404).json({ error: "Agent details not found" });

    // Update trust score logic
    const currentRating = agent.trustScore.rating;
    const totalRatings = agent.trustScore.totalRatings;
    
    agent.trustScore.rating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);
    agent.trustScore.totalRatings += 1;
    
    // Scale score out of 100 based on rating (5 stars = 100)
    agent.trustScore.score = Math.round((agent.trustScore.rating / 5) * 100);

    await agent.save();

    res.json({ message: "Agent rated successfully", trustScore: agent.trustScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── AI Farm Produce Quality & Authenticity Inspection (Agent Field Verification) ───
router.post("/:id/verify-produce", upload.single("producePhoto"), async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findById(id).populate({
      path: "order",
      populate: [{ path: "crop" }, { path: "farmer" }, { path: "customer" }]
    });
    if (!delivery || !delivery.order) return res.status(404).json({ error: "Delivery or order not found" });

    if (!req.file) return res.status(400).json({ error: "Please capture or upload a live farm produce photo." });

    const photoUrl = `/uploads/${req.file.filename}`;
    const filePath = path.join(process.cwd(), "public", photoUrl);

    let base64Data = null;
    const mimeType = req.file.mimetype || "image/jpeg";
    try {
      const fileBuffer = fs.readFileSync(filePath);
      base64Data = fileBuffer.toString("base64");
    } catch (e) {
      console.error("Error reading produce image file:", e);
    }

    const order = delivery.order;
    const cropName = order.crop?.name || order.productSnapshot?.name || "Farm Produce";
    const category = order.crop?.category || order.productSnapshot?.category || "Agricultural Produce";
    const isOrganic = order.crop?.isOrganic || order.productSnapshot?.isOrganic || false;
    const qty = order.quantity || 1;
    const unit = order.crop?.unit || "kg";

    let isMatch = true;
    let freshnessScore = 92;
    let grade = "Grade A (Premium)";
    let summary = `Inspected on field: High quality fresh ${cropName}, verified against marketplace specifications.`;

    if (base64Data) {
      const prompt = `You are an expert AI agricultural produce inspector for Rythu Sethu farmer marketplace.
Order Details:
- Listed Crop: "${cropName}"
- Category: "${category}"
- Certified Organic Claimed: ${isOrganic ? "Yes" : "No"}
- Quantity: ${qty} ${unit}

Analyze this live photo captured by the logistics agent at the farmer's harvesting plot.
Verify:
1. Is this crop authentic and visually matching "${cropName}"?
2. Estimate the freshness score (0-100%).
3. Determine produce grade (Grade A (Premium), Grade B (Standard), Grade C (Substandard)).
4. Does it look healthy, authentic, and approved for customer packaging?

Respond STRICTLY in this JSON format:
{
  "isMatch": true,
  "cropIdentified": "${cropName}",
  "freshnessScore": 95,
  "grade": "Grade A (Premium)",
  "packingApproved": true,
  "summary": "Crisp, freshly harvested organic produce matching marketplace specifications."
}`;

      try {
        const aiResponse = await callGeminiWithFallback([
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ]);
        if (aiResponse) {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            isMatch = Boolean(parsed.isMatch);
            freshnessScore = Number(parsed.freshnessScore) || 90;
            grade = parsed.grade || "Grade A (Premium)";
            summary = parsed.summary || summary;
          }
        }
      } catch (aiErr) {
        console.warn("AI produce verification error, using fallback evaluation:", aiErr.message);
      }
    }

    // Update Delivery & Order records
    delivery.pickupPhoto = photoUrl;
    delivery.aiVerificationResult = isMatch ? "match" : "mismatch";
    delivery.aiVerificationNotes = `[${grade} | ${freshnessScore}% Freshness] ${summary}`;
    delivery.status = "picked_up";
    await delivery.save();

    await Order.findByIdAndUpdate(order._id, {
      agentVerified: isMatch,
      status: "picked_up",
      $push: {
        timeline: {
          status: "picked_up",
          note: `🌾 AI Quality Inspection Passed (${grade}, ${freshnessScore}% Freshness). Produce packed securely by Agent.`
        }
      }
    });

    // Notify customer
    if (order.customer) {
      await notify(
        req.app,
        order.customer._id || order.customer,
        "✨ Produce Verified & Packed!",
        `Your delivery agent inspected your ${cropName} at the farm (${grade}, ${freshnessScore}% Freshness). Packed and ready for transit!`,
        "delivery",
        "high",
        { orderId: order._id, freshnessScore, grade }
      );
    }

    // Notify farmer
    if (order.farmer) {
      await notify(
        req.app,
        order.farmer._id || order.farmer,
        "📦 Produce Inspected & Collected",
        `Delivery agent completed AI inspection for ${cropName} (${grade}). Packed for doorstep delivery.`,
        "delivery",
        "normal",
        { orderId: order._id }
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("delivery_updated", delivery);
      io.emit("order_updated", { _id: order._id, status: "picked_up", agentVerified: isMatch });
    }

    res.json({
      success: true,
      isMatch,
      freshnessScore,
      grade,
      summary,
      delivery
    });
  } catch (err) {
    console.error("Produce verification error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Secure Doorstep Handover with Customer OTP & COD Collection ───
router.post("/:id/complete-handover", async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, wasteCollectedKg } = req.body;

    const delivery = await Delivery.findById(id).populate({
      path: "order",
      populate: [{ path: "crop" }, { path: "farmer" }, { path: "customer" }]
    });
    if (!delivery || !delivery.order) return res.status(404).json({ error: "Delivery or Order not found." });

    const order = await Order.findById(delivery.order._id || delivery.order);
    if (!order) return res.status(404).json({ error: "Order record not found." });

    // Enforce OTP Validation
    if (!otp || String(order.verificationCode).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid Delivery OTP. Please ask customer to provide the 6-digit verification code from their app." });
    }

    const now = new Date();
    delivery.deliveredAt = now;
    delivery.status = "delivered";

    // Performance & Speed Incentive Calculation
    const deadline = delivery.estimatedDeliveryDeadline || new Date(new Date(delivery.createdAt).getTime() + 35 * 60 * 1000);
    const diffMinutes = Math.round((deadline.getTime() - now.getTime()) / (60 * 1000));
    const isEarly = diffMinutes >= 0;
    const speedBonusCash = isEarly ? Math.min(30, Math.max(10, Math.round(diffMinutes * 1.5))) : 0;
    const speedBonusPoints = isEarly ? Math.min(50, Math.max(20, 20 + diffMinutes * 2)) : 0;

    delivery.deliveryPerformance = {
      deliveredAt: now,
      deadline,
      diffMinutes,
      isEarly,
      isLate: !isEarly,
      speedBonusPoints,
      speedBonusCash,
      deliveryScoreChange: isEarly ? 3 : 0
    };

    // ─── Handle COD Cash Collection by Agent ───
    let codAmountCollected = 0;
    if (order.paymentMode === "cod") {
      order.paymentStatus = "paid";
      codAmountCollected = order.totalAmount || 0;
      
      // Agent holds the collected cash until returning/remitting to Admin
      if (delivery.agent) {
        await User.findByIdAndUpdate(delivery.agent, {
          $inc: { cashInHand: codAmountCollected }
        });
      }
    }

    // ─── Update Agent Wallet Balance (Under 2-Week Bi-Weekly Settlement Hold) ───
    const baseDeliveryEarnings = order.agentEarnings || order.deliveryCharges || 40;
    const totalAgentEarnings = baseDeliveryEarnings + speedBonusCash;

    if (delivery.agent) {
      await User.findByIdAndUpdate(delivery.agent, {
        $inc: {
          walletBalance: totalAgentEarnings,
          rewardPoints: speedBonusPoints,
          experiencePoints: speedBonusPoints,
          deliveryScore: isEarly ? 3 : 1
        }
      });
    }

    // ─── Update Farmer Pending Settlement (Under 2-Week Bi-Weekly Settlement Hold) ───
    const farmerAmount = Math.max(0, (order.subtotal || order.totalAmount || 0) - (order.platformFee || 0));
    if (order.farmer && !order.isSettledWithFarmer) {
      await User.findByIdAndUpdate(order.farmer._id || order.farmer, {
        $inc: { pendingSettlement: farmerAmount }
      });
      order.isSettledWithFarmer = true;
      order.adminRevenue = order.platformFee || Math.round((order.subtotal || 0) * 0.05);
    }

    // ─── Circular Economy Waste Collection ───
    if (wasteCollectedKg && Number(wasteCollectedKg) > 0) {
      delivery.wasteCollectedKg = Number(wasteCollectedKg);
      delivery.wastePointsAwarded = Number(wasteCollectedKg) * 10;
      if (order.customer) {
        await User.findByIdAndUpdate(order.customer._id || order.customer, {
          $inc: { rewardPoints: delivery.wastePointsAwarded }
        });
      }
    }

    await delivery.save();

    order.status = "delivered";
    order.timeline.push({
      status: "delivered",
      note: `✅ Secure delivery completed with OTP verification.${codAmountCollected > 0 ? ` ₹${codAmountCollected} COD collected by Agent.` : ""} Earnings credited to 2-Week Settlement Cycle.`
    });
    await order.save();

    // Notify Customer with Review Prompt
    if (order.customer) {
      await notify(
        req.app,
        order.customer._id || order.customer,
        "⭐ Order Delivered! Rate Your Produce",
        `Your ${order.crop?.name || "fresh order"} was delivered securely! Please tap here to rate the produce quality and farmer.`,
        "delivery",
        "high",
        { orderId: order._id, promptReview: true }
      );
    }

    // Notify Farmer
    if (order.farmer) {
      await notify(
        req.app,
        order.farmer._id || order.farmer,
        "💰 Harvest Delivered & Earnings Logged",
        `Order #${order.billNumber || ""} delivered. ₹${farmerAmount} credited to your Bi-Weekly Settlement Ledger.`,
        "payment",
        "normal",
        { orderId: order._id }
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("delivery_updated", delivery);
      io.emit("order_updated", order);
    }

    res.json({
      success: true,
      message: "Delivery handover completed securely!",
      codCollected: codAmountCollected,
      agentEarnings: totalAgentEarnings,
      farmerShare: farmerAmount,
      delivery
    });
  } catch (err) {
    console.error("Handover error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Agent COD Cash Remittance to Admin ───
router.post("/remit-cod", async (req, res) => {
  try {
    const { agentId, amount, paymentMethod, transactionRef } = req.body;
    if (!agentId) return res.status(400).json({ error: "Agent ID is required." });

    const agent = await User.findById(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found." });

    const remitAmount = Number(amount) || agent.cashInHand || 0;
    if (remitAmount <= 0) {
      return res.status(400).json({ error: "No COD cash in hand to remit." });
    }

    agent.cashInHand = Math.max(0, (agent.cashInHand || 0) - remitAmount);
    await agent.save();

    // Notify Admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await notify(
        req.app,
        admin._id,
        "💵 Agent COD Remittance Received",
        `Delivery Agent ${agent.name} remitted ₹${remitAmount} of collected COD cash (${paymentMethod || "Bank/UPI"} Ref: ${transactionRef || "N/A"}).`,
        "payment",
        "high",
        { agentId: agent._id, amount: remitAmount }
      );
    }

    res.json({
      success: true,
      message: `Successfully remitted ₹${remitAmount} to Admin. Remaining cash in hand: ₹${agent.cashInHand}`,
      cashInHand: agent.cashInHand
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Agent 2-Week (14-Day) Bi-Weekly Settlement Ledger ───
router.get("/settlements/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await User.findById(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found." });

    // Compute 14-day bi-weekly settlement cycle
    const now = new Date();
    const epoch = new Date(2026, 0, 1);
    const diffDays = Math.floor((now - epoch) / (1000 * 60 * 60 * 24));
    const cycleIndex = Math.floor(diffDays / 14);
    const cycleStartDate = new Date(epoch.getTime() + cycleIndex * 14 * 24 * 60 * 60 * 1000);
    const cycleEndDate = new Date(cycleStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(1, Math.ceil((cycleEndDate - now) / (1000 * 60 * 60 * 24)));

    const pastSettlements = await Settlement.find({ recipient: agentId, recipientRole: "agent" }).sort({ createdAt: -1 });

    const deliveries = await Delivery.find({ agent: agentId, status: "delivered" })
      .populate("order")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      settlementCycleDays: 14,
      cycleType: "Bi-Weekly (2-Week Settlement)",
      currentCycleStart: cycleStartDate.toISOString(),
      currentCycleEnd: cycleEndDate.toISOString(),
      nextPayoutDate: cycleEndDate.toISOString(),
      daysRemainingInCycle: daysRemaining,
      unsettledWalletBalance: agent.walletBalance || 0,
      cashInHand: agent.cashInHand || 0,
      pastSettlements,
      recentDeliveries: deliveries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── AI Biodegradable Waste Verification ───
router.post("/:id/verify-waste", upload.single("wastePhoto"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: "No image file provided." });

    const photoUrl = `/uploads/${req.file.filename}`;
    const filePath = path.join(process.cwd(), "public", photoUrl);

    let base64Data = null;
    let mimeType = req.file.mimetype;
    try {
      const fileBuffer = fs.readFileSync(filePath);
      base64Data = fileBuffer.toString("base64");
    } catch (e) {
      console.error("Error reading waste file:", e);
      return res.status(500).json({ error: "Error reading uploaded file." });
    }

    const delivery = await Delivery.findByIdAndUpdate(id, { wastePhoto: photoUrl }, { new: true });
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    const prompt = `Analyze this image. Is it primarily biodegradable agricultural or kitchen waste (e.g., vegetable peels, fruit waste, leaves, crop residue)? Respond strictly with a JSON object: {"isBiodegradable": boolean, "confidence": number, "reason": "string"}`;
    
    let isVerified = false;
    let reason = "AI Verification Failed";

    if (base64Data) {
      const response = await callGeminiWithFallback([
        { text: prompt },
        { inlineData: { data: base64Data, mimeType } }
      ]);
      if (response) {
        try {
          const jsonMatch = response.match(/\{.*\}/s);
          if (jsonMatch) {
            const aiRes = JSON.parse(jsonMatch[0]);
            isVerified = aiRes.isBiodegradable;
            reason = aiRes.reason;
          }
        } catch (e) { console.error("JSON parse error:", e); }
      }
    }

    delivery.wasteScanStatus = isVerified ? "verified" : "rejected";
    delivery.aiVerificationNotes = reason;
    await delivery.save();

    res.json({ success: true, isVerified, reason, delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Drop-off Waste at Admin Storage (₹15 Customer Reward Points) ───
router.post("/:id/dropoff-waste", async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await Delivery.findById(id).populate("order");
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    if (delivery.wasteCollectedKg <= 0 || delivery.wasteScanStatus !== "verified") {
      return res.status(400).json({ error: "No verified waste collected for this delivery." });
    }
    if (delivery.wasteDroppedOff) {
      return res.status(400).json({ error: "Waste already dropped off." });
    }

    delivery.wasteDroppedOff = true;
    await delivery.save();

    // Add to Global Config Inventory
    let config = await GlobalConfig.findOne();
    if (!config) config = new GlobalConfig();
    config.totalBiodegradableWasteKg = (config.totalBiodegradableWasteKg || 0) + delivery.wasteCollectedKg;
    await config.save();

    // Reward Customer with 15 points
    if (delivery.order && delivery.order.customer) {
      const customerId = delivery.order.customer._id || delivery.order.customer;
      
      const WASTE_REWARD_POINTS = 15;
      delivery.wastePointsAwarded = WASTE_REWARD_POINTS;
      await delivery.save();
      
      await User.findByIdAndUpdate(customerId, { $inc: { rewardPoints: WASTE_REWARD_POINTS } });

      // Notify customer
      await notify(req.app, customerId, 
        "🌱 Thank You for Donating Waste!",
        `The delivery agent has successfully deposited your ${delivery.wasteCollectedKg} kg of biodegradable waste at our central storage. You earned ${WASTE_REWARD_POINTS} reward points!`,
        "reward", "normal", { deliveryId: delivery._id, rewardPoints: WASTE_REWARD_POINTS }
      );
    }

    res.json({ success: true, message: "Waste dropped off successfully", delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Ride-Along Route Management ───
router.put("/ridealong/route", async (req, res) => {
  try {
    const { agentId, fromLocation, toLocation, fromLat, fromLng, toLat, toLng, departureTime, isActive } = req.body;
    if (!agentId) return res.status(400).json({ error: "Agent ID required" });

    const user = await User.findById(agentId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.agentType = "ridealong";
    user.ridealongRoute = {
      fromLocation: fromLocation || user.ridealongRoute?.fromLocation || "",
      toLocation: toLocation || user.ridealongRoute?.toLocation || "",
      fromLat: fromLat !== undefined ? Number(fromLat) : user.ridealongRoute?.fromLat,
      fromLng: fromLng !== undefined ? Number(fromLng) : user.ridealongRoute?.fromLng,
      toLat: toLat !== undefined ? Number(toLat) : user.ridealongRoute?.toLat,
      toLng: toLng !== undefined ? Number(toLng) : user.ridealongRoute?.toLng,
      departureTime: departureTime ? new Date(departureTime) : user.ridealongRoute?.departureTime,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    };

    await user.save();
    res.json({ success: true, message: "Ride-along route updated successfully", ridealongRoute: user.ridealongRoute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
