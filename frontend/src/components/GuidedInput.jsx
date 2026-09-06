import React, { useState, useRef } from 'react';
import { Mic, Volume2, Sparkles, Check } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { parseSpokenNumber, playTTS, stopTTS } from '../utils/voiceParser';
import { LANG_MAP } from '../utils/useVoiceInput';

export default function GuidedInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  rows = 3,
  badge = null,
  options = null,
  helperText = null,
  onSpeechResult = null
}) {
  const { lang } = useLang();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const silenceTimerRef = useRef(null);
  const latestTranscriptRef = useRef("");
  const recognitionRef = useRef(null);
  
  const commitResult = (text) => {
    if (!text || !text.trim()) return;
    let cleanVal = text.trim();
    if (type === "number") {
      cleanVal = parseSpokenNumber(cleanVal);
    }
    
    if (options && Array.isArray(options)) {
      const match = options.find(opt => {
        const optVal = typeof opt === "object" ? opt.value : opt;
        const optLabel = typeof opt === "object" ? opt.label : opt;
        return cleanVal.toLowerCase().includes(String(optVal).toLowerCase()) || cleanVal.toLowerCase().includes(String(optLabel).toLowerCase());
      });
      if (match) {
        cleanVal = typeof match === "object" ? match.value : match;
      }
    }

    let finalVal = cleanVal;
    if (!options && type !== "number" && value) {
      finalVal = `${value} ${cleanVal}`.trim();
    }

    if (onSpeechResult) {
      onSpeechResult(finalVal);
    } else if (onChange) {
      onChange({ target: { value: finalVal, type } });
    }
    setIsListening(false);
    setInterimText("");
    latestTranscriptRef.current = "";
    try { recognitionRef.current?.stop(); } catch(e) {}
  };

  const startSTT = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Microphone is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    
    stopTTS();
    const recognition = new SpeechRec();
    recognitionRef.current = recognition;
    recognition.lang = LANG_MAP[lang] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("Listening...");
      latestTranscriptRef.current = "";
    };

    recognition.onresult = (e) => {
      let finalTranscript = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      const combined = finalTranscript || interim;
      latestTranscriptRef.current = combined;
      setInterimText(combined || "Listening...");
      
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (latestTranscriptRef.current) {
          commitResult(latestTranscriptRef.current);
        }
      }, 1200);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      if (latestTranscriptRef.current) {
        commitResult(latestTranscriptRef.current);
      } else {
        setIsListening(false);
        setInterimText("");
      }
    };

    try {
      recognition.start();
    } catch(err) {
      setIsListening(false);
    }
  };
  
  const handleSpeakerClick = (e) => {
    e.preventDefault();
    let textToSpeak = `${label}. `;
    if (helperText) textToSpeak += `${helperText}. `;
    if (value) {
      textToSpeak += `Current value is ${value}.`;
    } else {
      textToSpeak += `Please tap the microphone and speak your answer.`;
    }
    playTTS(textToSpeak, lang);
  };

  const handleMicClick = (e) => {
    e.preventDefault();
    if (isListening) {
      if (latestTranscriptRef.current) {
        commitResult(latestTranscriptRef.current);
      } else {
        setIsListening(false);
        setInterimText("");
        try { recognitionRef.current?.abort(); } catch(e) {}
      }
      return;
    }
    startSTT();
  };

  return (
    <div className="form-group" style={{ marginBottom: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
        <label className="field-label" style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {label}
          {badge && (
            <span style={{ fontSize: "0.75rem", background: "rgba(34, 197, 94, 0.15)", color: "var(--green-deep)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
              {badge}
            </span>
          )}
        </label>

        {/* Dual Voice Action Hub: Read Aloud + Speak Into Field */}
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button 
            type="button"
            onClick={handleSpeakerClick}
            style={{ 
              background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "8px", 
              width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", 
              cursor: "pointer", color: "#60a5fa",
              transition: "all 0.2s"
            }}
            title="🔊 Hear explanation in your language"
          >
            <Volume2 size={16} />
          </button>
          
          <button 
            type="button"
            onClick={handleMicClick}
            style={{ 
              background: isListening ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.15)", 
              border: "1px solid", borderColor: isListening ? "#ef4444" : "rgba(34, 197, 94, 0.4)",
              borderRadius: "8px", 
              padding: "0 8px",
              height: "32px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
              cursor: "pointer", color: isListening ? "#ef4444" : "#22c55e",
              boxShadow: isListening ? "0 0 12px rgba(239, 68, 68, 0.5)" : "none",
              fontWeight: 600, fontSize: "0.75rem",
              transition: "all 0.2s"
            }}
            title="🎙️ Speak into this field"
          >
            <Mic size={15} className={isListening ? "animate-pulse" : ""} />
            {isListening ? "Listening..." : "Speak"}
          </button>
        </div>
      </div>
      
      {helperText && (
        <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {helperText}
        </p>
      )}

      {/* Select Dropdown mode */}
      {options ? (
        <div style={{ position: "relative" }}>
          <select
            className="rs-select"
            value={value || ""}
            onChange={onChange}
            style={isListening ? { borderColor: "#22c55e", boxShadow: "0 0 8px rgba(34, 197, 94, 0.4)" } : {}}
          >
            {options.map((opt) => {
              const val = typeof opt === "object" ? opt.value : opt;
              const lbl = typeof opt === "object" ? opt.label : opt;
              return <option key={val} value={val}>{lbl}</option>;
            })}
          </select>
          {isListening && (
            <div style={{ position: "absolute", right: "30px", top: "50%", transform: "translateY(-50%)", fontSize: "0.75rem", color: "#22c55e", fontWeight: 600 }}>
              🎤 {interimText || "Speak choice..."}
            </div>
          )}
        </div>
      ) : type === "textarea" ? (
        <div style={{ position: "relative" }}>
          <textarea
            className="rs-input"
            value={isListening && interimText ? `${value ? value + " " : ""}${interimText}` : value}
            onChange={onChange}
            placeholder={isListening ? "🎤 Listening... Speak details freely" : placeholder}
            rows={rows}
            style={isListening ? { borderColor: "#22c55e", boxShadow: "0 0 10px rgba(34, 197, 94, 0.35)", fontStyle: "italic", background: "rgba(34, 197, 94, 0.04)" } : {}}
          />
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input
            type={type}
            className="rs-input"
            value={isListening && interimText ? `${value ? value + " " : ""}${interimText}` : value}
            onChange={onChange}
            placeholder={isListening ? "🎤 Listening to your voice..." : placeholder}
            style={isListening ? { borderColor: "#22c55e", boxShadow: "0 0 10px rgba(34, 197, 94, 0.35)", fontStyle: "italic", background: "rgba(34, 197, 94, 0.04)" } : {}}
          />
        </div>
      )}
    </div>
  );
}
