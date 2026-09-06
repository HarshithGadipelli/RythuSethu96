import mongoose from "mongoose";

const soilTestRequestSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  farmerName: { type: String, required: true },
  phone: { type: String, default: "" },
  farmLocation: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number },
  farmSizeAcres: { type: Number, default: 2 },
  
  // ─── AI Photo Scan Data ───
  soilPhoto: { type: String, default: "" },
  aiPreliminaryClassification: {
    soilType: { type: String, default: "Black Cotton Soil" },
    confidence: { type: Number, default: 92 },
    texture: { type: String, default: "Clayey & Moisture Retentive" },
    colorProfile: { type: String, default: "Deep Dark Brown to Black" },
    organicMatterEstimate: { type: String, default: "Medium to High" },
    suitableCrops: [{ type: String }],
    suggestedOrganicFertilizers: [{ type: String }],
    recommendations: { type: String, default: "" },
    notice: { 
      type: String, 
      default: "Visual scan identifies physical soil type. Chemical parameters (pH, NPK, micronutrients) require on-field laboratory testing." 
    }
  },

  // ─── Lab Appointment Booking & Advance Payment ───
  appointmentDetails: {
    preferredDate: { type: Date, default: () => new Date(Date.now() + 86400000 * 2) },
    preferredTimeSlot: { type: String, default: "Morning (8:00 AM - 12:00 PM)" },
    samplingSpotsCount: { type: Number, default: 3 },
    advanceAmount: { type: Number, default: 299 },
    totalEstimatedFee: { type: Number, default: 799 },
    balanceAmount: { type: Number, default: 500 },
    paymentMode: { type: String, enum: ["upi", "card", "wallet", "cod"], default: "upi" },
    paymentStatus: { type: String, enum: ["paid", "pending"], default: "paid" },
    paymentTxnId: { type: String, default: () => "SOIL-TXN-" + Date.now().toString(36).toUpperCase() }
  },

  // ─── Status Lifecycle ───
  status: {
    type: String,
    enum: ["pending_assignment", "team_assigned", "sample_collected", "lab_testing", "report_published", "cancelled"],
    default: "pending_assignment"
  },

  // ─── Assigned Testing Team (Admin action) ───
  assignedTeam: {
    scientistName: { type: String, default: "" },
    teamVehicleNumber: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    assignedAt: { type: Date },
    scheduledVisitDate: { type: Date },
    adminNotes: { type: String, default: "" }
  },

  // ─── Lab Chemical Report ───
  soilHealthReport: {
    phLevel: { type: Number },
    phCategory: { type: String, default: "Neutral" }, // Acidic, Neutral, Alkaline
    nitrogenN: { type: String, default: "" }, // e.g. "280 kg/ha (Medium)"
    phosphorusP: { type: String, default: "" }, // e.g. "22 kg/ha (Adequate)"
    potassiumK: { type: String, default: "" }, // e.g. "340 kg/ha (High)"
    organicCarbonPercent: { type: Number, default: 0.65 },
    electricalConductivityEC: { type: String, default: "0.42 dS/m (Safe/Normal)" },
    micronutrients: {
      zinc: { type: String, default: "Sufficient (1.2 ppm)" },
      iron: { type: String, default: "Adequate (5.8 ppm)" },
      boron: { type: String, default: "Moderate (0.6 ppm)" }
    },
    recommendedManure: { type: String, default: "Apply 2 tonnes/acre of well-decomposed Farm Yard Manure + 200kg Vermicompost." },
    reportPdfUrl: { type: String, default: "" },
    publishedAt: { type: Date }
  }
}, { timestamps: true });

export default mongoose.model("SoilTestRequest", soilTestRequestSchema);
