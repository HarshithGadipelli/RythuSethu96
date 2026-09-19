import mongoose from "mongoose";

const hubLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["outer_hub", "inner_cold_storage"], required: true },
  region: { type: String, enum: ["North", "South", "East", "West"], required: true },
  address: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("HubLocation", hubLocationSchema);
