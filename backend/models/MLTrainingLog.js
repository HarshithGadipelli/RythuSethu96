import mongoose from "mongoose";

const mlTrainingLogSchema = new mongoose.Schema(
  {
    triggerReason: {
      type: String,
      enum: ["auto_order_threshold", "auto_crop_threshold", "auto_search_threshold", "manual_admin", "scheduled_daemon"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["initiated", "completed", "failed"],
      default: "initiated",
      index: true
    },
    realDataCounts: {
      cropsDiscovered: { type: Number, default: 0 },
      ordersIngested: { type: Number, default: 0 },
      searchesIngested: { type: Number, default: 0 }
    },
    modelMetrics: {
      priceModel: { type: mongoose.Schema.Types.Mixed },
      demandModel: { type: mongoose.Schema.Types.Mixed },
      cropModel: { type: mongoose.Schema.Types.Mixed },
      seasonalModel: { type: mongoose.Schema.Types.Mixed }
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("MLTrainingLog", mlTrainingLogSchema);
