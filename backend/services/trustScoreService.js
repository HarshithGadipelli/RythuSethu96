import Farmer from "../models/Farmer.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Crop from "../models/Crop.js";
import Review from "../models/Review.js";

/**
 * Universal Trust Score & Points Engine
 * 
 * Computes dynamic, transparent trust scores (0–100) for all ecosystem participants:
 * 1. Farmers: Verification, customer ratings, fulfillment, organic & contact-based pesticide adoption, experience, profile completeness.
 * 2. Delivery Agents: On-time delivery ETA compliance, completion rate, OTP accuracy, doorstep circular wet-waste compliance, and ratings.
 * 3. Customers: Payment integrity, order loyalty, reviews, and circular wet-waste donations (+15 Green reward points each).
 */

// Universal grade thresholds
export const GRADES = [
  { min: 90, grade: "Platinum", emoji: "🏆", label: "Exceptional", color: "#10b981" },
  { min: 75, grade: "Gold",     emoji: "🥇", label: "Highly Trusted", color: "#f59e0b" },
  { min: 60, grade: "Silver",   emoji: "🥈", label: "Trusted", color: "#6366f1" },
  { min: 40, grade: "Bronze",   emoji: "🥉", label: "Building Trust", color: "#ec4899" },
  { min: 0,  grade: "New",      emoji: "🌱", label: "Getting Started", color: "#64748b" },
];

export function getGrade(score) {
  for (const g of GRADES) {
    if (score >= g.min) return g;
  }
  return GRADES[GRADES.length - 1];
}

/**
 * 1. FARMER TRUST SCORE (0-100)
 */
export async function calculateFarmerTrustScore(farmerId) {
  const user = await User.findById(farmerId);
  const farmer = await Farmer.findOne({ user: farmerId });

  if (!user) {
    return {
      score: 0,
      grade: "New",
      emoji: "🌱",
      label: "Getting Started",
      role: "farmer",
      breakdown: {},
      tips: ["Create a farmer profile to start building your trust score."]
    };
  }

  const breakdown = {};
  const tips = [];

  // 1. Verification (10 pts)
  let verificationScore = 0;
  if (farmer?.verified && farmer?.aadhaarVerified) {
    verificationScore = 10;
  } else if (farmer?.verified || farmer?.aadhaarVerified || user.isVerified) {
    verificationScore = 5;
    tips.push("Complete both Aadhaar and Farm Land verification for full 10 points.");
  } else {
    tips.push("Verify your Aadhaar and Farm location to gain 10 trust points.");
  }
  breakdown.verification = {
    title: "Verification & Identity",
    score: verificationScore,
    max: 10,
    details: {
      farmVerified: farmer?.verified || false,
      aadhaarVerified: farmer?.aadhaarVerified || false,
      accountVerified: user.isVerified || false
    }
  };

  // 2. Average Rating (20 pts)
  const reviews = await Review.find({ farmer: farmerId });
  let rating = 0;
  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    rating = totalRating / reviews.length;
  }
  const ratingScore = Math.round((rating / 5) * 20 * 10) / 10;
  breakdown.rating = {
    title: "Customer Quality Ratings",
    score: ratingScore,
    max: 20,
    details: { averageRating: rating, totalReviews: reviews.length }
  };
  if (rating < 4 && reviews.length > 0) {
    tips.push("Maintain consistent crop freshness to boost buyer star ratings.");
  }

  // 3. Order Fulfillment Rate (15 pts)
  const allOrders = await Order.find({ farmer: farmerId });
  const totalOrders = allOrders.length;
  const deliveredOrders = allOrders.filter(o => o.status === "delivered").length;
  const cancelledOrders = allOrders.filter(o => o.status === "cancelled").length;
  const completedOrders = deliveredOrders + cancelledOrders;

  let fulfillmentScore = 0;
  if (completedOrders > 0) {
    fulfillmentScore = Math.round((deliveredOrders / completedOrders) * 15 * 10) / 10;
  } else if (totalOrders > 0) {
    fulfillmentScore = 7.5;
  }
  breakdown.fulfillment = {
    title: "Order Fulfillment Rate",
    score: fulfillmentScore,
    max: 15,
    details: {
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      fulfillmentRate: completedOrders > 0 ? Math.round((deliveredOrders / completedOrders) * 100) : 100
    }
  };

  // 4. Soil Regeneration & Contact-Based / Organic Practices (15 pts)
  // Encouraging contact-based pesticides, zero-chemical, permaculture & millets over systemic pesticides
  const allCrops = await Crop.find({ farmer: farmerId });
  const totalCrops = allCrops.length;
  let sustainableCount = 0;
  let systemicPenaltyCount = 0;

  allCrops.forEach(c => {
    if (c.pesticideType === "systemic") {
      systemicPenaltyCount++;
    } else if (
      c.pesticideType === "contact" ||
      c.pesticideType === "organic_neem" ||
      c.pesticideType === "bio" ||
      c.isOrganic ||
      c.isPesticideFree ||
      c.isPermaculture ||
      c.isMillet
    ) {
      sustainableCount++;
    }
  });

  let soilScore = 5; // base score
  if (totalCrops > 0) {
    const sustainableRatio = sustainableCount / totalCrops;
    soilScore = Math.round(sustainableRatio * 15 * 10) / 10;
    if (systemicPenaltyCount > 0) {
      soilScore = Math.max(0, soilScore - systemicPenaltyCount * 2);
      tips.push("Switch from systemic pesticides to contact botanical sprays (Neem, Agniastra) to improve soil health points.");
    }
  } else {
    soilScore = 10;
  }

  breakdown.soilHealth = {
    title: "Soil Fertility & Permaculture Practices",
    score: Math.min(15, soilScore),
    max: 15,
    details: {
      totalCrops,
      sustainableCrops: sustainableCount,
      systemicChemicalCrops: systemicPenaltyCount,
      adoptsContactPesticides: sustainableCount > 0
    }
  };

  // 5. Total Sales Volume (10 pts)
  const salesCount = farmer?.totalSales || deliveredOrders;
  const salesScore = Math.round(Math.min(salesCount / 50, 1) * 10 * 10) / 10;
  breakdown.salesVolume = {
    title: "Marketplace Sales Volume",
    score: salesScore,
    max: 10,
    details: { totalSales: salesCount }
  };

  // 6. Experience (5 pts)
  const experience = farmer?.experience || 1;
  const experienceScore = Math.round(Math.min(experience / 10, 1) * 5 * 10) / 10;
  breakdown.experience = {
    title: "Farming Experience",
    score: experienceScore,
    max: 5,
    details: { years: experience }
  };

  // 7. Account Age (5 pts)
  const accountCreated = user.createdAt || new Date();
  const monthsActive = Math.max(1, (Date.now() - new Date(accountCreated).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const ageScore = Math.round(Math.min(monthsActive / 12, 1) * 5 * 10) / 10;
  breakdown.accountAge = {
    title: "Platform Longevity",
    score: ageScore,
    max: 5,
    details: { monthsActive: Math.round(monthsActive) }
  };

  // 8. Profile Completeness (10 pts)
  const profileCompletenessScore = Math.round(((farmer?.profileCompleteness || 70) / 100) * 10 * 10) / 10;
  breakdown.profileCompleteness = {
    title: "Profile Completeness",
    score: profileCompletenessScore,
    max: 10,
    details: { completeness: farmer?.profileCompleteness || 70 }
  };

  // 9. Low Return / Quality Dispute Rate (10 pts)
  const reportedOrders = allOrders.filter(o => o.isReported && o.reportResolution === "penalized").length;
  const returnPenalty = reportedOrders * 3;
  const returnRateScore = Math.max(0, 10 - returnPenalty);
  breakdown.qualityAssurance = {
    title: "Crop Freshness & Zero Disputes",
    score: returnRateScore,
    max: 10,
    details: { reportedDisputes: reportedOrders }
  };

  const totalScore = Math.min(100, Math.round(
    verificationScore + ratingScore + fulfillmentScore + soilScore +
    salesScore + experienceScore + ageScore + profileCompletenessScore + returnRateScore
  ));

  const gradeInfo = getGrade(totalScore);

  if (farmer) {
    farmer.trustScore = totalScore;
    farmer.trustGrade = gradeInfo.grade;
    await farmer.save();
  }
  user.trustScore = totalScore;
  await user.save();

  return {
    userId: farmerId,
    role: "farmer",
    name: user.name,
    score: totalScore,
    grade: gradeInfo.grade,
    emoji: gradeInfo.emoji,
    label: gradeInfo.label,
    color: gradeInfo.color,
    rewardPoints: user.rewardPoints || 0,
    breakdown,
    tips
  };
}

/**
 * 2. DELIVERY AGENT TRUST SCORE (0-100)
 */
export async function calculateAgentTrustScore(agentId) {
  const user = await User.findById(agentId);
  if (!user) {
    return {
      score: 0,
      grade: "New",
      emoji: "🌱",
      label: "Getting Started",
      role: "agent",
      breakdown: {},
      tips: ["Sign in to view your delivery trust rating."]
    };
  }

  const breakdown = {};
  const tips = [];

  // Fetch all assigned orders
  const orders = await Order.find({ agent: agentId });
  const totalAssigned = orders.length;
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  // 1. On-Time Delivery ETA Compliance (35 pts)
  let onTimeCount = 0;
  let lateCount = 0;
  deliveredOrders.forEach(o => {
    if (o.deliveryPerformance?.isLate) {
      lateCount++;
    } else {
      onTimeCount++;
    }
  });

  let onTimeScore = 25; // default base for fresh agents
  if (deliveredOrders.length > 0) {
    const onTimeRatio = onTimeCount / deliveredOrders.length;
    onTimeScore = Math.round(onTimeRatio * 35 * 10) / 10;
    if (lateCount > 0) {
      tips.push("Keep within estimated delivery deadlines to maximize on-time ETA points.");
    }
  }
  breakdown.onTimeEta = {
    title: "On-Time Delivery ETA Performance",
    score: onTimeScore,
    max: 35,
    details: {
      deliveredCount: deliveredOrders.length,
      onTimeCount,
      lateCount,
      onTimePercent: deliveredOrders.length > 0 ? Math.round((onTimeCount / deliveredOrders.length) * 100) : 100
    }
  };

  // 2. Order Completion Rate (25 pts)
  let completionScore = 20;
  if (totalAssigned > 0) {
    const resolved = deliveredOrders.length + cancelledOrders.length;
    const ratio = resolved > 0 ? (deliveredOrders.length / resolved) : 1;
    completionScore = Math.round(ratio * 25 * 10) / 10;
  }
  breakdown.completionRate = {
    title: "Mission Completion Rate",
    score: completionScore,
    max: 25,
    details: {
      totalAssigned,
      completed: deliveredOrders.length,
      cancelled: cancelledOrders.length
    }
  };

  // 3. OTP & Product Verification Accuracy (15 pts)
  const verifiedDeliveries = deliveredOrders.filter(o => o.agentVerified).length;
  let verificationScore = 12;
  if (deliveredOrders.length > 0) {
    verificationScore = Math.round((verifiedDeliveries / deliveredOrders.length) * 15 * 10) / 10;
  }
  breakdown.verificationAccuracy = {
    title: "Doorstep OTP & Quality Verification",
    score: verificationScore,
    max: 15,
    details: {
      verifiedOrders: verifiedDeliveries,
      totalDelivered: deliveredOrders.length
    }
  };

  // 4. Circular Wet-Waste Collection Compliance (15 pts)
  // Agents earn points when they collect requested wet waste instead of returning empty
  const ordersWithWaste = deliveredOrders.filter(o => o.hasWetWasteDonation);
  let wasteComplianceScore = 12;
  if (ordersWithWaste.length > 0) {
    // If waste was requested and delivery completed, agent fulfilled the return haul
    wasteComplianceScore = 15;
  }
  breakdown.wetWasteCollection = {
    title: "Doorstep Wet-Waste Hauling Compliance",
    score: wasteComplianceScore,
    max: 15,
    details: {
      wasteOrdersHandled: ordersWithWaste.length,
      hauledToCompostHub: true
    }
  };
  tips.push("Always accept customer organic wet waste bags to earn delivery bonuses and waste compliance trust points.");

  // 5. Customer Feedback & Reliability (10 pts)
  let ratingScore = 9;
  const reviewedDeliveries = deliveredOrders.filter(o => o.reviewSentiment);
  if (reviewedDeliveries.length > 0) {
    const positive = reviewedDeliveries.filter(o => o.reviewSentiment === "Positive").length;
    ratingScore = Math.round((positive / reviewedDeliveries.length) * 10 * 10) / 10;
  }
  breakdown.feedback = {
    title: "Customer Rating & Sentiment",
    score: ratingScore,
    max: 10,
    details: { reviewedCount: reviewedDeliveries.length }
  };

  const totalScore = Math.min(100, Math.round(
    onTimeScore + completionScore + verificationScore + wasteComplianceScore + ratingScore
  ));

  const gradeInfo = getGrade(totalScore);

  user.trustScore = totalScore;
  user.deliveryScore = totalScore;
  await user.save();

  return {
    userId: agentId,
    role: "agent",
    name: user.name,
    score: totalScore,
    grade: gradeInfo.grade,
    emoji: gradeInfo.emoji,
    label: gradeInfo.label,
    color: gradeInfo.color,
    rewardPoints: user.rewardPoints || 0,
    breakdown,
    tips
  };
}

/**
 * 3. CUSTOMER TRUST SCORE & REWARD POINTS ENGINE (0-100)
 */
export async function calculateCustomerTrustScore(customerId) {
  const user = await User.findById(customerId);
  if (!user) {
    return {
      score: 0,
      grade: "New",
      emoji: "🌱",
      label: "Getting Started",
      role: "customer",
      breakdown: {},
      tips: ["Place your first farm-fresh order to start building your trust score."]
    };
  }

  const breakdown = {};
  const tips = [];

  const orders = await Order.find({ customer: customerId });
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  // 1. Payment Integrity & Zero Fraud (30 pts)
  const paidOrders = orders.filter(o => o.paymentStatus === "paid").length;
  let paymentScore = 20;
  if (totalOrders > 0) {
    const paymentRatio = paidOrders / totalOrders;
    const cancelPenalty = Math.min(15, (user.cancelledOrdersCount || cancelledOrders.length) * 3);
    paymentScore = Math.max(5, Math.round(paymentRatio * 30 * 10) / 10 - cancelPenalty);
  } else {
    paymentScore = 25;
  }
  breakdown.paymentIntegrity = {
    title: "Payment Integrity & Order Commitment",
    score: Math.min(30, paymentScore),
    max: 30,
    details: {
      totalOrders,
      paidOrders,
      cancellations: user.cancelledOrdersCount || cancelledOrders.length
    }
  };

  // 2. Order Loyalty & Frequency (25 pts)
  // Capped at 15 delivered orders for max points
  const loyaltyScore = Math.round(Math.min(deliveredOrders.length / 15, 1) * 25 * 10) / 10;
  breakdown.orderLoyalty = {
    title: "Farm-to-Table Order Loyalty",
    score: loyaltyScore,
    max: 25,
    details: { completedOrders: deliveredOrders.length }
  };
  if (deliveredOrders.length < 5) {
    tips.push("Order directly from local farmers regularly to unlock higher trust tiers and exclusive discounts.");
  }

  // 3. Circular Wet-Waste Donations & Green Contribution (25 pts)
  // Customer gives vegetable/fruit waste for biogas/compost (+15 reward points each!)
  const wasteOrders = orders.filter(o => o.hasWetWasteDonation);
  const wasteScore = Math.round(Math.min(wasteOrders.length / 5, 1) * 25 * 10) / 10;
  breakdown.wetWasteContribution = {
    title: "Circular Wet-Waste Recycling",
    score: wasteScore,
    max: 25,
    details: {
      donationsCount: wasteOrders.length,
      pointsEarned: wasteOrders.length * 15,
      impact: "Supplied organic raw matter to biogas plants & farmer vermicompost"
    }
  };
  tips.push("Hand over segregated vegetable/fruit wet waste with each order to earn +15 reward points and 25 trust points.");

  // 4. Honest Reviews & Community Contribution (20 pts)
  const reviewsGiven = await Review.find({ customer: customerId });
  const reviewScore = Math.round(Math.min(reviewsGiven.length / 5, 1) * 20 * 10) / 10;
  breakdown.communityReviews = {
    title: "Farmer Reviews & Community Feedback",
    score: reviewScore,
    max: 20,
    details: { reviewsSubmitted: reviewsGiven.length }
  };

  const totalScore = Math.min(100, Math.round(
    paymentScore + loyaltyScore + wasteScore + reviewScore
  ));

  const gradeInfo = getGrade(totalScore);

  user.trustScore = totalScore;
  await user.save();

  return {
    userId: customerId,
    role: "customer",
    name: user.name,
    score: totalScore,
    grade: gradeInfo.grade,
    emoji: gradeInfo.emoji,
    label: gradeInfo.label,
    color: gradeInfo.color,
    rewardPoints: user.rewardPoints || 0,
    breakdown,
    tips
  };
}

/**
 * Universal dispatcher
 */
export async function getUserTrustScore(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return {
      score: 0,
      grade: "New",
      emoji: "🌱",
      label: "Getting Started",
      breakdown: {},
      tips: []
    };
  }

  if (user.role === "farmer") {
    return calculateFarmerTrustScore(userId);
  } else if (user.role === "agent") {
    return calculateAgentTrustScore(userId);
  } else {
    return calculateCustomerTrustScore(userId);
  }
}

// Keep backward compatibility for existing callers
export const calculateTrustScore = calculateFarmerTrustScore;

export async function getCachedTrustScore(farmerId) {
  const farmer = await Farmer.findOne({ user: farmerId });
  if (!farmer) return { score: 0, grade: "New", emoji: "🌱", label: "Getting Started" };

  const gradeInfo = getGrade(farmer.trustScore || 0);
  return {
    score: farmer.trustScore || 0,
    grade: gradeInfo.grade,
    emoji: gradeInfo.emoji,
    label: gradeInfo.label
  };
}
