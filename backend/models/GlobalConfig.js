import mongoose from "mongoose";

const globalConfigSchema = new mongoose.Schema({
  isFestivalActive: { type: Boolean, default: false },
  discountPercentage: { type: Number, default: 10 },
  festivalMessage: { type: String, default: "Festival season is here! Enjoy 10% off." },
  totalBiodegradableWasteKg: { type: Number, default: 0 },
  systemTermsVersion: { type: Number, default: 1 },
  systemTermsTitle: { type: String, default: "RythuJanaSethu Mandatory System Rules & Operating Terms" },
  systemTermsContent: { type: String, default: "By accessing and continuing to use RythuJanaSethu, all users (Farmers, Agents, Customers, and Administrators) agree to comply with platform quality standards, zero-abandonment rules, verified doorstep delivery protocols, and fair trade practices." },
  systemTermsUpdatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("GlobalConfig", globalConfigSchema);
