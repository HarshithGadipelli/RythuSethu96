import mongoose from "mongoose";

const vermiBatchSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  bedName: {
    type: String,
    required: true,
    trim: true,
    default: "Bed #1"
  },
  dimensions: {
    type: String,
    default: "10 ft x 3 ft x 2 ft"
  },
  wormSpecies: {
    type: String,
    default: "Eisenia fetida (Red Wigglers)"
  },
  wormQuantityKg: {
    type: Number,
    default: 2
  },
  biomassCapacityKg: {
    type: Number,
    default: 150
  },
  currentBiomassKg: {
    type: Number,
    default: 100
  },
  setupDate: {
    type: Date,
    default: Date.now
  },
  expectedHarvestDate: {
    type: Date
  },
  moisturePercent: {
    type: Number,
    default: 65,
    min: 0,
    max: 100
  },
  temperatureC: {
    type: Number,
    default: 25
  },
  phLevel: {
    type: Number,
    default: 7.0
  },
  stage: {
    type: String,
    enum: ["bedding_setup", "decomposition", "earthworm_active", "maturation", "harvest_ready", "harvested"],
    default: "decomposition"
  },
  vermiwashCollectedLiters: {
    type: Number,
    default: 0
  },
  harvestedCompostKg: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ""
  },
  logs: [
    {
      date: { type: Date, default: Date.now },
      action: { type: String, required: true },
      moisture: Number,
      temperature: Number,
      note: String
    }
  ]
}, { timestamps: true });

const VermiBatch = mongoose.model("VermiBatch", vermiBatchSchema);

export default VermiBatch;
