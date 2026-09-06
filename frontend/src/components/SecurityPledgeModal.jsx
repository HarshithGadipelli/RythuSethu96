import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "../context/LangContext";
import { playTTS, stopTTS } from "../utils/voiceParser";
import API from "../api/api";
import { ShieldAlert, Volume2, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

export default function SecurityPledgeModal({ user, onAccepted }) {
  const { t, lang } = useLang();
  const [isChecked, setIsChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Only stop TTS on unmount
  useEffect(() => {
    return () => stopTTS();
  }, []);

  const getPledgeContent = () => {
    if (user.role === "farmer") {
      return [
        { icon: "🌿", text: "I pledge to accurately represent my crops. If I mark them as Organic, they are 100% chemical-free." },
        { icon: "🚫", text: "I will never use artificial colors or waxes to make produce look fresh. Such fraud will result in a permanent ban." },
        { icon: "⚖️", text: "I will ensure honest weighing and grading. The quantity and quality shown in photos must match reality." }
      ];
    }
    if (user.role === "agent") {
      return [
        { icon: "📦", text: "I pledge to handle all agricultural products with utmost care to prevent damage during transit." },
        { icon: "📸", text: "I will take accurate, live photos at pickup and delivery. I understand AI will verify these photos for fraud prevention." },
        { icon: "⏱️", text: "I will adhere strictly to delivery timelines. Tampering with packages will result in immediate suspension and legal action." }
      ];
    }
    return [
      { icon: "🛡️", text: "I pledge to use the platform fairly and honestly, maintaining the trust of the Rythu Sethu community." }
    ];
  };

  const getSpokenText = () => {
    const rules = getPledgeContent().map((r, i) => `Rule ${i + 1}: ${r.text}`).join(". ");
    return `Welcome to the strict security and quality pledge. You must accept these rules to continue. ${rules}. Check the box below and click I Accept to proceed.`;
  };

  const handleReadAloud = () => {
    playTTS(getSpokenText(), lang || "en");
  };

  const handleAccept = async () => {
    if (!isChecked) return;
    setSaving(true);
    try {
      await API.put(`/auth/accept-terms`);
      stopTTS();
      onAccepted();
    } catch (err) {
      alert("Failed to save acceptance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <motion.div initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: "spring", damping: 25 }} className="glass-card-dark" style={{ maxWidth: 600, width: "100%", padding: "2rem", position: "relative", border: "2px solid #ef4444", boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ background: "rgba(239, 68, 68, 0.1)", width: 80, height: 80, borderRadius: "50%", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldAlert size={40} color="#ef4444" />
          </div>
          <h1 style={{ color: "white", fontSize: "1.8rem", marginBottom: "0.5rem" }}>Mandatory Security & Quality Pledge</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>To protect our community from fraud, you must accept these strict guidelines.</p>
        </div>

        <button onClick={handleReadAloud} className="btn-secondary" style={{ width: "100%", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
          <Volume2 size={20} /> 🔊 Listen to Rules (Read Aloud)
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {getPledgeContent().map((rule, idx) => (
            <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "1.5rem", background: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "8px", flexShrink: 0 }}>{rule.icon}</span>
              <p style={{ color: "#e5e7eb", margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>{rule.text}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "2rem", cursor: "pointer" }} onClick={() => setIsChecked(!isChecked)}>
          <div style={{ width: 24, height: 24, borderRadius: 6, border: "2px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1rem", background: isChecked ? "#f59e0b" : "transparent" }}>
            {isChecked && <CheckCircle2 size={16} color="white" />}
          </div>
          <p style={{ color: "#fcd34d", margin: 0, fontSize: "0.9rem", userSelect: "none" }}>
            <strong>I understand and agree.</strong> Any violation of these rules, including fake organic claims or tampering, will result in immediate legal action and a permanent platform ban.
          </p>
        </div>

        <button 
          onClick={handleAccept} 
          disabled={!isChecked || saving}
          className="btn-primary" 
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", background: isChecked ? "linear-gradient(135deg, #16a34a, #15803d)" : "#374151", color: isChecked ? "white" : "#9ca3af", border: "none", cursor: isChecked ? "pointer" : "not-allowed", transition: "all 0.3s" }}
        >
          {saving ? "Saving..." : "I Accept the Pledge"}
        </button>

      </motion.div>
    </div>
  );
}
