import React, { useState, useEffect } from "react";
import {
  toggleKrishnaFlute,
  toggleFarmAmbience,
  setSoundVolume,
  isDaytime
} from "../utils/ambientSoundEngine";

export default function AmbientAtmosphere() {
  const [isOpen, setIsOpen] = useState(false);
  const [flutePlaying, setFlutePlaying] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [mandiPlaying, setMandiPlaying] = useState(false);
  const [ambientMode, setAmbientMode] = useState("auto"); // "auto" | "day" | "night"
  const [volume, setVolume] = useState(0.5);
  const [isDay, setIsDay] = useState(isDaytime());

  // Listen for Mandi audio state from other components (like Marketplace hook)
  useEffect(() => {
    const handler = (e) => setMandiPlaying(e.detail.isActive);
    window.addEventListener("market_audio_state", handler);
    return () => window.removeEventListener("market_audio_state", handler);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsDay(isDaytime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleFlute = () => {
    const next = !flutePlaying;
    setFlutePlaying(next);
    toggleKrishnaFlute(next, volume);
  };

  const handleToggleAmbience = () => {
    const next = !ambientPlaying;
    setAmbientPlaying(next);
    toggleFarmAmbience(next, ambientMode, volume);
  };

  const handleToggleMandi = () => {
    // Mandi Audio is mostly driven by useMarketAudio.js, we just dispatch the global toggle
    window.dispatchEvent(new CustomEvent("market_announcer_toggle"));
  };

  const handleModeChange = (mode) => {
    setAmbientMode(mode);
    if (ambientPlaying) {
      toggleFarmAmbience(true, mode, volume);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    setSoundVolume(newVol, newVol);
  };

  const effectiveIsDay = ambientMode === "day" || (ambientMode === "auto" && isDay);

  return (
    <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9000 }}>
      {/* Expanded Control Box */}
      {isOpen && (
        <div style={{
          background: "rgba(15, 23, 42, 0.92)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "18px",
          padding: "1.2rem",
          color: "white",
          width: "300px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          marginBottom: "0.75rem",
          animation: "fadeIn 0.2s ease-out"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🪈</span>
              <strong style={{ fontSize: "0.95rem", color: "#fef08a" }}>Divine Soundscape</strong>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
            >
              ✕
            </button>
          </div>

          {/* Krishna Flute Music Toggle */}
          <div style={{
            background: flutePlaying ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.05)",
            border: flutePlaying ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: flutePlaying ? "#86efac" : "white" }}>
                🪈 Krishna Flute (Bansuri)
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                Raag Bhupali & Tanpura
              </div>
            </div>
            <button
              onClick={handleToggleFlute}
              style={{
                background: flutePlaying ? "#22c55e" : "rgba(255,255,255,0.2)",
                color: flutePlaying ? "#052e16" : "white",
                border: "none",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {flutePlaying ? "⏸ Pause" : "▶ Play"}
            </button>
          </div>

          {/* Day / Night Ambience Toggle */}
          <div style={{
            background: ambientPlaying ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.05)",
            border: ambientPlaying ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "0.75rem",
            marginBottom: "0.75rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: ambientPlaying ? "#93c5fd" : "white" }}>
                  {effectiveIsDay ? "🌅 Birds Chirping (Day)" : "🌙 Night Crickets (Night)"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {effectiveIsDay ? "Morning farm breeze & birds" : "Rhythmic night cicadas & crickets"}
                </div>
              </div>
              <button
                onClick={handleToggleAmbience}
                style={{
                  background: ambientPlaying ? "#3b82f6" : "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {ambientPlaying ? "⏸ Pause" : "▶ Play"}
              </button>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginTop: "0.4rem" }}>
              {[
                { id: "auto", label: "🔄 Auto" },
                { id: "day", label: "☀️ Day Birds" },
                { id: "night", label: "🌙 Crickets" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  style={{
                    background: ambientMode === m.id ? "rgba(255,255,255,0.25)" : "transparent",
                    color: ambientMode === m.id ? "#fef08a" : "#94a3b8",
                    border: ambientMode === m.id ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent",
                    borderRadius: "6px",
                    padding: "3px 4px",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mandi (Marketplace) Voices Toggle */}
          <div style={{
            background: mandiPlaying ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.05)",
            border: mandiPlaying ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "0.75rem",
            marginBottom: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: mandiPlaying ? "#fcd34d" : "white" }}>
                🗣️ Real Mandi Voices
              </div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                Multi-lingual vendor shouts & slangs
              </div>
            </div>
            <button
              onClick={handleToggleMandi}
              style={{
                background: mandiPlaying ? "#f59e0b" : "rgba(255,255,255,0.2)",
                color: mandiPlaying ? "#451a03" : "white",
                border: "none",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {mandiPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
          </div>

          {/* Volume Control */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.2rem" }}>
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#22c55e", cursor: "pointer" }}
            />
          </div>
        </div>
      )}

      {/* Floating Toggle Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: (flutePlaying || ambientPlaying || mandiPlaying)
            ? "linear-gradient(135deg, #15803d, #166534)"
            : "linear-gradient(135deg, #1e293b, #0f172a)",
          color: "white",
          border: (flutePlaying || ambientPlaying || mandiPlaying) ? "2px solid #4ade80" : "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50px",
          padding: "0.65rem 1.1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          cursor: "pointer",
          fontSize: "0.85rem",
          fontWeight: 700,
          transition: "all 0.2s ease"
        }}
        title="Toggle Krishna Flute, Nature Ambience & Mandi Voices"
      >
        <span style={{ fontSize: "1.1rem" }}>
          {flutePlaying ? "🪈" : mandiPlaying ? "🗣️" : effectiveIsDay ? "🌅" : "🌙"}
        </span>
        <span>
          {flutePlaying
            ? "Krishna Flute Playing..."
            : mandiPlaying
            ? "Mandi Voices Active..."
            : ambientPlaying
            ? (effectiveIsDay ? "Birds Chirping" : "Crickets Calling")
            : "Soundscape"}
        </span>
        {(flutePlaying || ambientPlaying || mandiPlaying) && (
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: "#4ade80", animation: "pulse 1.2s infinite"
          }} />
        )}
      </button>
    </div>
  );
}
