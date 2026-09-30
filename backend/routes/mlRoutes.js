import express from 'express';
const router = express.Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ============================================================
// YIELD PREDICTION (CatBoost + LightGBM + XGBoost → Ridge)
// ============================================================
router.post('/predict-yield', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/predict-yield`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) throw new Error('ML Service Error');
    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Yield Prediction Error:', error);
    res.status(500).json({ success: false, error: 'Yield prediction service unavailable' });
  }
});

// ============================================================
// PEST DETECTION (SAHI + YOLOv11)
// ============================================================
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
router.post('/recommend-crop', async (req, res) => {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/recommend-crop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) throw new Error('ML Service Error');
    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Crop Recommendation Error:', error);
    res.status(500).json({ success: false, error: 'Crop recommendation service unavailable' });
  }
});

export default router;
