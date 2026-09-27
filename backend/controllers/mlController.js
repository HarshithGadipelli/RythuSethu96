import { getGeminiCropSuggestion, getGeminiFarmerTips } from "../services/geminiService.js";
import Crop from "../models/Crop.js";
import Order from "../models/Order.js";
import { suggestAdvancedCrop } from "../services/cropSuggestionService.js";
import { predictAdvancedDemand } from "../services/demandPredictionService.js";
import { getNutritionAnalysis } from "../services/nutritionAnalysisService.js";
import { optimizeDeliveryRoute } from "../services/deliveryRouteService.js";
import { executeRetrainingPipeline, getContinuousLearningStatus } from "../services/continuousLearningService.js";

const runPythonScript = async (endpoint, payload) => {
  try {
    const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`FastAPI responded with ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("FastAPI call failed:", error);
    throw error;
  }
};

export const suggestCrop = async (req, res) => {
  try {
    const { temp, hum, rain, soil, location, waterAvailability, region, season } = req.body;
    if (temp === undefined || temp === null || hum === undefined || hum === null || rain === undefined || rain === null) {
      return res.status(400).json({ error: "Missing temp, hum, or rain" });
    }

    const locStr = (region || location || "Telangana, India");
    const activeSoil = soil || "loamy";

    let result = await getGeminiCropSuggestion(
      { temp, hum, rain }, 
      activeSoil, 
      locStr, 
      season || "kharif", 
      waterAvailability || "moderate"
    );
    if (!result) {
      result = await suggestAdvancedCrop(temp, hum, rain);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const predictDemand = async (req, res) => {
  try {
    const result = await predictAdvancedDemand(7);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const analyzeNutrition = async (req, res) => {
  try {
    const { crop } = req.body;
    if (!crop) return res.status(400).json({ error: "Missing crop" });
    const result = await getNutritionAnalysis(crop);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const farmerSuggestions = async (req, res) => {
  try {
    const {
      crop,
      soil,
      location,
      stage,
      waterAvailability,
      symptoms,
      irrigationMethod,
      fertilizerUsed,
      previousCrop,
      soilMoisture,
      season,
      temperature,
      humidity,
      rainfall
    } = req.body;

    if (!crop) return res.status(400).json({ error: "Missing crop name" });
    const activeSoil = soil || "loamy";

    let result = await getGeminiFarmerTips(crop, activeSoil, location, stage, {
      symptoms,
      irrigationMethod: irrigationMethod || waterAvailability,
      fertilizerUsed,
      previousCrop,
      soilMoisture,
      season,
      temperature,
      humidity,
      rainfall
    });

    if (result) return res.json(result);

    // Dynamic ICAR Fallback
    const currentStage = stage || "vegetative";
    const stageAdvice = {
      sowing: ["Prepare deep raised beds with 250kg/acre well-rotted vermicompost.", "Treat seed with Trichoderma viride (10g/kg) to prevent damping-off."],
      vegetative: ["Apply 20% nitrogen top-dressing or Jeevamrutha foliar spray.", "Maintain light alternate-furrow irrigation to stimulate root branching."],
      flowering: ["Spray 2% DAP or Panchagavya (3%) to enhance blossom retention.", "Strictly avoid flood irrigation; soil should be moist, not waterlogged."],
      fruiting: ["Foliar spray of Potassium Schoenite or wood ash extract for uniform grain/fruit size.", "Monitor underside of leaves for sucking pests and fruit borers."],
      harvesting: ["Cease irrigation 7 days prior to harvest for improved shelf life.", "Harvest during morning hours (6 AM - 10 AM) to preserve turgidity."],
      post_harvest: ["Pre-cool produce in shaded evaporative cooling chambers before packing.", "Inoculate post-harvest crop stubbles with bio-decomposer."]
    };

    const tips = stageAdvice[currentStage] || stageAdvice.vegetative;

    res.json({
      crop,
      soil_type: activeSoil,
      current_stage: currentStage,
      vitality_score: symptoms && symptoms !== "None / General Maintenance" ? 72 : 88,
      health_status: symptoms && symptoms !== "None / General Maintenance" ? "Requires Attention" : "Optimal",
      root_cause_diagnosis: symptoms ? `Observed symptoms (${symptoms}) indicate micro-climatic or soil nutrient imbalance during the ${currentStage} stage.` : "Crop displays steady vegetative vigor under current management.",
      nutrient_prescription: {
        organic_solution: "Apply 250kg Vermicompost + 50kg Neem Cake per acre as organic side-dressing.",
        npk_dosage: "Apply balanced N:P:K 19:19:19 water-soluble spray at 5g/liter.",
        micronutrient_foliar: "Foliar spray of multi-micronutrient mixture (Zinc, Boron, Ferrous) at 2.5ml/liter."
      },
      irrigation_protocol: irrigationMethod ? `Regulate ${irrigationMethod} scheduling based on soil surface moisture.` : "Maintain moist soil with 4-5 day irrigation cycles.",
      pest_prevention: "Preventative foliar spray of Neem oil (5ml/L) + soap emulsifier (1ml/L).",
      critical_next_actions: [
        `Step 1: Check root zone moisture before next irrigation cycle.`,
        `Step 2: Apply prescribed nutrient dose during early morning or late evening.`,
        `Step 3: Monitor leaf color progression over next 72 hours.`
      ],
      suggestions: tips
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const routeOptimize = async (req, res) => {
  try {
    const agentLat = req.body.agentLat ?? req.body.agentLocation?.latitude ?? req.body.latitude;
    const agentLng = req.body.agentLng ?? req.body.agentLocation?.longitude ?? req.body.longitude;
    const { orders, agentType, algorithm } = req.body;

    if (agentLat === undefined || agentLat === null || agentLng === undefined || agentLng === null || !orders || orders.length === 0) {
      return res.status(400).json({ error: "Missing required agent coordinates or delivery orders." });
    }
    
    // Determine agent type, defaulting to bike
    const type = agentType || (req.user && req.user.agentType) || "bike";
    const selectedAlgo = algorithm || (type === "truck" ? "branch_and_cut" : "guided_local_search");
    
    const result = await optimizeDeliveryRoute(agentLat, agentLng, orders, { agentType: type, algorithm: selectedAlgo });
    res.json(result);
  } catch (error) {
    console.error("Route optimization error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const marketBasketAnalysis = async (req, res) => {
  try {
    const { crop, customerId } = req.body;
    if (!crop) return res.status(400).json({ error: "Crop required" });

    // Spawn the Python ML script to perform true statistical market basket analysis
    const resultJson = await runPythonScript("/predict/market_basket", { crop: req.body.crop });
    
    // The python script output is already parsed by runPythonScript
    const data = resultJson;
    
    res.json(data);
  } catch (error) {
    console.error("Market Basket Python Error:", error);
    // Safe fallback if Python fails to execute
    res.json({
      targetCrop: req.body.crop,
      totalBaskets: 0,
      suggestions: [
        { crop: "Tomato", confidence: "80.0", count: 0 },
        { crop: "Onion", confidence: "70.0", count: 0 },
        { crop: "Potato", confidence: "65.0", count: 0 },
        { crop: "Chili", confidence: "55.0", count: 0 }
      ],
      status: "python_error"
    });
  }
};

// 1. Crop Yield Prediction (Advanced Real-Time Criteria ML & Gemini Integration)
export const predictYield = async (req, res) => {
  try {
    const { crop, acres, soilType, soilPh, season, location, irrigation, weather, farmingMethod } = req.body;
    if (!crop || !acres || !soilType) return res.status(400).json({ error: "Missing required fields: crop, acres, and soilType" });

    const target = crop.toLowerCase().trim();

    // Baseline fallback data for common Indian crops
    const yieldBaselines = {
      tomato: { base: 12000, idealPh: 6.5, price: 38, category: "Vegetables" },
      potato: { base: 10000, idealPh: 5.5, price: 26, category: "Vegetables" },
      onion: { base: 8500, idealPh: 6.0, price: 32, category: "Vegetables" },
      cabbage: { base: 14000, idealPh: 6.5, price: 22, category: "Vegetables" },
      cauliflower: { base: 11000, idealPh: 6.5, price: 30, category: "Vegetables" },
      brinjal: { base: 9500, idealPh: 6.0, price: 34, category: "Vegetables" },
      carrot: { base: 10500, idealPh: 6.0, price: 42, category: "Vegetables" },
      spinach: { base: 4500, idealPh: 6.5, price: 48, category: "Vegetables" },
      chili: { base: 2200, idealPh: 6.0, price: 85, category: "Spices" },
      garlic: { base: 4200, idealPh: 6.5, price: 110, category: "Spices" },
      ginger: { base: 5500, idealPh: 6.2, price: 90, category: "Spices" },
      turmeric: { base: 6000, idealPh: 6.0, price: 95, category: "Spices" },
      rice: { base: 2600, idealPh: 6.0, price: 58, category: "Grains & Millets" },
      paddy: { base: 2600, idealPh: 6.0, price: 58, category: "Grains & Millets" },
      wheat: { base: 1600, idealPh: 6.5, price: 42, category: "Grains & Millets" },
      maize: { base: 3000, idealPh: 6.0, price: 28, category: "Grains & Millets" },
      corn: { base: 3000, idealPh: 6.0, price: 28, category: "Grains & Millets" },
      jowar: { base: 1400, idealPh: 6.5, price: 35, category: "Grains & Millets" },
      bajra: { base: 1200, idealPh: 7.0, price: 30, category: "Grains & Millets" },
      ragi: { base: 1500, idealPh: 6.2, price: 45, category: "Grains & Millets" },
      soybean: { base: 1300, idealPh: 6.5, price: 48, category: "Pulses" },
      gram: { base: 950, idealPh: 6.0, price: 72, category: "Pulses" },
      toor: { base: 850, idealPh: 6.5, price: 88, category: "Pulses" },
      moong: { base: 750, idealPh: 6.8, price: 85, category: "Pulses" },
      apple: { base: 6500, idealPh: 6.5, price: 130, category: "Fruits" },
      mango: { base: 5200, idealPh: 6.0, price: 85, category: "Fruits" },
      banana: { base: 16000, idealPh: 6.5, price: 32, category: "Fruits" },
      papaya: { base: 19000, idealPh: 6.0, price: 42, category: "Fruits" },
      orange: { base: 7500, idealPh: 6.5, price: 65, category: "Fruits" },
      grapes: { base: 8500, idealPh: 6.5, price: 95, category: "Fruits" },
      watermelon: { base: 22000, idealPh: 6.0, price: 16, category: "Fruits" },
      guava: { base: 7000, idealPh: 6.5, price: 50, category: "Fruits" },
      cotton: { base: 650, idealPh: 6.2, price: 165, category: "Cash Crops" },
      sugarcane: { base: 36000, idealPh: 6.5, price: 6, category: "Cash Crops" },
      groundnut: { base: 1100, idealPh: 6.0, price: 82, category: "Cash Crops" }
    };
    const baseline = yieldBaselines[target] || { base: 5000, idealPh: 6.5, price: 45, category: "General" };

    // Try using Gemini for advanced real-time ML agronomic prediction
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const { callGeminiWithFallback } = await import("../services/geminiService.js");
        const weatherInfo = weather ? `Temperature: ${weather.temp}°C, Humidity: ${weather.hum}%, Rainfall: ${weather.rain}mm` : "Seasonal climate conditions for region";
        const prompt = `
You are an expert Indian agricultural agronomist and yield estimation ML model.
Predict the harvest yield, market price, and revenue using real-time criteria:
- Crop: ${crop}
- Cultivation Land Area: ${acres} Acres
- Soil Type: ${soilType}
- Soil pH: ${soilPh || 'Typical for ' + soilType}
- Season: ${season || 'Current Season'}
- Region / Location: ${location || 'Telangana / Andhra Pradesh, South India'}
- Irrigation / Water Source: ${irrigation || 'Borewell / Canal'}
- Real-Time Weather Context: ${weatherInfo}
- Farming Method: ${farmingMethod || 'Integrated Organic & Conventional'}

Calculate realistic scientific figures based on Indian Council of Agricultural Research (ICAR) benchmarks and current APMC Mandi trends.
Return EXACTLY and ONLY valid JSON without markdown code blocks matching this structure:
{
  "estimatedYieldKg": 12500,
  "estimatedYieldQuintals": 125,
  "estimatedYieldTons": "12.50",
  "yieldPerAcreKg": 6250,
  "confidenceRange": "11.2 - 13.8 Tons",
  "estimatedMarketPricePerKg": 42,
  "estimatedRevenue": 525000,
  "estimatedNetProfit": 340000,
  "soilSuitability": "Optimal",
  "phEfficiencyPct": 94,
  "seasonSuitability": "Highly Favorable",
  "weatherImpact": "Optimal temperature supports high grain/fruit setting",
  "harvestWindow": "90 - 110 days after sowing",
  "actionableSteps": [
    "Apply enriched vermicompost or FYM before final tilling",
    "Maintain soil moisture during flowering to prevent blossom drop",
    "Monitor for early pest signs and spray neem oil bio-pesticide"
  ],
  "aiRecommendation": "Direct recommendation to maximize per-acre yield and harvest timing"
}`;

        const rawText = await callGeminiWithFallback(prompt);
        if (rawText) {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.json({
              ...parsed,
              crop,
              acres,
              soilType,
              season: season || "kharif",
              source: "gemini_multimodal_ml"
            });
          }
        }
      } catch (err) {
        console.warn("Gemini Yield Prediction Failed:", err.message);
      }
    }

    // Dynamic rule-based agronomic calculation when AI is offline
    const acresNum = parseFloat(acres) || 1;
    let soilMultiplier = 1.0;
    const sType = soilType.toLowerCase();
    if (sType.includes("loam") || sType.includes("black") || sType.includes("alluvial")) soilMultiplier = 1.18;
    else if (sType.includes("clay") || sType.includes("red")) soilMultiplier = 1.05;
    else if (sType.includes("saline") || sType.includes("arid")) soilMultiplier = 0.72;

    let irrigationMultiplier = 1.0;
    const irrig = (irrigation || "").toLowerCase();
    if (irrig.includes("drip") || irrig.includes("sprinkler")) irrigationMultiplier = 1.15;
    else if (irrig.includes("rainfed")) irrigationMultiplier = 0.88;

    const totalYieldKg = Math.round(baseline.base * acresNum * soilMultiplier * irrigationMultiplier);
    const pricePerKg = baseline.price;
    const grossRevenue = totalYieldKg * pricePerKg;
    const estimatedCost = Math.round(grossRevenue * 0.35); // 35% average input cost
    const netProfit = grossRevenue - estimatedCost;

    res.json({
      crop,
      acres: acresNum,
      soilType,
      soilPh: soilPh || baseline.idealPh,
      season: season || "kharif",
      estimatedYieldKg: totalYieldKg,
      estimatedYieldQuintals: Math.round(totalYieldKg / 100),
      estimatedYieldTons: (totalYieldKg / 1000).toFixed(2),
      yieldPerAcreKg: Math.round(totalYieldKg / acresNum),
      confidenceRange: `${((totalYieldKg * 0.9) / 1000).toFixed(1)} - ${((totalYieldKg * 1.1) / 1000).toFixed(1)} Tons`,
      estimatedMarketPricePerKg: pricePerKg,
      estimatedRevenue: grossRevenue,
      estimatedNetProfit: netProfit,
      soilSuitability: soilMultiplier > 1.1 ? "Optimal" : soilMultiplier >= 1.0 ? "Good" : "Sub-optimal",
      phEfficiencyPct: Math.round(88 * soilMultiplier),
      seasonSuitability: "Favorable for current regional agro-climate",
      weatherImpact: "Normal growing conditions with standard irrigation",
      harvestWindow: "Standard seasonal maturity cycle",
      actionableSteps: [
        "Incorporate organic compost to enhance water retention capacity",
        "Adopt micro-irrigation (drip) to boost water use efficiency by 25%",
        "Apply bio-fertilizers (Azotobacter / PSB) at early root establishment"
      ],
      aiRecommendation: `Ensure proper drainage and consistent nutrient schedule during vegetative growth for ${crop}.`,
      source: "agronomic_rule_engine"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper for Haversine distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// 2. Dynamic Price & Surge Demand Model (Advanced with ML Microservice)
export const predictPriceTrends = async (req, res) => {
  try {
    const { crop, latitude, longitude } = req.body;
    if (!crop) return res.status(400).json({ error: "Crop required" });
    const target = crop.toLowerCase();

    // 1. Calculate Supply and Competitor Prices
    const cropsInDb = await Crop.find({ name: new RegExp(target, "i") });
    let totalSupply = 0;
    
    let globalPrices = [];
    let localPrices = [];

    cropsInDb.forEach(c => {
      if (c.unit === "tons" || c.unit === "tonnes") totalSupply += (c.quantity * 1000);
      else totalSupply += c.quantity;

      globalPrices.push(c.price);

      if (latitude && longitude && c.latitude && c.longitude) {
        const dist = calculateDistance(latitude, longitude, c.latitude, c.longitude);
        if (dist <= 25) { // 25 km radius
          localPrices.push(c.price);
        }
      }
    });

    const globalAvg = globalPrices.length > 0 ? (globalPrices.reduce((a,b)=>a+b,0)/globalPrices.length) : 0;
    const localAvg = localPrices.length > 0 ? (localPrices.reduce((a,b)=>a+b,0)/localPrices.length) : globalAvg;

    // 2. Calculate Demand
    const recentOrders = await Order.find({ cropName: new RegExp(target, "i"), status: { $ne: "cancelled" } }).limit(200);
    let totalDemand = recentOrders.reduce((sum, o) => sum + o.quantity, 0);

    // 3. Call Advanced Python ML Microservice
    // We send two requests: one using global competitor price, one using local 25km competitor price.
    // In a real scenario, we'd fetch actual rainfall_mm and climate_change_index from a weather API.
    // For now, we mock realistic values based on typical Indian climate.
    
    const basePayload = {
      crop_name: target,
      rainfall_mm: 120.5,
      past_orders_volume: totalDemand,
      climate_change_index: 0.8
    };

    let globalPredictionResult = null;
    let localPredictionResult = null;

    try {
      globalPredictionResult = await runPythonScript("/predict/price", { ...basePayload, competitor_avg_price: globalAvg });
      localPredictionResult = await runPythonScript("/predict/price", { ...basePayload, competitor_avg_price: localAvg });
    } catch (mlErr) {
      console.warn("Python ML Price Prediction failed, using fallback", mlErr.message);
    }

    if (globalPredictionResult && localPredictionResult) {
       return res.json({
         crop: target,
         totalSupplyKg: totalSupply,
         recentDemandKg: totalDemand,
         globalAverage: globalAvg,
         local25kmAverage: localAvg,
         globalPrediction: globalPredictionResult,
         localPrediction: localPredictionResult,
         mlUsed: true
       });
    }

    // Static Fallback Logic if ML fails
    const baseDemandRatio = totalSupply > 0 ? (totalDemand / totalSupply) : 2.0;
    const orderVelocity = Math.min(recentOrders.length / 50, 2.0);
    const marketMomentum = baseDemandRatio * orderVelocity;

    let status = "Stable";
    let surgeMultiplier = 1.0;
    let expectedTrend = "Neutral";
    
    if (marketMomentum > 1.5) {
      status = "High Demand";
      surgeMultiplier = 1.15;
      expectedTrend = "Upward";
    } else if (marketMomentum < 0.5 && totalSupply > 50) {
      status = "Low Demand";
      surgeMultiplier = 0.90;
      expectedTrend = "Downward";
    }

    return res.json({
      crop: target,
      totalSupplyKg: totalSupply,
      recentDemandKg: totalDemand,
      globalAverage: globalAvg,
      local25kmAverage: localAvg,
      globalPrediction: {
        suggested_price: Math.round(globalAvg * surgeMultiplier) || 40,
        market_trend: expectedTrend
      },
      localPrediction: {
        suggested_price: Math.round(localAvg * surgeMultiplier) || 40,
        market_trend: expectedTrend
      },
      mlUsed: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Smart ETA & Delay Risk Prediction
export const predictDeliveryETA = async (req, res) => {
  try {
    const { agentLat, agentLng, destLat, destLng, orderSizeKg } = req.body;
    if (!agentLat || !destLat) return res.status(400).json({ error: "Coordinates required" });

    const distanceKm = getDistance(parseFloat(agentLat), parseFloat(agentLng), parseFloat(destLat), parseFloat(destLng));
    
    let speedKmPerMin = 0.5;
    const currentHourDecimal = new Date().getHours() + (new Date().getMinutes() / 60);
    
    const calcGaussianPenalty = (x, mu, sigma, maxPenalty) => maxPenalty * Math.exp(-Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2)));
    const morningPenalty = calcGaussianPenalty(currentHourDecimal, 9.0, 1.5, 0.45);
    const eveningPenalty = calcGaussianPenalty(currentHourDecimal, 18.0, 2.0, 0.50);
    const trafficPenalty = Math.max(morningPenalty, eveningPenalty);

    speedKmPerMin *= (1 - trafficPenalty);
    const sizePenaltyMins = orderSizeKg > 500 ? 15 : orderSizeKg > 100 ? 5 : 0;
    const travelTimeMins = (distanceKm / speedKmPerMin) + sizePenaltyMins;
    
    let riskLevel = "Low";
    let riskReason = null;
    if (distanceKm > 50) { riskLevel = "High"; riskReason = "Long distance delivery."; }
    else if (trafficPenalty > 0.3) { riskLevel = "Medium"; riskReason = "High traffic density time."; }
    else if (orderSizeKg > 1000) { riskLevel = "Medium"; riskReason = "Heavy cargo logistics."; }

    res.json({
      distanceKm: distanceKm.toFixed(2), estimatedTimeMins: Math.ceil(travelTimeMins),
      trafficPenaltyPct: Math.round(trafficPenalty * 100), isRushHour: trafficPenalty > 0.15,
      riskLevel, riskReason
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. NLP Review Sentiment Analysis
export const analyzeSentiment = async (req, res) => {
  try {
    const { reviewText } = req.body;
    if (!reviewText) return res.status(400).json({ error: "Review text required" });

    const text = reviewText.toLowerCase();
    const positiveWords = ["excellent", "good", "great", "fast", "fresh", "amazing", "quick", "polite", "helpful", "awesome", "perfect"];
    const negativeWords = ["bad", "slow", "late", "rotten", "rude", "poor", "terrible", "worst", "delayed", "expensive", "stale"];
    const toxicWords = ["scam", "fraud", "stole", "fake", "cheat", "abusive"];

    let score = 0; let toxicFlag = false;
    const words = text.split(/[\s,.-]+/);

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.2;
      if (negativeWords.includes(word)) score -= 0.3;
      if (toxicWords.includes(word)) { score -= 0.8; toxicFlag = true; }
    });

    score = Math.max(-1, Math.min(1, score));
    let sentiment = "Neutral";
    if (score > 0.2) sentiment = "Positive";
    else if (score < -0.2) sentiment = "Negative";

    let recommendedTrustAdjustment = 0;
    if (score > 0.5) recommendedTrustAdjustment = 2;
    if (score < -0.3) recommendedTrustAdjustment = -2;
    if (toxicFlag) recommendedTrustAdjustment = -10;

    res.json({ score: score.toFixed(2), sentiment, isToxic: toxicFlag, recommendedTrustAdjustment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const CROP_TYPE_MAP = {
  // Vegetables
  tomato: "Vegetables", potato: "Vegetables", onion: "Vegetables", cabbage: "Vegetables",
  cauliflower: "Vegetables", brinjal: "Vegetables", carrot: "Vegetables", spinach: "Vegetables",
  okra: "Vegetables", cucumber: "Vegetables", "bitter gourd": "Vegetables", capsicum: "Vegetables",
  radish: "Vegetables", beetroot: "Vegetables",
  // Grains & Millets
  rice: "Grains & Millets", paddy: "Grains & Millets", wheat: "Grains & Millets", maize: "Grains & Millets",
  corn: "Grains & Millets", jowar: "Grains & Millets", bajra: "Grains & Millets", ragi: "Grains & Millets",
  barley: "Grains & Millets", millets: "Grains & Millets",
  // Pulses
  toor: "Pulses", "toor dal": "Pulses", moong: "Pulses", "moong dal": "Pulses",
  urad: "Pulses", "urad dal": "Pulses", gram: "Pulses", chickpea: "Pulses",
  soybean: "Pulses", peas: "Pulses", lentils: "Pulses",
  // Fruits
  banana: "Fruits", mango: "Fruits", papaya: "Fruits", watermelon: "Fruits",
  apple: "Fruits", orange: "Fruits", grapes: "Fruits", guava: "Fruits",
  pomegranate: "Fruits", muskmelon: "Fruits", lemon: "Fruits",
  // Spices & Cash Crops
  chili: "Spices & Cash Crops", chilli: "Spices & Cash Crops", turmeric: "Spices & Cash Crops",
  ginger: "Spices & Cash Crops", garlic: "Spices & Cash Crops", cotton: "Spices & Cash Crops",
  sugarcane: "Spices & Cash Crops", groundnut: "Spices & Cash Crops", mustard: "Spices & Cash Crops",
  coriander: "Spices & Cash Crops", cumin: "Spices & Cash Crops"
};

export const getMarketDemand = async (req, res) => {
  try {
    const crops = await Crop.find({}).lean();
    const recentOrders = await Order.find({ status: { $ne: "cancelled" } }).populate("crop", "name category price").limit(500).lean();

    const cropMap = {};
    crops.forEach(c => {
      const name = c.name?.toLowerCase()?.trim();
      if (!name) return;
      const type = CROP_TYPE_MAP[name] || (c.category ? c.category.charAt(0).toUpperCase() + c.category.slice(1) : "Vegetables");
      if (!cropMap[name]) {
        cropMap[name] = { 
          crop: c.name, 
          category: type,
          totalSupplyKg: 0, 
          totalDemandKg: 0,
          priceSum: 0,
          priceCount: 0
        };
      }
      cropMap[name].totalSupplyKg += c.quantity || 0;
      if (c.price) {
        cropMap[name].priceSum += c.price;
        cropMap[name].priceCount += 1;
      }
    });

    recentOrders.forEach(o => {
      const name = (o.crop?.name || o.productSnapshot?.name || "").toLowerCase().trim();
      if (!name) return;
      const type = CROP_TYPE_MAP[name] || (o.crop?.category ? o.crop.category.charAt(0).toUpperCase() + o.crop.category.slice(1) : "Vegetables");
      if (!cropMap[name]) {
        cropMap[name] = { 
          crop: name.charAt(0).toUpperCase() + name.slice(1), 
          category: type,
          totalSupplyKg: 0, 
          totalDemandKg: 0,
          priceSum: 0,
          priceCount: 0
        };
      }
      cropMap[name].totalDemandKg += o.quantity || 0;
      if (o.pricePerUnit) {
        cropMap[name].priceSum += o.pricePerUnit;
        cropMap[name].priceCount += 1;
      }
    });

    // Curated comprehensive items to guarantee each category is represented
    const defaultCategories = [
      { crop: "Tomato", category: "Vegetables", totalSupplyKg: 350, totalDemandKg: 620, avgPrice: 38 },
      { crop: "Onion", category: "Vegetables", totalSupplyKg: 500, totalDemandKg: 850, avgPrice: 32 },
      { crop: "Potato", category: "Vegetables", totalSupplyKg: 600, totalDemandKg: 520, avgPrice: 26 },
      { crop: "Green Chilli", category: "Vegetables", totalSupplyKg: 120, totalDemandKg: 280, avgPrice: 75 },
      { crop: "Rice (Sona Masoori)", category: "Grains & Millets", totalSupplyKg: 1200, totalDemandKg: 2400, avgPrice: 58 },
      { crop: "Wheat", category: "Grains & Millets", totalSupplyKg: 800, totalDemandKg: 1100, avgPrice: 42 },
      { crop: "Jowar (Sorghum)", category: "Grains & Millets", totalSupplyKg: 300, totalDemandKg: 450, avgPrice: 35 },
      { crop: "Ragi (Finger Millet)", category: "Grains & Millets", totalSupplyKg: 150, totalDemandKg: 320, avgPrice: 46 },
      { crop: "Toor Dal (Red Gram)", category: "Pulses", totalSupplyKg: 250, totalDemandKg: 580, avgPrice: 92 },
      { crop: "Moong Dal", category: "Pulses", totalSupplyKg: 180, totalDemandKg: 310, avgPrice: 88 },
      { crop: "Chickpea (Chana)", category: "Pulses", totalSupplyKg: 320, totalDemandKg: 420, avgPrice: 70 },
      { crop: "Banana (Yellaki)", category: "Fruits", totalSupplyKg: 400, totalDemandKg: 780, avgPrice: 34 },
      { crop: "Papaya", category: "Fruits", totalSupplyKg: 300, totalDemandKg: 490, avgPrice: 40 },
      { crop: "Mango (Banganapalli)", category: "Fruits", totalSupplyKg: 200, totalDemandKg: 600, avgPrice: 90 },
      { crop: "Turmeric (Salem)", category: "Spices & Cash Crops", totalSupplyKg: 180, totalDemandKg: 420, avgPrice: 98 },
      { crop: "Cotton (Bt Cotton)", category: "Spices & Cash Crops", totalSupplyKg: 500, totalDemandKg: 800, avgPrice: 165 },
      { crop: "Ginger", category: "Spices & Cash Crops", totalSupplyKg: 110, totalDemandKg: 290, avgPrice: 95 }
    ];

    defaultCategories.forEach(def => {
      const k = def.crop.toLowerCase().trim();
      if (!cropMap[k]) {
        cropMap[k] = {
          crop: def.crop,
          category: def.category,
          totalSupplyKg: def.totalSupplyKg,
          totalDemandKg: def.totalDemandKg,
          priceSum: def.avgPrice,
          priceCount: 1
        };
      }
    });

    const demand = Object.values(cropMap).map(c => {
      const supply = c.totalSupplyKg || 0;
      const dem = c.totalDemandKg || 0;
      const ratio = supply > 0 ? dem / supply : (dem > 0 ? 2.0 : 0.5);
      
      let status = "Stable";
      let priceTrend = "stable";
      let suggestedAction = "⚖️ Balanced market. Consistent orders at benchmark rates.";

      if (ratio >= 0.75 || dem > supply) {
        status = "High Demand";
        priceTrend = "up";
        suggestedAction = "🔥 Peak buyer demand! Excellent time to harvest and list.";
      } else if (ratio < 0.25 && supply > 100) {
        status = "Low Demand";
        priceTrend = "down";
        suggestedAction = "❄️ High market supply. Consider cold storage or deferred listing.";
      }

      const avgPrice = c.priceCount > 0 ? Math.round(c.priceSum / c.priceCount) : 40;

      return {
        crop: c.crop,
        category: c.category || "Vegetables",
        totalSupplyKg: supply,
        totalDemandKg: dem,
        demandRatio: Number(ratio.toFixed(2)),
        status,
        priceTrend,
        avgPrice,
        suggestedAction
      };
    });

    demand.sort((a, b) => {
      const order = { "High Demand": 0, "Stable": 1, "Low Demand": 2 };
      return (order[a.status] || 1) - (order[b.status] || 1);
    });

    res.json({ demand });
  } catch (error) {
    res.json({ demand: [] });
  }
};

export const retrainEnsemble = async (req, res) => { 
  try {
    const io = req.app?.get?.("io");
    
    // Immediate HTTP response so the admin dashboard doesn't time out
    res.json({ 
      success: true, 
      message: "Continuous ensemble retraining initiated. Ingesting live crops, orders, and searches from MongoDB." 
    });
    
    // Execute real retraining asynchronously with Socket.io streaming
    console.log("[ML Server] Starting live real-data continuous retraining pipeline...");
    executeRetrainingPipeline("manual_admin", io).catch(err => {
      console.error("[ML Server] Retraining pipeline execution error:", err);
    });

  } catch (error) {
    console.error("Retrain Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getLearningTelemetry = async (req, res) => {
  try {
    const status = await getContinuousLearningStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Real-Time Weather-Based Seasonal Crop Prediction ───
// Uses Open-Meteo API (free, no key) to fetch live weather for the user's exact location,
// then classifies the agro-climatic zone and recommends crops with realistic reasoning.

const AGRO_CLIMATIC_CROP_DB = {
  // Hot Arid / Semi-Arid (Rajasthan, parts of Gujarat, AP)
  hot_arid: {
    kharif: ["bajra", "jowar", "guar", "moth_bean", "cluster_bean", "watermelon", "castor"],
    rabi: ["mustard", "wheat", "barley", "cumin", "fenugreek", "isabgol"],
    zaid: ["cucumber", "watermelon", "muskmelon", "bottle_gourd"]
  },
  // Tropical Humid (Kerala, coastal Karnataka, Konkan)
  tropical_humid: {
    kharif: ["rice", "coconut", "arecanut", "rubber", "ginger", "turmeric", "pepper", "cardamom", "banana"],
    rabi: ["tapioca", "sweet_potato", "yam", "vegetables"],
    zaid: ["banana", "pineapple", "jackfruit", "mango"]
  },
  // Subtropical (UP, Bihar, MP, Maharashtra interior)
  subtropical: {
    kharif: ["rice", "maize", "soybean", "cotton", "sugarcane", "groundnut", "pigeon_pea", "brinjal", "okra", "chili"],
    rabi: ["wheat", "potato", "onion", "peas", "mustard", "gram", "lentil", "cauliflower", "cabbage", "spinach", "carrot", "garlic"],
    zaid: ["watermelon", "cucumber", "muskmelon", "sunflower", "moong"]
  },
  // Temperate (Himachal, J&K, Uttarakhand, NE hills)
  temperate: {
    kharif: ["maize", "rice", "finger_millet", "soybean", "ginger"],
    rabi: ["wheat", "barley", "apple", "walnut", "plum", "peas", "potato"],
    zaid: ["vegetables", "beans", "cherry", "apricot"]
  },
  // Coastal (Tamil Nadu, AP coast, Odisha coast, WB coast)
  coastal: {
    kharif: ["rice", "coconut", "sugarcane", "banana", "cashew", "jute", "groundnut"],
    rabi: ["black_gram", "green_gram", "sesame", "sunflower", "chili"],
    zaid: ["watermelon", "cucumber", "vegetables"]
  },
  // Default / Mixed
  mixed: {
    kharif: ["rice", "maize", "cotton", "groundnut", "sugarcane", "tomato", "brinjal", "chili", "okra", "turmeric", "ginger"],
    rabi: ["wheat", "mustard", "peas", "potato", "onion", "carrot", "cabbage", "cauliflower", "spinach", "garlic"],
    zaid: ["watermelon", "cucumber", "mango", "papaya", "sunflower", "moong"]
  }
};

// Crop display names for cleaner output
const CROP_DISPLAY = {
  bajra: "Bajra (Pearl Millet)", jowar: "Jowar (Sorghum)", guar: "Guar", moth_bean: "Moth Bean",
  cluster_bean: "Cluster Bean", castor: "Castor", isabgol: "Isabgol (Psyllium)", cumin: "Cumin",
  fenugreek: "Fenugreek (Methi)", arecanut: "Arecanut", rubber: "Rubber", pepper: "Black Pepper",
  cardamom: "Cardamom", tapioca: "Tapioca", sweet_potato: "Sweet Potato", yam: "Yam",
  pigeon_pea: "Pigeon Pea (Toor Dal)", finger_millet: "Ragi (Finger Millet)", walnut: "Walnut",
  plum: "Plum", cherry: "Cherry", apricot: "Apricot", jute: "Jute", cashew: "Cashew",
  black_gram: "Black Gram (Urad)", green_gram: "Green Gram (Moong)", sesame: "Sesame",
  sunflower: "Sunflower", moong: "Moong Dal", bottle_gourd: "Bottle Gourd", gram: "Chickpea (Gram)",
  lentil: "Masoor Dal", beans: "Beans", vegetables: "Mixed Vegetables", muskmelon: "Muskmelon",
  rice: "Rice", wheat: "Wheat", maize: "Maize", cotton: "Cotton", groundnut: "Groundnut",
  sugarcane: "Sugarcane", tomato: "Tomato", brinjal: "Brinjal", chili: "Green Chili",
  okra: "Okra (Bhindi)", turmeric: "Turmeric", ginger: "Ginger", mustard: "Mustard",
  peas: "Green Peas", potato: "Potato", onion: "Onion", carrot: "Carrot",
  cabbage: "Cabbage", cauliflower: "Cauliflower", spinach: "Spinach", garlic: "Garlic",
  watermelon: "Watermelon", cucumber: "Cucumber", mango: "Mango", papaya: "Papaya",
  banana: "Banana", pineapple: "Pineapple", jackfruit: "Jackfruit", coconut: "Coconut",
  soybean: "Soybean", barley: "Barley", apple: "Apple"
};

function classifyAgroZone(lat, temp, humidity, rainfall) {
  // Altitude approximation: higher latitudes in India tend to be hilly/temperate
  if (lat > 30 && temp < 25) return "temperate";
  if (humidity > 75 && rainfall > 5 && temp > 27) return "tropical_humid";
  if (temp > 35 && humidity < 40 && rainfall < 1) return "hot_arid";
  if (lat < 15 || (humidity > 65 && temp > 25)) return "coastal";
  if (temp >= 20 && temp <= 35) return "subtropical";
  return "mixed";
}

function getIndianSeason(month) {
  if (month >= 6 && month <= 10) return "kharif";
  if (month >= 11 || month <= 2) return "rabi";
  return "zaid";
}

export const getSeasonalPrediction = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "Latitude and Longitude required" });

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // 1. Fetch REAL weather from Open-Meteo (free, no API key needed)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&timezone=Asia/Kolkata&forecast_days=7`;
    
    let weatherData;
    try {
      const weatherRes = await fetch(weatherUrl);
      weatherData = await weatherRes.json();
    } catch (err) {
      console.error("Open-Meteo fetch failed:", err.message);
      weatherData = null;
    }

    const now = weatherData?.current || {};
    const daily = weatherData?.daily || {};
    const currentTemp = now.temperature_2m ?? 28;
    const currentHumidity = now.relative_humidity_2m ?? 60;
    const currentRainfall = now.precipitation ?? 0;
    const windSpeed = now.wind_speed_10m ?? 5;
    const weatherCode = now.weather_code ?? 0;

    // 7-day forecast summary
    const weeklyMaxTemps = daily.temperature_2m_max || [];
    const weeklyMinTemps = daily.temperature_2m_min || [];
    const weeklyRainfall = daily.precipitation_sum || [];
    const avgMaxTemp = weeklyMaxTemps.length > 0 ? (weeklyMaxTemps.reduce((a, b) => a + b, 0) / weeklyMaxTemps.length) : currentTemp;
    const avgMinTemp = weeklyMinTemps.length > 0 ? (weeklyMinTemps.reduce((a, b) => a + b, 0) / weeklyMinTemps.length) : currentTemp - 8;
    const totalWeeklyRainfall = weeklyRainfall.reduce((a, b) => a + b, 0);
    const avgDailyRainfall = totalWeeklyRainfall / 7;

    // 2. Classify Agro-Climatic Zone
    const zone = classifyAgroZone(latitude, currentTemp, currentHumidity, avgDailyRainfall);
    const month = new Date().getMonth() + 1;
    const season = getIndianSeason(month);
    const seasonLabel = season === "kharif" ? "Kharif (Monsoon)" : season === "rabi" ? "Rabi (Winter)" : "Zaid (Summer)";

    // 3. Get crops for this zone + season
    const zoneData = AGRO_CLIMATIC_CROP_DB[zone] || AGRO_CLIMATIC_CROP_DB.mixed;
    const rawCrops = zoneData[season] || zoneData.kharif;

    // 4. Score each crop based on current weather suitability
    const scoredCrops = rawCrops.map(cropKey => {
      let score = 50; // base
      const displayName = CROP_DISPLAY[cropKey] || cropKey.charAt(0).toUpperCase() + cropKey.slice(1);

      // Temperature suitability
      if (currentTemp >= 20 && currentTemp <= 30) score += 15; // ideal subtropical
      else if (currentTemp > 35) {
        if (["watermelon", "muskmelon", "bajra", "jowar", "castor", "cucumber"].includes(cropKey)) score += 20;
        else score -= 10;
      } else if (currentTemp < 15) {
        if (["wheat", "peas", "potato", "mustard", "apple", "barley"].includes(cropKey)) score += 20;
        else score -= 10;
      }

      // Rainfall suitability
      if (avgDailyRainfall > 5) {
        if (["rice", "sugarcane", "jute", "ginger", "turmeric", "banana"].includes(cropKey)) score += 20;
        else if (["wheat", "mustard", "cumin", "bajra"].includes(cropKey)) score -= 15;
      } else if (avgDailyRainfall < 1) {
        if (["bajra", "jowar", "watermelon", "castor", "gram"].includes(cropKey)) score += 15;
        else if (["rice", "jute", "sugarcane"].includes(cropKey)) score -= 10;
      }

      // Humidity
      if (currentHumidity > 80) {
        if (["rice", "coconut", "banana", "ginger"].includes(cropKey)) score += 10;
      } else if (currentHumidity < 35) {
        if (["bajra", "jowar", "castor", "cumin"].includes(cropKey)) score += 10;
      }

      // Millets promotion bonus (admin priority)
      if (["bajra", "jowar", "finger_millet", "maize"].includes(cropKey)) score += 8;

      score = Math.min(100, Math.max(10, score));

      return {
        name: displayName,
        key: cropKey,
        suitabilityScore: score,
        reason: generateCropReason(cropKey, currentTemp, currentHumidity, avgDailyRainfall, zone)
      };
    });

    // Sort by suitability score descending
    scoredCrops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    // Weather description
    const weatherDescriptions = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
      55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
      71: "Slight snow", 73: "Moderate snow", 80: "Slight showers", 81: "Moderate showers",
      82: "Violent showers", 95: "Thunderstorm", 96: "Thunderstorm with hail"
    };

    const zoneDisplayNames = {
      hot_arid: "Hot Arid / Semi-Arid",
      tropical_humid: "Tropical Humid",
      subtropical: "Sub-Tropical",
      temperate: "Temperate Highland",
      coastal: "Coastal",
      mixed: "Mixed / Transitional"
    };

    // 5. Build the final response
    res.json({
      season: seasonLabel,
      month,
      agroClimaticZone: zoneDisplayNames[zone] || zone,
      weather: {
        temperature: currentTemp,
        humidity: currentHumidity,
        rainfall: currentRainfall,
        windSpeed,
        condition: weatherDescriptions[weatherCode] || "Unknown",
        weekForecast: {
          avgMaxTemp: Math.round(avgMaxTemp * 10) / 10,
          avgMinTemp: Math.round(avgMinTemp * 10) / 10,
          totalRainfall: Math.round(totalWeeklyRainfall * 10) / 10,
          avgDailyRainfall: Math.round(avgDailyRainfall * 10) / 10
        }
      },
      recommendedCrops: scoredCrops.slice(0, 8),
      insights: generateSeasonalInsights(currentTemp, currentHumidity, avgDailyRainfall, zone, season),
      cropNames: scoredCrops.slice(0, 8).map(c => c.key),
      suggestedConsumptionProducts: generateSeasonalDietRecommendations(season, currentTemp, currentHumidity)
    });
  } catch (error) {
    console.error("Seasonal Prediction Error:", error);
    res.status(500).json({ error: error.message });
  }
};

function generateCropReason(crop, temp, humidity, rainfall, zone) {
  const reasons = {
    rice: `Rice thrives in ${temp > 25 ? "warm" : "current"} temperatures (${temp}°C) with ${rainfall > 2 ? "adequate" : "supplemental"} water supply. Ideal for ${zone} zone.`,
    wheat: `Wheat performs best in cool weather (${temp}°C). ${temp < 25 ? "Current conditions are favorable." : "Consider irrigation to manage heat stress."}`,
    maize: `Maize is resilient at ${temp}°C with ${humidity}% humidity. ${rainfall > 1 ? "Good moisture conditions." : "Ensure drip irrigation."}`,
    bajra: `Pearl Millet is drought-resistant, perfect for ${humidity < 50 ? "dry" : "moderate"} conditions. Promotes soil health and requires minimal water.`,
    jowar: `Sorghum excels in ${temp > 30 ? "hot" : "warm"} weather with low water needs. A healthy millet alternative to rice.`,
    potato: `Potato yields best in cool conditions (${temp}°C). ${temp < 20 ? "Excellent growing weather." : "Use mulching to keep soil cool."}`,
    onion: `Onion grows well at ${temp}°C. ${humidity < 70 ? "Low humidity reduces disease risk." : "Monitor for fungal issues."}`,
    tomato: `Tomato thrives at ${temp}°C. ${temp > 20 && temp < 30 ? "Ideal temperature range." : "Consider shade-net protection."}`,
    sugarcane: `Sugarcane needs ${rainfall > 3 ? "the available" : "supplemental"} moisture and ${temp > 25 ? "warm" : "mild"} temperatures for optimal growth.`,
    cotton: `Cotton grows optimally at ${temp}°C with ${humidity}% humidity. ${temp > 25 ? "Favorable conditions." : "May face slow germination."}`,
    mango: `Mango trees fruit best in warm dry weather. Current ${temp}°C is ${temp > 25 ? "ideal" : "marginal"} for flowering.`,
    watermelon: `Watermelon loves heat (${temp}°C) and ${humidity < 60 ? "dry air" : "moderate humidity"}. Fast-growing summer cash crop.`,
    cucumber: `Cucumber grows rapidly at ${temp}°C. ${temp > 20 ? "Good conditions" : "Use polytunnel"} for best results.`,
    groundnut: `Groundnut performs well in ${zone} conditions with ${temp}°C temperature and ${rainfall > 1 ? "adequate" : "managed"} water.`,
    ginger: `Ginger prefers ${humidity > 60 ? "humid" : "moderate"} conditions and partial shade. ${rainfall > 2 ? "Good moisture." : "Needs regular watering."}`,
    turmeric: `Turmeric thrives in ${humidity > 60 ? "humid tropical" : "warm"} conditions at ${temp}°C. High-value spice crop.`,
    mustard: `Mustard grows best in cool, dry weather. ${temp < 25 ? "Ideal conditions." : "Slightly warm but manageable."}`,
    peas: `Peas prefer cool temperatures. ${temp < 22 ? "Perfect growing weather." : "Consider altitude or shade."}`,
    spinach: `Spinach yields well in ${temp < 25 ? "cool" : "mild"} weather with ${humidity}% humidity.`,
    garlic: `Garlic bulbs develop best in ${temp < 25 ? "cool" : "moderate"} conditions. High market demand year-round.`,
    carrot: `Carrots grow deep roots in ${temp < 25 ? "cool" : "warm"} soil. ${zone} zone soil is typically suitable.`,
    cabbage: `Cabbage heads form well at ${temp}°C. ${temp < 22 ? "Excellent" : "Adequate"} growing conditions.`,
    cauliflower: `Cauliflower needs ${temp < 25 ? "cool weather like now" : "cooler nights"} for tight curd formation.`,
    banana: `Banana grows year-round in ${temp > 25 ? "warm" : "mild"} tropical conditions with ${rainfall > 2 ? "good rainfall" : "irrigation"}.`,
    coconut: `Coconut palms thrive in coastal ${zone} climate with ${humidity}% humidity and ${temp}°C temperatures.`,
    apple: `Apple orchards need cool temperatures (${temp}°C). ${temp < 20 ? "Good chilling conditions for fruiting." : "May need higher altitude."}`,
    finger_millet: `Ragi is highly nutritious and drought-resistant. Grows well at ${temp}°C in ${zone} conditions. Government promotes millet cultivation.`,
    soybean: `Soybean grows well at ${temp}°C with ${humidity}% humidity. ${rainfall > 2 ? "Adequate moisture." : "Consider supplemental irrigation."}`,
  };
  return reasons[crop] || `Suitable for ${zone} agro-climatic zone at ${temp}°C, ${humidity}% humidity, and ${rainfall}mm rainfall.`;
}

function generateSeasonalInsights(temp, humidity, rainfall, zone, season) {
  const insights = [];
  
  if (temp > 38) insights.push("🔥 Extreme heat detected. Focus on drought-resistant crops like millets, castor, and watermelon. Use mulching and drip irrigation.");
  else if (temp > 32) insights.push("☀️ Hot conditions. Ensure adequate irrigation. Morning/evening watering recommended.");
  else if (temp < 15) insights.push("❄️ Cool temperatures favor Rabi crops like wheat, mustard, and peas. Protect tender seedlings from frost.");
  
  if (rainfall > 10) insights.push("🌧️ Heavy rainfall expected. Prioritize water-loving crops (rice, sugarcane). Ensure proper field drainage.");
  else if (rainfall > 3) insights.push("🌦️ Moderate rainfall conditions. Good for most Kharif crops. Monitor for waterlogging.");
  else if (rainfall < 0.5) insights.push("🏜️ Very low rainfall. Use drip irrigation and focus on drought-tolerant varieties. Conserve soil moisture with mulching.");
  
  if (humidity > 80) insights.push("💧 High humidity increases disease risk. Apply preventive fungicides and ensure good air circulation between plants.");
  
  insights.push("🌾 Consider growing millets (Bajra, Jowar, Ragi) instead of rice — they use 70% less water and have rising market demand.");
  
  if (season === "kharif") insights.push("🌱 Kharif season tip: Prepare nursery beds early. Treat seeds with bio-agents before sowing to prevent soil-borne diseases.");
  if (season === "rabi") insights.push("🌿 Rabi season tip: Apply basal dose of phosphorus and potash before sowing. Use zero-tillage for wheat to save costs.");
  if (season === "zaid") insights.push("☀️ Zaid season tip: Focus on short-duration vegetables and melons. Use shade nets to protect against intense summer heat.");
  
  insights.push("🚫 Do NOT burn crop residue after harvest. It causes severe air pollution and destroys beneficial soil organisms. Use composting or sell to biogas plants.");
  
  return insights;
}

function generateSeasonalDietRecommendations(season, temp, humidity) {
  // Zaid / Summer / High heat conditions
  if (season === "zaid" || temp > 30) {
    return [
      {
        name: "Watermelon",
        icon: "🍉",
        category: "Hydration & Electrolytes",
        badge: "92% Water Content",
        benefit: "Prevents severe heat stroke, replenishes electrolytes lost in sweat, and delivers potent cooling lycopene.",
        nutrients: "Lycopene, Citrulline, Potassium, Vit C",
        ayurveda: "Sheeta (Natural Coolant)",
        searchKeyword: "watermelon"
      },
      {
        name: "Cucumber",
        icon: "🥒",
        category: "Hydration & Detox",
        badge: "Zero Calorie Coolant",
        benefit: "Flushes uric acid, maintains gut pH balance, and prevents afternoon dehydration fatigue.",
        nutrients: "Silica, Caffeic Acid, Fiber, Water",
        ayurveda: "Pitta Pacifying (Balances Heat)",
        searchKeyword: "cucumber"
      },
      {
        name: "Raw Mango (Kairi)",
        icon: "🥭",
        category: "Heat Defense & Minerals",
        badge: "Loo & Stroke Defense",
        benefit: "Consuming raw mango panna prevents heat stroke, treats sodium exhaustion, and boosts iron absorption.",
        nutrients: "Vitamin C, Pectin, Malic Acid, Sodium",
        ayurveda: "Balances Tridosha in Extreme Heat",
        searchKeyword: "mango"
      },
      {
        name: "Bottle Gourd (Sorakaya / Lauki)",
        icon: "🍈",
        category: "Digestive Balance",
        badge: "Light & Alkalizing",
        benefit: "Extremely easy to digest in summer when metabolic fire is low; naturally cools body temperature.",
        nutrients: "Dietary Fiber, Zinc, Magnesium, Thiamine",
        ayurveda: "Deepana (Gentle Digestive)",
        searchKeyword: "gourd"
      },
      {
        name: "Mint & Coriander Leaves",
        icon: "🌿",
        category: "Cooling Digestive Herb",
        badge: "Anti-Acidity Herbal",
        benefit: "Relieves heartburn, summer acid reflux, and body odor by cooling the internal digestive tract.",
        nutrients: "Menthol, Rosmarinic Acid, Chlorophyll",
        ayurveda: "Sheeta & Rechana (Cooling Cleanser)",
        searchKeyword: "mint"
      },
      {
        name: "Tender Coconut & Lemon",
        icon: "🥥",
        category: "Natural Isotonic Drink",
        badge: "Instant Rehydration",
        benefit: "Balances cellular electrolytes and prevents heat cramps without artificial sugars or preservatives.",
        nutrients: "Natural Electrolytes, Potassium, Bio-active Enzymes",
        ayurveda: "Hridya (Heart & Vitality Tonic)",
        searchKeyword: "lemon"
      }
    ];
  } else if (season === "kharif" || humidity > 70) {
    // Kharif / Monsoon / High humidity
    return [
      {
        name: "Fresh Ginger (Adrak)",
        icon: "🫚",
        category: "Immunity & Digestion",
        badge: "Monsoon Digestive Tonic",
        benefit: "Stimulates digestive enzymes during damp weather, clears respiratory congestion, and stops nausea.",
        nutrients: "Gingerol, Shogaols, Chromium, Magnesium",
        ayurveda: "Agni Deepana (Kindles Digestive Fire)",
        searchKeyword: "ginger"
      },
      {
        name: "Raw Turmeric (Pasupu)",
        icon: "🟡",
        category: "Anti-Viral & Immunity",
        badge: "Anti-Microbial Defense",
        benefit: "Potent natural antibiotic that protects against waterborne bacteria and seasonal monsoon coughs.",
        nutrients: "Curcumin, Essential Volatile Oils",
        ayurveda: "Varnya & Krimighna (Anti-Microbial)",
        searchKeyword: "turmeric"
      },
      {
        name: "Garlic (Vellulli)",
        icon: "🧄",
        category: "Infection Defense",
        badge: "Natural Antibacterial",
        benefit: "Allicin compounds strengthen white blood cells against damp climate bacterial infections.",
        nutrients: "Allicin, Sulfur compounds, Selenium",
        ayurveda: "Rasayana (Rejuvenator & Anti-toxin)",
        searchKeyword: "garlic"
      },
      {
        name: "Steamed Sweet Corn (Bhutta)",
        icon: "🌽",
        category: "Wholesome Fiber",
        badge: "Warm Energy Snack",
        benefit: "Rich in insoluble fiber that promotes smooth gut motility when wet weather slows metabolism.",
        nutrients: "Lutein, Zeaxanthin, B-Complex, Fiber",
        ayurveda: "Balya (Strength Giving)",
        searchKeyword: "maize"
      },
      {
        name: "Bitter Gourd (Karela / Kakarakaya)",
        icon: "🥒",
        category: "Blood Purification",
        badge: "Anti-Parasitic Shield",
        benefit: "Essential in rainy season to eliminate intestinal parasites and reduce blood sugar spikes.",
        nutrients: "Charantin, Polypeptide-p, Vicine",
        ayurveda: "Raktashodhaka (Blood Purifier)",
        searchKeyword: "bitter gourd"
      },
      {
        name: "Pomegranate (Danimma)",
        icon: "🍎",
        category: "Platelet & Blood Booster",
        badge: "Monsoon Vitality Booster",
        benefit: "Boosts immunity, maintains high blood platelet counts, and fights seasonal viral fatigue.",
        nutrients: "Punicalagins, Ellagic Acid, Vitamin K, Iron",
        ayurveda: "Rakta Vardhaka (Hemoglobin Enhancer)",
        searchKeyword: "pomegranate"
      }
    ];
  } else {
    // Winter (Rabi) / Cool weather
    return [
      {
        name: "Fresh Spinach & Methi (Palak)",
        icon: "🥬",
        category: "Iron & Vitality",
        badge: "Winter Super Greens",
        benefit: "Delivers dense iron, calcium, and vitamin A for blood warmth, bone strength, and winter skin glow.",
        nutrients: "Iron, Calcium, Folate, Vitamin K1",
        ayurveda: "Pushtida (Nourishing Tissue Builder)",
        searchKeyword: "spinach"
      },
      {
        name: "Carrots & Beetroot",
        icon: "🥕",
        category: "Immunity & Blood Flow",
        badge: "Vascular & Vision Health",
        benefit: "Improves blood circulation in cold mornings, supports eye health, and flushes winter sluggishness.",
        nutrients: "Beta-Carotene, Nitrates, Vitamin A",
        ayurveda: "Raktapitta Shanthi (Cooling Circulation)",
        searchKeyword: "carrot"
      },
      {
        name: "Amla (Indian Gooseberry)",
        icon: "🫒",
        category: "Maximum Vitamin C",
        badge: "Ultimate Immunity Shield",
        benefit: "Contains 20x more Vitamin C than oranges; the supreme Ayurvedic fruit to prevent winter colds and sore throats.",
        nutrients: "Ascorbic Acid, Tannins, Flavonoids",
        ayurveda: "Chyawanprash King (Anti-Aging & Defense)",
        searchKeyword: "amla"
      },
      {
        name: "Sweet Potatoes (Chilagada Dumpa)",
        icon: "🍠",
        category: "Complex Sustained Energy",
        badge: "Winter Warmth Root",
        benefit: "Provides slow-burning complex carbs and beta-carotene to sustain core body heat in crisp winter temperatures.",
        nutrients: "Complex Fiber, Potassium, Vitamin A, B6",
        ayurveda: "Vata Shamak (Calms Winter Dryness)",
        searchKeyword: "sweet potato"
      },
      {
        name: "Organic Jaggery (Bellam / Gur)",
        icon: "🍯",
        category: "Internal Warmth & Lungs",
        badge: "Unrefined Natural Warmer",
        benefit: "Cleanses respiratory tract of winter pollution, warms the stomach, and provides natural unrefined iron.",
        nutrients: "Non-centrifugal Cane Iron, Magnesium, Potassium",
        ayurveda: "Ushna (Internal Thermal Fire)",
        searchKeyword: "jaggery"
      },
      {
        name: "Citrus Oranges & Sweet Lime",
        icon: "🍊",
        category: "Hydration & Vitamin C",
        badge: "Cold Defense Booster",
        benefit: "Prevents dry winter skin, protects lungs from viral seasonal coughs, and keeps body hydrated.",
        nutrients: "Vitamin C, Hesperidin, Citric Acid",
        ayurveda: "Deepana & Ruchya (Enhances Appetite & Taste)",
        searchKeyword: "orange"
      }
    ];
  }
}
