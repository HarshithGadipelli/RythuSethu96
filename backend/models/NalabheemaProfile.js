import mongoose from 'mongoose';

const NalabheemaProfileSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dietaryConstraints: [{ type: String, enum: ['VEGAN', 'KETO', 'GLUTEN_FREE', 'DIABETIC_FRIENDLY', 'HALAL', 'NONE'], default: 'NONE' }],
  flavorProfile: { spiceTolerance: { type: Number, min: 1, max: 10, default: 5 }, sweetPreference: { type: Number, min: 1, max: 10, default: 5 } },
  culinarySkillLevel: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'EXPERT'], default: 'BEGINNER' },
  favoriteRecipes: [{ recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }, addedAt: { type: Date, default: Date.now } }],
  healthGoals: { targetCalories: { type: Number }, targetProteinGrams: { type: Number } },
  voicePreference: { language: { type: String, enum: ['te-IN', 'hi-IN', 'en-IN'], default: 'te-IN' }, speed: { type: Number, default: 1.0 } }
}, { timestamps: true });

export default mongoose.model('NalabheemaProfile', NalabheemaProfileSchema);