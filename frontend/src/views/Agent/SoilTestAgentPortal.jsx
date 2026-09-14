import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Beaker, MapPin, CheckCircle, AlertTriangle, FileText, Plus, RefreshCw, Send, Activity, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";

export default function SoilTestAgentPortal() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  // Test Requests & Samples
  const [samples, setSamples] = useState([
    {
      id: "SOIL-5501",
      farmerName: "K. Mallesh Goud",
      village: "Narsapur, Medak",
      surveyNo: "Sy. 142/B",
      plannedCrop: "Bt Cotton & Red Gram",
      collectionDate: "2026-09-12",
      status: "lab_analyzing",
      gpsCoords: "17.7382° N, 78.2736° E",
      testParams: {
        ph: 6.8,
        ec: 0.42,
        nitrogen: 185, // Low
        phosphorus: 24, // Medium
        potassium: 310, // High
        organicCarbon: 0.52 // Moderate
      },
      recommendation: "Apply Neem-coated Urea + 50kg Bio-Compost to boost Nitrogen"
    },
    {
      id: "SOIL-5508",
      farmerName: "Devender Chary",
      village: "Gajwel Cluster",
      surveyNo: "Sy. 89/1",
      plannedCrop: "Chilli (Teja Variety)",
      collectionDate: "2026-09-13",
      status: "pending_collection",
      gpsCoords: "17.8541° N, 78.6812° E",
      testParams: null,
      recommendation: ""
    },
    {
      id: "SOIL-5494",
      farmerName: "Laxmi Bai",
      village: "Toopran",
      surveyNo: "Sy. 210/A",
      plannedCrop: "Sona Masoori Paddy",
      collectionDate: "2026-09-11",
      status: "card_generated",
      gpsCoords: "17.8021° N, 78.4719° E",
      testParams: {
        ph: 7.4,
        ec: 0.35,
        nitrogen: 240,
        phosphorus: 32,
        potassium: 280,
        organicCarbon: 0.68
      },
      recommendation: "Soil parameters balanced. Recommended standard NPK 120:60:40 kg/ha"
    }
  ]);

  const [msg, setMsg] = useState("");
  const [selectedSample, setSelectedSample] = useState(null);
  const [analysisInput, setAnalysisInput] = useState({
    ph: "7.0",
    ec: "0.40",
    nitrogen: "210",
    phosphorus: "25",
    potassium: "260",
    organicCarbon: "0.60",
    recommendation: ""
  });

  const handleOpenAnalysis = (sample) => {
    setSelectedSample(sample);
    if (sample.testParams) {
      setAnalysisInput({
        ph: sample.testParams.ph.toString(),
        ec: sample.testParams.ec.toString(),
        nitrogen: sample.testParams.nitrogen.toString(),
        phosphorus: sample.testParams.phosphorus.toString(),
        potassium: sample.testParams.potassium.toString(),
        organicCarbon: sample.testParams.organicCarbon.toString(),
        recommendation: sample.recommendation || ""
      });
    } else {
      setAnalysisInput({
        ph: "7.0",
        ec: "0.40",
        nitrogen: "210",
        phosphorus: "25",
        potassium: "260",
        organicCarbon: "0.60",
        recommendation: ""
      });
    }
  };

  const handleSaveAnalysis = (e) => {
    e.preventDefault();
    if (!selectedSample) return;

    const params = {
      ph: parseFloat(analysisInput.ph),
      ec: parseFloat(analysisInput.ec),
      nitrogen: parseFloat(analysisInput.nitrogen),
      phosphorus: parseFloat(analysisInput.phosphorus),
      potassium: parseFloat(analysisInput.potassium),
      organicCarbon: parseFloat(analysisInput.organicCarbon)
    };

    let autoRec = analysisInput.recommendation;
    if (!autoRec) {
      if (params.nitrogen < 200) {
        autoRec = "Nitrogen is low. Recommend applying 40kg Urea + farmyard manure. ";
      }
      if (params.ph < 6.5) {
        autoRec += "Soil is slightly acidic. Apply 100kg Agricultural Lime. ";
      } else if (params.ph > 7.8) {
        autoRec += "Soil is alkaline. Apply Gypsum 150kg/acre. ";
      }
      if (!autoRec) autoRec = "Soil nutrient profile is healthy and balanced for sowing.";
    }

    setSamples(prev => prev.map(s => s.id === selectedSample.id ? {
      ...s,
      status: "card_generated",
      testParams: params,
      recommendation: autoRec
    } : s));

    setSelectedSample(null);
    setMsg(`✅ Soil Health Card generated & issued for sample #${selectedSample.id}!`);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleMarkSampleCollected = (id) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, status: "lab_analyzing" } : s));
    setMsg(`✅ Sample #${id} marked as collected from field & logged into Lab queue!`);
    setTimeout(() => setMsg(""), 3500);
  };

  const pendingCount = samples.filter(s => s.status === "pending_collection").length;
  const labCount = samples.filter(s => s.status === "lab_analyzing").length;
  const cardCount = samples.filter(s => s.status === "card_generated").length;

  return (
    <div className="page-wrapper" style={{ padding: "1.5rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Header & Breadcrumbs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link to="/agent" style={{ color: "#0891b2", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
              ← Return to Agent Dashboard
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Precision Soil & Field Lab Testing</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Beaker style={{ color: "#0891b2" }} size={28} /> Soil Health Card & Field Testing Portal
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Certified Field Lab: {user?.location || "Telangana Agri-Zone Field Testing Lab #09"} • GPS Soil Sampling & NPK Diagnostics
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button 
            type="button" 
            onClick={() => {
              setMsg("🔄 Lab diagnostics and spectrometer sensors synced.");
              setTimeout(() => setMsg(""), 2500);
            }} 
            className="btn-secondary" 
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={15} /> Refresh Diagnostics
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={18} /> {msg}
        </div>
      )}

      {/* KPI Overview Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Field Sampling Pending</span>
            <MapPin size={20} color="#ea580c" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#ea580c" }}>
            {pendingCount} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Farms to Visit</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
            GPS-tagged soil core extraction requests
          </p>
        </div>

        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>In Lab Diagnostics</span>
            <Beaker size={20} color="#0891b2" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0891b2" }}>
            {labCount} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Samples in testing</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
            Photometer & rapid reagent analysis
          </p>
        </div>

        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Health Cards Issued</span>
            <CheckCircle size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#16a34a" }}>
            {cardCount} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Completed</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>
            Delivered directly to Farmer RythuJana App
          </p>
        </div>

        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Reagent Stock</span>
            <Activity size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#8b5cf6" }}>
            94% <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Ready</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
            Bray N1, Olsen P, pH Buffer 7.0 & 4.0 in stock
          </p>
        </div>
      </div>

      {/* Main Table: Soil Samples & Field Verification Queue */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
              Field Sampling & Soil Diagnostic Registry
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              Collect 15-cm core samples from marked farm plots, conduct laboratory spectrometry, and transmit digital advice
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Sample #</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Farmer & Village</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Survey & GPS</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Target Crop</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Analysis / NPK</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#475569" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#0f172a" }}>{sample.id}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{sample.farmerName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>📍 {sample.village}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{sample.surveyNo}</div>
                    <div style={{ fontSize: "0.72rem", color: "#0284c7" }}>{sample.gpsCoords}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569" }}>
                    {sample.plannedCrop}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ 
                      fontSize: "0.72rem", 
                      fontWeight: 800, 
                      padding: "3px 8px", 
                      borderRadius: "10px",
                      background: sample.status === "card_generated" ? "#dcfce7" : sample.status === "lab_analyzing" ? "#e0f2fe" : "#fef3c7",
                      color: sample.status === "card_generated" ? "#166534" : sample.status === "lab_analyzing" ? "#0369a1" : "#92400e"
                    }}>
                      {sample.status === "card_generated" ? "✅ Card Issued" : sample.status === "lab_analyzing" ? "🧪 In Lab" : "⏳ Pickup Needed"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {sample.testParams ? (
                      <div style={{ fontSize: "0.75rem", color: "#334155" }}>
                        <div><strong>pH:</strong> {sample.testParams.ph} | <strong>EC:</strong> {sample.testParams.ec}</div>
                        <div><strong>N-P-K:</strong> {sample.testParams.nitrogen}-{sample.testParams.phosphorus}-{sample.testParams.potassium}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>Awaiting lab testing</span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    {sample.status === "pending_collection" && (
                      <button 
                        type="button" 
                        onClick={() => handleMarkSampleCollected(sample.id)}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#0891b2", color: "white", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                      >
                        🚜 Mark Field Collected
                      </button>
                    )}
                    {sample.status === "lab_analyzing" && (
                      <button 
                        type="button" 
                        onClick={() => handleOpenAnalysis(sample)}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                      >
                        🧪 Enter Spectrometer Results
                      </button>
                    )}
                    {sample.status === "card_generated" && (
                      <button 
                        type="button" 
                        onClick={() => handleOpenAnalysis(sample)}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                      >
                        📄 View Soil Card
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lab Diagnostic / Soil Health Card Entry Modal */}
      {selectedSample && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "560px", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  🧪 Diagnostic Lab & Soil Health Card Generator
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                  Farmer: {selectedSample.farmerName} • Plot: {selectedSample.surveyNo} • Crop: {selectedSample.plannedCrop}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedSample(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAnalysis} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Soil pH (Acidity/Alkalinity)
                  </label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required
                    value={analysisInput.ph} 
                    onChange={e => setAnalysisInput({ ...analysisInput, ph: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Ideal: 6.5 - 7.5</span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    EC (Salinity in dS/m)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required
                    value={analysisInput.ec} 
                    onChange={e => setAnalysisInput({ ...analysisInput, ec: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Ideal: &lt; 1.0 dS/m</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Available N (kg/ha)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={analysisInput.nitrogen} 
                    onChange={e => setAnalysisInput({ ...analysisInput, nitrogen: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Available P (kg/ha)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={analysisInput.phosphorus} 
                    onChange={e => setAnalysisInput({ ...analysisInput, phosphorus: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Available K (kg/ha)
                  </label>
                  <input 
                    type="number" 
                    required
                    value={analysisInput.potassium} 
                    onChange={e => setAnalysisInput({ ...analysisInput, potassium: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Organic Carbon (OC %)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={analysisInput.organicCarbon} 
                  onChange={e => setAnalysisInput({ ...analysisInput, organicCarbon: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Field Agronomist Fertilizer Recommendation
                </label>
                <textarea 
                  rows={3} 
                  placeholder="e.g. Apply 40kg Urea + 50kg DAP per acre before transplanting. Soil nitrogen deficient."
                  value={analysisInput.recommendation} 
                  onChange={e => setAnalysisInput({ ...analysisInput, recommendation: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedSample(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ background: "#0891b2", borderColor: "#0891b2" }}
                >
                  🚀 Approve & Transmit Health Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
