import React, { useState, useEffect } from "react";
import API, { BASE_URL } from "../api/api";
import { useLang } from "../context/LangContext";

export default function SoilTestingHub({ user, farmerProfile }) {
  const { t, lang } = useLang();

  // Scanner state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [sampleNotes, setSampleNotes] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Booking appointment state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [farmLocation, setFarmLocation] = useState(farmerProfile?.farmLocation || user?.location || "Medak, Telangana");
  const [latitude, setLatitude] = useState(user?.latitude || 18.0478);
  const [longitude, setLongitude] = useState(user?.longitude || 78.2612);
  const [farmSize, setFarmSize] = useState(farmerProfile?.farmSize || "5");
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState("Morning (8:00 AM - 12:00 PM)");
  const [samplingSpots, setSamplingSpots] = useState(3);
  const [paymentMode, setPaymentMode] = useState("upi");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Requests state
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user?._id) {
      loadMyRequests();
    }
  }, [user?._id]);

  const loadMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await API.get(`/soil-test/my-requests/${user?._id}`);
      setMyRequests(res.data);
    } catch (e) {
      console.error("Failed to load soil requests", e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanSoil = async () => {
    if (!photoPreview && !photoFile && !sampleNotes.trim()) {
      setMsg({ type: "error", text: "Please upload a soil photo or describe your soil texture." });
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await API.post("/soil-test/scan-photo", {
        imageBase64: photoPreview,
        sampleNotes
      });
      if (res.data.success) {
        setScanResult(res.data.analysis);
        setMsg({ type: "success", text: "🌱 Soil preliminary AI analysis complete!" });
      }
    } catch (e) {
      setMsg({ type: "error", text: "AI Soil scan failed. Please try again." });
    } finally {
      setScanning(false);
      setTimeout(() => setMsg({ type: "", text: "" }), 4000);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      const payload = {
        farmerId: user?._id,
        farmerName: user?.name,
        phone: user?.phone,
        farmLocation,
        latitude,
        longitude,
        farmSizeAcres: Number(farmSize),
        soilPhoto: photoPreview || "/uploads/ai_farm_1.jpg",
        aiAnalysis: scanResult,
        preferredDate,
        preferredTimeSlot: timeSlot,
        samplingSpotsCount: samplingSpots,
        advanceAmount: 299,
        paymentMode
      };
      const res = await API.post("/soil-test/book-appointment", payload);
      if (res.data.success) {
        setMsg({ type: "success", text: "✅ Soil Testing appointment booked! Advance of ₹299 confirmed. Admin will assign mobile lab team." });
        setShowBookingModal(false);
        loadMyRequests();
      }
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.error || "Failed to book appointment." });
    } finally {
      setBookingLoading(false);
      setTimeout(() => setMsg({ type: "", text: "" }), 5000);
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setMsg({ type: "success", text: `📍 GPS Coords updated: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` });
          setTimeout(() => setMsg({ type: "", text: "" }), 3000);
        },
        () => setMsg({ type: "error", text: "Could not fetch GPS location." })
      );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
        color: "white",
        padding: "1.8rem",
        borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(22, 101, 52, 0.3)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "1.8rem" }}>🧪</span>
            <h2 style={{ fontSize: "1.6rem", margin: 0, fontWeight: 800 }}>AI Soil Scanner & Laboratory Testing</h2>
          </div>
          <p style={{ fontSize: "0.9rem", color: "#bbf7d0", margin: "0.4rem 0 1rem 0", lineHeight: 1.5 }}>
            Scan your farm soil photo for instant AI classification. Book certified on-field laboratory testing for accurate pH, NPK, organic carbon & custom organic fertilizer guidance.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                const el = document.getElementById("soil-scanner-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "#22c55e", color: "#052e16", fontWeight: 700, padding: "0.6rem 1.2rem",
                borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.9rem"
              }}
            >
              📷 Scan Soil Photo Now
            </button>
            <button
              onClick={() => setShowBookingModal(true)}
              style={{
                background: "rgba(255,255,255,0.15)", color: "white", fontWeight: 600, padding: "0.6rem 1.2rem",
                borderRadius: "8px", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "0.9rem"
              }}
            >
              🔬 Book Lab Team Appointment (₹299 Advance)
            </button>
          </div>
        </div>
        <div style={{ textAlign: "right", background: "rgba(0,0,0,0.2)", padding: "1rem 1.4rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "0.8rem", color: "#86efac", textTransform: "uppercase", fontWeight: 700 }}>Advance Booking Fee</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#facc15" }}>₹299</div>
          <div style={{ fontSize: "0.75rem", color: "#dcfce7" }}>Balance ₹500 payable on field visit</div>
        </div>
      </div>

      {/* Main Grid: Scanner & Active Requests */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} id="soil-scanner-section">
        {/* Left Column: AI Soil Scanner */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 1rem 0" }}>
            <span>📷</span> Step 1: Instant AI Soil Photo Scan
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
            Take a clear photo of your topsoil (dry or moist) in natural sunlight to instantly classify soil type and crop compatibility.
          </p>

          <div style={{
            border: "2px dashed #94a3b8", borderRadius: "12px", padding: "1.5rem", textAlign: "center",
            background: "#f8fafc", marginBottom: "1rem", position: "relative", cursor: "pointer"
          }}>
            {photoPreview ? (
              <div>
                <img src={photoPreview} alt="Soil Sample" style={{ maxHeight: "200px", maxWidth: "100%", borderRadius: "8px", objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  style={{
                    position: "absolute", top: 10, right: 10, background: "#ef4444", color: "white",
                    border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🌱</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#334155" }}>Click or Drag Soil Photo Here</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Supports JPG, PNG, WEBP (Max 5MB)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.3rem" }}>
              Optional Notes (Color, Village, Past Crop):
            </label>
            <input
              type="text"
              className="rs-input"
              value={sampleNotes}
              onChange={e => setSampleNotes(e.target.value)}
              placeholder="e.g. Dark red clayey soil from Medak, previously grew paddy..."
              style={{ fontSize: "0.85rem" }}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleScanSoil}
            disabled={scanning || (!photoPreview && !sampleNotes.trim())}
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem" }}
          >
            {scanning ? "🤖 Analyzing Soil Texture & Grain..." : "🔍 Analyze Soil Type with AI"}
          </button>

          {/* Preliminary Scan Results Card */}
          {scanResult && (
            <div style={{
              marginTop: "1.2rem", background: "#f0fdf4", border: "1px solid #86efac",
              borderRadius: "12px", padding: "1.2rem", animation: "fadeIn 0.3s ease-in"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#166534" }}>
                  🌾 {scanResult.soilType}
                </span>
                <span className="badge badge-green" style={{ fontSize: "0.78rem" }}>
                  {scanResult.confidence}% AI Confidence
                </span>
              </div>

              <div style={{ fontSize: "0.83rem", color: "#1e293b", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <div><strong>Texture & Grain:</strong> {scanResult.texture}</div>
                <div><strong>Color Profile:</strong> {scanResult.colorProfile}</div>
                <div><strong>Estimated Organic Matter:</strong> {scanResult.organicMatterEstimate}</div>

                {/* ── Advanced Chemical & Elemental Analysis ── */}
                <div style={{ marginTop: "0.6rem", padding: "0.8rem", background: "white", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <strong style={{ color: "#166534", fontSize: "0.88rem" }}>🧪 Chemical & Elemental Scan</strong>
                    <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700, background: "#ecfdf5", padding: "2px 6px", borderRadius: "4px" }}>
                      Advanced AI Model
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.78rem" }}>
                    {/* Organic Carbon */}
                    <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <div style={{ color: "#64748b", fontSize: "0.72rem" }}>Organic Carbon (OC)</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#166534" }}>
                        {scanResult.organicCarbonPercent ? `${scanResult.organicCarbonPercent}%` : "0.72%"}
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 600 }}>
                        {scanResult.organicCarbonStatus || "High (>0.75%)"}
                      </span>
                    </div>

                    {/* Soil pH */}
                    <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <div style={{ color: "#64748b", fontSize: "0.72rem" }}>Estimated pH & EC</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f766e" }}>
                        pH {scanResult.estimatedPH || "6.8"}
                      </div>
                      <span style={{ fontSize: "0.68rem", color: "#0d9488", fontWeight: 600 }}>
                        {scanResult.phStatus || "Near Neutral"} • {scanResult.electricalConductivityEC || "0.35 dS/m"}
                      </span>
                    </div>
                  </div>

                  {/* NPK Estimates */}
                  {scanResult.npkEstimate && (
                    <div style={{ marginTop: "0.5rem", background: "#f0fdf4", padding: "0.5rem", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#166534", marginBottom: "0.2rem" }}>NPK Macro-Nutrient Estimates:</div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.72rem" }}>
                        <span style={{ background: "white", padding: "2px 6px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                          <strong>N:</strong> {scanResult.npkEstimate.nitrogen}
                        </span>
                        <span style={{ background: "white", padding: "2px 6px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                          <strong>P:</strong> {scanResult.npkEstimate.phosphorus}
                        </span>
                        <span style={{ background: "white", padding: "2px 6px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                          <strong>K:</strong> {scanResult.npkEstimate.potassium}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Micronutrients */}
                  {scanResult.micronutrients && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.3rem" }}>Micronutrients (Trace Elements):</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.3rem", fontSize: "0.7rem" }}>
                        {Object.entries(scanResult.micronutrients).map(([elem, status]) => (
                          <div key={elem} style={{ background: "#f8fafc", padding: "3px 6px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontWeight: 700, textTransform: "capitalize", color: "#334155" }}>{elem}: </span>
                            <span style={{ color: status.includes("Deficient") ? "#dc2626" : status.includes("Marginal") ? "#d97706" : "#16a34a" }}>
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ marginTop: "0.4rem" }}>
                  <strong style={{ color: "#166534" }}>Best Suitable Crops:</strong>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                    {scanResult.suitableCrops?.map((c, i) => (
                      <span key={i} style={{ background: "white", padding: "3px 8px", borderRadius: "6px", border: "1px solid #bbf7d0", fontSize: "0.75rem", fontWeight: 600, color: "#166534" }}>
                        🌾 {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "0.4rem" }}>
                  <strong style={{ color: "#166534" }}>Organic Recommendations:</strong>
                  <ul style={{ margin: "0.3rem 0 0 1.2rem", padding: 0, fontSize: "0.78rem", color: "#334155" }}>
                    {scanResult.suggestedOrganicFertilizers?.map((tip, i) => (
                      <li key={i} style={{ marginBottom: "0.2rem" }}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Lab notice */}
              <div style={{
                marginTop: "0.9rem", padding: "0.6rem 0.8rem", background: "#fef3c7",
                border: "1px solid #fde68a", borderRadius: "8px", fontSize: "0.76rem", color: "#92400e"
              }}>
                ⚠️ <strong>Need exact pH, NPK & Micronutrient values?</strong> Visual scan classifies physical soil type. Book full laboratory spectrometer chemical testing below for on-field testing.
              </div>

              <button
                className="btn-primary mt-2"
                onClick={() => setShowBookingModal(true)}
                style={{ width: "100%", fontSize: "0.88rem", background: "linear-gradient(135deg, #15803d, #166534)" }}
              >
                🔬 Book Lab Team for This Soil (₹299 Advance)
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Farmer's Soil Test History & Lab Cards */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <span>📋</span> Step 2: Lab Test Appointments & Reports
            </h3>
            <button className="btn-secondary" style={{ padding: "4px 10px", fontSize: "0.78rem" }} onClick={loadMyRequests}>
              🔄 Refresh
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading your soil testing history...</div>
          ) : myRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🧪</div>
              <p style={{ fontWeight: 600, color: "#475569", margin: 0 }}>No Soil Testing Requests Yet</p>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                Scan your soil photo or book a mobile laboratory unit visit to receive a certified Soil Health Card.
              </p>
              <button className="btn-primary mt-2" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => setShowBookingModal(true)}>
                + Book Your First Soil Test (₹299)
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {myRequests.map((req) => {
                const isAssigned = req.status === "team_assigned" || req.status === "sample_collected" || req.status === "lab_testing" || req.status === "report_published";
                const isPublished = req.status === "report_published";

                return (
                  <div
                    key={req._id}
                    style={{
                      background: isPublished ? "#f0fdf4" : isAssigned ? "#eff6ff" : "#fffbeb",
                      border: isPublished ? "1px solid #86efac" : isAssigned ? "1px solid #bfdbfe" : "1px solid #fde68a",
                      borderRadius: "12px", padding: "1.2rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-dark)" }}>
                          🌱 {req.aiPreliminaryClassification?.soilType || "Farm Soil Test"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                          ID: <code>{req._id.substring(0, 10)}</code> • Booked: {new Date(req.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <span
                        className={`badge ${isPublished ? "badge-green" : isAssigned ? "badge-blue" : "badge-yellow"}`}
                        style={{ fontSize: "0.75rem", textTransform: "capitalize" }}
                      >
                        {req.status.replace("_", " ")}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem", color: "#334155", marginBottom: "0.8rem" }}>
                      <div>📍 <strong>Location:</strong> {req.farmLocation}</div>
                      <div>🌾 <strong>Area:</strong> {req.farmSizeAcres} Acres ({req.appointmentDetails?.samplingSpotsCount} spots)</div>
                      <div>💳 <strong>Advance Paid:</strong> ₹{req.appointmentDetails?.advanceAmount} (Txn: {req.appointmentDetails?.paymentTxnId})</div>
                      <div>📅 <strong>Preferred Date:</strong> {new Date(req.appointmentDetails?.preferredDate).toLocaleDateString("en-IN")}</div>
                    </div>

                    {/* Assigned Team Notification */}
                    {isAssigned && req.assignedTeam?.scientistName && (
                      <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px", border: "1px solid #bfdbfe", marginBottom: "0.8rem", fontSize: "0.8rem" }}>
                        <div style={{ color: "#1e40af", fontWeight: 700, marginBottom: "0.2rem" }}>
                          👨‍🔬 Assigned Testing Team: {req.assignedTeam.scientistName}
                        </div>
                        <div style={{ color: "#475569" }}>
                          🚐 Vehicle: {req.assignedTeam.teamVehicleNumber} • 📞 Phone: {req.assignedTeam.contactPhone}
                        </div>
                        {req.assignedTeam.scheduledVisitDate && (
                          <div style={{ color: "#16a34a", fontWeight: 600, marginTop: "0.2rem" }}>
                            ⏰ Scheduled Field Visit: {new Date(req.assignedTeam.scheduledVisitDate).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </div>
                    )}

                    {!isAssigned && (
                      <div style={{ fontSize: "0.78rem", color: "#b45309", background: "#fef3c7", padding: "0.5rem 0.8rem", borderRadius: "6px" }}>
                        ⏳ <strong>Advance received!</strong> Admin is reviewing your farm location to assign the nearest Mobile Soil Lab Team.
                      </div>
                    )}

                    {/* Published Report View Button */}
                    {isPublished && (
                      <button
                        className="btn-primary"
                        onClick={() => setSelectedReport(req)}
                        style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem", background: "linear-gradient(135deg, #15803d, #166534)" }}
                      >
                        📜 View Certified Digital Soil Health Card (pH {req.soilHealthReport?.phLevel})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── BOOKING MODAL ── */}
      {showBookingModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem"
        }}>
          <div style={{
            background: "white", borderRadius: "16px", maxWidth: "600px", width: "100%",
            padding: "2rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.8rem" }}>
              <h3 style={{ color: "var(--green-deep)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🔬</span> Book On-Field Lab Soil Testing Appointment
              </h3>
              <button onClick={() => setShowBookingModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleBookAppointment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="field-label">Farm Location Address:</label>
                  <input
                    type="text"
                    className="rs-input"
                    value={farmLocation}
                    onChange={e => setFarmLocation(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Land Size (Acres):</label>
                  <input
                    type="number"
                    step="0.5"
                    className="rs-input"
                    value={farmSize}
                    onChange={e => setFarmSize(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <label className="field-label" style={{ margin: 0 }}>GPS Coordinates (For Mobile Lab Navigation):</label>
                  <button type="button" onClick={detectLocation} style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: "6px", fontSize: "0.72rem", cursor: "pointer" }}>
                    📍 Auto-Detect GPS
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <input type="number" step="any" className="rs-input" value={latitude} onChange={e => setLatitude(Number(e.target.value))} placeholder="Latitude" />
                  <input type="number" step="any" className="rs-input" value={longitude} onChange={e => setLongitude(Number(e.target.value))} placeholder="Longitude" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="field-label">Preferred Appointment Date:</label>
                  <input
                    type="date"
                    className="rs-input"
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Preferred Time Slot:</label>
                  <select className="rs-input" value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                    <option value="Morning (8:00 AM - 12:00 PM)">Morning (8:00 AM - 12:00 PM)</option>
                    <option value="Afternoon (1:00 PM - 5:00 PM)">Afternoon (1:00 PM - 5:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Number of Sample Collection Spots:</label>
                <select className="rs-input" value={samplingSpots} onChange={e => setSamplingSpots(Number(e.target.value))}>
                  <option value={1}>1 Spot (Standard small plot)</option>
                  <option value={3}>3 Spots (Recommended for 2-5 acres zigzag sampling)</option>
                  <option value={5}>5 Spots (Comprehensive for more than 5 acres)</option>
                </select>
              </div>

              {/* Advance Payment Breakdown */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  <span>Total Laboratory & Chemical Testing Fee:</span>
                  <strong>₹799</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#16a34a", fontWeight: 700, marginBottom: "0.3rem" }}>
                  <span>Advance Booking Amount Required Now:</span>
                  <span>₹299</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span>Balance Payable to Testing Team on Field Visit:</span>
                  <span>₹500</span>
                </div>
              </div>

              <div>
                <label className="field-label">Select Advance Payment Method:</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  {[
                    { id: "upi", label: "📱 UPI / QR Code" },
                    { id: "wallet", label: "👛 Rythu Wallet" },
                    { id: "cod", label: "💵 Pay on Arrival" }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMode(m.id)}
                      style={{
                        padding: "0.6rem", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600,
                        border: paymentMode === m.id ? "2px solid #16a34a" : "1px solid #cbd5e1",
                        background: paymentMode === m.id ? "#f0fdf4" : "white", cursor: "pointer",
                        color: paymentMode === m.id ? "#166534" : "#475569"
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={bookingLoading} style={{ background: "linear-gradient(135deg, #15803d, #166534)" }}>
                  {bookingLoading ? "Processing Booking..." : "✅ Pay ₹299 & Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CERTIFIED DIGITAL SOIL HEALTH CARD MODAL ── */}
      {selectedReport && selectedReport.soilHealthReport && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem"
        }}>
          <div style={{
            background: "white", borderRadius: "16px", maxWidth: "680px", width: "100%",
            padding: "2rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            {/* Certificate Header */}
            <div style={{
              textAlign: "center", borderBottom: "2px solid #16a34a", paddingBottom: "1.2rem", marginBottom: "1.5rem"
            }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.2rem" }}>🌾 🇮🇳 📜</div>
              <h2 style={{ fontSize: "1.4rem", color: "#14532d", margin: 0, fontWeight: 800 }}>
                CERTIFIED DIGITAL SOIL HEALTH CARD
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                Rythu Jana Sethu Agricultural Chemistry Laboratory • Govt. Accredited Standards
              </div>
            </div>

            {/* Farmer & Sample Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", fontSize: "0.85rem", background: "#f8fafc", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
              <div><strong>Farmer Name:</strong> {selectedReport.farmerName}</div>
              <div><strong>Farm Location:</strong> {selectedReport.farmLocation}</div>
              <div><strong>Soil Type:</strong> {selectedReport.aiPreliminaryClassification?.soilType}</div>
              <div><strong>Tested By:</strong> {selectedReport.assignedTeam?.scientistName || "Senior Soil Chemist"}</div>
              <div><strong>Tested On:</strong> {new Date(selectedReport.soilHealthReport.publishedAt || selectedReport.updatedAt).toLocaleDateString("en-IN")}</div>
              <div><strong>Certificate ID:</strong> <code>{selectedReport._id.toUpperCase()}</code></div>
            </div>

            {/* pH Meter Highlight */}
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "12px",
              padding: "1.2rem", textAlign: "center", marginBottom: "1.5rem"
            }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                Measured Soil pH Level
              </div>
              <div style={{ fontSize: "3rem", fontWeight: 900, color: "#15803d", margin: "0.2rem 0" }}>
                {selectedReport.soilHealthReport.phLevel}
              </div>
              <span className="badge badge-green" style={{ fontSize: "0.85rem", padding: "4px 14px" }}>
                {selectedReport.soilHealthReport.phCategory || "Optimal / Neutral (Ideal for most crops)"}
              </span>
            </div>

            {/* NPK & Organic Carbon Parameters Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#1e293b", fontSize: "0.9rem", margin: "0 0 0.6rem 0" }}>🌱 Macronutrient Values</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem" }}>
                  <div><strong>Nitrogen (N):</strong> {selectedReport.soilHealthReport.nitrogenN || "265 kg/ha (Medium)"}</div>
                  <div><strong>Phosphorus (P):</strong> {selectedReport.soilHealthReport.phosphorusP || "24 kg/ha (Adequate)"}</div>
                  <div><strong>Potassium (K):</strong> {selectedReport.soilHealthReport.potassiumK || "320 kg/ha (High)"}</div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "#1e293b", fontSize: "0.9rem", margin: "0 0 0.6rem 0" }}>🔬 Physical & Micronutrients</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem" }}>
                  <div><strong>Organic Carbon (OC):</strong> {selectedReport.soilHealthReport.organicCarbonPercent}% (Good)</div>
                  <div><strong>Electrical Cond. (EC):</strong> {selectedReport.soilHealthReport.electricalConductivityEC || "0.38 dS/m (Normal)"}</div>
                  <div><strong>Zinc (Zn):</strong> {selectedReport.soilHealthReport.micronutrients?.zinc || "1.4 ppm (Sufficient)"}</div>
                  <div><strong>Iron (Fe):</strong> {selectedReport.soilHealthReport.micronutrients?.iron || "6.2 ppm (Adequate)"}</div>
                </div>
              </div>
            </div>

            {/* Custom Prescription & Manure Advice */}
            <div style={{ background: "#fef9c3", border: "1px solid #fde047", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem" }}>
              <h4 style={{ color: "#854d0e", fontSize: "0.9rem", margin: "0 0 0.4rem 0" }}>
                💊 Soil Scientist Fertilizer & Manure Prescription:
              </h4>
              <p style={{ fontSize: "0.84rem", color: "#713f12", margin: 0, lineHeight: 1.5 }}>
                {selectedReport.soilHealthReport.recommendedManure || "Apply 2 tonnes/acre Farm Yard Manure + 250kg Vermicompost + 5kg PSB biofertilizer."}
              </p>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                className="btn-secondary"
                onClick={() => window.print()}
                style={{ fontSize: "0.85rem" }}
              >
                🖨️ Print Certificate
              </button>
              <button
                className="btn-primary"
                onClick={() => setSelectedReport(null)}
                style={{ fontSize: "0.85rem", padding: "0.5rem 1.4rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
