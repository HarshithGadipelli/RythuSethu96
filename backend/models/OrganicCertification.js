import mongoose from 'mongoose';

const OrganicCertificationSchema = new mongoose.Schema({
  cropBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
  cropName: { type: String, default: "Seasonal Organic Crop" },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String, default: "Registered Farmer" },
  farmerPhone: { type: String, default: "" },
  
  // Batch & Cultivation Cycle Tracking
  batchNumber: { type: String, default: () => `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` },
  cultivationCycle: { type: String, enum: ['Kharif', 'Rabi', 'Zaid', 'Perennial', 'Continuous'], default: 'Kharif' },
  farmLocation: { type: String, default: "Telangana Rural Sector" },
  farmAcreage: { type: Number, default: 2.5 },

  // Admin Continuous 5-Point Strict Verification Procedure
  verificationChecks: {
    // 1. Geolocation & Farm Boundary Matching
    geoLocation: {
      verified: { type: Boolean, default: false },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      farmBoundaryMatch: { type: Boolean, default: false },
      geoVarianceMeters: { type: Number, default: 0 },
      verifiedAt: { type: Date },
      notes: { type: String, default: "" }
    },

    // 2. Field Photographs (Soil prep, vegetative, clean harvest)
    fieldPhotos: {
      verified: { type: Boolean, default: false },
      urls: [{ type: String }],
      stage: { type: String, enum: ['Soil_Prep', 'Heirloom_Seeding', 'Vegetative_Growth', 'Clean_Harvest'], default: 'Soil_Prep' },
      verifiedAt: { type: Date },
      notes: { type: String, default: "" }
    },

    // 3. Admin Direct Call Verification & Auditing
    adminCallAudit: {
      verified: { type: Boolean, default: false },
      callOfficer: { type: String, default: "Admin Quality Officer" },
      callTimestamp: { type: Date },
      phoneAudited: { type: String },
      callStatus: { type: String, enum: ['Pending', 'Verified_Clear', 'Follow_Up_Required', 'Disputed'], default: 'Pending' },
      farmerResponse: { type: String, default: "" },
      notes: { type: String, default: "" }
    },

    // 4. Tools & Soil Testing Imagery
    toolsSoilImages: {
      verified: { type: Boolean, default: false },
      soilCardUrl: { type: String, default: "" },
      toolPhotoUrl: { type: String, default: "" },
      spectrometerReading: { type: String, default: "Safe Bio-Spectrum" },
      nitrogenLevel: { type: Number, default: 45 },
      organicCarbonPct: { type: Number, default: 0.82 },
      verifiedAt: { type: Date },
      notes: { type: String, default: "" }
    },

    // 5. Pest Diagnostic Imagery & Bio-Spray Evidence
    pestImages: {
      verified: { type: Boolean, default: false },
      pestPhotoUrl: { type: String, default: "" },
      bioSprayProofUrl: { type: String, default: "" },
      neemPanchagavyaUsed: { type: Boolean, default: true },
      diagnosisResult: { type: String, default: "Zero Synthetic Organophosphate Residue" },
      noSyntheticPesticidesConfirmed: { type: Boolean, default: true },
      verifiedAt: { type: Date },
      notes: { type: String, default: "" }
    }
  },

  // Admin Procedure Execution & Governance
  adminProcedure: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewerName: { type: String, default: "System Admin" },
    auditStepsCompleted: { type: Number, default: 0, min: 0, max: 5 },
    overallSafetyScore: { type: Number, default: 85, min: 0, max: 100 },
    adminRemarks: { type: String, default: "Under continuous verification procedure." },
    procedureStage: { 
      type: String, 
      enum: ['AUDIT_INITIATED', 'FIELD_INSPECTION', 'LAB_AND_TOOLS', 'CALL_VERIFICATION', 'CERTIFIED_APPROVED', 'REJECTED_AUDIT'], 
      default: 'AUDIT_INITIATED' 
    }
  },

  // Farmer Support & Promotional Subsidies (Earned upon verified organic certification)
  supportBenefits: {
    certifiedOrganic: { type: Boolean, default: false },
    zeroPlatformCommission: { type: Boolean, default: false },
    priorityListingBadge: { type: Boolean, default: false },
    subsidySupportGranted: { type: Boolean, default: false },
    subsidyAmount: { type: Number, default: 0 },
    organicTrustBadgeTier: { 
      type: String, 
      enum: ['NONE', 'BRONZE_CONVERSION', 'SILVER_ORGANIC', 'GOLD_NATURAL', 'PLATINUM_ZERO_BUDGET'], 
      default: 'NONE' 
    }
  },

  // Blockchain Ledger
  blockchain: {
    polygonTokenId: { type: String },
    smartContractAddress: { type: String },
    transactionHash: { type: String },
    certificateHash: { type: String }
  },

  // Hyperspectral Inspection & Legacy Oracle Fields
  iotOracleData: { 
    lastSyntheticNitrogenSpikeDetected: { type: Date }, 
    isRevokedBySensor: { type: Boolean, default: false } 
  },
  hyperspectralInspection: { 
    inspectedAtHubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' }, 
    inspectedAtTime: { type: Date }, 
    pesticideResidueDetected: { type: Boolean, default: false }, 
    svmConfidenceScore: { type: Number, default: 0.94 }, 
    imageSpectrumHash: { type: String } 
  },

  // Multi-Batch Continuous Cultivation Cycle
  continuousCycle: {
    batchSequenceNumber: { type: Number, default: 1 },
    isCurrentActiveBatch: { type: Boolean, default: true },
    nextBatchEligible: { type: Boolean, default: false },
    subsequentBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganicCertification' },
    previousBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganicCertification' },
    cycleStartedAt: { type: Date, default: Date.now },
    cycleCompletedAt: { type: Date }
  },

  certificationStatus: { 
    type: String, 
    enum: ['PENDING_AUDIT', 'IN_VERIFICATION', 'VERIFIED_ORGANIC', 'REJECTED_AUDIT', 'REVOKED_FRAUD', 'COMPLETED_CYCLE'], 
    default: 'PENDING_AUDIT' 
  }
}, { timestamps: true });

export default mongoose.model('OrganicCertification', OrganicCertificationSchema);