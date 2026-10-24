import express from 'express';
import { submitTest, getRegionalMap } from '../controllers/soilTestController.js';
import SoilTest from '../models/SoilTest.js';

const router = express.Router();
const protect = (req, res, next) => { req.user = { id: 'mockUserId' }; next(); };

router.post('/submit', protect, submitTest);
router.get('/regional-map', protect, getRegionalMap);

// Admin: Get all soil test requests across all farmers
router.get('/admin-all', async (req, res) => {
  try {
    const tests = await SoilTest.find()
      .populate('farmerId', 'name phone email location avatar')
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;