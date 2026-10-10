"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, CheckCircle, PackagePlus, Mic, MicOff, PlayCircle, 
  Loader2, Volume2, RotateCcw, ArrowRight, Check, AlertCircle,
  MapPin, LocateFixed, Compass, X, Calendar, Bell, ShieldCheck, Camera
} from 'lucide-react';
import CropVisualPicker from '../../components/CropVisualPicker';
import API, { BASE_URL } from '../../api/api';
import LocationUpdateModal from '../../components/LocationUpdateModal';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { 
  playTTS, stopTTS, unlockAudio, parseVoiceToFormMultilingual, 
  CROPS_MAP, CATEGORIES_MAP, UNITS_MAP, parseSpokenNumber, matchesUnitToken 
} from '../../utils/voiceParser';
import { useVoiceInput, LANG_MAP } from '../../utils/useVoiceInput';

// Gentle audio chimes synthesized directly with Web Audio API
const playChime = (type = 'start') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'start') {
      // Pleasant rising tone (listening indicator)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'success') {
      // Confirmation chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'retry') {
      // Gentle double-tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392, ctx.currentTime); // G4
      osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.1); // E4
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {}
};

const STEP_CHIPS = {
  NAME: [
    { label: "🍅 Tomato", val: "Tomato" },
    { label: "🥔 Potato", val: "Potato" },
    { label: "🧅 Onion", val: "Onion" },
    { label: "🍚 Rice", val: "Rice" },
    { label: "🌾 Wheat", val: "Wheat" },
    { label: "🥭 Mango", val: "Mango" }
  ],
  QUANTITY: [
    { label: "50 kg", val: "50 kg" },
    { label: "100 kg", val: "100 kg" },
    { label: "1 quintal", val: "1 quintal" },
    { label: "5 bags", val: "5 bags" },
    { label: "10 tonnes", val: "10 tonnes" }
  ],
  PRICE: [
    { label: "₹30", val: "30 rupees" },
    { label: "₹40", val: "40 rupees" },
    { label: "₹50", val: "50 rupees" },
    { label: "₹100", val: "100 rupees" },
    { label: "Market Price", val: "market price" }
  ],
  CONFIRM_SUBMIT: [
    { label: "✅ Yes, Submit", val: "yes" },
    { label: "❌ No, wait", val: "no" }
  ]
};

export default function AddCrop() {
  const { user } = useAuth();
  const { lang, changeLang, t } = useLang();
  
  const [wizardLang, setWizardLang] = useState(lang || 'te');
  const wizardLangRef = useRef(lang || 'te');

  useEffect(() => {
    if (lang) {
      setWizardLang(lang);
      wizardLangRef.current = lang;
    }
  }, [lang]);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'vegetable',
    price: '',
    quantity: '',
    unit: 'kg',
    description: '',
    isOrganic: false,
    location: user?.location || '',
    farmLocation: user?.farmName || user?.location || '',
    latitude: user?.latitude || '',
    longitude: user?.longitude || '',
    growingStage: 'harvested',
    notifyAdmin: false,
    allowPrebooking: false,
    expectedHarvestDate: ''
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locDetecting, setLocDetecting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        location: prev.location || user.location || '',
        farmLocation: prev.farmLocation || user.farmName || user.location || '',
        latitude: prev.latitude || user.latitude || '',
        longitude: prev.longitude || user.longitude || ''
      }));
    }
  }, [user]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let addr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();
          addr = data.display_name?.split(",").slice(0, 4).join(",") || addr;
        } catch {}
        setFormData(prev => ({
          ...prev,
          location: addr,
          farmLocation: addr,
          latitude,
          longitude
        }));
        setLocDetecting(false);
      },
      (err) => {
        setLocDetecting(false);
        alert("Could not detect GPS location. Please pinpoint on map or enter address.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Organic Verification States
  const [organicVerificationType, setOrganicVerificationType] = useState('5-step'); // 'official' | '5-step'
  const [certificationDocument, setCertificationDocument] = useState('');
  const [organicSteps, setOrganicSteps] = useState({
    step1_soil_bio: { photoUrl: "" },
    step2_natural_seed: { photoUrl: "" },
    step3_corn_border_catch_crop: { photoUrl: "" },
    step4_botanical_spray: { photoUrl: "" },
    step5_clean_harvest: { photoUrl: "" }
  });

  // Wizard States
  const [wizardStep, setWizardStep] = useState('IDLE'); // 'IDLE' | 'NAME' | 'QUANTITY' | 'PRICE' | 'CONFIRM_SUBMIT' | 'COMPLETED' | 'SINGLE_PROMPT'
  const [assistantMode, setAssistantMode] = useState('step'); // 'step' | 'single'
  const [wizardMsg, setWizardMsg] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interim, setInterim] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [filledFields, setFilledFields] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const [manualWizardText, setManualWizardText] = useState("");

  const STEP_CHIPS = {
    SINGLE_PROMPT: [
      { label: "🍅 50kg Tomato at ₹40", val: "50kg Tomato at 40 rupees" },
      { label: "🍚 10 bags Rice at ₹2000", val: "10 bags of Rice at 2000 rupees" }
    ],
    NAME: [
      { label: "🍅 Tomato (టమోటా)", val: "Tomato" },
      { label: "🧅 Onion (ఉల్లిపాయ)", val: "Onion" },
      { label: "🥔 Potato (బంగాళదుంప)", val: "Potato" },
      { label: "🌾 Rice (వరి / బియ్యం)", val: "Rice" },
      { label: "🌶️ Chili (మిర్చి)", val: "Chili" },
      { label: "🥭 Mango (మామిడి)", val: "Mango" },
      { label: "🍌 Banana (అరటి)", val: "Banana" },
      { label: "🥕 Carrot (క్యారెట్)", val: "Carrot" },
      { label: "☁️ Cotton (పత్తి)", val: "Cotton" },
      { label: "🥜 Groundnut (పల్లీలు)", val: "Groundnut" },
      { label: "🌽 Maize (మొక్కజొన్న)", val: "Maize" },
      { label: "🍉 Watermelon (పుచ్చకాయ)", val: "Watermelon" },
      { label: "🍇 Grapes (ద్రాక్ష)", val: "Grapes" },
      { label: "🌿 Organic Waste (వ్యర్థాలు)", val: "Bio Waste" }
    ],
    QUANTITY: [
      { label: "10 kg", val: "10 kg" },
      { label: "25 kg", val: "25 kg" },
      { label: "50 kg", val: "50 kg" },
      { label: "100 kg", val: "100 kg" },
      { label: "500 kg", val: "500 kg" },
      { label: "1 Quintal (100kg)", val: "1 quintal" },
      { label: "5 Quintals", val: "5 quintal" },
      { label: "10 Quintals", val: "10 quintal" },
      { label: "5 Bags", val: "5 bags" },
      { label: "10 Bags", val: "10 bags" },
      { label: "1 Tonne", val: "1 tonne" }
    ],
    PRICE: [
      { label: "₹20 /kg", val: "20" },
      { label: "₹30 /kg", val: "30" },
      { label: "₹40 /kg", val: "40" },
      { label: "₹50 /kg", val: "50" },
      { label: "₹60 /kg", val: "60" },
      { label: "₹80 /kg", val: "80" },
      { label: "₹100 /kg", val: "100" },
      { label: "₹150 /kg", val: "150" },
      { label: "₹2,500 /quintal", val: "2500" }
    ],
    CONFIRM_SUBMIT: [
      { label: "✅ Yes, Submit (అవును / हाँ)", val: "yes" },
      { label: "📝 Review Details (సమీక్షించండి)", val: "review" },
      { label: "🔄 Start Over (మళ్లీ ప్రారంభించు)", val: "no" }
    ]
  };

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const initialSilenceTimerRef = useRef(null);
  const wizardStepRef = useRef('IDLE');
  const formDataRef = useRef(formData);
  const capturedTextRef = useRef("");
  const hasUserSpokenRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isExplicitlyStoppedRef = useRef(false);
  const silenceRestartCountRef = useRef(0);
  const consecutiveRestartsRef = useRef(0);
  const lastRestartTimeRef = useRef(0);
  const listenSessionRef = useRef(0);

  useEffect(() => {
    wizardStepRef.current = wizardStep;
  }, [wizardStep]);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTTS();
      stopRecognition();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Direct Per-Field Speech Recognition (Low-literacy one-tap voice fill)
  const { 
    listening: fieldListening, 
    activeField: activeVoiceField, 
    interim: fieldInterim, 
    startListening: startFieldListening, 
    stopListening: stopFieldListening 
  } = useVoiceInput(lang);

  const speakField = (field) => {
    if (fieldListening && activeVoiceField === field) {
      stopFieldListening(true);
      return;
    }
    // Stop guided wizard if running
    if (wizardStep !== 'IDLE') stopWizard();

    startFieldListening((transcript) => {
      if (!transcript) return;
      const lower = transcript.toLowerCase().trim();

      if (field === "name") {
        let extractedName = "";
        let extractedCat = "";
        for (const [slang, stdName] of Object.entries(CROPS_MAP)) {
          const sLower = slang.toLowerCase();
          if (lower.includes(sLower) || lower.split(/\s+/).includes(sLower)) {
            extractedName = stdName;
            extractedCat = CATEGORIES_MAP[stdName] || "vegetable";
            break;
          }
        }
        if (!extractedName && transcript.length > 1) {
          extractedName = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        }
        if (extractedName) {
          playChime('success');
          setFormData(prev => ({
            ...prev,
            name: extractedName,
            category: extractedCat || prev.category
          }));
          formDataRef.current.name = extractedName;
          setFilledFields(prev => ({ ...prev, name: true }));
        }
      } else if (field === "quantity") {
        let qty = null;
        let unit = formData.unit || "kg";
        const numMatch = transcript.match(/\d+(?:\.\d+)?/);
        if (numMatch) {
          qty = parseFloat(numMatch[0]);
        } else {
          const spoken = parseSpokenNumber(transcript);
          if (spoken && !isNaN(spoken)) qty = parseFloat(spoken);
        }
        for (const [unitKey, aliases] of Object.entries(UNITS_MAP)) {
          if (aliases.some(a => lower.includes(a.toLowerCase()))) {
            unit = unitKey === 'ton' ? 'tonne' : unitKey;
            break;
          }
        }
        if (qty !== null && !isNaN(qty)) {
          playChime('success');
          setFormData(prev => ({ ...prev, quantity: qty, unit }));
          formDataRef.current.quantity = qty;
          setFilledFields(prev => ({ ...prev, quantity: true, unit: true }));
        }
      } else if (field === "price") {
        let price = null;
        const numMatch = transcript.match(/\d+(?:\.\d+)?/);
        if (numMatch) {
          price = parseFloat(numMatch[0]);
        } else {
          const spoken = parseSpokenNumber(transcript);
          if (spoken && !isNaN(spoken)) price = parseFloat(spoken);
        }
        if (price !== null && !isNaN(price)) {
          playChime('success');
          setFormData(prev => ({ ...prev, price }));
          formDataRef.current.price = price;
          setFilledFields(prev => ({ ...prev, price: true }));
        }
      } else if (field === "description") {
        setFormData(prev => ({ ...prev, description: transcript }));
        formDataRef.current.description = transcript;
        setFilledFields(prev => ({ ...prev, description: true }));
        playChime('success');
      } else if (field === "farmLocation" || field === "location") {
        setFormData(prev => ({ ...prev, farmLocation: transcript, location: transcript }));
        formDataRef.current.farmLocation = transcript;
        formDataRef.current.location = transcript;
        setFilledFields(prev => ({ ...prev, farmLocation: true, location: true }));
        playChime('success');
      }
    }, { fieldId: field });
  };

  // Safe Speech Recognition Cleanup
  const stopRecognition = (explicit = false) => {
    if (explicit) {
      isExplicitlyStoppedRef.current = true;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (initialSilenceTimerRef.current) {
      clearTimeout(initialSilenceTimerRef.current);
      initialSilenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Multilingual Affirmative (Yes) and Negative (No) Detection
  const isAffirmative = (text) => {
    if (!text) return false;
    const clean = text.toLowerCase().trim();
    const yesTokens = [
      "yes", "yeah", "yep", "sure", "ok", "okay", "submit", "list", "confirm", "done", "save", "proceed",
      "correct", "right", "publish", "post", "fine", "good", "all good",
      "అవును", "సరే", "హా", "అవునండి", "చేయండి", "సమర్పించు", "లిస్ట్ చేయండి", "అవ్వను", "ఓకే", "సరిగ్గా ఉంది", "సమర్పించండి", "లిస్ట్ చేయి", "బాగుంది", "కన్ఫర్మ్", "పంపు", "అవును చేయండి",
      "avunu", "sare", "ha", "avunandi", "cheyandi", "list cheyandi", "sarigga undi",
      "हाँ", "हां", "हाँजी", "जी", "हांजी", "ठीक", "ठीक है", "जमा करें", "सहेजें", "कर दो", "लिस्ट करो", "सही है", "कर दीजिए", "सबमिट",
      "haan", "haanji", "theek", "theek hai", "sahi", "ji haan",
      "ஆம்", "ஆமாம்", "சரி", "சமர்ப்பி", "செய்", "சரிதான்",
      "aam", "aamaam", "sari",
      "ಹೌದು", "ಸರಿ", "ಸಲ್ಲಿಸು", "ಮಾಡು", "ಸರಿ ಇದೆ",
      "haudu", "sari", "houdu"
    ];
    return yesTokens.some(tok => {
      if (clean === tok) return true;
      if (clean.includes(tok)) {
        const words = clean.split(/[\s,!?.]+/);
        return words.includes(tok) || clean.startsWith(tok + " ") || clean.endsWith(" " + tok) || clean.includes(" " + tok + " ");
      }
      return false;
    });
  };

  const isNegative = (text) => {
    if (!text) return false;
    const clean = text.toLowerCase().trim();
    const noTokens = [
      "no", "nope", "cancel", "stop", "restart", "start over", "reset", "clear", "don't", "dont", "wait", "change", "edit",
      "కాదు", "వద్దు", "వద్దండి", "రద్దు", "ఆపు", "మళ్లీ", "మళ్ళీ", "కాదండి", "మార్చు", "ఆగండి",
      "kadu", "vaddu", "vaddhu", "raddu", "malli", "aapu",
      "नहीं", "ना", "मत", "रद्द", "बंद", "फिर से", "रोको", "रुको", "बदलो",
      "nahi", "nahin", "na", "mat", "radd", "fir se", "roko",
      "இல்லை", "வேண்டாம்", "ரத்து", "நிறுத்து",
      "illai", "vendaam", "niruthu",
      "ಇಲ್ಲ", "ಬೇಡ", "ರದ್ದು", "ನಿಲ್ಲಿಸು", "ಮತ್ತೆ",
      "illa", "beda", "raddu"
    ];
    return noTokens.some(tok => {
      if (clean === tok) return true;
      if (clean.includes(tok)) {
        const words = clean.split(/[\s,!?.]+/);
        return words.includes(tok) || clean.startsWith(tok + " ") || clean.endsWith(" " + tok) || clean.includes(" " + tok + " ");
      }
      return false;
    });
  };

  // ─── Conversational Prompts & Acknowledgments in Indian Languages ───
  const getPromptForStep = (step, currentCrop = "", currentQty = "", currentUnit = "kg", targetLang = null) => {
    const activeLang = targetLang || wizardLangRef.current || lang || 'te';
    const unitInLang = {
      te: currentUnit === 'kg' ? 'కేజీ' : currentUnit === 'bag' ? 'బస్తా' : currentUnit === 'quintal' ? 'క్వింటాల్' : currentUnit,
      hi: currentUnit === 'kg' ? 'किलो' : currentUnit === 'bag' ? 'बोरी' : currentUnit === 'quintal' ? 'क्विंटल' : currentUnit,
      ta: currentUnit === 'kg' ? 'கிலோ' : currentUnit === 'bag' ? 'மூட்டை' : currentUnit,
      kn: currentUnit === 'kg' ? 'ಕೆಜಿ' : currentUnit === 'bag' ? 'ಮೂಟೆ' : currentUnit,
      en: currentUnit
    };

    const prompts = {
      SINGLE_PROMPT: {
        en: "Please tell me what you want to sell, how much you have, and the price, all in one sentence.",
        te: "మీరు ఏమి అమ్మాలనుకుంటున్నారు, ఎంత పరిమాణం ఉంది, మరియు ధర ఎంత, ఇవన్నీ ఒకే వాక్యంలో చెప్పండి.",
        hi: "कृपया मुझे एक ही वाक्य में बताएं कि आप क्या बेचना चाहते हैं, कितनी मात्रा है और क्या कीमत है।",
        ta: "நீங்கள் என்ன விற்க விரும்புகிறீர்கள், எவ்வளவு இருக்கிறது, விலை என்ன என்பதை ஒரே வாக்கியத்தில் சொல்லுங்கள்.",
        kn: "ನೀವು ಏನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ, ಎಷ್ಟು ಇದೆ ಮತ್ತು ಬೆಲೆ ಎಷ್ಟು ಎಂಬುದನ್ನು ಒಂದೇ ವಾಕ್ಯದಲ್ಲಿ ಹೇಳಿ."
      },
      NAME: {
        en: "What crop or produce do you want to sell? You can tell me the crop name, quantity, and price together, or one by one.",
        te: "మీరు ఏ పంటను అమ్మాలనుకుంటున్నారు? పంట పేరు, పరిమాణం, ధర అన్నీ కలిపి చెప్పవచ్చు లేదా ఒక్కొక్కటిగా చెప్పవచ్చు.",
        hi: "आप कौन सी फसल या उत्पाद बेचना चाहते हैं? आप फसल का नाम, मात्रा और कीमत एक साथ या अलग-अलग बता सकते हैं।",
        ta: "நீங்கள் என்ன பயிரை விற்க விரும்புகிறீர்கள்? பயிர் பெயர், அளவு, விலை ஆகியவற்றை ஒன்றாகவோ அல்லது ஒவ்வொன்றாகவோ சொல்லலாம்.",
        kn: "ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ಬೆಳೆಯ ಹೆಸರು, ಪ್ರಮಾಣ ಮತ್ತು ಬೆಲೆಯನ್ನು ಒಟ್ಟಿಗೆ ಅಥವಾ ಒಂದೊಂದಾಗಿ ಹೇಳಬಹುದು."
      },
      QUANTITY: {
        en: `How much quantity of ${currentCrop || 'produce'} do you have? For example, 50 kg or 10 bags.`,
        te: `మీ వద్ద ఎంత పరిమాణంలో ${currentCrop || 'పంట'} ఉంది? ఉదాహరణకు 50 కేజీలు లేదా 10 బస్తాలు.`,
        hi: `आपके पास ${currentCrop || 'फसल'} की कितनी मात्रा है? जैसे 50 किलो या 10 बोरी।`,
        ta: `உங்களிடம் எவ்வளவு அளவு ${currentCrop || 'பயிர்'} உள்ளது? உதாரணத்திற்கு 50 கிலோ அல்லது 10 மூட்டை.`,
        kn: `ನಿಮ್ಮ ಬಳಿ ಎಷ್ಟು ಪ್ರಮಾಣದ ${currentCrop || 'ಬೆಳೆ'} ಇದೆ? ಉದಾಹರಣೆಗೆ 50 ಕೆಜಿ.`
      },
      PRICE: {
        en: `What is your selling price per ${currentUnit} in rupees? For example, 40 rupees.`,
        te: `ఒక ${unitInLang.te} అమ్మకపు ధర ఎన్ని రూపాయలు? ఉదాహరణకు 40 రూపాయలు.`,
        hi: `प्रति ${unitInLang.hi} आपकी बिक्री कीमत कितने रुपये है? जैसे 40 रुपये।`,
        ta: `ஒரு ${unitInLang.ta} விற்பனை விலை எத்தனை ரூபாய்? உதாரணத்திற்கு 40 ரூபாய்.`,
        kn: `ಪ್ರತಿ ${unitInLang.kn} ಗೆ ನಿಮ್ಮ ಮಾರಾಟದ ಬೆಲೆ ಎಷ್ಟು ರೂಪಾಯಿ? ಉದಾಹರಣೆಗೆ 40 ರೂಪಾಯಿ.`
      },
      CONFIRM_SUBMIT: {
        en: "Would you like me to submit this crop now? Say Yes to submit, or No to start over.",
        te: "ఈ పంట వివరాలను ఇప్పుడు సమర్పించమంటారా? సమర్పించడానికి అవును అని, మళ్లీ ప్రారంభించడానికి కాదు అని చెప్పండి.",
        hi: "क्या आप इस फसल को अभी सबमिट करना चाहते हैं? सबमिट के लिए हाँ कहें, या फिर से शुरू करने के लिए ना कहें।",
        ta: "இந்த பயிர் விவரங்களை இப்போது சமர்ப்பிக்கலாமா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.",
        kn: "ಈ ಬೆಳೆಯ ವಿವರಗಳನ್ನು ಈಗ ಸಲ್ಲಿಸಬೇಕೇ? ಸಲ್ಲಿಸಲು ಹೌದು ಅಥವಾ ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಲು ಇಲ್ಲ ಎಂದು ಹೇಳಿ."
      },
      COMPLETED: {
        en: "All details filled! Review your listing and submit the form.",
        te: "అన్ని వివరాలు నమోదయ్యాయి! ఒకసారి చూసుకుని సబ్మిట్ చేయండి.",
        hi: "सभी विवरण भर दिए गए हैं! फॉर्म की समीक्षा करें और सबमिट करें।",
        ta: "எல்லா விவரங்களும் நிரப்பப்பட்டுள்ளன! சரிபார்த்து சமர்ப்பிக்கவும்.",
        kn: "ಎಲ್ಲಾ ವಿವರಗಳು ಭರ್ತಿಯಾಗಿವೆ! ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸಬ್ಮಿಟ್ ಮಾಡಿ."
      }
    };
    return prompts[step]?.[activeLang] || prompts[step]?.en || "";
  };

  const getSuccessAck = (step, val1 = "", val2 = "", targetLang = null) => {
    const activeLang = targetLang || wizardLangRef.current || lang || 'te';
    const acks = {
      NAME: {
        en: `Got it! Added ${val1}.`,
        te: `సరే! ${val1} అని తీసుకున్నాను.`,
        hi: `समझ गया! ${val1} जोड़ दिया गया।`,
        ta: `புரிந்தது! ${val1} சேர்க்கப்பட்டது.`,
        kn: `ಅರ್ಥವಾಯಿತು! ${val1} ಸೇರಿಸಲಾಗಿದೆ.`
      },
      QUANTITY: {
        en: `Understood! Added ${val1} ${val2}.`,
        te: `సరే! ${val1} ${val2} నమోదు చేశాను.`,
        hi: `बढ़िया! ${val1} ${val2} दर्ज किया।`,
        ta: `அருமை! ${val1} ${val2} சேர்க்கப்பட்டது.`,
        kn: `ಉತ್ತಮ! ${val1} ${val2} ಸೇರಿಸಲಾಗಿದೆ.`
      },
      PRICE: {
        en: `Perfect! Selling price set to ₹${val1} per ${val2}.`,
        te: `అద్భుతం! ఒక ${val2}కి ₹${val1}గా నిర్ణయించాను.`,
        hi: `शानदार! प्रति ${val2} कीमत ₹${val1} तय की गई।`,
        ta: `மிக நன்று! ஒரு ${val2}க்கு ₹${val1} என அமைக்கப்பட்டது.`,
        kn: `ಅದ್ಭುತ! ಪ್ರತಿ ${val2} ಗೆ ₹${val1} ಬೆಲೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.`
      }
    };
    return acks[step]?.[activeLang] || acks[step]?.en || "";
  };

  const getUnrecognizedAck = (step, heard, targetLang = null) => {
    const activeLang = targetLang || wizardLangRef.current || lang || 'te';
    const unrecAcks = {
      SINGLE_PROMPT: {
        en: `I heard "${heard}", but couldn't catch all the details. Let's go step by step. What crop is this?`,
        te: `మీరు చెప్పిన "${heard}" లో వివరాలన్నీ సరిగ్గా అర్థం కాలేదు. ఒక్కొక్కటిగా చూద్దాం. పంట పేరు ఏమిటి?`,
        hi: `मुझे "${heard}" सुनाई दिया, लेकिन सभी विवरण समझ नहीं आए। चलिए एक-एक करके भरते हैं। फसल का नाम क्या है?`,
        ta: `"${heard}" என்று கேட்டது, ஆனால் எல்லா விவரங்களும் புரியவில்லை. ஒவ்வொன்றாகச் செல்வோம். இது என்ன பயிர்?`,
        kn: `"${heard}" ಕೇಳಿಸಿತು, ಆದರೆ ಎಲ್ಲಾ ವಿವರಗಳು ಅರ್ಥವಾಗಲಿಲ್ಲ. ಒಂದೊಂದಾಗಿ ಹೋಗೋಣ. ಬೆಳೆಯ ಹೆಸರು ಏನು?`
      },
      NAME: {
        en: `I heard "${heard}", but didn't catch the crop. Please speak a crop name like Tomato, Rice, or Onion.`,
        te: `మీరు చెప్పిన "${heard}" పంట పేరు అర్థంకాలేదు. దయచేసి టమోటా, వరి లేదా ఉల్లిపాయ లాంటి పంట పేరు చెప్పండి.`,
        hi: `मुझे "${heard}" सुनाई दिया, लेकिन फसल समझ नहीं आई। कृपया टमाटर या चावल जैसी फसल बोलें।`,
        ta: `"${heard}" என்று கேட்டது, ஆனால் பயிர் புரியவில்லை. தயவுசெய்து தக்காளி போன்ற பயிர் பெயரைச் சொல்லுங்கள்.`,
        kn: `"${heard}" ಕೇಳಿಸಿತು, ಆದರೆ ಬೆಳೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೆಳೆಯ ಹೆಸರನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.`
      },
      QUANTITY: {
        en: `I heard "${heard}". Please speak a quantity number, like 50 kg or 10 bags.`,
        te: `మీరు చెప్పిన "${heard}" పరిమాణం అర్థం కాలేదు. దయచేసి 50 కేజీలు లేదా 10 బస్తాలు అని చెప్పండి.`,
        hi: `कृपया मात्रा का नंबर स्पष्ट बोलें, जैसे 50 किलो या 10 बोरी।`,
        ta: `தயவுசெய்து அளவை தெளிவாகச் சொல்லுங்கள், உதாரணத்திற்கு 50 கிலோ.`,
        kn: `ದಯವಿಟ್ಟು ಪ್ರಮಾಣವನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ, ಉದಾಹರಣೆಗೆ 50 ಕೆಜಿ.`
      },
      PRICE: {
        en: `I heard "${heard}". Please speak the price in rupees, like 40 or 50 rupees.`,
        te: `మీరు చెప్పిన "${heard}" ధర అర్థం కాలేదు. దయచేసి 40 రూపాయలు లేదా 30 రూపాయలు అని చెప్పండి.`,
        hi: `कृपया कीमत का नंबर बोलें, जैसे 40 रुपये।`,
        ta: `தயவுசெய்து விலையைச் சொல்லுங்கள், உதாரணத்திற்கு 40 ரூபாய்.`,
        kn: `ದಯವಿಟ್ಟು ಬೆಲೆಯನ್ನು ರೂಪಾಯಿಗಳಲ್ಲಿ ಹೇಳಿ, ಉದಾಹರಣೆಗೆ 40 ರೂಪಾಯಿ.`
      },
      CONFIRM_SUBMIT: {
        en: `I heard "${heard}". Please just say Yes to submit or No to cancel.`,
        te: `దయచేసి సమర్పించడానికి అవును లేదా రద్దు చేయడానికి కాదు అని చెప్పండి.`,
        hi: `कृपया केवल सबमिट के लिए हाँ या रद्द के लिए ना कहें।`,
        ta: `தயவுசெய்து ஆம் அல்லது இல்லை என்று மட்டுமே சொல்லுங்கள்.`,
        kn: `ದಯವಿಟ್ಟು ಸಲ್ಲಿಸಲು ಹೌದು அல்லது ರದ್ದು ಮಾಡಲು ಇಲ್ಲ ಎಂದು ಹೇಳಿ.`
      }
    };
    return unrecAcks[step]?.[activeLang] || unrecAcks[step]?.en || "";
  };

  // ─── Step Transition: Speak Prompt & Open Mic ───
  const askStep = async (step, customPrefix = "", overrideLang = null) => {
    // Immediately kill any running recognition and TTS
    listenSessionRef.current++; // Invalidate any stale session callbacks
    stopRecognition(true);
    stopTTS();

    setWizardStep(step);
    wizardStepRef.current = step;
    setInterim("");
    setIsProcessing(false);
    isProcessingRef.current = false;
    silenceRestartCountRef.current = 0;

    const currentLang = overrideLang || wizardLangRef.current || lang || 'te';

    let promptText = getPromptForStep(
      step, 
      formDataRef.current.name, 
      formDataRef.current.quantity, 
      formDataRef.current.unit,
      currentLang
    );

    if (customPrefix) {
      promptText = customPrefix + " " + promptText;
    }

    setWizardMsg(promptText);
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    // Speak prompt aloud in selected language
    try {
      await playTTS(promptText, currentLang);
    } catch (e) {
      console.warn("TTS playback warning:", e);
    }

    setIsSpeaking(false);
    isSpeakingRef.current = false;

    // After TTS finishes, start listening for farmer's response
    if (step !== 'COMPLETED' && wizardStepRef.current === step) {
       playChime('start');
       // Small delay to let chime finish before opening mic
       await new Promise(r => setTimeout(r, 300));
       if (wizardStepRef.current === step) {
         startContinuousListening(currentLang);
       }
    }
  };

  // ─── Fallback: MediaRecorder STT for browsers/networks that block Web Speech API ───
  const startMediaRecorderListening = async (targetLang = null) => {
    if (recognitionRef.current) {
      try {
        if (recognitionRef.current.stop) recognitionRef.current.stop();
        if (recognitionRef.current.abort) recognitionRef.current.abort();
      } catch(e) {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (initialSilenceTimerRef.current) { clearTimeout(initialSilenceTimerRef.current); initialSilenceTimerRef.current = null; }

    const sessionId = ++listenSessionRef.current;
    const isStaleSession = () => listenSessionRef.current !== sessionId;
    const activeLang = targetLang || wizardLangRef.current || lang || "te";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (isStaleSession()) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      const mediaRecorder = new window.MediaRecorder(stream);
      recognitionRef.current = mediaRecorder;
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setIsListening(false);
        if (isStaleSession() || audioChunks.length === 0) return;

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formDataPayload = new FormData();
        formDataPayload.append("audio", audioBlob);
        formDataPayload.append("lang", activeLang);

        setInterim("Processing your voice... 🤖");
        try {
          const res = await fetch(`${BASE_URL}/api/ai/stt`, {
            method: "POST",
            body: formDataPayload
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.transcript && data.transcript.trim()) {
               if (!isProcessingRef.current && wizardStepRef.current !== "COMPLETED" && wizardStepRef.current !== "IDLE") {
                  processStepInput(wizardStepRef.current, data.transcript.trim());
               }
            } else {
               handleNoSpeechDetected(wizardStepRef.current, activeLang);
            }
          } else {
            handleNoSpeechDetected(wizardStepRef.current, activeLang);
          }
        } catch (e) {
          console.warn("STT upload fallback warning:", e);
          handleNoSpeechDetected(wizardStepRef.current, activeLang);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setInterim("Listening (Backup mic active)... Please speak now 🎙️");

      silenceTimerRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 7000);
    } catch(err) {
      console.warn("Could not start MediaRecorder STT:", err);
      setIsListening(false);
      setWizardMsg("Microphone could not be started. Please use buttons below to choose your details.");
    }
  };

  // ─── Start Continuous Listening for Farmer's Response ───
  const startContinuousListening = (targetLang = null) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch(e) {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (initialSilenceTimerRef.current) { clearTimeout(initialSilenceTimerRef.current); initialSilenceTimerRef.current = null; }

    const activeLang = targetLang || wizardLangRef.current || lang || "te";
    const sessionId = ++listenSessionRef.current;
    const isStaleSession = () => listenSessionRef.current !== sessionId;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setWizardMsg("Speech recognition is not supported in this browser. Please use Chrome or Edge, or tap the suggestion buttons below.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[activeLang] || "te-IN";
    recognition.maxAlternatives = 3;

    capturedTextRef.current = "";
    hasUserSpokenRef.current = false;
    let finalText = "";
    let alreadyProcessed = false;

    const processAndAdvance = (text) => {
      if (alreadyProcessed || isStaleSession()) return;
      alreadyProcessed = true;
      const clean = (text || "").replace(/^Listening[^\w]*/i, "").trim();
      if (!clean) return;

      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (initialSilenceTimerRef.current) { clearTimeout(initialSilenceTimerRef.current); initialSilenceTimerRef.current = null; }
      capturedTextRef.current = "";

      stopRecognition(true);

      if (!isProcessingRef.current && wizardStepRef.current !== "COMPLETED" && wizardStepRef.current !== "IDLE") {
        processStepInput(wizardStepRef.current, clean);
      }
    };

    recognition.onstart = () => {
      if (isStaleSession()) return;
      setIsListening(true);
      if (!isSpeakingRef.current) {
        setInterim("Listening... Please speak now 🎙️");
      }

      initialSilenceTimerRef.current = setTimeout(() => {
        if (isStaleSession()) return;
        if (!hasUserSpokenRef.current && !isSpeakingRef.current && wizardStepRef.current !== "COMPLETED" && wizardStepRef.current !== "IDLE") {
          handleNoSpeechDetected(wizardStepRef.current, activeLang);
        }
      }, 9000);
    };

    recognition.onresult = (event) => {
      if (isStaleSession() || isSpeakingRef.current) return;

      hasUserSpokenRef.current = true;
      if (initialSilenceTimerRef.current) {
        clearTimeout(initialSilenceTimerRef.current);
        initialSilenceTimerRef.current = null;
      }

      let interimText = "";
      finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript + " ";
        }
      }
      finalText = finalText.trim();
      interimText = interimText.trim();

      const displayText = (finalText + " " + interimText).trim();
      if (displayText) {
        capturedTextRef.current = displayText;
        setInterim(displayText);
      }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const textToProcess = (finalText || capturedTextRef.current || "").trim();
        if (textToProcess && !alreadyProcessed) {
          processAndAdvance(textToProcess);
        }
      }, 1200);
    };

    recognition.onerror = (event) => {
      if (isStaleSession()) return;
      if (event.error === "no-speech") {
        return;
      }
      console.warn("Speech recognition notice:", event.error);
      if (event.error === "not-allowed") {
        setWizardMsg("Microphone permission was not granted. You can tap the quick suggestion buttons below or enter text manually.");
        stopRecognition(true);
      } else if (event.error === "network") {
        console.warn("Speech recognition network error. Switching to robust MediaRecorder...");
        setWizardMsg("Using backup microphone...");
        startMediaRecorderListening(activeLang);
      }
    };

    recognition.onend = () => {
      if (isStaleSession()) return;

      const pendingText = (finalText || capturedTextRef.current || "").trim();
      if (pendingText && !pendingText.startsWith("Listening...") && !alreadyProcessed) {
        processAndAdvance(pendingText);
        return;
      }

      if (
        !alreadyProcessed &&
        wizardStepRef.current !== "IDLE" &&
        wizardStepRef.current !== "COMPLETED" &&
        !isSpeakingRef.current &&
        !isProcessingRef.current
      ) {
        setTimeout(() => {
          if (!isStaleSession() && wizardStepRef.current !== "IDLE" && wizardStepRef.current !== "COMPLETED" && !isSpeakingRef.current) {
            try {
              recognition.start();
            } catch(e) {
              startContinuousListening(activeLang);
            }
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  // ─── Handle No Speech Detected: Polite Prompt & Ask Again ───
  const handleNoSpeechDetected = (step, targetLang = null) => {
    playChime("retry");
    hasUserSpokenRef.current = false;
    const activeLang = targetLang || wizardLangRef.current || lang || "te";

    silenceRestartCountRef.current += 1;
    setRetryCount(silenceRestartCountRef.current);

    if (silenceRestartCountRef.current > 2) {
      const pauseMsg = {
        te: "మైక్ పాజ్ చేయబడింది. మీకు కావలసినప్పుడు 'Tap to Speak' బటన్ నొక్కండి లేదా సూచనలను ఎంచుకోండి.",
        hi: "माइक रोक दिया गया है। जब तैयार हों 'Tap to Speak' दबाएं।",
        ta: "மைக் இடைநிறுத்தப்பட்டது. தயாராகும்போது 'Tap to Speak' அழுத்தவும்.",
        kn: "ಮೈಕ್ ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ. ಸಿದ್ಧವಾದಾಗ 'Tap to Speak' ಒತ್ತಿರಿ.",
        en: "Microphone paused. Tap 'Tap to Speak' or select a suggestion below when ready."
      };
      setWizardMsg(pauseMsg[activeLang] || pauseMsg.en);
      stopRecognition(true);
      silenceRestartCountRef.current = 0;
      setRetryCount(0);
    } else {
      const retryPrefix = {
        te: "మీరు చెప్పింది వినపడలేదు.",
        hi: "आपकी आवाज़ नहीं आई।",
        ta: "நீங்கள் பேசியது கேட்கவில்லை.",
        kn: "ನಿಮ್ಮ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ.",
        en: "I didn't hear you."
      };

      askStep(step, retryPrefix[activeLang] || retryPrefix.en, activeLang);
    }
  };

  // ─── Manual Controls ───
  const handleManualDoneSpeaking = () => {
    listenSessionRef.current++;
    const activeLang = wizardLangRef.current || lang || "te";

    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (initialSilenceTimerRef.current) { clearTimeout(initialSilenceTimerRef.current); initialSilenceTimerRef.current = null; }

    if (recognitionRef.current && recognitionRef.current.state === "recording") {
      try {
        recognitionRef.current.stop();
      } catch(e) {}
      return;
    }

    const raw = (capturedTextRef.current || interim || "").trim();
    const textToProcess = raw.startsWith("Listening...") ? "" : raw;

    stopRecognition(true);

    if (textToProcess && !isProcessingRef.current && wizardStepRef.current !== "COMPLETED" && wizardStepRef.current !== "IDLE") {
      capturedTextRef.current = "";
      processStepInput(wizardStepRef.current, textToProcess);
    } else {
      setInterim("Please speak now or tap a suggestion below 🎙️");
      startContinuousListening(activeLang);
    }
  };

  const handleManualTapToSpeak = () => {
    const activeLang = wizardLangRef.current || lang || "te";
    if (wizardStep === "IDLE") {
      setWizardStep("NAME");
      askStep("NAME", "", activeLang);
    } else if (wizardStep !== "COMPLETED") {
      startContinuousListening(activeLang);
    }
  };

  const handleRepeatQuestion = () => {
    const activeLang = wizardLangRef.current || lang || "te";
    if (wizardStep !== "IDLE") {
      askStep(wizardStep, "", activeLang);
    }
  };

  const handleSkipStep = () => {
    const activeLang = wizardLangRef.current || lang || "te";
    if (wizardStep === "SINGLE_PROMPT") askStep("CONFIRM_SUBMIT", "", activeLang);
    else if (wizardStep === "NAME") askStep("QUANTITY", "", activeLang);
    else if (wizardStep === "QUANTITY") askStep("PRICE", "", activeLang);
    else if (wizardStep === "PRICE") askStep("CONFIRM_SUBMIT", "", activeLang);
    else if (wizardStep === "CONFIRM_SUBMIT") askStep("COMPLETED", "", activeLang);
  };

  // ─── Omnipresent Input Processor: Detects Full Sentences, Step-by-Step, or Partial Inputs ───
  const processStepInput = async (step, transcript) => {
    const cleanTranscript = (transcript || "").replace(/^Listening[^\w]*/i, "").trim();
    const activeLang = wizardLangRef.current || lang || "te";

    if (!cleanTranscript) {
      handleNoSpeechDetected(step, activeLang);
      return;
    }

    if (isProcessingRef.current) return;
    setIsProcessing(true);
    isProcessingRef.current = true;
    setLastHeard(cleanTranscript);
    setInterim("");
    stopRecognition(true);
    stopTTS();

    try {
      const lower = cleanTranscript.toLowerCase().trim();

      // 1. If at CONFIRM_SUBMIT step, handle confirmation or cancellation
      if (step === "CONFIRM_SUBMIT") {
        if (isAffirmative(cleanTranscript)) {
          playChime("success");
          await handleSubmit(new Event("submit"));
          stopWizard();
          return;
        } else if (isNegative(cleanTranscript)) {
          playChime("retry");
          const resetData = {
            name: "", category: "vegetable", price: "", quantity: "", unit: "kg", description: "", isOrganic: false,
            location: user?.location || "", farmLocation: user?.farmName || user?.location || "",
            latitude: user?.latitude || "", longitude: user?.longitude || "",
            growingStage: "harvested", notifyAdmin: false, allowPrebooking: false, expectedHarvestDate: ""
          };
          setFormData(resetData);
          formDataRef.current = resetData;
          setFilledFields({});
          const restartAck = {
            te: "సరే, మళ్లీ మొదటి నుండి మొదలుపెడదాం.",
            hi: "ठीक है, फिर से शुरू करते हैं।",
            ta: "சரி, மீண்டும் முதலிலிருந்து தொடங்குவோம்.",
            kn: "ಸರಿ, ಮೊದಲಿನಿಂದ ಪ್ರಾರಂಭಿಸೋಣ.",
            en: "Okay, let's start over."
          };
          askStep("NAME", restartAck[activeLang] || restartAck.en, activeLang);
          return;
        } else {
          playChime("retry");
          const retryMsg = getUnrecognizedAck("CONFIRM_SUBMIT", cleanTranscript, activeLang);
          askStep("CONFIRM_SUBMIT", retryMsg, activeLang);
          return;
        }
      }

      // 2. OMNIPRESENT EXTRACTION:
      // A. Fast local multilingual parser (handles crop names, numbers, units, slangs in all languages)
      const localParsed = parseVoiceToFormMultilingual(cleanTranscript, activeLang, { step }) || {};

      let extractedName = localParsed.name || null;
      let extractedCategory = localParsed.category || (extractedName ? CATEGORIES_MAP[extractedName] : null) || null;
      let extractedQty = (localParsed.quantity !== undefined && localParsed.quantity !== null) ? parseFloat(localParsed.quantity) : null;
      let extractedUnit = localParsed.unit || formDataRef.current.unit || "kg";
      let extractedPrice = (localParsed.price !== undefined && localParsed.price !== null) ? parseFloat(localParsed.price) : null;

      // B. If step required entity was NOT resolved locally, invoke backend wizard parser:
      const isMissingCurrentEntity =
        (step === "SINGLE_PROMPT" && (!extractedName || extractedQty === null || extractedPrice === null)) ||
        (step === "NAME" && !extractedName && extractedQty === null && extractedPrice === null) ||
        (step === "QUANTITY" && extractedQty === null) ||
        (step === "PRICE" && extractedPrice === null);

      if (isMissingCurrentEntity) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 3500);
          const res = await fetch(`${BASE_URL}/api/ai/parse-wizard-step`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step, transcript: cleanTranscript, lang: activeLang }),
            signal: ctrl.signal
          });
          clearTimeout(tid);
          if (res.ok) {
            const aiParsed = await res.json();
            if (!extractedName && aiParsed.name) {
              extractedName = aiParsed.name;
              extractedCategory = aiParsed.category || CATEGORIES_MAP[extractedName] || "vegetable";
            }
            if (extractedQty === null && aiParsed.quantity !== undefined && aiParsed.quantity !== null) {
              extractedQty = parseFloat(aiParsed.quantity);
              if (aiParsed.unit) extractedUnit = aiParsed.unit;
            }
            if (extractedPrice === null && aiParsed.price !== undefined && aiParsed.price !== null) {
              extractedPrice = parseFloat(aiParsed.price);
            }
          }
        } catch (e) {
          console.warn("AI extraction warning:", e);
        }
      }

      // C. Local heuristic fallback for isolated values based on current step
      if (!extractedName && (step === "NAME" || step === "SINGLE_PROMPT") && extractedQty === null && extractedPrice === null) {
        const sortedEntries = Object.entries(CROPS_MAP).sort((a, b) => b[0].length - a[0].length);
        for (const [slang, stdName] of sortedEntries) {
          const sLower = slang.toLowerCase();
          const words = lower.split(/[\s,]+/);
          if (words.includes(sLower) || lower.includes(sLower)) {
            extractedName = stdName;
            extractedCategory = CATEGORIES_MAP[stdName] || "vegetable";
            break;
          }
        }
        if (!extractedName && cleanTranscript.length > 2 && !/(what|how|where|when|hello|hi|please|babu|bhaiya|namaste)/i.test(lower)) {
          extractedName = cleanTranscript.charAt(0).toUpperCase() + cleanTranscript.slice(1);
          extractedCategory = "vegetable";
        }
      }

      if (extractedQty === null && (step === "QUANTITY" || step === "SINGLE_PROMPT" || /(kg|kilo|bag|quintal|tonne|lit|piece|dozen)/i.test(lower))) {
        const numMatch = cleanTranscript.match(/\d+(?:\.\d+)?/);
        if (numMatch) extractedQty = parseFloat(numMatch[0]);
        else {
          const spoken = parseSpokenNumber(cleanTranscript);
          if (spoken && !isNaN(spoken)) extractedQty = parseFloat(spoken);
        }
        for (const [unitKey, aliases] of Object.entries(UNITS_MAP)) {
          if (aliases.some(a => lower.includes(a.toLowerCase()))) {
            extractedUnit = unitKey === "ton" ? "tonne" : unitKey;
            break;
          }
        }
      }

      if (extractedPrice === null && (step === "PRICE" || step === "SINGLE_PROMPT" || /(₹|rs|rupee|rupees|ధర|రూపాయలు|रुपये|రూపాయి|bhav|daam|rate|at|for)/i.test(lower))) {
        if (/markets*price|మార్కెట్|మండి|మండీ|bhav|daam|rate|average/i.test(lower)) {
          const cropKey = formDataRef.current.name || extractedName || "";
          if (CROP_BENCHMARKS[cropKey]) {
            extractedPrice = CROP_BENCHMARKS[cropKey].avg;
          }
        }
        if (extractedPrice === null) {
          const numMatch = cleanTranscript.match(/(?:₹|rs|rupees?|ధర|రూపాయలు|रुपये|రూపాయి)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:₹|rs|rupees?|ధర|రూపాయలు|रुपये|రూపాయి)/i);
          if (numMatch) {
            extractedPrice = parseFloat(numMatch[1] || numMatch[2]);
          } else {
            const anyNum = cleanTranscript.match(/\d+(?:\.\d+)?/);
            if (anyNum && extractedQty !== parseFloat(anyNum[0])) {
              extractedPrice = parseFloat(anyNum[0]);
            } else {
              const spoken = parseSpokenNumber(cleanTranscript);
              if (spoken && !isNaN(spoken) && extractedQty !== parseFloat(spoken)) {
                extractedPrice = parseFloat(spoken);
              }
            }
          }
        }
      }

      // D. Update form state & refs live with all extracted fields
      let hasUpdates = false;
      const formUpdates = {};
      const filledUpdates = {};

      if (extractedName) {
        formUpdates.name = extractedName;
        formUpdates.category = extractedCategory || formDataRef.current.category || "vegetable";
        formDataRef.current.name = extractedName;
        formDataRef.current.category = formUpdates.category;
        filledUpdates.name = true;
        filledUpdates.category = true;
        hasUpdates = true;
      }

      if (extractedQty !== null && !isNaN(extractedQty)) {
        formUpdates.quantity = extractedQty;
        formUpdates.unit = extractedUnit;
        formDataRef.current.quantity = extractedQty;
        formDataRef.current.unit = extractedUnit;
        filledUpdates.quantity = true;
        filledUpdates.unit = true;
        hasUpdates = true;
      }

      if (extractedPrice !== null && !isNaN(extractedPrice)) {
        formUpdates.price = extractedPrice;
        formDataRef.current.price = extractedPrice;
        filledUpdates.price = true;
        hasUpdates = true;
      }

      if (hasUpdates) {
        setFormData(prev => ({ ...prev, ...formUpdates }));
        setFilledFields(prev => ({ ...prev, ...filledUpdates }));
        playChime("success");
      }

      // E. Check current status across all 3 core fields
      const curName = formDataRef.current.name;
      const curQty = formDataRef.current.quantity;
      const curUnit = formDataRef.current.unit || "kg";
      const curPrice = formDataRef.current.price;

      // If nothing could be recognized at all, gently ask again
      if (!hasUpdates && !curName && !curQty && !curPrice) {
        playChime("retry");
        const retryMsg = getUnrecognizedAck(step, cleanTranscript, activeLang);
        if (step === "SINGLE_PROMPT") {
           setAssistantMode("step");
           askStep("NAME", retryMsg, activeLang);
        } else {
           askStep(step, retryMsg, activeLang);
        }
        return;
      }

      // ── SMART FLOW TRANSITIONS ──
      // Scenario 1: ALL 3 CORE FIELDS ARE PRESENT! (Complete sentence or accumulated step)
      if (curName && curQty && curPrice) {
        const fullAcks = {
          en: `All details collected: ${curName}, ${curQty} ${curUnit} at ₹${curPrice}.`,
          te: `వివరాలు నమోదు చేశాను: ${curName}, ${curQty} ${curUnit}, ధర ₹${curPrice}.`,
          hi: `विवरण दर्ज किया गया: ${curName}, ${curQty} ${curUnit}, ₹${curPrice} प्रति यूनिट।`,
          ta: `விவரங்கள் பெறப்பட்டன: ${curName}, ${curQty} ${curUnit}, விலை ₹${curPrice}.`,
          kn: `ವಿವರಗಳನ್ನು ನಮೂದಿಸಲಾಗಿದೆ: ${curName}, ${curQty} ${curUnit}, ಬೆಲೆ ₹${curPrice}.`
        };
        const ack = fullAcks[activeLang] || fullAcks.en;
        askStep("CONFIRM_SUBMIT", ack, activeLang);
        return;
      }
      
      // Handle SINGLE_PROMPT fallback to step-by-step if missing info
      if (step === "SINGLE_PROMPT" && (!curName || !curQty || !curPrice)) {
         setAssistantMode('step');
         if (!curName) {
            askStep("NAME", "Could not catch the crop name. What crop is this?", activeLang);
         } else if (!curQty) {
            askStep("QUANTITY", `Got ${curName}. How much quantity?`, activeLang);
         } else if (!curPrice) {
            askStep("PRICE", `Got ${curQty} ${curUnit} of ${curName}. What is the price?`, activeLang);
         }
         return;
      }

      // Scenario 2: Crop Name is known, Quantity is known, Price is MISSING
      if (curName && curQty && !curPrice) {
        const ack = getSuccessAck("QUANTITY", curQty, curUnit, activeLang);
        askStep("PRICE", ack, activeLang);
        return;
      }

      // Scenario 3: Crop Name is known, Quantity is MISSING
      if (curName && !curQty) {
        const ack = getSuccessAck("NAME", curName, "", activeLang);
        askStep("QUANTITY", ack, activeLang);
        return;
      }

      // Scenario 4: Quantity or Price is known, Crop Name is MISSING
      if (!curName) {
        const partialAck = {
          en: curQty ? `Got quantity ${curQty} ${curUnit}. What crop is this?` : `Got price ₹${curPrice}. What crop is this?`,
          te: curQty ? `${curQty} ${curUnit} తీసుకున్నాను. పంట పేరు ఏమిటి?` : `ధర ₹${curPrice} తీసుకున్నాను. పంట పేరు ఏమిటి?`,
          hi: curQty ? `${curQty} ${curUnit} दर्ज किया। फसल का नाम क्या है?` : `कीमत ₹${curPrice} दर्ज की। फसल का नाम क्या है?`,
          ta: curQty ? `${curQty} ${curUnit} சேர்க்கப்பட்டது. பயிர் பெயர் என்ன?` : `விலை ₹${curPrice} சேர்க்கப்பட்டது. பயிர் பெயர் என்ன?`,
          kn: curQty ? `${curQty} ${curUnit} ಸೇರಿಸಲಾಗಿದೆ. ಬೆಳೆಯ ಹೆಸರು ಏನು?` : `ಬೆಲೆ ₹${curPrice} ಸೇರಿಸಲಾಗಿದೆ. ಬೆಳೆಯ ಹೆಸರು ಏನು?`
        };
        askStep("NAME", partialAck[activeLang] || partialAck.en, activeLang);
        return;
      }

      // Default fallback to continue wizard
      askStep(step, "", activeLang);
    } catch (err) {
      console.error("Step processing error:", err);
      handleNoSpeechDetected(step, activeLang);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };
  const startWizard = async () => {
    // SYNC AUDIO UNLOCK: Play a silent utterance immediately on click to unlock TTS
    try {
       const unlockUtterance = new SpeechSynthesisUtterance("");
       unlockUtterance.volume = 0;
       window.speechSynthesis.speak(unlockUtterance);
    } catch (e) {}

    // Request microphone permission on click
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.warn("Microphone pre-check warning:", err);
    }

    setFilledFields({});
    setRetryCount(0);
    if (assistantMode === 'single') {
      askStep('SINGLE_PROMPT');
    } else {
      askStep('NAME');
    }
  };

  const stopWizard = () => {
    listenSessionRef.current++; // Kill any stale recognition callbacks
    stopRecognition(true);
    stopTTS();
    setWizardStep('IDLE');
    wizardStepRef.current = 'IDLE';
    setWizardMsg("");
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setIsListening(false);
    setIsProcessing(false);
    isProcessingRef.current = false;
    setInterim("");
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) {
      setMsg("You must be logged in to add a crop.");
      return;
    }

    // Always merge formDataRef.current to prevent stale state issues
    const currentData = {
      ...formData,
      ...formDataRef.current
    };

    if (!currentData.name || !currentData.price || !currentData.quantity) {
      setMsg("Please provide crop name, quantity, and price.");
      return;
    }

    setLoading(true);
    try {
      const growingToLifecycle = {
        nursery: "sowing",
        vegetative: "vegetative",
        flowering: "flowering",
        fruiting: "flowering",
        harvested: "ready"
      };
      const isGrowing = currentData.growingStage && currentData.growingStage !== 'harvested';
      const isPrebook = Boolean(currentData.allowPrebooking || isGrowing);

      const payload = {
        ...currentData,
        farmer: user._id,
        isPrebooking: isPrebook,
        allowPrebooking: isPrebook,
        lifecycleStage: growingToLifecycle[currentData.growingStage] || (isGrowing ? "sowing" : "ready")
      };
      
      // Inject Organic Verification Payload
      if (currentData.isOrganic) {
        if (organicVerificationType === 'official') {
          payload.certificationDocument = certificationDocument;
          payload.certificationStatus = 'pending';
        } else if (organicVerificationType === '5-step') {
          payload.organicVerification = {
            status: 'pending_inspection',
            stepPhotos: { ...organicSteps }
          };
        }
      }

      await API.post('/crops/add', payload);
      setMsg(`Successfully listed ${payload.name} for sale!`);
      
      const resetForm = {
        name: '', category: 'vegetable', price: '', quantity: '', unit: 'kg', description: '', isOrganic: false,
        location: user?.location || '', farmLocation: user?.farmName || user?.location || '',
        latitude: user?.latitude || '', longitude: user?.longitude || '',
        growingStage: 'harvested', notifyAdmin: false, allowPrebooking: false, expectedHarvestDate: ''
      };
      setFormData(resetForm);
      formDataRef.current = resetForm;
      setFilledFields({});
      setWizardStep('IDLE');
      wizardStepRef.current = 'IDLE';

      const successAnnounce = {
        en: `Successfully listed ${payload.name} for sale!`,
        te: `${payload.name} అమ్మకానికి విజయవంతంగా ఉంచబడింది!`,
        hi: `${payload.name} को बिक्री के लिए सफलतापूर्वक सूचीबद्ध किया गया!`,
        ta: `${payload.name} வெற்றிகரமாக சந்தையில் பட்டியலிடப்பட்டது!`,
        kn: `${payload.name} ಮಾರಾಟಕ್ಕೆ ಯಶಸ್ವಿಯಾಗಿ ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ!`
      };
      playTTS(successAnnounce[lang] || successAnnounce.en, lang);
    } catch (err) {
      console.error("Crop submission error:", err);
      setMsg("Failed to list item. Ensure all fields are valid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <PackagePlus size={32} color="#16a34a" />
        <h1 className="page-title" style={{ margin: 0 }}>{t('addCrop')}</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        You can list your harvest, vegetables, fruits, grains, or farm byproducts like Hay Bales and Slurry.
      </p>

      {/* ─── AI GUIDED VOICE ASSISTANT WIZARD BANNER ─── */}
      <div 
        style={{
          background: wizardStep === 'IDLE' 
            ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" 
            : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          border: "2px solid #86efac",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 8px 25px rgba(34, 197, 94, 0.15)",
          display: "flex", flexDirection: "column", gap: "1.2rem",
          transition: "all 0.3s ease"
        }}
      >
        {/* Header & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, color: "#166534", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem" }}>
              <Mic size={26} color="#16a34a" /> Guided Voice Assistant (స్మార్ట్ వాయిస్ అసిస్టెంట్)
            </h3>
            <p style={{ margin: "0.25rem 0 0 0", color: "#374151", fontSize: "0.95rem" }}>
              Illiterate or non-technical? Speak in Telugu, Hindi, Tamil, Kannada, or English. The assistant auto-fills and acknowledges your input!
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>Language / భాష:</span>
              {[
                { code: 'te', label: 'తెలుగు' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'en', label: 'English' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'kn', label: 'ಕನ್ನಡ' }
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setWizardLang(l.code);
                    wizardLangRef.current = l.code;
                    if (changeLang) changeLang(l.code);
                    if (wizardStep !== 'IDLE' && wizardStep !== 'COMPLETED') {
                      askStep(wizardStep, "", l.code);
                    }
                  }}
                  style={{
                    padding: "0.25rem 0.65rem",
                    borderRadius: "100px",
                    fontSize: "0.8rem",
                    fontWeight: wizardLang === l.code ? 700 : 500,
                    background: wizardLang === l.code ? "#16a34a" : "white",
                    color: wizardLang === l.code ? "white" : "#374151",
                    border: wizardLang === l.code ? "1px solid #16a34a" : "1px solid #cbd5e1",
                    cursor: "pointer",
                    boxShadow: wizardLang === l.code ? "0 2px 6px rgba(22,163,74,0.3)" : "none"
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {wizardStep === 'IDLE' ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: "0.5rem", background: "white", padding: "4px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                <button
                  type="button"
                  onClick={() => setAssistantMode('single')}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    border: "none",
                    background: assistantMode === 'single' ? "#16a34a" : "transparent",
                    color: assistantMode === 'single' ? "white" : "#475569",
                    fontWeight: assistantMode === 'single' ? 700 : 500,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    transition: "all 0.2s"
                  }}
                >
                  Single Sentence
                </button>
                <button
                  type="button"
                  onClick={() => setAssistantMode('step')}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    border: "none",
                    background: assistantMode === 'step' ? "#16a34a" : "transparent",
                    color: assistantMode === 'step' ? "white" : "#475569",
                    fontWeight: assistantMode === 'step' ? 700 : 500,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    transition: "all 0.2s"
                  }}
                >
                  Step-by-Step
                </button>
              </div>
              <button 
              type="button"
              onClick={startWizard}
              style={{
                background: "linear-gradient(135deg, #16a34a, #15803d)", 
                color: "white", padding: "0.85rem 1.75rem", 
                borderRadius: "100px", border: "none", fontWeight: "bold", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.6rem", 
                boxShadow: "0 6px 15px rgba(22,163,74,0.35)", fontSize: "1rem"
              }}
            >
              <PlayCircle size={22} /> Start Voice Wizard
            </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button 
                type="button"
                onClick={stopWizard}
                style={{
                  background: "#fee2e2", color: "#dc2626", padding: "0.6rem 1.2rem", 
                  borderRadius: "100px", border: "1px solid #fca5a5", fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem"
                }}
              >
                <MicOff size={18} /> Stop Assistant
              </button>
            </div>
          )}
        </div>

        {/* Wizard Progress Steps Indicator */}
        {wizardStep !== 'IDLE' && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", margin: "0.5rem 0", flexWrap: "wrap", gap: "0.5rem" }}>
            {(assistantMode === 'step' ? [
              { id: 'NAME', label: '1. Crop Name 🌾' },
              { id: 'QUANTITY', label: '2. Quantity ⚖️' },
              { id: 'PRICE', label: '3. Price 💰' },
              { id: 'CONFIRM_SUBMIT', label: '4. Ready ?' }
            ] : [
              { id: 'SINGLE_PROMPT', label: '1. Speak Details 🎙️' },
              { id: 'CONFIRM_SUBMIT', label: '2. Ready ?' }
            ]).map((s) => {
              const isCurrent = wizardStep === s.id;
              const isDone = assistantMode === 'step' ? (
                (s.id === 'NAME' && (wizardStep === 'QUANTITY' || wizardStep === 'PRICE' || wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'QUANTITY' && (wizardStep === 'PRICE' || wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'PRICE' && (wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'CONFIRM_SUBMIT' && wizardStep === 'COMPLETED')
              ) : (
                (s.id === 'SINGLE_PROMPT' && (wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'CONFIRM_SUBMIT' && wizardStep === 'COMPLETED')
              );

              return (
                <div 
                  key={s.id} 
                  style={{ 
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "#15803d" : isDone ? "#059669" : "#9ca3af",
                    fontSize: "0.85rem",
                    background: isCurrent ? "rgba(34, 197, 94, 0.2)" : isDone ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    padding: "0.3rem 0.6rem", borderRadius: "8px"
                  }}
                >
                  {isDone ? <Check size={16} /> : null}
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Active Conversation & Live Status Box */}
        {(wizardStep !== 'IDLE' || wizardMsg) && (
          <div style={{ 
            background: "white", padding: "1.2rem", borderRadius: "14px", border: "1px solid #bbf7d0",
            display: "flex", flexDirection: "column", gap: "0.8rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            {/* Assistant's Spoken Message & Acknowledgment */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.4rem" }}>🤖</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: "#1f2937", fontSize: "1.05rem", lineHeight: "1.5" }}>
                  {wizardMsg}
                </p>
                {isSpeaking && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#2563eb", fontSize: "0.85rem", marginTop: "0.3rem", fontWeight: 600 }}>
                    <Volume2 size={16} className="animate-bounce" /> Assistant is speaking to you...
                  </span>
                )}
              </div>
            </div>

            {/* Quick Suggestion Chips for Fast 1-Tap Advance */}
            {STEP_CHIPS[wizardStep] && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.2rem" }}>
                <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  💡 Quick 1-Tap Suggestions:
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  {STEP_CHIPS[wizardStep].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => processStepInput(wizardStep, chip.val)}
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        color: "#166534",
                        padding: "0.35rem 0.8rem",
                        borderRadius: "100px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Type Fallback (For noisy environments or if mic permission blocked) */}
            {wizardStep !== 'IDLE' && wizardStep !== 'COMPLETED' && wizardStep !== 'CONFIRM_SUBMIT' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualWizardText.trim()) {
                    processStepInput(wizardStep, manualWizardText.trim());
                    setManualWizardText("");
                  }
                }}
                style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}
              >
                <input
                  type="text"
                  placeholder={wizardStep === "NAME" ? "Or type crop name (e.g. Tomato)..." : wizardStep === "QUANTITY" ? "Or type quantity (e.g. 50 kg)..." : "Or type price in ₹ (e.g. 40)..."}
                  value={manualWizardText}
                  onChange={(e) => setManualWizardText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.45rem 0.85rem",
                    borderRadius: "8px",
                    border: "1.5px solid #d1d5db",
                    fontSize: "0.88rem",
                    outline: "none"
                  }}
                />
                <button 
                  type="submit" 
                  style={{
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Send
                </button>
              </form>
            )}

            {/* Farmer Voice Listening & Live Transcript Status */}
            {isListening && (
              <div style={{ 
                background: "#f0fdf4", border: "2px dashed #22c55e", borderRadius: "12px", 
                padding: "0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: "0.5rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ position: "relative", display: "flex", height: "16px", width: "16px" }}>
                    <span style={{ animation: "ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite", position: "absolute", display: "inline-flex", height: "100%", width: "100%", borderRadius: "9999px", background: "#22c55e", opacity: 0.75 }}></span>
                    <span style={{ position: "relative", display: "inline-flex", borderRadius: "9999px", height: "16px", width: "16px", background: "#16a34a" }}></span>
                  </span>
                  <div>
                    <p style={{ margin: 0, color: "#166534", fontWeight: 700, fontSize: "0.95rem" }}>
                      {interim || "Listening... Speak now!"}
                    </p>
                    <p style={{ margin: 0, color: "#6b7280", fontSize: "0.75rem" }}>
                      Speak naturally; it will automatically save when you pause.
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleManualDoneSpeaking}
                  style={{
                    background: "#16a34a", color: "white", border: "none", padding: "0.5rem 1rem",
                    borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                    display: "flex", alignItems: "center", gap: "0.3rem", boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                  }}
                >
                  <Check size={16} /> Done Speaking
                </button>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <p style={{ margin: 0, color: "#2563eb", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                <Loader2 size={18} className="lucide-spin" /> Acknowledging & adding to your form...
              </p>
            )}

            {/* Interactive Control Buttons for Farmers */}
            {wizardStep !== 'IDLE' && wizardStep !== 'COMPLETED' && !isSpeaking && !isProcessing && (
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.3rem", paddingTop: "0.6rem", borderTop: "1px solid #f3f4f6" }}>
                {wizardStep === 'CONFIRM_SUBMIT' ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        playChime('success');
                        await handleSubmit(new Event('submit'));
                        stopWizard();
                      }}
                      style={{
                        background: "#16a34a", color: "white", border: "none", padding: "0.6rem 1.2rem",
                        borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.95rem"
                      }}
                    >
                      <Check size={18} /> Yes, Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playChime('retry');
                        askStep('NAME', "Okay, let's start over.");
                      }}
                      style={{
                        background: "#ef4444", color: "white", border: "none", padding: "0.6rem 1.2rem",
                        borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.95rem"
                      }}
                    >
                      <X size={18} /> No, Start Over
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleRepeatQuestion}
                      style={{
                        background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", padding: "0.5rem 0.8rem",
                        borderRadius: "8px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem",
                        marginLeft: "auto"
                      }}
                    >
                      <RotateCcw size={14} /> Repeat
                    </button>
                  </>
                ) : (
                  <>
                    {!isListening && (
                      <button
                        type="button"
                        onClick={handleManualTapToSpeak}
                        style={{
                          background: "#16a34a", color: "white", border: "none", padding: "0.5rem 1.1rem",
                          borderRadius: "8px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
                          boxShadow: "0 2px 8px rgba(22,163,74,0.3)"
                        }}
                      >
                        <Mic size={16} /> Tap to Speak
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleRepeatQuestion}
                      style={{
                        background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", padding: "0.5rem 0.8rem",
                        borderRadius: "8px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem"
                      }}
                    >
                      <RotateCcw size={14} /> Repeat Question
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipStep}
                      style={{
                        background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb", padding: "0.5rem 0.8rem",
                        borderRadius: "8px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem"
                      }}
                    >
                      Skip Step <ArrowRight size={14} />
                    </button>
                  </>
                )}
              </div>
            )}

            {lastHeard && (
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "#6b7280", fontStyle: "italic" }}>
                Last captured: "{lastHeard}"
              </p>
            )}

            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
              .lucide-spin { animation: spin 1.5s linear infinite; }
              @keyframes ping {
                75%, 100% { transform: scale(2); opacity: 0; }
              }
            `}</style>
          </div>
        )}
      </div>

      {msg && (
        <div className="alert" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#166534", border: "1px solid #86efac", padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={20} /> <span>{msg}</span>
        </div>
      )}

      {/* ─── ADD CROP FORM (AUTO-FILLED LIVE) ─── */}
      <div className="glass-card mt-4" style={{ maxWidth: '650px', margin: '0 auto', transition: "all 0.3s" }}>
        {/* ─── VISUAL CROP PICKER ─── */}
        <div style={{ marginBottom: "1.5rem" }}>
           <CropVisualPicker 
              selectedCrop={formData.name} 
              onSelectCrop={(crop) => {
                const cropName = crop.names.en;
                setFormData(prev => ({ ...prev, name: cropName, category: crop.category }));
                formDataRef.current.name = cropName;
                formDataRef.current.category = crop.category;
                setFilledFields(prev => ({ ...prev, name: true, category: true }));
              }}
           />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* Crop Name */}
          <div style={{
            transition: "all 0.3s",
            background: wizardStep === 'NAME' ? "rgba(34, 197, 94, 0.08)" : "transparent",
            border: wizardStep === 'NAME' ? "2px solid #22c55e" : filledFields.name ? "1px solid #86efac" : "1px solid transparent",
            borderRadius: "10px", padding: wizardStep === 'NAME' || filledFields.name ? "0.8rem" : "0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: wizardStep === 'NAME' ? '#166534' : 'var(--text-dark)' }}>
                Item / Crop Name *
              </label>
              {filledFields.name && (
                <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <Check size={12} /> Added: {formData.name}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Tomato, Rice, Cotton, Hay Bales, Cow Dung Slurry" 
                className="form-input" 
                required 
                style={{ flex: 1, fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={() => speakField('name')}
                title="Speak Crop Name (any language)"
                style={{
                  background: fieldListening && activeVoiceField === 'name' ? "#ef4444" : "#f0fdf4",
                  color: fieldListening && activeVoiceField === 'name' ? "white" : "#16a34a",
                  border: "1.5px solid " + (fieldListening && activeVoiceField === 'name' ? "#ef4444" : "#86efac"),
                  borderRadius: "8px",
                  padding: "0.6rem 0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                <Mic size={18} />
              </button>
            </div>
            {fieldListening && activeVoiceField === 'name' && (
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "#16a34a", fontStyle: "italic" }}>
                🎙️ {fieldInterim || "Listening... speak crop name now"}
              </p>
            )}
          </div>

          {/* Category & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="form-input" style={{ width: '100%' }}>
                <option value="vegetable">Vegetable</option>
                <option value="fruit">Fruit</option>
                <option value="grain">Grain</option>
                <option value="pulse">Pulse</option>
                <option value="spice">Spice</option>
                <option value="dairy">Dairy</option>
                <option value="byproduct">Farm Byproduct (Hay, Slurry, Compost)</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{
              transition: "all 0.3s",
              background: wizardStep === 'QUANTITY' ? "rgba(34, 197, 94, 0.08)" : "transparent",
              border: wizardStep === 'QUANTITY' ? "2px solid #22c55e" : filledFields.unit ? "1px solid #86efac" : "1px solid transparent",
              borderRadius: "10px", padding: wizardStep === 'QUANTITY' || filledFields.unit ? "0.8rem" : "0"
            }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: wizardStep === 'QUANTITY' ? '#166534' : 'var(--text-dark)' }}>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange} className="form-input" style={{ width: '100%' }}>
                <option value="kg">Kilograms (kg)</option>
                <option value="tonne">Tonnes</option>
                <option value="quintal">Quintals</option>
                <option value="bag">Bags</option>
                <option value="litre">Litres (L)</option>
                <option value="bale">Bales (For Hay)</option>
                <option value="piece">Pieces</option>
                <option value="dozen">Dozens</option>
              </select>
            </div>
          </div>

          {/* Quantity & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{
              transition: "all 0.3s",
              background: wizardStep === 'QUANTITY' ? "rgba(34, 197, 94, 0.08)" : "transparent",
              border: wizardStep === 'QUANTITY' ? "2px solid #22c55e" : filledFields.quantity ? "1px solid #86efac" : "1px solid transparent",
              borderRadius: "10px", padding: wizardStep === 'QUANTITY' || filledFields.quantity ? "0.8rem" : "0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: wizardStep === 'QUANTITY' ? '#166534' : 'var(--text-dark)' }}>
                  Quantity Available *
                </label>
                {filledFields.quantity && (
                  <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <Check size={12} /> Added: {formData.quantity} {formData.unit}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <input 
                  type="number" 
                  name="quantity" 
                  value={formData.quantity} 
                  onChange={handleChange} 
                  placeholder={`e.g. 50 ${formData.unit}`} 
                  className="form-input" 
                  required 
                  min="1" 
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => speakField('quantity')}
                  title="Speak Quantity"
                  style={{
                    background: fieldListening && activeVoiceField === 'quantity' ? "#ef4444" : "#f0fdf4",
                    color: fieldListening && activeVoiceField === 'quantity' ? "white" : "#16a34a",
                    border: "1.5px solid " + (fieldListening && activeVoiceField === 'quantity' ? "#ef4444" : "#86efac"),
                    borderRadius: "8px",
                    padding: "0.6rem 0.7rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Mic size={18} />
                </button>
              </div>
              {fieldListening && activeVoiceField === 'quantity' && (
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#16a34a", fontStyle: "italic" }}>
                  🎙️ {fieldInterim || "Listening... speak quantity"}
                </p>
              )}
            </div>

            <div style={{
              transition: "all 0.3s",
              background: wizardStep === 'PRICE' ? "rgba(34, 197, 94, 0.08)" : "transparent",
              border: wizardStep === 'PRICE' ? "2px solid #22c55e" : filledFields.price ? "1px solid #86efac" : "1px solid transparent",
              borderRadius: "10px", padding: wizardStep === 'PRICE' || filledFields.price ? "0.8rem" : "0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 600, color: wizardStep === 'PRICE' ? '#166534' : 'var(--text-dark)' }}>
                  Price (₹ per {formData.unit}) *
                </label>
                {filledFields.price && (
                  <span style={{ fontSize: "0.75rem", background: "#dcfce7", color: "#166534", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <Check size={12} /> Added: ₹{formData.price}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleChange} 
                  placeholder="e.g. 40" 
                  className="form-input" 
                  required 
                  min="1" 
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => speakField('price')}
                  title="Speak Price"
                  style={{
                    background: fieldListening && activeVoiceField === 'price' ? "#ef4444" : "#f0fdf4",
                    color: fieldListening && activeVoiceField === 'price' ? "white" : "#16a34a",
                    border: "1.5px solid " + (fieldListening && activeVoiceField === 'price' ? "#ef4444" : "#86efac"),
                    borderRadius: "8px",
                    padding: "0.6rem 0.7rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Mic size={18} />
                </button>
              </div>
              {fieldListening && activeVoiceField === 'price' && (
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#16a34a", fontStyle: "italic" }}>
                  🎙️ {fieldInterim || "Listening... speak price"}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Description</label>
              <button
                type="button"
                onClick={() => speakField('description')}
                title="Speak Description"
                style={{
                  background: fieldListening && activeVoiceField === 'description' ? "#ef4444" : "#f0fdf4",
                  color: fieldListening && activeVoiceField === 'description' ? "white" : "#16a34a",
                  border: "1px solid " + (fieldListening && activeVoiceField === 'description' ? "#ef4444" : "#86efac"),
                  borderRadius: "6px",
                  padding: "0.25rem 0.6rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.78rem",
                  fontWeight: 600
                }}
              >
                <Mic size={14} /> Speak
              </button>
            </div>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Fresh harvest from farm, organic soil, high quality." 
              className="form-input" 
              style={{ minHeight: '80px', resize: 'vertical', width: '100%' }}
            ></textarea>
            {fieldListening && activeVoiceField === 'description' && (
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#16a34a", fontStyle: "italic" }}>
                🎙️ {fieldInterim || "Listening... speak description"}
              </p>
            )}
          </div>

          {/* Organic / Pesticide Free */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--green-pale)', padding: '1rem', borderRadius: '10px', cursor: 'pointer' }}>
              <input type="checkbox" name="isOrganic" checked={formData.isOrganic} onChange={handleChange} style={{ width: '20px', height: '20px' }} /> 
              <span style={{ fontWeight: 600, color: 'var(--green-deep)' }}>This product is Certified Organic / Pesticide-Free (సేంద్రీయ పంట)</span>
            </label>

            {formData.isOrganic && (
              <div style={{
                background: "linear-gradient(to right, #f0fdf4, #ffffff)",
                border: "2px solid #22c55e",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 4px 15px rgba(34,197,94,0.1)",
                display: "flex", flexDirection: "column", gap: "1.5rem",
                animation: "fadeIn 0.4s ease"
              }}>
                <h4 style={{ margin: 0, color: "#166534", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck size={22} /> Food Safety & Anti-Fake Organic Certification
                </h4>
                
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem", border: organicVerificationType === 'official' ? "2px solid #16a34a" : "1px solid #cbd5e1", borderRadius: "8px", background: organicVerificationType === 'official' ? "#dcfce7" : "#f8fafc", cursor: "pointer" }}>
                    <input type="radio" name="orgType" checked={organicVerificationType === 'official'} onChange={() => setOrganicVerificationType('official')} style={{ accentColor: "#16a34a" }} />
                    <span style={{ fontWeight: 600, color: "#334155" }}>I have an Official Certificate</span>
                  </label>
                  <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem", border: organicVerificationType === '5-step' ? "2px solid #16a34a" : "1px solid #cbd5e1", borderRadius: "8px", background: organicVerificationType === '5-step' ? "#dcfce7" : "#f8fafc", cursor: "pointer" }}>
                    <input type="radio" name="orgType" checked={organicVerificationType === '5-step'} onChange={() => setOrganicVerificationType('5-step')} style={{ accentColor: "#16a34a" }} />
                    <span style={{ fontWeight: 600, color: "#334155" }}>Apply for 5-Step RS Verification</span>
                  </label>
                </div>

                {organicVerificationType === 'official' && (
                  <div style={{ background: "white", padding: "1.2rem", borderRadius: "8px", border: "1px dashed #22c55e" }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#475569' }}>Upload Official Certificate (PDF/Image)</label>
                    <input type="file" onChange={(e) => {
                       // Simulated file upload for now
                       setCertificationDocument("uploaded_cert.pdf");
                    }} className="form-input" style={{ width: '100%' }} />
                    {certificationDocument && <p style={{ color: "#16a34a", fontSize: "0.85rem", marginTop: "0.5rem" }}>✅ Document Attached: {certificationDocument}</p>}
                  </div>
                )}

                {organicVerificationType === '5-step' && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569" }}>Complete these 5 geotagged steps to verify your organic crop. RythuSethu Testing Agents will audit your submission.</p>
                    
                    {[
                      { id: 'step1_soil_bio', label: '1. Soil Prep (Jeevamrutham/Green Manure)' },
                      { id: 'step2_natural_seed', label: '2. Seed Treatment (Bijamrutham/Untreated)' },
                      { id: 'step3_corn_border_catch_crop', label: '3. Catch Crop (Corn Border/Marigold)' },
                      { id: 'step4_botanical_spray', label: '4. Pest Management (NSKE/Agniastra)' },
                      { id: 'step5_clean_harvest', label: '5. Clean Harvest & Storage' }
                    ].map(step => (
                      <div key={step.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ flex: 1 }}>
                           <strong style={{ display: "block", color: "#1e293b", fontSize: "0.95rem" }}>{step.label}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                             // Simulated camera capture
                             setOrganicSteps(prev => ({
                               ...prev,
                               [step.id]: { photoUrl: `simulated_photo_${step.id}.jpg` }
                             }));
                          }}
                          style={{
                            background: organicSteps[step.id].photoUrl ? "#f0fdf4" : "#f1f5f9",
                            color: organicSteps[step.id].photoUrl ? "#16a34a" : "#475569",
                            border: organicSteps[step.id].photoUrl ? "1px solid #86efac" : "1px solid #cbd5e1",
                            padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "0.4rem"
                          }}
                        >
                          {organicSteps[step.id].photoUrl ? <><CheckCircle size={14}/> Verified</> : <><Camera size={14} /> Take Photo</>}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stage-Wise Growing & Pre-Booking Panel */}
          <div style={{
            background: "linear-gradient(145deg, #f8fafc, #f1f5f9)",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem"
          }}>
            <h4 style={{ margin: 0, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sprout size={18} color="#16a34a" /> Stage-Wise Growing & Pre-Booking
            </h4>
            
            {/* Growing Stage Stepper */}
            <div>
              <label style={{ fontWeight: 600, display: "block", marginBottom: "0.8rem", color: "#475569", fontSize: "0.9rem" }}>Current Crop Stage</label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["nursery", "vegetative", "flowering", "fruiting", "harvested"].map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, growingStage: stage }))}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "100px",
                      border: formData.growingStage === stage ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
                      background: formData.growingStage === stage ? "#dcfce7" : "white",
                      color: formData.growingStage === stage ? "#166534" : "#64748b",
                      fontWeight: formData.growingStage === stage ? 700 : 500,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      fontSize: "0.85rem",
                      transition: "all 0.2s"
                    }}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Notify Admin */}
            {formData.growingStage !== 'harvested' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#fffbeb', padding: '0.8rem 1rem', borderRadius: '10px', cursor: 'pointer', border: '1px solid #fde68a' }}>
                <input type="checkbox" name="notifyAdmin" checked={formData.notifyAdmin} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#d97706' }} /> 
                <span style={{ fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                  <Bell size={16} /> Request Admin Visit / Advisory
                </span>
              </label>
            )}

            {/* Pre-Booking Toggle */}
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "1rem" }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: formData.allowPrebooking ? '1rem' : '0' }}>
                <div style={{
                  position: "relative",
                  width: "44px",
                  height: "24px",
                  background: formData.allowPrebooking ? "#3b82f6" : "#cbd5e1",
                  borderRadius: "100px",
                  transition: "background 0.3s"
                }}>
                  <div style={{
                    position: "absolute",
                    top: "2px",
                    left: formData.allowPrebooking ? "22px" : "2px",
                    width: "20px",
                    height: "20px",
                    background: "white",
                    borderRadius: "50%",
                    transition: "left 0.3s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }} />
                </div>
                <input type="checkbox" name="allowPrebooking" checked={formData.allowPrebooking} onChange={handleChange} style={{ display: 'none' }} />
                <span style={{ fontWeight: 600, color: "#334155" }}>Allow Pre-Booking by Customers</span>
              </label>

              {formData.allowPrebooking && (
                <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", background: "white", padding: "1rem", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                  <Calendar color="#3b82f6" size={20} />
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.2rem', fontWeight: 600 }}>Expected Harvest Date</label>
                    <input 
                      type="date" 
                      name="expectedHarvestDate" 
                      value={formData.expectedHarvestDate} 
                      onChange={handleChange} 
                      required={formData.allowPrebooking}
                      min={new Date().toISOString().split('T')[0]}
                      className="form-input" 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #93c5fd' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Farm Location & GPS Coordinates */}
          <div style={{
            background: "#f8fafc",
            border: "1.5px solid #cbd5e1",
            borderRadius: "12px",
            padding: "1.2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <label style={{ fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.95rem" }}>
                <MapPin size={18} color="#16a34a" /> Farm / Harvest Location (పంట ఉండే ఖచ్చితమైన స్థలం)
              </label>
              {formData.latitude && formData.longitude ? (
                <span style={{
                  background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "100px",
                  fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px"
                }}>
                  <Compass size={13} /> GPS: {Number(formData.latitude).toFixed(4)}°, {Number(formData.longitude).toFixed(4)}°
                </span>
              ) : (
                <span style={{ color: "#d97706", fontSize: "0.75rem", fontWeight: 600 }}>
                  ⚠️ GPS not detected
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="text"
                name="farmLocation"
                value={formData.farmLocation || formData.location}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, farmLocation: val, location: val }));
                }}
                placeholder="e.g. Gollapalli Village, Jagtial District, Telangana"
                className="form-input"
                style={{ flex: 1, fontSize: "0.95rem" }}
              />
              <button
                type="button"
                onClick={() => speakField('farmLocation')}
                title="Speak Farm Location"
                style={{
                  background: fieldListening && activeVoiceField === 'farmLocation' ? "#ef4444" : "#f0fdf4",
                  color: fieldListening && activeVoiceField === 'farmLocation' ? "white" : "#16a34a",
                  border: "1.5px solid " + (fieldListening && activeVoiceField === 'farmLocation' ? "#ef4444" : "#86efac"),
                  borderRadius: "8px",
                  padding: "0.6rem 0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Mic size={18} />
              </button>
            </div>
            {fieldListening && activeVoiceField === 'farmLocation' && (
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "#16a34a", fontStyle: "italic" }}>
                🎙️ {fieldInterim || "Listening... speak village or location"}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={locDetecting}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 0.9rem", borderRadius: "8px",
                  background: "#3b82f6", color: "white", border: "none",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer"
                }}
              >
                {locDetecting ? <Loader2 size={14} className="spin" /> : <LocateFixed size={14} />}
                Use Current Farm GPS
              </button>

              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 0.9rem", borderRadius: "8px",
                  background: "white", color: "#16a34a", border: "1.5px solid #16a34a",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer"
                }}
              >
                <MapPin size={14} /> Pinpoint on Map
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>
              This exact position will be plotted on the Marketplace Map so nearby customers can navigate to your farm.
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-primary mt-2" 
            disabled={loading} 
            style={{ 
              padding: '1.1rem', fontSize: '1.15rem', fontWeight: "bold",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              boxShadow: "0 6px 15px rgba(22, 163, 74, 0.3)"
            }}
          >
            <span>{loading ? "Listing..." : "List Item on Marketplace"}</span>
          </button>

        </form>
      </div>

      {showLocationPicker && (
        <LocationUpdateModal
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSaved={({ location, latitude, longitude }) => {
            setFormData(prev => ({
              ...prev,
              location,
              farmLocation: location,
              latitude,
              longitude
            }));
          }}
        />
      )}
    </div>
  );
}