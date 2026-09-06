import express from "express";
import { 
  suggestCrop, 
  predictDemand, 
  getMarketDemand,
  analyzeNutrition, 
  farmerSuggestions,
  routeOptimize,
  marketBasketAnalysis,
  predictYield,
  predictPriceTrends,
  predictDeliveryETA,
  analyzeSentiment,
  retrainEnsemble,
  getSeasonalPrediction
} from "../controllers/mlController.js";
import SearchHistory from "../models/SearchHistory.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const router = express.Router();

router.post("/crop-suggest", suggestCrop);
router.post("/demand-predict", predictDemand);
router.get("/market-demand", getMarketDemand);
router.post("/nutrition", analyzeNutrition);
router.post("/farmer-suggest", farmerSuggestions);
router.post("/demand/request", async (req, res) => {
  try {
    const { crop, userId } = req.body;
    if (!crop) return res.status(400).json({ error: "Crop required" });
    const CropRequest = (await import("../models/CropRequest.js")).default;
    const newReq = await CropRequest.create({ cropName: crop, requestedBy: userId });
    res.json(newReq);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/route-optimize", routeOptimize);
router.post("/market-basket", marketBasketAnalysis);

router.post("/predict-yield", predictYield);
router.post("/price-trends", predictPriceTrends);
router.post("/predict-eta", predictDeliveryETA);
router.post("/analyze-sentiment", analyzeSentiment);
router.post("/retrain", retrainEnsemble);
router.get("/seasonal-prediction", getSeasonalPrediction);

// ─── Search Demand Prediction ───

// Log a search query
router.post("/search", async (req, res) => {
  try {
    const { query, category, latitude, longitude, user } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });
    const searchLog = await SearchHistory.create({ query, category, latitude, longitude, user });
    res.json(searchLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated search demand (Admin)
router.get("/search-demand", async (req, res) => {
  try {
    const demand = await SearchHistory.aggregate([
      { $group: { _id: "$query", count: { $sum: 1 }, latestSearch: { $max: "$timestamp" } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    res.json(demand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest to Farmers (Admin)
router.post("/suggest-farmers", async (req, res) => {
  try {
    const { cropName } = req.body;
    if (!cropName) return res.status(400).json({ error: "Crop name is required" });
    
    const farmers = await User.find({ role: "farmer", isActive: true });
    
    // Notify all active farmers
    const notifications = farmers.map(f => ({
      user: f._id,
      title: "Market Demand Alert 📈",
      message: `High demand detected for ${cropName}. Consider cultivating it for better returns!`,
      type: "system",
      priority: "high"
    }));
    
    await Notification.insertMany(notifications);
    
    const io = req.app.get("io");
    if (io) {
      io.emit("admin_broadcast_received", { title: "Market Demand Alert 📈", message: `High demand detected for ${cropName}. Consider cultivating it!` });
    }
    
    res.json({ message: `Successfully suggested ${cropName} to ${farmers.length} farmers.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
