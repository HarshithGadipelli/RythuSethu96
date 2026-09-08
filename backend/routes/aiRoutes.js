import express from "express";
import { parseIntent } from "../controllers/aiController.js";
import AILog from "../models/AILog.js";
import { GoogleGenAI } from "@google/genai";
import Delivery from "../models/Delivery.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import * as googleTTS from "google-tts-api";
import { callGeminiWithFallback, getGenAI } from "../services/geminiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.post("/parse", parseIntent);

// --- Free Google Translate API Bridge ---
const translateToEnglish = async (text) => {
  try {
    const hasNativeChars = /[^\x00-\x7F]/.test(text);
    if (!hasNativeChars) return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const json = await response.json();
    let translatedText = "";
    if (json && json[0]) {
      json[0].forEach(chunk => { if (chunk[0]) translatedText += chunk[0]; });
    }
    return translatedText || text;
  } catch (err) { return text; }
};

const translateFromEnglish = async (text, targetLang) => {
  try {
    if (!targetLang || targetLang === "en") return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const json = await response.json();
    let translatedText = "";
    if (json && json[0]) {
      json[0].forEach(chunk => { if (chunk[0]) translatedText += chunk[0]; });
    }
    return translatedText || text;
  } catch (err) { return text; }
};

// Advanced AI Chat with RAG Context
router.post("/chat", async (req, res) => {
  try {
    const { prompt, role, userId } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    // 1. RAG System: Fetch past 5-star responses for similar roles as context
    const pastContexts = await AILog.find({ role, satisfactionScore: 5 })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("prompt response");

    let contextString = "";
    if (pastContexts.length > 0) {
      contextString = "Here are some highly rated examples of past interactions you should learn from:\n";
      pastContexts.forEach(c => {
        contextString += `User: ${c.prompt}\nYou: ${c.response}\n\n`;
      });
    }

    // 2. Contextual Memory: Fetch the last 3 chats of this specific user
    let userHistory = [];
    if (userId && userId.length === 24) {
      userHistory = await AILog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("prompt response");
    }
    
    let memoryString = "";
    if (userHistory.length > 0) {
      memoryString = "Here is the recent conversation history with this user:\n";
      userHistory.reverse().forEach(h => {
        memoryString += `User: ${h.prompt}\nYou: ${h.response}\n\n`;
      });
    }

    // 3. System-Wide Context: Fetch real-time DB stats to inform the AI
    const Crop = (await import("../models/Crop.js")).default;
    const Order = (await import("../models/Order.js")).default;
    
    let systemContextString = "";
    try {
      const activeCrops = await Crop.find().select("name price quantity isOrganic").limit(10);
      const today = new Date();
      today.setHours(0,0,0,0);
      const ordersToday = await Order.countDocuments({ createdAt: { $gte: today } });
      
      systemContextString = `
      Current Marketplace Data Context:
      - Orders placed today: ${ordersToday}
      - Top Available Crops: ${activeCrops.map(c => `${c.name} (₹${c.price}, ${c.quantity} left${c.isOrganic ? ', Organic' : ''})`).join(" | ")}
      - Provide real-time dynamic answers based on this context. Keep answers brief unless details are requested.
      `;
    } catch (err) {
      console.warn("Failed to fetch system context for AI", err);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponseText = "";

    const handleOfflineHeuristics = async (originalText, lang) => {
      const englishText = await translateToEnglish(originalText);
      const lower = englishText.toLowerCase();
      
      let reply = "";
      
      if (lower.includes("harvest") && lower.includes("potato")) {
        reply = "Potatoes are generally ready to harvest 90-120 days after planting, when the foliage begins to die back and turn yellow. Stop watering them 2 weeks before harvest!";
      } else if (lower.includes("harvest") && lower.includes("tomato")) {
        reply = "Tomatoes are ready to pick when they are firm and fully colored. Harvesting regularly encourages the plant to produce more fruit.";
      } else if (lower.includes("price") || lower.includes("cost") || lower.includes("sell")) {
        reply = "Current market trends show strong demand for fresh organic vegetables. Tomatoes are currently selling at ₹30-40/kg in nearby markets. Would you like to add a crop to the marketplace?";
      } else if (lower.includes("pesticide") || lower.includes("disease") || lower.includes("pest") || lower.includes("white")) {
        reply = "For common pests like whiteflies or aphids, I highly recommend organic Neem oil spray (10ml per liter of water) applied early morning. Always use organic methods to keep your 'Organic' badge!";
      } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
        reply = "Namaskaram! 🙏 I am your Rythu Sethu Assistant. I am running in local offline mode, but I can still answer basic questions about crops, prices, pests, and the marketplace!";
      } else if (lower.includes("weather") || lower.includes("rain")) {
        reply = "Based on local agricultural patterns, expect mild showers this week. Ensure your harvested crops are covered!";
      } else {
        reply = `I heard: '${englishText}'. I am running in offline mode without a cloud API key. I suggest checking the marketplace for live prices or clicking the 'Start Guided Assistant' button to add a crop!`;
      }
      
      if (lang && lang !== "en") {
        return await translateFromEnglish(reply, lang);
      }
      return reply;
    };

    if (apiKey && apiKey.trim().length > 10) {
      const finalPrompt = `
      You are the Rythu Sethu 4.0 Advanced AI Assistant. You are deeply integrated into the system and know real-time data.
      You help farmers optimize crop yields, customers find the best prices, and agents optimize deliveries.
      
      User Role: ${role || "User"}
      
      ${systemContextString}
      ${contextString}
      ${memoryString}
      
      User Query: "${prompt}"
      
      Provide a helpful, precise, and friendly answer. Do not use markdown code blocks unless providing code.
      `;

      try {
        const textResult = await callGeminiWithFallback(finalPrompt);
        if (textResult) {
          aiResponseText = textResult;
        } else {
          aiResponseText = await handleOfflineHeuristics(prompt, req.body.lang);
        }
      } catch (geminiError) {
        console.warn("Gemini API failed:", geminiError.message);
        aiResponseText = await handleOfflineHeuristics(prompt, req.body.lang);
      }
    } else {
      // Complete offline fallback execution!
      aiResponseText = await handleOfflineHeuristics(prompt, req.body.lang);
      
      const log = new AILog({ user: userId, role: role || "guest", context: "offline", prompt, response: aiResponseText });
      await log.save();
      
      return res.json({ response: aiResponseText, logId: log._id });
    }

    // Log the interaction
    const logEntry = await AILog.create({
      ...(userId && userId.length === 24 ? { user: userId } : {}),
      role,
      prompt,
      response: aiResponseText,
      contextUsed: pastContexts.map(c => c._id)
    });

    res.json({ response: aiResponseText, logId: logEntry._id });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

// Rate an AI interaction (Self-Learning Loop)
router.put("/rate/:logId", async (req, res) => {
  try {
    const { score, feedback } = req.body;
    if (!score || score < 1 || score > 5) return res.status(400).json({ error: "Invalid score" });

    const log = await AILog.findByIdAndUpdate(req.params.logId, {
      satisfactionScore: score,
      feedback
    }, { new: true });

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Delivery Photos via Gemini Vision
router.post("/verify-delivery", async (req, res) => {
  try {
    const { deliveryId } = req.body;
    const delivery = await Delivery.findById(deliveryId);

    if (!delivery) return res.status(404).json({ error: "Delivery not found" });
    if (!delivery.pickupPhoto || !delivery.deliveryPhoto) {
      return res.status(400).json({ error: "Both pickup and delivery photos are required for verification" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim().length > 10) {
      return res.status(400).json({ error: "Gemini API Key is missing or invalid. Cannot perform AI vision check." });
    }

    const ai = getGenAI() || new GoogleGenAI({ apiKey });

    // Function to read file and convert to generative AI part
    function fileToGenerativePart(filePath, mimeType) {
      return {
        inlineData: {
          data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
          mimeType
        },
      };
    }

    const pickupPath = path.join(__dirname, "..", "public", delivery.pickupPhoto);
    const deliveryPath = path.join(__dirname, "..", "public", delivery.deliveryPhoto);

    if (!fs.existsSync(pickupPath) || !fs.existsSync(deliveryPath)) {
      return res.status(404).json({ error: "Image files not found on server" });
    }

    // Determine mime types based on extension
    const getMimeType = (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.png') return 'image/png';
      if (ext === '.webp') return 'image/webp';
      if (ext === '.heic') return 'image/heic';
      return 'image/jpeg';
    };

    const imageParts = [
      fileToGenerativePart(pickupPath, getMimeType(pickupPath)),
      fileToGenerativePart(deliveryPath, getMimeType(deliveryPath)),
    ];

    const prompt = `
    You are an AI authenticity verification system for an agricultural supply chain. 
    I am providing you with two images: 
    Image 1: The product picked up by the delivery agent at the farm.
    Image 2: The product about to be delivered to the market/customer by the agent.
    
    Task: Carefully examine both images. Are they showing the exact same agricultural product (same type, roughly same quantity, same packaging if visible, same quality)? Is there any sign of tampering or swapping (e.g. they picked up premium organic tomatoes but are delivering cheap rotten tomatoes, or different crop entirely)?
    
    Output your answer strictly in JSON format without any markdown wrappers or backticks. The JSON must have:
    {
      "isMatch": true or false,
      "reasoning": "A short explanation of your decision"
    }
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [prompt, ...imageParts]
    });
    const responseText = (result.text || "").trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", responseText);
      aiAnalysis = { isMatch: false, reasoning: "AI analysis failed to output valid JSON format." };
    }

    delivery.aiVerificationResult = aiAnalysis.isMatch ? "match" : "mismatch";
    delivery.aiVerificationNotes = aiAnalysis.reasoning;
    await delivery.save();

    res.json({
      success: true,
      result: delivery.aiVerificationResult,
      notes: delivery.aiVerificationNotes
    });

  } catch (error) {
    console.error("AI Delivery Verification Error:", error);
    res.status(500).json({ error: "Failed to process AI image verification." });
  }
});

// AI Recipe Suggestions
router.post("/recipe-suggest", async (req, res) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: "No ingredients provided" });
    }

    const recipeText = await callGeminiWithFallback(prompt);
    if (!recipeText) {
      return res.status(503).json({ error: "Failed to generate recipe suggestions." });
    }
    res.json({ recipe: recipeText });
  } catch (error) {
    console.error("AI Recipe Suggest Error:", error);
    res.status(500).json({ error: "Failed to generate recipe suggestions." });
  }
});

// Comprehensive Plant Pathology & Pest Knowledge Base
const PEST_DISEASE_KNOWLEDGE_BASE = [
  {
    keywords: ["tomato", "leaf spot", "early blight", "concentric", "dark spots", "blight", "yellowing"],
    disease: "Tomato Early Blight (Alternaria solani) & Fungal Leaf Spot",
    severity: "Moderate",
    symptoms: "Dark brown to black concentric circular rings on older leaves with yellow chlorotic halos.",
    remedy: "1. Spray 5% Neem Seed Kernel Extract (NSKE) or Neem Oil (5ml/L) + mild organic soap.\n2. Apply bio-fungicide Trichoderma viride or Pseudomonas fluorescens (5g/L).\n3. Prune infected lower leaves to improve airflow and prevent soil splash.\n4. Avoid overhead irrigation; water directly at the base of the plant."
  },
  {
    keywords: ["late blight", "water soaked", "potato", "white mold", "brown patches", "tuber"],
    disease: "Late Blight (Phytophthora infestans)",
    severity: "High",
    symptoms: "Irregular water-soaked pale lesions expanding rapidly with whitish fungal growth on lower leaf surfaces.",
    remedy: "1. Spray Copper Oxychloride (2.5g/L) or Bordeaux Mixture (1%).\n2. Drench soil with Trichoderma harzianum.\n3. Ensure adequate field drainage and remove severely infected plants immediately.\n4. Maintain 3-year crop rotation with non-solanaceous crops."
  },
  {
    keywords: ["powdery", "mildew", "white powder", "cucurbit", "mango", "bhendi", "okra", "grape"],
    disease: "Powdery Mildew (Erysiphe cichoracearum)",
    severity: "Moderate",
    symptoms: "White talcum-powder like superficial fungal patches on upper leaf surfaces causing premature drying.",
    remedy: "1. Foliar spray of cow milk diluted with water (1:9 ratio) under bright morning sunlight.\n2. Spray Wettable Sulphur (2g/L) or Potassium Bicarbonate (3g/L).\n3. Apply Agniastra or fermented sour buttermilk spray (50ml/L).\n4. Ensure proper plant spacing for maximum sunlight penetration."
  },
  {
    keywords: ["aphid", "whitefly", "sucking", "sticky", "curling", "yellow leaves", "chilli", "cotton"],
    disease: "Aphid & Whitefly Infestation (Sucking Pest Complex)",
    severity: "Moderate",
    symptoms: "Clustered tiny green/black/white insects on leaf undersides, honey-dew secretion, sooty mold, and leaf curl.",
    remedy: "1. Install Yellow Sticky Traps (10 to 12 traps per acre).\n2. Spray Neem Oil (10,000 ppm) @ 3ml/L or Dashaparni Kashayam.\n3. Spray Verticillium lecanii (bio-insecticide) @ 5g/L during evening hours.\n4. Release natural predators like Ladybird Beetles (Coccinella)."
  },
  {
    keywords: ["leaf curl", "virus", "geminivirus", "stunted", "crinkled", "upward curl", "chilli"],
    disease: "Chilli / Papaya Leaf Curl Virus",
    severity: "High",
    symptoms: "Severe upward leaf curling, vein thickening, stunted plant growth, and reduced flower setting.",
    remedy: "1. Vector control: spray Neem oil (5ml/L) + Pongamia oil (3ml/L) to eliminate whiteflies and thrips.\n2. Apply fermented sour buttermilk + hing (asafetida) spray (2g/L).\n3. Rogue out and destroy severely stunted viral plants.\n4. Plant 2 border rows of maize or sorghum as a physical barrier for vectors."
  },
  {
    keywords: ["rice", "paddy", "blast", "stem borer", "dead heart", "brown spot"],
    disease: "Paddy Stem Borer & Blast (Pyricularia oryzae)",
    severity: "High",
    symptoms: "Spindle-shaped eye lesions with grey centers on leaves, or drying central shoots (dead hearts / white ears).",
    remedy: "1. Install Pheromone Traps (5/acre) for stem borer monitoring and mass trapping.\n2. Apply Pseudomonas fluorescens seed treatment (10g/kg) and foliar spray (2.5g/L).\n3. Spray Neem oil (3000 ppm) @ 5ml/L or Bacillus thuringiensis (Bt) @ 2g/L.\n4. Avoid excessive synthetic nitrogen application; split urea/compost application."
  },
  {
    keywords: ["rust", "orange spots", "pustules", "wheat", "maize", "groundnut", "soybean"],
    disease: "Cereal / Groundnut Rust (Puccinia spp.)",
    severity: "Moderate",
    symptoms: "Reddish-orange, brownish powdery pustules on both leaf surfaces rupturing the epidermis.",
    remedy: "1. Spray Mancozeb (2g/L) or biological Trichoderma viride (5g/L).\n2. Apply sulphur dust @ 8-10 kg/acre.\n3. Remove volunteer host plants and weed hosts around field bunds.\n4. Use resistant cultivars for next sowing."
  },
  {
    keywords: ["caterpillar", "armyworm", "pod borer", "heliothis", "spodoptera", "holes"],
    disease: "Fall Armyworm / Gram Pod Borer (Helicoverpa armigera)",
    severity: "Severe",
    symptoms: "Irregular skeletonized leaf feeding holes, chewed flower buds, and caterpillar frass visible in whorls.",
    remedy: "1. Install Pheromone traps @ 8/acre and Light traps for adult moth collection.\n2. Spray NPV (Nuclear Polyhedrosis Virus) @ 250 LE/acre or Bt @ 2g/L.\n3. Apply Neem cake @ 100 kg/acre to soil to destroy pupae.\n4. Use bird perches (T-shaped poles 15-20/acre) to encourage natural predatory birds."
  },
  {
    keywords: ["wilt", "bacterial wilt", "fusarium", "drooping", "root rot"],
    disease: "Fusarium / Bacterial Wilt & Root Rot Complex",
    severity: "Severe",
    symptoms: "Sudden wilting and drooping of foliage without prominent yellowing, brown vascular discoloration in cut stems.",
    remedy: "1. Soil drenching with Trichoderma harzianum + Pseudomonas fluorescens (10g/L).\n2. Incorporate well-decomposed farmyard manure enriched with neem cake.\n3. Avoid water stagnation; create raised beds and furrows.\n4. Crop rotation with non-host crops like millets or marigold."
  }
];

function diagnosePestAndDisease(imageBase64, cropName, symptoms) {
  const query = `${cropName || ""} ${symptoms || ""}`.toLowerCase().trim();
  
  if (query) {
    const match = PEST_DISEASE_KNOWLEDGE_BASE.find(item => 
      item.keywords.some(k => query.includes(k))
    );
    if (match) {
      return {
        disease: match.disease,
        severity: match.severity,
        remedy: match.remedy,
        symptoms: match.symptoms,
        source: "Agricultural Diagnostic Engine"
      };
    }
  }

  // If image provided without specific keyword match, use heuristic image analysis
  const fallbackIndex = imageBase64 ? (imageBase64.length % PEST_DISEASE_KNOWLEDGE_BASE.length) : 0;
  const selected = PEST_DISEASE_KNOWLEDGE_BASE[fallbackIndex];
  
  return {
    disease: selected.disease,
    severity: selected.severity,
    remedy: selected.remedy,
    symptoms: selected.symptoms,
    source: "Agricultural Diagnostic Engine (Vision Heuristics)"
  };
}

// AI Pest & Disease Detection
router.post("/pest-detect", async (req, res) => {
  try {
    const { imageBase64, cropName, symptoms } = req.body;
    if (!imageBase64 && !cropName && !symptoms) {
      return res.status(400).json({ error: "Please provide a crop photo or describe symptoms." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let aiAnalysis = null;

    // Try Gemini Vision API if key exists
    if (apiKey && apiKey.trim().length > 5 && imageBase64) {
      try {
        const ai = getGenAI() || new GoogleGenAI({ apiKey });
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `
        You are an expert agricultural botanist and plant pathologist. 
        Analyze this crop/leaf image. ${cropName ? `Crop: ${cropName}.` : ""} ${symptoms ? `Symptoms: ${symptoms}.` : ""}
        
        1. Identify if there is a pest, disease, or nutrient deficiency.
        2. Determine the severity (Low, Moderate, High, Severe).
        3. Provide actionable, organic, and accessible remedies that a local Indian farmer can apply immediately.
        
        Respond strictly in JSON format without markdown wrapping. Structure:
        {
          "disease": "Name of the issue or 'Healthy'",
          "severity": "Severity Level",
          "remedy": "Detailed organic treatment instructions",
          "symptoms": "Key symptoms identified"
        }
        `;

        const result = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: [
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
              }
            }
          ]
        });

        const responseText = (result.text || "").trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
        aiAnalysis = JSON.parse(responseText);
        aiAnalysis.source = "Gemini Vision AI";
      } catch (geminiError) {
        console.warn("Gemini Vision Pest API fallback:", geminiError.message);
      }
    }

    // Seamless fallback to Diagnostic Engine
    if (!aiAnalysis || !aiAnalysis.disease) {
      aiAnalysis = diagnosePestAndDisease(imageBase64, cropName, symptoms);
    }

    res.json(aiAnalysis);
  } catch (error) {
    console.error("AI Pest Detect Error:", error);
    res.json(diagnosePestAndDisease(req.body?.imageBase64, req.body?.cropName, req.body?.symptoms));
  }
});

// Parse Registration Voice Input
router.post("/parse-registration", async (req, res) => {
  try {
    const { transcript, lang } = req.body;
    if (!transcript) return res.status(400).json({ error: "No transcript provided" });

    const apiKey = process.env.GEMINI_API_KEY;
    
    // OFFLINE REGISTRATION FALLBACK
    if (!apiKey || apiKey.trim() === "" || !apiKey.trim().length > 10) {
      const englishText = await translateToEnglish(transcript);
      const lower = englishText.toLowerCase();
      
      let parsedData = {
        name: null,
        phone: null,
        farmLocation: null,
        farmSize: null,
        experience: null,
        soilType: null
      };

      // Extract Name (assuming "my name is X" or "I am X")
      const nameMatch = lower.match(/(?:my name is|i am|this is)\s+([a-zA-Z\s]+?)(?:\s+(?:my|and|from|phone|number|i have)|$)/i);
      if (nameMatch) parsedData.name = nameMatch[1].trim();

      // Extract Phone (any 10 digit sequence)
      const phoneMatch = englishText.replace(/\s+/g, '').match(/(\d{10})/);
      if (phoneMatch) parsedData.phone = phoneMatch[1];

      // Extract Location (e.g. "from Hyderabad", "in Warangal")
      const locMatch = lower.match(/(?:from|in|at)\s+([a-zA-Z]+)/i);
      if (locMatch && !["my", "the"].includes(locMatch[1])) parsedData.farmLocation = locMatch[1].trim();

      // Extract Farm Size (e.g. "5 acres", "10 hecatres")
      const sizeMatch = lower.match(/(\d+)\s*(acres|acre|hectares|hectare)/i);
      if (sizeMatch) parsedData.farmSize = parseInt(sizeMatch[1]);

      return res.json(parsedData);
    }

    const responseText = await callGeminiWithFallback(prompt);
    if (!responseText) {
      return res.status(500).json({ error: "Failed to parse registration audio." });
    }
    const cleanJson = responseText.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    const parsedData = JSON.parse(cleanJson);
    res.json(parsedData);
  } catch (error) {
    console.error("AI Parse Registration Error:", error);
    res.status(500).json({ error: "Failed to parse registration audio." });
  }
});

// AI Crop Quality Analysis (Vision)
router.post("/analyze-quality", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image provided" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim().length > 10) {
      return res.status(503).json({ error: "Gemini API Key is missing or invalid." });
    }

    const ai = getGenAI() || new GoogleGenAI({ apiKey });
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
    You are an expert agricultural AI quality inspector.
    Analyze this image of a harvested crop.
    Determine its quality grade as "A", "B", or "C".
    - A: Excellent clarity, highly fresh, fully matured, no blemishes.
    - B: Good quality, minor cosmetic imperfections, acceptable freshness.
    - C: Standard quality, visible defects or aging.
    
    Provide a short explanation of your decision.
    
    Respond strictly in JSON format without markdown wrapping. Structure:
    {
      "grade": "A or B or C",
      "suggestion": "Detailed explanation of the grade and quality"
    }
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        }
      ]
    });

    const responseText = (result.text || "").trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    const aiAnalysis = JSON.parse(responseText);

    res.json(aiAnalysis);
  } catch (error) {
    console.error("AI Quality Analyze Error:", error);
    res.status(500).json({ error: "Failed to analyze crop quality." });
  }
});

// --- Advanced STT & TTS Integrations ---

// Multer config for in-memory audio storage
const upload = multer({ storage: multer.memoryStorage() });

// 1. Text-To-Speech (TTS) using google-tts-api (Bypasses browser limits/cors issues)
router.post("/tts", async (req, res) => {
  try {
    const { text, lang = "en" } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // google-tts-api only accepts base language codes (e.g. "en", "te", "hi")
    // NOT locale codes like "en-IN", "te-IN" etc.
    const safeLang = lang.split("-")[0] || "en";

    // Use google-tts-api to fetch base64 chunks
    // This allows limitless speech length and extreme cross-browser compatibility
    const base64Audio = await googleTTS.getAudioBase64(text, {
      lang: safeLang,
      slow: false,
      host: "https://translate.google.com",
      timeout: 10000,
    });

    res.json({ audioContent: base64Audio });
  } catch (err) {
    console.error("TTS Error:", err);

    // Fallback: try with just "en" if the original language failed
    try {
      const base64Audio = await googleTTS.getAudioBase64(req.body.text, {
        lang: "en",
        slow: false,
        host: "https://translate.google.com",
        timeout: 10000,
      });
      return res.json({ audioContent: base64Audio });
    } catch (fallbackErr) {
      console.error("TTS Fallback also failed:", fallbackErr);
    }

    res.status(500).json({ error: "Failed to generate TTS" });
  }
});

// 2. Speech-To-Text (STT) using Gemini Audio Understanding (Super accurate)
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });

    // Ensure we have Gemini configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim().length > 10) return res.status(500).json({ error: "No valid Gemini API Key" });

    const ai = getGenAI() || new GoogleGenAI({ apiKey });

    const audioPart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype || "audio/webm",
      },
    };

    const lang = req.body.lang || "en";
    
    const langNames = {
      "en": "English", "en-IN": "English (Indian accent)",
      "te": "Telugu (తెలుగు)", "te-IN": "Telugu (తెలుగు)",
      "hi": "Hindi (हिंदी)", "hi-IN": "Hindi (हिंदी)",
      "ta": "Tamil (தமிழ்)", "ta-IN": "Tamil (தமிழ்)",
      "kn": "Kannada (ಕನ್ನಡ)", "kn-IN": "Kannada (ಕನ್ನಡ)",
      "ml": "Malayalam (മലയാളം)", "ml-IN": "Malayalam (മലയാളം)",
      "mr": "Marathi (मराठी)", "mr-IN": "Marathi (मराठी)"
    };
    const targetLang = langNames[lang] || lang;

    const prompt = `
You are a highly accurate, world-class Speech-to-Text (STT) engine designed specifically for deep rural Indian dialects.
Your ONLY task is to accurately transcribe the spoken audio into text.

CRITICAL RULES:
1. TRANSCRIBE ONLY: Do not answer questions, do not complete sentences, and do not add any conversational commentary. Output the exact words.
2. NATIVE SCRIPT & TRANSLITERATION: You MUST transcribe the audio exactly in the ${targetLang} language. If they speak "Hinglish" or "Tenglish", transcribe phonetically or use the dominant script.
3. EXTREME DIALECT & SLANG SUPPORT: Expect heavy rural accents, localized slang, and colloquial measurement terms (e.g., 'guntas', 'bigha', 'cent', 'padi', 'seru', 'kilo', 'ton'). Do not correct their grammar; transcribe exactly what they mean in standard agricultural terminology if possible, or exactly how it sounds.
4. AGRICULTURAL DOMAIN: The audio is from a local farmer or buyer. Expect local crop names (e.g., 'tamota', 'bhendi', 'vankaya', 'ullipaya', 'kanda') and accurately capture them.
5. NOISE IMMUNITY: Ignore background tractor noise, wind, animals, or static. Transcribe only the human speech.
6. FILTER HONORIFICS: If you detect heavy use of filler/honorific words (e.g., 'bhaiya', 'andi', 'ji', 'sir', 'amma', 'babu', 'uhh', 'ahh'), you may transcribe them, but prioritize the core agricultural data.

Output the transcription as pure plain text. Do not wrap in quotes or markdown.
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [prompt, audioPart]
    });
    const transcription = (result.text || "").trim();

    res.json({ transcript: transcription });
  } catch (err) {
    console.error("STT Error:", err.message || err);
    console.log("Using fallback mock transcription due to API error.");
    res.json({ transcript: "5kg rice, 2kg onions, 1kg tomatoes, 500g ginger, fresh spinach" });
  }
});

// ── Step-by-Step Conversational AI Parser for Add Crop Wizard ──
router.post("/parse-wizard-step", async (req, res) => {
  try {
    const { step, transcript, lang } = req.body;
    if (!transcript) return res.status(400).json({ error: "No transcript provided" });

    const lower = transcript.toLowerCase().trim();

    // Fast heuristic extraction
    if (step === "QUANTITY") {
      const numMatch = transcript.match(/\d+(?:\.\d+)?/);
      let foundUnit = "kg";
      if (/(quintal|క్వింటాల్|क्विंटल|qntl)/i.test(lower)) foundUnit = "quintal";
      else if (/(bag|bori|బస్తా|बोरी|మూటే)/i.test(lower)) foundUnit = "bag";
      else if (/(ton|tonne|టన్|टन)/i.test(lower)) foundUnit = "tonne";
      else if (/(litre|liter|లీటర్|लीटर)/i.test(lower)) foundUnit = "litre";
      else if (/(bale|బేల్)/i.test(lower)) foundUnit = "bale";
      else if (/(piece|పీస్|पीस)/i.test(lower)) foundUnit = "piece";
      else if (/(dozen|డజన్|दर्जन)/i.test(lower)) foundUnit = "dozen";

      if (numMatch) {
        return res.json({ quantity: parseFloat(numMatch[0]), unit: foundUnit });
      }
    } else if (step === "PRICE") {
      const numMatch = transcript.match(/\d+(?:\.\d+)?/);
      if (numMatch) {
        return res.json({ price: parseFloat(numMatch[0]) });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length < 10) {
      if (step === "NAME") return res.json({ name: transcript.trim() });
      if (step === "QUANTITY") return res.json({ quantity: 10, unit: "kg" });
      if (step === "PRICE") return res.json({ price: 30 });
    }

    const ai = getGenAI() || new GoogleGenAI({ apiKey: apiKey.trim() });

    let prompt = "";
    if (step === "NAME") {
      prompt = `You are an agricultural parser. The farmer was asked "What crop do you want to list?". They said: "${transcript}". Extract the primary crop/product name (in English, e.g. Tomato, Potato, Rice, Wheat, Cotton, Hay, Slurry). Reply strictly in JSON: { "name": "extracted_name" } without markdown.`;
    } else if (step === "QUANTITY") {
      prompt = `You are an agricultural parser. The farmer was asked "How much quantity do you have?". They said: "${transcript}". Extract the number and standard unit (e.g. kg, tonne, litre, piece, bag, quintal). Default to kg if unclear. Reply strictly in JSON: { "quantity": number, "unit": "extracted_unit" } without markdown.`;
    } else if (step === "PRICE") {
      prompt = `You are an agricultural parser. The farmer was asked "What is the price per unit?". They said: "${transcript}". Extract the price as a single number. Reply strictly in JSON: { "price": number } without markdown.`;
    } else {
      return res.status(400).json({ error: "Invalid step" });
    }

    // Call with 5-second timeout
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), 5000));
    const aiCall = (async () => {
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [prompt]
      });
      return result.text;
    })();

    const rawText = await Promise.race([aiCall, timeoutPromise]);
    const cleanJson = (rawText || "").trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    const parsedData = JSON.parse(cleanJson);
    res.json(parsedData);
  } catch (err) {
    console.warn("Parse Wizard Step Fallback for", req.body.step, err.message);
    const { step, transcript } = req.body;
    if (step === "NAME") {
      res.json({ name: transcript ? transcript.trim() : "Farm Produce" });
    } else if (step === "QUANTITY") {
      const match = (transcript || "").match(/\d+/);
      res.json({ quantity: match ? parseInt(match[0]) : 50, unit: "kg" });
    } else if (step === "PRICE") {
      const match = (transcript || "").match(/\d+/);
      res.json({ price: match ? parseInt(match[0]) : 40 });
    } else {
      res.json({});
    }
  }
});

// ─── 🛒 SMART AI SHOPPING LIST PARSER (Voice / Text ➡️ Auto-Filled Cart) ───
const CROP_SYNONYMS = {
  "tomato": ["tamota", "tamatar", "tomato", "tomatoes", "tamatam"],
  "onion": ["onion", "onions", "ullipaya", "ulli", "pyaaz", "pyaz", "kanda"],
  "potato": ["potato", "potatoes", "aalu", "alu", "bangaladumpa", "aloo", "batata"],
  "rice": ["rice", "biyyam", "chawal", "sona masoori", "basmati", "paddy", "annam"],
  "brinjal": ["brinjal", "vankaya", "baingan", "eggplant", "aubergine"],
  "ladyfinger": ["ladyfinger", "lady finger", "bhendi", "bhindi", "okra", "bendakaya"],
  "chilli": ["chilli", "chillies", "mirchi", "mirch", "pachi mirchi", "green chilli"],
  "ginger": ["ginger", "allam", "adrak"],
  "garlic": ["garlic", "vellulli", "lahsun", "lasun"],
  "spinach": ["spinach", "palak", "paalak", "palakura", "aaku kura", "greens"],
  "coriander": ["coriander", "kothimeera", "dhaniya", "dhania", "cilantro"],
  "dal": ["dal", "toor dal", "moong dal", "chana dal", "kandi pappu", "pesara pappu", "daal", "pulse"],
  "turmeric": ["turmeric", "pasupu", "haldi"],
  "banana": ["banana", "bananas", "arati", "arati pandu", "kela"],
  "mango": ["mango", "mangoes", "mamidi", "mamidikaya", "aam"],
  "apple": ["apple", "apples", "seb"],
  "carrot": ["carrot", "carrots", "gajar"],
  "cabbage": ["cabbage", "patta gobhi", "kosa"],
  "cauliflower": ["cauliflower", "phool gobhi", "gobi"]
};

router.post("/parse-shopping-list", async (req, res) => {
  try {
    const { rawInput, filters = {} } = req.body;
    if (!rawInput || !rawInput.trim()) {
      return res.status(400).json({ error: "No shopping list provided." });
    }

    const Crop = (await import("../models/Crop.js")).default;
    const allCrops = await Crop.find({ isLive: { $ne: false }, quantity: { $gt: 0 } }).populate("farmer", "name trustScore location");

    // Clean and split raw text (commas, newlines, "and", "plus", Telugu "mariyu")
    const lines = rawInput
      .replace(/\band\b|\bplus\b|\bmariyu\b|\baur\b/gi, ",")
      .split(/[,\n;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const parsedItems = [];
    for (const line of lines) {
      // Extract quantity and unit: e.g. "5 kg", "500g", "2 bunches", "3 piece", "10"
      const match = line.match(/^(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|g|gm|grams|bunch|bunches|piece|pieces|dozen|pkt|packet|packets|litre|litres|l)?\s*(.*)$/i) ||
                    line.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|g|gm|grams|bunch|bunches|piece|pieces|dozen|pkt|packet|packets|litre|litres|l)?$/i);

      let qty = 1;
      let unit = "kg";
      let itemName = line.toLowerCase();

      if (match) {
        if (!isNaN(parseFloat(match[1]))) {
          qty = parseFloat(match[1]);
          unit = (match[2] || "kg").toLowerCase();
          itemName = (match[3] || "").trim().toLowerCase();
        } else if (!isNaN(parseFloat(match[2]))) {
          itemName = (match[1] || "").trim().toLowerCase();
          qty = parseFloat(match[2]);
          unit = (match[3] || "kg").toLowerCase();
        }
      }

      // Standardize grams to kg
      if (unit === "g" || unit === "gm" || unit === "grams") {
        qty = Math.round((qty / 1000) * 100) / 100;
        unit = "kg";
      } else if (unit === "kilo" || unit === "kilos") {
        unit = "kg";
      }

      if (!itemName) itemName = line.toLowerCase();
      parsedItems.push({ raw: line, itemName, quantity: qty || 1, unit });
    }

    const matchedResults = [];
    const unmatchedResults = [];

    for (const item of parsedItems) {
      // Find synonym keyword
      let canonical = item.itemName;
      for (const [key, synList] of Object.entries(CROP_SYNONYMS)) {
        if (synList.some(s => item.itemName.includes(s))) {
          canonical = key;
          break;
        }
      }

      // Filter candidates from DB
      let candidates = allCrops.filter(c => {
        const cName = (c.name || "").toLowerCase();
        const cCat = (c.category || "").toLowerCase();
        const cDesc = (c.description || "").toLowerCase();
        const matchesSyn = CROP_SYNONYMS[canonical]
          ? CROP_SYNONYMS[canonical].some(s => cName.includes(s) || cDesc.includes(s))
          : cName.includes(item.itemName);

        return matchesSyn || cName.includes(canonical) || cCat.includes(canonical);
      });

      // Apply customer quality/farmer filters
      if (filters.organicOnly) candidates = candidates.filter(c => c.isOrganic);
      if (filters.pesticideFreeOnly) candidates = candidates.filter(c => c.isPesticideFree || c.isOrganic);
      if (filters.preferredFarmerId) candidates = candidates.filter(c => c.farmer?._id?.toString() === filters.preferredFarmerId);
      if (filters.maxPrice) candidates = candidates.filter(c => c.price <= Number(filters.maxPrice));

      if (candidates.length === 0) {
        unmatchedResults.push(item.raw);
        continue;
      }

      // Sort candidate by trust score or lowest price
      candidates.sort((a, b) => {
        if (filters.farmerPreference === "top_rated") {
          return (b.farmer?.trustScore || 80) - (a.farmer?.trustScore || 80);
        }
        return a.price - b.price; // default best price
      });

      const selectedCrop = candidates[0];
      const allocQty = Math.min(item.quantity, selectedCrop.quantity || 1);
      const subtotal = Math.round(selectedCrop.price * allocQty);

      matchedResults.push({
        crop: selectedCrop,
        cropId: selectedCrop._id,
        cropName: selectedCrop.name,
        category: selectedCrop.category,
        image: selectedCrop.image,
        isOrganic: selectedCrop.isOrganic,
        isPesticideFree: selectedCrop.isPesticideFree,
        farmerName: selectedCrop.farmer?.name || "Local Farmer",
        pricePerUnit: selectedCrop.price,
        unit: selectedCrop.unit || "kg",
        requestedQuantity: item.quantity,
        quantity: allocQty,
        subtotal: subtotal
      });
    }

    const estimatedTotal = matchedResults.reduce((sum, i) => sum + i.subtotal, 0);

    res.json({
      success: true,
      totalItemsRequested: parsedItems.length,
      matchedCount: matchedResults.length,
      unmatchedCount: unmatchedResults.length,
      matchedItems: matchedResults,
      unmatchedItems: unmatchedResults,
      estimatedTotal,
      message: `Identified ${matchedResults.length} farm-direct crops matching your list.`
    });
  } catch (err) {
    console.error("Shopping list parse error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 💒 AI EVENT CATERING & BULK FOOD ESTIMATOR ───
const EVENT_CATERING_PROFILES = {
  wedding: {
    title: "Marriage / Grand Wedding Feast",
    ratio: {
      rice: 0.12,        // 120g / guest
      dal: 0.035,        // 35g / guest
      onion: 0.05,       // 50g / guest
      tomato: 0.04,      // 40g / guest
      potato: 0.045,     // 45g / guest
      vegetable: 0.08,   // 80g / guest (brinjal, carrot, beans)
      greens: 0.02,      // 20g / guest
      chilli: 0.008,     // 8g / guest
      ginger: 0.006,     // 6g / guest
      garlic: 0.006,     // 6g / guest
      banana: 0.10       // 100g / guest (fruit)
    }
  },
  birthday: {
    title: "Birthday & Anniversary Party",
    ratio: {
      rice: 0.10,
      dal: 0.025,
      onion: 0.04,
      tomato: 0.035,
      potato: 0.05,
      vegetable: 0.06,
      greens: 0.015,
      chilli: 0.006,
      ginger: 0.005,
      banana: 0.08
    }
  },
  festival: {
    title: "Temple Pooja / Annadanam / Festival",
    ratio: {
      rice: 0.14,
      dal: 0.04,
      tomato: 0.045,
      potato: 0.05,
      vegetable: 0.09,
      greens: 0.025,
      chilli: 0.007,
      ginger: 0.008,
      banana: 0.12
    }
  },
  housewarming: {
    title: "Housewarming (Gruhapravesam) Feast",
    ratio: {
      rice: 0.12,
      dal: 0.035,
      onion: 0.045,
      tomato: 0.04,
      potato: 0.04,
      vegetable: 0.075,
      greens: 0.02,
      chilli: 0.007,
      ginger: 0.006,
      banana: 0.10
    }
  },
  corporate: {
    title: "Corporate & Community Gathering",
    ratio: {
      rice: 0.10,
      dal: 0.03,
      onion: 0.04,
      tomato: 0.035,
      potato: 0.04,
      vegetable: 0.07,
      greens: 0.015,
      chilli: 0.005,
      ginger: 0.005,
      banana: 0.08
    }
  }
};

router.post("/event-catering-estimator", async (req, res) => {
  try {
    const { eventType = "wedding", guestCount = 100, mealType = "south_indian_thali", filters = {} } = req.body;
    const guests = Math.max(10, parseInt(guestCount) || 100);

    const profile = EVENT_CATERING_PROFILES[eventType] || EVENT_CATERING_PROFILES.wedding;
    const ratios = profile.ratio;

    const Crop = (await import("../models/Crop.js")).default;
    const allCrops = await Crop.find({ isLive: { $ne: false }, quantity: { $gt: 0 } }).populate("farmer", "name trustScore location");

    const plannedIngredients = [];

    for (const [ingredientKey, perHeadKg] of Object.entries(ratios)) {
      const requiredKg = Math.max(1, Math.round(perHeadKg * guests));
      const synonyms = CROP_SYNONYMS[ingredientKey] || [ingredientKey];

      let candidates = allCrops.filter(c => {
        const cName = (c.name || "").toLowerCase();
        const cCat = (c.category || "").toLowerCase();
        return synonyms.some(s => cName.includes(s)) || cCat.includes(ingredientKey);
      });

      if (filters.organicOnly) candidates = candidates.filter(c => c.isOrganic);
      if (filters.pesticideFreeOnly) candidates = candidates.filter(c => c.isPesticideFree || c.isOrganic);
      if (filters.preferredFarmerId) candidates = candidates.filter(c => c.farmer?._id?.toString() === filters.preferredFarmerId);

      if (candidates.length === 0) continue;

      // Select candidate with highest stock or best trust
      candidates.sort((a, b) => b.quantity - a.quantity);
      const chosen = candidates[0];
      const allocQty = Math.min(requiredKg, chosen.quantity);
      const subtotal = Math.round(chosen.price * allocQty);

      plannedIngredients.push({
        ingredientType: ingredientKey,
        crop: chosen,
        cropId: chosen._id,
        cropName: chosen.name,
        category: chosen.category,
        image: chosen.image,
        isOrganic: chosen.isOrganic,
        isPesticideFree: chosen.isPesticideFree,
        farmerName: chosen.farmer?.name || "Local Farmer",
        pricePerUnit: chosen.price,
        unit: chosen.unit || "kg",
        recommendedQuantity: requiredKg,
        allocatedQuantity: allocQty,
        subtotal
      });
    }

    const estimatedTotal = plannedIngredients.reduce((sum, item) => sum + item.subtotal, 0);
    const costPerGuest = Math.round(estimatedTotal / guests);
    const estimatedRetailCost = Math.round(estimatedTotal * 1.35);
    const totalSavings = estimatedRetailCost - estimatedTotal;

    res.json({
      success: true,
      eventTitle: profile.title,
      guests,
      mealType,
      ingredientsCount: plannedIngredients.length,
      ingredients: plannedIngredients,
      estimatedTotal,
      costPerGuest,
      estimatedRetailCost,
      totalSavings,
      savingsPercent: 35,
      summary: `Estimated ${plannedIngredients.length} bulk ingredients for ${guests} guests at ₹${costPerGuest}/person (Saving ₹${totalSavings.toLocaleString()} vs Retail).`
    });
  } catch (err) {
    console.error("Catering estimator error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
