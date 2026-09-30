import express from 'express';
import { submitTest, getRegionalMap } from '../controllers/soilTestController.js';
const router = express.Router();
const protect = (req, res, next) => { req.user = { id: 'mockUserId' }; next(); };
router.post('/submit', protect, submitTest);
router.get('/regional-map', protect, getRegionalMap);
export default router;