import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

let genAI;
try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.warn("Failed to initialize GoogleGenerativeAI for Translation:", error.message);
}

// Memory cache to prevent hitting API for the same texts repeatedly
const translationCache = new Map();

router.post("/", async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    if (!texts || !Array.isArray(texts) || !targetLang || targetLang === "en") {
      return res.json({ translatedTexts: texts });
    }

    if (!genAI) {
      return res.json({ translatedTexts: texts }); // Fallback to original
    }

    const cacheKey = `${targetLang}_${JSON.stringify(texts)}`;
    if (translationCache.has(cacheKey)) {
      return res.json({ translatedTexts: translationCache.get(cacheKey) });
    }

    const languageMap = {
      te: "Telugu",
      hi: "Hindi",
      kn: "Kannada",
      ta: "Tamil"
    };
    const langName = languageMap[targetLang] || targetLang;

    const prompt = `Translate the following JSON array of strings into ${langName}. 
Maintain the exact array structure. Return ONLY a valid JSON array of strings, nothing else. No markdown blocks.
Input: ${JSON.stringify(texts)}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const response = await model.generateContent(prompt);
    
    let resultText = response.response.text().trim();
    if (resultText.startsWith("\`\`\`json")) resultText = resultText.slice(7);
    if (resultText.startsWith("\`\`\`")) resultText = resultText.slice(3);
    if (resultText.endsWith("\`\`\`")) resultText = resultText.slice(0, -3);
    resultText = resultText.trim();
    
    const translatedArray = JSON.parse(resultText);
    
    // Store in cache
    translationCache.set(cacheKey, translatedArray);
    
    res.json({ translatedTexts: translatedArray });
  } catch (error) {
    console.error("Translation error:", error);
    res.json({ translatedTexts: req.body.texts }); // Safe fallback
  }
});

export default router;
