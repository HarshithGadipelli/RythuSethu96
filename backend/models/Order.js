import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
  status: String,
  note: String,
  timestamp: { type: Date, default: Date.now }
});

const productSnapshotSchema = new mongoose.Schema({
  name: String,
  category: String,
  isOrganic: Boolean,
  isPesticideFree: Boolean,
  quantity: Number,
  unit: String,
  price: Number,
  image: String,
  location: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  crop: { type: mongoose.Schema.Types.ObjectId, ref: "Crop" },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  deliveryCharges: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending", "prebooked", "confirmed", "processing", "assigned", "picked_up", "in_transit", "delivered", "cancelled"],
    default: "pending"
  },
  isPrebooked: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 },
  pointsUsed: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ["cod", "upi", "card", "wallet", "online"], default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
  
  // ─── Location & Tracking ───
  pickupAddress: { type: String, default: "" },
  pickupLatitude: { type: Number },
  pickupLongitude: { type: Number },
  deliveryAddress: { type: String, default: "" },
  deliveryLatitude: { type: Number },
  deliveryLongitude: { type: Number },
  agentCurrentLatitude: { type: Number },
  agentCurrentLongitude: { type: Number },
  
  deliveryType: { type: String, enum: ["standard", "express", "farm_pickup", "delivery", "pickup", "fast"], default: "standard" },
  deliveryTime: { type: String, default: "asap" },
  deliveryDistance: { type: Number, default: 0 }, // in km
  estimatedDeliveryMinutes: { type: Number, default: 0 },
  estimatedDeliveryDeadline: { type: Date },
  deliveryPerformance: {
    deliveredAt: { type: Date },
    deadline: { type: Date },
    diffMinutes: { type: Number, default: 0 },
    isEarly: { type: Boolean, default: false },
    isLate: { type: Boolean, default: false },
    speedBonusPoints: { type: Number, default: 0 },
    speedBonusCash: { type: Number, default: 0 },
    latePenaltyPoints: { type: Number, default: 0 },
    latePenaltyDeduction: { type: Number, default: 0 },
    deliveryScoreChange: { type: Number, default: 0 },
    delayReason: { type: String, default: "" },
    isDisputed: { type: Boolean, default: false }
  },
  notes: { type: String, default: "" },
  billNumber: { type: String, default: "" },
  timeline: [timelineSchema],

  // ─── Product Verification Security ───
  verificationCode: { type: String, default: "" }, // 6-digit code shared with customer
  productSnapshot: { type: productSnapshotSchema }, // snapshot of crop at order time
  agentVerified: { type: Boolean, default: false }, // agent confirmed product matches
  isReported: { type: Boolean, default: false }, // agent reported product mismatch
  agentReportReason: { type: String, default: "" }, // reason for mismatch report
  reportResolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who resolved
  reportResolution: { type: String, enum: ["pending", "penalized", "dismissed"], default: "pending" },

  // ─── Post-Purchase Review & Ratings (Farm Buy vs Delivery Buy) ───
  reviewText: { type: String, default: "" },
  reviewFeedback: { type: String, default: "" },
  farmRating: { type: Number, default: 0 },
  farmerRating: { type: Number, default: 0 },
  platformRating: { type: Number, default: 0 },
  deliveryRating: { type: Number, default: 0 },
  buyType: { type: String, default: "" }, // "farm" | "delivery"
  hasReviewed: { type: Boolean, default: false },
  reviewGiven: { type: Boolean, default: false },
  reviewCreatedAt: { type: Date },
  sentimentScore: { type: Number, default: 0 },
  reviewSentiment: { type: String, enum: ["Positive", "Neutral", "Negative", ""], default: "" },
  paidAtFarm: { type: Boolean, default: false },
  isOfflineBuy: { type: Boolean, default: false },

  // ─── Financial Ledger ───
  isSettledWithFarmer: { type: Boolean, default: false },
  isSettledWithAgent: { type: Boolean, default: false },
  adminRevenue: { type: Number, default: 0 },
  isRidealong: { type: Boolean, default: false },
  ridealongDiscount: { type: Number, default: 0 },
  agentEarnings: { type: Number, default: 0 },

  // ─── Multi-Location Delivery ───
  multiLocationGroupId: { type: String, default: "" },

  // ─── Multi-Hop Logistics ───
  deliveryLegs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Delivery" }],
  logisticsPhase: { 
    type: String, 
    enum: ["pending", "farm_to_hub", "hub_to_storage", "storage_to_customer", "completed", "cancelled"],
    default: "pending"
  },

  // ─── Circular Economy Wet-Waste Collection ───
  hasWetWasteDonation: { type: Boolean, default: false },
  wetWasteEstKg: { type: Number, default: 0 },
  wetWasteNotes: { type: String, default: "" },
  agentWasteAlertSent: { type: Boolean, default: false },
  chatMessages: [{
    sender: { type: String, enum: ["customer", "agent", "system"], default: "customer" },
    senderName: { type: String, default: "" },
    text: { type: String, required: true },
    isWasteAlert: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// High-Performance Query Indexes
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ farmer: 1, createdAt: -1 });
orderSchema.index({ agent: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ billNumber: 1 });

// Auto-generate bill number
orderSchema.pre("save", function(next) {
  if (!this.billNumber) {
    this.billNumber = "RS-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  // Auto-generate verification code
  if (!this.verificationCode) {
    this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

export default mongoose.model("Order", orderSchema);
