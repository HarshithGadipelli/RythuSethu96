import express from 'express';
import { 
  suggestCrop, 
  getSeasonalPrediction,
  predictDemand,
  analyzeNutrition,
  farmerSuggestions,
  routeOptimize,
  marketBasketAnalysis,
  predictYield,
  predictPriceTrends,
  predictDeliveryETA,
  analyzeSentiment,
  getMarketDemand,
  retrainEnsemble,
  getLearningTelemetry
} from '../controllers/mlController.js';

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ============================================================
// YIELD PREDICTION
// ============================================================
router.post('/predict-yield', predictYield);

// ============================================================
// PEST DETECTION (SAHI + YOLOv11)
// ============================================================
// Assuming no local controller for this, keep proxy or stub
router.post('/detect-pests', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/detect-pests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) throw new Error('ML Service Error');
    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Pest Detection Error:', error);
    res.status(500).json({ success: false, error: 'Pest detection service unavailable' });
  }
});

// ============================================================
// SOIL ANALYSIS (MobileNetV4)
// ============================================================
router.post('/analyze-soil', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/analyze-soil`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) throw new Error('ML Service Error');
    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Soil Analysis Error:', error);
    res.status(500).json({ success: false, error: 'Soil analysis service unavailable' });
  }
});

// ============================================================
// SEASONAL CROP RECOMMENDATION (Multi-Class CatBoost + Softmax)
// ============================================================

router.post('/recommend-crop', suggestCrop);
router.post('/crop-suggest', suggestCrop); // Alias used by FarmerDashboard
router.get('/seasonal-prediction', getSeasonalPrediction);
router.post('/nutrition', analyzeNutrition);
router.post('/market-basket', marketBasketAnalysis);
router.post('/price-trends', predictPriceTrends);
router.post('/predict-eta', predictDeliveryETA);
router.post('/route-optimize', routeOptimize);
router.get('/market-demand', getMarketDemand);
router.post('/farmer-suggest', farmerSuggestions);
router.post('/analyze-sentiment', analyzeSentiment);
router.post('/retrain', retrainEnsemble);
router.get('/telemetry', getLearningTelemetry);
router.get('/search-demand', getMarketDemand); // Alias
router.post('/calculate-demand-price', predictDemand); // Assume predictDemand handles this

export default router;
