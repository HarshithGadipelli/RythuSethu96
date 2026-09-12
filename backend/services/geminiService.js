import { GoogleGenAI } from "@google/genai";

let genAI = null;

export const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!genAI && key && key.trim().length > 10) {
    try {
      genAI = new GoogleGenAI({ apiKey: key.trim() });
    } catch (error) {
      console.warn("Failed to initialize GoogleGenAI:", error.message);
    }
  }
  return genAI;
};

export const callGeminiWithFallback = async (promptOrParts) => {
  const ai = getGenAI();
  if (!ai) return null;
  const models = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite"
  ];
  for (const m of models) {
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: promptOrParts
      });
      if (res && res.text) return res.text;
    } catch (err) {
      console.warn(`[Gemini] ${m} unavailable (${err.status || err.message}). Trying fallback...`);
    }
  }
  return null;
};

export const getGeminiCropSuggestion = async (weatherLive, soil, location) => {
  try {
    const prompt = `You are an expert Indian agricultural AI. 
Given the current weather (Temperature: ${weatherLive.temp}°C, Humidity: ${weatherLive.hum}%, Rainfall: ${weatherLive.rain}mm), 
soil type (${soil}), and location (${location || "India"}).

Suggest the best crop to plant right now. Return EXACTLY and ONLY valid JSON in this structure:
{
  "recommended_crop": "Crop Name",
  "confidence": 92,
  "category": "vegetable",
  "water_requirement": "high/medium/low",
  "growth_duration_days": 90,
  "scoring_breakdown": {
    "temperature_match": 95,
    "humidity_match": 85,
    "rainfall_match": 80
  },
  "weather_risk": "Low/Medium/High",
  "risk_details": ["risk 1", "risk 2"],
  "alternatives": [
    {"name": "Alt 1", "confidence": 85, "season": "rabi"},
    {"name": "Alt 2", "confidence": 80, "season": "kharif"}
  ],
  "farming_tips": ["tip 1", "tip 2", "tip 3"],
  "note": "A friendly concluding note for the farmer."
}

Do not include markdown blocks like \`\`\`json or \`\`\`. Just output raw JSON.`;

    const rawText = await callGeminiWithFallback(prompt);
    if (!rawText) return null;
    
    const text = rawText.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini crop suggestion error:", error);
    return null;
  }
};

export const getGeminiFarmerTips = async (crop, soil, location, stage) => {
  try {
    const prompt = `You are an expert Indian agricultural AI advising a farmer.
The farmer is growing ${crop} in ${soil} soil at location: ${location || "Unknown"}.
The current stage of the crop lifecycle is: ${stage || "sowing"}.

Provide highly actionable, practical farming advice specific to this crop, soil, and growth stage.
Return EXACTLY and ONLY valid JSON in this structure:
{
  "crop": "${crop}",
  "soil_type": "${soil}",
  "location_considered": "${location || "Unknown"}",
  "current_stage": "${stage || "sowing"}",
  "is_suitable": true,
  "suggestions": [
    "stage specific actionable tip 1",
    "stage specific actionable tip 2",
    "general weather tip",
    "soil specific tip"
  ],
  "quick_actions": [
    { "label": "Update Crop Stage", "action": "update_stage" },
    { "label": "Get Price Recommendation", "action": "price_trends" }
  ]
}

Do not include markdown blocks like \`\`\`json or \`\`\`. Just output raw JSON.`;

    const rawText = await callGeminiWithFallback(prompt);
    if (!rawText) return null;

    const text = rawText.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini farmer tips error:", error);
    return null;
  }
};
