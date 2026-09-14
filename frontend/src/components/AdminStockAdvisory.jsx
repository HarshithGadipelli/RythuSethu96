import React, { useState, useEffect } from "react";
import API from "../api/api";
import { 
  AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Send, 
  Package, Search, Filter, ShieldCheck, CheckCircle2, ArrowUpRight, 
  ArrowDownRight, Sparkles, Sprout, Info, AlertCircle, Zap
} from "lucide-react";

export default function AdminStockAdvisory() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalCropsTracked: 0,
    deficitCount: 0,
    surplusCount: 0,
    balancedCount: 0,
    totalInventoryKg: 0
  });
  const [analysis, setAnalysis] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal State for broadcasting advisory
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [modalType, setModalType] = useState(null); // "GROW_MORE" | "DIVERT_OR_PROCESS"
  const [advisoryMessage, setAdvisoryMessage] = useState("");
  const [targetVolumeKg, setTargetVolumeKg] = useState("");
  const [recommendedMSP, setRecommendedMSP] = useState("");
  const [permacultureTip, setPermacultureTip] = useState("");
  const [urgency, setUrgency] = useState("high");
  const [submitting, setSubmitting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const fetchStockAnalysis = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/stock-analysis");
      if (res.data) {
        setSummary(res.data.summary || {});
        setAnalysis(res.data.analysis || []);
      }
    } catch (err) {
      console.error("Failed to fetch stock analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockAnalysis();
  }, []);

  const openAdvisoryModal = (item, type) => {
    setSelectedCrop(item);
    setModalType(type);
    setBroadcastResult(null);
    setTargetVolumeKg(item.suggestedTargetQty || 100);
    setRecommendedMSP(item.avgPrice ? Math.round(item.avgPrice * 1.1) : 45);
    setUrgency(item.urgency || "high");

    if (type === "GROW_MORE") {
      setAdvisoryMessage(
        `High market demand detected for ${item.cropName}! Total available stock is currently ${item.currentStock} ${item.unit}. We strongly advise farmers to initiate fresh sowing or harvest batches immediately to secure high seasonal prices and prevent market shortages.`
      );
      setPermacultureTip(
        `Consider intercropping ${item.cropName} with nitrogen-fixing pulses (Cowpea/Moong) or companion marigolds to reduce pests naturally.`
      );
    } else {
      setAdvisoryMessage(
        `Surplus inventory alert for ${item.cropName}! Current stock is ${item.currentStock} ${item.unit}, which exceeds immediate demand velocity. To prevent crop rotting and price collapse, we advise farmers to divert excess yield into solar dehydration, book Cold Storage Hub space, or rotate acreage into ancient millets.`
      );
      setPermacultureTip(
        `Rotate post-harvest ${item.cropName} land into Pearl Millet (Bajra) or Finger Millet (Ragi). Millets require 70% less water, fix organic carbon, and rejuvenate soil biology for the next cycle.`
      );
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!selectedCrop || !advisoryMessage) return;

    setSubmitting(true);
    try {
      const payload = {
        cropName: selectedCrop.cropName,
        category: selectedCrop.category,
        actionType: modalType,
        advisoryMessage,
        targetVolumeKg: Number(targetVolumeKg) || 0,
        recommendedMSP: Number(recommendedMSP) || 0,
        permacultureTip,
        urgency
      };

      const res = await API.post("/admin/stock-advisory/broadcast", payload);
      setBroadcastResult(res.data);
      // Auto close after 3 seconds on success
      setTimeout(() => {
        setSelectedCrop(null);
        setModalType(null);
        fetchStockAnalysis();
      }, 2500);
    } catch (err) {
      console.error("Broadcast advisory failed:", err);
      alert("Failed to send advisory: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered analysis list
  const filteredList = analysis.filter(item => {
    const matchesSearch = item.cropName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ? true :
      statusFilter === "GROW_MORE" ? item.advisoryType === "GROW_MORE" :
      statusFilter === "DIVERT_OR_PROCESS" ? item.advisoryType === "DIVERT_OR_PROCESS" :
      item.advisoryType === "BALANCED";
    const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── TOP HEADER & SUMMARY METRICS ── */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "1.75rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.75rem" }}>📊</span>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                Admin Stock Maintenance &amp; Supply-Demand Advisory
              </h2>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#64748b" }}>
              Monitor live stock levels vs. real customer order velocity. Proactively advise farmers to <strong>Grow More</strong> to meet shortages or <strong>Divert / Rotate into Millets</strong> to prevent food waste.
            </p>
          </div>

          <button
            onClick={fetchStockAnalysis}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.5rem 1rem",
              borderRadius: "100px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin-anim" : ""} />
            <span>Refresh Live Analysis</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {/* Deficit Card */}
          <div style={{
            background: "#fef2f2",
            border: "1.5px solid #fecaca",
            padding: "1.25rem",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#991b1b", textTransform: "uppercase" }}>
                  Deficit (Shortage Risk)
                </span>
                <ArrowUpRight size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#dc2626", marginTop: "0.25rem" }}>
                {summary.deficitCount || 0}
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#b91c1c", fontWeight: 600 }}>
              📢 High demand crops needing "Grow More" advisory
            </span>
          </div>

          {/* Surplus Card */}
          <div style={{
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            padding: "1.25rem",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#92400e", textTransform: "uppercase" }}>
                  Surplus (Wastage Risk)
                </span>
                <ArrowDownRight size={18} color="#d97706" />
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#d97706", marginTop: "0.25rem" }}>
                {summary.surplusCount || 0}
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 600 }}>
              ⚠️ High stock needing cold storage / millet rotation
            </span>
          </div>

          {/* Balanced Card */}
          <div style={{
            background: "#f0fdf4",
            border: "1.5px solid #bbf7d0",
            padding: "1.25rem",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                  Optimal Equilibrium
                </span>
                <CheckCircle2 size={18} color="#16a34a" />
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#16a34a", marginTop: "0.25rem" }}>
                {summary.balancedCount || 0}
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 600 }}>
              🟢 Supply matches consumer velocity
            </span>
          </div>

          {/* Total Stock Volume */}
          <div style={{
            background: "#f8fafc",
            border: "1.5px solid #e2e8f0",
            padding: "1.25rem",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
                  Total Active Inventory
                </span>
                <Package size={18} color="#64748b" />
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#0f172a", marginTop: "0.25rem" }}>
                {(summary.totalInventoryKg || 0).toLocaleString()} <span style={{ fontSize: "1rem", color: "#64748b" }}>kg</span>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
              Across {summary.totalCropsTracked || 0} unique crop varieties
            </span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        background: "white",
        padding: "1rem 1.25rem",
        borderRadius: "14px",
        border: "1px solid #e2e8f0"
      }}>
        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Filter by crop name (e.g. Tomato, Ragi, Bajra, Onion)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.6rem 1rem 0.6rem 2.4rem",
              borderRadius: "100px",
              border: "1px solid #cbd5e1",
              fontSize: "0.88rem",
              outline: "none"
            }}
          />
        </div>

        {/* Status Pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Items" },
            { id: "GROW_MORE", label: "🚨 Deficit (Grow More)" },
            { id: "DIVERT_OR_PROCESS", label: "⚠️ Surplus (Divert)" },
            { id: "BALANCED", label: "🟢 Balanced" }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setStatusFilter(p.id)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "100px",
                border: statusFilter === p.id ? "1.5px solid #0f172a" : "1px solid #e2e8f0",
                background: statusFilter === p.id ? "#0f172a" : "white",
                color: statusFilter === p.id ? "white" : "#475569",
                fontSize: "0.8rem",
                fontWeight: statusFilter === p.id ? 800 : 600,
                cursor: "pointer"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: "0.5rem 0.85rem",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "0.85rem",
            color: "#334155",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <option value="all">All Categories</option>
          <option value="vegetable">Vegetables</option>
          <option value="fruit">Fruits</option>
          <option value="grain">Grains</option>
          <option value="millet">Ancient Millets (Shree Anna)</option>
          <option value="pulse">Pulses</option>
          <option value="spice">Spices</option>
          <option value="dairy">Dairy</option>
        </select>
      </div>

      {/* ── CROPS ANALYSIS TABLE ── */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={28} className="spin-anim" style={{ margin: "0 auto 0.75rem" }} />
            <div>Computing live stock vs order velocity...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <Package size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
            <p>No crops match your current search and filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700 }}>
                  <th style={{ padding: "0.85rem 1.25rem" }}>Crop Name</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Current Stock</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Total Demand</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Inventory Status</th>
                  <th style={{ padding: "0.85rem 1.25rem" }}>Agricultural Advisory &amp; Action</th>
                  <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Farmer Broadcast</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => {
                  const isGrowMore = item.advisoryType === "GROW_MORE";
                  const isDivert = item.advisoryType === "DIVERT_OR_PROCESS";

                  return (
                    <tr
                      key={item.cropKey || idx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: idx % 2 === 0 ? "white" : "#fafafa",
                        transition: "background 0.15s"
                      }}
                    >
                      <td style={{ padding: "0.85rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{item.cropName}</strong>
                          {item.isMillet && (
                            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                              🌾 Millet
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "capitalize" }}>
                          {item.category} • Avg ₹{item.avgPrice}/{item.unit}
                        </span>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <strong style={{ fontSize: "1rem", color: item.currentStock === 0 ? "#dc2626" : "#0f172a" }}>
                          {item.currentStock.toLocaleString()} {item.unit}
                        </strong>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div>
                          <strong style={{ color: "#0369a1" }}>{item.totalDemand} {item.unit}</strong>
                        </div>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          {item.orderVolume} ordered • {item.searchVolume} searched
                        </span>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 10px",
                          borderRadius: "100px",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          background:
                            item.status === "Critical Deficit" || item.status === "Deficit" ? "#fee2e2" :
                            item.status === "Critical Surplus" || item.status === "Surplus" ? "#fef3c7" : "#dcfce7",
                          color:
                            item.status === "Critical Deficit" || item.status === "Deficit" ? "#991b1b" :
                            item.status === "Critical Surplus" || item.status === "Surplus" ? "#92400e" : "#166534"
                        }}>
                          {isGrowMore && "🚨"}
                          {isDivert && "⚠️"}
                          {!isGrowMore && !isDivert && "🟢"}
                          {item.status}
                        </span>
                      </td>

                      <td style={{ padding: "0.85rem 1.25rem", maxWidth: "340px" }}>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#334155", lineHeight: 1.4 }}>
                          {item.recommendedAction}
                        </p>
                      </td>

                      <td style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>
                        {isGrowMore ? (
                          <button
                            onClick={() => openAdvisoryModal(item, "GROW_MORE")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "0.45rem 0.9rem",
                              borderRadius: "100px",
                              background: "#dc2626",
                              color: "white",
                              border: "none",
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)"
                            }}
                          >
                            <span>📢 Advise: Grow More</span>
                          </button>
                        ) : isDivert ? (
                          <button
                            onClick={() => openAdvisoryModal(item, "DIVERT_OR_PROCESS")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "0.45rem 0.9rem",
                              borderRadius: "100px",
                              background: "#d97706",
                              color: "white",
                              border: "none",
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(217, 119, 6, 0.2)"
                            }}
                          >
                            <span>📢 Advise: Divert / Process</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openAdvisoryModal(item, "GROW_MORE")}
                            style={{
                              padding: "0.35rem 0.75rem",
                              borderRadius: "100px",
                              background: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Send Advisory
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── BROADCAST ADVISORY MODAL ── */}
      {selectedCrop && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "600px",
            padding: "2rem",
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            {/* Modal Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <span style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: "100px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  marginBottom: "0.4rem",
                  background: modalType === "GROW_MORE" ? "#fee2e2" : "#fef3c7",
                  color: modalType === "GROW_MORE" ? "#991b1b" : "#92400e"
                }}>
                  {modalType === "GROW_MORE" ? "🚨 PRODUCTION SHORTAGE ADVISORY" : "⚠️ SURPLUS & WASTE MITIGATION ADVISORY"}
                </span>
                <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                  Broadcast Advisory: {selectedCrop.cropName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCrop(null)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
              >
                ×
              </button>
            </div>

            {/* Broadcast Form */}
            {broadcastResult ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <CheckCircle2 size={48} color="#16a34a" style={{ margin: "0 auto 1rem" }} />
                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#166534", margin: "0 0 0.5rem" }}>
                  Advisory Successfully Broadcasted!
                </h4>
                <p style={{ color: "#475569", fontSize: "0.9rem" }}>
                  {broadcastResult.message}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                    Advisory Recommendation Message to Farmers
                  </label>
                  <textarea
                    rows={4}
                    value={advisoryMessage}
                    onChange={(e) => setAdvisoryMessage(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.88rem",
                      lineHeight: 1.4,
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                      Target Volume ({selectedCrop.unit})
                    </label>
                    <input
                      type="number"
                      value={targetVolumeKg}
                      onChange={(e) => setTargetVolumeKg(e.target.value)}
                      placeholder="e.g. 500"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "8px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.9rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                      Recommended MSP (₹/{selectedCrop.unit})
                    </label>
                    <input
                      type="number"
                      value={recommendedMSP}
                      onChange={(e) => setRecommendedMSP(e.target.value)}
                      placeholder="e.g. 45"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "8px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.9rem"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                    🌱 Permaculture / Soil Health / Millets Rotation Recommendation
                  </label>
                  <textarea
                    rows={2}
                    value={permacultureTip}
                    onChange={(e) => setPermacultureTip(e.target.value)}
                    placeholder="Suggest companion crops or ancient millets (Ragi/Bajra) to restore soil fertility..."
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.85rem"
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedCrop(null)}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "white",
                      color: "#475569",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "0.75rem",
                      borderRadius: "10px",
                      border: "none",
                      background: modalType === "GROW_MORE" ? "#dc2626" : "#d97706",
                      color: "white",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  >
                    <Send size={16} />
                    <span>{submitting ? "Broadcasting to Farmers..." : "Broadcast Advisory to All Farmers"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
