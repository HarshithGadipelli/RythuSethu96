import mongoose from "mongoose";

const vermiCompostRequestSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  requestedKg: {
    type: Number,
    required: true,
    min: 1
  },
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "fulfilled", "rejected"],
    default: "pending",
    index: true
  },
  adminNotes: {
    type: String,
    default: ""
  },
  approvedAt: {
    type: Date
  }
}, { timestamps: true });

const VermiCompostRequest = mongoose.model("VermiCompostRequest", vermiCompostRequestSchema);

export default VermiCompostRequest;
