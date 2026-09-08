import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, CheckCircle, PackagePlus, Mic, MicOff, PlayCircle, 
  Loader2, Volume2, RotateCcw, ArrowRight, Check, AlertCircle,
  MapPin, LocateFixed, Compass
} from 'lucide-react';
import API, { BASE_URL } from '../../api/api';
import LocationUpdateModal from '../../components/LocationUpdateModal';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { 
  playTTS, stopTTS, parseVoiceToFormMultilingual, 
  CROPS_MAP, CATEGORIES_MAP, UNITS_MAP, parseSpokenNumber 
} from '../../utils/voiceParser';
import { LANG_MAP } from '../../utils/useVoiceInput';

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
  const { lang } = useLang();
  
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
    longitude: user?.longitude || ''
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

  // Wizard States
  const [wizardStep, setWizardStep] = useState('IDLE'); // 'IDLE' | 'NAME' | 'QUANTITY' | 'PRICE' | 'COMPLETED'
  const [wizardMsg, setWizardMsg] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interim, setInterim] = useState("");
  const [lastHeard, setLastHeard] = useState("");
  const [filledFields, setFilledFields] = useState({});
  const [retryCount, setRetryCount] = useState(0);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const initialSilenceTimerRef = useRef(null);
  const wizardStepRef = useRef('IDLE');
  const formDataRef = useRef(formData);
  const capturedTextRef = useRef("");
  const hasUserSpokenRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);

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

  // Safe Speech Recognition Cleanup
  const stopRecognition = () => {
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

  // ─── Conversational Prompts & Acknowledgments in Indian Languages ───
  const getPromptForStep = (step, currentCrop = "", currentQty = "", currentUnit = "kg") => {
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
        te: `ఒక ${currentUnit} అమ్మకపు ధర ఎన్ని రూపాయలు? ఉదాహరణకు 40 రూపాయలు.`,
        hi: `प्रति ${currentUnit} आपकी बिक्री कीमत कितने रुपये है? जैसे 40 रुपये।`,
        ta: `ஒரு ${currentUnit} விற்பனை விலை எத்தனை ரூபாய்? உதாரணத்திற்கு 40 ரூபாய்.`,
        kn: `ಪ್ರತಿ ${currentUnit} ಗೆ ನಿಮ್ಮ ಮಾರಾಟದ ಬೆಲೆ ಎಷ್ಟು ರೂಪಾಯಿ? ಉದಾಹರಣೆಗೆ 40 ರೂಪಾಯಿ.`
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
        en: `Got it! Added ${val1} to your listing.`,
        te: `సరే! ${val1} అని తీసుకున్నాను.`,
        hi: `समझ गया! ${val1} जोड़ दिया गया है।`,
        ta: `புரிந்தது! ${val1} சேர்க்கப்பட்டது.`,
        kn: `ಅರ್ಥವಾಯಿತು! ${val1} ಸೇರಿಸಲಾಗಿದೆ.`
      },
      QUANTITY: {
        en: `Understood! Added ${val1} ${val2}.`,
        te: `సరే! ${val1} ${val2} నమోదు చేశాను.`,
        hi: `बढ़िया! ${val1} ${val2} दर्ज कर दिया गया।`,
        ta: `அருமை! ${val1} ${val2} சேர்க்கப்பட்டது.`,
        kn: `ಉತ್ತಮ! ${val1} ${val2} ಸೇರಿಸಲಾಗಿದೆ.`
      },
      PRICE: {
        en: `Perfect! Selling price set to ₹${val1} per ${val2}.`,
        te: `అద్భుతం! ధర ఒక ${val2}కి ₹${val1}గా నిర్ణయించాను.`,
        hi: `शानदार! प्रति ${val2} कीमत ₹${val1} तय कर दी गई।`,
        ta: `மிக நன்று! விலை ஒரு ${val2}க்கு ₹${val1} என அமைக்கப்பட்டது.`,
        kn: `ಅದ್ಭುತ! ಪ್ರತಿ ${val2} ಗೆ ₹${val1} ಬೆಲೆ ನಿಗದಿಪಡಿಸಲಾಗಿದೆ.`
      }
    };
    return acks[step]?.[lang] || acks[step]?.en || "";
  };

  const getSilenceRetryAck = (step) => {
    const retryAcks = {
      NAME: {
        en: "I didn't hear you. What crop do you want to sell? Please speak now.",
        te: "మీరు చెప్పింది వినపడలేదు. మీరు ఏ పంటను అమ్మాలనుకుంటున్నారు? దయచేసి మళ్లీ చెప్పండి.",
        hi: "आपकी आवाज़ नहीं आई। आप कौन सी फसल बेचना चाहते हैं? कृपया फिर से बोलें।",
        ta: "நீங்கள் பேசியது கேட்கவில்லை. என்ன பயிரை விற்க விரும்புகிறீர்கள்? மீண்டும் சொல்லுங்கள்.",
        kn: "ನಿಮ್ಮ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ದಯವಿಟ್ಟು ಮತ್ತೆ ಹೇಳಿ."
      },
      QUANTITY: {
        en: "I didn't hear the quantity. How much quantity do you have? For example, 50 kg.",
        te: "పరిమాణం వినపడలేదు. మీ వద్ద ఎంత పరిమాణం ఉంది? ఉదాహరణకు 50 కేజీలు అని చెప్పండి.",
        hi: "मात्रा सुनाई नहीं दी। आपके पास कितनी फसल है? जैसे 50 किलो बोलें।",
        ta: "அளவு கேட்கவில்லை. எவ்வளவு அளவு உள்ளது? உதாரணத்திற்கு 50 கிலோ என்று சொல்லுங்கள்.",
        kn: "ಪ್ರಮಾಣ ಕೇಳಿಸಲಿಲ್ಲ. ಎಷ್ಟು ಪ್ರಮಾಣವಿದೆ? ಉದಾಹರಣೆಗೆ 50 ಕೆಜಿ ಎಂದು ಹೇಳಿ."
      },
      PRICE: {
        en: "I didn't hear the price. What is the selling price in rupees? For example, 40.",
        te: "ధర వినపడలేదు. ఒక కేజీ ధర ఎన్ని రూపాయలు? ఉదాహరణకు 40 అని చెప్పండి.",
        hi: "कीमत सुनाई नहीं दी। कितने रुपये में बेचना चाहते हैं? जैसे 40 बोलें।",
        ta: "விலை கேட்கவில்லை. எத்தனை ரூபாய்க்கு விற்க விரும்புகிறீர்கள்? உதாரணத்திற்கு 40.",
        kn: "ಬೆಲೆ ಕೇಳಿಸಲಿಲ್ಲ. ಎಷ್ಟು ರೂಪಾಯಿಗೆ ಮಾರಾಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ಉದಾಹರಣೆಗೆ 40."
      }
    };
    return retryAcks[step]?.[lang] || retryAcks[step]?.en || "";
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
      }
    };
    return unrecAcks[step]?.[lang] || unrecAcks[step]?.en || "";
  };

  // ─── Step Transition: Speak Prompt & Open Mic ───
  const askStep = async (step, customPrefix = "") => {
    stopRecognition();
    stopTTS();

    setWizardStep(step);
    setInterim("");
    setIsProcessing(false);

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

    // Speak prompt aloud
    try {
      await playTTS(promptText, lang);
    } catch (e) {
      console.warn("TTS playback warning:", e);
    }

    setIsSpeaking(false);

    // After AI finishes speaking, open the mic for the farmer
    if (step !== 'COMPLETED' && wizardStepRef.current === step) {
      startListeningForStep(step);
    }
  };

  // ─── Start Listening for Farmer's Response ───
  const startListeningForStep = (step, silentRetryCount = 0) => {
    stopRecognition();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setWizardMsg("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Gentle pleasant chime to signal the farmer that mic is listening
    if (silentRetryCount === 0) playChime('start');

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Native VAD: stops automatically when user pauses
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[lang] || "en-IN";

    capturedTextRef.current = "";
    hasUserSpokenRef.current = false;
    setInterim("");
    setIsListening(true);
    let micStarted = Date.now();

    recognition.onstart = () => {
      setIsListening(true);
      setInterim("Listening... Please speak now 🎙️");
      micStarted = Date.now();
    };

    recognition.onresult = (event) => {
      hasUserSpokenRef.current = true;
      let currentText = "";
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript + " ";
      }
      currentText = currentText.trim();
      capturedTextRef.current = currentText;
      setInterim(currentText);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone permission was denied. Please allow microphone access.");
        stopWizard();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const textToProcess = capturedTextRef.current.trim();
      
      if (textToProcess && wizardStepRef.current === step && !isProcessingRef.current) {
        processStepInput(step, textToProcess);
      } else if (!textToProcess && wizardStepRef.current === step && !isSpeakingRef.current && !isProcessingRef.current) {
        // Prevent instant loop if recognition fails to start or dies immediately
        const elapsed = Date.now() - micStarted;
        if (elapsed < 1500 && silentRetryCount < 3) {
           console.warn("Recognition ended too quickly, retrying silently...");
           setTimeout(() => {
              if (wizardStepRef.current === step && !isProcessingRef.current && !isSpeakingRef.current) {
                 startListeningForStep(step, silentRetryCount + 1);
              }
           }, 500);
        } else if (elapsed >= 1500) {
           handleNoSpeechDetected(step);
        } else {
           setWizardMsg("Microphone access failed continuously. Please tap 'Tap to Speak' to try manually.");
        }
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

  // ─── Handle No Speech Detected: Acknowledge & Ask Again ───
  const handleNoSpeechDetected = (step) => {
    stopRecognition();
    playChime('retry');
    setRetryCount(prev => prev + 1);

    const retryMsg = getSilenceRetryAck(step);
    setWizardMsg(retryMsg);
    
    // Speak acknowledgment and re-prompt the farmer
    askStep(step, retryMsg);
  };

  // ─── Manual Controls ───
  const handleManualDoneSpeaking = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const handleManualTapToSpeak = () => {
    if (wizardStep !== 'IDLE' && wizardStep !== 'COMPLETED') {
      startListeningForStep(wizardStep);
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
    else if (wizardStep === 'PRICE') askStep('COMPLETED');
  };

  // ─── Process Input: Sense, Acknowledge, Add to Form, or Ask Again ───
  const processStepInput = async (step, transcript) => {
    if (!transcript) {
      handleNoSpeechDetected(step);
      return;
    }

    setIsProcessing(true);
    setLastHeard(transcript);
    setInterim("");
    stopRecognition();

    try {
      const lower = transcript.toLowerCase().trim();

      // ────────────────────────────────
      // STEP 1: CROP NAME
      // ────────────────────────────────
      if (step === 'NAME') {
        let extractedName = "";
        let extractedCategory = "";

        // 1. Check instant local dictionary across 100+ multi-lingual slang variants
        for (const [slang, stdName] of Object.entries(CROPS_MAP)) {
          const sLower = slang.toLowerCase();
          if (lower.includes(sLower) || lower.split(/\s+/).includes(sLower)) {
            extractedName = stdName;
            extractedCategory = CATEGORIES_MAP[stdName] || "vegetable";
            break;
          }
        }

        // 2. Fallback to API if not recognized locally
        if (!extractedName) {
          try {
            const res = await fetch(`${BASE_URL}/api/ai/parse-wizard-step`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step, transcript, lang })
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

        // If still could not extract a meaningful crop name (e.g. noise / random word)
        if (!extractedName && transcript.length > 2) {
          // Accept the capitalized transcript as direct produce name
          extractedName = transcript.charAt(0).toUpperCase() + transcript.slice(1);
          extractedCategory = "vegetable";
        }

        if (!extractedName) {
          // Could not recognize: Acknowledge & Ask Again!
          playChime('retry');
          const retryMsg = getUnrecognizedAck('NAME', transcript);
          askStep('NAME', retryMsg);
          return;
        }

        // SENSE SUCCEEDED: Add to Form & Give Success Acknowledgment!
        playChime('success');
        setFormData(prev => ({
          ...prev,
          name: extractedName,
          category: extractedCategory || prev.category
        }));
        formDataRef.current.name = extractedName;
        formDataRef.current.category = extractedCategory || formDataRef.current.category;
        setFilledFields(prev => ({ ...prev, name: true, category: true }));

        const ackMsg = getSuccessAck('NAME', extractedName);
        // Move to QUANTITY step with acknowledgment
        askStep('QUANTITY', ackMsg);
      }

      // ────────────────────────────────
      // STEP 2: QUANTITY
      // ────────────────────────────────
      else if (step === 'QUANTITY') {
        let extractedQty = null;
        let extractedUnit = "kg";

        // 1. Number extraction
        const numMatch = transcript.match(/\d+(?:\.\d+)?/);
        if (numMatch) {
          extractedQty = parseFloat(numMatch[0]);
        } else {
          const spoken = parseSpokenNumber(transcript);
          if (spoken && !isNaN(spoken)) extractedQty = parseFloat(spoken);
        }

        // Unit extraction in multi-lingual slangs
        for (const [unitKey, aliases] of Object.entries(UNITS_MAP)) {
          if (aliases.some(a => lower.includes(a.toLowerCase()))) {
            extractedUnit = unitKey === 'ton' ? 'tonne' : unitKey;
            break;
          }
        }

        // 2. Fallback to API if not recognized locally
        if (extractedQty === null) {
          try {
            const res = await fetch(`${BASE_URL}/api/ai/parse-wizard-step`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step, transcript, lang })
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
          // Could not extract quantity: Acknowledge & Ask Again!
          playChime('retry');
          const retryMsg = getUnrecognizedAck('QUANTITY', transcript);
          askStep('QUANTITY', retryMsg);
          return;
        }

        // SENSE SUCCEEDED: Add to Form & Acknowledge!
        playChime('success');
        setFormData(prev => ({
          ...prev,
          quantity: extractedQty,
          unit: extractedUnit
        }));
        formDataRef.current.quantity = extractedQty;
        formDataRef.current.unit = extractedUnit;
        setFilledFields(prev => ({ ...prev, quantity: true, unit: true }));

        const ackMsg = getSuccessAck('QUANTITY', extractedQty, extractedUnit);
        // Move to PRICE step with acknowledgment
        askStep('PRICE', ackMsg);
      }

      // ────────────────────────────────
      // STEP 3: PRICE
      // ────────────────────────────────
      else if (step === 'PRICE') {
        let extractedPrice = null;

        // 1. Number extraction
        const numMatch = transcript.match(/\d+(?:\.\d+)?/);
        if (numMatch) {
          extractedPrice = parseFloat(numMatch[0]);
        } else {
          const spoken = parseSpokenNumber(transcript);
          if (spoken && !isNaN(spoken)) extractedPrice = parseFloat(spoken);
        }

        // 2. Fallback to API if not recognized locally
        if (extractedPrice === null) {
          try {
            const res = await fetch(`${BASE_URL}/api/ai/parse-wizard-step`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step, transcript, lang })
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
          // Could not extract price: Acknowledge & Ask Again!
          playChime('retry');
          const retryMsg = getUnrecognizedAck('PRICE', transcript);
          askStep('PRICE', retryMsg);
          return;
        }

        // SENSE SUCCEEDED: Add to Form & Acknowledge!
        playChime('success');
        setFormData(prev => ({
          ...prev,
          price: extractedPrice
        }));
        formDataRef.current.price = extractedPrice;
        setFilledFields(prev => ({ ...prev, price: true }));

        const ackMsg = getSuccessAck('PRICE', extractedPrice, formDataRef.current.unit || 'kg');
        // Move to COMPLETED step with acknowledgment
        askStep('COMPLETED', ackMsg);
      }
    } catch (err) {
      console.error("Step processing error:", err);
      handleNoSpeechDetected(step);
    } finally {
      setIsProcessing(false);
    }
  };

  const startWizard = async () => {
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
    stopRecognition();
    stopTTS();
    setWizardStep('IDLE');
    setWizardMsg("");
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessing(false);
    setInterim("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMsg("You must be logged in to add a crop.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData, farmer: user._id };
      await API.post('/crops/add', payload);
      setMsg(`Successfully listed ${formData.name} for sale!`);
      setFormData({
        name: '', category: 'vegetable', price: '', quantity: '', unit: 'kg', description: '', isOrganic: false,
        location: user?.location || '', farmLocation: user?.farmName || user?.location || '',
        latitude: user?.latitude || '', longitude: user?.longitude || ''
      });
      setFilledFields({});
      
      const successMsg = {
        en: `Successfully listed ${formData.name} for sale!`,
        te: `${formData.name} అమ్మకానికి విజయవంతంగా ఉంచబడింది!`,
        hi: `${formData.name} को बिक्री के लिए सफलतापूर्वक सूचीबद्ध किया गया!`
      };
      playTTS(successMsg[lang] || successMsg.en, lang);
    } catch (err) {
      setMsg("Failed to list item. Ensure all fields are valid.");
    }
    setLoading(false);
  };

  return (
    <div className="page-wrapper fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <PackagePlus size={32} color="#16a34a" />
        <h1 className="page-title" style={{ margin: 0 }}>List Produce or Byproducts</h1>
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
              { id: 'COMPLETED', label: '4. Ready ✅' }
            ].map((s) => {
              const isCurrent = wizardStep === s.id;
              const isDone = 
                (s.id === 'NAME' && (wizardStep === 'QUANTITY' || wizardStep === 'PRICE' || wizardStep === 'COMPLETED')) ||
                (s.id === 'QUANTITY' && (wizardStep === 'PRICE' || wizardStep === 'COMPLETED')) ||
                (s.id === 'PRICE' && wizardStep === 'COMPLETED') ||
                (s.id === 'COMPLETED' && wizardStep === 'COMPLETED');

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
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. Tomato, Rice, Cotton, Hay Bales, Cow Dung Slurry" 
              className="form-input" 
              required 
              style={{ width: '100%', fontSize: '1rem' }}
            />
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
              <input 
                type="number" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleChange} 
                placeholder={`e.g. 50 ${formData.unit}`} 
                className="form-input" 
                required 
                min="1" 
                style={{ width: '100%' }}
              />
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
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                placeholder="e.g. 40" 
                className="form-input" 
                required 
                min="1" 
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Fresh harvest from farm, organic soil, high quality." 
              className="form-input" 
              style={{ minHeight: '80px', resize: 'vertical', width: '100%' }}
            ></textarea>
          </div>

          {/* Organic / Pesticide Free */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--green-pale)', padding: '1rem', borderRadius: '10px', cursor: 'pointer' }}>
            <input type="checkbox" name="isOrganic" checked={formData.isOrganic} onChange={handleChange} style={{ width: '20px', height: '20px' }} /> 
            <span style={{ fontWeight: 600, color: 'var(--green-deep)' }}>This product is Certified Organic / Pesticide-Free (సేంద్రీయ పంట)</span>
          </label>

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
              style={{ width: "100%", fontSize: "0.95rem" }}
            />

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