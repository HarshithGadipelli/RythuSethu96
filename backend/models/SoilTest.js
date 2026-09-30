import mongoose from 'mongoose';

const SoilTestSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
  source: { type: String, enum: ['SMARTPHONE_TINYML', 'LORAWAN_SENSOR', 'LABORATORY'], required: true },
  metrics: { nitrogen_mg_kg: { type: Number }, phosphorus_mg_kg: { type: Number }, potassium_mg_kg: { type: Number }, phLevel: { type: Number }, moisturePercentage: { type: Number } },
  visionInference: { imageHash: { type: String }, detectedAnomalies: [{ type: String }], soilTexture: { type: String, enum: ['CLAY', 'SAND', 'SILT', 'LOAM'] } },
  aiRecommendations: [{ cropSuggested: { type: String }, fertilizerSuggested: { type: String }, confidenceScore: { type: Number } }]
}, { timestamps: true });

SoilTestSchema.index({ location: '2dsphere' });
export default mongoose.model('SoilTest', SoilTestSchema);