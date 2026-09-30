import mongoose from 'mongoose';

const PackagingOptimizationSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleRoute', required: true },
  cropType: { type: String, required: true },
  weatherData: { ambientTemperatureCelsius: { type: Number, required: true }, humidityPercentage: { type: Number } },
  transit: { estimatedTransitTimeMins: { type: Number, required: true }, cargoWeightInertiaKg: { type: Number } },
  recommendation: { material: { type: String, enum: ['ARECA_SHELL', 'CORRUGATED_CARDBOARD', 'BAMBOO_CRATE', 'PLA_BIOPLASTIC'], required: true }, pcmGelGramsRequired: { type: Number, required: true }, thermalDecayRiskScore: { type: Number, min: 0, max: 1 } },
  sustainabilityMetrics: { co2SavedKg: { type: Number }, isPlasticFree: { type: Boolean, default: true } }
}, { timestamps: true });

export default mongoose.model('PackagingOptimization', PackagingOptimizationSchema);