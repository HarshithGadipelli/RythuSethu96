import User from "../models/User.js";
import Order from "../models/Order.js";

export const getUsers=async(req,res)=>{
 const users=await User.find();

 res.json(users);
}

export const getOrders = async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLiveStockAnalysis = async (req, res) => {
  try {
    const SearchHistory = (await import("../models/SearchHistory.js")).default;
    const Crop = (await import("../models/Crop.js")).default;
    const Order = (await import("../models/Order.js")).default;

    // 1. Get current supply (total stock per crop name)
    const supplyAgg = await Crop.aggregate([
      { $group: { _id: "$name", totalStock: { $sum: "$quantity" }, avgPrice: { $avg: "$price" } } }
    ]);
    const supplyMap = new Map(supplyAgg.map(s => [s._id.toLowerCase(), s]));

    // 2. Get current demand (from orders)
    const demandAgg = await Order.aggregate([
      { $lookup: { from: "crops", localField: "crop", foreignField: "_id", as: "cropData" } },
      { $unwind: "$cropData" },
      { $group: { _id: "$cropData.name", totalOrdered: { $sum: "$quantity" } } }
    ]);
    const demandMap = new Map(demandAgg.map(d => [d._id.toLowerCase(), d.totalOrdered]));

    // 3. Get search demand (from SearchHistory)
    const searchAgg = await SearchHistory.aggregate([
      { $group: { _id: "$query", searchVolume: { $sum: 1 } } }
    ]);
    
    // Combine everything
    const allCropNames = new Set([...supplyMap.keys(), ...demandMap.keys(), ...searchAgg.map(s => s._id.toLowerCase())]);
    
    const analysis = Array.from(allCropNames).map(name => {
      const supply = supplyMap.get(name) || { totalStock: 0, avgPrice: 0 };
      const orderVol = demandMap.get(name) || 0;
      const searchVol = searchAgg.find(s => s._id.toLowerCase() === name)?.searchVolume || 0;
      
      const totalDemand = orderVol + (searchVol * 0.5); // Weighting search volume
      let status = "Balanced";
      
      if (supply.totalStock === 0 && totalDemand > 5) status = "Lacking";
      else if (supply.totalStock < totalDemand * 0.5) status = "Lacking";
      else if (supply.totalStock > totalDemand * 2 && supply.totalStock > 20) status = "Oversupplied";

      return {
        cropName: name,
        currentStock: supply.totalStock,
        avgPrice: supply.avgPrice,
        orderVolume: orderVol,
        searchVolume: searchVol,
        status
      };
    });

    // Sort: Lacking first, then Balanced, then Oversupplied
    const statusWeight = { "Lacking": 1, "Balanced": 2, "Oversupplied": 3 };
    analysis.sort((a, b) => statusWeight[a.status] - statusWeight[b.status]);

    res.json(analysis);
  } catch (error) {
    console.error("Live Stock Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ─── End-of-Day Clearance & Broadcasting ───

export const getClearanceStock = async (req, res) => {
  try {
    const Crop = (await import("../models/Crop.js")).default;
    const crops = await Crop.find({ isAdminStock: true }).populate("originalFarmer", "name location").sort({ createdAt: -1 });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClearancePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const Crop = (await import("../models/Crop.js")).default;
    
    const crop = await Crop.findById(id);
    if (!crop || !crop.isAdminStock) return res.status(404).json({ error: "Clearance crop not found" });

    crop.price = price;
    await crop.save();
    res.json({ success: true, crop });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const broadcastPromotion = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: "Title and message required" });
    
    const Notification = (await import("../models/Notification.js")).default;
    const User = (await import("../models/User.js")).default;
    
    const farmers = await User.find({ role: "farmer", isActive: true });
    const notifications = farmers.map(f => ({
      user: f._id,
      title,
      message,
      type: "system",
      priority: "high"
    }));
    
    await Notification.insertMany(notifications);
    
    const io = req.app.get("io");
    if (io) {
      io.emit("admin_broadcast_received", { title, message });
    }
    
    res.json({ success: true, message: `Broadcast sent to ${farmers.length} farmers.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
