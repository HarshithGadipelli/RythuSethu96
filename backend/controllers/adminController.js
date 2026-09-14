import User from "../models/User.js";
import Order from "../models/Order.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// ─── Live Stock Analysis & Agricultural Advisory ───

export const getLiveStockAnalysis = async (req, res) => {
  try {
    const SearchHistory = (await import("../models/SearchHistory.js")).default;
    const Crop = (await import("../models/Crop.js")).default;
    const Order = (await import("../models/Order.js")).default;

    // 1. Get current supply aggregated by crop name
    const supplyAgg = await Crop.aggregate([
      {
        $group: {
          _id: { $toLower: "$name" },
          originalName: { $first: "$name" },
          category: { $first: "$category" },
          unit: { $first: "$unit" },
          totalStock: { $sum: "$quantity" },
          avgPrice: { $avg: "$price" },
          isMillet: { $max: "$isMillet" },
          cropCount: { $sum: 1 }
        }
      }
    ]);
    const supplyMap = new Map(supplyAgg.map(s => [s._id, s]));

    // 2. Get current demand from orders
    const demandAgg = await Order.aggregate([
      { $lookup: { from: "crops", localField: "crop", foreignField: "_id", as: "cropData" } },
      { $unwind: "$cropData" },
      {
        $group: {
          _id: { $toLower: "$cropData.name" },
          totalOrdered: { $sum: "$quantity" },
          orderCount: { $sum: 1 }
        }
      }
    ]);
    const demandMap = new Map(demandAgg.map(d => [d._id, d]));

    // 3. Get search interest from SearchHistory
    let searchAgg = [];
    try {
      searchAgg = await SearchHistory.aggregate([
        { $group: { _id: { $toLower: "$query" }, searchVolume: { $sum: 1 } } }
      ]);
    } catch (e) {
      // SearchHistory might be empty or optional
    }
    const searchMap = new Map(searchAgg.map(s => [s._id, s.searchVolume]));

    // Combine all unique crop names
    const allCropKeys = new Set([...supplyMap.keys(), ...demandMap.keys()]);

    const analysis = Array.from(allCropKeys).map(key => {
      const supply = supplyMap.get(key) || {
        originalName: key.charAt(0).toUpperCase() + key.slice(1),
        category: "vegetable",
        unit: "kg",
        totalStock: 0,
        avgPrice: 40,
        isMillet: false,
        cropCount: 0
      };
      const orderData = demandMap.get(key) || { totalOrdered: 0, orderCount: 0 };
      const searchVol = searchMap.get(key) || 0;

      const orderVol = orderData.totalOrdered;
      const totalDemand = orderVol + Math.round(searchVol * 1.5);
      const stock = supply.totalStock;

      let status = "Balanced";
      let advisoryType = "BALANCED";
      let recommendedAction = "Supply matches demand velocity. Maintain current seasonal schedule.";
      let suggestedTargetQty = 0;
      let urgency = "low";

      if (stock === 0 && totalDemand > 0) {
        status = "Critical Deficit";
        advisoryType = "GROW_MORE";
        urgency = "high";
        suggestedTargetQty = Math.max(50, totalDemand * 2);
        recommendedAction = "Zero active stock! Urgent market deficit. Advise farmers to sow immediately with guaranteed purchase MSP.";
      } else if (stock < totalDemand * 0.6) {
        status = "Deficit";
        advisoryType = "GROW_MORE";
        urgency = "medium";
        suggestedTargetQty = Math.round(totalDemand * 1.5 - stock);
        recommendedAction = "Stock running lower than demand velocity. Advise farmers to expand production or prepare next harvest batch.";
      } else if (stock > totalDemand * 3 && stock > 80) {
        status = "Surplus";
        advisoryType = "DIVERT_OR_PROCESS";
        urgency = "medium";
        suggestedTargetQty = Math.round(stock - totalDemand * 1.2);
        recommendedAction = "High surplus inventory at risk of spoilage. Advise farmers to divert to solar dehydration, cold hub storage, or rotate land into soil-restoring millets (Ragi/Bajra).";
      } else if (stock > totalDemand * 5 && stock > 200) {
        status = "Critical Surplus";
        advisoryType = "DIVERT_OR_PROCESS";
        urgency = "high";
        suggestedTargetQty = Math.round(stock - totalDemand);
        recommendedAction = "Severe market glut. Immediately pause fresh harvesting; encourage value-addition processing or bio-composting.";
      }

      return {
        cropKey: key,
        cropName: supply.originalName || key,
        category: supply.category || "vegetable",
        unit: supply.unit || "kg",
        isMillet: !!supply.isMillet,
        currentStock: stock,
        avgPrice: Math.round(supply.avgPrice || 0),
        orderVolume: orderVol,
        searchVolume: searchVol,
        totalDemand,
        status,
        advisoryType,
        urgency,
        suggestedTargetQty,
        recommendedAction
      };
    });

    // Priority sort: Critical Deficit -> Deficit -> Critical Surplus -> Surplus -> Balanced
    const statusPriority = {
      "Critical Deficit": 1,
      "Deficit": 2,
      "Critical Surplus": 3,
      "Surplus": 4,
      "Balanced": 5
    };
    analysis.sort((a, b) => (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99));

    // Summary statistics
    const summary = {
      totalCropsTracked: analysis.length,
      deficitCount: analysis.filter(a => a.advisoryType === "GROW_MORE").length,
      surplusCount: analysis.filter(a => a.advisoryType === "DIVERT_OR_PROCESS").length,
      balancedCount: analysis.filter(a => a.advisoryType === "BALANCED").length,
      totalInventoryKg: analysis.reduce((acc, curr) => acc + curr.currentStock, 0)
    };

    res.json({ success: true, summary, analysis });
  } catch (error) {
    console.error("Live Stock Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const broadcastStockAdvisory = async (req, res) => {
  try {
    const {
      cropName,
      category,
      actionType, // "GROW_MORE" or "DIVERT_OR_PROCESS"
      advisoryMessage,
      targetVolumeKg,
      recommendedMSP,
      permacultureTip,
      urgency = "high"
    } = req.body;

    if (!cropName || !advisoryMessage) {
      return res.status(400).json({ error: "Crop name and advisory message are required" });
    }

    const Notification = (await import("../models/Notification.js")).default;
    const User = (await import("../models/User.js")).default;

    const isGrowMore = actionType === "GROW_MORE";
    const title = isGrowMore
      ? `📢 Agricultural Advisory: High Demand for ${cropName} (Plant More)`
      : `⚠️ Market Advisory: Surplus Risk for ${cropName} (Divert / Value Addition)`;

    let fullMessage = advisoryMessage;
    if (targetVolumeKg) {
      fullMessage += `\n🎯 Recommended Target: ${targetVolumeKg} kg.`;
    }
    if (recommendedMSP) {
      fullMessage += `\n💰 Recommended MSP: ₹${recommendedMSP}/kg.`;
    }
    if (permacultureTip) {
      fullMessage += `\n🌱 Permaculture / Soil Tip: ${permacultureTip}`;
    }

    const activeFarmers = await User.find({ role: "farmer", isActive: true });
    
    if (activeFarmers.length > 0) {
      const notifications = activeFarmers.map(farmer => ({
        user: farmer._id,
        title,
        message: fullMessage,
        type: "system",
        priority: urgency === "urgent" || urgency === "high" ? "urgent" : "normal",
        metadata: {
          cropName,
          category,
          actionType,
          recommendedMSP,
          targetVolumeKg,
          isAdvisory: true
        }
      }));

      await Notification.insertMany(notifications);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("admin_broadcast_received", {
        title,
        message: fullMessage,
        cropName,
        actionType,
        isAdvisory: true
      });
      io.emit("stock_advisory_broadcast", {
        cropName,
        actionType,
        message: fullMessage,
        title
      });
    }

    res.json({
      success: true,
      message: `Agricultural advisory successfully broadcasted to ${activeFarmers.length} farmers.`,
      recipientCount: activeFarmers.length,
      advisory: {
        cropName,
        actionType,
        title,
        fullMessage
      }
    });
  } catch (error) {
    console.error("Broadcast Stock Advisory Error:", error);
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

export const getWasteManagement = async (req, res) => {
  try {
    const GlobalConfig = (await import("../models/GlobalConfig.js")).default;
    const VermiCompostRequest = (await import("../models/VermiCompostRequest.js")).default;

    let config = await GlobalConfig.findOne();
    if (!config) {
      config = await GlobalConfig.create({});
    }

    const requests = await VermiCompostRequest.find().populate("farmer", "name email phone walletBalance").sort({ createdAt: -1 });

    res.json({
      totalBiodegradableWasteKg: config.totalBiodegradableWasteKg || 0,
      requests
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveWasteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const VermiCompostRequest = (await import("../models/VermiCompostRequest.js")).default;
    const GlobalConfig = (await import("../models/GlobalConfig.js")).default;
    const User = (await import("../models/User.js")).default;
    const Notification = (await import("../models/Notification.js")).default;

    const request = await VermiCompostRequest.findById(id).populate("farmer");
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ error: "Request already processed" });

    let config = await GlobalConfig.findOne();
    if (!config || (config.totalBiodegradableWasteKg || 0) < request.requestedKg) {
      return res.status(400).json({ error: "Insufficient waste inventory in cold storage" });
    }

    const farmerUser = await User.findById(request.farmer._id || request.farmer);
    if (farmerUser.walletBalance < request.totalCost) {
      return res.status(400).json({ error: "Farmer has insufficient wallet balance" });
    }

    // Process approval
    farmerUser.walletBalance -= request.totalCost;
    await farmerUser.save();

    config.totalBiodegradableWasteKg -= request.requestedKg;
    await config.save();

    request.status = "approved";
    request.approvedAt = new Date();
    await request.save();

    // Notify farmer
    const notif = await Notification.create({
      user: farmerUser._id,
      title: "✅ Vermi Compost Request Approved",
      message: `Your request for ${request.requestedKg} kg of biodegradable waste has been approved. ₹${request.totalCost} has been debited from your wallet.`,
      type: "system",
      priority: "normal"
    });
    const io = req.app.get("io");
    if (io) io.emit("notification", notif);

    res.json({ success: true, message: "Request approved and wallet debited.", request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sellBiogas = async (req, res) => {
  try {
    const { quantityKg, pricePerKg } = req.body;
    if (!quantityKg || !pricePerKg) return res.status(400).json({ error: "Quantity and price are required" });

    const GlobalConfig = (await import("../models/GlobalConfig.js")).default;
    const User = (await import("../models/User.js")).default;

    let config = await GlobalConfig.findOne();
    if (!config || (config.totalBiodegradableWasteKg || 0) < quantityKg) {
      return res.status(400).json({ error: "Insufficient waste inventory in cold storage" });
    }

    config.totalBiodegradableWasteKg -= quantityKg;
    await config.save();

    // Credit admin wallet
    const adminUser = await User.findById(req.user.id);
    if (adminUser) {
      adminUser.walletBalance = (adminUser.walletBalance || 0) + (quantityKg * pricePerKg);
      await adminUser.save();
    }

    res.json({ success: true, message: `Successfully sold ${quantityKg} kg to Biogas Plant.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
