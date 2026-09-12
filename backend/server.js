import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs";
import connectDB from "./config/db.js";
import Delivery from "./models/Delivery.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import sanitizeMiddleware from "./middleware/sanitizeMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import farmTourRoutes from "./routes/farmTourRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import ecommerceRoutes from "./routes/ecommerceRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import boxRoutes from "./routes/boxRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import translationRoutes from "./routes/translationRoutes.js";
import soilTestRoutes from "./routes/soilTestRoutes.js";

import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize unified Google Gen AI instance
export const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const app = express();
app.locals.ai = ai;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Realtime client connected:", socket.id);

  socket.on("join_agent_room", (agentId) => {
    socket.join(`agent_${agentId}`);
  });

  socket.on("agent_location_update", async (data) => {
    // Broadcast the live update to the room immediately
    io.to(`agent_${data.agentId}`).emit("agent_location_changed", data);

    // Persist to MongoDB realistically in the background
    try {
      if (data.agentId && data.lat && data.lng) {
        await Delivery.updateMany(
          { agent: data.agentId, status: "in_transit" },
          {
            $set: {
              agentLatitude: data.lat,
              agentLongitude: data.lng,
              lastLocationUpdate: new Date()
            }
          }
        );
      }
    } catch (err) {
      console.error("Failed to update live delivery location to DB", err);
    }
  });

  socket.on("admin_broadcast", (data) => {
    io.emit("admin_broadcast_received", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Realtime client disconnected:", socket.id);
  });
});

connectDB();

app.use(cors({ origin: "*", credentials: true }));

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(mongoSanitize());
app.use(sanitizeMiddleware);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static uploads with caching disabled to ensure real-time visibility
app.use("/uploads", express.static(uploadDir, {
  setHeaders: (res, path) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
}));
// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/tours", farmTourRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/shop", ecommerceRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/boxes", boxRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/translate", translationRoutes);
app.use("/api/soil-test", soilTestRoutes);

app.get("/", (req, res) => {
  res.send("Rythu Jana Sethu Backend Running");
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
//const cors = require('cors');
//app.use(cors()); // Allows requests from any origin
