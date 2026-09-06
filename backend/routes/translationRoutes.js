import express from "express";
import { callGeminiWithFallback } from "../services/geminiService.js";

const router = express.Router();

// Memory cache to prevent hitting API for the same texts repeatedly
const translationCache = new Map();

router.post("/", async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "No texts provided" });
    }

    const cacheKey = `${targetLang}_${JSON.stringify(texts)}`;
    if (translationCache.has(cacheKey)) {
      return res.json({ translatedTexts: translationCache.get(cacheKey) });
    }

    const languageMap = {
      te: "Telugu",
      hi: "Hindi",
      ta: "Tamil",
      kn: "Kannada",
      en: "English"
    };
    const langName = languageMap[targetLang] || targetLang;

    const prompt = `Translate the following JSON array of strings into ${langName}. 
Maintain the exact array structure. Return ONLY a valid JSON array of strings, nothing else. No markdown blocks.
Input: ${JSON.stringify(texts)}`;

    const rawResponse = await callGeminiWithFallback(prompt);
    if (!rawResponse) {
      return res.json({ translatedTexts: texts });
    }
    
    let resultText = rawResponse.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
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
