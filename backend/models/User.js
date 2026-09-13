import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  countryCode: { type: String, default: "+91" },
  role: {
    type: String,
    enum: ["farmer", "customer", "agent", "admin"],
    default: "customer"
  },
  language: { type: String, default: "en", enum: ["en", "te", "hi", "kn", "ta"] },
  location: { type: String, default: "" },
  latitude: { type: Number },
  longitude: { type: Number },
  geoPosition: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number], required: false } // [longitude, latitude]
  },
  
  // ─── Customer Specific Info ───
  customerType: { type: String, enum: ["individual", "business", "family", "restaurant", "supermarket", "premium"], default: "individual" },
  requiresDailyDelivery: { type: Boolean, default: false },
  avatar: { type: String, default: "" },
  aadhaar: { type: String, default: "" },
  aadhaarImage: { type: String, default: "" },
  verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  rewardPoints: { type: Number, default: 0 },
  experiencePoints: { type: Number, default: 0 },
  acceptedTerms: { type: Boolean, default: false },
  
  // ─── Trust & Strikes ───
  trustScore: { type: Number, default: 85 }, // Default high trust for new farmers
  deliveryScore: { type: Number, default: 0 }, // Specific to agents
  strikes: { type: Number, default: 0 },
  cancelledOrdersCount: { type: Number, default: 0 },
  accountStatus: { type: String, enum: ["active", "suspended", "banned"], default: "active" },

  // ─── Agent Specific Info ───
  agentType: { type: String, enum: ["bike", "auto", "truck", "ridealong", "vermicompost", "biogas", "cold_storage"], default: "bike" },
  agentPhoto: { type: String, default: "" },
  vehiclePhoto: { type: String, default: "" },
  vehicleNumber: { type: String, default: "" },
  agentVerificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },

  // ─── Cold Storage Agent Info ───
  coldStorageName: { type: String, default: "" },
  coldStorageCapacityTons: { type: Number, default: 500 },
  coldStorageTempCelsius: { type: Number, default: 3.5 },
  coldStorageHumidityPct: { type: Number, default: 85 },
  
  // ─── Ride-Along Agent Route ───
  ridealongRoute: {
    fromLocation: { type: String, default: "" },
    toLocation: { type: String, default: "" },
    fromLat: { type: Number },
    fromLng: { type: Number },
    toLat: { type: Number },
    toLng: { type: Number },
    departureTime: { type: Date },
    isActive: { type: Boolean, default: false }
  },
  
  // ─── Farmer Specific Info ───
  farmName: { type: String, default: "" },
  locationMethod: { type: String, enum: ["gps", "pin", "mic"], default: "gps" },
  locationAudioUrl: { type: String, default: "" },
  locationVerified: { type: Boolean, default: false },
  
  // ─── Financial Ledger ───
  walletBalance: { type: Number, default: 0 }, // E.g., Delivery Agent accumulated earnings
  pendingSettlement: { type: Number, default: 0 }, // E.g., Owed to Farmer for sold crops
  cashInHand: { type: Number, default: 0 }, // COD cash collected by Delivery Agent (owed to Admin)
  escrowBalance: { type: Number, default: 0 }, // Funds held in escrow until delivery/tour completion
  
  upiId: { type: String, default: "" },
  bankAccountNumber: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre("save", function(next) {
  if (this.latitude !== undefined && this.longitude !== undefined && this.latitude !== null && this.longitude !== null && !isNaN(this.latitude) && !isNaN(this.longitude)) {
    this.geoPosition = {
      type: "Point",
      coordinates: [Number(this.longitude), Number(this.latitude)]
    };
  } else if (this.geoPosition && (!this.geoPosition.coordinates || !Array.isArray(this.geoPosition.coordinates) || this.geoPosition.coordinates.length < 2)) {
    this.geoPosition = undefined;
  }
  next();
});

userSchema.index({ geoPosition: "2dsphere" });

export default mongoose.model("User", userSchema);
