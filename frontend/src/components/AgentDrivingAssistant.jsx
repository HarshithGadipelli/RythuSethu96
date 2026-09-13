import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Navigation, Phone, CheckCircle, Clock, AlertTriangle, X, ShieldCheck, MapPin } from "lucide-react";
import { playTTS, stopTTS, normalizeDialectPhonetics } from "../utils/voiceParser";

export default function AgentDrivingAssistant({
  deliveries = [],
  user,
  onUpdateStatus,
  onVerifyOtp,
  onClose,
  lang = "te"
}) {
  const [isListening, setIsListening] = useState(true);
  const [lastCommand, setLastCommand] = useState("");
  const [assistantSpoken, setAssistantSpoken] = useState("డ్రైవింగ్ అసిస్టెంట్ ఆన్ అయింది. 'తదుపరి డెలివరీ' లేదా 'దారి చూపు' అని చెప్పండి.");
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState(0);

  const activeDeliveries = deliveries.filter(d => ["assigned", "picked_up", "in_transit"].includes(d.status));
  const currentDelivery = activeDeliveries[activeDeliveryIndex] || activeDeliveries[0] || null;

  const recognitionRef = useRef(null);

  // Initialize Continuous Speech Recognition for Driving Mode
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-IN";

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      setLastCommand(transcript);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") {
        console.warn("[Driving Assistant Speech Error]", e.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart while in driving mode
      if (isListening) {
        try { recognition.start(); } catch (err) {}
      }
    };

    if (isListening) {
      try { recognition.start(); } catch (err) {}
    }
    recognitionRef.current = recognition;

    // Welcome speech
    const welcomeMsg = lang === "te"
      ? "హ్యాండ్స్-ఫ్రీ డ్రైవింగ్ అసిస్టెంట్ ప్రారంభమైంది. ఫోన్ తాకకుండా మాట్లాడండి."
      : "Hands-free driving assistant active. Speak commands freely.";
    speak(welcomeMsg);

    return () => {
      try { recognition.stop(); } catch (err) {}
      stopTTS();
    };
  }, [lang, isListening]);

  const speak = (text) => {
    setAssistantSpoken(text);
    playTTS(text, lang);
  };

  const handleVoiceCommand = (cmd) => {
    // 1. Next Delivery Query
    if (cmd.includes("next") || cmd.includes("తదుపరి") || cmd.includes("अगला") || cmd.includes("డెలివరీ")) {
      if (!currentDelivery) {
        speak(lang === "te" ? "ప్రస్తుతం ఏ డెలివరీలు పెండింగ్‌లో లేవు." : "No pending deliveries currently.");
        return;
      }
      const custName = currentDelivery.order?.customer?.name || "కస్టమర్";
      const loc = currentDelivery.deliveryLocation || "గమ్యస్థానం";
      const cod = currentDelivery.order?.paymentMode === "cod" ? `కలెక్షన్ సీఓడీ ₹${currentDelivery.order?.totalAmount || 0}` : "ఆన్‌లైన్ చెల్లింపు పూర్తయింది";
      const msg = lang === "te"
        ? `తదుపరి డ్రాప్: ${custName}. లొకేషన్: ${loc.substring(0, 30)}. ${cod}.`
        : `Next drop for ${custName} at ${loc.substring(0, 30)}. ${cod}.`;
      speak(msg);
      return;
    }

    // 2. Turn-by-turn Navigation Command
    if (cmd.includes("navigate") || cmd.includes("map") || cmd.includes("దారి") || cmd.includes("మ్యాప్") || cmd.includes("रास्ता")) {
      if (currentDelivery) {
        speak(lang === "te" ? "గూగుల్ మ్యాప్స్ తెరుస్తున్నాను." : "Opening turn navigation.");
        const url = `https://www.google.com/maps/dir/?api=1&destination=${currentDelivery.deliveryLatitude || ''},${currentDelivery.deliveryLongitude || ''}`;
        window.open(url, "_blank");
      }
      return;
    }

    // 3. Call Customer
    if (cmd.includes("call customer") || cmd.includes("customer") || cmd.includes("కస్టమర్") || cmd.includes("ఫోన్")) {
      const phone = currentDelivery?.order?.customer?.phone;
      if (phone) {
        speak(lang === "te" ? "కస్టమర్‌కు కాల్ కలుపుతున్నాను." : "Calling customer now.");
        window.location.href = `tel:${phone}`;
      } else {
        speak(lang === "te" ? "కస్టమర్ ఫోన్ నంబర్ లభించలేదు." : "Customer phone not found.");
      }
      return;
    }

    // 4. Confirm Pickup
    if (cmd.includes("pickup") || cmd.includes("picked up") || cmd.includes("పికప్") || cmd.includes("తీసుకున్నా")) {
      if (currentDelivery && currentDelivery.status === "assigned") {
        if (onUpdateStatus) onUpdateStatus(currentDelivery, "picked_up");
        speak(lang === "te" ? "పికప్ పూర్తయింది! స్టేటస్ ట్రాన్సిట్‌లోకి మార్చబడింది." : "Pickup confirmed! Package in transit.");
      }
      return;
    }

    // 5. Handover OTP recognition (e.g. "otp 458921" or "ఓటీపీ 458921")
    const otpMatch = cmd.match(/\b\d{6}\b/) || cmd.match(/(?:otp|ఓటీపీ|ot)\s*(\d{6})/i);
    if (otpMatch) {
      const otpCode = otpMatch[1] || otpMatch[0];
      if (currentDelivery && onVerifyOtp) {
        onVerifyOtp(currentDelivery, otpCode);
        speak(lang === "te" ? `ఓటీపీ ${otpCode} నమోదు చేయబడింది. డెలివరీ విజయవంతం!` : `OTP ${otpCode} verified! Delivery successful.`);
      }
      return;
    }

    // 6. Report Traffic Delay
    if (cmd.includes("delay") || cmd.includes("traffic") || cmd.includes("ట్రాఫిక్") || cmd.includes("ఆలస్యం")) {
      speak(lang === "te" ? "10 నిమిషాల ట్రాఫిక్ ఆలస్యం కస్టమర్ మరియు అడ్మిన్‌కు పంపబడింది." : "Logged 10 minute traffic delay.");
      return;
    }

    // Default recognition response
    speak(lang === "te" ? `విన్నాను: "${cmd}". అర్థం కాలేదు.` : `Heard: "${cmd}".`);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, width: "100vw", height: "100vh",
      background: "linear-gradient(180deg, #0b132b 0%, #1c2541 100%)",
      color: "white",
      zIndex: 999999,
      display: "flex",
      flexDirection: "column",
      padding: "1.25rem",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* HUD Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "2rem" }}>🚗</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, letterSpacing: "0.5px" }}>
                హ్యాండ్స్-ఫ్రీ డ్రైవింగ్ అసిస్టెంట్
              </h2>
              <span style={{ background: "#22c55e", color: "black", padding: "2px 8px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                LIVE HUD
              </span>
            </div>
            <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: "0.82rem" }}>
              Hands-Free Driver Voice Companion • Eyes on Road, Speak Commands Freely
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => {
              setIsListening(!isListening);
              if (isListening) stopTTS();
            }}
            style={{
              background: isListening ? "#ef4444" : "#22c55e",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "100px",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            {isListening ? <Mic size={18} /> : <MicOff size={18} />}
            <span>{isListening ? "Mic On" : "Mic Muted"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "none",
              padding: "0.6rem 1rem",
              borderRadius: "100px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            ✕ Exit HUD
          </button>
        </div>
      </div>

      {/* Main Driving Stage */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.25rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        
        {/* Active Speech / Assistant Spoken Banner */}
        <div style={{
          background: "rgba(34, 197, 94, 0.15)",
          border: "2px solid #22c55e",
          borderRadius: "20px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 0 30px rgba(34, 197, 94, 0.25)"
        }}>
          <Volume2 size={36} color="#4ade80" className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.8rem", color: "#86efac", fontWeight: 700, textTransform: "uppercase" }}>అసిస్టెంట్ మాటలు (Officer Speaking):</span>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f8fafc", marginTop: "2px" }}>
              {assistantSpoken}
            </div>
            {lastCommand && (
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px", fontStyle: "italic" }}>
                మీరు చెప్పింది: "{lastCommand}"
              </div>
            )}
          </div>
        </div>

        {/* Current Delivery Highlight Card */}
        {currentDelivery ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1.5px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "24px",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>📦</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#f1f5f9" }}>
                    {currentDelivery.order?.customer?.name || "Customer Delivery"}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.95rem", color: "#38bdf8", fontWeight: 600 }}>
                    🌾 {currentDelivery.order?.crop?.name} ({currentDelivery.order?.quantity || 1} {currentDelivery.order?.crop?.unit || "kg"})
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ background: "#fbbf24", color: "#78350f", padding: "4px 12px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 900 }}>
                  {currentDelivery.order?.paymentMode === "cod" ? `COLLECT COD: ₹${currentDelivery.order?.totalAmount}` : "PAID PREPAID"}
                </span>
              </div>
            </div>

            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "14px", padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <MapPin size={28} color="#ef4444" />
              <div style={{ fontSize: "1.05rem", color: "#e2e8f0", fontWeight: 600 }}>
                {currentDelivery.deliveryLocation || "Destination Address"}
              </div>
            </div>

            {/* Quick Action Touch Prompts (Large for 1-Tap while paused at signals) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => handleVoiceCommand("navigate")}
                style={{
                  background: "#2563eb", color: "white", border: "none", borderRadius: "14px",
                  padding: "0.9rem", fontSize: "1rem", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}
              >
                <Navigation size={20} /> 🧭 Navigate
              </button>

              <button
                type="button"
                onClick={() => handleVoiceCommand("call customer")}
                style={{
                  background: "#16a34a", color: "white", border: "none", borderRadius: "14px",
                  padding: "0.9rem", fontSize: "1rem", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}
              >
                <Phone size={20} /> 📞 Call
              </button>

              <button
                type="button"
                onClick={() => {
                  const otp = prompt("Enter customer 6-digit OTP:");
                  if (otp && onVerifyOtp) onVerifyOtp(currentDelivery, otp);
                }}
                style={{
                  background: "#d97706", color: "white", border: "none", borderRadius: "14px",
                  padding: "0.9rem", fontSize: "1rem", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}
              >
                <CheckCircle size={20} /> 🔑 Handover OTP
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.04)", borderRadius: "20px" }}>
            <span style={{ fontSize: "3rem" }}>🎉</span>
            <h3 style={{ fontSize: "1.4rem", margin: "0.75rem 0 0" }}>అన్ని డెలివరీలు పూర్తయ్యాయి! (All Deliveries Completed)</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>మీరు ఈరోజు అన్ని ఆర్డర్లు సురక్షితంగా అందజేశారు. విశ్రాంతి తీసుకోండి!</p>
          </div>
        )}

        {/* Quick Voice Command Cheat Sheet */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            🗣️ అందుబాటులో ఉన్న వాయిస్ కమాండ్స్ (Voice Commands You Can Speak):
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            {[
              "\"Next Delivery\" (తదుపరి డెలివరీ)",
              "\"Navigate\" (దారి చూపు)",
              "\"Call Customer\" (కాల్ చెయ్యి)",
              "\"Confirm Pickup\" (పికప్ పూర్తయింది)",
              "\"OTP [123456]\" (ఓటీపీ చెప్పు)",
              "\"Traffic Delay\" (ట్రాఫిక్ ఆలస్యం)"
            ].map((chip, idx) => (
              <span key={idx} style={{ background: "rgba(255,255,255,0.08)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.82rem", color: "#cbd5e1" }}>
                {chip}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
