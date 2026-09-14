import React, { useState, useEffect } from "react";
import API from "../api/api";
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, 
  Camera, Eye, FileText, Check, X, Sparkles, RefreshCw, 
  MapPin, UserCheck, Award, Info, Lock, ChevronRight, Activity,
  Leaf, Trees, Droplets
} from "lucide-react";

export default function FoodSafetyOrganicAgentPanel({ user }) {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Audit form state
  const [foodSafetyScore, setFoodSafetyScore] = useState(95);
  const [chemicalResidueStatus, setChemicalResidueStatus] = useState("zero_detected");
  const [hygieneGrade, setHygieneGrade] = useState("A+");
  const [auditNotes, setAuditNotes] = useState("");
  const [cornBorderVerified, setCornBorderVerified] = useState(true);
  const [nskeVerified, setNskeVerified] = useState(true);
  const [catchCropVerified, setCatchCropVerified] = useState(true);
  const [stepNotes, setStepNotes] = useState({});
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await API.get("/crops/organic/pending-verifications");
      setCrops(res.data || []);
      if (res.data && res.data.length > 0 && !selectedCrop) {
        setSelectedCrop(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to load crops for organic verification", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerifyStep = async (stepKey, verified) => {
    if (!selectedCrop) return;
    setActionLoading(true);
    try {
      const notes = stepNotes[stepKey] || (verified ? "Step verified genuine on-field." : "Step flagged: insufficient proof.");
      const res = await API.post(`/crops/${selectedCrop._id}/agent-verify-step`, {
        stepKey,
        verified,
        notes,
        agentId: user?._id || "agent",
        agentName: user?.name || "Food Safety Officer"
      });
      setMsg({ type: "success", text: `Step "${stepKey}" ${verified ? "verified ✅" : "flagged ⚠️"}` });
      setSelectedCrop(res.data.crop);
      fetchPending();
    } catch (err) {
      setMsg({ type: "error", text: "Failed to update step verification." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalAudit = async (isGenuine) => {
    if (!selectedCrop) return;
    if (!window.confirm(isGenuine 
      ? "Confirm awarding 100% Genuine Organic Certification to this crop batch?" 
      : "Confirm REJECTING this crop for Fake/Unsubstantiated Organic claim? This will penalize the farmer.")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await API.post(`/crops/${selectedCrop._id}/agent-food-safety-audit`, {
        agentId: user?._id || "agent",
        agentName: user?.name || "Food Safety Officer",
        isGenuine,
        foodSafetyScore,
        chemicalResidueStatus,
        hygieneGrade,
        notes: auditNotes || (isGenuine ? "Passed comprehensive 5-step organic and food safety audit." : "Failed food safety audit. Chemical residues or missing barriers."),
        cornBorderVerified,
        nskeVerified,
        catchCropVerified
      });

      setMsg({ 
        type: isGenuine ? "success" : "error", 
        text: isGenuine 
          ? `✅ 100% Genuine Organic Certification awarded to "${selectedCrop.name}"!` 
          : `🚨 Organic status REVOKED for "${selectedCrop.name}". Flagged to Admin.` 
      });
      setSelectedCrop(res.data.crop);
      fetchPending();
    } catch (err) {
      setMsg({ type: "error", text: "Failed to submit food safety audit." });
    } finally {
      setActionLoading(false);
    }
  };

  // Step definitions
  const STEP_METADATA = [
    {
      key: "step1_soil_bio",
      num: 1,
      title: "Soil Preparation & Jeevamrutham / Green Manure",
      desc: "Photo of farmer incorporating green manure (Sunhemp/Dhaincha) or applying Ghana-Jeevamrutham microbial culture.",
      defaultImg: "https://images.unsplash.com/photo-1592417817098-8f3d6ef23ef9?w=600&auto=format&fit=crop&q=80"
    },
    {
      key: "step2_natural_seed",
      num: 2,
      title: "Bijamrutham & Untreated Native Heirloom Seed",
      desc: "Photo of seed coating with indigenous cow-urine Bijamrutham solution; zero synthetic chemical fungicide treatment.",
      defaultImg: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80"
    },
    {
      key: "step3_corn_border_catch_crop",
      num: 3,
      title: "Corn Border Barrier & Catch / Trap Cropping",
      desc: "Photo of 3-4 dense rows of Corn/Maize on boundary (chemical drift shield) + Marigold or Mustard catch crop.",
      defaultImg: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80"
    },
    {
      key: "step4_botanical_spray",
      num: 4,
      title: "Neem Seed Kernel Extract (NSKE 5%) / Agniastra Spray",
      desc: "Photo of botanical preparation and spraying; zero systemic organophosphates, carbamates, or neonicotinoids.",
      defaultImg: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80"
    },
    {
      key: "step5_clean_harvest",
      num: 5,
      title: "Residue-Free Clean Harvest & Tamper-Proof Crates",
      desc: "Photo of harvest with zero chemical contact, clean sorting tables, and traceable tamper-evident crates.",
      defaultImg: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80"
    }
  ];

  const currentVerification = selectedCrop?.organicVerification || {};
  const currentStepPhotos = currentVerification.stepPhotos || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── HEADER BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #064e3b 100%)",
        color: "white",
        borderRadius: "18px",
        padding: "1.75rem",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ background: "#22c55e", color: "#052e16", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
              OFFICIAL QUALITY AGENT PORTAL
            </span>
            <span style={{ background: "rgba(255,255,255,0.15)", color: "#86efac", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700 }}>
              🛡️ Anti-Fake Organic Verification &amp; Food Safety
            </span>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0 0 0.4rem 0" }}>
            Food Safety &amp; Step-by-Step Organic Audit Monitoring
          </h2>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#cbd5e1", maxWidth: "800px", lineHeight: 1.5 }}>
            Verify on-field photographic evidence for every critical stage. Prevent fake organic certificates by auditing <strong>Neem Seed Kernel Extract (NSKE 5%)</strong>, <strong>Corn Perimeter Barriers</strong>, and <strong>Catch Crops</strong> with full agent accountability.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={fetchPending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "0.5rem 1rem",
              borderRadius: "100px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: "0.75rem 1.25rem",
          borderRadius: "10px",
          background: msg.type === "success" ? "#dcfce7" : "#fee2e2",
          color: msg.type === "success" ? "#166534" : "#991b1b",
          border: `1px solid ${msg.type === "success" ? "#86efac" : "#fca5a5"}`,
          fontWeight: 700,
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {msg.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ── 2-COLUMN LAYOUT: QUEUE LIST (LEFT) & STEP AUDIT WORKSPACE (RIGHT) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* LEFT: PENDING CROPS QUEUE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                📋 Crop Inspection Queue ({crops.length})
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Select to inspect</span>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading verification queue...</div>
            ) : crops.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No crops pending organic review right now.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "600px", overflowY: "auto" }}>
                {crops.map((c) => {
                  const isSel = selectedCrop?._id === c._id;
                  const vStatus = c.organicVerification?.status || "unverified";
                  const statusColors = {
                    certified_genuine: { bg: "#dcfce7", text: "#166534", label: "✅ Certified Genuine" },
                    step_verified: { bg: "#fef3c7", text: "#92400e", label: "⏳ Steps Verified" },
                    pending_inspection: { bg: "#dbeafe", text: "#1e40af", label: "🔍 Pending Audit" },
                    rejected_fake: { bg: "#fee2e2", text: "#991b1b", label: "❌ Rejected Fake" },
                    unverified: { bg: "#f1f5f9", text: "#475569", label: "⚪ Unverified" }
                  };
                  const badge = statusColors[vStatus] || statusColors.unverified;

                  return (
                    <div
                      key={c._id}
                      onClick={() => setSelectedCrop(c)}
                      style={{
                        padding: "0.85rem 1rem",
                        borderRadius: "12px",
                        border: isSel ? "2px solid #16a34a" : "1px solid #e2e8f0",
                        background: isSel ? "#f0fdf4" : "white",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <img
                          src={c.image || "/default.png"}
                          alt={c.name}
                          style={{ width: 44, height: 44, borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                        />
                        <div>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>{c.name}</strong>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            Farmer: {c.farmer?.name || "Farmer"} • {c.quantity} {c.unit}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          background: badge.bg,
                          color: badge.text,
                          padding: "2px 8px",
                          borderRadius: "100px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          display: "inline-block"
                        }}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: DETAILED STEP-BY-STEP PHOTO VERIFICATION WORKSPACE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {selectedCrop ? (
            <>
              {/* Selected Crop Identity Card */}
              <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#0f172a" }}>
                        {selectedCrop.name}
                      </h3>
                      <span style={{ background: selectedCrop.isOrganic ? "#dcfce7" : "#f1f5f9", color: selectedCrop.isOrganic ? "#166534" : "#64748b", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                        {selectedCrop.isOrganic ? "🌿 Declared Organic" : "Standard Produce"}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#475569" }}>
                      <strong>🌾 Real Farm:</strong> {selectedCrop.realFarmDetails?.farmName || selectedCrop.farmLocation || "Farm Parcel"} • {selectedCrop.realFarmDetails?.farmLocation || selectedCrop.location}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "#475569" }}>
                      <strong>🏪 Sale / Mandi Place:</strong> {selectedCrop.realSalePlace?.hubName || selectedCrop.location || "APMC Market"} ({selectedCrop.realSalePlace?.distanceFarmToSaleKm || 25} km from farm)
                    </p>
                  </div>

                  <div style={{ background: "#f8fafc", padding: "8px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Batch ID</div>
                    <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{selectedCrop._id?.slice(-8).toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              {/* 5 Step-by-Step Geotagged Photo Inspection Cards */}
              <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                      📸 5-Step Photographic Verification (Anti-Fake Audit)
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                      Inspect the farmer&apos;s step-by-step evidence. All 5 steps must be verified for 100% genuine certification.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {STEP_METADATA.map((st) => {
                    const stepData = currentStepPhotos[st.key] || {};
                    const isStepVerified = Boolean(stepData.verified);
                    const photo = stepData.photoUrl || st.defaultImg;

                    return (
                      <div
                        key={st.key}
                        style={{
                          background: isStepVerified ? "#f0fdf4" : "#f8fafc",
                          border: `1.5px solid ${isStepVerified ? "#86efac" : "#e2e8f0"}`,
                          borderRadius: "12px",
                          padding: "1rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.75rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{
                              background: isStepVerified ? "#16a34a" : "#64748b",
                              color: "white",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 800
                            }}>
                              {st.num}
                            </span>
                            <div>
                              <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{st.title}</strong>
                              <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>{st.desc}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {isStepVerified ? (
                              <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                                <Check size={12} /> Step Verified Genuine
                              </span>
                            ) : (
                              <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700 }}>
                                ⏳ Pending Agent Verification
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Photo Thumbnail + Inspector Feedback */}
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setPreviewPhoto(photo)}>
                            <img
                              src={photo}
                              alt={st.title}
                              style={{ width: 90, height: 70, borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                            />
                            <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "white", padding: "1px 4px", borderRadius: "4px", fontSize: "0.65rem" }}>
                              🔍 View
                            </div>
                          </div>

                          <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <input
                              type="text"
                              placeholder="Add agent inspection notes (e.g., dense 4 rows corn verified)..."
                              value={stepNotes[st.key] || stepData.agentNotes || ""}
                              onChange={(e) => setStepNotes({ ...stepNotes, [st.key]: e.target.value })}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                                background: "white"
                              }}
                            />
                            
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleVerifyStep(st.key, true)}
                                style={{
                                  background: "#16a34a",
                                  color: "white",
                                  border: "none",
                                  padding: "4px 12px",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <Check size={12} /> Verify Step Photo
                              </button>

                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleVerifyStep(st.key, false)}
                                style={{
                                  background: "#fee2e2",
                                  color: "#991b1b",
                                  border: "1px solid #fca5a5",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <X size={12} /> Flag Suspicious
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Food Safety, Security & Chemical Testing Sign-Off */}
              <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                  🧪 Food Safety &amp; On-Field Chemical Residue Audit
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  {/* Chemical Residue Spot Test */}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Chemical Residue Spot Test Kit
                    </label>
                    <select
                      value={chemicalResidueStatus}
                      onChange={(e) => setChemicalResidueStatus(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: 700 }}
                    >
                      <option value="zero_detected">✅ Zero Residue Detected (&lt;0.01 ppm) - Passed</option>
                      <option value="safe_trace">⚠️ Safe Trace (&lt;0.05 ppm organic background)</option>
                      <option value="chemical_detected">❌ Toxic Synthetic Pesticide Detected (&gt;0.1 ppm)</option>
                    </select>
                  </div>

                  {/* Food Safety Hygiene Grade */}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                      Hygiene &amp; Tamper-Proof Storage Grade
                    </label>
                    <select
                      value={hygieneGrade}
                      onChange={(e) => setHygieneGrade(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", fontWeight: 700 }}
                    >
                      <option value="A+">Grade A+ (Sterile crates, sealed moisture shield)</option>
                      <option value="A">Grade A (Clean food-grade packaging)</option>
                      <option value="B">Grade B (Acceptable local transport)</option>
                      <option value="Fail">Fail (Contaminated, mouldy, unhygienic)</option>
                    </select>
                  </div>
                </div>

                {/* Biological Barriers Checklist */}
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>Biological Pest Barrier Compliance Checklist:</strong>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={cornBorderVerified}
                      onChange={(e) => setCornBorderVerified(e.target.checked)}
                    />
                    <span>🌽 Corn Border Cropping: 3-4 dense rows of corn/sorghum verified on boundary (blocks chemical drift).</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={nskeVerified}
                      onChange={(e) => setNskeVerified(e.target.checked)}
                    />
                    <span>🌿 Neem Seed Kernel Extract (NSKE 5%): Zero systemic neurotoxins; pure botanical contact extracts.</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={catchCropVerified}
                      onChange={(e) => setCatchCropVerified(e.target.checked)}
                    />
                    <span>🌼 Catch &amp; Trap Crops: Mustard or Marigold present to trap diamondback moths and soil nematodes.</span>
                  </label>
                </div>

                {/* Audit Notes */}
                <div style={{ marginTop: "1rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                    Officer Official Inspection Summary &amp; Stamp Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter formal inspection observations, soil health card verification, and lab test batch numbers..."
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                {/* Final Decision Action Buttons */}
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleFinalAudit(true)}
                    style={{
                      flex: 1,
                      minWidth: "220px",
                      background: "linear-gradient(135deg, #16a34a, #15803d)",
                      color: "white",
                      border: "none",
                      padding: "0.85rem 1.25rem",
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    <ShieldCheck size={20} />
                    <span>Award 100% Genuine Organic Certification</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleFinalAudit(false)}
                    style={{
                      flex: 1,
                      minWidth: "220px",
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "1.5px solid #fca5a5",
                      padding: "0.85rem 1.25rem",
                      borderRadius: "12px",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    <ShieldAlert size={20} />
                    <span>Reject &amp; Revoke (Fake Organic Claim)</span>
                  </button>
                </div>
              </div>

              {/* Unalterable Anti-Fraud Audit Trail */}
              {currentVerification.auditTrail && currentVerification.auditTrail.length > 0 && (
                <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                    📜 Unalterable Anti-Fraud Audit Trail Log
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {currentVerification.auditTrail.map((log, idx) => (
                      <div key={idx} style={{ padding: "6px 10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.78rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                        <div>
                          <strong style={{ color: "#0f172a" }}>{log.action}</strong> • <span style={{ color: "#64748b" }}>{log.notes}</span>
                        </div>
                        <span style={{ color: "#94a3b8" }}>
                          {log.agentName} ({new Date(log.timestamp).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: "white", borderRadius: "16px", padding: "3rem", textAlign: "center", color: "#64748b", border: "1.5px dashed #cbd5e1" }}>
              Select a crop from the queue on the left to begin inspecting step-by-step photos.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Full-Size Step Photo Preview */}
      {previewPhoto && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem"
        }} onClick={() => setPreviewPhoto(null)}>
          <div style={{ maxWidth: "800px", width: "100%", background: "white", borderRadius: "16px", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", color: "white" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>📸 On-Field High-Res Photo Evidence</span>
              <button onClick={() => setPreviewPhoto(null)} style={{ background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
            <img src={previewPhoto} alt="Evidence preview" style={{ width: "100%", maxHeight: "550px", objectFit: "contain", background: "#000" }} />
          </div>
        </div>
      )}
    </div>
  );
}
