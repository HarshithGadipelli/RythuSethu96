import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Free Google Translate API Bridge (To English)
const translateToEnglish = async (text) => {
  try {
    if (!text || typeof text !== "string") return "";
    const isPureEnglish = /^[\x00-\x7F\s\d.,!?'"₹]*$/.test(text);
    if (isPureEnglish) return text;
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const json = await response.json();
    let translatedText = "";
    if (json && json[0]) {
      json[0].forEach(chunk => { if (chunk[0]) translatedText += chunk[0]; });
    }
    return translatedText || text;
  } catch (err) {
    console.error("Free Translation Bridge Error:", err.message);
    return text;
  }
};

// Free Google Translate API Bridge (To Target Lang)
const translateFromEnglish = async (text, targetLang) => {
  try {
    if (!targetLang || targetLang === "en" || targetLang === "en-IN") return text;
    const langCode = targetLang.split("-")[0];
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const json = await response.json();
    let translatedText = "";
    if (json && json[0]) {
      json[0].forEach(chunk => { if (chunk[0]) translatedText += chunk[0]; });
    }
    return translatedText || text;
  } catch (err) {
    console.error("Translate To Target Error:", err.message);
    return text;
  }
};

export const parseIntent = async (req, res) => {
  try {
    const { text, context, lang } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // Initialize Gemini if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey && apiKey.trim() !== "") {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let prompt = "";
        
        if (context === "farmer_add_crop") {
          prompt = `
          You are an expert NLP parser for a farming app. The user is a rural Indian farmer speaking into a microphone. The speech-to-text might transcribe their local language/accent phonetically in broken English or regional Indian languages.
          
          CRITICAL INSTRUCTIONS:
          1. Ignore conversational filler/honorific words ("andi", "bhaiya", "sir", "ayya", "amma", "ji", "namaste", "namaskaram").
          2. Map phonetic/slang crop names to standard English (e.g., "tamota" -> "Tomato", "bhendi" -> "Okra", "vankaya" / "baingan" -> "Brinjal", "ullipaya" / "kanda" / "pyaz" -> "Onion").
          3. Convert local units: 1 quintal = 100 kg, 1 bag/bori/basta = 50 kg, 1 crate/peti = 25 kg, 1 ton = 1000 kg.
          4. Parse phonetic numbers (e.g. "yebhai" -> 50, "pachas" -> 50, "noota" -> 100, "muppai" -> 30, "nalabhai" -> 40).
          
          Analyze the text: "${text}"
          
          Extract the following fields:
          {
            "name": "crop name (standard English name, first letter capitalized)",
            "category": "vegetable, fruit, grain, spice, pulse, dairy, other",
            "quantity": number (in standard units, e.g. kg or ton),
            "unit": "kg" or "ton" or "litre" (default to "kg"),
            "price": number (price per unit in INR),
            "farmLocation": "district or village name if mentioned",
            "description": "Short appealing description of the crop for buyers",
            "isOrganic": boolean (true if they mention organic, chemical free, natural, no pesticide, desi),
            "isPesticideFree": boolean (true if they mention pesticide free),
            "reply": "A short, conversational acknowledgment in English asking for the FIRST missing field in this order: 1. name, 2. quantity, 3. price, 4. isOrganic. If all are present, say 'Great! I have all details. Say Submit to list your crop!'",
            "completed": boolean (true ONLY if name, quantity and price are present)
          }
          Respond ONLY with valid JSON. Do not include backticks or markdown.
          `;
        } else if (context === "marketplace_search") {
          prompt = `
          You are an advanced AI assistant for a farming app marketplace. Analyze the search intent from: "${text}".
          Required JSON structure:
          {
            "searchQuery": "main item (standard English crop name)",
            "category": "vegetable, fruit, grain, dairy, pulse, spice or all",
            "isOrganic": boolean,
            "maxPrice": number or null,
            "maxDistance": number or null
          }
          Respond ONLY with valid JSON.
          `;
        } else if (context === "omnipresent_farmer") {
          prompt = `
          You are an AI assistant for a farmer dashboard. Determine the intent from: "${text}".
          Required JSON structure:
          {
            "intent": "navigate_tab" | "add_crop" | "farming_doubt" | "unknown",
            "targetTab": "overview" | "crops" | "orders" | "analytics" (if navigate_tab, else null),
            "aiAnswer": "Short 1-2 sentence answer in English" (if farming_doubt, else null)
          }
          Respond ONLY with valid JSON.
          `;
        } else {
          prompt = `Extract intent from: "${text}". Output JSON.`;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsedData = JSON.parse(cleanJsonStr);
        
        if (parsedData.reply && lang && lang !== "en" && lang !== "en-IN") {
          parsedData.reply = await translateFromEnglish(parsedData.reply, lang);
        }
        if (parsedData.aiAnswer && lang && lang !== "en" && lang !== "en-IN") {
          parsedData.aiAnswer = await translateFromEnglish(parsedData.aiAnswer, lang);
        }
        
        return res.json({ source: "gemini", data: parsedData });
      } catch (geminiError) {
        console.error("Gemini API Error, falling back to local parser:", geminiError.message);
      }
    }

    // --- High-Performance Multilingual Heuristic Fallback Parser ---
    let currentUtterance = text;
    let existingForm = {};
    const contextMatch = text.match(/I already have: (\{.*\}). User says: "(.*)"/s);
    if (contextMatch) {
      try { existingForm = JSON.parse(contextMatch[1]); } catch(e) {}
      currentUtterance = contextMatch[2];
    }

    // Translate regional languages into English for NLP analysis
    const englishText = await translateToEnglish(currentUtterance);
    const lowerText = englishText.toLowerCase();
    const rawLower = currentUtterance.toLowerCase();
    const wordCount = lowerText.trim().split(/\s+/).length;

    // Start with existing form data
    let parsedData = { ...existingForm };
    
    // 1. Standalone Short Greetings & FAQ
    if (wordCount <= 3) {
      if (lowerText.match(/^(hi|hello|hey|namaste|vanakkam|namaskara|hallo)$/i) || rawLower.match(/^(నమస్కారం|నమస్తే|नमस्ते|வணக்கம்|ನಮಸ್ಕಾರ)$/i)) {
        const greetReplies = {
          en: "Namaste! I am your AI Assistant. What crop would you like to sell today?",
          te: "నమస్కారం! నేను మీ AI అసిస్టెంట్. మీరు ఈ రోజు ఏ పంటను అమ్మాలనుకుంటున్నారు?",
          hi: "नमस्ते! मैं आपका AI सहायक हूँ। आप आज कौन सी फसल बेचना चाहते हैं?",
          kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಸಹಾಯಕ. ನೀವು ಇಂದು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
          ta: "வணக்கம்! நான் உங்கள் AI உதவியாளர். இன்று நீங்கள் என்ன பயிரை விற்க விரும்புகிறீர்கள்?"
        };
        const targetLang = lang ? lang.split("-")[0] : "en";
        return res.json({ source: "local_heuristic", data: { reply: greetReplies[targetLang] || greetReplies.en } });
      }
      if (lowerText.match(/^(who are you|what can you do|help)$/i)) {
        return res.json({ source: "local_heuristic", data: { reply: "I am your intelligent farming assistant. Tell me what crop you harvested or what you want to buy!" } });
      }
      if (lowerText.match(/^(thank you|thanks|dhanyavad|nandri)$/i)) {
        return res.json({ source: "local_heuristic", data: { reply: "You're very welcome! Let me know if you need anything else. 🌱" } });
      }
    }

    if (context === "omnipresent_farmer") {
      if (lowerText.match(/(analytics|stats|overview|dashboard|home)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "navigate_tab", targetTab: "analytics" } });
      } else if (lowerText.match(/(order|orders|sales)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "navigate_tab", targetTab: "orders" } });
      } else if (lowerText.match(/(crop|crops|list|sell|add)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "add_crop" } });
      } else if (lowerText.match(/(how|what|why|pesticide|fertilizer|grow|weather)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "farming_doubt", aiAnswer: "That is a great question! For best results, use organic compost and monitor soil moisture." } });
      } else {
        return res.json({ source: "local_heuristic", data: { intent: "unknown", reply: "I am your Omnipresent Assistant. You can ask me to show analytics, add crops, or ask farming questions!" } });
      }
    }

    if (context === "farmer_add_crop") {
      // 0. Action commands
      if (wordCount <= 3 && (lowerText.match(/^(cancel|close|exit|stop|quit|nevermind|bandh|aapu|vaddu)$/i) || rawLower.match(/^(ఆపు|మూసివేయి|రద్దు|బంద్|बंद|ರದ್ದು|ரத்து)$/i))) {
        return res.json({ source: "local_heuristic", data: { action: "cancel", reply: "Guided Assistant closed. You can restart anytime!" } });
      }
      if (wordCount <= 4 && (lowerText.match(/^(submit|submit now|post now|save now|list on market|submit crop|post crop|list crop)$/i) || rawLower.match(/^(సమర్పించు|దాఖలు చేయి|దాఖలు|మార్కెట్లో పెట్టు|जमा करें|సల్లಿಸు|சமர்ப்பி)$/i))) {
        return res.json({ source: "local_heuristic", data: { action: "submit", reply: "Submitting your crop to the marketplace now!" } });
      }
      if (wordCount <= 3 && (lowerText.match(/^(clear|reset|delete all|erase|malli|fir se)$/i) || rawLower.match(/^(తుడిచివేయి|మళ్లీ|हटाएं|అళించు)$/i))) {
        return res.json({ source: "local_heuristic", data: { action: "clear", reply: "Form cleared. What crop would you like to sell?" } });
      }

      // Comprehensive Indian Crop Slang & Regional Dialect Dictionary
      const cropsDict = {
        "Tomato": ["tomato", "tomatoes", "tamatar", "tamata", "tamota", "tammata", "thakkali", "takkali", "టమోటా", "టమోటాలు", "తమోటా", "టమాట", "నాటు టమోటా", "टमाटर", "தக்காளி", "ಟೊಮೆಟೊ"],
        "Potato": ["potato", "potatoes", "aloo", "aalu", "allu", "aaloo", "batata", "alugadda", "alugaddalu", "బంగాళదుంప", "బంగాళాదుంప", "ఆలూ", "ఆలుగడ్డ", "आलू", "உருளைக்கிழங்கு", "உருளை", "ಆಲೂಗಡ್ಡೆ"],
        "Onion": ["onion", "onions", "pyaz", "pyaaz", "kanda", "ullipaya", "ullipayalu", "erragaddalu", "ulligadda", "ఉల్లిపాయ", "ఉల్లిపాయలు", "ఎర్రగడ్డలు", "ఉల్లిగడ్డ", "కాందా", "प्याज", "வெங்காயம்", "ಈರುಳ್ಳಿ"],
        "Rice": ["rice", "paddy", "chawal", "dhaan", "dhan", "biyyam", "vadlu", "vaddi", "sonamasoori", "sona masoori", "basmati", "swarna", "bpt", "వరి", "బియ్యం", "వడ్లు", "సోనామసూరి", "బాస్మతి", "चावल", "धान", "அரிசி", "நெல்", "ಅಕ್ಕಿ", "ಭತ್ತ"],
        "Wheat": ["wheat", "gehu", "gehoon", "godhumalu", "godhuma", "గోధుమలు", "గోధుమ", "गेहूं", "गेहूँ", "கோதுமை", "ಗೋಧಿ"],
        "Chili": ["chili", "chilli", "chilies", "chillies", "mirchi", "mirapa", "pachi mirchi", "endu mirchi", "guntur mirchi", "byadgi", "మిరపకాయ", "మిర్చి", "పచ్చిమిర్చి", "ఎండుమిర్చి", "మిరపకాయలు", "मिर्च", "मिर्ची", "மிளகாய்", "பச்சை மிளகாய்", "ಮೆಣಸಿನಕಾಯಿ"],
        "Cotton": ["cotton", "patti", "kapaas", "kapas", "doodi", "పత్తి", "దూది", "కపాస్", "कपास", "பருத்தி", "ಹತ್ತಿ"],
        "Garlic": ["garlic", "lahsun", "lashun", "vellulli", "tellagaddalu", "వెల్లుల్లి", "తెల్లగడ్డలు", "లహసున్", "लहसुन", "பூண்டு", "வெள்ளைப்பூண்டு", "ಬೆಳ್ಳುಳ್ಳಿ"],
        "Ginger": ["ginger", "adrak", "allam", "inji", "shunti", "అల్లం", "अदरक", "இஞ்சி", "ಶುಂಠಿ"],
        "Turmeric": ["turmeric", "haldi", "pasupu", "manjal", "arishina", "పసుపు", "हल्दी", "மஞ்சள்", "ಅರಿಶಿನ"],
        "Groundnut": ["groundnut", "peanut", "peanuts", "palli", "pallilu", "mungfali", "verkadalai", "shenga", "వేరుశనగ", "పల్లీలు", "పల్లీ", "मूंगफली", "வேர்க்கடலை", "ನೆಲಗಡಲೆ"],
        "Maize": ["maize", "corn", "sweetcorn", "bhutta", "makka", "makkajonna", "jonnalu", "jowar", "bajra", "ragi", "మొక్కజొన్న", "జొన్నలు", "మక్కజొన్న", "రాగులు", "मक्का", "भुट्टा", "மக்காச்சோளம்", "ಜೋಳ", "ರಾಗಿ"],
        "Mango": ["mango", "mangoes", "aam", "mamidi", "mamidikaya", "mamidipandu", "alphonso", "banganapalli", "kesar", "మామిడి", "మామిడిపండు", "మామిడికాయ", "బంగినపల్లి", "आम", "மாம்பழம்", "மாங்காய்", "ಮಾವಿನಹಣ್ಣು", "ಮಾವು"],
        "Banana": ["banana", "bananas", "kela", "arati", "aratipandu", "aratikaya", "అరటి", "అరటిపండు", "అరటికాయ", "కేలా", "केला", "வாழைப்பழம்", "வாழைக்காய்", "ಬಾಳೆಹಣ್ಣು", "ಬಾಳೆ"],
        "Apple": ["apple", "apples", "seb", "ఆపిల్", "ఆపిల్స్", "సేబ్", "सेब", "ஆப்பிள்", "ಸೇಬು"],
        "Okra": ["okra", "ladyfinger", "bhindi", "bhendi", "bendakaya", "vendakkai", "bendekayi", "బెండకాయ", "బెండకాయలు", "భిండి", "भिंडी", "வெண்டைக்காய்", "ಬೆಂಡೆಕಾಯಿ"],
        "Brinjal": ["brinjal", "eggplant", "aubergine", "baingan", "vankaya", "vankayalu", "gutthi vankaya", "kathirikai", "badanekayi", "వంకాయ", "వంకాయలు", "గుత్తి వంకాయ", "బాంగన్", "बैंगन", "கத்தரிக்காய்", "ಬದನೆಕಾಯಿ"],
        "Cabbage": ["cabbage", "bandha gobi", "patta gobhi", "kosu", "elekosu", "క్యాబేజీ", "పత్తాగోభీ", "पत्तागोभी", "முட்டைக்கோஸ்", "ಕೋಸು", "ಎಲೆಕೋಸು"],
        "Cauliflower": ["cauliflower", "phool gobhi", "gobi", "hukosu", "కాలీఫ్లవర్", "పువ్వు గోబీ", "फूलगोभी", "காலிபிளவர்", "ಹೂಕೋಸು"],
        "Carrot": ["carrot", "carrots", "gajar", "క్యారెట్", "గాజర్", "गाजर", "கேரட்", "ಕ್ಯಾರೆಟ್"],
        "Spinach": ["spinach", "palak", "palakura", "keerai", "palak soppu", "పాలకూర", "పాలక్", "पालक", "கீரை", "ಪಾಲಕ್"],
        "Pulses": ["pulses", "dal", "toor dal", "moong dal", "chana", "kandulu", "pesalu", "minumulu", "pappu", "కందిపప్పు", "పెసలు", "మినుములు", "శనగలు", "పప్పు", "दालें", "दाल", "चना", "பருப்பு", "துவரம்பருப்பு", "ಬೇಳೆ"],
        "Sugarcane": ["sugarcane", "ganna", "cheraku", "karumbu", "kabbu", "us", "చెరకు", "చెరుకు", "గన్నా", "गन्ना", "கரும்பு", "ಕಬ್ಬು"],
        "Coconut": ["coconut", "coconuts", "nariyal", "kobbari", "kobbarikayalu", "thengai", "tenginakai", "కొబ్బరి", "కొబ్బరికాయ", "నారియల్", "नारियल", "தேங்காய்", "ತೆಂಗಿನಕಾಯಿ"],
        "Pomegranate": ["pomegranate", "anar", "danimma", "mathulai", "dalimbe", "దానిమ్మ", "అనార్", "अनार", "மாதுளை", "ದಾಳಿಂಬೆ"],
        "Papaya": ["papaya", "papita", "boppayi", "pappali", "parangi", "బొప్పాయి", "పపితా", "पपीता", "பப்பாளி", "ಪರಂಗಿ"]
      };

      const categoriesMap = {
        Tomato: "vegetable", Potato: "vegetable", Onion: "vegetable", Cabbage: "vegetable", Cauliflower: "vegetable", Carrot: "vegetable", Brinjal: "vegetable", Spinach: "vegetable", Okra: "vegetable",
        Apple: "fruit", Mango: "fruit", Banana: "fruit", Pomegranate: "fruit", Papaya: "fruit", Coconut: "fruit",
        Rice: "grain", Wheat: "grain", Maize: "grain",
        Pulses: "pulse", Groundnut: "pulse",
        Chili: "spice", Garlic: "spice", Ginger: "spice", Turmeric: "spice",
        Cotton: "other", Sugarcane: "other"
      };

      // 1. Extract Crop Name (check both translated and raw text)
      for (const [enName, localAliases] of Object.entries(cropsDict)) {
        if (localAliases.some(alias => lowerText.includes(alias.toLowerCase()) || rawLower.includes(alias.toLowerCase()))) {
          parsedData.name = enName;
          parsedData.category = categoriesMap[enName] || "vegetable";
          break;
        }
      }

      // 2. Extract Location if mentioned
      const locMatch = lowerText.match(/(?:from|in|at|near|location|farm in|district of)\s+([a-zA-Z\s]{3,20})/i);
      if (locMatch && !parsedData.farmLocation) {
        const candidate = locMatch[1].trim();
        if (!["the", "my farm", "today", "now", "market", "organic", "vegetable", "district"].includes(candidate.toLowerCase())) {
          parsedData.farmLocation = candidate.charAt(0).toUpperCase() + candidate.slice(1);
          parsedData.location = parsedData.farmLocation;
        }
      }

      // 3. Extract Quantity and Indian Agricultural Units
      const combinedForQty = `${rawLower} ${lowerText}`;
      const qtyMatch = combinedForQty.match(/(\d+(?:\.\d+)?)\s*(kg|kilos|kilograms|quintal|quintals|qntl|bag|bags|bori|boriyan|basta|bastalu|bastha|basthalu|crate|crates|peti|pette|ton|tons|tonne|tonnes|liters|litre|l|కేజీలు|కిలోలు|క్వింటాల్|బస్తాలు|బస్తా|సంచులు|సంచి|పెట్టెలు|किलो|क्विंटल|बोरी|पेटी|टन|ಮೂಟೆ|ಕ್ವಿಂಟಾಲ್|மூட்டை|கிலோ)/i);
      let qRawVal = null;

      if (qtyMatch) {
        let qVal = parseFloat(qtyMatch[1]);
        qRawVal = qVal;
        let uStr = qtyMatch[2].toLowerCase();
        if (uStr.includes("quintal") || uStr.includes("qntl") || uStr.includes("క్వింటాల్") || uStr.includes("क्विंटल") || uStr.includes("ಕ್ವಿಂಟಾಲ್") || uStr.includes("குவிண்டால்")) {
          parsedData.quantity = Math.round(qVal * 100);
          parsedData.unit = "kg";
        } else if (uStr.includes("bag") || uStr.includes("bori") || uStr.includes("basta") || uStr.includes("bastha") || uStr.includes("బస్తా") || uStr.includes("సంచి") || uStr.includes("बोरी") || uStr.includes("ಮೂಟೆ") || uStr.includes("மூட்டை")) {
          parsedData.quantity = Math.round(qVal * 50);
          parsedData.unit = "kg";
        } else if (uStr.includes("crate") || uStr.includes("peti") || uStr.includes("pette") || uStr.includes("పెట్టె") || uStr.includes("पेटी")) {
          parsedData.quantity = Math.round(qVal * 25);
          parsedData.unit = "kg";
        } else if (uStr.includes("ton") || uStr.includes("టన్") || uStr.includes("टन")) {
          parsedData.quantity = qVal;
          parsedData.unit = "ton";
        } else if (uStr.includes("liter") || uStr.includes("litre") || uStr.includes("l")) {
          parsedData.quantity = qVal;
          parsedData.unit = "litre";
        } else {
          parsedData.quantity = qVal;
          parsedData.unit = "kg";
        }
      }

      // 4. Extract Price with Indian currency phrasing
      const combinedForPrice = `${rawLower} ${lowerText}`;
      const priceMatch = combinedForPrice.match(/(?:price|rate|at|for|rs\.?|rupees|rupee|rupay|rupaye|rupya|₹|inr|ధర|రూపాయలు|రూ|రొపాయలు|రొపాయి|रुपये|रुपए|रुपया|कीमत|दर|भाव|బెలె|விலை|ரூபாய்)\s*(?:is|to|=|:)?\s*(\d+(?:\.\d+)?)/i) ||
                         combinedForPrice.match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees|rupee|bucks|rupaye|rupay|roopayalu|rupai|dabbulu|రూపాయలు|రొపాయలు|రొపాయి|रुपये|रुपए|रूपये|रुपया|రూ|₹)/i) ||
                         combinedForPrice.match(/(\d+)\s*(?:per kg|kg ki|kilo ki|keji ki|per kilo|प्रति किलो|కేజీకి|కిలోకు)/i);
      if (priceMatch) {
        parsedData.price = Math.round(parseFloat(priceMatch[1]));
      }

      // 5. Intelligent Multi-Number Fallback & Conversational Step Association
      const allNumbers = (lowerText.match(/\b\d+(?:\.\d+)?\b/g) || []).map(n => parseFloat(n));
      
      if (existingForm.name && !parsedData.quantity && !parsedData.price && allNumbers.length === 1) {
        if (!existingForm.quantity) {
          parsedData.quantity = allNumbers[0];
          parsedData.unit = parsedData.unit || "kg";
        } else if (!existingForm.price) {
          parsedData.price = allNumbers[0];
        }
      } else if (!parsedData.quantity && !parsedData.price && allNumbers.length >= 2) {
        if (allNumbers[0] >= allNumbers[1]) {
          parsedData.quantity = allNumbers[0];
          parsedData.price = allNumbers[1];
        } else {
          parsedData.price = allNumbers[0];
          parsedData.quantity = allNumbers[1];
        }
        parsedData.unit = parsedData.unit || "kg";
      } else if (!parsedData.quantity && allNumbers.length > 0) {
        const cand = allNumbers.find(n => n !== parsedData.price && n !== qRawVal);
        if (cand) {
          parsedData.quantity = cand;
          parsedData.unit = parsedData.unit || "kg";
        }
      } else if (!parsedData.price && allNumbers.length > 0) {
        const cand = allNumbers.find(n => n !== parsedData.quantity && n !== qRawVal);
        if (cand) parsedData.price = Math.round(cand);
      }

      // 6. Detect Organic & Pesticide free
      if (/(organic|natural|chemical free|no chemical|without chemical|without any chemical|desi|swadesi|natu|naatu|సేంద్రీయ|సేంద్రియ|సహజ|మందులు లేని|రసాయన రహిత|जैविक|प्राकृतिक|நாட்டு|இயற்கை|ಸಾವಯವ|ನೈಸರ್ಗಿಕ)/i.test(combinedForPrice)) {
        parsedData.isOrganic = true;
      }
      if (/(pesticide free|no pesticide|no chemical|no spray|పురుగుమందులు లేని|మందులు కొట్టలేదు|कीटनाशक मुक्त|రసాయన రహిత)/i.test(combinedForPrice)) {
        parsedData.isPesticideFree = true;
      }
      if (/(chemical|hybrid|non organic|not organic|హైబ్రిడ్|సాధారణ|रासायनिक)/i.test(combinedForPrice) && !/(no|without|free|leni|లేని|లేకుండా|రహిత|मुक्त)/i.test(combinedForPrice)) {
        parsedData.isOrganic = false;
      }

      // 7. Auto-generate appealing description if missing
      if (parsedData.name && parsedData.quantity && parsedData.price && !parsedData.description) {
        parsedData.description = `Fresh, naturally harvested ${parsedData.isOrganic ? "100% organic " : ""}${parsedData.name}${parsedData.farmLocation ? ` grown in ${parsedData.farmLocation}` : ""} directly from farm.`;
      }

      // 8. Calculate Expected Revenue
      if (parsedData.quantity && parsedData.price) {
        parsedData.expectedRevenue = Math.round(parsedData.quantity * parsedData.price);
      }

      // 9. Conversational Native Dialog Generation based on current stage
      const targetLang = lang ? lang.split("-")[0] : "en";

      if (!parsedData.name) {
        const prompts = {
          en: "What crop would you like to sell today? (e.g. Tomato, Rice, Chilli)",
          te: "మీరు ఈ రోజు ఏ పంటను అమ్మాలనుకుంటున్నారు? (ఉదా: టమోటా, వరి, మిర్చి)",
          hi: "आप आज कौन सी फसल बेचना चाहते हैं? (जैसे: टमाटर, धान, मिर्च)",
          kn: "ನೀವು ಇಂದು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? (ಉದಾ: ಟೊಮೆಟೊ, ಭತ್ತ, ಮೆಣಸಿನಕಾಯಿ)",
          ta: "இன்று நீங்கள் என்ன பயிரை விற்க விரும்புகிறீர்கள்? (எ.கா: தக்காளி, நெல், மிளகாய்)"
        };
        parsedData.reply = prompts[targetLang] || prompts.en;
      } else if (!parsedData.quantity) {
        const prompts = {
          en: `Got it, ${parsedData.name}! How many kilograms, quintals, or bags do you have available?`,
          te: `అర్థమైంది, ${parsedData.name}! మీ దగ్గర ఎన్ని కిలోలు, బస్తాలు లేదా క్వింటాళ్లు ఉన్నాయి?`,
          hi: `समझ गया, ${parsedData.name}! आपके पास कितने किलो, बोरी या क्विंटल उपलब्ध हैं?`,
          kn: `ಅರ್ಥವಾಯಿತು, ${parsedData.name}! ನಿಮ್ಮ ಬಳಿ ಎಷ್ಟು ಕಿಲೋ, ಮೂಟೆ ಅಥವಾ ಕ್ವಿಂಟಾಲ್ ಲಭ್ಯವಿದೆ?`,
          ta: `புரிந்தது, ${parsedData.name}! உங்களிடம் எத்தனை கிலோ, மூட்டை அல்லது குவிண்டால் உள்ளது?`
        };
        parsedData.reply = prompts[targetLang] || prompts.en;
      } else if (!parsedData.price) {
        const prompts = {
          en: `Understood. What price per ${parsedData.unit || "kg"} would you like to set in Rupees?`,
          te: `కిలోకు ఎంత ధర (రూపాయల్లో) నిర్ణయించాలనుకుంటున్నారు?`,
          hi: `प्रति ${parsedData.unit || "किलो"} कितने रुपये का दाम रखना चाहते हैं?`,
          kn: `ಪ್ರತಿ ${parsedData.unit || "ಕೆಜಿ"}ಗೆ ಎಷ್ಟು ಬೆಲೆ (ರೂಪಾಯಿಗಳಲ್ಲಿ) ನಿಗದಿಪಡಿಸಲು ಬಯಸುತ್ತೀರಿ?`,
          ta: `ஒரு ${parsedData.unit || "கிலோ"}வுக்கு எத்தனை ரூபாய் விலை நிர்ணயிக்க விரும்புகிறீர்கள்?`
        };
        parsedData.reply = prompts[targetLang] || prompts.en;
      } else if (parsedData.isOrganic === undefined || parsedData.isOrganic === null) {
        const prompts = {
          en: "Is this crop 100% organic? Please say Yes or No.",
          te: "ఈ పంట 100% సేంద్రీయమైనదా (ఆర్గానిక్)? దయచేసి అవును లేదా కాదు అని చెప్పండి.",
          hi: "क्या यह फसल 100% जैविक (ऑर्गेनिक) है? कृपया हाँ या ना कहें.",
          kn: "ಈ ಬೆಳೆ 100% ಸಾವಯವವೇ? ದಯವಿಟ್ಟು ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
          ta: "இந்த பயிர் 100% இயற்கையானதா (ஆர்கானிக்)? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்."
        };
        parsedData.reply = prompts[targetLang] || prompts.en;
      } else {
        const revFormatted = (parsedData.expectedRevenue || (parsedData.quantity * parsedData.price)).toLocaleString('en-IN');
        const prompts = {
          en: `Great! I've filled in ${parsedData.name}, ${parsedData.quantity} ${parsedData.unit || 'kg'} at ₹${parsedData.price}/${parsedData.unit || 'kg'}. Total expected earnings: ₹${revFormatted}. Say 'Submit' to list it!`,
          te: `అద్భుతం! నేను ${parsedData.name}, ${parsedData.quantity} కిలోలు ₹${parsedData.price}/కేజీకి నింపాను. మొత్తం ఆదాయం: ₹${revFormatted}. మార్కెట్లో పెట్టడానికి 'సమర్పించు' అని చెప్పండి!`,
          hi: `शानदार! मैंने ${parsedData.name}, ${parsedData.quantity} किलो ₹${parsedData.price}/किलो भर दिया है। कुल कमाई: ₹${revFormatted}। लिस्ट करने के लिए 'जमा करें' कहें!`,
          kn: `ಉತ್ತಮ! ನಾನು ${parsedData.name}, ${parsedData.quantity} ಕೆಜಿಯನ್ನು ₹${parsedData.price}/ಕೆಜಿಗೆ ಭರ್ತಿ ಮಾಡಿದ್ದೇನೆ. ಒಟ್ಟು ಆದಾಯ: ₹${revFormatted}. ಪಟ್ಟಿ ಮಾಡಲು 'ಸಲ್ಲಿಸು' ಎಂದು ಹೇಳಿ!`,
          ta: `அற்புதம்! நான் ${parsedData.name}, ${parsedData.quantity} கிலோவை ₹${parsedData.price}/கிலோவிற்கு நிரப்பியுள்ளேன். மொத்த வருமானம்: ₹${revFormatted}. பட்டியலிட 'சமர்ப்பி' என்று சொல்லுங்கள்!`
        };
        parsedData.reply = prompts[targetLang] || prompts.en;
        parsedData.completed = true;
      }

    } else if (context === "marketplace_search") {
      parsedData.isOrganic = /(organic|natural)/i.test(lowerText);
      
      if (lowerText.includes("fruit") || lowerText.includes("apple") || lowerText.includes("mango")) parsedData.category = "fruit";
      else if (lowerText.includes("veg") || lowerText.includes("tomato") || lowerText.includes("potato")) parsedData.category = "vegetable";
      else if (lowerText.includes("grain") || lowerText.includes("rice") || lowerText.includes("wheat")) parsedData.category = "grain";
      else parsedData.category = "all";

      const queryMatch = lowerText.match(/(?:find|search|show me|looking for|want|buy)\s+(?:some\s+)?(?:fresh\s+)?(?:organic\s+)?([a-z\s]+)/i);
      if (queryMatch) {
        parsedData.searchQuery = queryMatch[1].trim().replace(/(please|now|fast|cheap|bulk)/gi, '').trim();
      } else {
        parsedData.searchQuery = text.replace(/(find|search|show me|looking for|some|fresh|organic|i want|buy|to)/gi, "").trim();
      }
    }

    return res.json({ source: "local_heuristic", data: parsedData });

  } catch (error) {
    console.error("AI Parse Error:", error);
    res.status(500).json({ error: "Failed to parse text" });
  }
};
