import { BASE_URL } from '../../api/api';
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "../../context/LangContext";
import { useAuth } from "../../context/AuthContext";
import { useVoiceInput } from "../../utils/useVoiceInput";
import AutoSuggestInput from "../../components/AutoSuggestInput";
import EcoAdvisor from "../../components/EcoAdvisor";
import LocationButton from "../../components/LocationButton";
import VoiceMicButton from "../../components/VoiceMicButton";
import VoiceField from "../../components/VoiceField";
import GuidedInput from "../../components/GuidedInput";
import SoilTestingPanel from "../../components/SoilTestingPanel";
import PestDetectionPanel from "../../components/PestDetectionPanel";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { io } from "socket.io-client";
import { parseSpokenNumber, parseVoiceToFormMultilingual, playTTS, VOICE_PROMPTS, stopTTS, isTTSPlaying, CROP_BENCHMARKS } from "../../utils/voiceParser";
import LiveMapModal from "../../components/LiveMapModal";
import FarmerGroups from "./FarmerGroups";
import FarmerLeaderboard from "./FarmerLeaderboard";
import FarmerProfitCalculator from "./FarmerProfitCalculator";
import FarmerFinancialLedger from "./FarmerFinancialLedger";
import FarmerTours from "./FarmerTours";
import FarmerSchemes from "./FarmerSchemes";
import SoilTestingHub from "../../components/SoilTestingHub";
import VermiCompostPanel from "../../components/VermiCompostPanel";
import AssistantOverlay from "../../components/AssistantOverlay";
import CropVisualPicker, { VISUAL_CROPS } from "../../components/CropVisualPicker";
import { Navigation, Volume2, Mic, Sparkles, CheckCircle2, TrendingUp, RefreshCw, IndianRupee, HelpCircle, XCircle, MapPin, LocateFixed, Compass, Layers, ArrowLeft, X, ChevronRight, Sliders, ExternalLink, Activity, Search } from "lucide-react";
import LocationUpdateModal from "../../components/LocationUpdateModal";
import SecurityPledgeModal from "../../components/SecurityPledgeModal";
import APMCMandiExplorer from "../../components/APMCMandiExplorer";
import WeedControlAdvisor from "../../components/WeedControlAdvisor";
import SelectiveBreedingAdvisor from "../../components/SelectiveBreedingAdvisor";
import FarmerCropHistory from "./FarmerCropHistory";

const CATEGORIES = ["vegetable", "fruit", "grain", "pulse", "spice", "dairy", "other"];
const SEASONS    = ["kharif","rabi","zaid","perennial"];
const SOILS      = [
  "loamy", "clay", "sandy", "silt", "peat", "chalk",
  "red_soil", "black_soil", "alluvial_soil", "laterite_soil", "arid_soil", "forest_soil", "saline", "other"
];

export const SPECIALIZED_TOOL_GROUPS = [
  {
    id: "cultivation",
    category: "🌱 Seasonal Cultivation & Soil Planning",
    subtitle: "Used before sowing season and for crop cycle planning",
    badge: "Pre-Sowing & Seasonal",
    badgeBg: "#dcfce7",
    badgeColor: "#166534",
    tools: [
      { k: "soil", l: "🧪 Soil Testing & Lab Hub", desc: "NPK analysis, pH testing & official lab sample booking", freq: "Pre-Sowing (Rare)" },
      { k: "ml", l: "🤖 AI Crop Cultivation Suggestions", desc: "Climate, rainfall & soil-based crop matching at cultivation time", freq: "Cultivation Season" },
      { k: "selectiveBreeding", l: "🧬 Selective Breeding Advisor", desc: "Hybrid vigor, seed quality & pedigree planning", freq: "Seasonal Planning" },
      { k: "vermi", l: "🌱 Vermi Compost Production", desc: "Organic fertilizer batch tracking, moisture & earthworms", freq: "Periodic" },
    ]
  },
  {
    id: "diagnostics",
    category: "🔬 Plant Health & Diagnostics",
    subtitle: "Used when symptoms, pests, or nutrient deficiencies appear",
    badge: "As-Needed / Infestation",
    badgeBg: "#fef3c7",
    badgeColor: "#b45309",
    tools: [
      { k: "pest", l: "🐛 Pest & Disease Diagnostics", desc: "AI photo diagnosis, symptoms & organic/chemical remedies", freq: "On Infestation" },
      { k: "weedControl", l: "🌿 Weed Identification & Control", desc: "Weed density assessment, mechanical & biological eradication", freq: "As-Needed" },
      { k: "tips", l: "💡 Crop Doctor & Smart Tips", desc: "Stage-specific care, nutrient guides & weather adjustments", freq: "Periodic Check" },
      { k: "aiChat", l: "💬 Farm AI Specialist Chat", desc: "Voice/text agronomy expert in Telugu, Hindi, Tamil & English", freq: "On-Demand" },
    ]
  },
  {
    id: "finance",
    category: "💰 Financial, Ledger & Long-Term Planning",
    subtitle: "For seasonal accounting, lifetime records & warehouse storage",
    badge: "Accounting & Storage",
    badgeBg: "#dbeafe",
    badgeColor: "#1d4ed8",
    tools: [
      { k: "cropHistory", l: "📜 Crop History & Revenue Ledger", desc: "Harvest logs, historical yields & sales totals", freq: "Post-Harvest" },
      { k: "ledger", l: "📒 Financial Ledger / Khata", desc: "Daily farm debit/credit & net profit accounting", freq: "Weekly / Monthly" },
      { k: "profit", l: "💰 Profit & Yield Calculator", desc: "Pre-season ROI, cost vs return projection", freq: "Pre-Cultivation" },
      { k: "warehouse", l: "🏭 Warehouse & Cold Storage Hub", desc: "Capacity booking & post-harvest preservation", freq: "Seasonal Harvest" },
      { k: "leaderboard", l: "🏆 Regional Farmer Leaderboard", desc: "Sustainable yield rankings & community XP", freq: "Periodic" },
    ]
  },
  {
    id: "community",
    category: "🏛️ FPO, Community & Govt Support",
    subtitle: "Community pooling, farm visits, subsidies and extension",
    badge: "Community & Schemes",
    badgeBg: "#f3e8ff",
    badgeColor: "#7e22ce",
    tools: [
      { k: "groups", l: "🤝 FPO Group Selling Pool", desc: "Bulk aggregation & collective bargaining with buyers", freq: "Periodic" },
      { k: "tours", l: "🚜 Farm Tours & Agro-Tourism", desc: "Host city visitors & schedule farm tours", freq: "Occasional" },
      { k: "schemes", l: "🏛️ PM-KISAN & Govt Schemes", desc: "Subsidies, tractor loans & crop insurance application", freq: "Seasonal" },
      { k: "broadcast", l: "📢 Local Broadcast Alerts", desc: "Send crop availability alerts to nearby buyers", freq: "Periodic" },
      { k: "policies", l: "📜 Farm Safety Policies & Pledge", desc: "Organic standards, pledge & legal compliance", freq: "Reference" },
      { k: "support", l: "🛠️ Dedicated Agronomist Support", desc: "Direct escalation to agriculture extension officers", freq: "As-Needed" },
    ]
  }
];

export const SPECIALIZED_TOOL_KEYS = SPECIALIZED_TOOL_GROUPS.flatMap(g => g.tools.map(t => t.k));


// Voice parsing is now handled by voiceParser.js

const DemandPanel = ({ onSelectCropForListing }) => {
  const [subTab, setSubTab] = useState("broadcasts"); // "broadcasts" | "govt_mandi" | "pricing_calculator"
  
  // 1. Broadcasts state
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);

  // 2. Govt Mandi Historical state
  const [mandiCrop, setMandiCrop] = useState("Tomato");
  const [mandiHistory, setMandiHistory] = useState(null);
  const [loadingMandi, setLoadingMandi] = useState(false);

  // 3. Dynamic Pricing Calculator state
  const [calcForm, setCalcForm] = useState({ cropName: "Tomato", quantityKg: 200, region: "Hyderabad" });
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (subTab === "broadcasts") {
      setLoadingBroadcasts(true);
      API.get("/ml/demand/broadcasts")
        .then(res => setBroadcasts(res.data))
        .catch(console.error)
        .finally(() => setLoadingBroadcasts(false));
    }
  }, [subTab]);

  useEffect(() => {
    if (subTab === "govt_mandi") {
      setLoadingMandi(true);
      API.get(`/ml/govt-mandi-history?crop=${mandiCrop}`)
        .then(res => setMandiHistory(res.data))
        .catch(console.error)
        .finally(() => setLoadingMandi(false));
    }
  }, [subTab, mandiCrop]);

  const handleCalculatePrice = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setCalculating(true);
    try {
      const res = await API.post("/ml/calculate-demand-price", calcForm);
      setCalcResult(res.data);
    } catch (err) {
      console.error("Failed to calculate demand price", err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="glass-card mt-3">
      {/* Tri-Part Subtab Navigation */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        paddingBottom: "0.75rem",
        marginBottom: "1.2rem",
        flexWrap: "wrap"
      }}>
        <button
          type="button"
          onClick={() => setSubTab("broadcasts")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "100px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: subTab === "broadcasts" ? "var(--green-deep)" : "rgba(255,255,255,0.05)",
            color: subTab === "broadcasts" ? "white" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          📢 Admin Demand Broadcasts ({broadcasts.length || 3})
        </button>

        <button
          type="button"
          onClick={() => setSubTab("govt_mandi")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "100px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: subTab === "govt_mandi" ? "var(--green-deep)" : "rgba(255,255,255,0.05)",
            color: subTab === "govt_mandi" ? "white" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          🏛️ Govt APMC Historical Mandi Data
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab("pricing_calculator");
            if (!calcResult) handleCalculatePrice();
          }}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "100px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: subTab === "pricing_calculator" ? "var(--green-deep)" : "rgba(255,255,255,0.05)",
            color: subTab === "pricing_calculator" ? "white" : "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          ⚡ Dynamic Demand-Price Advisor
        </button>
      </div>

      {/* SUBTAB 1: Admin Consumer Demand Broadcasts */}
      {subTab === "broadcasts" && (
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <h4 style={{ margin: "0 0 4px 0", color: "var(--text-dark)", fontSize: "1.05rem" }}>
              📢 Consumer Search Demand Alerts (Broadcasted by Admin)
            </h4>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              High-priority alerts sent directly by platform administrators based on real-time customer search spikes in urban centers.
            </p>
          </div>

          {loadingBroadcasts ? (
            <p style={{ color: "var(--text-muted)" }}>Loading active broadcasts...</p>
          ) : broadcasts.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              <p>No active broadcasts right now. Check back soon for high-demand crop alerts!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {broadcasts.map((b, idx) => (
                <div
                  key={b._id || idx}
                  style={{
                    padding: "1.2rem",
                    borderRadius: "12px",
                    background: b.priority === "urgent" ? "rgba(239, 68, 68, 0.05)" : "rgba(22, 163, 74, 0.06)",
                    border: b.priority === "urgent" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(22, 163, 74, 0.25)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem"
                  }}
                >
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "1.15rem", color: "var(--text-dark)", textTransform: "capitalize" }}>
                        🌱 {b.cropName}
                      </strong>
                      <span style={{
                        background: b.priority === "urgent" ? "#ef4444" : "#16a34a",
                        color: "white", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800
                      }}>
                        {b.priority?.toUpperCase()} DEMAND
                      </span>
                      {b.searchSurgePercentage && (
                        <span style={{ background: "rgba(234, 179, 8, 0.15)", color: "#b45309", border: "1px solid rgba(234, 179, 8, 0.3)", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700 }}>
                          +{b.searchSurgePercentage}% Search Surge 🚀
                        </span>
                      )}
                    </div>

                    <p style={{ margin: "4px 0 8px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {b.message || "Admin broadcast: Urban buyers are searching for this produce in high volumes."}
                    </p>

                    <div style={{ display: "flex", gap: "1.2rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span>Target Volume Needed: <strong style={{ color: "var(--text-dark)" }}>{b.targetQuantityKg} kg</strong></span>
                      <span>Suggested Selling Price: <strong style={{ color: "var(--green-light)" }}>₹{b.suggestedPrice} / kg</strong></span>
                      <span>Target Region: <strong style={{ color: "var(--text-dark)" }}>{b.targetRegion || "All"}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "auto", padding: "0.6rem 1.2rem", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => {
                      if (onSelectCropForListing) {
                        onSelectCropForListing({ name: b.cropName, price: b.suggestedPrice, quantity: b.targetQuantityKg });
                      }
                    }}
                  >
                    🌱 List This Crop Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Govt APMC Historical Mandi Explorer */}
      {subTab === "govt_mandi" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.2rem" }}>
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "var(--text-dark)", fontSize: "1.05rem" }}>
                🏛️ Government Mandi (APMC) Historical Price & Demand Trends
              </h4>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Official AGMARKNET / State Mandi historical data to help farmers decide what crops to cultivate based on structural demand.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Select Crop:</label>
              <select
                className="rs-select"
                value={mandiCrop}
                onChange={(e) => setMandiCrop(e.target.value)}
                style={{ width: "auto", padding: "0.4rem 0.8rem" }}
              >
                {["Tomato", "Onion", "Potato", "Cotton", "Chilli", "Paddy", "Turmeric", "Maize", "Groundnut", "Soybean"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingMandi ? (
            <p style={{ color: "var(--text-muted)" }}>Loading official Mandi historical records...</p>
          ) : mandiHistory ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {/* Summary Cards */}
              <div className="grid-4">
                <div className="stat-card">
                  <span className="stat-icon">💰</span>
                  <div className="stat-value" style={{ color: "var(--green-light)" }}>₹{mandiHistory.currentModalPrice}</div>
                  <div className="stat-label">Current Mandi Price / {mandiHistory.unit || "Quintal"}</div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🏛️</span>
                  <div className="stat-value">₹{mandiHistory.mspBenchmark}</div>
                  <div className="stat-label">Govt MSP Benchmark</div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">📈</span>
                  <div className="stat-value" style={{ color: mandiHistory.seasonalTrend?.includes("Rising") ? "#16a34a" : "#f59e0b" }}>
                    {mandiHistory.seasonalTrend || "Moderate"}
                  </div>
                  <div className="stat-label">Seasonal Price Trend</div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🎯</span>
                  <div className="stat-value" style={{ fontSize: "1rem", color: "#2563eb" }}>
                    {mandiHistory.topMandiDestination || "Bowenpally, HYD"}
                  </div>
                  <div className="stat-label">Highest Return Mandi</div>
                </div>
              </div>

              {/* Cultivation Recommendation Banner */}
              <div style={{
                background: mandiHistory.cultivationAdvice?.includes("Recommended") ? "rgba(22, 163, 74, 0.08)" : "rgba(234, 179, 8, 0.08)",
                border: mandiHistory.cultivationAdvice?.includes("Recommended") ? "1px solid #86efac" : "1px solid #fde68a",
                borderRadius: "10px",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "1.8rem" }}>🌾</span>
                <div>
                  <strong style={{ fontSize: "0.95rem", color: mandiHistory.cultivationAdvice?.includes("Recommended") ? "#166534" : "#92400e" }}>
                    Government Agricultural Advisory: {mandiHistory.cultivationAdvice}
                  </strong>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Arrival volumes: <strong>{mandiHistory.historicalData?.[mandiHistory.historicalData.length - 1]?.arrivalsQuintals || 1200} Quintals</strong> arriving weekly. Optimal sowing season: <strong>{mandiHistory.optimalSowingSeason || "Kharif (June - July)"}</strong>.
                  </p>
                </div>
              </div>

              {/* 6-Month Historical Price & Arrivals Table */}
              <div style={{ overflowX: "auto" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--text-dark)", fontSize: "0.9rem" }}>
                  📅 6-Month Historical Mandi Price Trend ({mandiHistory.crop})
                </h5>
                <table className="rs-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Min Price (₹)</th>
                      <th>Modal Price (₹)</th>
                      <th>Max Price (₹)</th>
                      <th>Arrivals (Quintals)</th>
                      <th>Demand State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(mandiHistory.historicalData || []).map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: "var(--text-dark)" }}>{row.month}</td>
                        <td style={{ color: "var(--text-muted)" }}>₹{row.minPrice}</td>
                        <td style={{ fontWeight: 700, color: "var(--green-light)" }}>₹{row.modalPrice}</td>
                        <td style={{ color: "var(--text-muted)" }}>₹{row.maxPrice}</td>
                        <td>{row.arrivalsQuintals?.toLocaleString()} Qtl</td>
                        <td>
                          <span className={`badge ${row.demandState === "High Demand" ? "badge-red" : row.demandState === "Normal" ? "badge-green" : "badge-yellow"}`}>
                            {row.demandState || "Normal"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>No mandi data available for {mandiCrop}.</p>
          )}
        </div>
      )}

      {/* SUBTAB 3: Dynamic Demand-Price Advisor */}
      {subTab === "pricing_calculator" && (
        <div>
          <div style={{ marginBottom: "1.2rem" }}>
            <h4 style={{ margin: "0 0 4px 0", color: "var(--text-dark)", fontSize: "1.05rem" }}>
              ⚡ Farmer Demand-Based Dynamic Pricing Advisor
            </h4>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Calculate the optimal selling price for your harvest by evaluating real-time consumer search spikes, APMC Mandi rates, and local platform supply deficits.
            </p>
          </div>

          <form onSubmit={handleCalculatePrice} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "1.5rem" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label className="field-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Crop Name</label>
              <select
                className="rs-select"
                value={calcForm.cropName}
                onChange={(e) => setCalcForm(f => ({ ...f, cropName: e.target.value }))}
              >
                {["Tomato", "Onion", "Potato", "Cotton", "Chilli", "Paddy", "Turmeric", "Maize", "Groundnut", "Soybean", "Brinjal", "Carrot"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: "1 1 150px" }}>
              <label className="field-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Available Harvest (kg)</label>
              <input
                className="rs-input"
                type="number"
                value={calcForm.quantityKg}
                onChange={(e) => setCalcForm(f => ({ ...f, quantityKg: Number(e.target.value) }))}
                placeholder="e.g. 200"
                min="1"
              />
            </div>

            <div style={{ flex: "1 1 180px" }}>
              <label className="field-label" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Farming Region</label>
              <select
                className="rs-select"
                value={calcForm.region}
                onChange={(e) => setCalcForm(f => ({ ...f, region: e.target.value }))}
              >
                <option value="Hyderabad">Hyderabad & Rangareddy</option>
                <option value="Warangal">Warangal Agri Cluster</option>
                <option value="Karimnagar">Karimnagar Zone</option>
                <option value="Nalgonda">Nalgonda Cluster</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={calculating}
              style={{ padding: "0.65rem 1.4rem", fontWeight: 700, width: "auto" }}
            >
              {calculating ? "Calculating..." : "⚡ Calculate Optimal Price"}
            </button>
          </form>

          {calcResult && (
            <div style={{
              background: "rgba(22, 163, 74, 0.06)",
              border: "1px solid rgba(22, 163, 74, 0.3)",
              borderRadius: "14px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
                    Recommended Selling Price
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--green-light)" }}>
                    ₹{calcResult.recommendedPrice} <span style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text-muted)" }}>/ kg</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{
                    background: calcResult.priceChangePercent >= 0 ? "rgba(22, 163, 74, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: calcResult.priceChangePercent >= 0 ? "#16a34a" : "#dc2626",
                    border: calcResult.priceChangePercent >= 0 ? "1px solid rgba(22, 163, 74, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                    padding: "6px 12px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 700
                  }}>
                    {calcResult.priceChangePercent >= 0 ? `+${calcResult.priceChangePercent}% Surge Capture 🚀` : `${calcResult.priceChangePercent}% Discount`}
                  </span>

                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: "auto", padding: "0.6rem 1.2rem", fontWeight: 700 }}
                    onClick={() => {
                      if (onSelectCropForListing) {
                        onSelectCropForListing({
                          name: calcForm.cropName,
                          price: calcResult.recommendedPrice,
                          quantity: calcForm.quantityKg
                        });
                      }
                    }}
                  >
                    📋 Apply to My Listing
                  </button>
                </div>
              </div>

              {/* Price Breakdown Grid */}
              <div className="grid-4" style={{ marginTop: "0.5rem" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🏛️ APMC Mandi Benchmark</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-dark)" }}>₹{calcResult.mandiBenchmark} / kg</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🔍 Consumer Search Volume</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2563eb" }}>{calcResult.consumerSearchCount} searches</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>📈 Demand Multiplier</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f59e0b" }}>{calcResult.demandMultiplier}x</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>🎯 Recommended Strategy</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--green-light)" }}>{calcResult.pricingStrategy || "Surge Harvesting"}</div>
                </div>
              </div>

              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5, background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "8px" }}>
                💡 <strong>Pricing Intelligence Rationale:</strong> {calcResult.explanation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const YieldPredictor = () => {
  const [form, setForm] = useState({ crop: "", acres: "", soilType: "loamy", soilPh: "", location: "", season: "kharif" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    if (!form.crop || !form.acres) return;
    setLoading(true);
    try {
      const res = await API.post("/ml/predict-yield", form);
      setResult(res.data);
    } catch (e) {
      alert("Yield prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: "1.5rem" }}>
      <h3 className="section-title">🌾 Crop Yield Predictor</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Predict your expected harvest and estimated revenue based on advanced regional conditions.</p>
      
      <div className="grid-3 mb-2">
        <div className="form-group">
          <label className="field-label">Crop Name</label>
          <input type="text" className="rs-input" value={form.crop} onChange={e => setForm({...form, crop: e.target.value})} placeholder="e.g., Tomato" />
        </div>
        <div className="form-group">
          <label className="field-label">Farm Area (Acres)</label>
          <input type="number" className="rs-input" value={form.acres} onChange={e => setForm({...form, acres: e.target.value})} placeholder="e.g., 2" />
        </div>
        <div className="form-group">
          <label className="field-label">Region/Location</label>
          <input type="text" className="rs-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g., Hyderabad" />
        </div>
        <div className="form-group">
          <label className="field-label">Season</label>
          <select className="rs-select" value={form.season} onChange={e => setForm({...form, season: e.target.value})}>
            <option value="kharif">Kharif (Monsoon)</option>
            <option value="rabi">Rabi (Winter)</option>
            <option value="zaid">Zaid (Summer)</option>
            <option value="all">All Seasons</option>
          </select>
        </div>
        <div className="form-group">
          <label className="field-label">Soil Type</label>
          <select className="rs-select" value={form.soilType} onChange={e => setForm({...form, soilType: e.target.value})}>
            {SOILS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="field-label">Soil pH (Optional)</label>
          <input type="number" step="0.1" className="rs-input" value={form.soilPh} onChange={e => setForm({...form, soilPh: e.target.value})} placeholder="e.g., 6.5" />
        </div>
      </div>
      
      <button className="btn-primary" style={{ maxWidth: 200 }} onClick={predict} disabled={loading || !form.crop || !form.acres}>
        {loading ? "Calculating..." : "Predict Yield"}
      </button>

      {result && (
        <div className="ml-result mt-2" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", display: "flex", gap: "2rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--green-deep)" }}>Estimated Yield</span>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-dark)" }}>{result.estimatedYieldTons} Tons</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>({result.estimatedYieldKg} kg)</div>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--green-deep)" }}>Est. Market Revenue</span>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-dark)" }}>₹{result.estimatedRevenue.toLocaleString()}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Based on current averages</div>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--green-deep)" }}>Soil Suitability</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: result.soilSuitability === "Optimal" ? "var(--green-primary)" : "var(--yellow-wheat)" }}>{result.soilSuitability}</div>
            {result.phEfficiencyPct && (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>pH Efficiency: {result.phEfficiencyPct}%</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function FarmerDashboard() {
  const { t, lang, changeLang } = useLang();
  const { user } = useAuth();
  const { listening, activeField, interim, startListening, stopListening } = useVoiceInput(lang);

  const [tab, setTab] = useState("crops");
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showPledge, setShowPledge] = useState(user?.acceptedTerms === false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [toolsSearch, setToolsSearch] = useState("");
  const [farmerProfile, setFarmerProfile] = useState(null);
  
  // Stage Update Modal State
  const [stageModal, setStageModal] = useState({
    isOpen: false,
    cropId: null,
    stage: "sowing",
    notes: "",
    imageFile: null,
    imagePreview: ""
  });
  const [locLoading, setLocLoading] = useState(false);
  const [focusField, setFocusField] = useState("name");
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResult, setMlResult] = useState(null);
  const [tipsResult, setTipsResult] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [tabCategory, setTabCategory] = useState("all");

  // Auction Modal State
  const [auctionModal, setAuctionModal] = useState({ isOpen: false, crop: null, quantity: "", startingBid: "", durationHours: "24" });

  // Pest Detection State
  const [pestImage, setPestImage] = useState(null);
  const [pestPreview, setPestPreview] = useState(null);
  const [pestCropName, setPestCropName] = useState("");
  const [pestSymptoms, setPestSymptoms] = useState("");
  const [pestLoading, setPestLoading] = useState(false);
  const [pestResult, setPestResult] = useState(null);


  const [form, setForm] = useState({ name:"", description:"", price:"", quantity:"", unit:"kg", category:"vegetable", image:null, farmLocation: "", location:"", sameLocation: true, isOrganic:false, isPesticideFree:false, season:"kharif", harvestDate:"", latitude:"", longitude:"", isPrebooking:false, lifecycleStage: "ready", farmTourUrl:"", qualityGrade:null, isBulk:false, minOrderQty:1 });
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);
  
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [qualitySuggestion, setQualitySuggestion] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardActive, setWizardActive] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const wizardActiveRef = useRef(false);
  const isProcessingRef = useRef(false);
  useEffect(() => { wizardActiveRef.current = wizardActive; }, [wizardActive]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [priceRecommendation, setPriceRecommendation] = useState(null);
  const [demandPricingResult, setDemandPricingResult] = useState(null);
  const [calculatingDemandPrice, setCalculatingDemandPrice] = useState(false);

  const handleCalculateDemandPrice = async () => {
    if (!form.name) {
      setMsg({ type: "error", text: "Please select or type crop name first in Step 1." });
      return;
    }
    setCalculatingDemandPrice(true);
    try {
      const res = await API.post("/ml/calculate-demand-price", {
        cropName: form.name,
        quantityKg: Number(form.quantity) || 100,
        region: user?.location || "Hyderabad"
      });
      setDemandPricingResult(res.data);
    } catch (err) {
      console.error("Failed to calculate demand price", err);
      setMsg({ type: "error", text: "Failed to calculate dynamic demand price." });
    } finally {
      setCalculatingDemandPrice(false);
    }
  };
  
  // Broadcast State
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all_customers");

  // Profit Calculator State
  const [profitCalc, setProfitCalc] = useState({
    cropName: "",
    expectedYield: "",
    expectedPrice: "",
    seedCost: "",
    fertilizerCost: "",
    equipmentCost: "",
    laborCost: ""
  });

  const [editCropModal, setEditCropModal] = useState({ isOpen: false, crop: null, name: "", category: "", unit: "", quantity: "", price: "" });

  const handleEditCropSubmit = async () => {
    if (!editCropModal.crop) return;
    try {
      await API.put(`/crops/${editCropModal.crop._id}`, {
        name: editCropModal.name,
        category: editCropModal.category,
        unit: editCropModal.unit,
        quantity: editCropModal.quantity,
        price: editCropModal.price
      });
      setMsg({ type: "success", text: "Crop updated successfully!" });
      setEditCropModal({ isOpen: false, crop: null, name: "", category: "", unit: "", quantity: "", price: "" });
      fetchCrops();
    } catch (err) {
      setMsg({ type: "error", text: "Failed to update crop." });
    }
  };

  const fetchPriceRecommendation = async (cropName) => {
    if (!cropName) return;
    try {
      const payload = { crop: cropName };
      if (user?.latitude && user?.longitude) {
        payload.latitude = user.latitude;
        payload.longitude = user.longitude;
      }
      const res = await API.post("/ml/price-trends", payload);
      setPriceRecommendation(res.data);
    } catch (err) {
      console.error("Failed to fetch price recommendation", err);
    }
  };

  const handleFarmerBroadcast = async () => {
    if (!broadcastMsg) return;
    try {
      // Typically you'd have a backend route for this. We'll use the existing /ai/chat or just emit via socket if available
      // For now we'll simulate success
      setMsg({ type: "success", text: "📢 Broadcast sent successfully to " + broadcastTarget.replace("_", " ") });
      setBroadcastMsg("");
    } catch (err) {
      setMsg({ type: "error", text: "Failed to send broadcast." });
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await API.post("/ai/chat", { prompt: userMsg.text, role: "farmer", userId: user?._id });
      setChatHistory(prev => [...prev, { role: "ai", text: res.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "ai", text: "Sorry, I am having trouble connecting to the AI server." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const [wizardHeard, setWizardHeard] = useState("");
  const [wizardStatus, setWizardStatus] = useState("idle"); // "idle" | "listening" | "analyzing" | "speaking" | "ready"
  const [wizardBenchmark, setWizardBenchmark] = useState(null);

  const handleVisualCropSelect = (crop) => {
    const langKey = (lang ? lang.split("-")[0] : "en") || "en";
    const nameInLang = crop.names[langKey] || crop.names.en;
    
    setForm(f => {
      const next = { ...f, name: crop.id, category: crop.category };
      formRef.current = next;
      return next;
    });

    if (CROP_BENCHMARKS[crop.id]) {
      setWizardBenchmark(CROP_BENCHMARKS[crop.id]);
    }

    const announcements = {
      en: `Selected ${nameInLang}! How many kilograms or bags do you have available?`,
      te: `${nameInLang} ఎంచుకోబడింది! మీ దగ్గర ఎన్ని కిలోలు లేదా బస్తాలు అందుబాటులో ఉన్నాయి?`,
      hi: `${nameInLang} चुना गया! आपके पास कितने किलो या बोरी उपलब्ध हैं?`,
      kn: `${nameInLang} ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ! ನಿಮ್ಮ ಬಳಿ ಎಷ್ಟು ಕಿಲೋ ಅಥವಾ ಮೂಟೆ ಲಭ್ಯವಿದೆ?`,
      ta: `${nameInLang} தேர்ந்தெடுக்கப்பட்டது! உங்களிடம் எத்தனை கிலோ அல்லது மூட்டை உள்ளது?`
    };

    const replyText = announcements[langKey] || announcements.en;
    setAiMessage(replyText);
    setWizardStatus("speaking");
    playTTS(replyText, langKey);
  };

  const toggleGuidedAssistant = () => startGuidedWizard();

  const startGuidedWizard = async () => {
    if (wizardActive) {
      setWizardActive(false);
      setWizardStatus("idle");
      setAiMessage("");
      stopTTS();
      stopListening();
      return;
    }
    
    setWizardActive(true);
    setTab("add");
    setWizardStatus("speaking");
    
    const p = VOICE_PROMPTS[lang] || VOICE_PROMPTS["en"];
    setAiMessage(p.start);
    
    // Auto detect farm location if not present
    if (!formRef.current.farmLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
          const d = await r.json();
          const addr = d.display_name || `${coords.latitude},${coords.longitude}`;
          setForm(f => ({ ...f, farmLocation: addr, location: addr, latitude: coords.latitude, longitude: coords.longitude }));
        } catch {}
      });
    }

    const processTranscript = async (transcript) => {
      if (!transcript || transcript.trim() === "") {
        listenNext();
        return;
      }
      
      setWizardHeard(transcript);
      setWizardStatus("analyzing");
      setMsg({ type: "info", text: "⚡ Analyzing your voice input..." });

      // 1. First run instant local multilingual parser
      const localData = parseVoiceToFormMultilingual(transcript, lang);
      
      // Check for voice action commands
      if (localData.action === "cancel") {
        setWizardActive(false);
        setWizardStatus("idle");
        stopTTS();
        stopListening();
        setMsg({ type: "info", text: "Rythu Jana Sethu Assistant closed." });
        return;
      }
      if (localData.action === "clear") {
        setForm({ name:"", description:"", price:"", quantity:"", unit:"kg", category:"vegetable", image:null, farmLocation:"", location:"", sameLocation:true, isOrganic:false, isPesticideFree:false, season:"kharif", harvestDate:"", latitude:"", longitude:"", isPrebooking:false, lifecycleStage: "ready", farmTourUrl:"", qualityGrade:null, isBulk:false, minOrderQty:1 });
        setWizardBenchmark(null);
        setAiMessage("Form cleared. What crop would you like to sell?");
        await playTTS("Form cleared. What crop would you like to sell?", lang);
        listenNext();
        return;
      }
      if (localData.action === "submit") {
        setWizardStatus("ready");
        await playTTS("Submitting your crop now!", lang);
        setWizardActive(false);
        handleAddCrop();
        return;
      }

      // 2. Query backend AI parse for deep contextual extraction
      let combinedData = { ...localData };
      try {
        const f = formRef.current;
        const contextText = `I already have: ${JSON.stringify({ name: f.name, category: f.category, price: f.price, quantity: f.quantity, description: f.description, isOrganic: f.isOrganic, isPesticideFree: f.isPesticideFree, farmLocation: f.farmLocation })}. User says: "${transcript}"`;
        
        const res = await API.post("/ai/parse", { text: contextText, context: "farmer_add_crop", lang });
        if (res.data && res.data.data) {
          combinedData = { ...combinedData, ...res.data.data };
        }
      } catch (err) {
        console.warn("Backend AI parse fallback:", err);
      }

      // 3. Apply updates to form
      setForm(curr => {
        const next = {
          ...curr,
          name: combinedData.name || curr.name,
          category: combinedData.category || curr.category,
          quantity: combinedData.quantity || curr.quantity,
          unit: combinedData.unit || curr.unit,
          price: combinedData.price || curr.price,
          description: combinedData.description || curr.description,
          farmLocation: combinedData.farmLocation || curr.farmLocation,
          location: combinedData.location || curr.location || curr.farmLocation,
          isOrganic: combinedData.isOrganic !== undefined ? combinedData.isOrganic : curr.isOrganic,
          isPesticideFree: combinedData.isPesticideFree !== undefined ? combinedData.isPesticideFree : curr.isPesticideFree
        };
        formRef.current = next;

        if (next.name) {
          fetchPriceRecommendation(next.name);
          if (CROP_BENCHMARKS[next.name]) {
            setWizardBenchmark(CROP_BENCHMARKS[next.name]);
          }
        }

        if (next.name && next.category && next.price && next.quantity) {
          setWizardStep(3);
        } else if (next.name) {
          setWizardStep(2);
        }
        return next;
      });

      setMsg({ type: "success", text: "✅ Form updated via voice!" });

      // 4. Generate conversational response and speak
      let replyText = combinedData.reply;
      if (!replyText) {
        const f = formRef.current;
        const nextName = combinedData.name || f.name;
        const nextQty = String(combinedData.quantity || f.quantity || "");
        const nextPrice = String(combinedData.price || f.price || "");
        const langKey = (lang || "en").split("-")[0];

        const PROMPTS = {
          en: {
            needName: "What crop are you selling? You can say tomato, onion, rice, cotton, or any other crop name.",
            needQty: (n) => `How many kilograms or bags of ${n} do you have for sale?`,
            needPrice: (n, q) => `What is the price per kilogram for your ${n}? For example, say 30 rupees per kg.`,
            allDone: (n, q, p) => `Perfect! ${n}, ${q} kg at ₹${p} per kg. Total earnings: ₹${Number(q) * Number(p)}. Say 'Submit' to list on marketplace, or correct any detail.`
          },
          te: {
            needName: "మీరు ఏ పంట అమ్ముతున్నారు? టమోటా, ఉల్లి, వరి, పత్తి లేదా ఏ పంట అయినా చెప్పండి.",
            needQty: (n) => `మీ దగ్గర ${n} ఎన్ని కిలోలు లేదా బస్తాలు ఉన్నాయి?`,
            needPrice: (n) => `${n} కిలోకి ఎంత ధర? ఉదాహరణకు, కిలో 30 రూపాయలు అని చెప్పండి.`,
            allDone: (n, q, p) => `బాగుంది! ${n}, ${q} కేజీలు, కేజీకి ₹${p}. మొత్తం ₹${Number(q) * Number(p)}. 'సమర్పించు' అని చెప్పి మార్కెట్‌కి అప్‌లోడ్ చేయండి.`
          },
          hi: {
            needName: "आप कौन सी फसल बेच रहे हैं? टमाटर, प्याज, चावल, कपास या कोई भी बोलें।",
            needQty: (n) => `आपके पास ${n} कितने किलो या बोरी हैं?`,
            needPrice: (n) => `${n} का किलो का दाम क्या है? जैसे 30 रुपये प्रति किलो।`,
            allDone: (n, q, p) => `बढ़िया! ${n}, ${q} किलो, ₹${p} प्रति किलो। कुल ₹${Number(q) * Number(p)}। 'जमा करें' बोलें।`
          },
          kn: {
            needName: "ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಮಾರಾಟ ಮಾಡುತ್ತಿದ್ದೀರಿ? ಟೊಮೆಟೊ, ಈರುಳ್ಳಿ, ಭತ್ತ, ಹತ್ತಿ ಅಥವಾ ಯಾವುದೇ ಬೆಳೆಯ ಹೆಸರು ಹೇಳಿ.",
            needQty: (n) => `ನಿಮ್ಮ ಬಳಿ ${n} ಎಷ್ಟು ಕಿಲೋಗ್ರಾಂ ಅಥವಾ ಮೂಟೆ ಲಭ್ಯವಿದೆ?`,
            needPrice: (n) => `${n} ಪ್ರತಿ ಕಿಲೋಗ್ರಾಂ ಬೆಲೆ ಎಷ್ಟು? ಉದಾಹರಣೆಗೆ, 30 ರೂಪಾಯಿ ಎಂದು ಹೇಳಿ.`,
            allDone: (n, q, p) => `ಅದ್ಭುತ! ${n}, ${q} ಕೆಜಿ, ಪ್ರತಿ ಕೆಜಿಗೆ ₹${p}. ಒಟ್ಟು ಆದಾಯ ₹${Number(q) * Number(p)}. ಮಾರ್ಕೆಟ್‌ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು 'ಸಲ್ಲಿಸು' ಎಂದು ಹೇಳಿ.`
          },
          ta: {
            needName: "நீங்கள் என்ன பயிரை விற்கிறீர்கள்? தக்காளி, வெங்காயம், நெல், பருத்தி அல்லது ஏதேனும் பயிர் பெயர் சொல்லுங்கள்.",
            needQty: (n) => `உங்களிடம் ${n} எத்தனை கிலோ அல்லது மூட்டை உள்ளது?`,
            needPrice: (n) => `${n} ஒரு கிலோவுக்கு என்ன விலை? உதாரணத்திற்கு, 30 ரூபாய் என்று சொல்லுங்கள்.`,
            allDone: (n, q, p) => `அருமை! ${n}, ${q} கிலோ, கிலோவுக்கு ₹${p}. மொத்த வருமானம் ₹${Number(q) * Number(p)}. சந்தையில் பதிவேற்ற 'சமர்ப்பி' என்று சொல்லுங்கள்.`
          }
        };
        const L = PROMPTS[langKey] || PROMPTS.en;

        if (!nextName) replyText = L.needName;
        else if (!nextQty) replyText = L.needQty(nextName);
        else if (!nextPrice) replyText = L.needPrice(nextName, nextQty);
        else replyText = L.allDone(nextName, nextQty, nextPrice);
      }

      setAiMessage(replyText);
      setWizardStatus("speaking");
      await playTTS(replyText, lang);

      // Keep listening for next command (e.g. 'Submit', 'Change price to 40', 'Make organic')
      listenNext();
    };

    const listenNext = () => {
      if (!wizardActiveRef.current) return;
      setWizardStatus("listening");
      startListening(processTranscript, {
        fieldId: "guided_assistant",
        continuous: false,
        silenceDelay: 1400,
        onInterim: (text) => setWizardHeard(text)
      });
    };

    await playTTS(p.start, lang);
    listenNext();
  };

  const [weatherLive, setWeatherLive] = useState(null);
  const [tipsForm, setTipsForm] = useState({ crop:"", soil:"loamy" });

  const fetchLiveWeather = async () => {
    if (!form.latitude || !form.longitude) {
      setMsg({ type: "error", text: "Please detect your location in the Add Crop tab first!" });
      return;
    }
    setMlLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${form.latitude}&longitude=${form.longitude}&current=temperature_2m,relative_humidity_2m,precipitation`);
      const data = await res.json();
      setWeatherLive({
        temp: data.current.temperature_2m,
        hum: data.current.relative_humidity_2m,
        rain: data.current.precipitation
      });
      setMsg({ type: "success", text: "Live weather data fetched successfully." });
    } catch (e) {
      setMsg({ type: "error", text: "Failed to fetch live weather." });
    } finally {
      setMlLoading(false);
    }
  };

  const set = (k) => (val) => {
    setForm((f) => {
      let nextVal = val;
      if (typeof val === "function") nextVal = val(f[k]);
      else if (typeof val === "object" && val?.target) nextVal = val.target.value;
      const next = { ...f, [k]: nextVal };
      formRef.current = next;
      return next;
    });
  };

  const speak = (field) => startListening((transcript) => {
    const isNumeric = ["price", "quantity", "farmSize", "experience"].includes(field);
    setForm((f) => ({ ...f, [field]: isNumeric ? parseSpokenNumber(transcript) : transcript }));
  }, { fieldId: field });

  // For append mode (address fields etc.)
  const speakAppend = (field, getCurrentVal) => startListening((transcript) => {
    setForm((f) => {
      const current = f[field] || "";
      const sep = current && !current.endsWith(" ") ? " " : "";
      return { ...f, [field]: current + sep + transcript };
    });
  }, { fieldId: field });

  useEffect(() => { 
    fetchCrops();
    fetchOrders();
    fetchAuctions();
    API.get("/farmers/profile").then(res => setFarmerProfile(res.data)).catch(() => {});
    const socket = io(BASE_URL);
    socket.on("order_created", () => { 
      fetchCrops(); 
      fetchOrders(); 
      setMsg({ type: "success", text: "🔔 New Order Received! Check your orders tab." });
    });
    socket.on("auction_update", () => fetchAuctions());
    socket.on("farmer_verified", () => window.location.reload());

    // Listen for AI Autofill events
    const handleAINavigate = (e) => {
      if (e.detail.targetTab) setTab(e.detail.targetTab);
    };
    
    const handleAIStartWizard = () => {
      if (!wizardActiveRef.current) {
        toggleGuidedAssistant();
      }
    };

    const handleAIAutofill = (e) => {
      if (e.detail.context === "omnipresent_farmer" || e.detail.context === "farmer_add_crop") {
        if (e.detail.parsedData) {
          setTab("add");
          const pd = e.detail.parsedData;
          setForm(f => ({
            ...f,
            name: pd.name || f.name,
            category: pd.category || f.category,
            quantity: pd.quantity || f.quantity,
            unit: pd.unit || f.unit,
            price: pd.price || f.price,
            description: pd.description || f.description,
            farmTourUrl: pd.farmTourUrl || f.farmTourUrl,
            isOrganic: pd.isOrganic !== undefined ? pd.isOrganic : f.isOrganic,
            isPesticideFree: pd.isPesticideFree !== undefined ? pd.isPesticideFree : f.isPesticideFree
          }));
          
          let msg = "Got it. ";
          if (pd.name) msg += `${pd.name}. `;
          if (pd.quantity) msg += `${pd.quantity} ${pd.unit || "kg"}. `;
          if (pd.price) msg += `Price set to ${pd.price}. `;
          if (pd.isOrganic) msg += `Marked as organic. `;
          playTTS(msg, lang);
        }
      }
    };
    
    window.addEventListener("ai_autofill", handleAIAutofill);
    window.addEventListener("ai_navigate", handleAINavigate);
    window.addEventListener("ai_start_wizard", handleAIStartWizard);

    return () => {
      socket.disconnect();
      window.removeEventListener("ai_autofill", handleAIAutofill);
      window.removeEventListener("ai_navigate", handleAINavigate);
      window.removeEventListener("ai_start_wizard", handleAIStartWizard);
    };
  }, []);

  const fetchCrops = async () => {
    try {
      const res = await API.get("/crops");
      const mine = res.data.filter(c => c.farmer?._id === user?._id || c.farmer === user?._id);
      setCrops(mine);
    } catch {}
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get(`/orders/farmer/${user?._id}`);
      setOrders(res.data);
    } catch {}
  };

  const fetchAuctions = async () => {
    try {
      const res = await API.get(`/auctions/farmer/${user?._id}`);
      setAuctions(res.data);
    } catch {}
  };

  const createAuction = async () => {
    if (!auctionModal.quantity || !auctionModal.startingBid) return;
    try {
      await API.post("/auctions/create", {
        cropId: auctionModal.crop._id,
        farmerId: user._id,
        quantity: Number(auctionModal.quantity),
        startingBid: Number(auctionModal.startingBid),
        durationHours: Number(auctionModal.durationHours)
      });
      setMsg({ type: "success", text: "Auction created successfully!" });
      setAuctionModal({ isOpen: false, crop: null, quantity: "", startingBid: "", durationHours: "24" });
      fetchAuctions();
      fetchCrops();
      setTab("auctions");
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.error || "Error creating auction" });
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported"); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
        const d = await r.json();
        setForm((f) => ({
          ...f,
          location: d.display_name || `${coords.latitude},${coords.longitude}`,
          latitude: coords.latitude, longitude: coords.longitude
        }));
      } catch {
        setForm((f) => ({ ...f, latitude: coords.latitude, longitude: coords.longitude }));
      } finally { setLocLoading(false); }
    }, () => { alert("Cannot get location"); setLocLoading(false); });
  };

  const analyzeImage = async (file) => {
    setForm(f => ({ ...f, image: file, qualityGrade: null }));
    if (!file) return;
    
    setAnalyzingImage(true);
    setQualitySuggestion(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const res = await API.post("/ai/analyze-quality", { imageBase64: reader.result });
          setForm(f => ({ ...f, qualityGrade: res.data.grade }));
          setQualitySuggestion(`AI Vision detects Grade ${res.data.grade} Quality. ${res.data.suggestion}`);
        } catch (err) {
          console.error(err);
          // Fallback if AI fails or offline
          setForm(f => ({ ...f, qualityGrade: "B" }));
          setQualitySuggestion(`AI Vision is currently offline. Assigned standard Grade B quality.`);
        } finally {
          setAnalyzingImage(false);
        }
      };
    } catch (e) {
      setAnalyzingImage(false);
    }
  };

  const handleAddCrop = async () => {
    if (!form.name || !form.price || !form.quantity) { setMsg({ type:"error", text:"Name, price & quantity required." }); return; }
    
    // Price Limit Enforcement
    if (!form.isOrganic && priceRecommendation) {
      let limit = null;
      if (priceRecommendation.localPrediction && priceRecommendation.localPrediction.suggested_price) {
        limit = priceRecommendation.localPrediction.suggested_price * 1.5;
      } else if (priceRecommendation.suggestedMarketPrice) {
        limit = priceRecommendation.suggestedMarketPrice * 1.5;
      }
      
      if (limit && Number(form.price) > limit) {
        setMsg({ type:"error", text:`Price is too high! Max allowed for non-organic ${form.name} is ₹${Math.round(limit)}.` });
        return;
      }
    }

    setLoading(true); setMsg({ type:"", text:"" });
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "image") return; // handled separately below
        if (v === "" || v === null || v === undefined) return; // skip empty/null values
        fd.append(k, v);
      });
      if (user?._id) fd.append("farmer", user._id);
      if (form.image) fd.append("image", form.image);
      await API.post("/crops/add", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg({ type:"success", text:`✅ Crop "${form.name}" listed successfully!` });
      setForm({ name:"", description:"", price:"", quantity:"", unit:"kg", category:"vegetable", image:null, farmLocation:"", location:"", sameLocation:true, isOrganic:false, isPesticideFree:false, season:"kharif", harvestDate:"", latitude:"", longitude:"", isPrebooking:false, advancePaymentPercentage:0, farmTourUrl:"", qualityGrade:null, isBulk:false, minOrderQty:1 });
      setQualitySuggestion(null);
      setWizardStep(1);
      fetchCrops();
      setTab("crops");
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to add crop." });
    } finally { setLoading(false); }
  };

  const deleteCrop = async (id) => {
    if (!confirm("Remove this crop from marketplace?")) return;
    try { await API.delete(`/crops/${id}`); fetchCrops(); } catch {}
  };

  const toggleLiveStatus = async (id, currentStatus) => {
    try {
      await API.put(`/crops/${id}/live`, { isLive: !currentStatus });
      fetchCrops();
    } catch (err) {
      setMsg({ type: "error", text: "Failed to update status." });
    }
  };

  const editPrice = async (crop) => {
    const hasPaidPrebooked = orders.some(o => o.items.some(i => i.cropId === crop._id) && o.paymentStatus === "paid" && crop.isPrebooking);
    if (hasPaidPrebooked) {
      alert("Cannot edit price of a pre-booked crop that has already been paid for.");
      return;
    }

    let limit = null;
    if (!crop.isOrganic) {
      try {
        const payload = { crop: crop.name };
        if (user?.latitude && user?.longitude) {
          payload.latitude = user.latitude;
          payload.longitude = user.longitude;
        }
        const res = await API.post("/ml/price-trends", payload);
        if (res.data && res.data.localPrediction && res.data.localPrediction.suggested_price) {
          limit = res.data.localPrediction.suggested_price * 1.5;
        } else if (res.data && res.data.suggestedMarketPrice) {
          limit = res.data.suggestedMarketPrice * 1.5;
        }
      } catch (err) {}
    }

    const newPrice = prompt(`Enter new price for crop (Current: ₹${crop.price}):`, crop.price);
    if (newPrice && !isNaN(newPrice) && Number(newPrice) > 0) {
      if (limit && Number(newPrice) > limit) {
         alert(`Price is too high! Max allowed for non-organic ${crop.name} is ₹${Math.round(limit)}.`);
         return;
      }
      try {
        await API.put(`/crops/${crop._id}/price`, { price: Number(newPrice) });
        setMsg({ type: "success", text: "Price updated successfully! Live indicator triggered." });
        fetchCrops();
      } catch (err) {
        setMsg({ type: "error", text: "Failed to update price." });
      }
    }
  };

  const openEditCropModal = (crop) => {
    setEditCropModal({
      isOpen: true,
      crop: crop,
      name: crop.name,
      category: crop.category,
      unit: crop.unit,
      quantity: crop.quantity,
      price: crop.price
    });
  };

  const submitCropStage = async () => {
    try {
      setMsg({ type: "", text: "Uploading stage updates..." });
      const formData = new FormData();
      formData.append("lifecycleStage", stageModal.stage);
      formData.append("notes", stageModal.notes);
      if (stageModal.imageFile) {
        formData.append("image", stageModal.imageFile);
      }

      const res = await API.put(`/crops/${stageModal.cropId}/stage`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchCrops();
      setStageModal({ isOpen: false, cropId: null, stage: "sowing", notes: "", imageFile: null, imagePreview: "" });
      setMsg({ type: "success", text: `🌱 Stage Updated! AI Suggestion: ${res.data.aiSuggestion}` });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to update stage" });
    }
  };

  const uploadFarmTour = async (id, file) => {
    if (!file) return;
    try {
      setMsg({ type: "", text: "Uploading Farm Tour Video..." });
      const fd = new FormData();
      fd.append("video", file);
      await API.put(`/crops/${id}/tour`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      fetchCrops();
      setMsg({ type: "success", text: "✅ Farm Tour Video uploaded successfully!" });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to upload video" });
    }
  };

  const sellToAdmin = async (id) => {
    if (!window.confirm("Are you sure? Admin will buy this leftover stock at a 40% discount for Cold Storage Clearance.")) return;
    try {
      await API.put(`/crops/${id}/sell-to-admin`);
      setMsg({ type: "success", text: "Stock sold to Admin successfully! Clearance initiated." });
      fetchCrops();
    } catch (err) {
      setMsg({ type: "error", text: "Failed to sell stock to Admin." });
    }
  };

  const runCropSuggest = async () => {
    if (!weatherLive) return setMsg({ type: "error", text: "Please fetch live weather first." });
    setMlLoading(true); setMlResult(null);
    try {
      const res = await API.post("/ml/crop-suggest", { temp: weatherLive.temp, hum: weatherLive.hum, rain: weatherLive.rain });
      setMlResult(res.data);
    } catch { setMlResult({ error: "ML service unavailable" }); }
    finally { setMlLoading(false); }
  };

  const runFarmerTips = async () => {
    setMlLoading(true); setTipsResult(null);
    try {
      const res = await API.post("/ml/farmer-suggest", { crop: tipsForm.crop, soil: tipsForm.soil, location: form.location, stage: tipsForm.stage });
      setTipsResult(res.data);
    } catch { setTipsResult({ error: "ML service unavailable" }); }
    finally { setMlLoading(false); }
  };

  const runPestDetection = async () => {
    if (!pestPreview && !pestCropName.trim() && !pestSymptoms.trim()) {
      setMsg({ type: "error", text: "Please upload an image or describe the crop symptoms." });
      return;
    }
    setPestLoading(true);
    setPestResult(null);
    try {
      const res = await API.post("/ai/pest-detect", { 
        imageBase64: pestPreview,
        cropName: pestCropName,
        symptoms: pestSymptoms
      });
      setPestResult(res.data);
      setMsg({ type: "success", text: "Pest & Disease analysis complete!" });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to analyze pest. Please try again." });
    } finally {
      setPestLoading(false);
    }
  };

  const statusColor = (qty) => qty > 20 ? "badge-green" : qty > 5 ? "badge-yellow" : "badge-red";

  const isVerified = user?.isVerified;
  const totalRevenue = orders.reduce((a, o) => a + (o.subtotal || o.totalAmount || 0), 0);

  return (
    <div className="page-wrapper">
      {showPledge && <SecurityPledgeModal user={user} onAccepted={() => { setShowPledge(false); user.acceptedTerms = true; }} />}
      {/* Verification Banner */}
      {!isVerified && (
        <div className="verification-banner pending">
          <span style={{ fontSize:"1.5rem" }}>⏳</span>
          <div>
            <strong>Account Pending Verification</strong>
            <p style={{ fontSize:"0.82rem", opacity:0.85, marginTop:"0.2rem" }}>
              Our admin team is reviewing your account. You'll be able to list crops once verified. This ensures trust and quality for all buyers.
            </p>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="verification-banner verified" style={{ marginBottom:"1.5rem" }}>
          <span style={{ fontSize:"1.3rem" }}>✅</span>
          <span style={{ fontWeight:600 }}>Verified Farmer — You can list crops on the marketplace</span>
        </div>
      )}

      <div className="flex-between mb-3" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ textAlign:"left", fontSize:"1.8rem" }}>
            🌾 {t("welcome")}, {user?.name?.split(" ")[0] || "Farmer"}
          </h1>
          <p style={{ color:"var(--text-muted)", fontSize:"0.85rem" }}>Manage your crops & get AI-powered insights</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button 
             className="btn-secondary" 
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(22, 163, 74, 0.1)", color: "var(--green-deep)", border: "1px solid var(--green-light)", borderRadius: "8px", padding: "0.5rem 0.9rem" }}
             onClick={() => playTTS(`Welcome Farmer ${user?.name}. You are on the dashboard. Use the tabs below to manage your crops, orders, and tools.`, lang)}
          >
             🔊 Audio Guide
          </button>
          <button 
            className="btn-secondary" 
            style={{ width:"auto", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "8px", background: (isTTSPlaying() || window.speechSynthesis?.speaking) ? "#ef4444" : "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)", color: (isTTSPlaying() || window.speechSynthesis?.speaking) ? "white" : "var(--yellow-wheat)", fontWeight: 500 }}
            onClick={async () => {
              if (isTTSPlaying() || window.speechSynthesis?.speaking) {
                stopTTS();
                return;
              }
              const cropsList = crops.length > 0 ? crops.map(c => `${c.name}, ${c.quantity} ${c.unit} at ${c.price} rupees`).join(". ") : "no crops listed yet";
              const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "confirmed").length;
              const deliveredOrders = orders.filter(o => o.status === "delivered").length;
              const summary = `Dashboard Summary. You have ${crops.length} crops listed: ${cropsList}. You have ${orders.length} total orders, ${pendingOrders} pending, ${deliveredOrders} delivered. Your total revenue is ${totalRevenue} rupees. You have ${user?.rewardPoints || 0} reward points.`;
              
              if (lang === "en") {
                playTTS(summary, lang);
              } else {
                try {
                  const res = await API.post("/ai/chat", { 
                    prompt: `Translate the following English text to the language with language code '${lang}'. Respond ONLY with the translated text, no other words: "${summary}"`,
                    role: user?.role,
                    userId: user?._id,
                    lang
                  });
                  playTTS(res.data.response || res.data.reply || summary, lang);
                } catch (e) {
                  playTTS(summary, lang);
                }
              }
            }}
          >
            🔊 {isTTSPlaying() || window.speechSynthesis?.speaking ? "Stop" : "Read Summary"}
          </button>
          <button 
            className="btn-primary" 
            style={{ 
              width:"auto", 
              padding: "0.55rem 1.35rem", 
              borderRadius: "8px",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
              fontWeight: 600,
              opacity: isVerified ? 1 : 0.5 
            }} 
            onClick={() => isVerified ? setTab("add") : setMsg({ type:"error", text:"Your account must be verified before listing crops." })} 
            disabled={!isVerified}
          >
            ➕ {t("addCrop")}
          </button>
        </div>
      </div>

      {/* ── Farm Location & GPS Status Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        border: "1.5px solid #86efac",
        borderRadius: "14px",
        padding: "0.9rem 1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        boxShadow: "0 2px 8px rgba(34, 197, 94, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "#16a34a", color: "white", width: 40, height: 40,
            borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 10px rgba(22, 163, 74, 0.25)", flexShrink: 0
          }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.95rem", color: "#166534" }}>
                Farm Location: {user?.farmName ? `${user.farmName} — ` : ""}{user?.location || "No address set"}
              </strong>
              {user?.latitude && user?.longitude && (
                <span style={{
                  background: "#166534", color: "white", padding: "2px 8px", borderRadius: "100px",
                  fontSize: "0.72rem", fontWeight: 700
                }}>
                  GPS Active
                </span>
              )}
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#4b5563" }}>
              {user?.latitude && user?.longitude 
                ? `📍 Coordinates: ${Number(user.latitude).toFixed(4)}° N, ${Number(user.longitude).toFixed(4)}° E • Visible to buyers on Marketplace Map Mode` 
                : "⚠️ No GPS coordinates detected. Set your farm location so buyers can locate your harvest on the map."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLocModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            padding: "0.55rem 1.1rem", borderRadius: "100px",
            background: "#16a34a", color: "white", border: "none",
            fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)"
          }}
        >
          <LocateFixed size={16} /> Update Farm Location
        </button>
      </div>

      {/* Stats row */}
      <div className="grid-4 mb-3">
        {[
          { icon:"🌱", label:"My Crops", value: crops.length },
          { icon:"📦", label:"Orders", value: orders.length },
          { icon:"💰", label:"Revenue", value: `₹${totalRevenue.toLocaleString()}` },
          { icon:"🏆", label:"Reward Points", value: user?.rewardPoints || 0 }
        ].map((s,i) => (
          <div className="stat-card" key={i}>
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      
      <EcoAdvisor cropName={crops.length > 0 ? crops[0].name : "your crops"} />

      {msg.text && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      {/* ── DAILY FARM OPERATIONS & PRODUCE MANAGEMENT QUICK-BAR ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(22, 163, 74, 0.09), rgba(16, 185, 129, 0.04))",
        border: "1.5px solid rgba(22, 163, 74, 0.28)",
        borderRadius: "16px",
        padding: "1rem 1.25rem",
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{ maxWidth: "560px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.25rem" }}>🌾</span>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text-dark)" }}>
              Daily Farm Operations & Produce Hub
            </h3>
            <span style={{
              background: "#dcfce7", color: "#15803d", fontSize: "0.72rem",
              fontWeight: 800, padding: "2px 8px", borderRadius: "100px"
            }}>
              Primary Daily View
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            Quickly update crop listings, add today's fresh harvests, adjust mandi market prices, and process incoming buyer orders.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              if (!isVerified) {
                setMsg({ type: "error", text: "Your account must be verified by an admin or agent before adding crops." });
                return;
              }
              setTab("add");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "100px",
              fontSize: "0.88rem",
              fontWeight: 700,
              background: tab === "add" ? "#14532d" : "linear-gradient(135deg, #16a34a, #15803d)",
              color: "white",
              border: "none",
              boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>➕</span> Add Fresh Crop
          </button>

          <button
            type="button"
            onClick={() => setTab("crops")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.65rem 1.15rem",
              borderRadius: "100px",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: tab === "crops" ? "#dcfce7" : "white",
              border: tab === "crops" ? "2px solid #16a34a" : "1.5px solid #cbd5e1",
              color: "#166534",
              cursor: "pointer"
            }}
          >
            🌿 My Crops ({crops.length})
          </button>

          <button
            type="button"
            onClick={() => setShowToolsDrawer(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.65rem 1.15rem",
              borderRadius: "100px",
              fontSize: "0.85rem",
              fontWeight: 700,
              background: SPECIALIZED_TOOL_KEYS.includes(tab) ? "linear-gradient(135deg, #0284c7, #0369a1)" : "white",
              color: SPECIALIZED_TOOL_KEYS.includes(tab) ? "white" : "#0284c7",
              border: SPECIALIZED_TOOL_KEYS.includes(tab) ? "none" : "1.5px solid #0284c7",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.15)",
              cursor: "pointer"
            }}
          >
            <Sliders size={15} />
            <span>Seasonal &amp; Agri-Tools (19+)</span>
            <span style={{
              background: SPECIALIZED_TOOL_KEYS.includes(tab) ? "rgba(255,255,255,0.25)" : "#e0f2fe",
              color: SPECIALIZED_TOOL_KEYS.includes(tab) ? "white" : "#0369a1",
              fontSize: "0.7rem",
              fontWeight: 800,
              padding: "1px 6px",
              borderRadius: "8px"
            }}>
              Drawer
            </span>
          </button>
        </div>
      </div>

      {/* ── WORKSPACE HEADER IF SPECIALIZED TOOL IS ACTIVE ── */}
      {SPECIALIZED_TOOL_KEYS.includes(tab) ? (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(135deg, #f0fdf4, #e0f2fe)",
          border: "1.5px solid rgba(2, 132, 199, 0.3)",
          borderRadius: "14px",
          padding: "0.75rem 1.25rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
          boxShadow: "0 4px 15px rgba(2, 132, 199, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setTab("crops")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.45rem 0.95rem",
                borderRadius: "100px",
                background: "#166534",
                color: "white",
                border: "none",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(22, 101, 52, 0.3)"
              }}
            >
              <ArrowLeft size={15} /> Back to Daily Dashboard (My Crops)
            </button>
            
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "#374151" }}>
              <span style={{ color: "#0369a1", fontWeight: 700 }}>🌾 Seasonal Suite</span>
              <span>/</span>
              <strong style={{ color: "#0f172a" }}>
                {SPECIALIZED_TOOL_GROUPS.flatMap(g => g.tools).find(t => t.k === tab)?.l || tab}
              </strong>
              {SPECIALIZED_TOOL_GROUPS.flatMap(g => g.tools).find(t => t.k === tab)?.freq && (
                <span style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontSize: "0.72rem",
                  fontWeight: 700
                }}>
                  {SPECIALIZED_TOOL_GROUPS.flatMap(g => g.tools).find(t => t.k === tab)?.freq}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setShowToolsDrawer(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.45rem 0.85rem",
                borderRadius: "100px",
                background: "white",
                color: "#0369a1",
                border: "1.5px solid #0284c7",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <Sliders size={14} /> Switch Tool (19+) ▾
            </button>
          </div>
        </div>
      ) : (
        /* ── DAILY NAVIGATION TABS ── */
        <div className="tab-bar mb-3">
          {[
            { k: "crops", l: `🌿 My Crops (${crops.length})` },
            { k: "add", l: `➕ ${t("addCrop")}` },
            { k: "orders", l: `📦 Daily Orders (${orders.length})` },
            { k: "apmc", l: "🏛️ All India APMC Mandis" },
            { k: "demand", l: "📊 Demand & Dynamic Pricing" },
            { k: "auctions", l: `🔨 Live Auctions (${auctions.length})` }
          ].map(tb => (
            <button
              key={tb.k}
              className={`tab-btn ${tab === tb.k ? "active" : ""}`}
              onClick={() => {
                if (tb.k === "add" && !isVerified) {
                  setMsg({ type: "error", text: "Account not verified yet." });
                  return;
                }
                setTab(tb.k);
              }}
            >
              {tb.l}
            </button>
          ))}

          <button
            type="button"
            className="tab-btn"
            onClick={() => setShowToolsDrawer(true)}
            style={{
              background: "#f0fdf4",
              border: "1.5px dashed #16a34a",
              color: "#166534",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            <Sliders size={14} /> More Seasonal Tools (19+) ▾
          </button>
        </div>
      )}

      {/* ── APMC MANDI EXPLORER TAB ── */}
      {tab === "apmc" && <APMCMandiExplorer />}

      {/* ── CROP HISTORY & REVENUE LEDGER TAB ── */}
      {tab === "cropHistory" && <FarmerCropHistory />}

      {/* ── WEED CONTROL ADVISOR TAB ── */}
      {tab === "weedControl" && <WeedControlAdvisor />}

      {/* ── SELECTIVE BREEDING ADVISOR TAB ── */}
      {tab === "selectiveBreeding" && <SelectiveBreedingAdvisor />}

      {/* ── DEMAND & PRICING INTELLIGENCE TAB ── */}
      {tab === "demand" && (
        <div className="ml-card">
          <h3 className="section-title">📊 Demand & Pricing Intelligence Center</h3>
          <p style={{ color: "var(--text-muted)", fontSize:"0.82rem", marginBottom:"1rem" }}>
            Real-time consumer search trends, government mandi historical records, and dynamic pricing calculations.
          </p>
          <DemandPanel onSelectCropForListing={(cropData) => {
            setForm(f => ({ ...f, name: cropData.name, price: cropData.price || f.price, quantity: cropData.quantity || f.quantity }));
            setTab("add");
            setWizardStep(2);
          }} />
        </div>
      )}

      {/* ── MY CROPS TAB ── */}
      {tab === "crops" && (
        <div>
          {crops.length === 0 ? (
            <div className="glass-card text-center" style={{ padding:"3rem" }}>
              <p style={{ fontSize:"3rem" }}>🌱</p>
              <p style={{ color: "var(--text-muted)", marginTop:"1rem" }}>
                {isVerified ? "No crops listed yet. Add your first crop!" : "Get verified to start listing crops."}
              </p>
              {isVerified && <button className="btn-primary mt-2" style={{ width:"auto" }} onClick={() => setTab("add")}>+ Add Crop</button>}
            </div>
          ) : (
            <>
              {/* Growing (Pre-booking) Section */}
              <div className="glass-card mb-3" style={{ background: "rgba(234, 179, 8, 0.05)", border: "1px solid rgba(234, 179, 8, 0.2)" }}>
                <h3 className="section-title" style={{ color: "var(--yellow-wheat)" }}>🌱 Growing Stage (Pre-booking)</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Crops still growing. Customers can pre-book them. Once harvested, transfer them to Live Sale.</p>
                {crops.filter(c => c.isPrebooking).length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No crops in growing stage.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="rs-table">
                      <thead>
                        <tr><th>{t("crop")}</th><th>Available to Pre-book</th><th>{t("price")}</th><th>{t("category")}</th><th>Lifecycle</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {crops.filter(c => c.isPrebooking).map(c => (
                          <tr key={c._id}>
                            <td><strong style={{ color: "var(--text-dark)" }}>{c.name}</strong></td>
                            <td><span className={`badge ${statusColor(c.quantity)}`}>{c.quantity} {c.unit}</span></td>
                            <td style={{ color:"var(--yellow-wheat)" }}>₹{c.price}/{c.unit}</td>
                            <td style={{ textTransform:"capitalize", color: "var(--text-muted)", fontSize:"0.85rem" }}>{c.category}</td>
                            <td>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", color: "var(--text-dark)", border: "1px solid var(--green-pale)", borderRadius: "4px" }}
                                onClick={() => setStageModal({ isOpen: true, cropId: c._id, stage: c.lifecycleStage || "sowing", notes: "", imageFile: null, imagePreview: "" })}
                              >
                                🔄 {c.lifecycleStage || "sowing"}
                              </button>
                            </td>
                            <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <button className="btn-primary" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem", background: "var(--green-mid)" }} onClick={async () => {
                                if (confirm(`Transfer remaining ${c.quantity} ${c.unit} of ${c.name} to Live Sale?`)) {
                                  try { await API.put(`/crops/${c._id}/transfer-to-sale`); setMsg({ type: "success", text: "Crop transferred to Live Sale!" }); fetchCrops(); }
                                  catch { setMsg({ type: "error", text: "Failed to transfer crop." }); }
                                }
                              }}>➡️ Transfer to Sale</button>
                              <button className="btn-secondary" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem" }} onClick={() => { setTipsForm(f => ({...f, crop: c.name, stage: c.lifecycleStage || "sowing"})); setTab("tips"); }}>💡 Advice</button>
                              <button className="btn-secondary" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem" }} onClick={() => openEditCropModal(c)}>✏️</button>
                              <button className="btn-danger" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem" }} onClick={() => deleteCrop(c._id)}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Harvested (Live Sale) Section */}
              <div className="glass-card mb-3" style={{ background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                <h3 className="section-title" style={{ color: "var(--green-primary)" }}>✅ Harvested (Live Sale)</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Crops ready for immediate purchase and delivery.</p>
                {crops.filter(c => !c.isPrebooking).length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No crops currently on Live Sale.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="rs-table">
                      <thead>
                        <tr><th>{t("crop")}</th><th>Available {t("quantity")}</th><th>{t("price")}</th><th>{t("category")}</th><th>Live Visibility</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {crops.filter(c => !c.isPrebooking && !c.isAdminStock).map(c => (
                          <tr key={c._id}>
                            <td><strong style={{ color: "var(--text-dark)" }}>{c.name}</strong></td>
                            <td><span className={`badge ${statusColor(c.quantity)}`}>{c.quantity} {c.unit}</span></td>
                            <td style={{ color:"var(--yellow-wheat)" }}>₹{c.price}/{c.unit}</td>
                            <td style={{ textTransform:"capitalize", color: "var(--text-muted)", fontSize:"0.85rem" }}>{c.category}</td>
                            <td>
                              <label className="switch" style={{ position:"relative", display:"inline-block", width:"40px", height:"20px" }}>
                                <input type="checkbox" checked={c.isLive !== false} onChange={() => toggleLiveStatus(c._id, c.isLive !== false)} style={{ opacity:0, width:0, height:0 }} />
                                <span style={{ position:"absolute", cursor:"pointer", top:0, left:0, right:0, bottom:0, backgroundColor: c.isLive !== false ? "var(--green-mid)" : "#ccc", borderRadius:"20px", transition:".4s" }}></span>
                              </label>
                            </td>
                            <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <button className="btn-secondary" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem" }} onClick={() => openEditCropModal(c)}>✏️ Edit</button>
                              
                              {["vegetable", "fruit"].includes(c.category.toLowerCase()) && (
                                <button className="btn-secondary" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem", background: "var(--yellow-wheat)", color: "white", border: "none" }} onClick={() => sellToAdmin(c._id)} title="Sell leftovers to Admin at discount">❄️ Sell to Admin</button>
                              )}
                              
                              <button className="btn-secondary" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem", background: "var(--blue-mid)", color: "white", border: "none" }} onClick={() => setAuctionModal({ isOpen: true, crop: c, quantity: c.quantity, startingBid: c.price, durationHours: "24" })}>🔨 Auction</button>
                              <label className="btn-secondary" style={{ padding:"0.35rem 0.5rem", fontSize:"0.78rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem", margin: 0 }}>
                                🎥 {c.farmTourVideo ? "Update Tour" : "Record Tour"}
                                <input type="file" accept="video/*" capture="environment" style={{ display: "none" }} onChange={(e) => uploadFarmTour(c._id, e.target.files[0])} />
                              </label>
                              <button className="btn-danger" style={{ padding:"0.35rem 0.75rem", fontSize:"0.78rem" }} onClick={() => deleteCrop(c._id)}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── AUCTIONS TAB ── */}
      {tab === "auctions" && (
        <div>
          <div className="flex-between mb-2">
            <h2 className="section-title">🔨 B2B Auctions</h2>
            <button className="btn-primary" onClick={() => setTab("crops")}>+ Create Auction from Crops</button>
          </div>
          {auctions.length === 0 ? (
            <div className="glass-card text-center" style={{ padding: "3rem" }}>
              <p style={{ color: "var(--text-muted)" }}>No active auctions. List a bulk harvest to start bidding!</p>
            </div>
          ) : (
            <div className="grid-cards">
              {auctions.map(a => (
                <div key={a._id} className="glass-card" style={{ borderLeft: "4px solid var(--primary)" }}>
                  <h3>{a.crop?.name} ({a.quantity} {a.crop?.unit})</h3>
                  <p>Starting Bid: ₹{a.startingBid}</p>
                  <p>Current Highest: <strong style={{ color: "var(--green-mid)" }}>₹{a.currentHighestBid}</strong></p>
                  <p>Ends: {new Date(a.endTime).toLocaleString()}</p>
                  <span className={`badge ${a.status === "active" ? "badge-green" : "badge-yellow"}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === "orders" && (
        <div className="glass-card" style={{ overflowX:"auto" }}>
          <div className="flex-between mb-3">
            <h3 className="section-title mb-0">📦 Incoming Orders</h3>
            <button 
              className="btn-secondary" 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 1rem", fontSize: "0.9rem" }}
              onClick={() => {
                if (window.speechSynthesis && window.speechSynthesis.speaking) {
                  window.speechSynthesis.cancel();
                  return;
                }
                if (!orders || orders.length === 0) {
                  playTTS("You have no incoming orders.", lang);
                  return;
                }
                const text = `You have ${orders.length} orders. ` + orders?.map((o, i) => `Order ${i+1}: ${o.quantity} units of ${o.crop?.name || "crop"} for ${o.totalAmount} rupees.`).join(" ");
                playTTS(text, lang);
              }}
            >
              🔊 Toggle Read Orders
            </button>
          </div>
          {!orders || orders.length === 0 ? (
            <p style={{ color:"var(--text-muted)", textAlign:"center", padding:"2rem" }}>No orders received yet.</p>
          ) : (
            <table className="rs-table">
              <thead><tr><th>Order</th><th>Crop</th><th>Customer</th><th>Qty</th><th>Amount</th><th>Type</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {orders?.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>#{o.billNumber || o._id.substring(0,8).toUpperCase()}</td>
                    <td><strong style={{ color: "var(--text-dark)" }}>{o.crop?.name || "—"}</strong></td>
                    <td style={{ color: "var(--text-muted)", fontSize:"0.85rem" }}>{o.customer?.name || "—"}</td>
                    <td style={{ color: "var(--text-dark)" }}>{o.quantity}</td>
                    <td style={{ color:"var(--yellow-wheat)", fontWeight:700 }}>₹{(o.totalAmount||0).toLocaleString()}</td>
                    <td><span className={`badge ${o.deliveryType==="farm_pickup"?"badge-green":"badge-blue"}`}>{o.deliveryType==="farm_pickup"?"🏡 Pickup":"🚚 Delivery"}</span></td>
                    <td><span className={`badge ${o.status==="delivered"?"badge-green":o.status==="cancelled"?"badge-red":"badge-yellow"}`}>{o.status?.replace("_"," ")}</span></td>
                    <td style={{ color:"var(--text-muted)", fontSize:"0.75rem" }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-secondary" style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", display: "flex", gap: "0.3rem" }} onClick={() => setViewOrder(o)}>
                        👁️ Details
                      </button>
                      {(o.status === "in_transit" || o.status === "picked_up") && (
                        <button className="btn-secondary" style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", display: "flex", gap: "0.3rem" }} onClick={() => setTrackingOrder(o)}>
                          <Navigation size={12} /> Track
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ADD CROP TAB ── */}
      {tab === "add" && isVerified && (
        <div className="guided-layout">
        <div className="glass-card" style={{ flex: 1 }}>
          <div className="flex-between mb-2">
            <h3 className="section-title mb-0">🌿 {t("addCrop")}</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                type="button" 
                className={`btn-primary ${wizardActive ? "pulse" : ""}`} 
                style={{ width:"auto", background:"var(--green-mid)", color:"#fff", fontWeight:600, padding:"0.5rem 1rem", border: "2px solid var(--green-primary)" }} 
                onClick={startGuidedWizard}
              >
                {wizardActive ? "🎙️ Assistant Listening..." : "🌾 Rythu Jana Sethu Assistant"}
              </button>
            </div>
          </div>
          <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>
            Step {wizardStep} of 3 • {wizardStep === 1 ? "Basic Details" : wizardStep === 2 ? "Logistics & Pricing" : "Quality & Upload"}
          </p>

          <AnimatePresence mode="wait">
            {wizardStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {/* 1. Visual Photo Grid for Quick/Illiterate Tap & Speak Selection */}
                <CropVisualPicker 
                  selectedCrop={form.name} 
                  onSelectCrop={handleVisualCropSelect} 
                />

                <div className="grid-2 mt-3">
                  <GuidedInput 
                    label={`${t("cropName")} *`} 
                    value={form.name} 
                    onChange={set("name")} 
                    placeholder="e.g. Tomato, Rice, Chilli..." 
                    badge="Voice & Visual"
                    helperText="Speak crop name or tap an image card above"
                  />
                  <GuidedInput 
                    label={t("category")} 
                    value={form.category} 
                    onChange={set("category")} 
                    options={CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} 
                    helperText="Select or speak: Vegetable, Fruit, Grain, etc."
                  />
                </div>

                <div className="flex-between mt-3">
                  <div></div>
                  <button type="button" className="btn-primary" onClick={() => {
                    setWizardStep(2);
                  }}>Next: Pricing & Quantity ➡️</button>
                </div>
              </motion.div>
            )}

            {wizardStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="grid-3">
                  <GuidedInput
                    label={`${t("price")} (₹) *`}
                    type="number"
                    value={form.price}
                    onChange={set("price")}
                    placeholder="e.g. 35"
                    badge="Per Unit"
                    helperText="Expected price in Rupees"
                  />
                  <GuidedInput
                    label={`${t("quantity")} *`}
                    type="number"
                    value={form.quantity}
                    onChange={set("quantity")}
                    placeholder="e.g. 100"
                    badge="Available Stock"
                    helperText="Total available harvest"
                  />
                  <GuidedInput
                    label="Unit *"
                    value={form.unit}
                    onChange={set("unit")}
                    options={["kg","g","quintal","bag","crate","ton","litre","piece","dozen"].map(u => ({ value: u, label: u }))}
                    helperText="Standard selling unit"
                  />
                </div>

                {/* 1-Tap Low-Literacy Quantity Presets */}
                <div style={{ marginTop: "0.75rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
                    ⚡ 1-Tap Harvest Quantity Presets (రైతుల కోసం సులభమైన ఎంపిక):
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {[
                      { qty: 25, unit: "kg", label: "25 kg (Small Bag)" },
                      { qty: 50, unit: "kg", label: "50 kg (Standard Sack)" },
                      { qty: 100, unit: "kg", label: "100 kg (1 Quintal)" },
                      { qty: 250, unit: "kg", label: "250 kg" },
                      { qty: 500, unit: "kg", label: "500 kg (Half Ton)" },
                      { qty: 1000, unit: "kg", label: "1000 kg (1 Ton / Truckload)" },
                      { qty: 2000, unit: "kg", label: "2000 kg (2 Tons)" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, quantity: preset.qty, unit: preset.unit }))}
                        style={{
                          background: Number(form.quantity) === preset.qty && form.unit === preset.unit ? "var(--green-mid)" : "rgba(34, 197, 94, 0.08)",
                          color: Number(form.quantity) === preset.qty && form.unit === preset.unit ? "white" : "var(--green-deep)",
                          border: Number(form.quantity) === preset.qty && form.unit === preset.unit ? "1px solid var(--green-mid)" : "1px solid rgba(34, 197, 94, 0.3)",
                          padding: "4px 10px",
                          borderRadius: "100px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1-Tap Price Steppers */}
                <div style={{ marginTop: "0.5rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>
                    💰 Quick Price Adjustment:
                  </span>
                  {[
                    { diff: -10, label: "-₹10" },
                    { diff: -5, label: "-₹5" },
                    { diff: +5, label: "+₹5" },
                    { diff: +10, label: "+₹10" },
                  ].map(adj => (
                    <button
                      key={adj.label}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, price: Math.max(1, (Number(f.price) || 0) + adj.diff) }))}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--text-dark)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        padding: "3px 9px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {adj.label}
                    </button>
                  ))}
                </div>

                {wizardBenchmark && (
                  <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--green-deep)", background: "rgba(34, 197, 94, 0.08)", padding: "0.6rem 0.9rem", borderRadius: "8px", border: "1px dashed var(--green-mid)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      <strong>💡 APMC Benchmark:</strong> Mandi Avg: ₹{wizardBenchmark.avg}/{wizardBenchmark.unit} (Range: ₹{wizardBenchmark.min} - ₹{wizardBenchmark.max})
                    </span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, price: wizardBenchmark.avg }))} style={{ background: "var(--green-mid)", color: "white", border: "none", padding: "3px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                      Apply ₹{wizardBenchmark.avg}
                    </button>
                  </div>
                )}

                {/* Dynamic Demand-Based Pricing Advisor Tool */}
                <div style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
                  <button
                    type="button"
                    onClick={handleCalculateDemandPrice}
                    disabled={calculatingDemandPrice}
                    style={{
                      background: "linear-gradient(135deg, #16a34a, #047857)",
                      color: "white",
                      border: "none",
                      padding: "0.55rem 1.1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)"
                    }}
                  >
                    <Sparkles size={16} /> {calculatingDemandPrice ? "Analyzing Real-time Consumer Search Demand..." : "🤖 Auto-Calculate Optimal Demand Price"}
                  </button>

                  {demandPricingResult && (
                    <div style={{
                      marginTop: "0.6rem",
                      background: "rgba(22, 163, 74, 0.08)",
                      border: "1px solid #86efac",
                      borderRadius: "10px",
                      padding: "0.9rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#166534" }}>
                            💡 Recommended Demand Price: ₹{demandPricingResult.recommendedPrice} / {form.unit || "kg"}
                          </span>
                          <span style={{ marginLeft: "8px", fontSize: "0.75rem", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "100px", fontWeight: 700 }}>
                            {demandPricingResult.priceChangePercent >= 0 ? `+${demandPricingResult.priceChangePercent}% Surge Capture 🚀` : `${demandPricingResult.priceChangePercent}% Discount`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, price: demandPricingResult.recommendedPrice }))}
                          style={{
                            background: "#16a34a",
                            color: "white",
                            border: "none",
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          ✅ Apply ₹{demandPricingResult.recommendedPrice}
                        </button>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#374151" }}>
                        🔍 Consumer Searches: <strong>{demandPricingResult.consumerSearchCount}</strong> • Mandi Benchmark: <strong>₹{demandPricingResult.mandiBenchmark}</strong> • Demand Multiplier: <strong>{demandPricingResult.demandMultiplier}x</strong>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic" }}>
                        {demandPricingResult.explanation}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid-2 mt-2">
                  <div className="toggle-row" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span className="toggle-label" style={{ fontWeight: 600 }}>📅 Allow Pre-booking?</span>
                    <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer" }}>
                      <input type="checkbox" checked={form.isPrebooking} onChange={(e) => setForm(f=>({...f,isPrebooking:e.target.checked}))} style={{ width:18,height:18 }} />
                      <span style={{ color:"var(--text-muted)", fontSize:"0.85rem" }}>Yes, accept advance pre-orders</span>
                    </label>
                  </div>
                  <div className="toggle-row" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span className="toggle-label" style={{ fontWeight: 600 }}>📦 Wholesale / Bulk Selling?</span>
                    <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer" }}>
                      <input type="checkbox" checked={form.isBulk} onChange={(e) => setForm(f=>({...f,isBulk:e.target.checked}))} style={{ width:18,height:18 }} />
                      <span style={{ color:"var(--text-muted)", fontSize:"0.85rem" }}>Yes, sell in bulk to events/groups</span>
                    </label>
                  </div>
                  {form.isPrebooking && (
                    <div className="form-group mb-2" style={{ background: "rgba(234, 179, 8, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px dashed rgba(234, 179, 8, 0.3)" }}>
                      <label className="field-label">Expected Harvest Date</label>
                      <input className="rs-input" type="date" value={form.harvestDate} onChange={set("harvestDate")} min={new Date().toISOString().split("T")[0]} />
                      <label className="field-label mt-2" style={{ display: "block", marginTop: "1rem" }}>
                        Advance Payment % Required from Customer
                        <span style={{ marginLeft: "0.5rem", color: "var(--text-muted)", fontWeight: 400, fontSize: "0.8rem" }}>(e.g. 20 = customer pays 20% advance to confirm order)</span>
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <input className="rs-input" type="number" min="0" max="100" value={form.advancePaymentPercentage || 0} onChange={(e) => setForm(f => ({ ...f, advancePaymentPercentage: Math.min(100, Math.max(0, Number(e.target.value))) }))} style={{ maxWidth: "100px" }} />
                        <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>%</span>
                        {form.advancePaymentPercentage > 0 && form.price && (
                          <span style={{ fontSize: "0.85rem", color: "#d97706", fontWeight: 600 }}>= ₹{Math.round((form.advancePaymentPercentage / 100) * Number(form.price))} advance per {form.unit}</span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        This creates a binding pre-booking agreement. Customer pays this advance. Remainder is paid on delivery.
                      </p>
                    </div>
                  )}

                  <GuidedInput
                    label="Current Lifecycle Stage"
                    value={form.lifecycleStage}
                    onChange={set("lifecycleStage")}
                    options={[
                      { value: "sowing", label: "🌱 Sowing / Just Planted" },
                      { value: "vegetative", label: "🌿 Vegetative / Growing" },
                      { value: "flowering", label: "🌸 Flowering" },
                      { value: "harvesting", label: "🚜 Harvesting" },
                      { value: "post_harvest", label: "📦 Post-Harvest" },
                      { value: "ready", label: "✅ Ready for Sale" }
                    ]}
                  />

                  {form.isBulk && (
                    <GuidedInput
                      label="Minimum Order Qty (for Bulk)"
                      type="number"
                      value={form.minOrderQty}
                      onChange={set("minOrderQty")}
                    />
                  )}
                </div>

                <div className="grid-2 mt-2">
                  <div>
                    <GuidedInput
                      label="📍 Farm Location *"
                      value={form.farmLocation}
                      onChange={set("farmLocation")}
                      placeholder="Village, Mandal, District..."
                      helperText="Your farm address"
                    />
                    <div style={{ marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                      <LocationButton
                        compact
                        onLocation={({ address, lat, lng }) => {
                          setForm(f => ({ ...f, farmLocation: address, latitude: lat, longitude: lng }));
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer" }}>
                        <input type="checkbox" checked={form.sameLocation} onChange={(e) => {
                          const checked = e.target.checked;
                          setForm(f => ({ ...f, sameLocation: checked, location: checked ? f.farmLocation : f.location }));
                        }} />
                        Same as Farm Location
                      </label>
                    </div>
                    <GuidedInput
                      label="📍 Stored Location *"
                      value={form.sameLocation ? form.farmLocation : form.location}
                      onChange={(e) => { if (!form.sameLocation) set("location")(e); }}
                      placeholder="Where is harvest stored?"
                      helperText="Warehouse or farm pickup spot"
                    />
                  </div>
                </div>

                <div className="flex-between mt-3">
                  <button type="button" className="btn-secondary" onClick={() => setWizardStep(1)}>⬅️ Back</button>
                  <button type="button" className="btn-primary" onClick={() => setWizardStep(3)}>Next: Quality & Description ➡️</button>
                </div>
              </motion.div>
            )}

            {wizardStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <GuidedInput
                  label="Crop Description"
                  type="textarea"
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Fresh naturally harvested crop directly from local farm..."
                  helperText="Speak details to auto-compose appealing description"
                />
                
                <div className="grid-2 mt-2">
                  <div className="toggle-row" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: form.isOrganic ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.03)", padding: "0.8rem", borderRadius: "10px", border: form.isOrganic ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="toggle-label" style={{ fontWeight: 600, color: form.isOrganic ? "#22c55e" : "inherit" }}>🌿 100% Organic Produce?</span>
                    <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer" }}>
                      <input type="checkbox" checked={form.isOrganic} onChange={(e) => setForm(f=>({...f,isOrganic:e.target.checked}))} style={{ width:18,height:18 }} />
                      <span style={{ fontSize:"0.85rem" }}>Yes, grown with zero chemical fertilizers</span>
                    </label>
                  </div>
                  <div className="toggle-row" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: form.isPesticideFree ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.03)", padding: "0.8rem", borderRadius: "10px", border: form.isPesticideFree ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="toggle-label" style={{ fontWeight: 600, color: form.isPesticideFree ? "#22c55e" : "inherit" }}>🛡️ Zero Pesticide Sprays?</span>
                    <label style={{ display:"flex", alignItems:"center", gap:"0.5rem", cursor:"pointer" }}>
                      <input type="checkbox" checked={form.isPesticideFree} onChange={(e) => setForm(f=>({...f,isPesticideFree:e.target.checked}))} style={{ width:18,height:18 }} />
                      <span style={{ fontSize:"0.85rem" }}>Yes, no chemical pesticide sprays</span>
                    </label>
                  </div>
                </div>

                <div className="mt-2">
                  <GuidedInput 
                    label="Farm Tour Video URL (Optional)" 
                    type="url" 
                    placeholder="https://youtube.com/..." 
                    value={form.farmTourUrl || ""} 
                    onChange={set("farmTourUrl")} 
                    helperText="Link a video showing your farm to build buyer trust"
                  />
                </div>

                <div className="form-group mt-2">
                  <label className="field-label">Crop Image & AI Quality Analysis</label>
                  <label className="file-upload-area">
                    <input type="file" accept="image/*" onChange={(e) => analyzeImage(e.target.files[0])} />
                    <span className="file-upload-icon">📷</span>
                    <p className="file-upload-text">{form.image ? `✅ ${form.image.name}` : "Click or tap to take / upload crop photo"}</p>
                  </label>
                  
                  {analyzingImage && (
                    <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--green-mid)", fontSize: "0.9rem" }}>
                      <span className="loader" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Analyzing crop quality...
                    </div>
                  )}
                  
                  {qualitySuggestion && !analyzingImage && (
                    <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--green-mid)", borderRadius: "8px", fontSize: "0.9rem", color: "var(--green-deep)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "1.2rem" }}>✨</span>
                      <div>
                        <strong>AI Quality Analysis Complete</strong>
                        <p style={{ margin: 0, marginTop: "0.25rem" }}>{qualitySuggestion}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-between mt-3">
                  <button type="button" className="btn-secondary" onClick={() => setWizardStep(2)}>⬅️ Back</button>
                  <button type="button" className="btn-primary" onClick={handleAddCrop} disabled={loading} style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", fontSize: "1rem", padding: "0.75rem 1.5rem" }}>
                    {loading ? "Listing..." : "🌾 List Produce on Marketplace"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RYTHU JANA SETHU AGRICULTURAL OFFICER COMPANION CARD ── */}
        <div className="form-guide-box" style={{ background: "linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.9))", backdropFilter: "blur(20px)", border: "1.5px solid rgba(34, 197, 94, 0.35)", borderRadius: "20px", padding: "1.5rem", boxShadow: "0 20px 45px rgba(0,0,0,0.45)" }}>
          
          {/* Officer Companion Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem", flexWrap: "wrap", gap: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ position: "relative" }}>
                <img 
                  src="/rythu_officer.jpg" 
                  alt="Rythu Jana Sethu Agricultural Officer" 
                  style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2.5px solid #22c55e", boxShadow: "0 4px 16px rgba(34, 197, 94, 0.35)", display: "block" }} 
                />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", border: "2.5px solid #0f172a" }}></span>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <h4 style={{ margin: 0, color: "#86efac", fontSize: "1.08rem", fontWeight: 800 }}>రైతు జన సేతు వ్యవసాయ అధికారి</h4>
                  <span style={{ fontSize: "0.72rem", background: "rgba(34, 197, 94, 0.2)", color: "#86efac", padding: "2px 8px", borderRadius: "100px", fontWeight: 700 }}>Krishi Sahayak</span>
                </div>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#cbd5e1" }}>
                  Rythu Jana Sethu Agricultural Extension Officer • Speak in your mother tongue
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="tts-btn" 
              onClick={() => playTTS(aiMessage || "నమస్కారం రైతు సోదరులారా! మీ వద్ద ఉన్న పంట పేరు, బస్తాలు లేదా కిలోలు, ధర చెప్పండి. నేను మొత్తం వివరాలు నింపుతాను.", lang)} 
              title="Hear Assistant Guidance"
              style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#86efac", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.1rem" }}
            >
              🔊
            </button>
          </div>

          {/* Officer Live Speech Bubble */}
          <div style={{ 
            background: wizardStatus === "listening" ? "rgba(34, 197, 94, 0.12)" : (wizardStatus === "analyzing" ? "rgba(59, 130, 246, 0.12)" : "rgba(255,255,255,0.04)"), 
            border: wizardStatus === "listening" ? "1.5px solid rgba(34, 197, 94, 0.45)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "14px", 
            padding: "1rem", 
            marginBottom: "1.2rem",
            transition: "all 0.3s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              {wizardStatus === "listening" && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                  <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "0.88rem" }}>🎙️ వింటున్నాను... మాట్లాడండి! (Listening... Speak freely!)</span>
                </div>
              )}
              {wizardStatus === "analyzing" && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="loader" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                  <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: "0.88rem" }}>⚡ వివరాలు పరిశీలిస్తున్నాను... (AI Processing Details...)</span>
                </div>
              )}
              {wizardStatus === "speaking" && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Volume2 size={16} color="#fbbf24" className="animate-pulse" />
                  <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.88rem" }}>🔊 అధికారి మాట్లాడుతున్నారు... (Officer Speaking...)</span>
                </div>
              )}
              {(wizardStatus === "idle" || wizardStatus === "ready") && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={16} color="var(--green-mid)" />
                  <span style={{ color: "var(--green-mid)", fontWeight: 700, fontSize: "0.88rem" }}>
                    {wizardStatus === "ready" ? "✅ అన్ని వివరాలు నమోదయ్యాయి! (Details Captured Ready)" : "🟢 అధికారి అందుబాటులో ఉన్నారు (Officer Ready)"}
                  </span>
                </div>
              )}
            </div>

            {/* Spoken Hearing Transcript */}
            {wizardHeard && (
              <div style={{ background: "rgba(0,0,0,0.35)", padding: "0.6rem 0.8rem", borderRadius: "8px", fontSize: "0.85rem", color: "#e2e8f0", fontStyle: "italic", marginBottom: "0.5rem", borderLeft: "3px solid var(--green-mid)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block", fontStyle: "normal", fontWeight: 600 }}>మీరు చెప్పింది (Heard):</span>
                "{wizardHeard}"
              </div>
            )}

            {/* Officer Advice / Message */}
            <div style={{ background: "rgba(34, 197, 94, 0.08)", padding: "0.65rem 0.85rem", borderRadius: "10px", fontSize: "0.86rem", color: "#86efac", lineHeight: 1.4 }}>
              <strong>🌾 సలహాదారు (Officer):</strong> {aiMessage || "నమస్కారం! పంట పేరు (ఉదా: టమాటో, మిర్చి, వరి), పరిమాణం, మరియు మీరు ఆశించే ధర చెప్పండి లేదా కింద ఉన్న ఫోటోలను తాకండి."}
            </div>
          </div>

          {/* Extracted Harvest Details Tags */}
          <div style={{ marginBottom: "1.2rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>నమోదైన పంట వివరాలు (Live Captured Data)</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.5rem" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: form.name ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(255,255,255,0.06)", padding: "0.6rem 0.75rem", borderRadius: "10px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>🌾 పంట పేరు (Crop)</span>
                <div style={{ fontWeight: 700, color: form.name ? "#22c55e" : "#94a3b8", fontSize: "0.95rem" }}>{form.name || "— Not Set —"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: form.quantity ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(255,255,255,0.06)", padding: "0.6rem 0.75rem", borderRadius: "10px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>⚖️ పరిమాణం (Harvest Qty)</span>
                <div style={{ fontWeight: 700, color: form.quantity ? "#22c55e" : "#94a3b8", fontSize: "0.95rem" }}>{form.quantity ? `${form.quantity} ${form.unit || 'kg'}` : "— Not Set —"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: form.price ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(255,255,255,0.06)", padding: "0.6rem 0.75rem", borderRadius: "10px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>💰 నిర్ణయించిన ధర (Price)</span>
                <div style={{ fontWeight: 700, color: form.price ? "#22c55e" : "#94a3b8", fontSize: "0.95rem" }}>{form.price ? `₹${form.price}/${form.unit || 'kg'}` : "— Not Set —"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "0.6rem 0.75rem", borderRadius: "10px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>🌿 పద్ధతి (Category)</span>
                <div style={{ fontWeight: 700, color: form.isOrganic ? "#22c55e" : "#cbd5e1", fontSize: "0.95rem" }}>{form.isOrganic ? "✅ 100% సేంద్రీయ (Organic)" : "సాధారణ (Standard)"}</div>
              </div>
            </div>
          </div>

          {/* APMC Market Benchmark & Revenue Preview */}
          {(form.name || form.quantity || form.price) && (
            <div style={{ 
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.06))", 
              border: "1px solid rgba(34, 197, 94, 0.3)", 
              borderRadius: "14px", 
              padding: "1rem", 
              marginBottom: "1.2rem" 
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#86efac", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <TrendingUp size={15} /> APMC మార్కెట్ సమాచారం (Mandi Benchmark)
                </span>
                {wizardBenchmark && (
                  <span style={{ fontSize: "0.72rem", background: "rgba(34, 197, 94, 0.25)", color: "#86efac", padding: "3px 8px", borderRadius: "6px", fontWeight: 700 }}>
                    {wizardBenchmark.trend}
                  </span>
                )}
              </div>

              {wizardBenchmark && (
                <div style={{ fontSize: "0.84rem", color: "#e2e8f0", marginBottom: "0.5rem" }}>
                  ప్రభుత్వ మార్కెట్ సగటు ధర: <strong>₹{wizardBenchmark.avg}/{wizardBenchmark.unit}</strong> (పరిధి: ₹{wizardBenchmark.min} - ₹{wizardBenchmark.max})
                </div>
              )}

              {form.quantity && form.price ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.3)", padding: "0.6rem 0.9rem", borderRadius: "10px", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>💵 మొత్తం అంచనా ఆదాయం (Projected Revenue):</span>
                  <strong style={{ fontSize: "1.2rem", color: "#4ade80", fontWeight: 800 }}>
                    ₹{(Number(form.quantity) * Number(form.price)).toLocaleString('en-IN')}
                  </strong>
                </div>
              ) : null}
            </div>
          )}

          {/* Voice Controls & Clear Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.2rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button 
                type="button" 
                className={`btn-primary ${wizardActive ? "pulse" : ""}`}
                onClick={startGuidedWizard}
                style={{ flex: 2, minWidth: 200, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.2rem", fontSize: "0.95rem", fontWeight: 800, borderRadius: "12px" }}
              >
                <Mic size={18} /> {wizardActive ? "⏸️ మాట్లాడటం ఆపండి (Pause Voice)" : "🎙️ అధికారితో మాట్లాడండి (Speak to Officer)"}
              </button>
              
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  const langKey = (lang ? lang.split("-")[0] : "en") || "en";
                  const f = form;
                  let summary = "";
                  if (!f.name) {
                    summary = langKey === "te" ? "ఇంకా ఏ పంట వివరాలు నింపలేదు. దయచేసి మాట్లాడండి లేదా ఫోటో ఎంచుకోండి." : "No crop details filled yet. Please speak or pick a photo.";
                  } else {
                    const rev = f.quantity && f.price ? (f.quantity * f.price).toLocaleString('en-IN') : "0";
                    if (langKey === "te") {
                      summary = `మీ పంట ${f.name}. పరిమాణం ${f.quantity || 0} ${f.unit || 'కేజీలు'}. ధర కేజీకి ${f.price || 0} రూపాయలు. ${f.isOrganic ? 'ఇది సేంద్రీయ పంట.' : ''} మొత్తం అంచనా ఆదాయం ${rev} రూపాయలు.`;
                    } else if (langKey === "hi") {
                      summary = `आपकी फसल ${f.name} है। मात्रा ${f.quantity || 0} ${f.unit || 'किलो'}। दाम ₹${f.price || 0} प्रति किलो। ${f.isOrganic ? 'यह जैविक फसल है।' : ''} कुल कमाई ₹${rev}।`;
                    } else {
                      summary = `Crop: ${f.name}. Quantity: ${f.quantity || 0} ${f.unit || 'kg'}. Price: ₹${f.price || 0} per ${f.unit || 'kg'}. ${f.isOrganic ? '100% Organic.' : ''} Total projected earnings: ₹${rev}.`;
                    }
                  }
                  setAiMessage(summary);
                  playTTS(summary, langKey);
                }}
                style={{ flex: 1.2, minWidth: 150, padding: "0.65rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.3)", color: "#93c5fd", borderRadius: "12px" }}
                title="🔊 Read Form Summary Aloud"
              >
                <Volume2 size={16} /> 🔊 వివరాలు వినండి (Read)
              </button>

              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => {
                  setForm({ name:"", description:"", price:"", quantity:"", unit:"kg", category:"vegetable", image:null, farmLocation:"", location:"", sameLocation:true, isOrganic:false, isPesticideFree:false, season:"kharif", harvestDate:"", latitude:"", longitude:"", isPrebooking:false, lifecycleStage: "ready", farmTourUrl:"", qualityGrade:null, isBulk:false, minOrderQty:1 });
                  setWizardHeard("");
                  setWizardBenchmark(null);
                  setAiMessage("వివరాలు క్లియర్ చేయబడ్డాయి. కొత్త పంట వివరాలు చెప్పండి.");
                }}
                style={{ padding: "0.65rem 0.9rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", borderRadius: "12px" }}
                title="Clear all fields"
              >
                <RefreshCw size={14} /> రీసెట్ (Clear)
              </button>
            </div>
          </div>

          {/* 1-Tap Harvest Crop Quick Pills for Low-Literacy Farmers */}
          <div style={{ marginBottom: "1.2rem" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>
              ⚡ తాకితే స్వయంచాలకంగా నిండే పంటలు (1-Tap Instant Presets):
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              <button 
                type="button" 
                onClick={() => {
                  setForm(f => ({ ...f, name: "Tomato", category: "vegetable", quantity: 50, price: 35, unit: "kg", isOrganic: true }));
                  setWizardStep(2);
                  const msg = "50 కేజీల సేంద్రీయ టమాటో కేజీ ₹35 చొప్పున నింపబడింది.";
                  setAiMessage(msg);
                  playTTS(msg, lang);
                }}
                style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.35)", borderRadius: "100px", padding: "5px 12px", fontSize: "0.78rem", color: "#86efac", cursor: "pointer", fontWeight: 700 }}
              >
                🍅 50 kg Tomato ₹35
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  setForm(f => ({ ...f, name: "Onion", category: "vegetable", quantity: 1000, price: 30, unit: "kg", isOrganic: false }));
                  setWizardStep(2);
                  const msg = "1000 కేజీల ఉల్లిగడ్డ కేజీ ₹30 చొప్పున నింపబడింది.";
                  setAiMessage(msg);
                  playTTS(msg, lang);
                }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "5px 12px", fontSize: "0.78rem", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}
              >
                🧅 1000 kg Onion ₹30
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setForm(f => ({ ...f, name: "Chili", category: "spice", quantity: 100, price: 120, unit: "kg", isOrganic: true }));
                  setWizardStep(2);
                  const msg = "100 కేజీల నాణ్యమైన ఎర్ర మిర్చి కేజీ ₹120 చొప్పున నింపబడింది.";
                  setAiMessage(msg);
                  playTTS(msg, lang);
                }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "5px 12px", fontSize: "0.78rem", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}
              >
                🌶️ 100 kg Chili ₹120
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setForm(f => ({ ...f, name: "Rice", category: "grain", quantity: 500, price: 48, unit: "kg", isOrganic: true }));
                  setWizardStep(2);
                  const msg = "500 కేజీల సోనా మసూరి బియ్యం కేజీ ₹48 చొప్పున నింపబడింది.";
                  setAiMessage(msg);
                  playTTS(msg, lang);
                }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "5px 12px", fontSize: "0.78rem", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}
              >
                🌾 500 kg Rice ₹48
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setForm(f => ({ ...f, name: "Cotton", category: "other", quantity: 1000, price: 72, unit: "kg", isOrganic: false }));
                  setWizardStep(2);
                  const msg = "1000 కేజీల పత్తి కేజీ ₹72 చొప్పున నింపబడింది.";
                  setAiMessage(msg);
                  playTTS(msg, lang);
                }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "5px 12px", fontSize: "0.78rem", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}
              >
                ☁️ 1000 kg Cotton ₹72
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setForm(f => ({ ...f, name: "Mango", category: "fruit", quantity: 250, price: 85, unit: "kg", isOrganic: true }));
                  setWizardStep(2);
                  const msg = "250 కేజీల బంగినపల్లి మామిడి కేజీ ₹85 చొప్పున నింపబడింది.";
                  setAiMessage(msg);
                  playTTS(msg, lang);
                }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "5px 12px", fontSize: "0.78rem", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}
              >
                🥭 250 kg Mango ₹85
              </button>
            </div>
          </div>

          {/* 1-Tap Direct Publish Crop Listing */}
          <div style={{ marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button 
              type="button" 
              onClick={handleAddCrop}
              disabled={!form.name || !form.price || !form.quantity || loading}
              style={{ 
                width: "100%", 
                background: form.name && form.price && form.quantity ? "linear-gradient(135deg, #16a34a, #15803d)" : "rgba(255,255,255,0.06)", 
                border: "none", 
                borderRadius: "14px", 
                padding: "0.95rem 1.5rem", 
                fontSize: "1.05rem", 
                color: form.name && form.price && form.quantity ? "#ffffff" : "#64748b", 
                cursor: form.name && form.price && form.quantity ? "pointer" : "not-allowed", 
                fontWeight: 800,
                boxShadow: form.name && form.price && form.quantity ? "0 6px 20px rgba(22, 163, 74, 0.4)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                transition: "all 0.3s ease"
              }}
            >
              {loading ? (
                <span>🔄 పబ్లిష్ అవుతోంది (Publishing Listing)...</span>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>✨ పంటను నేరుగా మార్కెట్లో ప్రకటించండి (Publish Crop Now)</span>
                </>
              )}
            </button>
            {!form.name || !form.price || !form.quantity ? (
              <p style={{ textAlign: "center", margin: "6px 0 0 0", fontSize: "0.76rem", color: "#94a3b8" }}>
                💡 పైనున్న వాయిస్ బటన్ లేదా ఫోటో ద్వారా పంట, పరిమాణం, ధర నింపగానే ఈ బటన్ ఆన్ అవుతుంది.
              </p>
            ) : null}
          </div>

        </div>
        </div>
      )}

      {/* ── AI CHAT ASSISTANT TAB ── */}
      {tab === "aiChat" && (
        <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h3 className="section-title">💬 Farm AI Assistant</h3>
          <p style={{ color: "var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>Ask me anything about farming, weather, or marketplace prices!</p>
          
          <div className="chat-window" style={{ height: "400px", overflowY: "auto", background: "rgba(0,0,0,0.3)", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {chatHistory.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>No messages yet. Say hello!</div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", background: msg.role === "user" ? "var(--green-mid)" : "rgba(255,255,255,0.1)", padding: "0.5rem 1rem", borderRadius: "12px", maxWidth: "80%", wordWrap: "break-word" }}>
                  <strong style={{ display: "block", fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.2rem" }}>{msg.role === "user" ? "You" : "AI"}</strong>
                  {msg.text}
                </div>
              ))
            )}
            {chatLoading && <div style={{ alignSelf: "flex-start", color: "var(--yellow-wheat)" }}>AI is typing...</div>}
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              type="text" 
              className="rs-input" 
              placeholder="E.g. What is the best time to sow tomatoes?" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)} 
              onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
            />
            <button className="btn-primary" style={{ width: "auto" }} onClick={handleSendChat} disabled={chatLoading}>Send</button>
          </div>
        </div>
      )}

      {/* ── ML SUGGESTIONS TAB ── */}
      {tab === "ml" && (
        <div className="grid-2">
          <div className="ml-card">
            <h3 className="section-title">🌤️ {t("cropSuggest")}</h3>
            <p style={{ color: "var(--text-muted)", fontSize:"0.82rem", marginBottom:"1rem" }}>Uses Real-Time Weather via Open-Meteo API.</p>
            
            {weatherLive && (
              <div className="grid-3 mb-2" style={{ gap:"0.75rem" }}>
                <div className="stat-card" style={{ padding: "1rem" }}>
                  <div className="stat-icon" style={{ fontSize: "1.5rem", width: "40px", height: "40px" }}>🌡️</div>
                  <div className="stat-value" style={{ fontSize: "1.2rem" }}>{weatherLive.temp}°C</div>
                  <div className="stat-label">Temp</div>
                </div>
                <div className="stat-card" style={{ padding: "1rem" }}>
                  <div className="stat-icon" style={{ fontSize: "1.5rem", width: "40px", height: "40px" }}>💧</div>
                  <div className="stat-value" style={{ fontSize: "1.2rem" }}>{weatherLive.hum}%</div>
                  <div className="stat-label">Humidity</div>
                </div>
                <div className="stat-card" style={{ padding: "1rem" }}>
                  <div className="stat-icon" style={{ fontSize: "1.5rem", width: "40px", height: "40px" }}>🌧️</div>
                  <div className="stat-value" style={{ fontSize: "1.2rem" }}>{weatherLive.rain}mm</div>
                  <div className="stat-label">Rainfall</div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn-secondary" onClick={getLocation} disabled={locLoading}>
                {locLoading ? "Detecting..." : "📍 Select My Farm Address"}
              </button>
              <button className="btn-secondary" onClick={fetchLiveWeather} disabled={mlLoading || !form.latitude}>
                {mlLoading ? t("detecting") : `📡 ${t("fetchWeather")} for Farm`}
              </button>
            </div>
            {form.latitude && !weatherLive && <p style={{ fontSize:"0.8rem", color: "var(--text-muted)" }}>Farm address selected. Ready to fetch weather.</p>}

            <button className="btn-primary mt-2" onClick={runCropSuggest} disabled={mlLoading || !weatherLive}>
              {mlLoading ? t("loading") : `🤖 Analyze Weather & ${t("suggestCrop")}`}
            </button>
            {mlResult && !mlResult.error && (
              <div className="ml-result" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>🤖 AI Recommended Crop</p>
                    <h3 style={{ margin: "0.25rem 0", color: "var(--yellow-wheat)", fontSize: "1.5rem" }}>
                      🌾 {mlResult.recommended_crop}
                      <button type="button" className="tts-btn" onClick={() => playTTS(`Recommended Crop is ${mlResult.recommended_crop}. Confidence ${mlResult.confidence} percent. ${mlResult.farming_tips?.[0] || ""}`, lang)} style={{ marginLeft: "0.5rem" }}>🔊</button>
                    </h3>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{mlResult.category} • {mlResult.water_requirement} water • ~{mlResult.growth_duration_days} days</span>
                  </div>
                  <div style={{ textAlign: "center", background: "rgba(34,197,94,0.15)", padding: "0.75rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--green-mid)" }}>{mlResult.confidence}%</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Confidence</div>
                  </div>
                </div>

                {/* Scoring Breakdown */}
                {mlResult.scoring_breakdown && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                    {[
                      { label: "🌡️ Temperature", value: mlResult.scoring_breakdown.temperature_match },
                      { label: "💧 Humidity", value: mlResult.scoring_breakdown.humidity_match },
                      { label: "🌧️ Rainfall", value: mlResult.scoring_breakdown.rainfall_match },
                    ].map((item, i) => (
                      <div key={i} style={{ background: "rgba(0,0,0,0.2)", padding: "0.6rem", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>{item.label}</div>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${item.value}%`, background: item.value > 70 ? "var(--green-mid)" : item.value > 40 ? "var(--yellow-wheat)" : "#ef4444", borderRadius: 3, transition: "width 0.5s" }} />
                        </div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)", marginTop: "0.2rem" }}>{item.value}%</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Weather Risk */}
                {mlResult.weather_risk && (
                  <div style={{ padding: "0.6rem", borderRadius: "8px", marginBottom: "1rem", background: mlResult.weather_risk === "Low" ? "rgba(34,197,94,0.08)" : mlResult.weather_risk === "Medium" ? "rgba(234,179,8,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${mlResult.weather_risk === "Low" ? "rgba(34,197,94,0.2)" : mlResult.weather_risk === "Medium" ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      {mlResult.weather_risk === "Low" ? "✅" : mlResult.weather_risk === "Medium" ? "⚠️" : "🚨"} Weather Risk: {mlResult.weather_risk}
                    </span>
                    {mlResult.risk_details?.length > 0 && (
                      <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.2rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {mlResult.risk_details.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {/* Alternatives */}
                {mlResult.alternatives?.length > 0 && (
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>🔄 Alternative Crops</p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {mlResult.alternatives.map((alt, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "0.4rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <strong style={{ color: "var(--text-dark)" }}>{alt.name}</strong>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{alt.confidence}%</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>({alt.season})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Farming Tips */}
                {mlResult.farming_tips?.length > 0 && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>💡 Actionable Tips</p>
                    {mlResult.farming_tips.map((tip, i) => (
                      <p key={i} style={{ fontSize: "0.82rem", color: "var(--text-dark)", margin: "0.2rem 0", display: "flex", gap: "0.4rem" }}>
                        <span>•</span> {tip}
                      </p>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.75rem", fontStyle: "italic" }}>{mlResult.note}</p>
              </div>
            )}
            {mlResult?.error && <div className="alert alert-error mt-2">⚠️ {mlResult.error}</div>}
          </div>

          <div className="ml-card">
            <h3 className="section-title">📊 {t("demandForecast")}</h3>
            <p style={{ color: "var(--text-muted)", fontSize:"0.82rem", marginBottom:"1rem" }}>Discover which crops are in highest demand.</p>
            <DemandPanel onSelectCropForListing={(cropData) => {
              setForm(f => ({ ...f, name: cropData.name, price: cropData.price || f.price, quantity: cropData.quantity || f.quantity }));
              setTab("add");
              setWizardStep(2);
            }} />
          </div>

          <YieldPredictor />
        </div>
      )}

      {/* ── FARMING TIPS TAB ── */}
      {tab === "tips" && (
        <div className="ml-card">
          <h3 className="section-title">💡 {t("farmerTips")}</h3>
          <p style={{ color: "var(--text-muted)", fontSize:"0.82rem", marginBottom:"1rem" }}>Get personalized farming advice.</p>
          <div className="grid-2">
            <AutoSuggestInput value={tipsForm.crop} onChange={(val) => setTipsForm(f=>({...f,crop:val}))}
              onSpeak={() => startListening((transcript) => {
                setTipsForm(f => ({ ...f, crop: transcript }));
              }, { fieldId: "tipsCrop" })}
              onFocus={() => setFocusField("tipsCrop")}
              onTTS={() => playTTS(`Crop is ${tipsForm.crop}`, lang)}
              listening={listening && activeField === "tipsCrop"} interim={interim} label="Crop Name" placeholder="e.g. Rice, Wheat..." fieldType="crop" />
            <div className="form-group">
              <label className="field-label">{t("soilType")}</label>
              <select className="rs-select" value={tipsForm.soil} onChange={(e) => setTipsForm(f=>({...f,soil:e.target.value}))}>
                {SOILS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary mt-2" onClick={runFarmerTips} disabled={mlLoading || !tipsForm.crop} style={{ maxWidth:200 }}>
            {mlLoading ? t("loading") : "💡 Get Tips"}
          </button>
          {tipsResult && !tipsResult.error && (
            <div className="ml-result mt-2">
              <p><strong style={{ color:"var(--yellow-wheat)" }}>Crop:</strong> {tipsResult.crop} | <strong style={{ color:"var(--yellow-wheat)" }}>Soil:</strong> {tipsResult.soil_type}</p>
              <ul style={{ marginTop:"0.75rem", paddingLeft:"1.25rem" }}>
                {tipsResult.suggestions?.map((s,i) => (
                  <li key={i} style={{ color: "var(--text-dark)", fontSize:"0.88rem", marginBottom:"0.4rem" }}>✅ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {tipsResult?.error && <div className="alert alert-error mt-2">⚠️ {tipsResult.error}</div>}

          {/* Smart Advisor Widget inside Tips Tab */}
          <div className="glass-card mt-3">
            <h3 className="section-title">🌦️ Smart Farming Advisor</h3>
            <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>Get real-time sowing, irrigation, and harvesting advice based on your current weather.</p>
            <button className="btn-secondary mb-2" onClick={fetchLiveWeather}>
              {mlLoading ? "Fetching Weather..." : "📡 Refresh Local Weather"}
            </button>
            {weatherLive && (
              <div className="grid-3 mb-2" style={{ background: "rgba(59, 130, 246, 0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <div><strong>Temperature:</strong> {weatherLive.temp}°C</div>
                <div><strong>Humidity:</strong> {weatherLive.hum}%</div>
                <div><strong>Rainfall:</strong> {weatherLive.rain} mm</div>
              </div>
            )}
            <p style={{ color:"var(--text-muted)", fontSize:"0.85rem" }}>* Uses location from Add Crop tab to fetch current weather context for the ML suggestion engine.</p>
          </div>
        </div>
      )}

      {/* ── BROADCAST TAB ── */}
      {tab === "broadcast" && (
        <div className="glass-card">
          <h3 className="section-title">📢 Send Broadcast Notification</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Reach out directly to your past customers or nearby groups.</p>
          
          <div className="form-group">
            <label className="field-label">Target Audience</label>
            <select className="rs-select" value={broadcastTarget} onChange={(e) => setBroadcastTarget(e.target.value)}>
              <option value="all_customers">All Past Customers</option>
              <option value="group_members">My Group Selling Members</option>
              <option value="nearby_customers">Nearby Customers (10km)</option>
            </select>
          </div>
          
          <div className="form-group mt-2">
            <label className="field-label">Message</label>
            <textarea 
              className="rs-input" 
              rows="4" 
              placeholder="E.g., Fresh organic tomatoes just harvested! Available at 10% discount today."
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
            />
          </div>
          
          <button className="btn-primary mt-2" style={{ width: "auto" }} onClick={handleFarmerBroadcast}>
            Send Broadcast 🚀
          </button>
        </div>
      )}
      {/* ── PROFIT CALCULATOR TAB ── */}
      {tab === "profit" && (
        <div className="glass-card">
          <h3 className="section-title">💰 Crop Profit Calculator</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Calculate expected net profit based on your estimated costs and yields.</p>
          
          <div className="grid-2">
            <div>
              <VoiceField label="Crop Name" value={profitCalc.cropName} onChange={(val) => setProfitCalc({...profitCalc, cropName: val})} placeholder="e.g., Tomato" />
              <VoiceField label="Expected Yield (kg)" type="number" value={profitCalc.expectedYield} onChange={(val) => setProfitCalc({...profitCalc, expectedYield: val})} placeholder="100" />
              <VoiceField label="Expected Market Price (per kg)" type="number" value={profitCalc.expectedPrice} onChange={(val) => setProfitCalc({...profitCalc, expectedPrice: val})} placeholder="40" />
            </div>
            
            <div>
              <VoiceField label="Seed Cost (₹)" type="number" value={profitCalc.seedCost} onChange={(val) => setProfitCalc({...profitCalc, seedCost: val})} placeholder="500" />
              <VoiceField label="Fertilizer/Pesticide Cost (₹)" type="number" value={profitCalc.fertilizerCost} onChange={(val) => setProfitCalc({...profitCalc, fertilizerCost: val})} placeholder="1200" />
              <VoiceField label="Equipment/Tractor Cost (₹)" type="number" value={profitCalc.equipmentCost} onChange={(val) => setProfitCalc({...profitCalc, equipmentCost: val})} placeholder="2000" />
              <VoiceField label="Labor Cost (₹)" type="number" value={profitCalc.laborCost} onChange={(val) => setProfitCalc({...profitCalc, laborCost: val})} placeholder="3000" />
            </div>
          </div>
          
          <div className="glass-card-dark mt-3" style={{ textAlign: "center" }}>
            <h4 style={{ color: "var(--text-dark)" }}>Estimated Financials</h4>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Total Revenue</p>
                <p style={{ fontSize: "1.2rem", color: "var(--yellow-wheat)", fontWeight: "bold" }}>
                  ₹{ (Number(profitCalc.expectedYield) * Number(profitCalc.expectedPrice)) || 0 }
                </p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Total Costs</p>
                <p style={{ fontSize: "1.2rem", color: "#e11d48", fontWeight: "bold" }}>
                  ₹{ (Number(profitCalc.seedCost) + Number(profitCalc.fertilizerCost) + Number(profitCalc.equipmentCost) + Number(profitCalc.laborCost)) || 0 }
                </p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Net Profit</p>
                <p style={{ fontSize: "1.4rem", color: "var(--green-light)", fontWeight: "bold" }}>
                  ₹{ ((Number(profitCalc.expectedYield) * Number(profitCalc.expectedPrice)) - (Number(profitCalc.seedCost) + Number(profitCalc.fertilizerCost) + Number(profitCalc.equipmentCost) + Number(profitCalc.laborCost))) || 0 }
                </p>
              </div>
            </div>
            <button className="btn-secondary mt-3" onClick={() => setProfitCalc({cropName: "", expectedYield: "", expectedPrice: "", seedCost: "", fertilizerCost: "", equipmentCost: "", laborCost: ""})}>Reset Calculator</button>
          </div>
        </div>
      )}
      {/* ── WAREHOUSE PLANNING TAB ── */}
      {tab === "warehouse" && (
        <div className="glass-card">
          <h3 className="section-title">🏭 Warehouse & Supply Planning</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            Track your current stock levels and see local community demand to plan storage efficiently.
          </p>

          <div className="grid-2">
            {crops.filter(c => c.quantity > 0).map(crop => (
              <div key={crop._id} className="glass-card-dark" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ color: "var(--text-dark)", margin: 0 }}>{crop.name}</h4>
                  <span className={`badge ${crop.quantity > 500 ? "badge-green" : "badge-yellow"}`}>
                    Stock: {crop.quantity} {crop.unit}
                  </span>
                </div>
                
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Storage recommendation based on community demand trends:
                </p>

                {crop.quantity > 500 ? (
                  <div style={{ padding: "0.75rem", background: "rgba(225, 29, 72, 0.05)", border: "1px solid rgba(225, 29, 72, 0.2)", borderRadius: "8px" }}>
                    <p style={{ fontSize: "0.8rem", color: "#e11d48", margin: 0 }}>
                      ⚠️ Oversupply risk. Consider adding a discount or listing in the Group Selling pool to move stock faster.
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "0.75rem", background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "8px" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--green-primary)", margin: 0 }}>
                      ✅ Healthy stock level. Local demand is stable. Hold current pricing.
                    </p>
                  </div>
                )}
                
                <button className="btn-secondary mt-1" style={{ fontSize: "0.75rem", padding: "0.4rem" }} onClick={() => setTab("groups")}>
                  Move to Group Pool
                </button>
              </div>
            ))}
          </div>

          {crops.filter(c => c.quantity > 0).length === 0 && (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
              No active stock available in your warehouse.
            </p>
          )}
        </div>
      )}

      {/* ── POLICIES TAB ── */}
      {tab === "policies" && (
        <div className="glass-card">
          <h3 className="section-title">📜 Farmer Policies & Guidelines</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Please adhere to the following rules to ensure a secure and trustworthy marketplace. Violations may result in point deductions or account suspension.
          </p>
          <div className="grid-2">
            <div style={{ background: "rgba(22, 163, 74, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(22, 163, 74, 0.2)" }}>
              <h4 style={{ color: "var(--green-deep)", marginBottom: "0.5rem" }}>✅ Quality Assurance</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>You must ensure the quality and quantity of the crop exactly matches what is listed. The delivery agent will verify the product upon pickup.</p>
            </div>
            <div style={{ background: "rgba(225, 29, 72, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(225, 29, 72, 0.2)" }}>
              <h4 style={{ color: "#e11d48", marginBottom: "0.5rem" }}>🚨 No Misleading Info</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>False claims regarding Organic/Pesticide-Free status will lead to immediate Trust Score reduction and potential ban.</p>
            </div>
            <div style={{ background: "rgba(37, 99, 235, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
              <h4 style={{ color: "#2563eb", marginBottom: "0.5rem" }}>📦 Timely Readiness</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>Crops must be packed and ready before the agent arrives. Delays caused by the farmer will negatively impact your rating.</p>
            </div>
            <div style={{ background: "rgba(217, 119, 6, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(217, 119, 6, 0.2)" }}>
              <h4 style={{ color: "#d97706", marginBottom: "0.5rem" }}>⚖️ Fair Pricing</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>Do not manipulate prices artificially. The admin monitors price changes to protect customer interests.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPORT / CONTACT ADMIN TAB ── */}
      {tab === "support" && (
        <div className="glass-card">
          <h3 className="section-title">🛠️ Contact Admin / Report Issue</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Need help or want to report an issue with an agent, customer, or order? Send a support ticket directly to the admin team.
          </p>
          <div className="form-group">
            <label className="field-label">Subject</label>
            <input type="text" className="rs-input" id="ticketSubject" placeholder="e.g., Payment issue with Order #RS-1234" />
          </div>
          <div className="form-group mt-2">
            <label className="field-label">Details / Message</label>
            <textarea className="rs-input" id="ticketMessage" rows="4" placeholder="Describe your issue in detail..."></textarea>
          </div>
          <button className="btn-primary mt-2" style={{ width: "auto" }} onClick={async () => {
            const subject = document.getElementById("ticketSubject").value;
            const message = document.getElementById("ticketMessage").value;
            if (!subject || !message) return setMsg({ type:"error", text:"Please fill in all fields." });
            try {
              await API.post("/tickets/create", { creator: user._id, role: user.role, subject, message });
              setMsg({ type:"success", text:"Ticket submitted successfully! The admin will contact you soon." });
              document.getElementById("ticketSubject").value = "";
              document.getElementById("ticketMessage").value = "";
            } catch (err) {
              setMsg({ type:"error", text:"Failed to submit ticket." });
            }
          }}>
            Send Ticket 🚀
          </button>
        </div>
      )}

      {/* ── GROUP SELLING TAB ── */}
      {tab === "groups" && (
        <FarmerGroups crops={crops} />
      )}

      {/* ── PROFIT CALCULATOR TAB ── */}
      {tab === "profit" && (
        <FarmerProfitCalculator />
      )}

      {/* ── FINANCIAL LEDGER TAB ── */}
      {tab === "ledger" && (
        <FarmerFinancialLedger orders={orders} />
      )}

      {/* ── FARM TOURS TAB ── */}
      {tab === "tours" && <FarmerTours />}

      {/* 🌱 VERMI COMPOST TAB 🌱 */}
      {tab === "vermi" && <VermiCompostPanel />}
      
      {/* ── ASSISTANT OVERLAY ── */}
      <AssistantOverlay 
        isActive={wizardActive} 
        onClose={() => { setWizardActive(false); setAiMessage(""); if (window.speechSynthesis) window.speechSynthesis.cancel(); }} 
        interimText={listening ? interim : ""} 
        aiMessage={aiMessage} 
        step={wizardStep} 
      />

      {/* ── PEST DETECTION TAB ── */}
      {tab === "pest" && (
        <div className="glass-card" style={{ padding: "2rem" }}>
          <h2 style={{ color: "var(--green-deep)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🐛 AI Pest & Disease Detection & Organic Remedies
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Upload a clear photo of an affected leaf/crop or describe the observed symptoms. Our Agricultural Diagnostic Engine will identify the disease, rate the severity, and provide zero-chemical organic remedies.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div className="form-group">
              <label className="field-label">Affected Crop (Optional)</label>
              <input 
                type="text"
                className="rs-input"
                placeholder="e.g. Tomato, Chilli, Rice, Potato, Cotton, Mango"
                value={pestCropName}
                onChange={e => setPestCropName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="field-label">Observed Symptoms (Optional)</label>
              <input 
                type="text"
                className="rs-input"
                placeholder="e.g. Yellow spots on leaves, curled edges, white powdery residue"
                value={pestSymptoms}
                onChange={e => setPestSymptoms(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="field-label">Upload Crop / Leaf Photo</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setPestImage(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setPestPreview(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
              style={{ display: "block", width: "100%" }}
            />
          </div>

          {pestPreview && (
            <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
              <img src={pestPreview} alt="Pest Preview" style={{ maxWidth: "100%", maxHeight: "280px", borderRadius: "12px", border: "2px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }} />
            </div>
          )}

          <button 
            className="btn-primary" 
            style={{ width: "100%", marginBottom: "2rem", background: "var(--green-mid)", borderColor: "var(--green-mid)", padding: "0.85rem", fontSize: "1rem" }}
            onClick={runPestDetection}
            disabled={pestLoading || (!pestPreview && !pestCropName.trim() && !pestSymptoms.trim())}
          >
            {pestLoading ? "🤖 Analyzing Crop Diagnostics..." : "🔎 Run AI Pest & Disease Diagnosis"}
          </button>

          {pestResult && (
            <div style={{ background: "#f8fafc", padding: "1.75rem", borderRadius: "14px", border: "1.5px solid rgba(22,163,74,0.25)", boxShadow: "0 8px 25px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ color: "var(--text-dark)", margin: 0, fontSize: "1.2rem" }}>🌾 Pathological Diagnosis Report</h3>
                <span style={{ fontSize: "0.78rem", background: "rgba(22,163,74,0.1)", color: "var(--green-deep)", padding: "4px 10px", borderRadius: "100px", fontWeight: 600 }}>
                  {pestResult.source || "Diagnostic Engine"}
                </span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Detected Condition</span>
                  <strong style={{ color: pestResult.disease !== "Healthy" ? "#dc2626" : "#16a34a", fontSize: "1.05rem" }}>
                    {pestResult.disease}
                  </strong>
                </div>
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>Risk Severity Level</span>
                  <span className={`badge ${pestResult.severity === "Severe" || pestResult.severity === "High" ? "badge-red" : "badge-yellow"}`} style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
                    ⚠️ {pestResult.severity}
                  </span>
                </div>
              </div>

              {pestResult.symptoms && (
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                  <strong style={{ display: "block", marginBottom: "0.3rem", color: "var(--text-dark)", fontSize: "0.92rem" }}>🔍 Identified Symptoms:</strong>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-mid)" }}>{pestResult.symptoms}</p>
                </div>
              )}

              <div style={{ background: "white", padding: "1.25rem", borderRadius: "10px", borderLeft: "5px solid var(--green-mid)", border: "1px solid #e2e8f0", borderLeftWidth: "5px" }}>
                <strong style={{ display: "block", marginBottom: "0.6rem", color: "var(--green-deep)", fontSize: "1.02rem" }}>🌱 Organic & Bio-Remedy Treatment Plan:</strong>
                <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-dark)" }}>{pestResult.remedy}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SOIL TESTING & LAB HUB TAB ── */}
      {tab === "soil" && (
        <SoilTestingHub user={user} farmerProfile={farmerProfile} />
      )}

      {/* ── LEADERBOARD TAB ── */}
      {tab === "leaderboard" && (
        <FarmerLeaderboard />
      )}

      {/* ── GOVT SCHEMES TAB ── */}
      {tab === "schemes" && (
        <FarmerSchemes />
      )}

      {trackingOrder && (
        <LiveMapModal order={trackingOrder} onClose={() => setTrackingOrder(null)} />
      )}
      
      {/* Order Details Modal */}
      {viewOrder && (
        <div className="modal-overlay" onClick={() => setViewOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--text-dark)" }}>Order Details #{viewOrder.billNumber || viewOrder._id.substring(0,8).toUpperCase()}</h3>
            
            <div style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(22, 163, 74, 0.05)", borderRadius: "8px", border: "1px solid rgba(22, 163, 74, 0.2)" }}>
              <h4 style={{ color: "var(--green-deep)", marginBottom: "0.5rem" }}>Customer Info</h4>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}><strong>Name:</strong> {viewOrder.customer?.name}</p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}><strong>Delivery Address:</strong> {viewOrder.deliveryAddress || "N/A"}</p>
            </div>

            <div style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(37, 99, 235, 0.05)", borderRadius: "8px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
              <h4 style={{ color: "var(--blue-deep)", marginBottom: "0.5rem" }}>Pickup Info</h4>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}><strong>Pickup Address:</strong> {viewOrder.pickupAddress || "N/A"}</p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}><strong>Status:</strong> {viewOrder.status?.replace("_", " ")}</p>
            </div>

            <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setViewOrder(null)}>Close</button>
          </div>
        </div>
      )}
      {/* Crop Stage Update Modal */}
      {stageModal.isOpen && (
        <div className="modal-overlay" onClick={() => setStageModal(m => ({ ...m, isOpen: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--text-dark)" }}>Update Crop Stage</h3>
            
            <div className="form-group mb-3">
              <label className="field-label">Current Stage</label>
              <select 
                className="rs-select"
                value={stageModal.stage}
                onChange={e => setStageModal(m => ({ ...m, stage: e.target.value }))}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "8px" }}
              >
                <option value="sowing">Sowing</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="harvesting">Harvesting</option>
                <option value="ready">Ready to Sell</option>
                <option value="post_harvest">Post-Harvest</option>
              </select>
            </div>

            <div className="form-group mb-3">
              <label className="field-label">Stage Notes</label>
              <textarea 
                className="rs-input"
                placeholder="E.g., Added natural compost today..."
                value={stageModal.notes}
                onChange={e => setStageModal(m => ({ ...m, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="form-group mb-4">
              <label className="field-label">Photo Proof (Required by Admin)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    setStageModal(m => ({ ...m, imageFile: file, imagePreview: URL.createObjectURL(file) }));
                  }
                }}
                style={{ display: "block", width: "100%", fontSize: "0.85rem" }}
              />
              {stageModal.imagePreview && (
                <img src={stageModal.imagePreview} alt="Preview" style={{ width: "100%", height: "150px", objectFit: "cover", marginTop: "1rem", borderRadius: "8px" }} />
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStageModal(m => ({ ...m, isOpen: false }))}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={submitCropStage}>Update Stage</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SOIL TESTING TAB ── */}
      {tab === "soil" && (
        <SoilTestingPanel user={user} lang={lang} />
      )}

      {/* ── PEST DETECTION TAB ── */}
      {tab === "pest" && (
        <PestDetectionPanel user={user} lang={lang} />
      )}

      {/* Edit Crop Modal */}
      {editCropModal.isOpen && (
        <div className="modal-overlay" onClick={() => setEditCropModal(m => ({ ...m, isOpen: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--text-dark)" }}>Edit Crop Details</h3>
            <div className="form-group mb-3">
              <label className="field-label">Crop Name</label>
              <input type="text" className="rs-input" value={editCropModal.name} onChange={e => setEditCropModal(m => ({ ...m, name: e.target.value }))} />
            </div>
            <div className="form-group mb-3">
              <label className="field-label">Category</label>
              <select className="rs-select" value={editCropModal.category} onChange={e => setEditCropModal(m => ({ ...m, category: e.target.value }))}>
                <option value="vegetable">Vegetable</option>
                <option value="fruit">Fruit</option>
                <option value="grain">Grain</option>
                <option value="spice">Spice</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group mb-3" style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Quantity</label>
                <input type="number" className="rs-input" value={editCropModal.quantity} onChange={e => setEditCropModal(m => ({ ...m, quantity: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Unit</label>
                <select className="rs-select" value={editCropModal.unit} onChange={e => setEditCropModal(m => ({ ...m, unit: e.target.value }))}>
                  <option value="kg">kg</option>
                  <option value="ton">ton</option>
                  <option value="pieces">pieces</option>
                  <option value="dozen">dozen</option>
                  <option value="box">box</option>
                </select>
              </div>
            </div>
            <div className="form-group mb-3">
              <label className="field-label">Price (₹)</label>
              <input type="number" className="rs-input" value={editCropModal.price} onChange={e => setEditCropModal(m => ({ ...m, price: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditCropModal(m => ({ ...m, isOpen: false }))}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleEditCropSubmit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Auction Modal */}
      {auctionModal.isOpen && (
        <div className="modal-overlay" onClick={() => setAuctionModal(m => ({ ...m, isOpen: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--text-dark)" }}>Create B2B Auction</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              List {auctionModal.crop?.name} for bulk bidding by B2B buyers.
            </p>

            <div className="form-group mb-3">
              <label className="field-label">Quantity to Auction ({auctionModal.crop?.unit})</label>
              <input 
                type="number" className="rs-input" 
                value={auctionModal.quantity} 
                onChange={e => setAuctionModal(m => ({ ...m, quantity: e.target.value }))}
                max={auctionModal.crop?.quantity}
              />
              <small style={{ color: "var(--text-muted)" }}>Available: {auctionModal.crop?.quantity}</small>
            </div>

            <div className="form-group mb-3">
              <label className="field-label">Starting Bid (₹)</label>
              <input 
                type="number" className="rs-input" 
                value={auctionModal.startingBid} 
                onChange={e => setAuctionModal(m => ({ ...m, startingBid: e.target.value }))}
              />
            </div>

            <div className="form-group mb-4">
              <label className="field-label">Duration</label>
              <select className="rs-select" value={auctionModal.durationHours} onChange={e => setAuctionModal(m => ({ ...m, durationHours: e.target.value }))}>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="48">48 Hours (2 Days)</option>
                <option value="72">72 Hours (3 Days)</option>
                <option value="168">1 Week</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setAuctionModal(m => ({ ...m, isOpen: false }))}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, background: "var(--blue-mid)", borderColor: "var(--blue-mid)" }} onClick={createAuction}>Start Auction</button>
            </div>
          </div>
        </div>
      )}

      {showLocModal && (
        <LocationUpdateModal
          isOpen={showLocModal}
          onClose={() => setShowLocModal(false)}
        />
      )}

      {/* ── SPECIALIZED & SEASONAL AGRI-TOOLS SLIDING DRAWER / SIDEBAR ── */}
      <AnimatePresence>
        {showToolsDrawer && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 999999,
              display: "flex",
              justifyContent: "flex-end"
            }}
            onClick={() => setShowToolsDrawer(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                width: "min(560px, 95vw)",
                height: "100vh",
                background: "#ffffff",
                boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.25)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>🌾</span>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#166534" }}>
                      Seasonal &amp; Specialized Agri-Suite
                    </h3>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#4b5563", lineHeight: 1.4 }}>
                    Analytical, pre-sowing soil, pest diagnostic &amp; government planning tools. Select any feature to open its workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowToolsDrawer(false)}
                  style={{
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search in Drawer */}
              <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <div style={{ position: "relative" }}>
                  <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Search tools (e.g. soil, pest, weed, scheme, ledger, profit)..."
                    value={toolsSearch}
                    onChange={(e) => setToolsSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem 0.55rem 2rem",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      background: "white"
                    }}
                  />
                  {toolsSearch && (
                    <button
                      onClick={() => setToolsSearch("")}
                      style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tool Groups Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
                {SPECIALIZED_TOOL_GROUPS.map(group => {
                  const filteredTools = group.tools.filter(t => 
                    !toolsSearch || 
                    t.l.toLowerCase().includes(toolsSearch.toLowerCase()) || 
                    t.desc.toLowerCase().includes(toolsSearch.toLowerCase())
                  );

                  if (filteredTools.length === 0) return null;

                  return (
                    <div key={group.id} style={{ marginBottom: "1.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#1e293b" }}>
                            {group.category}
                          </h4>
                          <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                            {group.subtitle}
                          </p>
                        </div>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          background: group.badgeBg,
                          color: group.badgeColor,
                          padding: "2px 8px",
                          borderRadius: "100px",
                          whiteSpace: "nowrap"
                        }}>
                          {group.badge}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {filteredTools.map(tool => {
                          const isSelected = tab === tool.k;
                          return (
                            <button
                              key={tool.k}
                              type="button"
                              onClick={() => {
                                setTab(tool.k);
                                setShowToolsDrawer(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                padding: "0.85rem 1rem",
                                borderRadius: "12px",
                                background: isSelected ? "rgba(22, 163, 74, 0.08)" : "#ffffff",
                                border: isSelected ? "2px solid #16a34a" : "1px solid #e2e8f0",
                                cursor: "pointer",
                                textAlign: "left",
                                transition: "all 0.15s ease",
                                boxShadow: isSelected ? "0 4px 12px rgba(22, 163, 74, 0.12)" : "0 1px 3px rgba(0, 0, 0, 0.03)"
                              }}
                            >
                              <div style={{ flex: 1, paddingRight: "0.75rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "3px" }}>
                                  <strong style={{ fontSize: "0.9rem", color: isSelected ? "#15803d" : "#0f172a" }}>
                                    {tool.l}
                                  </strong>
                                  {isSelected && (
                                    <span style={{ fontSize: "0.72rem", background: "#16a34a", color: "white", padding: "1px 6px", borderRadius: "6px", fontWeight: 700 }}>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.35 }}>
                                  {tool.desc}
                                </p>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                                <span style={{ fontSize: "0.7rem", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "6px", whiteSpace: "nowrap" }}>
                                  {tool.freq}
                                </span>
                                <ChevronRight size={16} color={isSelected ? "#16a34a" : "#94a3b8"} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                gap: "0.75rem"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setTab("crops");
                    setShowToolsDrawer(false);
                  }}
                  style={{
                    flex: 1,
                    padding: "0.7rem",
                    borderRadius: "10px",
                    background: "white",
                    border: "1.5px solid #cbd5e1",
                    color: "#334155",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  🌿 Back to My Crops
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("add");
                    setShowToolsDrawer(false);
                  }}
                  style={{
                    flex: 1,
                    padding: "0.7rem",
                    borderRadius: "10px",
                    background: "#16a34a",
                    border: "none",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)"
                  }}
                >
                  ➕ Add Fresh Crop
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

