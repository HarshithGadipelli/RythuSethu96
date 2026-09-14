import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserTrustScore,
  calculateFarmerTrustScore,
  calculateAgentTrustScore,
  calculateCustomerTrustScore
} from "../services/trustScoreService.js";

const router = express.Router();

// Get trust score for currently authenticated user
router.get("/me", protect, async (req, res) => {
  try {
    const result = await getUserTrustScore(req.user._id);
    res.json(result);
  } catch (error) {
    console.error("Error computing my trust score:", error);
    res.status(500).json({ error: "Failed to compute trust score" });
  }
});

// Get trust score for any user by userId
router.get("/user/:userId", async (req, res) => {
  try {
    const result = await getUserTrustScore(req.params.userId);
    res.json(result);
  } catch (error) {
    console.error("Error computing user trust score:", error);
    res.status(500).json({ error: "Failed to compute user trust score" });
  }
});

// Specific agent trust score route
router.get("/agent/:agentId", async (req, res) => {
  try {
    const result = await calculateAgentTrustScore(req.params.agentId);
    res.json(result);
  } catch (error) {
    console.error("Error computing agent trust score:", error);
    res.status(500).json({ error: "Failed to compute agent trust score" });
  }
});

// Specific farmer trust score route
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const result = await calculateFarmerTrustScore(req.params.farmerId);
    res.json(result);
  } catch (error) {
    console.error("Error computing farmer trust score:", error);
    res.status(500).json({ error: "Failed to compute farmer trust score" });
  }
});

// Specific customer trust score route
router.get("/customer/:customerId", async (req, res) => {
  try {
    const result = await calculateCustomerTrustScore(req.params.customerId);
    res.json(result);
  } catch (error) {
    console.error("Error computing customer trust score:", error);
    res.status(500).json({ error: "Failed to compute customer trust score" });
  }
});

export default router;
