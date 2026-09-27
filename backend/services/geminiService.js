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
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash"
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

export const getGeminiCropSuggestion = async (weatherLive, soil, location, season = "", waterAvailability = "") => {
  try {
    const seasonContext = season ? `, Cultivation Season: ${season}` : "";
    const waterContext = waterAvailability ? `, Irrigation/Water Source: ${waterAvailability}` : "";
    const prompt = `You are an expert Indian agricultural scientist and agronomist AI.
Given real-time weather conditions:
- Temperature: ${weatherLive.temp}°C
- Humidity: ${weatherLive.hum}%
- Rainfall / Precipitation: ${weatherLive.rain} mm
- Soil Type: ${soil}
- Location / Region: ${location || "India"}
${seasonContext}
${waterContext}

Analyze the agro-climatic suitability and recommend the single most profitable and optimal crop for the farmer to plant right now.
Return EXACTLY and ONLY valid JSON matching this structure (no markdown formatting, no code blocks):
{
  "recommended_crop": "Crop Name",
  "confidence": 94,
  "category": "vegetable",
  "water_requirement": "high/medium/low",
  "growth_duration_days": 90,
  "scoring_breakdown": {
    "temperature_match": 95,
    "humidity_match": 88,
    "rainfall_match": 82
  },
  "weather_risk": "Low/Medium/High",
  "risk_details": ["risk factor 1", "risk factor 2"],
  "alternatives": [
    {"name": "Alternative Crop 1", "confidence": 88, "season": "Current Season"},
    {"name": "Alternative Crop 2", "confidence": 84, "season": "Current Season"}
  ],
  "farming_tips": [
    "Seed treatment recommendation",
    "Irrigation & spacing advice",
    "Basal fertilizer application"
  ],
  "note": "Agro-climatic summary for this farm and season."
}`;

    const rawText = await callGeminiWithFallback(prompt);
    if (!rawText) return null;
    
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini crop suggestion error:", error);
    return null;
  }
};

export const getGeminiFarmerTips = async (crop, soil, location, stage, params = {}) => {
  try {
    const {
      symptoms = "None / General Maintenance",
      irrigationMethod = "Drip / Controlled",
      fertilizerUsed = "Organic Vermicompost / FYM",
      previousCrop = "Legume / Pulses",
      soilMoisture = "Optimal Moisture",
      season = "Kharif",
      temperature,
      humidity,
      rainfall
    } = params;

    const weatherContext = temperature ? `Current Weather: ${temperature}°C, ${humidity}% humidity, ${rainfall}mm rainfall.` : "";

    const prompt = `You are the Lead Agronomist AI ("Crop Doctor") for Indian agriculture.
Conduct a rigorous multi-factor diagnostic and precision management consultation for the following farm profile:
- Main Crop: ${crop}
- Current Growth Stage: ${stage || "vegetative"}
- Soil Classification: ${soil} (Soil Moisture Condition: ${soilMoisture})
- Observed Symptoms / Physical Health: ${symptoms}
- Irrigation Source & Frequency: ${irrigationMethod}
- Fertilizer / Nutrient History: ${fertilizerUsed}
- Previous Crop Rotation: ${previousCrop}
- Cultivation Season: ${season}
- Location: ${location || "Telangana / South India"}
${weatherContext}

Provide an authoritative, scientific, and practical prescription tailored to Indian smallholder farmers.
Return EXACTLY and ONLY valid JSON with this structure:
{
  "crop": "${crop}",
  "soil_type": "${soil}",
  "current_stage": "${stage || "vegetative"}",
  "vitality_score": 85,
  "health_status": "Optimal / Mild Stress / High Risk",
  "root_cause_diagnosis": "Clear explanation of what is happening (e.g. nitrogen chlorosis vs water stress)",
  "nutrient_prescription": {
    "organic_solution": "e.g. Jeevamrutha 200L/acre or Vermicompost top-dressing",
    "npk_dosage": "e.g. 15kg Urea + 10kg MOP per acre split application",
    "micronutrient_foliar": "e.g. Zinc Sulfate 0.5% + Boron 0.2% foliar spray"
  },
  "irrigation_protocol": "e.g. Irrigate every 4 days during flowering; avoid stagnant ponding",
  "pest_prevention": "e.g. Preventative spray of Neem oil (5ml/L) or Agniasthra decoction",
  "critical_next_actions": [
    "Action 1 (Immediate)",
    "Action 2 (Within 3 days)",
    "Action 3 (Preventative)"
  ],
  "suggestions": [
    "Practical agronomic tip 1",
    "Practical agronomic tip 2",
    "Seasonal weather adjustment"
  ]
}

Do not include markdown codeblocks like \`\`\`json or \`\`\`. Output raw JSON only.`;

    const rawText = await callGeminiWithFallback(prompt);
    if (!rawText) return null;

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini farmer tips / Crop Doctor error:", error);
    return null;
  }
};
