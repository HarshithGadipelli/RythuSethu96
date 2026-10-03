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
  playTTS, stopTTS, parseVoiceToFormMultilingual, 
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

export default function AddCrop() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  
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
  const [wizardStep, setWizardStep] = useState('IDLE'); // 'IDLE' | 'NAME' | 'QUANTITY' | 'PRICE' | 'CONFIRM_SUBMIT' | 'COMPLETED'
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
  const getPromptForStep = (step, currentCrop = "", currentQty = "", currentUnit = "kg") => {
    const unitInLang = {
      te: currentUnit === 'kg' ? 'కేజీ' : currentUnit === 'bag' ? 'బస్తా' : currentUnit === 'quintal' ? 'క్వింటాల్' : currentUnit,
      hi: currentUnit === 'kg' ? 'किलो' : currentUnit === 'bag' ? 'बोरी' : currentUnit === 'quintal' ? 'क्विंटल' : currentUnit,
      ta: currentUnit === 'kg' ? 'கிலோ' : currentUnit === 'bag' ? 'மூட்டை' : currentUnit,
      kn: currentUnit === 'kg' ? 'ಕೆಜಿ' : currentUnit === 'bag' ? 'ಮೂಟೆ' : currentUnit,
      en: currentUnit
    };

    const prompts = {
      NAME: {
        en: "What crop or produce do you want to sell? Please speak after the chime.",
        te: "మీరు ఏ పంటను అమ్మాలనుకుంటున్నారు? బీప్ శబ్దం తర్వాత పంట పేరు చెప్పండి.",
        hi: "आप कौन सी फसल या उत्पाद बेचना चाहते हैं? बीप के बाद बोलें।",
        ta: "நீங்கள் என்ன பயிரை விற்க விரும்புகிறீர்கள்? பீப் ஒலிக்குப் பிறகு சொல்லுங்கள்.",
        kn: "ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ಧ್ವನಿಯ ನಂತರ ಹೇಳಿ."
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
        en: `All details collected: ${formDataRef.current.name || currentCrop}, ${formDataRef.current.quantity || currentQty} ${formDataRef.current.unit || currentUnit} at ₹${formDataRef.current.price || ''}. Say Yes to submit, or review your form below.`,
        te: `వివరాలు నమోదు చేశాను: ${formDataRef.current.name || currentCrop}, ${formDataRef.current.quantity || currentQty} ${unitInLang.te}, ధర ₹${formDataRef.current.price || ''}. మార్కెట్‌లో లిస్ట్ చేయడానికి అవును అని చెప్పండి లేదా క్రింది బటన్ నొక్కండి.`,
        hi: `विवरण दर्ज किया गया: ${formDataRef.current.name || currentCrop}, ${formDataRef.current.quantity || currentQty} ${unitInLang.hi}, ₹${formDataRef.current.price || ''} प्रति यूनिट। लिस्ट करने के लिए हाँ कहें या नीचे दिया गया फॉर्म देखें।`,
        ta: `விவரங்கள் பெறப்பட்டன: ${formDataRef.current.name || currentCrop}, ${formDataRef.current.quantity || currentQty} ${unitInLang.ta}, விலை ₹${formDataRef.current.price || ''}. பட்டியலிட ஆம் என்று சொல்லுங்கள்.`,
        kn: `ವಿವರಗಳನ್ನು ನಮೂದಿಸಲಾಗಿದೆ: ${formDataRef.current.name || currentCrop}, ${formDataRef.current.quantity || currentQty} ${unitInLang.kn}, ಬೆಲೆ ₹${formDataRef.current.price || ''}. ಪಟ್ಟಿ ಮಾಡಲು ಹೌದು ಎಂದು ಹೇಳಿ.`
      },
      COMPLETED: {
        en: "All details filled! Please review the form and click List Item to publish.",
        te: "అన్ని వివరాలు నింపబడ్డాయి! ఫారమ్‌ను సరిచూసి లిస్ట్ ఐటెం బటన్ నొక్కండి.",
        hi: "सभी विवरण भर दिए गए हैं! फॉर्म की समीक्षा करें और सबमिट करें।",
        ta: "எல்லா விவரங்களும் நிரப்பப்பட்டுள்ளன! சரிபார்த்து சமர்ப்பிக்கவும்.",
        kn: "ಎಲ್ಲಾ ವಿವರಗಳು ಭರ್ತಿಯಾಗಿವೆ! ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸಬ್ಮಿಟ್ ಮಾಡಿ."
      }
    };
    return prompts[step]?.[lang] || prompts[step]?.en || "";
  };

  const getSuccessAck = (step, val1 = "", val2 = "") => {
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
    return acks[step]?.[lang] || acks[step]?.en || "";
  };

  const getUnrecognizedAck = (step, heard) => {
    const unrecAcks = {
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
        kn: `ದಯವಿಟ್ಟು ಸಲ್ಲಿಸಲು ಹೌದು ಅಥವಾ ರದ್ದು ಮಾಡಲು ಇಲ್ಲ ಎಂದು ಹೇಳಿ.`
      }
    };
    return unrecAcks[step]?.[lang] || unrecAcks[step]?.en || "";
  };

  // ─── Step Transition: Speak Prompt & Open Mic ───
  const askStep = async (step, customPrefix = "") => {
    stopRecognition(true);
    stopTTS();

    setWizardStep(step);
    wizardStepRef.current = step; // Immediate ref update to fix race condition
    setInterim("");
    setIsProcessing(false);
    isProcessingRef.current = false;

    let promptText = getPromptForStep(
      step, 
      formDataRef.current.name, 
      formDataRef.current.quantity, 
      formDataRef.current.unit
    );

    if (customPrefix) {
      promptText = customPrefix + " " + promptText;
    }

    setWizardMsg(promptText);
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    // Speak prompt aloud
    try {
      await playTTS(promptText, lang);
    } catch (e) {
      console.warn("TTS playback warning:", e);
    }

    setIsSpeaking(false);
    isSpeakingRef.current = false;

    // Play a gentle chime after TTS to indicate it's listening
    if (step !== 'COMPLETED' && wizardStepRef.current === step) {
       playChime('start');
       setInterim("Listening... Please speak now 🎙️");
       startContinuousListening();
    }
  };

  // ─── Start Continuous Listening for Farmer's Response ───
  const startContinuousListening = () => {
    stopRecognition(true);
    isExplicitlyStoppedRef.current = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setWizardMsg("Speech recognition is not supported in this browser. Please use Chrome or Edge, or tap the suggestion buttons below.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[lang] || "en-IN";

    capturedTextRef.current = "";
    hasUserSpokenRef.current = false;
    setInterim("");

    recognition.onstart = () => {
      setIsListening(true);
      if (!isSpeakingRef.current) {
        setInterim("Listening... Please speak now 🎙️");
      }
      
      // Silence detector: If user doesn't speak for 12 seconds, prompt them
      if (initialSilenceTimerRef.current) clearTimeout(initialSilenceTimerRef.current);
      initialSilenceTimerRef.current = setTimeout(() => {
        if (!hasUserSpokenRef.current && !isSpeakingRef.current && wizardStepRef.current !== 'COMPLETED' && wizardStepRef.current !== 'IDLE') {
          handleNoSpeechDetected(wizardStepRef.current);
        }
      }, 12000);
    };

    recognition.onresult = (event) => {
      if (isSpeakingRef.current) return; // Ignore AI's own voice echo
      
      hasUserSpokenRef.current = true;
      if (initialSilenceTimerRef.current) clearTimeout(initialSilenceTimerRef.current);
      
      let currentText = "";
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript + " ";
      }
      currentText = currentText.trim();
      if (!currentText) return;

      capturedTextRef.current = currentText;
      setInterim(currentText);

      // Debounce natural conversational silence pause (1200ms)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const textToProcess = (capturedTextRef.current || currentText || "").trim();
        if (
          textToProcess && 
          !textToProcess.startsWith("Listening...") &&
          !isProcessingRef.current && 
          wizardStepRef.current !== 'COMPLETED' && 
          wizardStepRef.current !== 'IDLE'
        ) {
          capturedTextRef.current = "";
          processStepInput(wizardStepRef.current, textToProcess);
        }
      }, 1200);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition notice:", event.error);
      if (event.error === 'not-allowed') {
        setWizardMsg("Microphone permission was not granted. You can tap the quick suggestion buttons below or enter text manually.");
        stopWizard();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // CRITICAL FIX: Flush any captured speech immediately so user speech is NEVER lost when Chrome ends stream!
      const pendingText = (capturedTextRef.current || "").trim();
      if (
        pendingText && 
        !pendingText.startsWith("Listening...") &&
        !isProcessingRef.current && 
        wizardStepRef.current !== 'IDLE' && 
        wizardStepRef.current !== 'COMPLETED'
      ) {
        capturedTextRef.current = "";
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        processStepInput(wizardStepRef.current, pendingText);
        return;
      }

      // If no speech captured yet, restart listening cleanly if wizard is still active
      if (
        wizardStepRef.current !== 'IDLE' && 
        wizardStepRef.current !== 'COMPLETED' && 
        !isSpeakingRef.current && 
        !isProcessingRef.current &&
        !isExplicitlyStoppedRef.current
      ) {
        setTimeout(() => {
          if (
            wizardStepRef.current !== 'IDLE' && 
            wizardStepRef.current !== 'COMPLETED' && 
            !isSpeakingRef.current && 
            !isProcessingRef.current &&
            !isExplicitlyStoppedRef.current
          ) {
            startContinuousListening();
          }
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  // ─── Handle No Speech Detected: Polite Prompt & Ask Again ───
  const handleNoSpeechDetected = (step) => {
    playChime('retry');
    hasUserSpokenRef.current = false;
    
    silenceRestartCountRef.current += 1;
    setRetryCount(silenceRestartCountRef.current);

    if (silenceRestartCountRef.current > 2) {
      const pauseMsg = lang === "te" 
        ? "మైక్ పాజ్ చేయబడింది. మీకు కావలసినప్పుడు 'Tap to Speak' బటన్ నొక్కండి లేదా సూచనలను ఎంచుకోండి." 
        : lang === "hi"
        ? "माइक रोक दिया गया है। जब तैयार हों 'Tap to Speak' दबाएं।"
        : "Microphone paused. Tap 'Tap to Speak' or select a suggestion below when ready.";
      setWizardMsg(pauseMsg);
      stopRecognition(true);
      silenceRestartCountRef.current = 0;
      setRetryCount(0);
    } else {
      const retryPrefix = lang === "te" 
        ? "మీరు చెప్పింది వినపడలేదు." 
        : lang === "hi" 
        ? "आपकी आवाज़ नहीं आई।" 
        : lang === "ta"
        ? "நீங்கள் பேசியது கேட்கவில்லை."
        : lang === "kn"
        ? "ನಿಮ್ಮ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ."
        : "I didn't hear you.";

      askStep(step, retryPrefix);
    }
  };

  // ─── Manual Controls ───
  const handleManualDoneSpeaking = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    const raw = (capturedTextRef.current || interim || "").trim();
    const textToProcess = raw.startsWith("Listening...") ? "" : raw;

    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop(); 
      } catch(e) {}
    }

    if (textToProcess && !isProcessingRef.current && wizardStepRef.current !== 'COMPLETED' && wizardStepRef.current !== 'IDLE') {
      capturedTextRef.current = "";
      processStepInput(wizardStepRef.current, textToProcess);
    } else {
      setInterim("Please speak now or tap a suggestion below 🎙️");
      startContinuousListening();
    }
  };

  const handleManualTapToSpeak = () => {
    if (wizardStep === 'IDLE') {
      setWizardStep('NAME');
      askStep('NAME');
    } else if (wizardStep !== 'COMPLETED') {
      startContinuousListening();
    }
  };

  const handleRepeatQuestion = () => {
    if (wizardStep !== 'IDLE') {
      askStep(wizardStep);
    }
  };

  const handleSkipStep = () => {
    if (wizardStep === 'NAME') askStep('QUANTITY');
    else if (wizardStep === 'QUANTITY') askStep('PRICE');
    else if (wizardStep === 'PRICE') askStep('CONFIRM_SUBMIT');
    else if (wizardStep === 'CONFIRM_SUBMIT') askStep('COMPLETED');
  };

  // ─── Process Input: Sense, Acknowledge, Add to Form, or Ask Again ───
  const processStepInput = async (step, transcript) => {
    const cleanTranscript = (transcript || "").replace(/^Listening[^\w]*/i, "").trim();
    if (!cleanTranscript) {
      handleNoSpeechDetected(step);
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

      // ────────────────────────────────
      // STEP 1: CROP NAME
      // ────────────────────────────────
      if (step === 'NAME') {
        // 1. First run instant local multilingual parser (handles "50 kg tomato for 40 rupees")
        const parsedAll = parseVoiceToFormMultilingual(cleanTranscript, lang);

        let extractedName = parsedAll.name || "";
        let extractedCategory = parsedAll.category || "";

        // Check local CROPS_MAP if not found by parser
        if (!extractedName) {
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
        }

        // 2. Fallback to API if not recognized locally
        if (!extractedName) {
          try {
            const res = await fetch(`${BASE_URL}/api/ai/parse-wizard-step`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step: "NAME", transcript: cleanTranscript, lang })
            });
            const data = await res.json();
            if (data && data.name) {
              extractedName = data.name;
              extractedCategory = CATEGORIES_MAP[data.name] || "vegetable";
            }
          } catch (e) {
            console.warn("Backend parse fallback failed", e);
          }
        }

        // 3. Fallback: if transcript is a sensible word (>2 chars) and not a question word
        if (!extractedName && cleanTranscript.length > 2 && !/(what|how|where|when|hello|hi|please|babu|bhaiya|namaste)/i.test(lower)) {
          extractedName = cleanTranscript.charAt(0).toUpperCase() + cleanTranscript.slice(1);
          extractedCategory = "vegetable";
        }

        if (!extractedName) {
          playChime('retry');
          const retryMsg = getUnrecognizedAck('NAME', cleanTranscript);
          askStep('NAME', retryMsg);
          return;
        }

        // SENSE SUCCEEDED: Update form & refs
        playChime('success');
        setFormData(prev => ({
          ...prev,
          name: extractedName,
          category: extractedCategory || prev.category
        }));
        formDataRef.current.name = extractedName;
        formDataRef.current.category = extractedCategory || formDataRef.current.category;
        setFilledFields(prev => ({ ...prev, name: true, category: true }));

        // Check if quantity and/or price were also extracted in this sentence!
        const alsoQty = parsedAll.quantity;
        const alsoUnit = parsedAll.unit || formDataRef.current.unit || "kg";
        const alsoPrice = parsedAll.price;

        if (alsoQty && alsoPrice) {
          formDataRef.current.quantity = alsoQty;
          formDataRef.current.unit = alsoUnit;
          formDataRef.current.price = alsoPrice;
          setFormData(prev => ({ ...prev, quantity: alsoQty, unit: alsoUnit, price: alsoPrice }));
          setFilledFields(prev => ({ ...prev, quantity: true, unit: true, price: true }));
          askStep('CONFIRM_SUBMIT');
          return;
        } else if (alsoQty) {
          formDataRef.current.quantity = alsoQty;
          formDataRef.current.unit = alsoUnit;
          setFormData(prev => ({ ...prev, quantity: alsoQty, unit: alsoUnit }));
          setFilledFields(prev => ({ ...prev, quantity: true, unit: true }));
          const ackMsg = getSuccessAck('NAME', extractedName) + " " + getSuccessAck('QUANTITY', alsoQty, alsoUnit);
          askStep('PRICE', ackMsg);
          return;
        }

        const ackMsg = getSuccessAck('NAME', extractedName);
        askStep('QUANTITY', ackMsg);
      }

      // ────────────────────────────────
      // STEP 2: QUANTITY
      // ────────────────────────────────
      else if (step === 'QUANTITY') {
        let extractedQty = null;
        let extractedUnit = formDataRef.current.unit || "kg";

        // Check for numbers (digits or spoken number words in any language)
        const numMatch = cleanTranscript.match(/\d+(?:\.\d+)?/);
        if (numMatch) {
          extractedQty = parseFloat(numMatch[0]);
        } else {
          const spoken = parseSpokenNumber(cleanTranscript);
          if (spoken && !isNaN(spoken)) extractedQty = parseFloat(spoken);
        }

        // Unit extraction in multi-lingual slangs without false substring hits
        const qWords = lower.split(/[\s,]+/);
        for (const [unitKey, aliases] of Object.entries(UNITS_MAP)) {
          if (qWords.some(w => aliases.some(a => matchesUnitToken(w, a)))) {
            extractedUnit = unitKey === 'ton' ? 'tonne' : unitKey;
            break;
          }
        }

        // Also check if price was spoken in the same sentence! E.g. "50 kg at 40 rupees"
        let alsoPrice = null;
        const priceMatch = cleanTranscript.match(/(?:₹|rs|rupees?|ధర|రూపాయలు|रुपये|ರೂಪಾಯಿ)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:₹|rs|rupees?|ధర|రూపాయలు|रुपये|ರೂపಾಯಿ)/i);
        if (priceMatch) {
          alsoPrice = parseFloat(priceMatch[1] || priceMatch[2]);
        }

        // Fallback to API if not recognized locally
        if (extractedQty === null) {
          try {
            const res = await fetch(`${BASE_URL}/api/ai/parse-wizard-step`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step: "QUANTITY", transcript: cleanTranscript, lang })
            });
            const data = await res.json();
            if (data && data.quantity !== undefined && data.quantity !== null) {
              extractedQty = data.quantity;
              if (data.unit) extractedUnit = data.unit;
            }
          } catch (e) {
            console.warn("Backend parse fallback failed", e);
          }
        }

        if (extractedQty === null || isNaN(extractedQty)) {
          playChime('retry');
          const retryMsg = getUnrecognizedAck('QUANTITY', cleanTranscript);
          askStep('QUANTITY', retryMsg);
          return;
        }

        playChime('success');
        setFormData(prev => ({
          ...prev,
          quantity: extractedQty,
          unit: extractedUnit
        }));
        formDataRef.current.quantity = extractedQty;
        formDataRef.current.unit = extractedUnit;
        setFilledFields(prev => ({ ...prev, quantity: true, unit: true }));

        if (alsoPrice !== null && !isNaN(alsoPrice)) {
          formDataRef.current.price = alsoPrice;
          setFormData(prev => ({ ...prev, price: alsoPrice }));
          setFilledFields(prev => ({ ...prev, price: true }));
          askStep('CONFIRM_SUBMIT');
          return;
        }

        const ackMsg = getSuccessAck('QUANTITY', extractedQty, extractedUnit);
        askStep('PRICE', ackMsg);
      }

      // ────────────────────────────────
      // STEP 3: PRICE
      // ────────────────────────────────
      else if (step === 'PRICE') {
        let extractedPrice = null;

        const numMatch = cleanTranscript.match(/\d+(?:\.\d+)?/);
        if (numMatch) {
          extractedPrice = parseFloat(numMatch[0]);
        } else {
          const spoken = parseSpokenNumber(cleanTranscript);
          if (spoken && !isNaN(spoken)) extractedPrice = parseFloat(spoken);
        }

        // Fallback to API if not recognized locally
        if (extractedPrice === null) {
          try {
            const res = await fetch(`${BASE_URL}/api/ai/parse-wizard-step`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step: "PRICE", transcript: cleanTranscript, lang })
            });
            const data = await res.json();
            if (data && data.price !== undefined && data.price !== null) {
              extractedPrice = data.price;
            }
          } catch (e) {
            console.warn("Backend parse fallback failed", e);
          }
        }

        if (extractedPrice === null || isNaN(extractedPrice)) {
          playChime('retry');
          const retryMsg = getUnrecognizedAck('PRICE', cleanTranscript);
          askStep('PRICE', retryMsg);
          return;
        }

        playChime('success');
        setFormData(prev => ({
          ...prev,
          price: extractedPrice
        }));
        formDataRef.current.price = extractedPrice;
        setFilledFields(prev => ({ ...prev, price: true }));

        const ackMsg = getSuccessAck('PRICE', extractedPrice, formDataRef.current.unit || 'kg');
        askStep('CONFIRM_SUBMIT', ackMsg);
      }

      // ────────────────────────────────
      // STEP 4: CONFIRM_SUBMIT
      // ────────────────────────────────
      else if (step === 'CONFIRM_SUBMIT') {
        if (isAffirmative(cleanTranscript)) {
          playChime('success');
          await handleSubmit(new Event('submit'));
          stopWizard();
        } else if (isNegative(cleanTranscript)) {
          playChime('retry');
          const restartAck = lang === "te" 
            ? "సరే, మళ్లీ మొదటి నుండి మొదలుపెడదాం." 
            : lang === "hi" 
            ? "ठीक है, फिर से शुरू करते हैं।" 
            : "Okay, let's start over.";
          askStep('NAME', restartAck);
        } else {
          playChime('retry');
          const retryMsg = getUnrecognizedAck('CONFIRM_SUBMIT', cleanTranscript);
          askStep('CONFIRM_SUBMIT', retryMsg);
        }
      }
    } catch (err) {
      console.error("Step processing error:", err);
      handleNoSpeechDetected(step);
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
    askStep('NAME');
  };

  const stopWizard = () => {
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
          </div>

          {wizardStep === 'IDLE' ? (
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", margin: "0.5rem 0" }}>
            {[
              { id: 'NAME', label: '1. Crop Name 🌾' },
              { id: 'QUANTITY', label: '2. Quantity ⚖️' },
              { id: 'PRICE', label: '3. Price 💰' },
              { id: 'CONFIRM_SUBMIT', label: '4. Ready ?' }
            ].map((s) => {
              const isCurrent = wizardStep === s.id;
              const isDone = 
                (s.id === 'NAME' && (wizardStep === 'QUANTITY' || wizardStep === 'PRICE' || wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'QUANTITY' && (wizardStep === 'PRICE' || wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'PRICE' && (wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'CONFIRM_SUBMIT' && wizardStep === 'COMPLETED');

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