// Multilingual Voice Parser for Rythu Sethu
import { LANG_MAP } from "./useVoiceInput";

export const CROPS_MAP = {
  // English & Slangs
  tomato: "Tomato", tomatoes: "Tomato", tamatar: "Tomato", tamata: "Tomato", tamota: "Tomato", thakkali: "Tomato", takkali: "Tomato",
  potato: "Potato", potatoes: "Potato", aloo: "Potato", aalu: "Potato", aaloo: "Potato", batata: "Potato", alugadda: "Potato",
  onion: "Onion", onions: "Onion", pyaz: "Onion", pyaaz: "Onion", kanda: "Onion", ullipaya: "Onion", erragaddalu: "Onion", ulligadda: "Onion",
  rice: "Rice", paddy: "Rice", chawal: "Rice", dhaan: "Rice", dhan: "Rice", biyyam: "Rice", vadlu: "Rice", sonamasoori: "Rice", basmati: "Rice",
  wheat: "Wheat", gehu: "Wheat", gehoon: "Wheat", godhumalu: "Wheat", godhuma: "Wheat",
  cotton: "Cotton", patti: "Cotton", kapaas: "Cotton", kapas: "Cotton", doodi: "Cotton",
  chili: "Chili", chilli: "Chili", chilies: "Chili", chillies: "Chili", mirchi: "Chili", mirapa: "Chili",
  garlic: "Garlic", lahsun: "Garlic", lashun: "Garlic", vellulli: "Garlic", tellagaddalu: "Garlic",
  ginger: "Ginger", adrak: "Ginger", allam: "Ginger", inji: "Ginger", shunti: "Ginger",
  turmeric: "Turmeric", haldi: "Turmeric", pasupu: "Turmeric", manjal: "Turmeric", arishina: "Turmeric",
  groundnut: "Groundnut", peanut: "Groundnut", palli: "Groundnut", pallilu: "Groundnut", mungfali: "Groundnut", verkadalai: "Groundnut",
  maize: "Maize", corn: "Maize", bhutta: "Maize", makka: "Maize", makkajonna: "Maize", jonnalu: "Maize", jowar: "Maize", bajra: "Maize", ragi: "Maize",
  mango: "Mango", mangoes: "Mango", aam: "Mango", mamidi: "Mango", mamidikaya: "Mango", alphonso: "Mango", banganapalli: "Mango",
  banana: "Banana", bananas: "Banana", kela: "Banana", arati: "Banana", aratipandu: "Banana",
  apple: "Apple", apples: "Apple", seb: "Apple",
  okra: "Okra", ladyfinger: "Okra", bhindi: "Okra", bhendi: "Okra", bendakaya: "Okra", vendakkai: "Okra",
  brinjal: "Brinjal", brinjals: "Brinjal", eggplant: "Brinjal", baingan: "Brinjal", vankaya: "Brinjal",
  cabbage: "Cabbage", kosu: "Cabbage", cauliflower: "Cauliflower", gobi: "Cauliflower",
  carrot: "Carrot", carrots: "Carrot", gajar: "Carrot",
  spinach: "Spinach", palak: "Spinach", palakura: "Spinach", keerai: "Spinach",
  pulses: "Pulses", dal: "Pulses", chana: "Pulses", kandulu: "Pulses", pesalu: "Pulses", minumulu: "Pulses", pappu: "Pulses",
  sugarcane: "Sugarcane", ganna: "Sugarcane", cheraku: "Sugarcane",
  coconut: "Coconut", nariyal: "Coconut", kobbari: "Coconut",
  pomegranate: "Pomegranate", anar: "Pomegranate", danimma: "Pomegranate",
  papaya: "Papaya", papita: "Papaya", boppayi: "Papaya",

  // Telugu
  టమోటా: "Tomato", టమోటాలు: "Tomato", తమోటా: "Tomato", టమాట: "Tomato", నాటుటమోటా: "Tomato",
  బంగాళదుంప: "Potato", బంగాళదుంపలు: "Potato", బంగాళాదుంప: "Potato", బంగాళాదుంపలు: "Potato", ఆలుగడ్డ: "Potato", ఆలూ: "Potato",
  ఉల్లిపాయ: "Onion", ఉల్లిపాయలు: "Onion", ఎర్రగడ్డలు: "Onion", ఉల్లిగడ్డ: "Onion", కాందా: "Onion",
  వరి: "Rice", బియ్యం: "Rice", వడ్లు: "Rice", సోనామసూరి: "Rice", బాస్మతి: "Rice",
  గోధుమలు: "Wheat", గోధుమ: "Wheat",
  పత్తి: "Cotton", దూది: "Cotton",
  మిరపకాయ: "Chili", మిర్చి: "Chili", పచ్చిమిర్చి: "Chili", ఎండుమిర్చి: "Chili", మిరపకాయలు: "Chili",
  వెల్లుల్లి: "Garlic", తెల్లగడ్డలు: "Garlic",
  అల్లం: "Ginger",
  పసుపు: "Turmeric",
  వేరుశనగ: "Groundnut", పల్లీలు: "Groundnut", పల్లీ: "Groundnut",
  మొక్కజొన్న: "Maize", జొన్నలు: "Maize", మక్కజొన్న: "Maize", రాగులు: "Maize",
  మామిడి: "Mango", మామిడిపండు: "Mango", మామిడికాయ: "Mango", బంగినపల్లి: "Mango",
  అరటి: "Banana", అరటిపండు: "Banana", అరటికాయ: "Banana",
  ఆపిల్: "Apple", ఆపిల్స్: "Apple",
  బెండకాయ: "Okra", బెండకాయలు: "Okra",
  వంకాయ: "Brinjal", వంకాయలు: "Brinjal", గుత్తివంకాయ: "Brinjal",
  క్యాబేజీ: "Cabbage", కాలీఫ్లవర్: "Cauliflower",
  క్యారెట్: "Carrot", క్యారెట్లు: "Carrot",
  పాలకూర: "Spinach", పాలక్: "Spinach",
  పప్పులు: "Pulses", పప్పు: "Pulses", కందిపప్పు: "Pulses", పెసలు: "Pulses", మినుములు: "Pulses", శనగలు: "Pulses",
  చెరకు: "Sugarcane", చెరుకు: "Sugarcane",
  కొబ్బరి: "Coconut", కొబ్బరికాయ: "Coconut",
  దానిమ్మ: "Pomegranate", బొప్పాయి: "Papaya",

  // Hindi
  टमाटर: "Tomato", आलू: "Potato", प्याज: "Onion", चावल: "Rice", धान: "Rice", गेहूं: "Wheat", गेहूँ: "Wheat",
  कपास: "Cotton", मिर्च: "Chili", मिर्ची: "Chili", लहसुन: "Garlic", अदरक: "Ginger", हल्दी: "Turmeric",
  मूंगफली: "Groundnut", मक्का: "Maize", भुट्टा: "Maize", आम: "Mango", केला: "Banana", सेब: "Apple",
  भिंडी: "Okra", बैंगन: "Brinjal", पत्तागोभी: "Cabbage", फूलगोभी: "Cauliflower", गाजर: "Carrot", पालक: "Spinach",
  दालें: "Pulses", दाल: "Pulses", चना: "Pulses", गन्ना: "Sugarcane", नारियल: "Coconut", अनार: "Pomegranate", पपीता: "Papaya",

  // Kannada
  ಟೊಮೆಟೊ: "Tomato", ಆಲೂಗಡ್ಡೆ: "Potato", ಈರುಳ್ಳಿ: "Onion", ಅಕ್ಕಿ: "Rice", ಭತ್ತ: "Rice", ಗೋಧಿ: "Wheat",
  ಹತ್ತಿ: "Cotton", ಮೆಣಸಿನಕಾಯಿ: "Chili", ಬೆಳ್ಳುಳ್ಳಿ: "Garlic", ಶುಂಠಿ: "Ginger", ಅರಿಶಿನ: "Turmeric",
  ನೆಲಗಡಲೆ: "Groundnut", ಜೋಳ: "Maize", ಮಾವು: "Mango", ಬಾಳೆ: "Banana", ಸೇಬು: "Apple", ಬೆಂಡೆಕಾಯಿ: "Okra",
  ಬದನೆಕಾಯಿ: "Brinjal", ಕೋಸು: "Cabbage", ಹೂಕೋಸು: "Cauliflower", ಕ್ಯಾರೆಟ್: "Carrot", ಪಾಲಕ್: "Spinach",
  ಬೇಳೆ: "Pulses", ಕಬ್ಬು: "Sugarcane", ತೆಂಗಿನಕಾಯಿ: "Coconut", ದಾಳಿಂಬೆ: "Pomegranate", ಪರಂಗಿ: "Papaya",

  // Tamil
  தக்காளி: "Tomato", உருளைக்கிழங்கு: "Potato", வெங்காயம்: "Onion", அரிசி: "Rice", நெல்: "Rice", கோதுமை: "Wheat",
  பருத்தி: "Cotton", மிளகாய்: "Chili", பூண்டு: "Garlic", இஞ்சி: "Ginger", மஞ்சள்: "Turmeric",
  வேர்க்கடலை: "Groundnut", மக்காச்சோளம்: "Maize", மாம்பழம்: "Mango", வாழைப்பழம்: "Banana", ஆப்பிள்: "Apple",
  வெண்டைக்காய்: "Okra", கத்தரிக்காய்: "Brinjal", முட்டைக்கோஸ்: "Cabbage", காலிபிளவர்: "Cauliflower",
  கேரட்: "Carrot", கீரை: "Spinach", பருப்பு: "Pulses", கரும்பு: "Sugarcane", தேங்காய்: "Coconut", மாதுளை: "Pomegranate", பப்பாளி: "Papaya"
};

export const CATEGORIES_MAP = {
  Tomato: "vegetable", Potato: "vegetable", Onion: "vegetable", Cabbage: "vegetable", Cauliflower: "vegetable", Carrot: "vegetable", Brinjal: "vegetable", Spinach: "vegetable", Okra: "vegetable",
  Apple: "fruit", Mango: "fruit", Banana: "fruit", Pomegranate: "fruit", Papaya: "fruit", Coconut: "fruit",
  Rice: "grain", Wheat: "grain", Maize: "grain",
  Pulses: "pulse", Groundnut: "pulse",
  Chili: "spice", Garlic: "spice", Ginger: "spice", Turmeric: "spice",
  Cotton: "other", Sugarcane: "other"
};

const ORGANIC_KEYWORDS = [
  "organic", "natural", "chemical free", "desi", "swadesi", "natu", "naatu",
  "సేంద్రీయ", "సేంద్రియ", "సేంద్రీయమైన", "నాచురల్", "సహజ",
  "जैविक", "ऑर्गेनिक", "प्राकृतिक", "देशी",
  "ಸಾವಯವ", "ನೈಸರ್ಗಿಕ",
  "இயற்கை", "ஆர்கானிக்"
];

export const UNITS_MAP = {
  quintal: ["quintal", "quintals", "qntl", "క్వింటాల్", "క్వింటాళ్లు", "क्विंटल", "ಕ್ವಿಂಟಾಲ್", "குவிண்டால்"],
  bag: ["bag", "bags", "bori", "boriyan", "basta", "bastalu", "bastha", "basthalu", "బస్తా", "బస్తాలు", "బోరి", "बोरी", "ಮೂಟೆ", "மூட்டை"],
  crate: ["crate", "crates", "peti", "pette", "pettelu", "పెట్టె", "పెట్టెలు", "पेटी", "ಪೆಟ್ಟಿಗೆ"],
  ton: ["ton", "tons", "tonne", "tonnes", "టన్", "టన్నులు", "टन"],
  kg: ["kg", "kilo", "kilos", "kilogram", "kilograms", "కేజీ", "కేజీలు", "కిలో", "కిలోలు", "किलो", "किलोग्राम", "ಕೆಜಿ", "ಕಿಲೋ", "கிலோ"],
  g: ["g", "gram", "grams", "గ్రాములు", "గ్రామ్", "ग्राम", "ಗ್ರಾಂ", "கிராம்"],
  litre: ["litre", "litres", "liter", "liters", "లీటర్", "లీటర్లు", "लीटर", "ಲೀಟರ್", "லிட்டர்"],
  piece: ["piece", "pieces", "పీస్", "పీసులు", "पीस", "टुकड़ा", "ಪೀಸ್", "பீஸ்"],
  dozen: ["dozen", "dozens", "డజన్", "दर्जन", "ಡಜನ್", "டஜன்"]
};

const PRICE_INDICATORS = [
  "price", "rupees", "rupee", "rs", "₹", "inr", "bucks", "rate", "cost", "at",
  "ధర", "రూపాయలు", "రూపాయి", "రూ", "రొపాయలు", "డబ్బులు",
  "कीमत", "रुपये", "रुपया", "रू", "दाम", "भाव",
  "ಬೆಲೆ", "ರೂಪಾಯಿ", "ರೂ",
  "விலை", "ரூபாய்", "ரூ"
];

const NUMBERS_MAP = {
  // English
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  twentyfive: 25, thirty: 30, thirtyfive: 35, forty: 40, fortyfive: 45, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, twohundred: 200, fivehundred: 500, thousand: 1000,

  // Telugu
  సున్నా: 0, ఒకటి: 1, రెండు: 2, మూడు: 3, నాలుగు: 4, ఐదు: 5, ఆరు: 6, ఏడు: 7, ఎనిమిది: 8, తొమ్మిది: 9, పది: 10,
  పదకొండు: 11, పన్నెండు: 12, పదమూడు: 13, పద్నాలుగు: 14, పదిహేను: 15, పదహారు: 16, పదిహేడు: 17, పద్దెనిమిది: 18, పంతొమ్మిది: 19,
  ఇరవై: 20, ఇరవైఐదు: 25, పాతిక: 25, ముప్పై: 30, ముప్పైఐదు: 35, నలభై: 40, నలభైఐదు: 45, యాభై: 50, యాబై: 50, యాభైఐదు: 55,
  అరవై: 60, అరవైఐదు: 65, దెబ్బై: 70, దెబ్బైఐదు: 75, ఎనభై: 80, ఎనభైఐదు: 85, తొంభై: 90, తొంభైఐదు: 95,
  వంద: 100, నూట: 100, నూటయాభై: 150, రెండువందలు: 200, ఐదువందలు: 500, వెయ్యి: 1000,

  // Hindi
  शून्य: 0, एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10,
  ग्यारह: 11, बारह: 12, तेरह: 13, चौदह: 14, पंद्रह: 15, सोलह: 16, सत्रह: 17, अठारह: 18, उन्नीस: 19,
  बीस: 20, पच्चीस: 25, तीस: 30, पैंतीस: 35, चालीस: 40, पैंतालीस: 45, पचास: 50, पचपन: 55, साठ: 60, सत्तर: 70, अस्सी: 80, नब्बे: 90,
  सौ: 100, डेढ़सौ: 150, दोसौ: 200, पांचसौ: 500, हजार: 1000,

  // Kannada
  ಶೂನ್ಯ: 0, ಒಂದು: 1, ಎರಡು: 2, ಮೂರು: 3, ನಾಲ್ಕು: 4, ಐದು: 5, ಆರು: 6, ಏಳು: 7, ಎಂಟು: 8, ಒಂಬತ್ತು: 9, ಹತ್ತು: 10,
  ಹನ್ನೊಂದು: 11, ಹನ್ನೆರಡು: 12, ಹದಿಮೂರು: 13, ಹದಿನಾಲ್ಕು: 14, ಹದಿನೈದು: 15, ಹದಿನಾರು: 16, ಹದಿನೇಳು: 17, ಹದಿನೆಂಟು: 18, ಹತ್ತೊಂಬತ್ತು: 19,
  ಇಪ್ಪತ್ತು: 20, ಇಪ್ಪತ್ತೈದು: 25, ಮೂವತ್ತು: 30, ಮೂವತ್ತೈದು: 35, ನಲವತ್ತು: 40, ನಲವತ್ತೈದು: 45, ಐವತ್ತು: 50, ಐವತ್ತೈದು: 55,
  ಅರವತ್ತು: 60, ಎಪ್ಪತ್ತು: 70, ಎಂಬತ್ತು: 80, ತೊಂಬತ್ತು: 90,
  ನೂರು: 100, ಇನ್ನೂರು: 200, ಐನೂರು: 500, ಸಾವಿರ: 1000,

  // Tamil
  பூஜ்ஜியம்: 0, ஒன்று: 1, இரண்டு: 2, மூன்று: 3, நான்கு: 4, ஐந்து: 5, ஆறு: 6, ஏழு: 7, எட்டு: 8, ஒன்பது: 9, பத்து: 10,
  பதினொன்று: 11, பன்னிரண்டு: 12, பதின்மூன்று: 13, பதினான்கு: 14, பதினைந்து: 15, பதினாறு: 16, பதினேழு: 17, பதினெட்டு: 18, பத்தொன்பது: 19,
  இருபது: 20, இருபத்தைந்து: 25, முப்பது: 30, முப்பத்தைந்து: 35, நாற்பது: 40, நாற்பத்தைந்து: 45, ஐம்பது: 50, ஐம்பத்தைந்து: 55,
  அறுபது: 60, எழுபது: 70, எண்பது: 80, தொண்ணூறு: 90,
  நூறு: 100, இருநூறு: 200, ஐந்நூறு: 500, ஆயிரம்: 1000
};

export const CROP_BENCHMARKS = {
  Tomato: { min: 25, max: 42, avg: 34, unit: "kg", trend: "Upward (+8%)", advice: "High demand in urban markets this week." },
  Potato: { min: 18, max: 28, avg: 23, unit: "kg", trend: "Stable", advice: "Steady retail demand across local mandis." },
  Onion: { min: 24, max: 38, avg: 30, unit: "kg", trend: "Upward (+12%)", advice: "Supply is low, premium prices expected." },
  Rice: { min: 38, max: 58, avg: 48, unit: "kg", trend: "Stable", advice: "High bulk buying from wholesale cooperatives." },
  Wheat: { min: 28, max: 40, avg: 34, unit: "kg", trend: "Stable", advice: "MSP support strong across government procurement." },
  Cotton: { min: 65, max: 95, avg: 80, unit: "kg", trend: "Upward (+5%)", advice: "Spinning mills actively procuring raw stock." },
  Chili: { min: 80, max: 170, avg: 120, unit: "kg", trend: "Upward (+15%)", advice: "Export demand high for dried and fresh red chillies." },
  Garlic: { min: 110, max: 210, avg: 160, unit: "kg", trend: "High Demand", advice: "Supply scarcity leading to peak seasonal rates." },
  Ginger: { min: 70, max: 140, avg: 100, unit: "kg", trend: "Stable", advice: "Steady procurement from food processors." },
  Turmeric: { min: 90, max: 150, avg: 115, unit: "kg", trend: "Upward (+10%)", advice: "Curcumin-rich varieties selling at premium." },
  Groundnut: { min: 60, max: 90, avg: 75, unit: "kg", trend: "High Demand", advice: "Oil extractors procuring actively." },
  Maize: { min: 20, max: 32, avg: 25, unit: "kg", trend: "Stable", advice: "Poultry feed demand remains strong." },
  Apple: { min: 90, max: 160, avg: 120, unit: "kg", trend: "Stable", advice: "Grade-A quality fetching premium retail margins." },
  Mango: { min: 60, max: 130, avg: 85, unit: "kg", trend: "High Demand", advice: "Seasonal peak demand for sweet table varieties." },
  Banana: { min: 25, max: 45, avg: 35, unit: "dozen", trend: "Stable", advice: "Consistent daily delivery requirements." },
  Okra: { min: 25, max: 45, avg: 32, unit: "kg", trend: "Fast Moving", advice: "Fresh morning harvests preferred by buyers." },
  Brinjal: { min: 20, max: 38, avg: 28, unit: "kg", trend: "Stable", advice: "Local village market favorites." },
  Cabbage: { min: 15, max: 28, avg: 20, unit: "kg", trend: "Stable", advice: "Ideal for bulk group pre-orders." },
  Cauliflower: { min: 20, max: 40, avg: 30, unit: "kg", trend: "Stable", advice: "Good market demand during winter seasons." },
  Carrot: { min: 30, max: 50, avg: 40, unit: "kg", trend: "Stable", advice: "Fresh organic carrots see 25% faster sellouts." },
  Spinach: { min: 15, max: 30, avg: 22, unit: "kg", trend: "Fast Moving", advice: "Perishable leaf crop - recommend same-day pickup." },
  Pulses: { min: 85, max: 135, avg: 110, unit: "kg", trend: "Upward", advice: "Packaged pulses sell with high customer loyalty." },
  Sugarcane: { min: 300, max: 450, avg: 375, unit: "ton", trend: "Stable", advice: "Sugar mills running full extraction schedules." },
  Watermelon: { min: 12, max: 25, avg: 18, unit: "kg", trend: "High Demand", advice: "Peak summer hydration favorite." },
  Papaya: { min: 20, max: 40, avg: 28, unit: "kg", trend: "Fast Moving", advice: "High retail turnover across fruit markets." },
  Grapes: { min: 60, max: 120, avg: 85, unit: "kg", trend: "Upward (+10%)", advice: "Fresh table grapes in high urban demand." },
  Coconut: { min: 25, max: 45, avg: 32, unit: "piece", trend: "Stable", advice: "Year-round demand for fresh water and kernels." },
  Soybean: { min: 35, max: 55, avg: 45, unit: "kg", trend: "Upward (+6%)", advice: "Protein processing plants buying aggressively." },
  Mustard: { min: 45, max: 70, avg: 58, unit: "kg", trend: "Stable", advice: "High oil extraction demand in winter." },
  Peas: { min: 35, max: 65, avg: 48, unit: "kg", trend: "Fast Moving", advice: "Fresh green pods command premium pricing." },
  Cucumber: { min: 15, max: 30, avg: 22, unit: "kg", trend: "Fast Moving", advice: "Constant salad and vegetable consumption." },
  Drumstick: { min: 40, max: 80, avg: 55, unit: "kg", trend: "High Demand", advice: "Export and south Indian cuisine staple." },
  Coriander: { min: 20, max: 45, avg: 30, unit: "kg", trend: "Fast Moving", advice: "Daily culinary requirement, same-day delivery ideal." },
  BitterGourd: { min: 25, max: 48, avg: 36, unit: "kg", trend: "Stable", advice: "High medicinal and diabetic dietary demand." }
};

// Convert spoken number (word or digit string) to numerical string
export function parseSpokenNumber(text) {
  if (!text) return "";
  const cleaned = text.trim().toLowerCase().replace(/\s+/g, '');
  if (NUMBERS_MAP[cleaned] !== undefined) {
    return String(NUMBERS_MAP[cleaned]);
  }
  const words = text.toLowerCase().trim().split(/[\s,]+/);
  for (const w of words) {
    if (NUMBERS_MAP[w] !== undefined) {
      return String(NUMBERS_MAP[w]);
    }
  }
  const digits = text.match(/\d+(?:\.\d+)?/);
  if (digits) return digits[0];
  return text.trim();
}

// Convert spoken digit sequence (e.g. for phone numbers, OTPs, pincodes) to digits
export function parseSpokenSequence(text) {
  if (!text) return "";
  const words = text.toLowerCase().trim().split(/[\s,]+/);
  let result = "";
  const SINGLE_DIGIT_MAP = {
    zero: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    సున్న: "0", ఒకటి: "1", రెండు: "2", మూడు: "3", నాలుగు: "4",
    ఐదు: "5", ఆరు: "6", ఏడు: "7", ఎనిమిది: "8", తొమ్మిది: "9",
    शून्य: "0", एक: "1", दो: "2", तीन: "3", चार: "4",
    पांच: "5", छह: "6", सात: "7", आठ: "8", नौ: "9",
    ಸೊನ್ನೆ: "0", ಒಂದು: "1", ಎರಡು: "2", ಮೂರು: "3", ನಾಲ್ಕು: "4",
    ಐದು: "5", ಆರು: "6", ಏಳು: "7", ಎಂಟು: "8", ಒಂಬತ್ತು: "9",
    பூஜ்ஜியம்: "0", ஒன்று: "1", இரண்டு: "2", மூன்று: "3", நான்கு: "4",
    ஐந்து: "5", ஆறு: "6", ஏழு: "7", எட்டு: "8", ஒன்பது: "9"
  };

  for (const w of words) {
    const digitMatch = w.match(/\d+/);
    if (digitMatch) {
      result += digitMatch[0];
    } else if (SINGLE_DIGIT_MAP[w] !== undefined) {
      result += SINGLE_DIGIT_MAP[w];
    } else if (NUMBERS_MAP[w] !== undefined && NUMBERS_MAP[w] < 10) {
      result += String(NUMBERS_MAP[w]);
    }
  }
  return result || text.replace(/\D/g, "");
}

// Client-side Multilingual Entity & Command Parser
export function parseVoiceToFormMultilingual(transcript, lang = "en") {
  if (!transcript) return {};
  const lower = transcript.toLowerCase().trim();
  const updates = {};

  // 0. Detect Voice Commands / Actions
  if (/(submit|post|save|list|finish|done|ammali|ammandi|bechna|becho|సమర్పించు|దాఖలు|మార్కెట్|जमा करें|सहेजें|ಸಲ್ಲಿಸು|சமர்ப்பி)/i.test(lower)) {
    updates.action = "submit";
    return updates;
  }
  if (/(clear|reset|delete all|erase|malli|fir se|రద్దు|తుడిచివేయి|हटाएं|खाली करें|ಅಳಿಸು|அழி)/i.test(lower)) {
    updates.action = "clear";
    return updates;
  }
  if (/(cancel|close|exit|stop|quit|aapu|bandh|ఆపు|మూసివేయి|రద్దు|బంద్|बंद करें|ರದ್ದು|ரத்து)/i.test(lower)) {
    updates.action = "cancel";
    return updates;
  }

  // 1. Detect Crop Name - use substring matching to handle phonetic variants
  for (const [key, value] of Object.entries(CROPS_MAP)) {
    const keyLower = key.toLowerCase();
    // Match if the full key appears as a word boundary or substring in the transcript
    if (
      lower.split(/[\s,]+/).some(tok => tok === keyLower || tok.startsWith(keyLower) || keyLower.startsWith(tok.substring(0, Math.max(4, tok.length - 1))))
      || lower.includes(keyLower)
    ) {
      updates.name = value;
      if (CATEGORIES_MAP[value]) updates.category = CATEGORIES_MAP[value];
      break;
    }
  }

  // 2. Detect Organic & Pesticide Free
  for (const keyword of ORGANIC_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      updates.isOrganic = true;
      break;
    }
  }
  if (/(pesticide free|chemical free|no chemical|no pesticide|no spray|పురుగుమందులు లేని|రసాయన రహిత|कीटनाशक मुक्त|ಕೀಟನಾಶಕ ಮುಕ್ತ|பூச்சிக்கொல்லி அற்ற)/i.test(lower)) {
    updates.isPesticideFree = true;
  }

  // 3. Extract Numbers & Map with Proximity Analysis
  const tokens = lower.split(/[\s,]+/);
  const foundNumbers = [];

  tokens.forEach((token, index) => {
    const digitMatch = token.match(/\d+/);
    if (digitMatch) {
      foundNumbers.push({ val: parseInt(digitMatch[0]), index });
    } else if (NUMBERS_MAP[token] !== undefined) {
      foundNumbers.push({ val: NUMBERS_MAP[token], index });
    }
  });

  // Assign numbers to fields based on proximity keywords
  // We compute minimum distance to a unit vs a price indicator for each number
  foundNumbers.forEach(({ val, index }) => {
    let minQtyDist = Infinity;
    let minPriceDist = Infinity;
    let foundUnit = null;

    tokens.forEach((t, i) => {
      const dist = Math.abs(index - i);
      if (dist > 4) return; // Only look within radius of 4

      // Check if this token is a unit
      for (const [unitKey, unitAliases] of Object.entries(UNITS_MAP)) {
        if (unitAliases.some(alias => t.includes(alias.toLowerCase()))) {
          if (dist < minQtyDist) {
            minQtyDist = dist;
            foundUnit = unitKey;
          }
        }
      }

      // Check if this token is a price indicator
      if (PRICE_INDICATORS.some(ind => t.includes(ind.toLowerCase()))) {
        if (dist < minPriceDist) {
          minPriceDist = dist;
        }
      }
    });

    if (minQtyDist < Infinity || minPriceDist < Infinity) {
      if (minQtyDist <= minPriceDist) {
        updates.quantity = val;
        updates.unit = foundUnit;
      } else {
        updates.price = val;
      }
    } else {
      // Fallback
      if (updates.quantity === undefined) {
        updates.quantity = val;
      } else if (updates.price === undefined) {
        updates.price = val;
      }
    }
  });

  // 4. Extract Location if any
  // e.g. "from hyderabad", "హైదరాబాద్ నుండి", "हैदराबाद से", "ಹೈದರಾಬಾದ್‌ನಿಂದ", "ஹைதராபாத்தில் இருந்து"
  // Look for location indicator words and extract the next capitalized/meaningful word
  const locationPrepositions = ["from", "in", "at", "నుండి", "నుంచి", "से", "ನಲ್ಲಿ", "ಇಂದ", "இருந்து", "இல்"];
  for (const prep of locationPrepositions) {
    const prepIndex = tokens.indexOf(prep.toLowerCase());
    if (prepIndex !== -1) {
      // Look at surrounding words
      let locWord = "";
      if (["నుండి", "నుంచి", "से", "ನಲ್ಲಿ", "ಇಂದ", "இருந்து", "இல்"].includes(prep)) {
        // Indian languages are usually SOV/prepositional, location word comes BEFORE the preposition
        if (prepIndex > 0) locWord = tokens[prepIndex - 1];
      } else {
        // English preposition comes BEFORE the location word
        if (prepIndex < tokens.length - 1) locWord = tokens[prepIndex + 1];
      }
      
      // Clean and set location if it is not a crop, category or number word
      if (locWord && locWord.length > 2 && !CROPS_MAP[locWord] && NUMBERS_MAP[locWord] === undefined) {
        updates.farmLocation = locWord.charAt(0).toUpperCase() + locWord.slice(1);
        updates.location = updates.farmLocation;
      }
    }
  }

  // 5. Attach APMC Benchmark info
  if (updates.name && CROP_BENCHMARKS[updates.name]) {
    updates.benchmark = CROP_BENCHMARKS[updates.name];
    if (!updates.price && updates.benchmark) {
      updates.suggestedPrice = updates.benchmark.avg;
    }
  }

  return updates;
  return updates;
}

import { BASE_URL } from "../api/api";

let activeAudioNodes = new Set();
let currentTTSResolver = null;

export function stopTTS() {
  activeAudioNodes.forEach(node => {
    try {
      if (node.stop) node.stop();
      if (node.pause) {
        node.pause();
        node.currentTime = 0;
      }
    } catch(e) {}
  });
  activeAudioNodes.clear();

  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (currentTTSResolver) {
    currentTTSResolver();
    currentTTSResolver = null;
  }
}

export function isTTSPlaying() {
  return activeAudioNodes.size > 0;
}

let globalAudioCtx = null;

const fallbackSpeechSynthesis = (text, langCode, options = {}) => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) return resolve(false);
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const localeMap = { en: "en-IN", te: "te-IN", hi: "hi-IN", kn: "kn-IN", ta: "ta-IN", ml: "ml-IN", mr: "mr-IN", gu: "gu-IN", bn: "bn-IN", pa: "pa-IN", or: "or-IN", ur: "ur-IN" };
      const targetLang = localeMap[langCode] || "en-IN";
      utterance.lang = targetLang;
      
      // Advanced voice selection to prioritize high-quality native/Google voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        let bestVoice = voices.find(v => (v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0])) && v.name.toLowerCase().includes('google'));
        if (!bestVoice) bestVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.rate = options.rate || 0.95;
      if (options.pitch) utterance.pitch = options.pitch;
      if (options.volume !== undefined) utterance.volume = Math.max(0.1, Math.min(1.0, options.volume));
      
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      window.speechSynthesis.speak(utterance);
      
      // Dynamic safety timeout
      setTimeout(() => resolve(true), Math.max(4000, text.length * 80));
    } catch(err) {
      resolve(false);
    }
  });
};

export function playTTS(text, lang = "en", options = {}) {
  return new Promise(async (resolve) => {
    if (!text) return resolve(false);

    const gttsLang = lang && lang.length > 0 ? lang.split("-")[0] : "en";
    
    let resolved = false;
    const safeResolve = (val) => {
      if (!resolved) {
        resolved = true;
        if (currentTTSResolver) {
          currentTTSResolver = null;
        }
        resolve(val);
      }
    };
    currentTTSResolver = safeResolve;

    // Generous dynamic safety timeout based on spoken sentence length (minimum 10s)
    const timeoutMs = Math.max(10000, text.length * 85);
    const safetyTimer = setTimeout(() => safeResolve(true), timeoutMs);
    
    try {
      const res = await fetch(`${BASE_URL}/api/ai/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: gttsLang })
      });
      
      const data = await res.json();
      if (!data.audioContent) {
        clearTimeout(safetyTimer);
        await fallbackSpeechSynthesis(text, gttsLang, options);
        return safeResolve(true);
      }
      
      // Preferred HTML5 Audio object playback (universal cross-browser & mobile support)
      try {
        const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        
        if (options.rate) audio.playbackRate = options.rate;
        if (options.volume !== undefined) audio.volume = Math.max(0.1, Math.min(1.0, options.volume));

        const audioNode = {
          stop: () => {
            try { audio.pause(); audio.currentTime = 0; } catch(e) {}
          },
          pause: () => {
            try { audio.pause(); } catch(e) {}
          }
        };

        // Stop previous speech audio
        if (!options.overlap) {
          stopTTS();
        }

        activeAudioNodes.add(audioNode);

        audio.onended = () => {
          clearTimeout(safetyTimer);
          activeAudioNodes.delete(audioNode);
          safeResolve(true);
        };

        audio.onerror = async (err) => {
          console.warn("[TTS] HTML5 Audio error, using fallback:", err);
          clearTimeout(safetyTimer);
          activeAudioNodes.delete(audioNode);
          await fallbackSpeechSynthesis(text, gttsLang, options);
          safeResolve(true);
        };

        await audio.play();
      } catch (audioPlayErr) {
        console.warn("[TTS] Direct play failed, falling back to Web Audio or SpeechSynth:", audioPlayErr);
        clearTimeout(safetyTimer);
        await fallbackSpeechSynthesis(text, gttsLang, options);
        safeResolve(true);
      }
      
    } catch (err) {
      console.warn("[TTS] Server fetch error, using speech synthesis fallback:", err);
      clearTimeout(safetyTimer);
      await fallbackSpeechSynthesis(text, gttsLang, options);
      safeResolve(true);
    }
  });
}

// Conversational prompts for the Advanced Guided Voice Assistant
export const VOICE_PROMPTS = {
  en: {
    start: "Welcome to the advanced assistant. Let's get your product listed quickly. What crop do you want to sell today?",
    askCategory: "Excellent choice! What category does this crop fall under? For example: vegetable, fruit, or grain.",
    askQuantity: "Got it. How many kilograms are available for sale right now?",
    askPrice: "Perfect. What is the expected price per kilogram in rupees?",
    askDescription: "Please provide a short, appealing description for the buyers.",
    askOrganic: "Is the crop 100% organic? Please say yes or no.",
    askPesticideFree: "Is it completely pesticide-free? Please say yes or no.",
    askFarmTourUrl: "If you have a farm tour video URL, please say it now, or simply say skip to proceed.",
    confirm: "Great job! I have carefully filled the entire form based on your inputs. Please review the details on the screen and click Next when ready.",
  },
  te: {
    start: "స్వాగతం. మీరు ఏ పంటను అమ్మాలనుకుంటున్నారు?",
    askCategory: "ఇది ఏ వర్గానికి చెందుతుంది? ఉదాహరణకు కూరగాయలు, పండ్లు లేదా ధాన్యాలు.",
    askQuantity: "అర్థమైంది. ఎన్ని కిలోలు అమ్మాలనుకుంటున్నారు?",
    askPrice: "సరే. ఒక కిలో ధర ఎంత?",
    askDescription: "దయచేసి పంట గురించి చిన్న వివరణ ఇవ్వండి.",
    askOrganic: "ఇది సేంద్రీయ పంటనా? అవును లేదా కాదు అని చెప్పండి.",
    askPesticideFree: "ఇది పురుగుమందులు లేనిదా? అవును లేదా కాదు అని చెప్పండి.",
    askFarmTourUrl: "మీకు ఫామ్ టూర్ వీడియో ఉంటే చెప్పండి, లేదా స్కిప్ అనండి.",
    confirm: "చాలా బాగుంది. ఫారమ్ నింపాను. దయచేసి సమర్పించండి.",
  },
  hi: {
    start: "नमस्ते। आप कौन सी फसल बेचना चाहते हैं?",
    askCategory: "यह किस श्रेणी का है?",
    askQuantity: "समझ गया। कितने किलोग्राम बेचना है?",
    askPrice: "ठीक है। प्रति किलोग्राम कीमत क्या है?",
    askDescription: "कृपया फसल का विवरण दें।",
    askOrganic: "क्या यह जैविक है? हाँ या ना कहें।",
    askPesticideFree: "क्या यह कीटनाशक मुक्त है? हाँ या ना कहें।",
    askFarmTourUrl: "वीडियो लिंक है तो बोलें, या स्किप कहें।",
    confirm: "बहुत बढ़िया। फॉर्म भर दिया गया है। कृपया सबमिट करें।",
  },
  kn: {
    start: "ಸ್ವಾಗತ. ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
    askCategory: "ಇದು ಯಾವ ವರ್ಗ?",
    askQuantity: "ಅರ್ಥವಾಯಿತು. ಎಷ್ಟು ಕಿಲೋಗ್ರಾಂ ಪ್ರಮಾಣ?",
    askPrice: "ಸರಿ. ಒಂದು ಕಿಲೋಗ್ರಾಂ ಬೆಲೆ ಎಷ್ಟು?",
    askDescription: "ವಿವರಣೆ ನೀಡಿ.",
    askOrganic: "ಇದು ಸಾವಯವವೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
    askPesticideFree: "ಇದು ಕೀಟನಾಶಕ ಮುಕ್ತವೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
    askFarmTourUrl: "ವಿಡಿಯೋ ಲಿಂಕ್ ಇದ್ದರೆ ಹೇಳಿ, ಅಥವಾ ಸ್ಕಿಪ್ ಎಂದು ಹೇಳಿ.",
    confirm: "ಉತ್ತಮ. ಫಾರ್ಮ್ ಭರ್ತಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಸಲ್ಲಿಸಿ.",
  },
  ta: {
    start: "வரவேற்கிறோம். நீங்கள் என்ன பயிரை விற்க விரும்புகிறீர்கள்?",
    askCategory: "இது எந்த வகை?",
    askQuantity: "புரிந்தது. எத்தனை கிலோகிராம் அளவு?",
    askPrice: "சரி. ஒரு கிலோவுக்கு என்ன விலை?",
    askDescription: "விளக்கம் அளிக்கவும்.",
    askOrganic: "இது இயற்கையானதா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.",
    askPesticideFree: "இது பூச்சிக்கொல்லி அற்றதா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.",
    askFarmTourUrl: "வீடியோ இணைப்பு இருந்தால் சொல்லுங்கள், அல்லது ஸ்கிப் என்று சொல்லுங்கள்.",
    confirm: "மிக நன்று. படிவம் நிரப்பப்பட்டுள்ளது. தயவுசெய்து சமர்ப்பிக்கவும்.",
  }
};
