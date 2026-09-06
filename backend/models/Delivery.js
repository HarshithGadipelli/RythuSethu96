import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pickupLocation: { type: String, default: "" },
  deliveryLocation: { type: String, default: "" },
  pickupLatitude: { type: Number },
  pickupLongitude: { type: Number },
  deliveryLatitude: { type: Number },
  deliveryLongitude: { type: Number },
  agentLatitude: { type: Number },
  agentLongitude: { type: Number },
  lastLocationUpdate: { type: Date },
  route: { type: String, default: "" },
  
  // ─── Multi-Location Delivery ───
  dropoffs: [{
    location: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    status: { type: String, enum: ["pending", "delivered", "failed"], default: "pending" },
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    deliveredAt: { type: Date }
  }],

  vehicleType: { type: String, enum: ["bike", "auto", "truck", "van"], default: "bike" },
  agentPhone: { type: String, default: "" },
  estimatedTime: { type: String, default: "" },
  estimatedMinutes: { type: Number, default: 0 }, // computed ETA in minutes
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
  trackingCode: { type: String, default: "" },
  status: {
    type: String,
    enum: ["assigned", "picked_up", "in_transit", "delivered", "failed"],
    default: "assigned"
  },
  pickupPhoto: { type: String, default: "" },
  deliveryPhoto: { type: String, default: "" },
  aiVerificationResult: { type: String, enum: ["pending", "match", "mismatch"], default: "pending" },
  aiVerificationNotes: { type: String, default: "" },
  deliveredAt: { type: Date },
  
  // ── Circular Economy / Waste Collection ──
  wasteCollectedKg: { type: Number, default: 0 },
  wastePointsAwarded: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Delivery", deliverySchema);
