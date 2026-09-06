import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  query: { type: String, required: true },
  category: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number },
  timestamp: { type: Date, default: Date.now, expires: '30d' }
}, { timestamps: true });

export default mongoose.model("SearchHistory", searchHistorySchema);
