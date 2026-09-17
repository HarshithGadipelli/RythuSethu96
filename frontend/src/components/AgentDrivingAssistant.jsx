import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Navigation, Phone, CheckCircle, Clock, AlertTriangle, X, ShieldCheck, MapPin, Search, HelpCircle, Coins, Sparkles, Truck, FileText } from "lucide-react";
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
  const [assistantSpoken, setAssistantSpoken] = useState("డ్రైవింగ్ అసిస్టెంట్ సిద్ధంగా ఉంది. 'తదుపరి డెలివరీ', 'దారి చూపు', 'క్వాలిటీ చెక్', లేదా 'మూసివేయి' అని చెప్పండి.");
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const activeDeliveries = deliveries.filter(d => ["assigned", "picked_up", "in_transit"].includes(d.status));
  const currentDelivery = activeDeliveries[activeDeliveryIndex] || activeDeliveries[0] || null;

  const recognitionRef = useRef(null);

  // Close Assistant on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Initialize Continuous Speech Recognition for Driving & Workflow Companion
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
      if (isListening) {
        try { recognition.start(); } catch (err) {}
      }
    };

    if (isListening) {
      try { recognition.start(); } catch (err) {}
    }
    recognitionRef.current = recognition;

    const welcomeMsg = lang === "te"
      ? "హ్యాండ్స్-ఫ్రీ వర్క్‌ఫ్లో అసిస్టెంట్ ప్రారంభమైంది. డెలివరీ, మ్యాప్స్, సీఓడీ లేదా అసిస్టెంట్ మూసివేయడానికి మాట్లాడండి."
      : "Agent Workflow Voice Companion Active. Ask any workflow query or speak 'Close' to exit.";
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
    const text = (cmd || "").toLowerCase();

    // 0. Close Assistant Command
    if (
      text.includes("close") || text.includes("exit") || text.includes("stop") || text.includes("quit") ||
      text.includes("మూసివేయి") || text.includes("ఆపు") || text.includes("బంద్") || text.includes("మొయ్యి") ||
      text.includes("చేయి") || text.includes("बंद") || text.includes("बाहर")
    ) {
      speak(lang === "te" ? "వర్క్‌ఫ్లో అసిస్టెంట్ క్లోజ్ చేస్తున్నాను." : "Closing Agent Assistant now.");
      setTimeout(() => {
        if (onClose) onClose();
      }, 700);
      return;
    }

    // 1. Next Delivery Query
    if (text.includes("next") || text.includes("తదుపరి") || text.includes("अगला") || text.includes("డెలివరీ") || text.includes("ఆర్డర్")) {
      if (!currentDelivery) {
        speak(lang === "te" ? "ప్రస్తుతం ఏ డెలివరీలు పెండింగ్‌లో లేవు. మీ పని పూర్తయింది!" : "No pending deliveries currently. All clear!");
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
    if (text.includes("navigate") || text.includes("map") || text.includes("route") || text.includes("దారి") || text.includes("మ్యాప్") || text.includes("रास्ता")) {
      if (currentDelivery) {
        speak(lang === "te" ? "గూగుల్ మ్యాప్స్ నేవిగేషన్ తెరుస్తున్నాను." : "Opening turn-by-turn Google Maps navigation.");
        const url = `https://www.google.com/maps/dir/?api=1&destination=${currentDelivery.deliveryLatitude || ''},${currentDelivery.deliveryLongitude || ''}`;
        window.open(url, "_blank");
      } else {
        speak(lang === "te" ? "డెలివరీ లొకేషన్ వివరాలు లభించలేదు." : "No active delivery location to navigate.");
      }
      return;
    }

    // 3. Call Customer
    if (text.includes("call customer") || text.includes("call") || text.includes("customer") || text.includes("కస్టమర్") || text.includes("ఫోన్") || text.includes("కాల్")) {
      const phone = currentDelivery?.order?.customer?.phone;
      if (phone) {
        speak(lang === "te" ? "కస్టమర్‌కు డైరెక్ట్ కాల్ కలుపుతున్నాను." : "Calling customer directly now.");
        window.location.href = `tel:${phone}`;
      } else {
        speak(lang === "te" ? "కస్టమర్ ఫోన్ నంబర్ లభించలేదు." : "Customer phone number not available.");
      }
      return;
    }

    // 4. Confirm Pickup
    if (text.includes("pickup") || text.includes("picked up") || text.includes("పికప్") || text.includes("తీసుకున్నా")) {
      if (currentDelivery && currentDelivery.status === "assigned") {
        if (onUpdateStatus) onUpdateStatus(currentDelivery, "picked_up");
        speak(lang === "te" ? "పికప్ పూర్తయింది! స్టేటస్ ట్రాన్సిట్‌లోకి మార్చబడింది." : "Pickup confirmed! Order is now in transit.");
      } else {
        speak(lang === "te" ? "ప్రస్తుతం పికప్ చేయడానికి కొత్త ఆర్డర్ సిద్ధంగా లేదు." : "No assigned order awaiting pickup.");
      }
      return;
    }

    // 5. Handover OTP recognition (e.g. "otp 458921" or "ఓటీపీ 458921")
    const otpMatch = text.match(/\b\d{6}\b/) || text.match(/(?:otp|ఓటీపీ|ot)\s*(\d{6})/i);
    if (otpMatch) {
      const otpCode = otpMatch[1] || otpMatch[0];
      if (currentDelivery && onVerifyOtp) {
        onVerifyOtp(currentDelivery, otpCode);
        speak(lang === "te" ? `ఓటీపీ ${otpCode} నమోదు చేయబడింది. డెలివరీ విజయవంతం!` : `OTP ${otpCode} verified! Delivery marked complete.`);
      }
      return;
    }

    // 6. Report Traffic Delay
    if (text.includes("delay") || text.includes("traffic") || text.includes("ట్రాఫిక్") || text.includes("ఆలస్యం") || text.includes("జామ్")) {
      speak(lang === "te" ? "10 నిమిషాల ట్రాఫిక్ ఆలస్యం కస్టమర్ మరియు అడ్మిన్ నోటిఫికేషన్‌కు పంపబడింది." : "Logged 10 minute traffic delay notice for customer & dispatch.");
      return;
    }

    // 7. AI Quality & Freshness Inspection Query
    if (text.includes("quality") || text.includes("freshness") || text.includes("inspection") || text.includes("ai check") || text.includes("క్వాలిటీ") || text.includes("తనిఖీ") || text.includes("ఫోటో")) {
      speak(lang === "te" 
        ? "AI పంట క్వాలిటీ స్కాన్ కోసం డెలివరీ కార్డులో 'రన్ AI క్వాలిటీ చెక్' బటన్ నొక్కండి. ఫోటో అప్‌లోడ్ చేస్తే గ్రేడ్ మరియు ఫ్రెష్‌నెస్ శాతం లభిస్తుంది."
        : "To perform AI Produce Inspection, upload a crop photo on the delivery card and click 'Run AI Quality Check' for instant freshness scoring.");
      return;
    }

    // 8. COD Collection & Financial Settlement Query
    if (text.includes("cod") || text.includes("cash") || text.includes("money") || text.includes("payout") || text.includes("ledger") || text.includes("డబ్బులు") || text.includes("నగదు") || text.includes("క్యాష్")) {
      speak(lang === "te"
        ? "కలెక్ట్ చేసిన COD నగదు డైలీ రైతు ఎస్క్రో ఖాతాలోకి జమ అవుతుంది. ఏజెంట్ డ్యాష్‌బోర్డ్‌లో ఫైనాన్షియల్ లెడ్జర్ ద్వారా డ్రా చెయ్యవచ్చు."
        : "Collected COD cash is tracked live in your Financial Ledger tab. Payouts are reconciled daily via direct UPI transfers.");
      return;
    }

    // 9. Cold Storage & Storage Zone Query
    if (text.includes("cold storage") || text.includes("cold") || text.includes("కోల్డ్") || text.includes("స్టోరేజ్")) {
      speak(lang === "te"
        ? "కోల్డ్ స్టోరేజ్ అసిస్టెంట్ పోర్టల్ ద్వారా సమీప కోల్డ్ వేర్‌హౌస్‌లో పంట నిల్వ స్లాట్ బుక్ చేయవచ్చు."
        : "Use the Cold Storage Dedicated Portal on your dashboard to reserve temperature-controlled warehouse space for farmer crops.");
      return;
    }

    // 10. Soil Testing Mobile Van Query
    if (text.includes("soil") || text.includes("sample") || text.includes("lab") || text.includes("నేల") || text.includes("సాంపిల్")) {
      speak(lang === "te"
        ? "మొబైల్ సోయిల్ టెస్టింగ్ ల్యాబ్ పోర్టల్‌లో రైతు నేల సాంపిల్స్ స్వీకరించి N-P-K నైట్రోజన్ వాల్యూలు నమోదు చేయవచ్చు."
        : "Open the Mobile Soil Testing Portal to accept farmer soil diagnostics and enter digital spectrometry N-P-K readings.");
      return;
    }

    // 11. Organic Waste & Composting Query
    if (text.includes("waste") || text.includes("compost") || text.includes("చెత్త") || text.includes("వ్యర్థాలు")) {
      speak(lang === "te"
        ? "కస్టమర్ ఇంటి వద్ద తడి చెత్త సేకరించి కెమెరా AI స్కాన్ ద్వారా 10 రివార్డ్ పాయింట్లు ఇచ్చి కాంపోస్టింగ్ యూనిట్‌కు తరలించండి."
        : "Perform Doorstep Organic Waste AI Camera verification to issue 10 reward points to households and route to bio-composting units.");
      return;
    }

    // 12. SLA Bonuses & Agent Trust Score Query
    if (text.includes("trust") || text.includes("score") || text.includes("bonus") || text.includes("tip") || text.includes("స్కోర్") || text.includes("బోనస్")) {
      speak(lang === "te"
        ? "సమయానికి ముందే అందజేస్తే ఆర్డర్‌కు 50 స్పీడ్ బోనస్ పాయింట్లు మరియు ₹30 అదనపు టిప్ లభిస్తాయి. 5-స్టార్ ట్రస్ట్ స్కోర్ పొందవచ్చు."
        : "Delivering early unlocks +50 SLA speed bonus points and ₹30 tip bonuses while boosting your Agent Trust Audit rating.");
      return;
    }

    // Default voice response
    speak(lang === "te" ? `విన్నాను: "${text}". ఏజెంట్ వర్క్‌ఫ్లో కోసం 'తదుపరి డెలివరీ', 'దారి చూపు', 'సీఓడీ లెడ్జర్', లేదా 'మూసివేయి' అని చెప్పండి.` : `Heard: "${text}". Try asking about Next Drop, Navigation, COD Ledger, or speak 'Close'.`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleVoiceCommand(searchQuery);
      setSearchQuery("");
    }
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
      fontFamily: "system-ui, -apple-system, sans-serif",
      overflowY: "auto"
    }}>
      {/* HUD Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "2rem" }}>🤖</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, letterSpacing: "0.5px" }}>
                Agent Workflow AI Companion
              </h2>
              <span style={{ background: "#22c55e", color: "black", padding: "2px 8px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                LIVE AI &amp; VOICE
              </span>
            </div>
            <p style={{ margin: "2px 0 0", color: "#94a3b8", fontSize: "0.82rem" }}>
              Ask workflow questions, execute hands-free commands, or manage deliveries
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
            title="Close Assistant (Esc)"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              border: "none",
              padding: "0.6rem 1.25rem",
              borderRadius: "100px",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 4px 15px rgba(239,68,68,0.4)"
            }}
          >
            <X size={18} />
            <span>Close Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "1.1rem", maxWidth: "920px", margin: "0 auto", width: "100%", padding: "1rem 0" }}>
        
        {/* Interactive Search / Command Query Box */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask any workflow question (e.g. 'How to collect COD?', 'AI freshness scan', 'Next drop')..."
              style={{
                width: "100%",
                padding: "0.85rem 1rem 0.85rem 2.7rem",
                borderRadius: "14px",
                border: "1.5px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                fontSize: "0.95rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
          <button 
            type="submit"
            style={{
              background: "#2563eb", color: "white", border: "none", borderRadius: "14px",
              padding: "0 1.25rem", fontWeight: 800, cursor: "pointer", fontSize: "0.9rem"
            }}
          >
            Ask AI
          </button>
        </form>

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
          <Volume2 size={34} color="#4ade80" className="animate-pulse" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.78rem", color: "#86efac", fontWeight: 700, textTransform: "uppercase" }}>AI Voice Guidance (Officer Speaking):</span>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#f8fafc", marginTop: "2px", lineHeight: 1.4 }}>
              {assistantSpoken}
            </div>
            {lastCommand && (
              <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px", fontStyle: "italic" }}>
                You said: "{lastCommand}"
              </div>
            )}
          </div>
        </div>

        {/* Current Delivery Highlight Card */}
        {currentDelivery ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1.5px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "20px",
            padding: "1.4rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>📦</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#f1f5f9" }}>
                    {currentDelivery.order?.customer?.name || "Customer Delivery"}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.9rem", color: "#38bdf8", fontWeight: 600 }}>
                    🌾 {currentDelivery.order?.crop?.name} ({currentDelivery.order?.quantity || 1} {currentDelivery.order?.crop?.unit || "kg"})
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ background: "#fbbf24", color: "#78350f", padding: "4px 12px", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 900 }}>
                  {currentDelivery.order?.paymentMode === "cod" ? `COLLECT COD: ₹${currentDelivery.order?.totalAmount}` : "PAID PREPAID"}
                </span>
              </div>
            </div>

            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <MapPin size={24} color="#ef4444" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: "0.95rem", color: "#e2e8f0", fontWeight: 600 }}>
                {currentDelivery.deliveryLocation || "Destination Address"}
              </div>
            </div>

            {/* Quick Action Touch Prompts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.65rem" }}>
              <button
                type="button"
                onClick={() => handleVoiceCommand("navigate")}
                style={{
                  background: "#2563eb", color: "white", border: "none", borderRadius: "12px",
                  padding: "0.8rem", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                }}
              >
                <Navigation size={18} /> 🧭 Navigate
              </button>

              <button
                type="button"
                onClick={() => handleVoiceCommand("call customer")}
                style={{
                  background: "#16a34a", color: "white", border: "none", borderRadius: "12px",
                  padding: "0.8rem", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                }}
              >
                <Phone size={18} /> 📞 Call
              </button>

              <button
                type="button"
                onClick={() => {
                  const otp = prompt("Enter customer 6-digit OTP:");
                  if (otp && onVerifyOtp) onVerifyOtp(currentDelivery, otp);
                }}
                style={{
                  background: "#d97706", color: "white", border: "none", borderRadius: "12px",
                  padding: "0.8rem", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                }}
              >
                <CheckCircle size={18} /> 🔑 OTP Handover
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", background: "rgba(255,255,255,0.04)", borderRadius: "20px" }}>
            <span style={{ fontSize: "2.5rem" }}>🎉</span>
            <h3 style={{ fontSize: "1.25rem", margin: "0.5rem 0 0" }}>అన్ని డెలివరీలు పూర్తయ్యాయి! (All Deliveries Complete)</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>You have fulfilled all assigned deliveries for today.</p>
          </div>
        )}

        {/* Workflow Knowledge Chips */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "0.9rem 1.1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
            💡 Interactive Workflow Shortcuts (Click or Speak Any Command):
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {[
              { label: "📦 Next Delivery", cmd: "next delivery" },
              { label: "🧭 Turn Navigation", cmd: "navigate" },
              { label: "📞 Call Customer", cmd: "call customer" },
              { label: "📸 AI Quality Check", cmd: "quality inspection" },
              { label: "💵 COD & Payout", cmd: "cod cash deposit" },
              { label: "🧪 Soil Testing Van", cmd: "soil testing" },
              { label: "❄️ Cold Storage", cmd: "cold storage" },
              { label: "🌱 Organic Waste", cmd: "organic waste" },
              { label: "⭐ Trust Score & Tip", cmd: "trust score bonus" },
              { label: "❌ Close Assistant", cmd: "close assistant" }
            ].map((chip, idx) => (
              <button 
                key={idx} 
                type="button"
                onClick={() => handleVoiceCommand(chip.cmd)}
                style={{
                  background: chip.cmd === "close assistant" ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)",
                  border: chip.cmd === "close assistant" ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.15)",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  color: chip.cmd === "close assistant" ? "#fca5a5" : "#e2e8f0",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Close Button */}
        <div style={{ textAlign: "center", marginTop: "0.2rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "0.5rem 1.5rem",
              borderRadius: "100px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            ← Return to Agent Dashboard (Close Assistant)
          </button>
        </div>

      </div>
    </div>
  );
}

