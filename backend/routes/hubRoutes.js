import express from "express";
import { getHubs, createHub, updateHub, deleteHub, seedHubs } from "../controllers/hubController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getHubs);
router.post("/seed", seedHubs); // Temporary route to seed the hubs
router.post("/", protect, adminOnly, createHub);
router.put("/:id", protect, adminOnly, updateHub);
router.delete("/:id", protect, adminOnly, deleteHub);

export default router;
