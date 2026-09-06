import { useState, useCallback, useRef } from "react";
import { useLang } from "../context/LangContext";

export const LANG_MAP = {
  en: "en-IN", te: "te-IN", hi: "hi-IN", kn: "kn-IN", ta: "ta-IN",
  ml: "ml-IN", mr: "mr-IN", gu: "gu-IN", bn: "bn-IN", pa: "pa-IN",
  or: "or-IN", as: "as-IN", ur: "ur-PK",
};

export function useVoiceInput(lang = "en") {
  const [listening, setListening] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [interim, setInterim] = useState("");
  
  const recognitionRef = useRef(null);
  const onResultRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const optionsRef = useRef({});

  const latestTextRef = useRef("");

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const dispatchResult = useCallback((text) => {
    const trimmed = (text || "").trim();
    if (trimmed && onResultRef.current) {
      try {
        const callback = onResultRef.current;
        onResultRef.current = null; // prevent double dispatch
        callback(trimmed);
      } catch (err) {
        console.error("Error in onResult callback:", err);
      }
    }
    finalTranscriptRef.current = "";
    latestTextRef.current = "";
    setInterim("");
  }, []);

  const stopListening = useCallback((forceCancel = false) => {
    clearSilenceTimer();
    const captured = latestTextRef.current.trim() || finalTranscriptRef.current.trim();
    if (!forceCancel && captured && isListeningRef.current) {
      dispatchResult(captured);
    }
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.abort(); 
      } catch(e) {}
    }
    setListening(false);
    setActiveField(null);
    setInterim("");
  }, [dispatchResult]);

  const startListening = useCallback((onResult, options = {}) => {
    stopListening(true);
    
    onResultRef.current = onResult;
    optionsRef.current = options;
    setActiveField(options.fieldId || "default");
    setInterim(options.initialInterim || "Listening...");
    
    isListeningRef.current = true;
    setListening(true);
    finalTranscriptRef.current = "";
    latestTextRef.current = "";

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      stopListening();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[lang] || "en-IN";

    const silenceDelay = options.silenceDelay || 1400;

    const triggerSilenceTimeout = () => {
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        if (!isListeningRef.current) return;
        const captured = latestTextRef.current.trim() || finalTranscriptRef.current.trim();
        if (captured) {
          stopListening();
          dispatchResult(captured);
        }
      }, silenceDelay);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let newFinal = "";
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          newFinal += " " + item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }
      
      if (newFinal) {
        finalTranscriptRef.current = (finalTranscriptRef.current + " " + newFinal).trim();
      }
      
      const currentFullText = (finalTranscriptRef.current + " " + interimTranscript).trim();
      latestTextRef.current = currentFullText;
      
      setInterim(currentFullText || "Listening...");

      if (options.onInterim) {
        options.onInterim(currentFullText);
      }

      // Reset silence timer whenever user speaks
      triggerSilenceTimeout();
    };

    recognition.onend = () => {
      clearSilenceTimer();
      const captured = latestTextRef.current.trim() || finalTranscriptRef.current.trim();
      if (captured && isListeningRef.current) {
        stopListening();
        dispatchResult(captured);
      } else if (isListeningRef.current && optionsRef.current.continuous) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch(e) {}
          }
        }, 200);
      } else {
        setListening(false);
        setActiveField(null);
        setInterim("");
        if (optionsRef.current.onEnd) {
          optionsRef.current.onEnd();
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow microphone permissions.");
        stopListening();
      } else if (event.error !== 'no-speech') {
        console.warn("Speech recognition notice:", event.error);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      if (err.name !== 'InvalidStateError') {
        console.warn("Could not start microphone:", err.message);
      }
    }
  }, [lang, stopListening, dispatchResult]);

  // Helper to listen for a single turn with Promise
  const listenOnce = useCallback((options = {}) => {
    return new Promise((resolve) => {
      startListening((text) => {
        resolve(text);
      }, { ...options, continuous: false });
    });
  }, [startListening]);

  return { listening, activeField, interim, startListening, stopListening, listenOnce };
}

