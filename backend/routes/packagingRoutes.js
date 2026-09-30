import express from 'express';
import { calculatePackaging } from '../controllers/packagingController.js';
const router = express.Router();
const protect = (req, res, next) => { req.user = { id: 'mockUserId' }; next(); };
router.post('/calculate', protect, calculatePackaging);
export default router;