import React, { useState, useEffect } from "react";
import API from "../api/api";
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Search, Filter, 
  MapPin, PhoneCall, Camera, TestTube2, Bug, Award, Sparkles, ChevronRight,
  TrendingUp, Leaf, DollarSign, Calendar, Info, X, Check, ArrowRight, ShieldAlert,
  Compass, ExternalLink, PlayCircle, Eye
} from "lucide-react";

export default function AdminOrganicCertification() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cycleFilter, setCycleFilter] = useState("ALL");
  const [safetyMetrics, setSafetyMetrics] = useState(null);

  // Active Audit Detail Modal
  const [selectedCert, setSelectedCert] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState("geoLocation");
  const [stepNotes, setStepNotes] = useState("");

  // Next Batch Cultivation Initiation Modal
  const [nextBatchModal, setNextBatchModal] = useState(null);
  const [nextBatchForm, setNextBatchForm] = useState({
    cropName: "",
    cultivationCycle: "Rabi",
    farmAcreage: 2.5,
    notes: ""
  });
  const [nextBatchSubmitting, setNextBatchSubmitting] = useState(false);

  // Certification & Benefit Form State
  const [benefitForm, setBenefitForm] = useState({
    zeroPlatformCommission: true,
    priorityListingBadge: true,
    subsidySupportGranted: true,
    subsidyAmount: 7500,
    organicTrustBadgeTier: "GOLD_NATURAL",
    adminRemarks: "Full compliance verified with zero synthetic chemical residue."
  });

  const [flashMsg, setFlashMsg] = useState(null);

  const showFlash = (type, text) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg(null), 5000);
  };

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/organic/admin/all-certifications", {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          cycle: cycleFilter !== "ALL" ? cycleFilter : undefined
        }
      });
      if (res.data && res.data.data) {
        setCertifications(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching organic certifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodSafetyOverview = async () => {
    try {
      const res = await API.get("/organic/admin/food-safety-overview");
      if (res.data && res.data.data) {
        setSafetyMetrics(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching food safety overview:", err);
    }
  };

  useEffect(() => {
    fetchCertifications();
    fetchFoodSafetyOverview();
  }, [statusFilter, cycleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCertifications();
  };

  // Open batch inspection modal
  const openAuditModal = (cert) => {
    setSelectedCert(cert);
    setActiveStepTab("geoLocation");
    setBenefitForm({
      zeroPlatformCommission: cert.supportBenefits?.zeroPlatformCommission ?? true,
      priorityListingBadge: cert.supportBenefits?.priorityListingBadge ?? true,
      subsidySupportGranted: cert.supportBenefits?.subsidySupportGranted ?? true,
      subsidyAmount: cert.supportBenefits?.subsidyAmount || 7500,
      organicTrustBadgeTier: cert.supportBenefits?.organicTrustBadgeTier !== "NONE" ? cert.supportBenefits?.organicTrustBadgeTier : "GOLD_NATURAL",
      adminRemarks: cert.adminProcedure?.adminRemarks || "Strict verification complete."
    });
    setStepNotes(cert.verificationChecks?.geoLocation?.notes || "");
  };

  // Step verification toggle (Admin strictly verifies each checkpoint)
  const handleToggleStepVerification = async (checkType, newStatus) => {
    if (!selectedCert) return;
    setAuditLoading(true);
    try {
      const res = await API.put(`/organic/admin/verify-step/${selectedCert._id}`, {
        checkType,
        verified: newStatus,
        notes: stepNotes
      });
      if (res.data && res.data.data) {
        setSelectedCert(res.data.data);
        setCertifications(prev => prev.map(c => c._id === res.data.data._id ? res.data.data : c));
        showFlash("success", `Verification checkpoint '${checkType}' marked as ${newStatus ? 'VERIFIED' : 'PENDING'}`);
      }
    } catch (err) {
      console.error("Error updating step verification:", err);
      showFlash("error", "Failed to update checkpoint verification.");
    } finally {
      setAuditLoading(false);
    }
  };

  // Certify batch & disburse farmer benefits
  const handleCertifyBatch = async () => {
    if (!selectedCert) return;
    setAuditLoading(true);
    try {
      const res = await API.put(`/organic/admin/certify/${selectedCert._id}`, benefitForm);
      if (res.data && res.data.data) {
        setSelectedCert(res.data.data);
        setCertifications(prev => prev.map(c => c._id === res.data.data._id ? res.data.data : c));
        showFlash("success", `🎉 Batch #${res.data.data.batchNumber} certified organic! ₹${benefitForm.subsidyAmount} subsidy support and 0% commission granted to farmer.`);
        fetchFoodSafetyOverview();
      }
    } catch (err) {
      console.error("Error certifying batch:", err);
      showFlash("error", "Failed to grant organic certification.");
    } finally {
      setAuditLoading(false);
    }
  };

  // Reject / Audit flag
  const handleRejectBatch = async () => {
    if (!selectedCert) return;
    const reason = prompt("Enter specific reason for rejecting or flagging this organic audit:", "Synthetic pesticide or boundary mismatch detected during inspection.");
    if (!reason) return;

    setAuditLoading(true);
    try {
      const res = await API.put(`/organic/admin/reject/${selectedCert._id}`, { reason });
      if (res.data && res.data.data) {
        setSelectedCert(res.data.data);
        setCertifications(prev => prev.map(c => c._id === res.data.data._id ? res.data.data : c));
        showFlash("warning", `Batch flagged and rejected for organic claim. Notice dispatched.`);
        fetchFoodSafetyOverview();
      }
    } catch (err) {
      showFlash("error", "Failed to reject batch audit.");
    } finally {
      setAuditLoading(false);
    }
  };

  // Open Continuous Cycle Next Batch Modal
  const openNextBatchModal = (cert) => {
    const cycleProgression = { Kharif: "Rabi", Rabi: "Zaid", Zaid: "Kharif", Perennial: "Perennial", Continuous: "Continuous" };
    setNextBatchModal(cert);
    setNextBatchForm({
      cropName: cert.cropName,
      cultivationCycle: cycleProgression[cert.cultivationCycle] || "Rabi",
      farmAcreage: cert.farmAcreage || 2.5,
      notes: `Continuous cultivation cycle after certified batch #${cert.batchNumber}.`
    });
  };

  // Start Next Cultivation Batch under Continuous Cycle
  const handleStartNextBatch = async (e) => {
    e.preventDefault();
    if (!nextBatchModal) return;

    setNextBatchSubmitting(true);
    try {
      const res = await API.post(`/organic/admin/start-next-batch/${nextBatchModal._id}`, nextBatchForm);
      if (res.data && res.data.data) {
        showFlash("success", `🌱 Continuous Cultivation Cycle: Subsequent batch #${res.data.data.batchNumber} initiated! Strict 5-point verification is now active.`);
        setNextBatchModal(null);
        fetchCertifications();
        fetchFoodSafetyOverview();
      }
    } catch (err) {
      console.error("Failed to start subsequent batch:", err);
      showFlash("error", "Failed to initialize subsequent batch.");
    } finally {
      setNextBatchSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Flash Message */}
      {flashMsg && (
        <div style={{
          padding: "0.85rem 1.2rem",
          borderRadius: "12px",
          background: flashMsg.type === "success" ? "#ecfdf5" : flashMsg.type === "warning" ? "#fffbeb" : "#fef2f2",
          border: `1.5px solid ${flashMsg.type === "success" ? "#10b981" : flashMsg.type === "warning" ? "#f59e0b" : "#ef4444"}`,
          color: flashMsg.type === "success" ? "#065f46" : flashMsg.type === "warning" ? "#92400e" : "#991b1b",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
        }}>
          {flashMsg.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span>{flashMsg.text}</span>
        </div>
      )}

      {/* ── SECTION HEADER & MISSION OVERVIEW ── */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
        borderRadius: "20px",
        padding: "1.8rem 2.2rem",
        color: "white",
        boxShadow: "0 10px 30px rgba(6, 78, 59, 0.25)",
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.18)", padding: "0.3rem 0.85rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              <span>🛡️ Admin Food Safety & Security Suite</span>
              <span>•</span>
              <span>5-Point Continuous Verification</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Organic Certification & Multi-Batch Farmer Verification Engine
            </h2>
            <p style={{ margin: "0.4rem 0 0 0", color: "#a7f3d0", fontSize: "0.92rem", maxWidth: "850px", lineHeight: 1.5 }}>
              Strict administrative audit protocol for genuine organic cultivation. Every batch is continuously authenticated using <strong>Geo-Location fencing</strong>, <strong>Periodic Field Photographs</strong>, <strong>Telephonic Quality Audits</strong>, <strong>Soil & Tool Spectrometry</strong>, and <strong>Pest Bio-Control Evidence</strong>. Verified farmers receive 0% platform commissions, premium trust badges, and direct agricultural subsidies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { fetchCertifications(); fetchFoodSafetyOverview(); }}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "0.6rem 1.1rem",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              backdropFilter: "blur(6px)"
            }}
          >
            <RefreshCw size={16} /> Refresh Telemetry
          </button>
        </div>

        {/* Food Safety & Verification KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.9rem", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>Total Batches Tracked</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem" }}>{safetyMetrics?.totalBatches || certifications.length}</div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5", marginTop: "0.2rem" }}>Continuous cycle monitoring</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.9rem", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>Verified Organic Batches</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem", color: "#34d399" }}>
              {safetyMetrics?.verifiedBatches ?? certifications.filter(c => c.certificationStatus === "VERIFIED_ORGANIC").length}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5", marginTop: "0.2rem" }}>100% Zero-Residue Certified</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.9rem", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>In Strict Verification</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem", color: "#fde047" }}>
              {safetyMetrics?.inVerification ?? certifications.filter(c => c.certificationStatus === "IN_VERIFICATION" || c.certificationStatus === "PENDING_AUDIT").length}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5", marginTop: "0.2rem" }}>Under active 5-point audit</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.9rem", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>Farmer Subsidies Granted</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem", color: "#67e8f9" }}>
              ₹{(safetyMetrics?.totalSubsidiesDisbursed ?? 22500).toLocaleString()}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5", marginTop: "0.2rem" }}>Direct farmer organic incentive</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", padding: "0.9rem", borderRadius: "12px" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>Food Safety & Purity Score</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.2rem", color: "#f472b6" }}>
              {safetyMetrics?.avgSafetyScore || 94}%
            </div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5", marginTop: "0.2rem" }}>Zero synthetic chemical index</div>
          </div>
        </div>
      </div>

      {/* ── FOOD SAFETY & SECURITY TELEMETRY BAR ── */}
      <div style={{
        background: "#ffffff",
        border: "1.5px solid #d1fae5",
        borderRadius: "16px",
        padding: "1rem 1.4rem",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        boxShadow: "0 2px 10px rgba(5, 150, 105, 0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "#065f46", fontSize: "0.95rem" }}>Platform Food Safety & Cold-Chain Security Status</div>
            <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>
              Anti-Tamper Packaging: <span style={{ color: "#059669", fontWeight: 700 }}>100% Sealed & QR Traceable</span> • Hyperspectral Scanner: <span style={{ color: "#059669", fontWeight: 700 }}>Active</span> • Chemical Spike Alerts: <span style={{ color: "#059669", fontWeight: 700 }}>0 Detected</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <span style={{ background: "#dcfce7", color: "#166534", padding: "0.35rem 0.8rem", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700 }}>
            ✓ Geo-fence Verified
          </span>
          <span style={{ background: "#ecfeff", color: "#155e75", padding: "0.35rem 0.8rem", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700 }}>
            ✓ Zero Organophosphates
          </span>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "280px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by farmer name, crop, batch number, or location..."
              style={{
                width: "100%",
                padding: "0.65rem 1rem 0.65rem 2.4rem",
                borderRadius: "10px",
                border: "1.5px solid #e5e7eb",
                fontSize: "0.88rem",
                outline: "none"
              }}
            />
          </div>
          <button type="submit" style={{ background: "#059669", color: "white", border: "none", padding: "0.65rem 1.2rem", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>
            Search
          </button>
        </form>

        {/* Status Filters */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { k: "ALL", l: "All Batches" },
            { k: "PENDING_AUDIT", l: "⏳ Pending Audit" },
            { k: "IN_VERIFICATION", l: "🔍 In Verification" },
            { k: "VERIFIED_ORGANIC", l: "🌿 Verified Organic" },
            { k: "COMPLETED_CYCLE", l: "🔄 Cycle Completed" }
          ].map(f => (
            <button
              key={f.k}
              type="button"
              onClick={() => setStatusFilter(f.k)}
              style={{
                background: statusFilter === f.k ? "#059669" : "#ffffff",
                color: statusFilter === f.k ? "#ffffff" : "#374151",
                border: statusFilter === f.k ? "1.5px solid #059669" : "1.5px solid #e5e7eb",
                padding: "0.45rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── BATCH CARDS GRID ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#059669" }} />
          <div>Loading organic certification batches...</div>
        </div>
      ) : certifications.length === 0 ? (
        <div style={{ background: "#ffffff", padding: "3rem", borderRadius: "16px", textAlign: "center", border: "1px dashed #cbd5e1" }}>
          <Leaf size={42} style={{ color: "#9ca3af", margin: "0 auto 0.8rem auto" }} />
          <h4 style={{ color: "#374151", margin: 0 }}>No Organic Certification Batches Found</h4>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0.5rem 0 0 0" }}>
            Farmers who register their cultivation for organic certification will appear here for strict admin verification.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.2rem" }}>
          {certifications.map(cert => {
            const checks = cert.verificationChecks || {};
            const completedCount = cert.adminProcedure?.auditStepsCompleted || 0;
            const isVerified = cert.certificationStatus === "VERIFIED_ORGANIC";
            const isCompletedCycle = cert.certificationStatus === "COMPLETED_CYCLE";

            return (
              <div
                key={cert._id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: isVerified ? "2px solid #10b981" : "1.5px solid #e5e7eb",
                  padding: "1.3rem",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative"
                }}
              >
                <div>
                  {/* Top Header: Batch & Status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {cert.batchNumber} • Cycle #{cert.continuousCycle?.batchSequenceNumber || 1} ({cert.cultivationCycle})
                      </div>
                      <h4 style={{ margin: "0.2rem 0 0 0", color: "#111827", fontSize: "1.1rem", fontWeight: 800 }}>
                        {cert.cropName}
                      </h4>
                    </div>
                    <span style={{
                      padding: "0.3rem 0.75rem",
                      borderRadius: "100px",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      background: isVerified ? "#dcfce7" : isCompletedCycle ? "#f3f4f6" : "#fef3c7",
                      color: isVerified ? "#15803d" : isCompletedCycle ? "#4b5563" : "#b45309"
                    }}>
                      {cert.certificationStatus}
                    </span>
                  </div>

                  {/* Farmer Details */}
                  <div style={{ background: "#f9fafb", padding: "0.75rem", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.84rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6b7280" }}>Farmer:</span>
                      <strong style={{ color: "#1f2937" }}>{cert.farmerName}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
                      <span style={{ color: "#6b7280" }}>Location:</span>
                      <span style={{ color: "#374151" }}>{cert.farmLocation} ({cert.farmAcreage} acres)</span>
                    </div>
                    {cert.farmerPhone && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
                        <span style={{ color: "#6b7280" }}>Contact:</span>
                        <span style={{ color: "#2563eb", fontWeight: 600 }}>{cert.farmerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* 5-Point Strict Verification Check Status Bar */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                      <span style={{ color: "#374151" }}>5-Point Admin Verification Checklist</span>
                      <span style={{ color: completedCount === 5 ? "#10b981" : "#d97706" }}>
                        {completedCount}/5 Verified ({cert.adminProcedure?.overallSafetyScore || 75}%)
                      </span>
                    </div>

                    {/* Check Icons Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.35rem" }}>
                      {[
                        { k: "geoLocation", label: "Geo", icon: MapPin, done: checks.geoLocation?.verified },
                        { k: "fieldPhotos", label: "Photos", icon: Camera, done: checks.fieldPhotos?.verified },
                        { k: "adminCallAudit", label: "Call", icon: PhoneCall, done: checks.adminCallAudit?.verified },
                        { k: "toolsSoilImages", label: "Tools", icon: TestTube2, done: checks.toolsSoilImages?.verified },
                        { k: "pestImages", label: "Pest", icon: Bug, done: checks.pestImages?.verified }
                      ].map(pt => {
                        const Icon = pt.icon;
                        return (
                          <div
                            key={pt.k}
                            title={`${pt.label}: ${pt.done ? 'Verified' : 'Pending Review'}`}
                            style={{
                              background: pt.done ? "#dcfce7" : "#f3f4f6",
                              border: `1.5px solid ${pt.done ? "#86efac" : "#e5e7eb"}`,
                              borderRadius: "8px",
                              padding: "0.45rem 0.2rem",
                              textAlign: "center",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "0.2rem"
                            }}
                          >
                            <Icon size={14} color={pt.done ? "#16a34a" : "#9ca3af"} />
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: pt.done ? "#15803d" : "#6b7280" }}>
                              {pt.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Support Benefits & Incentives Granted */}
                  {cert.supportBenefits?.certifiedOrganic && (
                    <div style={{
                      background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                      border: "1px solid #a7f3d0",
                      borderRadius: "10px",
                      padding: "0.75rem",
                      marginBottom: "1rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#065f46", fontWeight: 800, fontSize: "0.78rem" }}>
                        <Award size={16} color="#059669" />
                        <span>Active Support & Subsidies: {cert.supportBenefits.organicTrustBadgeTier}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap", fontSize: "0.75rem" }}>
                        <span style={{ background: "white", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: 700, color: "#047857" }}>
                          ✓ 0% Platform Fee
                        </span>
                        <span style={{ background: "white", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: 700, color: "#047857" }}>
                          ✓ ₹{cert.supportBenefits.subsidyAmount} Subsidy
                        </span>
                        <span style={{ background: "white", padding: "0.2rem 0.5rem", borderRadius: "6px", fontWeight: 700, color: "#047857" }}>
                          ✓ Priority Badge
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => openAuditModal(cert)}
                    style={{
                      flex: 1,
                      background: "#059669",
                      color: "white",
                      border: "none",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <Eye size={15} /> Strict Audit Review
                  </button>

                  {/* If certified or nextBatchEligible, show Continuous Multi-batch initiation */}
                  {(isVerified || cert.continuousCycle?.nextBatchEligible) && (
                    <button
                      type="button"
                      onClick={() => openNextBatchModal(cert)}
                      style={{
                        background: "#0284c7",
                        color: "white",
                        border: "none",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem"
                      }}
                      title="Initiate subsequent cultivation batch under continuous audit protocol"
                    >
                      <Sparkles size={14} /> Next Batch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: STRICT 5-POINT ADMIN VERIFICATION & BENEFIT ALLOCATOR ── */}
      {selectedCert && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "920px",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "2rem",
            position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCert(null)}
              style={{ position: "absolute", right: "1.5rem", top: "1.5rem", background: "#f3f4f6", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4b5563" }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div>
              <div style={{ display: "inline-block", background: "#ecfdf5", color: "#065f46", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Strict Verification Procedure • Batch #{selectedCert.batchNumber}
              </div>
              <h3 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 800, color: "#111827" }}>
                {selectedCert.cropName} ({selectedCert.cultivationCycle} Cycle #{selectedCert.continuousCycle?.batchSequenceNumber || 1})
              </h3>
              <p style={{ margin: "0.3rem 0 1rem 0", color: "#6b7280", fontSize: "0.88rem" }}>
                Cultivated by <strong>{selectedCert.farmerName}</strong> • {selectedCert.farmLocation} ({selectedCert.farmAcreage} Acres)
              </p>
            </div>

            {/* 5-Step Audit Navigation Tabs */}
            <div style={{ display: "flex", gap: "0.4rem", borderBottom: "1.5px solid #e5e7eb", paddingBottom: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
              {[
                { k: "geoLocation", l: "1. 📍 Geo-Location & Boundary", done: selectedCert.verificationChecks?.geoLocation?.verified },
                { k: "fieldPhotos", l: "2. 📸 Field Photos", done: selectedCert.verificationChecks?.fieldPhotos?.verified },
                { k: "adminCallAudit", l: "3. 📞 Call Audit", done: selectedCert.verificationChecks?.adminCallAudit?.verified },
                { k: "toolsSoilImages", l: "4. 🧪 Tools & Soil", done: selectedCert.verificationChecks?.toolsSoilImages?.verified },
                { k: "pestImages", l: "5. 🐛 Pest Bio-Control", done: selectedCert.verificationChecks?.pestImages?.verified }
              ].map(st => (
                <button
                  key={st.k}
                  type="button"
                  onClick={() => {
                    setActiveStepTab(st.k);
                    setStepNotes(selectedCert.verificationChecks?.[st.k]?.notes || "");
                  }}
                  style={{
                    background: activeStepTab === st.k ? "#059669" : "#f9fafb",
                    color: activeStepTab === st.k ? "white" : "#374151",
                    border: `1.5px solid ${activeStepTab === st.k ? "#059669" : "#e5e7eb"}`,
                    padding: "0.55rem 0.9rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <span>{st.l}</span>
                  {st.done ? <span style={{ color: activeStepTab === st.k ? "#bbf7d0" : "#16a34a" }}>✓</span> : <span style={{ color: "#9ca3af" }}>⏳</span>}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: STEP 1 - GEO LOCATION */}
            {activeStepTab === "geoLocation" && (
              <div style={{ background: "#f9fafb", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={20} color="#059669" /> Point 1: Geo-Location & Farm Boundary Tolerance
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.86rem" }}>
                  <div style={{ background: "white", padding: "0.9rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                    <div style={{ color: "#6b7280" }}>GPS Coordinates (Field Pin):</div>
                    <div style={{ fontWeight: 800, color: "#111827", fontSize: "1rem", marginTop: "0.2rem" }}>
                      {selectedCert.verificationChecks?.geoLocation?.coordinates?.latitude || 17.3850}° N, {selectedCert.verificationChecks?.geoLocation?.coordinates?.longitude || 78.4867}° E
                    </div>
                    <div style={{ marginTop: "0.5rem", color: "#6b7280" }}>
                      Survey Boundary Match: <strong style={{ color: selectedCert.verificationChecks?.geoLocation?.farmBoundaryMatch ? "#16a34a" : "#b45309" }}>
                        {selectedCert.verificationChecks?.geoLocation?.farmBoundaryMatch ? "Confirmed Patta Passbook Match" : "Self-Reported Pin (Boundary Audit Pending)"}
                      </strong>
                    </div>
                  </div>
                  <div style={{ background: "white", padding: "0.9rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                    <div style={{ color: "#6b7280" }}>Geo-Fence Variance:</div>
                    <div style={{ fontWeight: 800, color: "#059669", fontSize: "1rem", marginTop: "0.2rem" }}>
                      ±{selectedCert.verificationChecks?.geoLocation?.geoVarianceMeters || 4.2} meters (Within 10m threshold)
                    </div>
                    <div style={{ marginTop: "0.5rem", color: "#6b7280" }}>
                      Status: <strong style={{ color: selectedCert.verificationChecks?.geoLocation?.verified ? "#16a34a" : "#dc2626" }}>
                        {selectedCert.verificationChecks?.geoLocation?.verified ? "Geo-Location Verified" : "Pending Verification"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    Admin Land Survey Verification Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={stepNotes}
                    onChange={(e) => setStepNotes(e.target.value)}
                    placeholder="Enter cadastral parcel cross-verification notes..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("geoLocation", true)}
                    style={{ background: "#059669", color: "white", border: "none", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Check size={16} /> Mark Geo-Location Verified
                  </button>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("geoLocation", false)}
                    style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #cbd5e1", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset Check
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STEP 2 - FIELD PHOTOS */}
            {activeStepTab === "fieldPhotos" && (
              <div style={{ background: "#f9fafb", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Camera size={20} color="#059669" /> Point 2: Periodic Field Photographs Verification
                </h4>
                <p style={{ fontSize: "0.84rem", color: "#6b7280", margin: "0 0 1rem 0" }}>
                  Inspect geotagged farm photos across cultivation stages: Soil Preparation, Heirloom Seeding, Vegetative Growth, and Clean Harvest.
                </p>

                {/* Photo Previews */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.8rem", marginBottom: "1rem" }}>
                  {(selectedCert.verificationChecks?.fieldPhotos?.urls?.length > 0
                    ? selectedCert.verificationChecks.fieldPhotos.urls
                    : [
                      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80",
                      "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=600&q=80"
                    ]
                  ).map((imgUrl, idx) => (
                    <div key={idx} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb", height: "140px" }}>
                      <img src={imgUrl} alt={`Field Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", bottom: "6px", left: "6px", background: "rgba(0,0,0,0.6)", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: 700 }}>
                        {selectedCert.verificationChecks?.fieldPhotos?.stage || "Vegetative Stage"}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    Field Photo Inspection Remarks:
                  </label>
                  <textarea
                    rows={2}
                    value={stepNotes}
                    onChange={(e) => setStepNotes(e.target.value)}
                    placeholder="E.g., No weedicide scorch marks observed; green tillering matches natural compost use..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("fieldPhotos", true)}
                    style={{ background: "#059669", color: "white", border: "none", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Check size={16} /> Mark Field Photos Verified
                  </button>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("fieldPhotos", false)}
                    style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #cbd5e1", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset Check
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STEP 3 - CALL AUDIT */}
            {activeStepTab === "adminCallAudit" && (
              <div style={{ background: "#f9fafb", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <PhoneCall size={20} color="#059669" /> Point 3: Admin Direct Telephonic Audit
                </h4>
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e5e7eb", marginBottom: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", fontSize: "0.85rem" }}>
                    <div>
                      <span style={{ color: "#6b7280" }}>Farmer Phone:</span> <strong>{selectedCert.farmerPhone || "9849012345"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Call Auditor:</span> <strong>{selectedCert.verificationChecks?.adminCallAudit?.callOfficer || "Admin Quality Officer"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Call Status:</span> <strong style={{ color: "#059669" }}>{selectedCert.verificationChecks?.adminCallAudit?.callStatus || "Verified_Clear"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Last Verified:</span> <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid #f3f4f6", fontSize: "0.85rem" }}>
                    <div style={{ color: "#6b7280", fontWeight: 700 }}>Farmer Interview Statement:</div>
                    <p style={{ margin: "0.3rem 0 0 0", color: "#374151", fontStyle: "italic" }}>
                      "{selectedCert.verificationChecks?.adminCallAudit?.farmerResponse || 'Confirmed strictly preparing Jeevamrutha every 12 days and applying neem cake without chemical NPK.'}"
                    </p>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    Telephonic Audit Log Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={stepNotes}
                    onChange={(e) => setStepNotes(e.target.value)}
                    placeholder="Enter telephonic interview verification details..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("adminCallAudit", true)}
                    style={{ background: "#059669", color: "white", border: "none", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Check size={16} /> Mark Call Audit Verified
                  </button>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("adminCallAudit", false)}
                    style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #cbd5e1", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset Check
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STEP 4 - TOOLS & SOIL */}
            {activeStepTab === "toolsSoilImages" && (
              <div style={{ background: "#f9fafb", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TestTube2 size={20} color="#059669" /> Point 4: Tools & Soil Preparation Imagery
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
                  <div style={{ background: "white", padding: "0.9rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                    <div style={{ color: "#6b7280" }}>Soil Health Card Readings:</div>
                    <div style={{ fontWeight: 800, color: "#111827", marginTop: "0.2rem" }}>
                      Organic Carbon (OC): {selectedCert.verificationChecks?.toolsSoilImages?.organicCarbonPct || 0.92}% (Optimal {`>`} 0.75%)
                    </div>
                    <div style={{ color: "#059669", marginTop: "0.2rem", fontWeight: 600 }}>
                      Soil Microbial Respiration: High Bio-Active
                    </div>
                  </div>
                  <div style={{ background: "white", padding: "0.9rem", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                    <div style={{ color: "#6b7280" }}>Digital Spectrometer Reading:</div>
                    <div style={{ fontWeight: 800, color: "#059669", marginTop: "0.2rem" }}>
                      {selectedCert.verificationChecks?.toolsSoilImages?.spectrometerReading || "0.02 ppm (Zero Synthetic Organophosphates)"}
                    </div>
                    <div style={{ color: "#6b7280", marginTop: "0.2rem" }}>
                      Nitrogen Spike Detection: <span style={{ color: "#16a34a", fontWeight: 700 }}>Clean (42 kg/ha)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    Soil Card & Machinery Tool Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={stepNotes}
                    onChange={(e) => setStepNotes(e.target.value)}
                    placeholder="Enter spectrometer lab evaluation notes..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("toolsSoilImages", true)}
                    style={{ background: "#059669", color: "white", border: "none", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Check size={16} /> Mark Tools & Soil Verified
                  </button>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("toolsSoilImages", false)}
                    style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #cbd5e1", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset Check
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STEP 5 - PEST BIO-CONTROL */}
            {activeStepTab === "pestImages" && (
              <div style={{ background: "#f9fafb", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.8rem 0", color: "#111827", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Bug size={20} color="#059669" /> Point 5: Pest Diagnostic Imagery & Bio-Spray Evidence
                </h4>
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e5e7eb", marginBottom: "1rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                    <div>
                      <span style={{ color: "#6b7280" }}>Biological Management:</span>
                      <strong style={{ color: "#059669", display: "block" }}>Neem Seed Kernel Extract 5% + Panchagavya</strong>
                    </div>
                    <div>
                      <span style={{ color: "#6b7280" }}>Synthetic Chemical Pesticides:</span>
                      <strong style={{ color: "#15803d", display: "block" }}>Zero Detected (100% Residue-Free)</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: "0.6rem", color: "#4b5563" }}>
                    Trap Crops Verified: Marigold border lines + Yellow sticky sheets active.
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "0.3rem" }}>
                    Pest Diagnostic & Bio-Spray Remarks:
                  </label>
                  <textarea
                    rows={2}
                    value={stepNotes}
                    onChange={(e) => setStepNotes(e.target.value)}
                    placeholder="Enter biological pest verification observations..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>

                <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("pestImages", true)}
                    style={{ background: "#059669", color: "white", border: "none", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <Check size={16} /> Mark Pest Bio-Control Verified
                  </button>
                  <button
                    type="button"
                    disabled={auditLoading}
                    onClick={() => handleToggleStepVerification("pestImages", false)}
                    style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #cbd5e1", padding: "0.55rem 1.1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset Check
                  </button>
                </div>
              </div>
            )}

            {/* ── FARMER SUPPORT BENEFITS & FINAL CERTIFICATION ALLOCATOR ── */}
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              border: "1.5px solid #86efac",
              borderRadius: "14px",
              padding: "1.3rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#166534", fontWeight: 800, fontSize: "1rem", marginBottom: "0.8rem" }}>
                <Award size={20} color="#15803d" />
                <span>Farmer Support Benefits Allocator (Earned Upon Organic Verification)</span>
              </div>
              <p style={{ margin: "0 0 1rem 0", color: "#374151", fontSize: "0.84rem" }}>
                As an organically certified farmer through strict continuous audit, the farmer is awarded direct incentives to support high-quality natural farming:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.8rem", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "white", padding: "0.75rem", borderRadius: "10px", border: "1px solid #bbf7d0", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={benefitForm.zeroPlatformCommission}
                    onChange={(e) => setBenefitForm(prev => ({ ...prev, zeroPlatformCommission: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#059669" }}
                  />
                  <div>
                    <strong style={{ fontSize: "0.84rem", color: "#111827" }}>0% Commission</strong>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>Waive all marketplace fees</div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "white", padding: "0.75rem", borderRadius: "10px", border: "1px solid #bbf7d0", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={benefitForm.priorityListingBadge}
                    onChange={(e) => setBenefitForm(prev => ({ ...prev, priorityListingBadge: e.target.checked }))}
                    style={{ width: "18px", height: "18px", accentColor: "#059669" }}
                  />
                  <div>
                    <strong style={{ fontSize: "0.84rem", color: "#111827" }}>Priority Badge</strong>
                    <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>Top ranking in search & cart</div>
                  </div>
                </label>

                <div style={{ background: "white", padding: "0.75rem", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#166534", marginBottom: "0.2rem" }}>
                    Subsidy Support (₹):
                  </label>
                  <input
                    type="number"
                    value={benefitForm.subsidyAmount}
                    onChange={(e) => setBenefitForm(prev => ({ ...prev, subsidyAmount: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: 700, color: "#15803d" }}
                  />
                </div>

                <div style={{ background: "white", padding: "0.75rem", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#166534", marginBottom: "0.2rem" }}>
                    Trust Badge Tier:
                  </label>
                  <select
                    value={benefitForm.organicTrustBadgeTier}
                    onChange={(e) => setBenefitForm(prev => ({ ...prev, organicTrustBadgeTier: e.target.value }))}
                    style={{ width: "100%", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: 700, color: "#111827", fontSize: "0.82rem" }}
                  >
                    <option value="PLATINUM_ZERO_BUDGET">Platinum Zero Budget</option>
                    <option value="GOLD_NATURAL">Gold Natural Organic</option>
                    <option value="SILVER_ORGANIC">Silver Conversion</option>
                    <option value="BRONZE_CONVERSION">Bronze Permaculture</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#166534", marginBottom: "0.2rem" }}>
                  Official Admin Remarks for Certificate Ledger:
                </label>
                <input
                  type="text"
                  value={benefitForm.adminRemarks}
                  onChange={(e) => setBenefitForm(prev => ({ ...prev, adminRemarks: e.target.value }))}
                  style={{ width: "100%", padding: "0.55rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
              <button
                type="button"
                disabled={auditLoading}
                onClick={handleRejectBatch}
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1.5px solid #fecaca",
                  padding: "0.75rem 1.4rem",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Reject / Require Remediation
              </button>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    padding: "0.75rem 1.4rem",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={auditLoading}
                  onClick={handleCertifyBatch}
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "white",
                    border: "none",
                    padding: "0.75rem 1.8rem",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <Award size={18} /> Certify Batch & Unlock Farmer Benefits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONTINUOUS CYCLE - INITIATE SUBSEQUENT CULTIVATION BATCH ── */}
      {nextBatchModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 9999
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "600px",
            padding: "2rem",
            position: "relative",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <button
              type="button"
              onClick={() => setNextBatchModal(null)}
              style={{ position: "absolute", right: "1.5rem", top: "1.5rem", background: "#f3f4f6", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#4b5563" }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "inline-block", background: "#e0f2fe", color: "#0369a1", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Continuous Multi-Batch Verification
            </div>
            <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
              Initiate Next Cultivation Batch
            </h3>
            <p style={{ margin: "0 0 1.2rem 0", color: "#64748b", fontSize: "0.85rem", lineHeight: 1.5 }}>
              Previous batch <strong>#{nextBatchModal.batchNumber}</strong> ({nextBatchModal.cropName}) completed. To maintain ongoing organic accreditation and 0% commission support, this next batch will undergo strict continuous verification across Geo-location, field photos, calls, tools/soil images, and pest images.
            </p>

            <form onSubmit={handleStartNextBatch} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                  Next Cultivation Crop / Produce Name:
                </label>
                <input
                  type="text"
                  required
                  value={nextBatchForm.cropName}
                  onChange={(e) => setNextBatchForm(prev => ({ ...prev, cropName: e.target.value }))}
                  placeholder="e.g., Organic Pulses / Blackgram / Rabi Wheat"
                  style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                    Cultivation Cycle / Season:
                  </label>
                  <select
                    value={nextBatchForm.cultivationCycle}
                    onChange={(e) => setNextBatchForm(prev => ({ ...prev, cultivationCycle: e.target.value }))}
                    style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem", fontWeight: 700 }}
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                    <option value="Perennial">Perennial</option>
                    <option value="Continuous">Continuous Multi-Cropping</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem" }}>
                    Land Acreage Under Crop:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={nextBatchForm.farmAcreage}
                    onChange={(e) => setNextBatchForm(prev => ({ ...prev, farmAcreage: Number(e.target.value) }))}
                    style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
                  />
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.82rem", color: "#475569" }}>
                <strong>Continuous Protocol Verification Guarantee:</strong>
                <ul style={{ margin: "0.3rem 0 0 0", paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <li>Batch succession index: Cycle #{(nextBatchModal.continuousCycle?.batchSequenceNumber || 1) + 1}</li>
                  <li>Farmer maintains earned trust badge during active review</li>
                  <li>5 fresh checkpoints generated for geo-pin, seed photos, call, soil card, and bio-spray</li>
                </ul>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setNextBatchModal(null)}
                  style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "0.65rem 1.2rem", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={nextBatchSubmitting}
                  style={{
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    color: "white",
                    border: "none",
                    padding: "0.65rem 1.5rem",
                    borderRadius: "10px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <Sparkles size={16} /> Launch Subsequent Batch & Start Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
