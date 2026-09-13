import mongoose from "mongoose";

const demandBroadcastSchema = new mongoose.Schema({
  cropName: { type: String, required: true },
  targetQuantityKg: { type: Number, default: 500 },
  suggestedPrice: { type: Number, default: 0 },
  priority: { type: String, enum: ["normal", "urgent", "critical"], default: "normal" },
  consumerSearchCount: { type: Number, default: 0 },
  searchSurgePercentage: { type: Number, default: 0 },
  targetRegion: { type: String, default: "Hyderabad & Telangana Hubs" },
  message: { type: String, required: true },
  broadcastedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["active", "fulfilled", "expired"], default: "active" },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
}, { timestamps: true });

export default mongoose.model("DemandBroadcast", demandBroadcastSchema);
