import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";
import { io } from "socket.io-client";
import { ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { playTTS } from "../utils/voiceParser";
import { useLang } from "../context/LangContext";

export default function GlobalSystemTermsModal() {
  const { user, updateUser, isLoggedIn } = useAuth();
  const { lang } = useLang();
  const [termsData, setTermsData] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchTerms = async () => {
    try {
      const res = await API.get("/public/system-terms");
      if (res.data) {
        setTermsData(res.data);
      }
    } catch (err) {
      console.error("Failed to load system terms", err);
    }
  };

  useEffect(() => {
    fetchTerms();

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const socket = io(backendUrl);
    socket.on("system_terms_updated", (data) => {
      setTermsData(data);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user || !termsData) {
      setOpen(false);
      return;
    }

    const currentVer = termsData.systemTermsVersion || 1;
    const userVer = user.acceptedTermsVersion || (user.acceptedTerms ? 1 : 0);

    if (userVer < currentVer || !user.acceptedTerms) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [isLoggedIn, user, termsData]);

  if (!open || !termsData) return null;

  const handleAccept = async () => {
    if (!accepted) return;
    try {
      setSubmitting(true);
      const res = await API.put("/auth/accept-terms", {
        termsVersion: termsData.systemTermsVersion
      });
      if (res.data) {
        updateUser(res.data);
        setOpen(false);
        playTTS("Thank you. Updated system rules accepted successfully.", lang);
      }
    } catch (err) {
      console.error("Error accepting terms", err);
      alert("Failed to record acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "1.5rem"
    }}>
      <div style={{
        background: "white", borderRadius: "24px", maxWidth: "660px", width: "100%",
        maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: "2px solid #3b82f6"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "white",
          padding: "1.5rem 1.75rem", borderBottom: "1px solid #334155"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{
              width: 46, height: 46, borderRadius: "12px", background: "rgba(59, 130, 246, 0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa"
            }}>
              <Lock size={26} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc" }}>
                  📜 Mandatory Admin System Rules & Terms Update
                </h3>
                <span style={{
                  background: "#2563eb", color: "white", padding: "2px 8px",
                  borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800
                }}>
                  v{termsData.systemTermsVersion}
                </span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                All users (new and existing) must accept the latest platform guidelines to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px",
            padding: "1rem", marginBottom: "1.25rem", color: "#1e40af", fontSize: "0.85rem", lineHeight: 1.5
          }}>
            <strong>🔔 Admin Notice:</strong> System policies or operating rules have been updated by Admin.
            In accordance with platform governance, all registered accounts must acknowledge and agree to these terms to proceed.
          </div>

          <h4 style={{ margin: "0 0 0.5rem 0", color: "#0f172a", fontSize: "1rem", fontWeight: 800 }}>
            {termsData.systemTermsTitle}
          </h4>

          <div style={{
            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px",
            padding: "1.25rem", color: "#334155", fontSize: "0.88rem", lineHeight: 1.6,
            maxHeight: "260px", overflowY: "auto", whiteSpace: "pre-wrap"
          }}>
            {termsData.systemTermsContent}
          </div>

          <div style={{
            background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "12px",
            padding: "1rem", marginTop: "1.25rem"
          }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "#2563eb" }}
              />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9a3412", lineHeight: 1.4 }}>
                I have read, understood, and agree to follow all updated Admin System Rules, Operating Terms, and Quality Guidelines across RythuJanaSethu.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "1.25rem 1.5rem", background: "#f1f5f9", borderTop: "1px solid #e2e8f0",
          display: "flex", justifyContent: "flex-end"
        }}>
          <button
            type="button"
            disabled={!accepted || submitting}
            onClick={handleAccept}
            style={{
              padding: "0.85rem 1.75rem", borderRadius: "12px",
              background: accepted ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "#cbd5e1",
              color: "white", border: "none", fontWeight: 800, fontSize: "0.95rem",
              cursor: accepted ? "pointer" : "not-allowed",
              boxShadow: accepted ? "0 4px 14px rgba(37,99,235,0.35)" : "none"
            }}
          >
            {submitting ? "Saving Agreement..." : "✍️ Accept System Rules & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
