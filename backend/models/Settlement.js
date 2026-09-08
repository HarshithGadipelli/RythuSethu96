import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientRole: { type: String, enum: ["farmer", "agent"], required: true },
  amount: { type: Number, required: true },
  cycleStartDate: { type: Date, required: true },
  cycleEndDate: { type: Date, required: true },
  payoutDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "completed"
  },
  transactionReference: { type: String, default: () => `SETTLE-${Date.now().toString(36).toUpperCase()}` },
  ordersCount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ["upi", "bank_transfer", "direct_payout"], default: "upi" },
  upiId: { type: String, default: "" },
  bankAccount: { type: String, default: "" },
  notes: { type: String, default: "Bi-Weekly (14-Day) Settlement Cycle Payout" }
}, { timestamps: true });

export default mongoose.model("Settlement", settlementSchema);
