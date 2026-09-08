import express from "express";
import { register, login, getProfile, updateProfile, updateLocation, acceptTerms } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/register", upload.fields([
  { name: "farmerPhoto", maxCount: 1 },
  { name: "farmPhoto", maxCount: 1 },
  { name: "productPhoto", maxCount: 1 },
  { name: "aadhaarPhoto", maxCount: 1 },
  { name: "avatar", maxCount: 1 },
  { name: "agentPhoto", maxCount: 1 },
  { name: "vehiclePhoto", maxCount: 1 },
  { name: "locationAudio", maxCount: 1 }
]), register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/update-location", protect, updateLocation);
router.put("/accept-terms", protect, acceptTerms);

export default router;
