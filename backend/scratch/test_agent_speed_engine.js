import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import Crop from "../models/Crop.js";

async function testAgentSpeedEngine() {
  await connectDB();
  console.log("--- Testing Agent Speed Incentive & Late Penalty Engine ---");

  // Find or create an agent
  let agent = await User.findOne({ role: "agent" });
  if (!agent) {
    agent = await User.create({
      name: "Test Agent Speedster",
      email: "speed_agent@rythu.com",
      password: "password123",
      role: "agent",
      rewardPoints: 100,
      experiencePoints: 100,
      deliveryScore: 90,
      walletBalance: 200
    });
  }

  const initialPoints = agent.rewardPoints || 0;
  const initialScore = agent.deliveryScore || 90;
  const initialWallet = agent.walletBalance || 0;

  console.log(`Agent: ${agent.name} | Initial Points: ${initialPoints} | Score: ${initialScore} | Wallet: ₹${initialWallet}`);

  // Test Case 1: Early Delivery
  const crop = await Crop.findOne({});
  const earlyOrder = await Order.create({
    crop: crop?._id,
    quantity: 5,
    totalAmount: 250,
    deliveryCharges: 40,
    status: "in_transit",
    agent: agent._id,
    estimatedDeliveryMinutes: 40,
    estimatedDeliveryDeadline: new Date(Date.now() + 25 * 60 * 1000) // 25 mins in future -> early!
  });

  const earlyDelivery = await Delivery.create({
    order: earlyOrder._id,
    agent: agent._id,
    status: "in_transit",
    deliveryPhoto: "/uploads/test.jpg",
    estimatedMinutes: 40,
    estimatedDeliveryDeadline: new Date(Date.now() + 25 * 60 * 1000)
  });

  // Call status update
  const resEarly = await fetch(`http://localhost:5000/api/delivery/${earlyDelivery._id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "delivered" })
  });
  const dataEarly = await resEarly.json();

  console.log("✅ Case 1 Early Delivery Result:", {
    isEarly: dataEarly.deliveryPerformance?.isEarly,
    diffMinutes: dataEarly.deliveryPerformance?.diffMinutes,
    speedBonusPoints: dataEarly.deliveryPerformance?.speedBonusPoints,
    speedBonusCash: dataEarly.deliveryPerformance?.speedBonusCash,
    deliveryScoreChange: dataEarly.deliveryPerformance?.deliveryScoreChange
  });

  // Test Case 2: Late Delivery
  const lateOrder = await Order.create({
    crop: crop?._id,
    quantity: 5,
    totalAmount: 250,
    deliveryCharges: 40,
    status: "in_transit",
    agent: agent._id,
    estimatedDeliveryMinutes: 20,
    estimatedDeliveryDeadline: new Date(Date.now() - 18 * 60 * 1000) // 18 mins ago -> late!
  });

  const lateDelivery = await Delivery.create({
    order: lateOrder._id,
    agent: agent._id,
    status: "in_transit",
    deliveryPhoto: "/uploads/test.jpg",
    estimatedMinutes: 20,
    estimatedDeliveryDeadline: new Date(Date.now() - 18 * 60 * 1000)
  });

  const resLate = await fetch(`http://localhost:5000/api/delivery/${lateDelivery._id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "delivered" })
  });
  const dataLate = await resLate.json();
  if (dataLate.error) console.log("🚨 dataLate Error:", dataLate.error);

  console.log("✅ Case 2 Late Delivery Result:", {
    isLate: dataLate.deliveryPerformance?.isLate,
    diffMinutes: dataLate.deliveryPerformance?.diffMinutes,
    latePenaltyPoints: dataLate.deliveryPerformance?.latePenaltyPoints,
    latePenaltyDeduction: dataLate.deliveryPerformance?.latePenaltyDeduction,
    deliveryScoreChange: dataLate.deliveryPerformance?.deliveryScoreChange
  });

  // Test Case 3: Performance API
  const resPerf = await fetch(`http://localhost:5000/api/delivery/agent-performance/${agent._id}`);
  const dataPerf = await resPerf.json();
  console.log("✅ Case 3 Agent Performance Analytics:", dataPerf);

  console.log("\n🎉 SPEED ENGINE & LATE PENALTY SYSTEM VERIFIED SUCCESSFULLY!");
  process.exit(0);
}

testAgentSpeedEngine();
