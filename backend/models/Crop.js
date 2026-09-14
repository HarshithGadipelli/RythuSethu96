import mongoose from "mongoose";

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  category: {
    type: String,
    enum: ["vegetable", "fruit", "grain", "pulse", "spice", "dairy", "byproduct", "millet", "other"],
    default: "vegetable"
  },
  price: { type: Number, required: true },
  priceRange: {
    min: { type: Number },
    max: { type: Number }
  },
  quantity: { type: Number, required: true },
  unit: { type: String, default: "kg", enum: ["kg", "g", "litre", "piece", "dozen", "bale", "tonne"] },
  minOrderQty: { type: Number, default: 1 },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  image: { type: String, default: "" },
  images: [{ type: String }],
  location: { type: String, default: "" }, // Product Location
  farmLocation: { type: String, default: "" }, // Farm Location
  latitude: { type: Number },
  longitude: { type: Number },
  farmTourUrl: { type: String, default: "" },
  farmTourVideo: { type: String, default: "" },
  harvestDate: { type: Date },
  expiryDate: { type: Date },
  season: { type: String, enum: ["kharif", "rabi", "zaid", "perennial"], default: "kharif" },
  waterAvailability: { type: String, enum: ["abundant", "moderate", "scarce"], default: "moderate" },
  isOrganic: { type: Boolean, default: false },
  certificationStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
  certificationDocument: { type: String, default: "" },
  // ─── Dual Location: Real Farm of Origin & Real Sale / Mandi Place ───
  realFarmDetails: {
    farmName: { type: String, default: "" },
    farmerName: { type: String, default: "" },
    farmLocation: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    soilType: { type: String, default: "red_soil" },
    farmSizeAcres: { type: Number, default: 5 }
  },
  realSalePlace: {
    hubType: { type: String, enum: ["mandi", "cold_storage_hub", "farm_gate", "fpo_center"], default: "farm_gate" },
    hubName: { type: String, default: "Farm Gate Direct" },
    hubLocation: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    distanceFarmToSaleKm: { type: Number, default: 0 }
  },
  // ─── Food Safety & Anti-Fake Organic Certification Engine ───
  organicVerification: {
    status: { 
      type: String, 
      enum: ["unverified", "pending_inspection", "step_verified", "certified_genuine", "rejected_fake"], 
      default: "unverified" 
    },
    foodSafetyScore: { type: Number, default: 85, min: 0, max: 100 },
    chemicalResidueStatus: { 
      type: String, 
      enum: ["zero_detected", "safe_trace", "chemical_detected"], 
      default: "zero_detected" 
    },
    hygieneGrade: { type: String, enum: ["A+", "A", "B", "Fail"], default: "A" },
    verifiedByAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    agentName: { type: String, default: "" },
    agentBadge: { type: String, default: "" },
    inspectedAt: { type: Date },
    auditNotes: { type: String, default: "" },
    
    // 5 Step-by-Step Geotagged & Timestamped Photo Verification Steps
    stepPhotos: {
      step1_soil_bio: {
        practice: { type: String, default: "Jeevamrutham & Green Manure Soil Prep" },
        photoUrl: { type: String, default: "" },
        submittedAt: { type: Date },
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        agentNotes: { type: String, default: "" }
      },
      step2_natural_seed: {
        practice: { type: String, default: "Bijamrutham & Untreated Native Heirloom Seed" },
        photoUrl: { type: String, default: "" },
        submittedAt: { type: Date },
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        agentNotes: { type: String, default: "" }
      },
      step3_corn_border_catch_crop: {
        practice: { type: String, default: "Corn Border (3-4 Rows) & Marigold/Mustard Catch Crop" },
        photoUrl: { type: String, default: "" },
        submittedAt: { type: Date },
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        agentNotes: { type: String, default: "" }
      },
      step4_botanical_spray: {
        practice: { type: String, default: "Neem Seed Kernel Extract (NSKE 5%) / Agniastra Spray" },
        photoUrl: { type: String, default: "" },
        submittedAt: { type: Date },
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        agentNotes: { type: String, default: "" }
      },
      step5_clean_harvest: {
        practice: { type: String, default: "Residue-Free Clean Harvest & Tamper-Proof Storage" },
        photoUrl: { type: String, default: "" },
        submittedAt: { type: Date },
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        agentNotes: { type: String, default: "" }
      }
    },
    auditTrail: [{
      action: { type: String },
      agentId: { type: String },
      agentName: { type: String },
      timestamp: { type: Date, default: Date.now },
      notes: { type: String }
    }]
  },
  isPesticideFree: { type: Boolean, default: false },
  pesticideType: {
    type: String,
    enum: ["none", "contact", "systemic", "organic_neem", "bio"],
    default: "none"
  },
  isPermaculture: { type: Boolean, default: false },
  isMillet: { type: Boolean, default: false },
  milletType: {
    type: String,
    enum: ["ragi", "jowar", "bajra", "foxtail", "kodo", "barnyard", "little", "browntop", ""],
    default: ""
  },
  isTraditionalSuperfood: { type: Boolean, default: false },
  traditionalItemType: {
    type: String,
    enum: ["thaati_bellam", "karupatti", "arikelu", "siridhanya", "palm_sugar", "native_cold_pressed_oil", ""],
    default: ""
  },
  soilHealthBenefits: { type: String, default: "" },
  soilOrganicCarbonContribution: { type: String, default: "" },
  qualityGrade: { type: String, enum: ["A", "B", "C", null], default: null },
  isLive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isPrebooking: { type: Boolean, default: false },
  advancePaymentPercentage: { type: Number, default: 0 },
  isBulk: { type: Boolean, default: false },
  lifecycleStage: { type: String, enum: ["sowing", "vegetative", "flowering", "harvesting", "post_harvest", "ready"], default: "sowing" },
  lifecycleUpdates: [{
    stage: { type: String, enum: ["sowing", "vegetative", "flowering", "harvesting", "post_harvest", "ready"] },
    imageUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
  }],
  nutritionInfo: {
    calories: Number,
    carbs: Number,
    protein: Number,
    fat: Number,
    fiber: Number
  },
  rating: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  // ─── Admin Cold Storage Clearance Fields ───
  isAdminStock: { type: Boolean, default: false },
  originalFarmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clearanceDiscount: { type: Number, default: 0 },
  coldStorageLocation: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Crop", cropSchema);
