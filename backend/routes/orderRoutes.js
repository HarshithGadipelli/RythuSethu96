import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Crop from "../models/Crop.js";
import User from "../models/User.js";
import Farmer from "../models/Farmer.js";
import Notification from "../models/Notification.js";
import Delivery from "../models/Delivery.js";
import Review from "../models/Review.js";
import Payment from "../models/Payment.js";
import { addBlockToChain } from "../utils/blockchain.js";
import { protect } from "../middleware/authMiddleware.js";
import { calculateTrustScore } from "../services/trustScoreService.js";
import { recordOrderEvent } from "../services/continuousLearningService.js";

const router = express.Router();

// Helper: enrich orders with Farmer model profile details (farmTourMedia, farmPhoto, real farm coords)
async function enrichOrdersWithFarmerDetails(orders) {
  if (!orders || !orders.length) return orders;
  const farmerUserIds = orders.map(o => o.farmer?._id || o.farmer).filter(Boolean);
  const farmerProfiles = await Farmer.find({ user: { $in: farmerUserIds } }).lean();
  const farmerMap = new Map();
  farmerProfiles.forEach(fp => farmerMap.set(String(fp.user), fp));
  
  return orders.map(order => {
    const oObj = order.toObject ? order.toObject() : { ...order };
    const fId = String(oObj.farmer?._id || oObj.farmer || "");
    const fProfile = farmerMap.get(fId);
    if (fProfile) {
      oObj.farmerProfile = {
        farmName: fProfile.farmName || "",
        farmLocation: fProfile.farmLocation || "",
        latitude: fProfile.latitude,
        longitude: fProfile.longitude,
        farmSize: fProfile.farmSize || 0,
        soilType: fProfile.soilType || "loamy",
        farmTourMedia: fProfile.farmTourMedia || [],
        farmPhoto: fProfile.farmPhoto || "",
        farmerPhoto: fProfile.farmerPhoto || "",
        productPhoto: fProfile.productPhoto || "",
        farmTourDetails: fProfile.farmTourDetails || "",
        verified: fProfile.verified || false,
        trustScore: fProfile.trustScore || 85
      };
    }
    return oObj;
  });
}

// Get orders for current logged-in user (Customer or Farmer)
router.get("/my-orders", protect, async (req, res) => {
  try {
    const filter = req.user.role === "farmer" ? { farmer: req.user._id } : { customer: req.user._id };
    const orders = await Order.find(filter)
      .populate("crop")
      .populate("farmer", "name location trustScore phone")
      .populate("customer", "name location phone")
      .populate({ path: "deliveryLegs", populate: { path: "agent", select: "name phone vehicle agentType latitude longitude" } })
      .sort({ createdAt: -1 });
    const enriched = await enrichOrdersWithFarmerDetails(orders);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: send notification + socket event
async function notify(app, userId, title, message, type = "order", priority = "normal", metadata = {}) {
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

// Vehicle speeds (km/h)
const VEHICLE_SPEEDS = { bike: 25, auto: 20, truck: 15, van: 18 };

// Compute ETA in minutes
function computeETA(distanceKm, vehicleType = "bike") {
  const speed = VEHICLE_SPEEDS[vehicleType] || 25;
  return Math.round((distanceKm / speed) * 60) + 15; // 15 min buffer for pickup/loading
}

// Verification helper for online payments (Razorpay HMAC-SHA256 & direct API check)
async function verifyOnlinePayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, amount }) {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  
  if (!razorpayPaymentId) {
    return { verified: false, reason: "Missing transaction / payment ID" };
  }

  // 1. Cryptographic HMAC-SHA256 Verification (when orderId and signature are available)
  if (razorpayOrderId && razorpaySignature && RAZORPAY_KEY_SECRET) {
    try {
      const sign = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSign = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");
      if (razorpaySignature === expectedSign) {
        return { verified: true, method: "hmac_signature", paymentId: razorpayPaymentId };
      }
    } catch (sigErr) {
      console.warn("HMAC signature verification failed:", sigErr.message);
    }
  }

  // 2. Direct API verification via Razorpay SDK (official server-to-server check)
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && razorpayPaymentId.startsWith("pay_")) {
    try {
      const rzp = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
      const payment = await rzp.payments.fetch(razorpayPaymentId);
      if (payment && (payment.status === "captured" || payment.status === "authorized")) {
        return { verified: true, method: "razorpay_api_fetch", paymentId: razorpayPaymentId, status: payment.status };
      }
    } catch (err) {
      console.warn("Razorpay API payment fetch check warning:", err.message);
    }
  }

  // 3. Fallback for manual UPI UTR or Sandbox test IDs
  if (razorpayPaymentId.startsWith("UPI-") || razorpayPaymentId.startsWith("UTR-") || razorpayPaymentId.startsWith("pay_test_")) {
    return { verified: true, method: "upi_reference_sandbox", paymentId: razorpayPaymentId };
  }

  return { verified: false, reason: "Payment could not be verified by gateway" };
}

import HubLocation from "../models/HubLocation.js";

// Auto Assign Delivery Agent Logic (Multi-Hop)
async function autoAssignDelivery(app, orderDoc) {
  try {
    if (orderDoc.deliveryType === "farm_pickup" || orderDoc.status !== "pending") return;
    
    let pickupLat = orderDoc.pickupLatitude || 0;
    let pickupLng = orderDoc.pickupLongitude || 0;

    if (pickupLat === 0 && pickupLng === 0) {
      if (orderDoc.farmer) {
        const farmer = await User.findById(orderDoc.farmer);
        pickupLat = farmer?.latitude || 0;
        pickupLng = farmer?.longitude || 0;
      }
      if (pickupLat === 0 && pickupLng === 0 && orderDoc.crop) {
        const crop = await Crop.findById(orderDoc.crop);
        pickupLat = crop?.latitude || 0;
        pickupLng = crop?.longitude || 0;
      }
    }
    
    if (pickupLat === 0 && pickupLng === 0) return;

    // 1. Fetch Hubs
    const hubs = await HubLocation.find({ isActive: true });
    const outerHubs = hubs.filter(h => h.type === "outer_hub");
    const innerStorages = hubs.filter(h => h.type === "inner_cold_storage");

    // Fallback if no hubs (direct delivery)
    if (outerHubs.length === 0 || innerStorages.length === 0) {
       return await autoAssignDeliveryDirect(app, orderDoc, pickupLat, pickupLng);
    }

    // 2. Find Nearest Outer Hub
    let nearestOuterHub = outerHubs[0];
    let minOuterDist = Infinity;
    outerHubs.forEach(h => {
      const d = haversineDistance(pickupLat, pickupLng, h.latitude, h.longitude);
      if (d < minOuterDist) { minOuterDist = d; nearestOuterHub = h; }
    });

    // 3. Find Nearest Inner Storage
    let nearestInnerStorage = innerStorages[0];
    let minInnerDist = Infinity;
    const deliveryLat = orderDoc.deliveryLatitude || 0;
    const deliveryLng = orderDoc.deliveryLongitude || 0;
    innerStorages.forEach(h => {
      const d = haversineDistance(deliveryLat, deliveryLng, h.latitude, h.longitude);
      if (d < minInnerDist) { minInnerDist = d; nearestInnerStorage = h; }
    });

    // 4. Create Legs
    const order = await Order.findById(orderDoc._id);
    
    // Leg 1: Farmer to Outer Hub (Truck/Tractor)
    const leg1 = await Delivery.create({
      order: order._id,
      pickupLocation: "Farmer Location",
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      deliveryLocation: nearestOuterHub.name + " (Outer Hub)",
      deliveryLatitude: nearestOuterHub.latitude,
      deliveryLongitude: nearestOuterHub.longitude,
      vehicleType: "truck",
      legType: "rural_to_hub",
      destinationLocationId: nearestOuterHub._id,
      destinationLocationName: nearestOuterHub.name,
      status: "assigned", // we'll assign it shortly
      trackingCode: "TRK-L1-" + Date.now().toString(36).toUpperCase(),
    });

    // Leg 2: Outer Hub to Inner Storage (Truck)
    const leg2 = await Delivery.create({
      order: order._id,
      pickupLocation: nearestOuterHub.name + " (Outer Hub)",
      pickupLatitude: nearestOuterHub.latitude,
      pickupLongitude: nearestOuterHub.longitude,
      deliveryLocation: nearestInnerStorage.name + " (Inner Cold Storage)",
      deliveryLatitude: nearestInnerStorage.latitude,
      deliveryLongitude: nearestInnerStorage.longitude,
      vehicleType: "truck",
      legType: "hub_to_storage",
      sourceLocationId: nearestOuterHub._id,
      sourceLocationName: nearestOuterHub.name,
      destinationLocationId: nearestInnerStorage._id,
      destinationLocationName: nearestInnerStorage.name,
      status: "pending",
      trackingCode: "TRK-L2-" + Date.now().toString(36).toUpperCase(),
    });

    // Leg 3: Inner Storage to Customer (Bike)
    const leg3 = await Delivery.create({
      order: order._id,
      pickupLocation: nearestInnerStorage.name + " (Inner Cold Storage)",
      pickupLatitude: nearestInnerStorage.latitude,
      pickupLongitude: nearestInnerStorage.longitude,
      deliveryLocation: order.deliveryAddress || "Customer Location",
      deliveryLatitude: deliveryLat,
      deliveryLongitude: deliveryLng,
      vehicleType: "bike",
      legType: "storage_to_customer",
      sourceLocationId: nearestInnerStorage._id,
      sourceLocationName: nearestInnerStorage.name,
      status: "pending",
      trackingCode: "TRK-L3-" + Date.now().toString(36).toUpperCase(),
      customerHasWetWaste: Boolean(order.hasWetWasteDonation),
      wetWasteEstKg: order.wetWasteEstKg || 0,
      wetWasteNotes: order.wetWasteNotes || "",
      agentCarryingWasteKit: true,
      wasteDestinationHub: nearestInnerStorage.name + " (Inner Cold Storage)"
    });

    order.deliveryLegs = [leg1._id, leg2._id, leg3._id];
    order.logisticsPhase = "farm_to_hub";
    order.status = "assigned";
    order.timeline.push({ status: "assigned", note: `Multi-Hop logistics planned. Routing via ${nearestOuterHub.name} and ${nearestInnerStorage.name}.` });
    await order.save();

    // Assign Agent to Leg 1
    let agents = await User.find({ role: "agent", isActive: true });
    if (agents.length) {
       const bestAgent = agents[0]; // Simplified assignment
       leg1.agent = bestAgent._id;
       await leg1.save();
       
       await notify(app, bestAgent._id, 
         "🚀 New Leg 1 Delivery!", 
         `Pickup from Farm, deliver to ${nearestOuterHub.name} Hub.`,
         "delivery", "high", { deliveryId: leg1._id }
       );
    }

    const io = app.get("io");
    if (io) {
      io.emit("delivery_assigned", leg1);
      io.emit("order_updated", order);
    }
  } catch (err) {
    console.error("Auto assign multi-hop delivery failed:", err);
  }
}

// Fallback logic for direct delivery if no hubs exist
async function autoAssignDeliveryDirect(app, orderDoc, pickupLat, pickupLng) {
  try {
    let agents = await User.find({ role: "agent", isActive: true });
    if (!agents.length) return;
    const bestAgent = agents[0];

    const distToDrop = orderDoc.deliveryDistance || haversineDistance(pickupLat, pickupLng, orderDoc.deliveryLatitude || 0, orderDoc.deliveryLongitude || 0);
    const etaMinutes = computeETA(distToDrop, "bike");

    const order = await Order.findById(orderDoc._id);
    order.agent = bestAgent._id;
    order.status = "assigned";
    order.estimatedDeliveryMinutes = etaMinutes;
    order.timeline.push({ status: "assigned", note: `Direct delivery assigned.` });
    
    const delivery = await Delivery.create({
      order: order._id,
      agent: bestAgent._id,
      pickupLocation: "Farmer Location",
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      deliveryLocation: order.deliveryAddress || "Customer Location",
      deliveryLatitude: order.deliveryLatitude || 0,
      deliveryLongitude: order.deliveryLongitude || 0,
      vehicleType: "bike",
      legType: "direct",
      status: "assigned",
      trackingCode: "TRK-" + Date.now().toString(36).toUpperCase()
    });

    order.deliveryLegs = [delivery._id];
    await order.save();
  } catch (err) {
    console.error("Direct fallback failed", err);
  }
}


// Create order (with stock validation, delivery charges, bill, product snapshot, verification code)
router.post("/create", async (req, res) => {
  try {
    const { crop, quantity, deliveryType, deliveryCharges, deliveryDistance, isPrebooked, pointsUsed, customer, farmer, hasWetWasteDonation, wetWasteEstKg, wetWasteNotes } = req.body;

    // Stock validation
    let cropDoc = null;
    if (crop && quantity) {
      cropDoc = await Crop.findById(crop);
      if (!cropDoc) return res.status(404).json({ error: "Crop not found" });
      if (cropDoc.quantity < Number(quantity)) {
        return res.status(400).json({ error: `Only ${cropDoc.quantity} ${cropDoc.unit || "kg"} available in stock.` });
      }
    }

    // Handle reward points deduction
    let finalDiscount = 0;
    let cust = null;
    if (customer) {
      cust = await User.findById(customer);
    }
    
    if (pointsUsed && Number(pointsUsed) > 0 && cust) {
      if (cust.rewardPoints >= Number(pointsUsed)) {
        finalDiscount = Number(pointsUsed);
        cust.rewardPoints -= finalDiscount;
        await cust.save();
      }
    }

    // Calculate amounts
    const subtotal = req.body.totalAmount || 0;
    const charges = deliveryType === "farm_pickup" ? 0 : (deliveryCharges || 0);
    const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
    const totalAmount = Math.max(0, subtotal + charges - finalDiscount);

    // Handle Payments (Wallet, Online, UPI, Card, COD)
    let finalPaymentStatus = "pending";
    const reqPayMode = req.body.paymentMode || "cod";

    if (reqPayMode === "wallet" && cust) {
      if (cust.walletBalance < totalAmount) {
        return res.status(400).json({ error: "Insufficient wallet balance." });
      }
      cust.walletBalance -= totalAmount;
      await cust.save();
      finalPaymentStatus = "paid";
    } else if (reqPayMode === "online" || reqPayMode === "upi" || reqPayMode === "card") {
      const vResult = await verifyOnlinePayment({
        razorpayOrderId: req.body.razorpayOrderId,
        razorpayPaymentId: req.body.razorpayPaymentId || req.body.paymentTransactionId,
        razorpaySignature: req.body.razorpaySignature,
        amount: totalAmount
      });
      finalPaymentStatus = vResult.verified ? "paid" : "pending";
    }
    
    // Base points logic
    let pointsEarned = Math.floor(totalAmount / 100);
    
    // Customer Group Buying Multiplier
    if (quantity >= 20) {
      pointsEarned *= 2; // 2x points for bulk/group buying
    }
    
    // Farmer Quality Multiplier
    let farmerPoints = pointsEarned;
    if (cropDoc && cropDoc.qualityGrade === "A") {
      farmerPoints *= 3; // 3x multiplier for Grade A quality
    }

    const initialStatus = isPrebooked ? "prebooked" : "pending";

    // Compute estimated delivery time
    const distKm = deliveryDistance || 0;
    const estimatedDeliveryMinutes = deliveryType === "farm_pickup" ? 0 : computeETA(distKm);

    // Build product snapshot for security verification
    const productSnapshot = cropDoc ? {
      name: cropDoc.name,
      category: cropDoc.category,
      isOrganic: cropDoc.isOrganic,
      isPesticideFree: cropDoc.isPesticideFree,
      quantity: Number(quantity),
      unit: cropDoc.unit || "kg",
      price: cropDoc.price,
      image: cropDoc.image || "",
      location: cropDoc.location || ""
    } : {};

    let pickupLat = cropDoc?.latitude || 0;
    let pickupLng = cropDoc?.longitude || 0;
    let pickupAddress = cropDoc?.location || "";
    if (farmer) {
      const farmerUser = await User.findById(farmer);
      const farmerDoc = await Farmer.findOne({ user: farmer });
      if (farmerDoc && farmerDoc.farmLocation) {
        pickupAddress = farmerDoc.farmLocation;
      } else if (farmerUser && farmerUser.location) {
        pickupAddress = farmerUser.location;
      }
      if (farmerUser && farmerUser.latitude && farmerUser.longitude) {
        pickupLat = farmerUser.latitude;
        pickupLng = farmerUser.longitude;
      }
    }

    const order = await Order.create({
      ...req.body,
      status: initialStatus,
      isPrebooked: isPrebooked || false,
      pointsEarned,
      pointsUsed: finalDiscount,
      subtotal,
      deliveryCharges: charges,
      deliveryDistance: deliveryDistance || 0,
      estimatedDeliveryMinutes,
      platformFee,
      totalAmount,
      pickupAddress,
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      paymentMode: reqPayMode,
      paymentStatus: finalPaymentStatus,
      razorpayPaymentId: req.body.razorpayPaymentId || "",
      razorpayOrderId: req.body.razorpayOrderId || "",
      razorpaySignature: req.body.razorpaySignature || "",
      paymentTransactionId: req.body.razorpayPaymentId || req.body.paymentTransactionId || "",
      paymentVerifiedAt: finalPaymentStatus === "paid" ? new Date() : null,
      productSnapshot,
      hasWetWasteDonation: Boolean(hasWetWasteDonation),
      wetWasteEstKg: hasWetWasteDonation ? (Number(wetWasteEstKg) || 2) : 0,
      wetWasteNotes: wetWasteNotes || "",
      agentWasteAlertSent: Boolean(hasWetWasteDonation),
      chatMessages: hasWetWasteDonation ? [{
        sender: "system",
        senderName: "Rythu Sethu Circular Economy",
        text: `🌱 Wet-waste collection pre-alert: Customer will donate ~${Number(wetWasteEstKg) || 2}kg raw vegetable & fruit scraps upon delivery. Please ensure your collection bin & scale are ready.`,
        isWasteAlert: true,
        timestamp: new Date()
      }] : [],
      timeline: [{ status: initialStatus, note: isPrebooked ? "Pre-booking placed" : "Order placed by customer" }]
    });

    if (finalPaymentStatus === "paid" && (reqPayMode === "online" || reqPayMode === "upi" || reqPayMode === "card")) {
      Payment.create({
        order: order._id,
        customer: customer || null,
        amount: totalAmount,
        currency: "INR",
        method: reqPayMode,
        status: "paid",
        razorpayOrderId: req.body.razorpayOrderId || "",
        razorpayPaymentId: req.body.razorpayPaymentId || req.body.paymentTransactionId || "",
        razorpaySignature: req.body.razorpaySignature || "",
        paidAt: new Date()
      }).catch(err => console.warn("Payment log record failed:", err.message));
    }

    // ─── Blockchain Logging ───
    await addBlockToChain(
      order._id, 
      crop, 
      isPrebooked ? "Pre-booking Placed" : "Order Placed", 
      `Quantity: ${quantity} ${cropDoc?.unit || "kg"}`, 
      cust?.name ? `Customer: ${cust.name}` : "Customer", 
      req.body.deliveryAddress || "Platform"
    );

    // ─── Notifications ───

    // Notify farmer
    if (farmer) {
      await notify(req.app, farmer,
        "📦 New Order Received!",
        `You received a new order for ${cropDoc?.name || "a crop"} — ${quantity} ${cropDoc?.unit || "kg"} • ₹${totalAmount.toLocaleString()}`,
        "order", "high", { orderId: order._id }
      );
    }

    // Notify customer with verification code
    if (customer) {
      // Award points
      if (pointsEarned > 0) {
        await User.findByIdAndUpdate(customer, { $inc: { rewardPoints: pointsEarned } });
        await notify(req.app, customer,
          "🏆 Points Earned!",
          `You earned ${pointsEarned} Reward Points from your purchase!`,
          "reward", "normal", { orderId: order._id }
        );
      }

      // Send verification notification
      if (order.deliveryType === "farm_pickup") {
        await notify(req.app, customer,
          "🏡 Farm Gate Pickup Booked",
          `Your direct farm pickup order for ${cropDoc?.name || "produce"} is booked. When you arrive at the farm and complete payment, the farmer will provide the confirmation OTP to confirm handover.`,
          "order", "high", { orderId: order._id }
        );
      } else {
        await notify(req.app, customer,
          "🔐 Your Verification Code",
          `Your order verification code is: ${order.verificationCode}. Share this with the delivery agent to confirm your product.`,
          "order", "high", { orderId: order._id, verificationCode: order.verificationCode }
        );
      }
    }

    // Notify farmer for points
    if (farmer && farmerPoints > 0) {
      await User.findByIdAndUpdate(farmer, { $inc: { rewardPoints: farmerPoints } });
      await notify(req.app, farmer,
        "💰 New Sale & Points!",
        `You earned ${farmerPoints} Reward Points from a new order${cropDoc?.qualityGrade === "A" ? " (includes Grade A 3x bonus!)" : ""}.`,
        "reward", "normal", { orderId: order._id }
      );
    }

    // Notify admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await notify(req.app, admin._id,
        "📋 New Order on Platform",
        `New order #${order.billNumber}: ${cropDoc?.name || "Crop"} — ₹${totalAmount.toLocaleString()}`,
        "order", "normal", { orderId: order._id }
      );
    }

    // Decrement crop stock
    if (crop && quantity) {
      const updated = await Crop.findByIdAndUpdate(crop, {
        $inc: { quantity: -Number(quantity), totalOrders: 1 }
      }, { new: true });

      // Auto-mark unavailable if stock reaches 0
      if (updated && updated.quantity <= 0) {
        await Crop.findByIdAndUpdate(crop, { isAvailable: false });
      } else if (updated && updated.quantity < 50) {
        const io = req.app.get("io");
        if (io) io.emit("low_stock_alert", { cropId: crop, name: updated.name, quantity: updated.quantity });
      }
    }

    // Emit real-time event
    const io = req.app.get("io");
    if (io) io.emit("order_created", order);

    // Ingest upcoming real order transaction into Continuous ML Training Pipeline
    recordOrderEvent(order, io);

    // Trigger auto-assignment asynchronously
    autoAssignDelivery(req.app, order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi-address group checkout
router.post("/checkout-multi", async (req, res) => {
  try {
    const { items, customer, paymentMode, pointsUsed, hasWetWasteDonation, wetWasteEstKg, wetWasteNotes } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    // Stock validation for all
    for (const item of items) {
      const cropDoc = await Crop.findById(item.cropId);
      if (!cropDoc) return res.status(404).json({ error: `Crop not found` });
      if (cropDoc.quantity < Number(item.quantity)) {
        return res.status(400).json({ error: `Only ${cropDoc.quantity} ${cropDoc.unit || "kg"} available for ${cropDoc.name}.` });
      }
    }

    let cust = null;
    if (customer) cust = await User.findById(customer);

    // Calculate totals
    const grandTotal = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    // Reward points
    let finalDiscount = 0;
    if (pointsUsed && Number(pointsUsed) > 0 && cust) {
      if (cust.rewardPoints >= Number(pointsUsed)) {
        finalDiscount = Number(pointsUsed);
        cust.rewardPoints -= finalDiscount;
        await cust.save();
      }
    }

    // Wallet
    if (paymentMode === "wallet" && cust) {
      const netTotal = grandTotal - finalDiscount;
      if (cust.walletBalance < netTotal) {
        return res.status(400).json({ error: "Insufficient wallet balance." });
      }
      cust.walletBalance -= netTotal;
      await cust.save();
    }

    // Distribute discount proportionally (or just apply to first order for simplicity)
    let remainingDiscount = finalDiscount;

    // Multi-location grouping identifier
    const isMultiDrop = items.length > 1 || items.some(it => it.deliveryAddress);
    const groupId = isMultiDrop ? ("MLG-" + Date.now().toString(36).toUpperCase()) : "";
    
    // Verify Payment (Wallet, Online, UPI, Card, COD)
    let finalPaymentStatus = "pending";
    if (paymentMode === "wallet") {
      finalPaymentStatus = "paid";
    } else if (paymentMode === "online" || paymentMode === "upi" || paymentMode === "card") {
      const vResult = await verifyOnlinePayment({
        razorpayOrderId: req.body.razorpayOrderId,
        razorpayPaymentId: req.body.razorpayPaymentId || req.body.paymentTransactionId,
        razorpaySignature: req.body.razorpaySignature,
        amount: grandTotal
      });
      finalPaymentStatus = vResult.verified ? "paid" : "pending";
    }

    const itemsWithDiscount = items.map(item => {
      const itemDiscount = Math.min(remainingDiscount, item.totalAmount);
      remainingDiscount -= itemDiscount;
      return { ...item, itemDiscount };
    });

    const createdOrders = await Promise.all(itemsWithDiscount.map(async (item) => {
      const cropDoc = await Crop.findById(item.cropId);
      
      const itemTotalAmount = Math.max(0, item.totalAmount - item.itemDiscount);
      const platformFee = Math.round(item.subtotal * 0.05);
      
      let pointsEarned = Math.floor(itemTotalAmount / 100);
      if (item.quantity >= 20) pointsEarned *= 2;
      let farmerPoints = pointsEarned;
      if (cropDoc.qualityGrade === "A") farmerPoints *= 3;

      const estimatedDeliveryMinutes = item.deliveryType === "farm_pickup" ? 0 : computeETA(item.deliveryDistance || 0);

      const productSnapshot = {
        name: cropDoc.name,
        category: cropDoc.category,
        isOrganic: cropDoc.isOrganic,
        isPesticideFree: cropDoc.isPesticideFree,
        quantity: Number(item.quantity),
        unit: cropDoc.unit || "kg",
        price: cropDoc.price,
        image: cropDoc.image || "",
        location: cropDoc.location || ""
      };

      let itemPickupLat = cropDoc.latitude || 0;
      let itemPickupLng = cropDoc.longitude || 0;
      let itemPickupAddress = cropDoc.location || "";
      if (cropDoc.farmer) {
        const farmerDoc = await Farmer.findOne({ user: cropDoc.farmer });
        if (farmerDoc && farmerDoc.farmLocation) {
          itemPickupAddress = farmerDoc.farmLocation;
          if (farmerDoc.latitude && farmerDoc.longitude) {
            itemPickupLat = farmerDoc.latitude;
            itemPickupLng = farmerDoc.longitude;
          }
        }
      }

      const effectiveDeliveryAddr = item.deliveryAddress || cust?.address || cust?.location || "Customer Delivery Address";
      const effectiveDeliveryLat = item.deliveryLatitude || cust?.latitude || 17.385;
      const effectiveDeliveryLng = item.deliveryLongitude || cust?.longitude || 78.486;

      const order = await Order.create({
        crop: item.cropId,
        customer,
        farmer: cropDoc.farmer,
        quantity: item.quantity,
        status: item.isPrebooked ? "prebooked" : "pending",
        isPrebooked: item.isPrebooked || false,
        pointsEarned,
        pointsUsed: item.itemDiscount,
        subtotal: item.subtotal,
        deliveryCharges: item.deliveryType === "farm_pickup" ? 0 : (item.deliveryCharges || 0),
        deliveryDistance: item.deliveryDistance || 0,
        estimatedDeliveryMinutes,
        platformFee,
        totalAmount: itemTotalAmount,
        paymentMode: paymentMode || "cod",
        paymentStatus: finalPaymentStatus,
        razorpayPaymentId: req.body.razorpayPaymentId || "",
        razorpayOrderId: req.body.razorpayOrderId || "",
        razorpaySignature: req.body.razorpaySignature || "",
        paymentTransactionId: req.body.razorpayPaymentId || req.body.paymentTransactionId || "",
        paymentVerifiedAt: finalPaymentStatus === "paid" ? new Date() : null,
        deliveryAddress: effectiveDeliveryAddr,
        deliveryLatitude: effectiveDeliveryLat,
        deliveryLongitude: effectiveDeliveryLng,
        pickupAddress: itemPickupAddress,
        pickupLatitude: itemPickupLat,
        pickupLongitude: itemPickupLng,
        deliveryType: item.deliveryType || "standard",
        multiLocationGroupId: groupId,
        productSnapshot,
        hasWetWasteDonation: Boolean(hasWetWasteDonation),
        wetWasteEstKg: hasWetWasteDonation ? (Number(wetWasteEstKg) || 2) : 0,
        wetWasteNotes: wetWasteNotes || "",
        agentWasteAlertSent: Boolean(hasWetWasteDonation),
        chatMessages: hasWetWasteDonation ? [{
          sender: "system",
          senderName: "Rythu Sethu Circular Economy",
          text: `🌱 Wet-waste collection pre-alert: Customer will donate ~${Number(wetWasteEstKg) || 2}kg raw fruit & vegetable scraps upon delivery.`,
          isWasteAlert: true,
          timestamp: new Date()
        }] : [],
        timeline: [{ status: "pending", note: isMultiDrop ? "Multi-location order placed" : "Order placed by customer" }]
      });

      // Stock update
      const updated = await Crop.findByIdAndUpdate(item.cropId, {
        $inc: { quantity: -Number(item.quantity), totalOrders: 1 }
      }, { new: true });
      if (updated && updated.quantity <= 0) await Crop.findByIdAndUpdate(item.cropId, { isAvailable: false });

      // Notifications
      if (cropDoc.farmer) {
        // Send notifications without awaiting sequentially to speed up checkout
        notify(req.app, cropDoc.farmer, "📦 New Group Order Received!", `New order for ${cropDoc.name} — ${item.quantity} ${cropDoc.unit} • ₹${itemTotalAmount}`, "order", "high", { orderId: order._id }).catch(console.error);
        if (farmerPoints > 0) {
           User.findByIdAndUpdate(cropDoc.farmer, { $inc: { rewardPoints: farmerPoints } }).catch(console.error);
           notify(req.app, cropDoc.farmer, "💰 New Sale & Points!", `You earned ${farmerPoints} Reward Points.`, "reward", "normal", { orderId: order._id }).catch(console.error);
        }
      }
      
      // Blockchain
      addBlockToChain(order._id, item.cropId, "Group Order Placed", `Quantity: ${item.quantity}`, cust?.name || "Customer", effectiveDeliveryAddr).catch(console.error);
      
      const io = req.app.get("io");
      if (io) io.emit("order_created", order);
      
      // Ingest upcoming real order into Continuous ML Training Pipeline
      recordOrderEvent(order, io);
      
      return order;
    }));

    if (finalPaymentStatus === "paid" && (paymentMode === "online" || paymentMode === "upi" || paymentMode === "card")) {
      Payment.create({
        order: createdOrders[0]?._id,
        customer: customer || null,
        amount: Math.max(0, grandTotal - finalDiscount),
        currency: "INR",
        method: paymentMode,
        status: "paid",
        razorpayOrderId: req.body.razorpayOrderId || "",
        razorpayPaymentId: req.body.razorpayPaymentId || req.body.paymentTransactionId || "",
        razorpaySignature: req.body.razorpaySignature || "",
        paidAt: new Date()
      }).catch(err => console.warn("Multi Payment log record failed:", err.message));
    }

    // Trigger auto-assignment: multi-delivery for multi-drop, else single delivery
    if (isMultiDrop && createdOrders.length > 1) {
      await autoAssignMultiDelivery(req.app, groupId, createdOrders);
    } else if (createdOrders.length === 1) {
      await autoAssignDelivery(req.app, createdOrders[0]);
    }
    
    // Customer notifications
    if (customer) {
       const totalPoints = createdOrders.reduce((sum, o) => sum + (o.pointsEarned || 0), 0);
       if (totalPoints > 0) {
          await User.findByIdAndUpdate(customer, { $inc: { rewardPoints: totalPoints } });
          await notify(req.app, customer, "🏆 Points Earned!", `You earned ${totalPoints} Reward Points from your group purchase!`, "reward", "normal", {});
       }
       const codesMsg = createdOrders.map(o => `${o.productSnapshot.name}: ${o.verificationCode}`).join("\n");
       await notify(req.app, customer, "🔐 Your Verification Codes", `Your group order verification codes are:\n${codesMsg}`, "order", "high", {});
    }

    res.json({ success: true, orders: createdOrders });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("crop").populate("customer").populate("farmer").populate("agent").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a customer
router.get("/customer/:id", async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.id })
      .populate("crop")
      .populate("farmer")
      .populate({ path: "deliveryLegs", populate: { path: "agent", select: "name phone vehicle agentType latitude longitude" } })
      .sort({ createdAt: -1 });
    const enriched = await enrichOrdersWithFarmerDetails(orders);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a user (customer or farmer)
router.get("/user/:id", async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ customer: req.params.id }, { farmer: req.params.id }]
    })
      .populate("crop")
      .populate("farmer")
      .populate("customer")
      .populate({ path: "deliveryLegs", populate: { path: "agent", select: "name phone vehicle agentType latitude longitude" } })
      .sort({ createdAt: -1 });
    const enriched = await enrichOrdersWithFarmerDetails(orders);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a farmer
router.get("/farmer/:id", async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.params.id })
      .populate("crop")
      .populate("customer")
      .populate({ path: "deliveryLegs", populate: { path: "agent", select: "name phone vehicle agentType latitude longitude" } })
      .sort({ createdAt: -1 });
    const enriched = await enrichOrdersWithFarmerDetails(orders);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get full order by ID for live tracking and order details
router.get("/:id", async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next();
  }
  try {
    const order = await Order.findById(req.params.id)
      .populate("crop")
      .populate("customer", "name phone email location latitude longitude")
      .populate("farmer", "name phone email location latitude longitude")
      .populate("agent", "name phone email vehicle agentType latitude longitude")
      .populate({ path: "deliveryLegs", populate: { path: "agent", select: "name phone vehicle agentType latitude longitude" } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const enrichedList = await enrichOrdersWithFarmerDetails([order]);
    res.json(enrichedList[0] || order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bill for an order
router.get("/:id/bill", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("crop")
      .populate("customer")
      .populate("farmer")
      .populate("agent");
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({
      _id: order._id,
      billNumber: order.billNumber,
      date: order.createdAt,
      customer: { name: order.customer?.name, phone: order.customer?.phone, address: order.deliveryAddress, latitude: order.customer?.latitude, longitude: order.customer?.longitude },
      farmer: { name: order.farmer?.name, location: order.farmer?.location, phone: order.farmer?.phone, latitude: order.farmer?.latitude, longitude: order.farmer?.longitude },
      agent: order.agent ? { _id: order.agent._id, name: order.agent.name, phone: order.agent.phone, vehicle: order.agent.vehicle, agentType: order.agent.agentType } : null,
      items: [{
        name: order.crop?.name || "Crop",
        quantity: order.quantity,
        unit: order.crop?.unit || "kg",
        unitPrice: order.crop?.price || 0,
        subtotal: order.subtotal
      }],
      crop: order.crop,
      deliveryType: order.deliveryType,
      deliveryCharges: order.deliveryCharges,
      deliveryDistance: order.deliveryDistance,
      deliveryAddress: order.deliveryAddress,
      deliveryLatitude: order.deliveryLatitude || order.customer?.latitude,
      deliveryLongitude: order.deliveryLongitude || order.customer?.longitude,
      agentLatitude: order.agentLatitude,
      agentLongitude: order.agentLongitude,
      platformFee: order.platformFee,
      totalAmount: order.totalAmount,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      status: order.status,
      verificationCode: order.verificationCode,
      estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
      reviewText: order.reviewText
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bill for an order
// ...existing code...

// ─── Agent Update Live Location ───
router.put("/:id/live-location", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: "Latitude and longitude are required" });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { agentCurrentLatitude: lat, agentCurrentLongitude: lng },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    const io = req.app.get("io");
    if (io) io.emit("agent_location_updated", { orderId: order._id, lat, lng });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Customer-Agent Chat & 1-Tap Waste Alert Shortcut ───
router.post("/:id/agent-chat", async (req, res) => {
  try {
    const { id } = req.params;
    const { sender = "customer", senderName = "Customer", text, isWasteAlert = false, wetWasteEstKg } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required." });
    }

    const order = await Order.findById(id).populate("agent customer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    const newMsg = {
      sender,
      senderName,
      text: text.trim(),
      isWasteAlert: Boolean(isWasteAlert),
      timestamp: new Date()
    };

    order.chatMessages = order.chatMessages || [];
    order.chatMessages.push(newMsg);

    // If this is a wet waste alert shortcut
    if (isWasteAlert) {
      order.hasWetWasteDonation = true;
      if (wetWasteEstKg) order.wetWasteEstKg = Number(wetWasteEstKg);
      order.agentWasteAlertSent = true;

      // Also update linked active delivery
      await Delivery.findOneAndUpdate(
        { order: order._id },
        { 
          customerHasWetWaste: true, 
          wetWasteEstKg: order.wetWasteEstKg || 2,
          agentCarryingWasteKit: true
        }
      );
    }

    await order.save();

    // Real-time socket broadcast
    const io = req.app.get("io");
    if (io) {
      io.emit("agent_chat_message", {
        orderId: order._id,
        message: newMsg,
        hasWetWasteDonation: order.hasWetWasteDonation,
        wetWasteEstKg: order.wetWasteEstKg
      });
      io.emit("order_updated", order);
    }

    // Send push / DB notification to agent if assigned
    if (order.agent) {
      const agentId = order.agent._id || order.agent;
      const notifTitle = isWasteAlert ? "🌱 Customer Wet Waste Pickup Alert!" : `💬 New Message from ${senderName}`;
      const notifMsg = isWasteAlert 
        ? `Customer alerted: "${text.trim()}". Bring your vehicle collection kit to accept raw fruit/veggie peels and return to Cold Storage Hub!`
        : `Customer sent: "${text.trim()}" for Order #${order.billNumber}`;

      await notify(req.app, agentId, notifTitle, notifMsg, "delivery", "high", {
        orderId: order._id,
        isWasteAlert: Boolean(isWasteAlert)
      });
    }

    res.json({ success: true, chatMessages: order.chatMessages, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat messages for an order
router.get("/:id/chat-messages", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select("chatMessages hasWetWasteDonation wetWasteEstKg agentWasteAlertSent");
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({
      chatMessages: order.chatMessages || [],
      hasWetWasteDonation: order.hasWetWasteDonation,
      wetWasteEstKg: order.wetWasteEstKg,
      agentWasteAlertSent: order.agentWasteAlertSent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1-Tap shortcut to opt-in for wet waste collection on active order
router.put("/:id/add-waste-pickup", async (req, res) => {
  try {
    const { estKg = 2, notes = "" } = req.body;
    const order = await Order.findById(req.params.id).populate("agent customer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.hasWetWasteDonation = true;
    order.wetWasteEstKg = Number(estKg) || 2;
    order.wetWasteNotes = notes;
    order.agentWasteAlertSent = true;

    const alertMsg = {
      sender: "system",
      senderName: "Rythu Sethu Circular Economy",
      text: `🌱 1-Tap Wet Waste Alert: Customer confirmed they will provide ~${order.wetWasteEstKg}kg segregated raw vegetable & fruit scraps upon delivery. (Carry vehicle collection kit; verify at doorstep; return to Cold Storage Hub).`,
      isWasteAlert: true,
      timestamp: new Date()
    };
    order.chatMessages = order.chatMessages || [];
    order.chatMessages.push(alertMsg);
    await order.save();

    await Delivery.findOneAndUpdate(
      { order: order._id },
      { 
        customerHasWetWaste: true, 
        wetWasteEstKg: order.wetWasteEstKg,
        wetWasteNotes: notes,
        agentCarryingWasteKit: true
      }
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("agent_chat_message", {
        orderId: order._id,
        message: alertMsg,
        hasWetWasteDonation: true,
        wetWasteEstKg: order.wetWasteEstKg
      });
      io.emit("order_updated", order);
    }

    if (order.agent) {
      const agentId = order.agent._id || order.agent;
      await notify(req.app, agentId,
        "🌱 Customer Added Wet-Waste Pickup!",
        `Customer confirmed ~${order.wetWasteEstKg}kg raw fruit/veggie peels for Order #${order.billNumber}. Bring collection kit!`,
        "delivery", "high", { orderId: order._id, wetWasteEstKg: order.wetWasteEstKg }
      );
    }

    res.json({ success: true, message: "Wet-waste pickup added to delivery!", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Securely complete order via OTP
router.put("/:id/complete", async (req, res) => {
  try {
    const { otp, agentId } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "delivered") return res.status(400).json({ error: "Order already delivered" });
    
    // Validate OTP
    if (order.verificationCode !== otp) {
      return res.status(400).json({ error: "Invalid verification code. Please check with customer." });
    }

    // Update order status securely
    order.status = "delivered";
    order.timeline.push({ status: "delivered", note: "Delivered securely via OTP verification" });
    
    // Agent Payout
    if (order.agent && !order.isSettledWithAgent) {
      const agentUser = await User.findById(order.agent);
      let agentPayout = order.agentEarnings || order.deliveryCharges;
      
      if (agentUser && agentUser.agentType === "ridealong") {
        agentPayout = (order.deliveryCharges || 0) * 0.50;
        const platformShare = (order.deliveryCharges || 0) * 0.10;
        const customerRefund = (order.deliveryCharges || 0) * 0.40;
        
        await Order.findByIdAndUpdate(order._id, { $inc: { adminRevenue: platformShare } });
        if (order.customer) {
          await User.findByIdAndUpdate(order.customer, { $inc: { walletBalance: customerRefund } });
        }
      }

      await User.findByIdAndUpdate(order.agent, { $inc: { walletBalance: agentPayout } });
      if (order.paymentMode === "cod") {
        await User.findByIdAndUpdate(order.agent, { $inc: { cashInHand: order.totalAmount } });
      }
      order.isSettledWithAgent = true;
    }

    // Deliver points to customer
    if (order.customer && order.pointsEarned && !order.pointsDistributed) {
      await User.findByIdAndUpdate(order.customer, { $inc: { rewardPoints: order.pointsEarned } });
      order.pointsDistributed = true;
    }
    
    // Performance, Fast Delivery Incentive & Late Penalty Engine
    const now = new Date();
    const deadline = order.estimatedDeliveryDeadline || new Date(new Date(order.createdAt).getTime() + (order.estimatedDeliveryMinutes || 35) * 60 * 1000);
    const diffMinutes = Math.round((deadline.getTime() - now.getTime()) / (60 * 1000));
    const isEarly = diffMinutes >= 0;
    const isLate = diffMinutes < 0;

    let speedBonusPoints = 0;
    let speedBonusCash = 0;
    let latePenaltyPoints = 0;
    let latePenaltyDeduction = 0;
    let scoreChange = 0;

    if (isEarly) {
      // Fast / On-time Delivery Bonus
      speedBonusPoints = Math.min(50, Math.max(20, 20 + diffMinutes * 2));
      speedBonusCash = Math.min(30, Math.max(10, Math.round(diffMinutes * 1.5)));
      scoreChange = Math.min(5, Math.max(2, Math.round(diffMinutes / 5) + 2));

      if (order.agent) {
        await User.findByIdAndUpdate(order.agent, {
          $inc: {
            rewardPoints: speedBonusPoints,
            experiencePoints: speedBonusPoints,
            walletBalance: speedBonusCash,
            deliveryScore: scoreChange
          }
        });

        await notify(req.app, order.agent,
          "⚡ Lightning Fast Delivery Bonus!",
          `Delivered ${diffMinutes} mins early! Received +${speedBonusPoints} Speed Points, +${scoreChange} Delivery Score, and ₹${speedBonusCash} Instant Wallet Tip!`,
          "reward", "high", { orderId: order._id, bonusPoints: speedBonusPoints, bonusCash: speedBonusCash }
        );
      }
    } else {
      // Late Delivery Penalty
      const lateMins = Math.abs(diffMinutes);
      const isDisputed = order.deliveryPerformance?.isDisputed;

      if (!isDisputed) {
        latePenaltyPoints = Math.min(50, Math.max(10, 10 + Math.floor(lateMins / 5) * 5));
        scoreChange = -Math.min(10, Math.max(2, Math.floor(lateMins / 10) * 2));
        if (lateMins > 15) latePenaltyDeduction = 20;

        if (order.agent) {
          const agentUser = await User.findById(order.agent);
          const newPoints = Math.max(0, (agentUser.rewardPoints || 0) - latePenaltyPoints);
          const newScore = Math.max(30, (agentUser.deliveryScore || 100) + scoreChange);
          const walletDeduction = latePenaltyDeduction > 0 ? { $inc: { walletBalance: -latePenaltyDeduction } } : {};

          await User.findByIdAndUpdate(order.agent, {
            rewardPoints: newPoints,
            deliveryScore: newScore,
            ...walletDeduction
          });

          await notify(req.app, order.agent,
            "⚠️ Late Delivery Points Deduction",
            `Order was delivered ${lateMins} mins past deadline. Points reduced by -${latePenaltyPoints} pts and Delivery Score updated (${scoreChange}).`,
            "delivery", "high", { orderId: order._id, penaltyPoints: latePenaltyPoints }
          );
        }
      }
    }

    order.deliveryPerformance = {
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
      delayReason: order.deliveryPerformance?.delayReason || "",
      isDisputed: order.deliveryPerformance?.isDisputed || false
    };

    await order.save();

    // Also update Delivery document
    await Delivery.findOneAndUpdate(
      { order: order._id, status: { $ne: "delivered" } },
      { 
        status: "delivered", 
        deliveredAt: now,
        deliveryPerformance: order.deliveryPerformance
      }
    );

    res.json({ success: true, message: "Order delivered successfully.", performance: order.deliveryPerformance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Farm Gate Pickup: Farmer Confirms Payment & Generates/Reveals Handover OTP ───
router.post("/:id/farm-payment-received", async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findById(req.params.id).populate("crop customer farmer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Generate verificationCode if missing
    if (!order.verificationCode) {
      order.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    order.paymentStatus = "paid";
    order.paymentMode = paymentMethod || order.paymentMode || "cod";
    order.paidAtFarm = true;
    order.timeline.push({ 
      status: "payment_received", 
      note: `Farmer confirmed payment at farm gate via ${order.paymentMode.toUpperCase()}. Handover OTP generated.` 
    });

    await order.save();

    // Notify customer
    if (order.customer?._id) {
      await notify(
        req.app, 
        order.customer._id, 
        "🎉 Farm Gate Payment Confirmed!", 
        `Farmer confirmed payment for ${order.crop?.name || "produce"}. Tell OTP ${order.verificationCode} or enter it on your tracking screen to complete pickup.`,
        "order", 
        "high", 
        { orderId: order._id, verificationCode: order.verificationCode }
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("order_updated", order);
    }

    res.json({ 
      success: true, 
      verificationCode: order.verificationCode,
      message: `Payment confirmed! Share this 6-digit OTP with the customer: ${order.verificationCode}`,
      order 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Farm Gate Pickup: Customer / Farmer Confirms Handover via Farmer OTP ───
router.post("/:id/farm-pickup-complete", async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id).populate("crop customer farmer");
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status === "delivered") {
      return res.status(400).json({ error: "Order is already marked as delivered." });
    }

    if (!otp || order.verificationCode !== otp.toString().trim()) {
      return res.status(400).json({ error: "Invalid verification code. Please check the OTP told by the farmer." });
    }

    order.status = "delivered";
    order.paymentStatus = "paid";
    order.deliveredAt = new Date();
    order.timeline.push({ 
      status: "delivered", 
      note: "Farm gate handover confirmed securely via farmer OTP." 
    });

    // Deliver points to customer
    if (order.customer?._id && order.pointsEarned && !order.pointsDistributed) {
      await User.findByIdAndUpdate(order.customer._id, { $inc: { rewardPoints: order.pointsEarned } });
      order.pointsDistributed = true;
    }

    // Deliver trust points to farmer
    if (order.farmer?._id) {
      await User.findByIdAndUpdate(order.farmer._id, { $inc: { rewardPoints: 10, trustScore: 2 } });
    }

    // Credit farmer pending settlement for offline buy at farm using order price
    const farmerAmount = (order.subtotal || order.totalAmount) - (order.platformFee || 0);
    if (order.farmer?._id && !order.isSettledWithFarmer) {
      await User.findByIdAndUpdate(order.farmer._id, { $inc: { pendingSettlement: farmerAmount } });
      order.isSettledWithFarmer = true;
      order.adminRevenue = order.platformFee || 0;
    }

    await order.save();

    // Blockchain logging
    if (order.crop) {
      await addBlockToChain(
        order._id, 
        order.crop._id, 
        "Direct Farm Gate Handover Confirmed", 
        `Quantity: ${order.quantity}`, 
        order.customer?.name || "Customer", 
        order.deliveryAddress || "Farm Gate Pickup"
      ).catch(console.error);
    }

    // Socket notification
    const io = req.app.get("io");
    if (io) {
      io.emit("order_updated", order);
    }

    if (order.customer?._id) {
      await notify(
        req.app, 
        order.customer._id, 
        "🌾 Farm Handover Verified!", 
        `Your direct farm pickup for ${order.crop?.name || "produce"} is verified! Thank you for supporting the farmer directly.`,
        "order", 
        "normal"
      );
    }

    res.json({ success: true, message: "Farm pickup confirmed successfully!", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: { timeline: { status, note: note || `Status changed to ${status}` } }
      },
      { new: true }
    );

    // ─── Blockchain Logging ───
    if (order) {
      await addBlockToChain(
        order._id, 
        order.crop, 
        `Status Updated: ${status}`, 
        note || `Status changed to ${status}`, 
        "System/Farmer", 
        "Platform"
      );
    }

    // If cancelled, restore stock
    if (status === "cancelled") {
      const original = await Order.findById(req.params.id);
      if (original?.crop && original?.quantity) {
        await Crop.findByIdAndUpdate(original.crop, {
          $inc: { quantity: Number(original.quantity) },
          isAvailable: true
        });
      }
    }

    const fetchedOrder = await Order.findById(req.params.id);

    // If picked up, settle with farmer
    if (status === "picked_up" && fetchedOrder && fetchedOrder.farmer) {
      if (!fetchedOrder.isSettledWithFarmer) {
        const farmerAmount = fetchedOrder.subtotal - fetchedOrder.platformFee;
        await User.findByIdAndUpdate(fetchedOrder.farmer, { $inc: { pendingSettlement: farmerAmount } });
        await Order.findByIdAndUpdate(fetchedOrder._id, { isSettledWithFarmer: true, adminRevenue: fetchedOrder.platformFee });
      }
    }

    // If delivered, handle agent payout & COD cash holding
    if (status === "delivered" && fetchedOrder && fetchedOrder.agent) {
      if (!fetchedOrder.isSettledWithAgent) {
        const agentUser = await User.findById(fetchedOrder.agent);
        let agentPayout = fetchedOrder.agentEarnings || fetchedOrder.deliveryCharges;
        
        if (agentUser && agentUser.agentType === "ridealong") {
          agentPayout = (fetchedOrder.deliveryCharges || 0) * 0.50;
          const platformShare = (fetchedOrder.deliveryCharges || 0) * 0.10;
          const customerRefund = (fetchedOrder.deliveryCharges || 0) * 0.40;
          
          await Order.findByIdAndUpdate(fetchedOrder._id, { $inc: { adminRevenue: platformShare } });
          if (fetchedOrder.customer) {
            await User.findByIdAndUpdate(fetchedOrder.customer, { $inc: { walletBalance: customerRefund } });
          }
        }
        
        await User.findByIdAndUpdate(fetchedOrder.agent, { $inc: { walletBalance: agentPayout } });
        
        // If COD, the agent holds the total cash for this order (owed to admin)
        if (fetchedOrder.paymentMode === "cod") {
          await User.findByIdAndUpdate(fetchedOrder.agent, { $inc: { cashInHand: fetchedOrder.totalAmount } });
        }
        
        // Agent gets experience and delivery score
        await User.findByIdAndUpdate(fetchedOrder.agent, { 
          $inc: { experiencePoints: 10, deliveryScore: 5 } 
        });
        await Order.findByIdAndUpdate(fetchedOrder._id, { isSettledWithAgent: true });
      }
    }

    // Emit real-time event
    const io = req.app.get("io");
    if (io) io.emit("order_updated", order);

    // Notify customer about status change
    const updatedOrder = await Order.findById(req.params.id);
    if (updatedOrder && updatedOrder.customer) {
      await notify(req.app, updatedOrder.customer,
        "📦 Order Update",
        `Your order status has been updated to: ${status.replace("_", " ")}`,
        "order", "normal", { orderId: req.params.id }
      );
    }

    // Notify admin about status change
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await notify(req.app, admin._id,
        "📋 Order Status Changed",
        `Order #${updatedOrder?.billNumber || req.params.id.substring(0, 8)} → ${status.replace("_", " ")}`,
        "order", "low", { orderId: req.params.id }
      );
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Customer Cancel Order ───
router.put("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "delivered") return res.status(400).json({ error: "Delivered orders cannot be cancelled." });
    if (order.status === "cancelled") return res.status(400).json({ error: "Order is already cancelled." });

    const customer = await User.findById(order.customer);
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const diffMs = now - orderTime;
    const isLateCancellation = diffMs > 2 * 60 * 1000; // > 2 minutes
    
    let penaltyFee = 0;
    let message = "Order cancelled successfully.";

    // Restore stock
    if (order.crop && order.quantity) {
      await Crop.findByIdAndUpdate(order.crop, {
        $inc: { quantity: Number(order.quantity), totalOrders: -1 },
        isAvailable: true
      });
    }

    if (isLateCancellation) {
      penaltyFee = Math.round((order.totalAmount || 0) * 0.05); // 5% penalty
      message = `Order cancelled. A late cancellation fee of ₹${penaltyFee} was applied since 2 minutes passed.`;
      
      // If payment was already made via wallet, refund total minus penalty
      if (order.paymentStatus === "paid" && order.paymentMode === "wallet") {
        const refundAmount = Math.max(0, order.totalAmount - penaltyFee);
        if (customer) {
          await User.findByIdAndUpdate(order.customer, { $inc: { walletBalance: refundAmount } });
        }
      } 
      // If it was COD, deduct penalty from customer's reward points or wallet
      else if (order.paymentMode === "cod" && customer) {
        if (customer.walletBalance >= penaltyFee) {
          await User.findByIdAndUpdate(order.customer, { $inc: { walletBalance: -penaltyFee } });
        } else {
          // Fallback: Deduct reward points (1 point = 1 rupee equivalent penalty)
          await User.findByIdAndUpdate(order.customer, { $inc: { rewardPoints: -penaltyFee } });
        }
      }
    } else {
      // Free cancellation, full refund
      if (order.paymentStatus === "paid" && order.paymentMode === "wallet" && customer) {
        await User.findByIdAndUpdate(order.customer, { $inc: { walletBalance: order.totalAmount } });
      }
    }

    // Update order status
    order.status = "cancelled";
    order.timeline.push({ status: "cancelled", note: message, timestamp: new Date() });
    await order.save();

    // Also cancel any linked Delivery records
    await Delivery.updateMany(
      { order: order._id, status: { $ne: "delivered" } },
      { status: "cancelled" }
    );

    // Notify customer
    if (order.customer) {
      await notify(req.app, order.customer,
        "🚫 Order Cancelled",
        message,
        "order", "high", { orderId: order._id }
      );
    }

    // Notify farmer
    if (order.farmer) {
      await notify(req.app, order.farmer,
        "🚫 Order Cancelled by Customer",
        `Order #${order.billNumber || order._id.toString().slice(-6)} was cancelled by the customer. Stock has been restored.`,
        "order", "normal", { orderId: order._id }
      );
    }

    // Notify assigned agent if any
    if (order.agent) {
      await notify(req.app, order.agent,
        "🚫 Delivery Cancelled",
        `Delivery task for order #${order.billNumber || order._id.toString().slice(-6)} has been cancelled.`,
        "delivery", "normal", { orderId: order._id }
      );
    }

    // Fraud Detection Engine: Flag accounts with >5 cancellations
    if (customer) {
      customer.cancelledOrdersCount = (customer.cancelledOrdersCount || 0) + 1;
      if (customer.cancelledOrdersCount >= 5) {
        customer.strikes = (customer.strikes || 0) + 1;
        customer.trustScore = Math.max(0, (customer.trustScore || 85) - 10);
        
        await notify(req.app, customer._id,
          "⚠️ Fraud Detection Alert",
          "Your account has been flagged for excessive cancellations (>5). This negatively impacts your trust score and may lead to account suspension.",
          "system", "high"
        );
        
        const admin = await User.findOne({ role: "admin" });
        if (admin) {
          await notify(req.app, admin._id,
            "🚨 Fraud Alert: High Cancellations",
            `User ${customer.name} (${customer.email}) has reached ${customer.cancelledOrdersCount} cancelled orders.`,
            "system", "high"
          );
        }
      }
      await customer.save();
    }

    const io = req.app.get("io");
    if (io) io.emit("order_updated", order);

    res.json({ success: true, message, order });
  } catch (err) {
    console.error("Cancel Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Product Verification by Agent ───
router.put("/:id/verify-product", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        agentVerified: true,
        $push: { timeline: { status: "verified", note: "Delivery agent verified product matches listing" } }
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Notify customer that product was verified
    if (order.customer) {
      await notify(req.app, order.customer,
        "✅ Product Verified",
        "The delivery agent has confirmed that your product matches the listing. Your order is on its way!",
        "delivery", "normal", { orderId: order._id }
      );
    }

    const io = req.app.get("io");
    if (io) io.emit("order_updated", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Agent Reports Product Mismatch ───
router.put("/:id/report-mismatch", async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "Report reason is required" });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        isReported: true,
        agentReportReason: reason,
        reportResolution: "pending",
        $push: { timeline: { status: "reported", note: `Agent reported product mismatch: ${reason}` } }
      },
      { new: true }
    ).populate("crop").populate("farmer");

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Notify ALL admins about the mismatch report
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await notify(req.app, admin._id,
        "🚨 Product Mismatch Report",
        `Agent reported a mismatch for order #${order.billNumber}: ${reason}. Farmer: ${order.farmer?.name || "Unknown"}. Product: ${order.productSnapshot?.name || order.crop?.name || "Unknown"}.`,
        "report", "urgent", { orderId: order._id, farmerId: order.farmer?._id }
      );
    }

    // Notify the farmer about the report
    if (order.farmer) {
      await notify(req.app, order.farmer._id || order.farmer,
        "⚠️ Product Quality Report",
        `A delivery agent has reported a product mismatch for your order #${order.billNumber}. Reason: ${reason}. Admin will review this.`,
        "report", "high", { orderId: order._id }
      );
    }

    const io = req.app.get("io");
    if (io) io.emit("order_reported", order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Customer Post-Purchase Review & Rating (Farm Buy vs Delivery Buy) ───
router.post("/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      farmRating,
      farmerRating,
      platformRating,
      deliveryRating,
      rating,
      comment,
      reviewText,
      reviewFeedback,
      buyType,
      userId
    } = req.body;

    const order = await Order.findById(id).populate("crop").populate("farmer");
    if (!order) return res.status(404).json({ error: "Order not found." });

    const numFarmerRating = Math.max(1, Math.min(5, Number(farmerRating || rating || 5)));
    const numFarmRating = Math.max(1, Math.min(5, Number(farmRating || numFarmerRating)));
    const numPlatformRating = Math.max(1, Math.min(5, Number(platformRating || 5)));
    const numDeliveryRating = deliveryRating ? Math.max(1, Math.min(5, Number(deliveryRating))) : 0;
    const feedbackText = reviewFeedback || comment || reviewText || "";

    const avgOverall = numDeliveryRating > 0
      ? (numFarmRating + numFarmerRating + numPlatformRating + numDeliveryRating) / 4
      : (numFarmRating + numFarmerRating + numPlatformRating) / 3;

    const sentiment = avgOverall >= 3.8 ? "Positive" : avgOverall >= 2.8 ? "Neutral" : "Negative";
    const sentimentScore = avgOverall >= 3.8 ? 0.9 : avgOverall >= 2.8 ? 0.5 : 0.1;

    // Save Order review fields
    order.farmRating = numFarmRating;
    order.farmerRating = numFarmerRating;
    order.platformRating = numPlatformRating;
    if (numDeliveryRating > 0) order.deliveryRating = numDeliveryRating;
    order.reviewText = feedbackText;
    order.reviewFeedback = feedbackText;
    order.sentimentScore = sentimentScore;
    order.reviewSentiment = sentiment;
    order.buyType = buyType || (order.deliveryType === "farm_pickup" || order.deliveryType === "pickup" || !order.agent ? "farm" : "delivery");
    order.hasReviewed = true;
    order.reviewGiven = true;
    order.reviewCreatedAt = new Date();
    await order.save();

    // Create Review record
    if (order.crop && (order.customer || userId)) {
      await Review.create({
        user: order.customer?._id || order.customer || userId,
        crop: order.crop._id || order.crop,
        farmer: order.farmer?._id || order.farmer,
        rating: Math.round(numFarmerRating),
        comment: feedbackText
      });
    }

    // Update Crop average rating
    if (order.crop) {
      const cropId = order.crop._id || order.crop;
      const cropReviews = await Review.find({ crop: cropId });
      const avgCropRating = cropReviews.length > 0 
        ? cropReviews.reduce((sum, r) => sum + r.rating, 0) / cropReviews.length 
        : numFarmerRating;
      await Crop.findByIdAndUpdate(cropId, { rating: Math.round(avgCropRating * 10) / 10 });
    }

    // Update Farmer trust score and rating (composite of farmer & farm ratings)
    if (order.farmer) {
      const farmerUserId = order.farmer._id || order.farmer;
      const farmerDoc = await Farmer.findOne({ user: farmerUserId });
      if (farmerDoc) {
        const farmerReviews = await Review.find({ farmer: farmerUserId });
        const avgFarmerRating = farmerReviews.length > 0
          ? farmerReviews.reduce((sum, r) => sum + r.rating, 0) / farmerReviews.length
          : numFarmerRating;

        farmerDoc.rating = Math.round(avgFarmerRating * 10) / 10;
        farmerDoc.trustScore = Math.min(100, Math.max(20, Math.round((farmerDoc.trustScore || 85) + (numFarmerRating >= 4 ? 3 : -3))));
        await farmerDoc.save();
        await User.findByIdAndUpdate(farmerUserId, { trustScore: farmerDoc.trustScore });
      }
    }

    // Update Delivery Agent rating if provided
    if (numDeliveryRating > 0 && order.agent) {
      const Agent = (await import("../models/Agent.js")).default;
      const agentDoc = await Agent.findOne({ user: order.agent });
      if (agentDoc) {
        const curR = agentDoc.trustScore?.rating || 5.0;
        const curCount = agentDoc.trustScore?.totalRatings || 1;
        const nextR = ((curR * curCount) + numDeliveryRating) / (curCount + 1);
        if (!agentDoc.trustScore) agentDoc.trustScore = {};
        agentDoc.trustScore.rating = Math.round(nextR * 10) / 10;
        agentDoc.trustScore.totalRatings = curCount + 1;
        agentDoc.trustScore.score = Math.round((nextR / 5) * 100);
        await agentDoc.save();
      }
    }

    // Reward customer +15 reward points for submitting review
    const customerId = order.customer?._id || order.customer || userId;
    if (customerId) {
      await User.findByIdAndUpdate(customerId, { $inc: { rewardPoints: 15 } });
    }

    // Notify farmer
    if (order.farmer) {
      await notify(
        req.app,
        order.farmer._id || order.farmer,
        `⭐ New ${numFarmerRating}-Star Purchase Review!`,
        `Customer left review for ${order.crop?.name || "your produce"} (Farm: ${numFarmRating}★, Farmer: ${numFarmerRating}★): "${feedbackText || 'Excellent quality'}".`,
        "rating",
        "normal",
        { orderId: order._id, rating: numFarmerRating, farmRating: numFarmRating }
      );
    }

    const io = req.app.get("io");
    if (io) io.emit("order_reviewed", { orderId: order._id, rating: numFarmerRating, sentiment, buyType: order.buyType });

    res.json({
      success: true,
      message: "Review submitted successfully! Thank you for supporting our farmers and fair-trade ecosystem.",
      order
    });
  } catch (error) {
    console.error("Review submission error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Assign delivery agent to order
router.put("/:id/assign-agent", async (req, res) => {
  try {
    const { agentId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        agent: agentId,
        status: "assigned",
        $push: { timeline: { status: "assigned", note: "Delivery agent assigned" } }
      },
      { new: true }
    ).populate("crop").populate("customer").populate("farmer").populate("agent");

    const io = req.app.get("io");
    if (io) {
      io.emit("order_updated", order);
      io.emit("delivery_assigned", order);
    }

    // Notify agent
    await notify(req.app, agentId,
      "🚚 New Delivery Assigned",
      `You have been assigned a new delivery: ${order.crop?.name || "Order"} — ${order.quantity} ${order.crop?.unit || "kg"}`,
      "delivery", "high", { orderId: order._id }
    );

    // Notify customer
    if (order.customer) {
      await notify(req.app, order.customer._id,
        "🚚 Agent Assigned",
        `A delivery agent (${order.agent?.name || "Agent"}) has been assigned to your order. Your product is being prepared for delivery!`,
        "delivery", "normal", { orderId: order._id }
      );
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Customer Submits Review ───
router.put("/:id/review", async (req, res) => {
  try {
    const { reviewText } = req.body;
    if (!reviewText) return res.status(400).json({ error: "Review text required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Advanced Internal Sentiment Analysis (TF-IDF & N-Grams logic)
    const text = reviewText.toLowerCase();
    
    // Weighted Vocabulary (simulating TF-IDF weights)
    const posWords = { "excellent": 0.5, "good": 0.2, "great": 0.3, "fast": 0.3, "fresh": 0.4, "amazing": 0.5, "quick": 0.2, "polite": 0.3, "helpful": 0.3, "perfect": 0.5 };
    const negWords = { "bad": -0.3, "slow": -0.3, "late": -0.4, "rotten": -0.6, "rude": -0.5, "poor": -0.3, "terrible": -0.6, "worst": -0.7, "delayed": -0.4, "stale": -0.5 };
    const toxicWords = { "scam": -1.0, "fraud": -1.0, "stole": -1.0, "fake": -0.9, "cheat": -0.9, "abusive": -1.0 };
    
    // Bi-gram Modifiers (N-Grams)
    const modifiers = { "not": -1, "very": 1.5, "extremely": 2.0, "never": -1, "too": 1.2 };

    let score = 0;
    let toxicFlag = false;
    const words = text.split(/[\s,.-]+/);

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      let weight = 0;

      if (posWords[word]) weight = posWords[word];
      else if (negWords[word]) weight = negWords[word];
      else if (toxicWords[word]) {
        weight = toxicWords[word];
        toxicFlag = true;
      }

      // Check previous word for Bi-gram modifiers (e.g. "not good" = -1 * 0.2 = -0.2)
      if (i > 0 && modifiers[words[i-1]] && weight !== 0) {
        weight *= modifiers[words[i-1]];
      }

      score += weight;
    }

    // Apply exponential scaling for extreme reviews (sigmoid-like clamp)
    score = Math.tanh(score); // Maps any score fluidly between -1 and 1

    let sentiment = "Neutral";
    if (score > 0.2) sentiment = "Positive";
    else if (score < -0.2) sentiment = "Negative";

    // Trust score adjustment scaled by severity
    let trustAdjustment = 0;
    if (score > 0.4) trustAdjustment = Math.ceil(score * 4); // Up to +4
    if (score < -0.3) trustAdjustment = Math.floor(score * 5); // Up to -5
    if (toxicFlag) trustAdjustment = -15; // Severe penalty for toxic words

    order.reviewText = reviewText;
    order.sentimentScore = score;
    order.reviewSentiment = sentiment;
    await order.save();

    // Apply trust adjustment to Farmer and Agent
    if (trustAdjustment !== 0) {
      if (order.farmer) {
        await User.findByIdAndUpdate(order.farmer, { $inc: { trustScore: trustAdjustment } });
      }
      if (order.agent) {
        await User.findByIdAndUpdate(order.agent, { $inc: { trustScore: trustAdjustment } });
      }
    }

    res.json({ message: "Review submitted", sentiment, trustAdjustment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import Block from "../models/Block.js";
// Get blockchain history for an order
router.get("/blockchain/:id", async (req, res) => {
  try {
    const chain = await Block.find({ orderId: req.params.id }).sort({ timestamp: 1 });
    res.json(chain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Multi-Location Order Creation ───
router.post("/create-multi", async (req, res) => {
  try {
    const { destinations, customer, paymentMode } = req.body;
    // destinations: [{ crop, quantity, deliveryAddress, deliveryLatitude, deliveryLongitude, totalAmount, ... }]
    if (!destinations || !destinations.length) return res.status(400).json({ error: "Destinations required" });

    const groupId = "MLG-" + Date.now().toString(36).toUpperCase();
    const createdOrders = [];

    for (const dest of destinations) {
      const cropDoc = await Crop.findById(dest.crop);
      if (!cropDoc || cropDoc.quantity < Number(dest.quantity)) continue; // skip invalid or out of stock

      const productSnapshot = {
        name: cropDoc.name,
        category: cropDoc.category,
        quantity: Number(dest.quantity),
        unit: cropDoc.unit || "kg",
        price: cropDoc.price,
        image: cropDoc.image || "",
        location: cropDoc.location || ""
      };

      const order = await Order.create({
        ...dest,
        customer,
        paymentMode,
        status: "pending",
        multiLocationGroupId: groupId,
        productSnapshot,
        timeline: [{ status: "pending", note: "Multi-location order placed" }]
      });
      createdOrders.push(order);
      // Ingest upcoming real order into Continuous ML Training Pipeline
      recordOrderEvent(order, req.app?.get?.("io"));
    }

    if (createdOrders.length === 0) {
      return res.status(400).json({ error: "Failed to create any orders due to stock unavailability." });
    }

    // Auto-assign agent for this group
    await autoAssignMultiDelivery(req.app, groupId, createdOrders);

    res.json({ message: "Multi-location orders created", groupId, orders: createdOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function autoAssignMultiDelivery(app, groupId, orders) {
  try {
    if (!orders || orders.length === 0) return;
    
    // Pick the first order's pickup location as the starting point
    let pickupLat = orders[0].pickupLatitude || 0;
    let pickupLng = orders[0].pickupLongitude || 0;
    
    if (pickupLat === 0) {
      const crop = await Crop.findById(orders[0].crop);
      pickupLat = crop?.latitude || 0;
      pickupLng = crop?.longitude || 0;
    }

    let agents = await User.find({ role: "agent", isActive: true });
    if (!agents.length) {
      agents = await User.find({ role: "agent" });
    }
    if (!agents.length) return;

    let bestAgent = null;
    let minScore = Infinity;

    for (const agent of agents) {
      const dist = haversineDistance(agent.latitude || 0, agent.longitude || 0, pickupLat, pickupLng);
      const score = (dist * 10) - (agent.deliveryScore || 0);
      if (score < minScore) {
        minScore = score;
        bestAgent = agent;
      }
    }

    if (!bestAgent) return;

    const dropoffs = orders.map(o => ({
      location: o.deliveryAddress,
      latitude: o.deliveryLatitude,
      longitude: o.deliveryLongitude,
      status: "pending",
      orderIds: [o._id]
    }));

    const delivery = await Delivery.create({
      agent: bestAgent._id,
      pickupLocation: orders[0].pickupAddress || "Farmer Location",
      pickupLatitude: pickupLat,
      pickupLongitude: pickupLng,
      vehicleType: "bike",
      dropoffs,
      trackingCode: "TRK-ML-" + Date.now().toString(36).toUpperCase()
    });

    for (const o of orders) {
      await Order.findByIdAndUpdate(o._id, { 
        agent: bestAgent._id, 
        status: "assigned",
        $push: { timeline: { status: "assigned", note: `Multi-location delivery assigned to ${bestAgent.name}.` } }
      });
    }

    const io = app.get("io");
    if (io) {
      io.emit("delivery_assigned", delivery);
    }
    
    await notify(app, bestAgent._id, 
      "🚀 New Multi-Drop Delivery!", 
      `You have been assigned a delivery with ${orders.length} dropoffs.`,
      "delivery", "high", { deliveryId: delivery._id }
    );
  } catch (err) {
    console.error("Auto assign multi-delivery failed:", err);
  }
}
// Submit order review
router.post("/:id/review", protect, async (req, res) => {
  try {
    const { reviewText, reviewSentiment, sentimentScore, agentRating, farmerRating, platformRating } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.reviewText = reviewText;
    order.reviewSentiment = reviewSentiment;
    order.sentimentScore = sentimentScore;
    
    // Agent score update
    if (order.agent && agentRating) {
      await User.findByIdAndUpdate(order.agent, { $inc: { deliveryScore: agentRating >= 4 ? 5 : -5 } });
    }

    // Save Farmer Review and Trigger Real-Time Trust Score Update
    if (order.farmer && farmerRating) {
      await Review.create({
        user: req.user._id,
        crop: order.crop,
        farmer: order.farmer,
        rating: farmerRating,
        comment: reviewText || ""
      });
      // Automatically triggers real-time Trust Score recalculation
      await calculateTrustScore(order.farmer);
    }

    await order.save();
    res.json({ success: true, message: "Review submitted and Trust Score updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
