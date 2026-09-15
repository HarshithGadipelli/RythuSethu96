import express from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/authMiddleware.js"; // Assuming auth middleware exists

const router = express.Router();

// Get unread notifications for a user
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.params.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put("/:userId/read", async (req, res) => {
  try {
    await Notification.updateMany({ user: req.params.userId, read: false }, { read: true });
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all notifications
router.delete("/:userId/clear", async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.params.userId });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Real-Time System Maintenance & Emergency Alerts via Socket.io ───
// Get active maintenance alert
router.get("/system-alert/active", (req, res) => {
  const getAlert = req.app.get("getMaintenanceAlert");
  const alert = typeof getAlert === "function" ? getAlert() : null;
  res.json({ activeAlert: alert });
});

// Broadcast a system maintenance or emergency alert
router.post("/system-alert", async (req, res) => {
  try {
    const { title, message, severity = "maintenance", targetRole = "all", scheduledTime = "", isDismissible = true } = req.body;
    if (!message) return res.status(400).json({ error: "Alert message is required" });

    const alertData = {
      id: "alert_" + Date.now(),
      title: title || "System Maintenance Alert",
      message,
      severity, // "maintenance", "warning", "critical", "info"
      targetRole, // "all", "farmer", "customer", "agent"
      scheduledTime,
      isDismissible,
      createdAt: new Date()
    };

    const setAlert = req.app.get("setMaintenanceAlert");
    if (typeof setAlert === "function") {
      setAlert(alertData);
    }

    // Emit via socket
    const io = req.app.get("io");
    if (io) {
      if (targetRole === "all") {
        io.emit("system_maintenance_alert", alertData);
      } else {
        io.to(`role_${targetRole}`).emit("system_maintenance_alert", alertData);
      }
    }

    res.json({ success: true, alert: alertData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear active maintenance alert
router.delete("/system-alert/active", (req, res) => {
  try {
    const setAlert = req.app.get("setMaintenanceAlert");
    if (typeof setAlert === "function") {
      setAlert(null);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("system_maintenance_cleared");
    }

    res.json({ success: true, message: "System maintenance alert cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
