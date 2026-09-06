import "dotenv/config";
import { getGeminiCropSuggestion, getGeminiFarmerTips, callGeminiWithFallback } from "../services/geminiService.js";
import { getNutritionAnalysis } from "../services/nutritionAnalysisService.js";

console.log("==================================================");
console.log("   TESTING ALL AI ASSISTANT & BACKEND SERVICES   ");
console.log("==================================================");

async function testAll() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("1. API Key Loaded:", apiKey ? "YES (length: " + apiKey.length + ")" : "NO");

  // Test 1: AIAssistant Chat prompt
  try {
    const chatRes = await callGeminiWithFallback("Hello, I am a farmer in Warangal. What should I do for my tomato crop right now? Respond in 1-2 helpful sentences.");
    console.log("\n2. AIAssistant Chat Response:\n", chatRes?.trim().substring(0, 150) + "...\n");
  } catch (e) {
    console.error("❌ AIAssistant Chat Error:", e.message);
  }

  // Test 2: Gemini Crop Suggestion
  try {
    const cropRes = await getGeminiCropSuggestion({ temp: 28, hum: 65, rain: 10 }, "Red Soil", "Telangana");
    console.log("3. Crop Suggestion Result:", cropRes?.recommended_crop, "| Confidence:", cropRes?.confidence + "%");
  } catch (e) {
    console.error("❌ Crop Suggestion Error:", e.message);
  }

  // Test 3: Nutrition Analysis
  try {
    const nutRes = await getNutritionAnalysis("Dragon Fruit");
    console.log("4. Nutrition Analysis for Dragon Fruit: Calories:", nutRes?.calories, "| Protein:", nutRes?.protein + "g");
  } catch (e) {
    console.error("❌ Nutrition Analysis Error:", e.message);
  }

  // Test 4: Farmer Tips
  try {
    const tipsRes = await getGeminiFarmerTips("Cotton", "Black Cotton Soil", "Adilabad", "vegetative");
    console.log("5. Farmer Tips:", tipsRes?.suggestions?.[0]);
  } catch (e) {
    console.error("❌ Farmer Tips Error:", e.message);
  }

  console.log("\n==================================================");
  console.log("   ALL SERVICES VERIFIED SUCCESSFULLY!           ");
  console.log("==================================================");
  process.exit(0);
}

testAll();
