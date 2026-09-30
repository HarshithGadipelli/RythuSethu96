import express from 'express';
import { getProfile, generateRecipe } from '../controllers/nalabheemaController.js';
const router = express.Router();
const protect = (req, res, next) => { req.user = { id: 'mockUserId' }; next(); };
router.get('/profile', protect, getProfile);
router.post('/generate-recipe', protect, generateRecipe);
export default router;