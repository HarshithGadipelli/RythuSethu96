import { GoogleGenerativeAI } from "@google/generative-ai";

// Free Google Translate API Bridge
const translateToEnglish = async (text) => {
  try {
    const hasNativeChars = /[^\x00-\x7F]/.test(text);
    if (!hasNativeChars) return text; // Already English or romanized

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    // We must use native fetch available in Node 18+
    const response = await fetch(url);
    const json = await response.json();
    
    // Google Translate returns an array of arrays: [[["Translated text", "Original Text", null, null, 1]], null, "te", ...]
    let translatedText = "";
    if (json && json[0]) {
      json[0].forEach(chunk => {
        if (chunk[0]) translatedText += chunk[0];
      });
    }
    return translatedText || text;
  } catch (err) {
    console.error("Free Translation Bridge Error:", err.message);
    return text; // Fallback to original
  }
};

// Free Google Translate API Bridge (To Target Lang)
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
          You are an expert NLP parser for a farming app. The user is a non-technical rural Indian farmer speaking into a microphone. The speech-to-text might transcribe their local language/accent phonetically in broken English (e.g. "nenu yebhai kilo tamota ammali andi", "i want sell 20 killos potato for forty rs bhaiya", "pachabiyyam 50 ton lu").
          
          CRITICAL INSTRUCTIONS:
          1. Ignore conversational filler/honorific words ("andi", "bhaiya", "sir", "ayya", "amma", "ji").
          2. Map phonetic/slang crop names to standard English (e.g., "tamota" -> "Tomato", "bhendi" / "bendakaya" -> "Okra", "vankaya" / "baingan" -> "Brinjal").
          3. Convert local units to standard units if possible, or just extract the standard units ("kg", "ton", "liters").
          4. Parse phonetic numbers (e.g. "yebhai" -> 50, "pachas" -> 50, "noota" -> 100, "paav" -> 0.25, "dhai" -> 2.5).
          
          Analyze the text: "${text}"
          
          Extract the following fields:
          {
            "name": "crop name (translate to English standard name with first letter capitalized)",
            "category": "vegetable, fruit, grain, spice, pulse, dairy, etc.",
            "quantity": number (extract the integer or float),
            "unit": "kg" or "ton" or "liters" (default to "kg" if not specified),
            "price": number (price per unit, extract integer),
            "description": "Short appealing description of the crop for buyers",
            "isOrganic": boolean (true if they mention organic, chemical free, natural, no pesticide, desi),
            "isPesticideFree": boolean (true if they mention pesticide free),
            "farmTourUrl": "string (URL if they mention a video link)",
            "reply": "A short, conversational acknowledgment in English asking ONLY for the FIRST missing field in this strict order: 1. name, 2. category, 3. quantity, 4. price, 5. description, 6. isOrganic, 7. isPesticideFree. Do NOT ask for multiple fields at once! If all are present, say 'Great, I have all the details!'",
            "completed": boolean (true ONLY if ALL fields are present)
          }
          Respond ONLY with valid JSON. Do not include backticks or markdown.
          `;
        } else if (context === "marketplace_search") {
          prompt = `
          You are an advanced AI assistant for a farming app marketplace. Analyze the conversational search intent. 
          The user might speak in heavily accented, phonetic slang, or broken English mixing local languages (e.g. "I want cheap organic tomatoes near me bhaiya", "bhayya sasta organic tamota kavali", "killo vanda lopu organic aalu").
          
          CRITICAL INSTRUCTIONS:
          1. Ignore conversational filler/honorific words ("andi", "bhaiya", "sir", "ayya", "amma", "ji").
          2. Map phonetic/slang crop names to standard English (e.g., "tamota" -> "Tomato", "bhendi" -> "Okra", "vankaya" -> "Brinjal", "aalu" -> "Potato").
          
          Analyze the text: "${text}"
          
          Required JSON structure:
          {
            "searchQuery": "main item (translate to standard English crop name)",
            "category": "vegetable", "fruit", "grain", "dairy", "pulse", "spice" or "all",
            "isOrganic": boolean (true if they say organic, natural, chemical free),
            "isPesticideFree": boolean (true if they say pesticide free, pure),
            "maxPrice": number or null (extract the numerical limit if they specify a price or say "under X rupees"),
            "maxDistance": number or null (extract kilometers if they say "under X km" or "near me" -> 10)
          }
          If you cannot find a value, use null. Respond ONLY with valid JSON. Do not include backticks or markdown.
          `;
        } else if (context === "omnipresent_farmer") {
          prompt = `
          You are an omnipresent, highly intelligent AI assistant for an uneducated rural Indian farmer's dashboard. 
          The user might speak in highly colloquial, phonetically spelled regional slang in broken English (e.g., "bhayya naku orders chupinchu", "kotha crop pettali andi", "tamata ki em mandu kottali").
          
          CRITICAL INSTRUCTIONS:
          1. Ignore conversational filler/honorific words ("andi", "bhaiya", "sir", "ayya", "amma", "ji").
          2. Determine the core intent based on the phonetic / colloquial meaning.
          
          Analyze the following text and accurately determine their core intent: "${text}"

          Possible Intents:
          1. "navigate_tab": User wants to see analytics, overview, orders, deliveries, map, or crops (e.g. "show my analytics", "view orders", "go back home", "orders tab ki vellu").
          2. "add_crop": User wants to add or list a crop (e.g. "I want to sell tomatoes", "kotha crop pettali", "nenu panta ammali").
          3. "farming_doubt": User is asking a question about farming, crops, weather, prices, or pests (e.g. "what pesticide should I use for tomatoes?", "how to grow rice?", "varsham padutunda", "tamata price entha").

          Required JSON structure:
          {
            "intent": "navigate_tab" | "add_crop" | "farming_doubt" | "unknown",
            "targetTab": "overview" | "crops" | "orders" | "analytics" (ONLY if intent is navigate_tab, else null),
            "aiAnswer": "A short, helpful 1-2 sentence answer to their farming doubt translated to English" (ONLY if intent is farming_doubt, else null)
          }
          Respond ONLY with valid JSON. Do not include backticks or markdown.
          `;
        } else {
          prompt = `Extract intent from: "${text}". Output JSON.`;
        }

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        let cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsedData = JSON.parse(cleanJsonStr);
        
        if (parsedData.reply && lang && lang !== "en" && lang !== "en-IN") {
          parsedData.reply = await translateFromEnglish(parsedData.reply, lang.split("-")[0]);
        }
        if (parsedData.aiAnswer && lang && lang !== "en" && lang !== "en-IN") {
          parsedData.aiAnswer = await translateFromEnglish(parsedData.aiAnswer, lang.split("-")[0]);
        }
        
        return res.json({ source: "gemini", data: parsedData });
      } catch (geminiError) {
        console.error("Gemini API Error, falling back to local parser:", geminiError);
        // Fallthrough to local parser
      }
    }

    // --- Sophisticated Local Fallback Parser ---
    // Parse context and utterance BEFORE translation to protect JSON structure
    let currentUtterance = text;
    let existingForm = {};
    const contextMatch = text.match(/I already have: (\{.*\}). User says: "(.*)"/s);
    if (contextMatch) {
      try { existingForm = JSON.parse(contextMatch[1]); } catch(e) {}
      currentUtterance = contextMatch[2];
    }

    // CRITICAL: Translate regional languages into English before heuristic parsing!
    const englishText = await translateToEnglish(currentUtterance);
    const lowerText = englishText.toLowerCase();

    // Start with existing knowledge
    let parsedData = { ...existingForm };
    
    // 1. Conversational Intents
    if (lowerText.match(/^(hi|hello|hey|namaste|vanakkam|namaskara|hallo)/)) {
      return res.json({ source: "local_heuristic", data: { reply: "Namaste! I am the Rythu Sethu AI Assistant. How can I help you with your farming or shopping today?" } });
    }
    if (lowerText.match(/(who are you|what can you do|help)/)) {
      return res.json({ source: "local_heuristic", data: { reply: "I am your intelligent farming assistant. If you're a farmer, tell me what you harvested to auto-fill your listing. If you're a buyer, tell me what you want to buy!" } });
    }
    if (lowerText.match(/(thank you|thanks|dhanyavad|nandri)/)) {
      return res.json({ source: "local_heuristic", data: { reply: "You're very welcome! Let me know if you need anything else. 🌱" } });
    }
    if (lowerText.match(/(good|awesome|great|nice|wow)/) && lowerText.length < 15) {
      return res.json({ source: "local_heuristic", data: { reply: "Thank you! I'm here to make things easier for you." } });
    }

    if (context === "omnipresent_farmer") {
      // Local fallback for omnipresent
      if (lowerText.match(/(analytics|stats|overview|dashboard|home)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "navigate_tab", targetTab: "analytics" } });
      } else if (lowerText.match(/(order|orders|sales)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "navigate_tab", targetTab: "orders" } });
      } else if (lowerText.match(/(crop|crops|list|sell|add)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "add_crop" } });
      } else if (lowerText.match(/(how|what|why|pesticide|fertilizer|grow|weather)/)) {
        return res.json({ source: "local_heuristic", data: { intent: "farming_doubt", aiAnswer: "That is a great question! For best results, use organic compost and monitor soil moisture. (Note: Please set your Gemini API key for advanced AI answers)." } });
      } else {
        return res.json({ source: "local_heuristic", data: { intent: "unknown", reply: "I am your Omnipresent Assistant. You can ask me to show analytics, add crops, or ask farming questions!" } });
      }
    }

    if (context === "farmer_add_crop") {
      // 1. Navigation / Exit Intents
      if (lowerText.match(/(cancel|stop|quit|exit|go back|nevermind)/)) {
        return res.json({ source: "local_heuristic", data: { action: "cancel", reply: "Alright, I've closed the assistant. Let me know if you need anything else!" } });
      }

      const cropsDict = {
        "tomato": ["tomato", "tomatoes", "టమోటా", "టమోటాలు", "टमाटर", "தக்காளி", "ಟೊಮೆಟೊ"],
        "potato": ["potato", "potatoes", "బంగాళదుంప", "आलू", "உருளைக்கிழங்கு", "ಆಲೂಗಡ್ಡೆ"],
        "onion": ["onion", "onions", "ఉల్లిపాయ", "प्याज", "வெங்காயம்", "ಈರುಳ್ಳಿ"],
        "rice": ["rice", "paddy", "వరి", "బియ్యం", "चावल", "धान", "அரிசி", "ಅಕ್ಕಿ"],
        "wheat": ["wheat", "గోధుమలు", "गेहूं", "கோதுமை", "ಗೋಧಿ"],
        "cotton": ["cotton", "పత్తి", "कपास", "பருத்தி", "ಹತ್ತಿ"],
        "apple": ["apple", "apples", "ఆపిల్", "सेब", "ஆப்பிள்", "ಸೇಬು"],
        "mango": ["mango", "mangoes", "మామిడి", "आम", "மாம்பழம்", "ಮಾವಿನಹಣ್ಣು"],
        "banana": ["banana", "bananas", "అరటి", "केला", "ಬಾಳೆಹಣ್ಣು", "வாழைப்பழம்"],
        "chili": ["chili", "chilli", "మిరపకాయ", "मिर्च", "ಮೆಣಸಿನಕಾಯಿ", "மிளகாய்"],
        "garlic": ["garlic", "వెల్లుల్లి", "लहसुन", "ಬೆಳ್ಳುಳ್ಳಿ", "பூண்டு"],
        "ginger": ["ginger", "అల్లం", "अदरक", "ಶುಂಠಿ", "இஞ்சி"],
        "cabbage": ["cabbage", "క్యాబేజీ", "पत्तागोभी", "ಕೋಸು", "முட்டைக்கோஸ்"],
        "cauliflower": ["cauliflower", "కాలీఫ్లవర్", "फूलगोभी", "ಹೂಕೋಸು", "காலிபிளவர்"],
        "carrot": ["carrot", "carrots", "క్యారెట్", "गाजर", "ಕ್ಯಾರೆಟ್", "கேரட்"],
        "brinjal": ["brinjal", "eggplant", "వంకాయ", "बैंगन", "ಬದನೆಕಾಯಿ", "கத்தரிக்காய்"],
        "spinach": ["spinach", "పాలకూర", "पालक", "ಪಾಲಕ್", "கீரை"],
        "pulses": ["pulses", "dal", "పప్పులు", "दालें", "ಬೇಳೆಕಾಳುಗಳು", "பருப்பு"],
        "sugarcane": ["sugarcane", "చెరకు", "गन्ना", "ಕಬ್ಬು", "கரும்பு"]
      };

      // Try to extract quantity (handles English and basic numeric)
      // Enhanced to support "fifty", "two hundred", etc.
      const wordToNum = {"one":1,"two":2,"three":3,"four":4,"five":5,"six":6,"seven":7,"eight":8,"nine":9,"ten":10,"twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60,"seventy":70,"eighty":80,"ninety":90,"hundred":100};
      let qtyFound = false;
      
      const qtyMatch = lowerText.match(/(\d+)\s*(kg|kilos|kilograms|tons|tonnes|liters|l|కేజీలు|కిలోలు|किलो)/i);
      if (qtyMatch) {
        parsedData.quantity = parseInt(qtyMatch[1], 10);
        let unit = qtyMatch[2].toLowerCase();
        if (unit.startsWith('k') || unit.includes('కేజీ') || unit.includes('కిలో') || unit.includes('किलो')) parsedData.unit = 'kg';
        else if (unit.startsWith('t')) parsedData.unit = 'tons';
        else if (unit.startsWith('l')) parsedData.unit = 'liters';
        qtyFound = true;
      } else {
        // Word match
        const wordQtyMatch = lowerText.match(/(one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\s*(kg|kilos|tons|liters|l)/i);
        if (wordQtyMatch) {
          parsedData.quantity = wordToNum[wordQtyMatch[1].toLowerCase()];
          parsedData.unit = wordQtyMatch[2].toLowerCase().startsWith('t') ? 'tons' : 'kg';
          qtyFound = true;
        }
      }

      // Try to extract price
      const priceMatch = lowerText.match(/(?:for|at|rs\.?|rupees|₹|inr|రూపాయలు|रुपये)\s*(\d+)/i) || lowerText.match(/(\d+)\s*(?:rs|rupees|bucks|రూపాయలు|रुपये)/i);
      if (priceMatch) {
        parsedData.price = parseInt(priceMatch[1], 10);
      } else {
        // Extract isolated numbers that aren't quantity
        const numbers = lowerText.match(/\b\d+\b/g);
        if (numbers && numbers.length > 0) {
          if (!qtyFound && numbers.length === 1) {
            parsedData.quantity = parseInt(numbers[0], 10);
            parsedData.unit = 'kg';
          } else if (qtyFound && numbers.length >= 1) {
             const priceCandidate = numbers.find(n => parseInt(n, 10) !== parsedData.quantity);
             if (priceCandidate) parsedData.price = parseInt(priceCandidate, 10);
          }
        }
      }

      // Try to extract organic
      parsedData.isOrganic = /(organic|natural|without pesticide|no pesticide|desi|సేంద్రీయ|जैविक)/i.test(lowerText);

      // Extract crop name using multilingual dictionary
      for (const [enName, localNames] of Object.entries(cropsDict)) {
        if (localNames.some(name => lowerText.includes(name))) {
          parsedData.name = enName.charAt(0).toUpperCase() + enName.slice(1);
          break;
        }
      }
      
      if (!parsedData.name && lowerText.split(" ").length > 0) {
        // Fallback
        const words = lowerText.split(" ");
        const stopWords = ["i", "have", "sell", "want", "to", "add", "harvested", "my", "some", "organic", "fresh", "kg", "tons", "liters", "rs", "rupees", "for", "at"];
        for (const w of words) {
          if (!stopWords.includes(w) && isNaN(w)) {
            parsedData.name = w.charAt(0).toUpperCase() + w.slice(1);
            break;
          }
        }
      }

      // Fallback extractors for remaining fields
      if (!parsedData.category) {
        const catMatch = lowerText.match(/(vegetable|fruit|grain|spice|flower|nut|herb)/i);
        if (catMatch) parsedData.category = catMatch[1].toLowerCase();
      }
      
      if (parsedData.isOrganic !== undefined && parsedData.isOrganic !== null && (parsedData.isPesticideFree === undefined || parsedData.isPesticideFree === null)) {
        if (/(yes|no|yeah|nope|sure|yep)/i.test(lowerText)) {
             parsedData.isPesticideFree = /(yes|yeah|sure|yep)/i.test(lowerText);
        }
      }

      if (!parsedData.farmTourUrl) {
         if (/(skip|no video|none|no url|nothing)/i.test(lowerText)) {
           parsedData.farmTourUrl = "skip";
         } else if (/http|www|\.com|youtu/i.test(lowerText)) {
           const urlMatch = lowerText.match(/(https?:\/\/[^\s]+)/);
           parsedData.farmTourUrl = urlMatch ? urlMatch[1] : lowerText;
         }
      }

      if (parsedData.name && parsedData.quantity && parsedData.price && !parsedData.description) {
        if (lowerText.length > 3 && !/(yes|no|skip|yeah|nope)/i.test(lowerText) && isNaN(parseInt(lowerText))) {
          parsedData.description = text.trim();
        }
      }

      // Check for missing fields for guided conversational flow STRICTLY block-by-block
      if (!parsedData.name) {
        parsedData.reply = "What crop would you like to sell?";
      } else if (!parsedData.category) {
        parsedData.reply = "What category does it fall under? Vegetable, fruit, or grain?";
      } else if (!parsedData.quantity) {
        parsedData.reply = "How many kilograms do you have for sale?";
      } else if (!parsedData.price) {
        parsedData.reply = "What is the price per kilogram?";
      } else if (!parsedData.description) {
        parsedData.reply = "Please provide a short description for the buyers.";
      } else if (parsedData.isOrganic === undefined || parsedData.isOrganic === null) {
        parsedData.reply = "Is the crop organic? Please say yes or no.";
      } else if (parsedData.isPesticideFree === undefined || parsedData.isPesticideFree === null) {
        parsedData.reply = "Is it pesticide free? Please say yes or no.";
      } else if (!parsedData.farmTourUrl) {
        parsedData.reply = "Do you have a video link for a farm tour? If not, say skip.";
      } else {
        parsedData.reply = "Great, I have all the details!";
        parsedData.completed = true;
      }

    } else if (context === "marketplace_search") {
      parsedData.isOrganic = /(organic|natural)/i.test(lowerText);
      
      if (lowerText.includes("fruit") || lowerText.includes("apple") || lowerText.includes("mango")) parsedData.category = "fruit";
      else if (lowerText.includes("veg") || lowerText.includes("tomato") || lowerText.includes("potato")) parsedData.category = "vegetable";
      else if (lowerText.includes("grain") || lowerText.includes("rice") || lowerText.includes("wheat")) parsedData.category = "grain";
      else parsedData.category = "all";

      // Extract search query
      const queryMatch = lowerText.match(/(?:find|search|show me|looking for|want|buy)\s+(?:some\s+)?(?:fresh\s+)?(?:organic\s+)?([a-z\s]+)/i);
      if (queryMatch) {
        parsedData.searchQuery = queryMatch[1].trim().replace(/(please|now|fast|cheap|bulk)/gi, '').trim();
      } else {
        parsedData.searchQuery = text.replace(/(find|search|show me|looking for|some|fresh|organic|i want|buy|to)/gi, "").trim();
      }
    }

    // Translate AI replies back to the user's language if needed
    if (parsedData.reply && lang && lang !== "en") {
      parsedData.reply = await translateFromEnglish(parsedData.reply, lang);
    }

    return res.json({ source: "local_heuristic", data: parsedData });

  } catch (error) {
    console.error("AI Parse Error:", error);
    res.status(500).json({ error: "Failed to parse text" });
  }
};
