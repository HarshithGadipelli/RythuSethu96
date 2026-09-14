import React, { useState, useEffect } from "react";
import API from "../api/api";
import { 
  ShieldCheck, Award, TrendingUp, CheckCircle2, AlertCircle, 
  X, RefreshCw, Star, Clock, Zap, Leaf, Truck, ShoppingBag, Info 
} from "lucide-react";

export default function TrustScoreModal({ userId, userRole, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const fetchScore = async () => {
    setLoading(true);
    setError("");
    try {
      let endpoint = "/trust-score/me";
      if (userId) {
        endpoint = `/trust-score/user/${userId}`;
      }
      const res = await API.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load trust score:", err);
      setError("Unable to load real-time trust score.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchScore();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const roleEmoji =
    (data?.role || userRole) === "farmer" ? "🌾" :
    (data?.role || userRole) === "agent" ? "🚚" : "🛒";

  const roleTitle =
    (data?.role || userRole) === "farmer" ? "Farmer Trust Audit" :
    (data?.role || userRole) === "agent" ? "Delivery Agent Performance Audit" : "Customer Trust & Loyalty Audit";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      padding: "1rem"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "620px",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          padding: "1.5rem 1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.75rem" }}>{roleEmoji}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                  {data?.name || "Member"} Trust Intelligence
                </h3>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{roleTitle}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cbd5e1",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.75rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
              <RefreshCw size={32} className="spin-anim" style={{ margin: "0 auto 1rem" }} />
              <p>Analyzing order histories, ETA compliance, quality metrics &amp; bio-contributions...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "1.5rem", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", color: "#b91c1c", textAlign: "center" }}>
              <AlertCircle size={24} style={{ margin: "0 auto 0.5rem" }} />
              <div>{error}</div>
            </div>
          ) : (
            <>
              {/* Score Gauge & Tier Card */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                borderRadius: "18px",
                padding: "1.5rem",
                border: "1.5px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  {/* Circular Score Orb */}
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: data.color ? `${data.color}15` : "#ecfdf5",
                    border: `3px solid ${data.color || "#10b981"}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 8px 20px ${data.color ? `${data.color}30` : "rgba(16,185,129,0.2)"}`
                  }}>
                    <span style={{ fontSize: "1.6rem", fontWeight: 900, color: data.color || "#047857", lineHeight: 1 }}>
                      {data.score}
                    </span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b" }}>/ 100</span>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.25rem" }}>{data.emoji}</span>
                      <strong style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f172a" }}>
                        {data.grade} Tier
                      </strong>
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                      Status: {data.label}
                    </span>
                  </div>
                </div>

                {/* Reward Points Badge */}
                <div style={{
                  background: "white",
                  padding: "0.75rem 1.2rem",
                  borderRadius: "14px",
                  border: "1.5px solid #e2e8f0",
                  textAlign: "right"
                }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Green Reward Points
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#16a34a" }}>
                    🪙 {data.rewardPoints || 0} Pts
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Parameter Bars */}
              <div>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <TrendingUp size={16} color="#059669" /> Evaluation Criteria Breakdown
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {Object.keys(data.breakdown || {}).map((k) => {
                    const param = data.breakdown[k];
                    const percent = Math.min(100, Math.round((param.score / param.max) * 100));

                    return (
                      <div
                        key={k}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "0.85rem 1rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                            {param.title || k}
                          </span>
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: percent >= 80 ? "#16a34a" : percent >= 50 ? "#d97706" : "#dc2626" }}>
                            {param.score} / {param.max} pts ({percent}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ background: "#f1f5f9", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${percent}%`,
                            background: percent >= 80 ? "#10b981" : percent >= 50 ? "#f59e0b" : "#ef4444",
                            borderRadius: "3px",
                            transition: "width 0.6s ease"
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Recommendations / Tips */}
              {data.tips && data.tips.length > 0 && (
                <div style={{
                  background: "#f0fdf4",
                  borderRadius: "14px",
                  padding: "1.2rem",
                  border: "1.5px solid #86efac"
                }}>
                  <strong style={{ fontSize: "0.88rem", color: "#166534", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.6rem" }}>
                    <Leaf size={16} /> How to Maximize Your Trust Tier &amp; Earnings:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#15803d", lineHeight: 1.6 }}>
                    {data.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "1rem 1.75rem",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.6rem 1.4rem",
              borderRadius: "100px",
              background: "#0f172a",
              color: "white",
              border: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: "pointer"
            }}
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
