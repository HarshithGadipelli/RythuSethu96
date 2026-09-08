import Order from "../models/Order.js";
import Demand from "../models/Demand.js";
import Crop from "../models/Crop.js";
import SearchHistory from "../models/SearchHistory.js";

export const predictAdvancedDemand = async (daysAgo = 7) => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - daysAgo);
  
  // 1. Calculate REAL-TIME SALES VELOCITY based on Order data in MongoDB
  const orderAggregates = await Order.aggregate([
    { $match: { createdAt: { $gte: pastDate }, status: { $ne: "cancelled" } } },
    { $lookup: { from: "crops", localField: "crop", foreignField: "_id", as: "cropInfo" } },
    { $unwind: "$cropInfo" },
    { $group: { 
        _id: "$cropInfo.name", 
        totalSold: { $sum: "$quantity" }, 
        orderCount: { $sum: 1 },
        revenue: { $sum: "$totalAmount" } 
    }}
  ]);

  // 2. Calculate REAL-TIME SEARCH INTENT based on SearchHistory in MongoDB
  const searchAggregates = await SearchHistory.aggregate([
    { $match: { createdAt: { $gte: pastDate } } },
    { $group: {
        _id: { $toLower: "$query" },
        searchCount: { $sum: 1 },
        latestSearch: { $max: "$timestamp" }
    }}
  ]);

  const searchMap = new Map(searchAggregates.map(s => [s._id?.trim()?.toLowerCase(), s.searchCount]));

  // 3. Query current active stock supplies in MongoDB
  const stockAggregates = await Crop.aggregate([
    { $match: { quantity: { $gt: 0 } } },
    { $group: {
        _id: "$name",
        currentStock: { $sum: "$quantity" }
    }}
  ]);

  const stockMap = new Map(stockAggregates.map(st => [st._id?.toLowerCase(), st.currentStock]));

  // Combine into unified demand candidates
  const cropNamesSet = new Set([
    ...orderAggregates.map(o => o._id),
    ...searchAggregates.map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1)),
    ...stockAggregates.map(st => st._id)
  ]);

  const currentMonth = new Date().getMonth(); // 0-11
  const dayOfWeek = new Date().getDay(); // 0 (Sun) - 6 (Sat)
  
  // Deep Seasonality Map
  let seasonBoosts = [];
  if (currentMonth >= 2 && currentMonth <= 5) {
    seasonBoosts = ["Mango", "Watermelon", "Cucumber", "Lemon"];
  } else if (currentMonth >= 9 || currentMonth <= 1) {
    seasonBoosts = ["Carrot", "Spinach", "Peas", "Cabbage"];
  } else {
    seasonBoosts = ["Rice", "Corn", "Gourd", "Ginger"];
  }

  // Day of week multiplier (Weekends boost grocery/perishable demand)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const orderMap = new Map(orderAggregates.map(o => [o._id, o]));

  const processedDemands = Array.from(cropNamesSet).map(name => {
    const o = orderMap.get(name) || {};
    const totalSold = o.totalSold || 0;
    const orderCount = o.orderCount || 0;
    const revenue = o.revenue || 0;
    const searchCount = searchMap.get(name.toLowerCase()) || 0;
    const currentStock = stockMap.get(name.toLowerCase()) || 50;

    // Tensor velocity equation incorporating direct search inquiries:
    // Velocity = (Sold * 1.5) + (SearchInquiries * 2.0) + (Orders^1.2 * 2.5) + (Revenue * 0.04)
    const baseVelocity = (totalSold * 1.5) + (searchCount * 2.0) + (Math.pow(orderCount, 1.2) * 2.5) + (revenue * 0.04);
    
    // Supply-Demand Ratio (SDR)
    const totalDemandInquiry = totalSold + (searchCount * 1.5);
    const sdr = (currentStock + 1) / (totalDemandInquiry + 1);

    let seasonMultiplier = seasonBoosts.some(sb => sb.toLowerCase() === name.toLowerCase()) ? 2.2 : 1.0;
    let weekendMultiplier = (isWeekend && ["Tomato", "Onion", "Potato", "Spinach"].some(p => p.toLowerCase() === name.toLowerCase())) ? 1.4 : 1.0;

    const finalScore = (baseVelocity + 5) * seasonMultiplier * weekendMultiplier;

    let recommendation = "Balanced Market Flow";
    if (sdr < 0.6) recommendation = "🔥 High Demand Expected (Severe Shortage - Cultivate / Liquidate Fast)";
    else if (sdr < 1.0) recommendation = "📈 Growing Demand Trend (Slight Shortage)";
    else if (sdr > 2.5) recommendation = "📉 Ample Stock (Consider Clearance Flash Markdown)";

    return {
      name,
      totalSold,
      orderCount,
      revenue,
      searchCount,
      currentStock,
      velocityScore: parseFloat(baseVelocity.toFixed(2)),
      finalScore: parseFloat(finalScore.toFixed(2)),
      supplyDemandRatio: parseFloat(sdr.toFixed(2)),
      recommendation,
      isSeasonal: seasonMultiplier > 1.0
    };
  }).sort((a, b) => b.finalScore - a.finalScore);

  // Fallback defaults if database is fresh
  const finalProcessingList = processedDemands.length > 0 ? processedDemands : [
    { name: "Tomato", totalSold: 120, searchCount: 45, currentStock: 80, finalScore: 95.5, recommendation: "High Demand Expected" },
    { name: "Onion", totalSold: 90, searchCount: 38, currentStock: 100, finalScore: 82.0, recommendation: "Growing Demand Trend" },
    { name: "Potato", totalSold: 85, searchCount: 29, currentStock: 110, finalScore: 74.0, recommendation: "Balanced Market Flow" },
    { name: "Spinach", totalSold: 60, searchCount: 30, currentStock: 40, finalScore: 68.0, recommendation: "Growing Demand Trend" }
  ];

  // Update MongoDB Demand collection for live persistent reporting
  for (const cropDemand of finalProcessingList) {
    await Demand.findOneAndUpdate(
      { cropName: cropDemand.name },
      {
        velocityScore: cropDemand.velocityScore,
        totalSold: cropDemand.totalSold,
        orderCount: cropDemand.orderCount,
        searchCount: cropDemand.searchCount,
        revenue: cropDemand.revenue,
        supplyDemandRatio: cropDemand.supplyDemandRatio,
        recommendation: cropDemand.recommendation,
        seasonBoostMultiplier: cropDemand.isSeasonal ? 2.2 : 1.0,
        finalScore: cropDemand.finalScore,
        evaluationWindowDays: daysAgo
      },
      { upsert: true, new: true }
    );
  }

  const topCrops = finalProcessingList.slice(0, 10).map(d => d.name);

  return {
    demand: [...new Set(topCrops)],
    demandDetails: finalProcessingList.slice(0, 15),
    evaluationWindowDays: daysAgo,
    deepInsights: {
      seasonBoostsApplied: seasonBoosts,
      weekendPerishableMultiplier: isWeekend ? 1.4 : 1.0,
      searchQueriesAnalyzed: searchAggregates.length,
      ordersAnalyzed: orderAggregates.length
    },
    modelUsed: "RythuSethu_MongoDB_SearchOrder_Ensemble_v6"
  };
};
