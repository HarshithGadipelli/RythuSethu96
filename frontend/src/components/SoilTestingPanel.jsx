import React, { useState, useEffect } from "react";
import API from "../api/api";
import { playTTS } from "../utils/voiceParser";

const VOICE = {
  en: "Upload a photo of your soil or book a physical lab test.",
  te: "మీ నేల ఫోటో అప్‌లోడ్ చేయండి లేదా లేబ్ టెస్ట్ బుక్ చేయండి.",
  hi: "अपनी मिट्टी की फोटो अपलोड करें या लैब टेस्ट बुक करें।",
  kn: "ನಿಮ್ಮ ಮಣ್ಣಿನ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆ ಬುಕ್ ಮಾಡಿ.",
  ta: "உங்கள் மண் புகைப்படத்தை பதிவேற்றவும் அல்லது ஆய்வக சோதனை புக் செய்யவும்.",
};

export default function SoilTestingPanel({ user, lang = "en" }) {
  const [mode, setMode] = useState("ai");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [sampleNotes, setSampleNotes] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [myRequests, setMyRequests] = useState([]);
  const [labForm, setLabForm] = useState({
    farmLocation: user?.location || "",
    farmSizeAcres: "",
    preferredDate: "",
    preferredTimeSlot: "Morning (8:00 AM - 12:00 PM)",
  });
  const [booking, setBooking] = useState(false);

  useEffect(() => { if (mode === "status") fetchRequests(); }, [mode]);

  const fetchRequests = async () => {
    try {
      const res = await API.get(`/soil-test/my-requests/${user?._id}`);
      setMyRequests(res.data || []);
    } catch {}
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const runAIScan = async () => {
    if (!photoPreview && !sampleNotes) {
      setMsg({ type: "error", text: "Please upload a soil photo or describe your soil." });
      return;
    }
    setScanning(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await API.post("/soil-test/scan-photo", {
        imageBase64: photoPreview || null,
        sampleNotes,
      });
      setResult(res.data.analysis);
      playTTS(`Soil analysis complete. Your soil type is ${res.data.analysis?.soilType}.`, lang);
    } catch (e) {
      setMsg({ type: "error", text: "Analysis failed. Please try again." });
    } finally {
      setScanning(false);
    }
  };

  const bookLabTest = async () => {
    if (!labForm.farmLocation || !labForm.farmSizeAcres || !labForm.preferredDate) {
      setMsg({ type: "error", text: "Please fill all required fields." });
      return;
    }
    setBooking(true);
    try {
      await API.post("/soil-test/book-appointment", {
        farmerId: user._id,
        farmerName: user.name,
        phone: user.phone,
        farmLocation: labForm.farmLocation,
        farmSizeAcres: labForm.farmSizeAcres,
        preferredDate: labForm.preferredDate,
        preferredTimeSlot: labForm.preferredTimeSlot,
        advanceAmount: 299,
        paymentMode: "upi",
      });
      setMsg({ type: "success", text: "Lab test booked! Admin will assign a team. Rs.299 advance registered." });
      setMode("status");
      fetchRequests();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.error || "Booking failed." });
    } finally {
      setBooking(false);
    }
  };

  const statusColor = { pending_assignment: "badge-yellow", assigned: "badge-blue", report_published: "badge-green", cancelled: "badge-red" };
  const statusLabel = { pending_assignment: "Awaiting Admin", assigned: "Team Assigned", report_published: "Report Ready", cancelled: "Cancelled" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="section-title mb-0">Soil Testing and Analysis</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>{VOICE[lang] || VOICE.en}</p>
        </div>
        <button onClick={() => playTTS(VOICE[lang] || VOICE.en, lang)} style={{ background: "var(--green-pale)", border: "1px solid var(--green-light)", padding: "0.5rem 1rem", borderRadius: "100px", cursor: "pointer", color: "var(--green-deep)", fontWeight: 600 }}>Listen</button>
      </div>
      <div className="tab-bar mb-3">
        <button className={"tab-btn " + (mode === "ai" ? "active" : "")} onClick={() => setMode("ai")}>AI Photo Scan</button>
        <button className={"tab-btn " + (mode === "lab" ? "active" : "")} onClick={() => setMode("lab")}>Book Lab Test</button>
        <button className={"tab-btn " + (mode === "status" ? "active" : "")} onClick={() => setMode("status")}>My Requests</button>
      </div>
      {msg.text && <div className={"alert alert-" + msg.type + " mb-3"}>{msg.text}</div>}
      {mode === "ai" && (
        <div className="glass-card">
          <h3 className="section-title">Instant AI Soil Analysis</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>Take a clear photo of your farm soil. Our AI will identify the soil type and give crop recommendations instantly.</p>
          <div className="form-group mb-3">
            <label className="field-label">Upload Soil Photo</label>
            <label className="file-upload-area" style={{ cursor: "pointer" }}>
              <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhotoChange} />
              <span style={{ fontSize: "2rem" }}>&#127757;</span>
              <p className="file-upload-text">{photoFile ? ("Selected: " + photoFile.name) : "Tap to capture or upload soil photo"}</p>
            </label>
            {photoPreview && <img src={photoPreview} alt="Soil preview" style={{ width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "12px", marginTop: "1rem" }} />}
          </div>
          <div className="form-group mb-3">
            <label className="field-label">Describe Your Soil (Optional)</label>
            <textarea className="rs-input" rows={2} placeholder="e.g. Red sandy soil, cotton field, near Warangal..." value={sampleNotes} onChange={(e) => setSampleNotes(e.target.value)} style={{ resize: "vertical" }} />
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "0.8rem 2rem" }} onClick={runAIScan} disabled={scanning}>{scanning ? "Analyzing..." : "Analyze Soil"}</button>
          {result && (
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "16px" }}>
              <h4 style={{ color: "var(--green-deep)", marginBottom: "1rem" }}>Soil Analysis Report</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px" }}><div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SOIL TYPE</div><div style={{ fontWeight: 800, color: "var(--green-deep)", fontSize: "1.1rem" }}>{result.soilType}</div></div>
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px" }}><div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>AI CONFIDENCE</div><div style={{ fontWeight: 800, color: "#3b82f6", fontSize: "1.1rem" }}>{result.confidence}%</div></div>
                <div style={{ background: "white", padding: "1rem", borderRadius: "10px" }}><div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ORGANIC MATTER</div><div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "1rem" }}>{result.organicMatterEstimate}</div></div>
              </div>
              {result.texture && <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}><strong>Texture:</strong> {result.texture}</p>}
              {result.suitableCrops?.length > 0 && (
                <div style={{ marginTop: "1rem" }}><strong>Best Crops:</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>{result.suitableCrops.map((c, i) => <span key={i} className="badge badge-green">{c}</span>)}</div>
                </div>
              )}
              {result.suggestedOrganicFertilizers?.length > 0 && (
                <div style={{ marginTop: "1rem" }}><strong>Organic Fertilizer Tips:</strong>
                  <ul style={{ margin: "0.5rem 0 0 1.2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>{result.suggestedOrganicFertilizers.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>
              )}
              {result.recommendations && <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>{result.recommendations}</p>}
              {result.notice && <div style={{ marginTop: "1rem", padding: "0.8rem", background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: "8px", fontSize: "0.82rem", color: "#92400e" }}>{result.notice}</div>}
              <button className="btn-secondary mt-3" style={{ width: "auto" }} onClick={() => setMode("lab")}>Book Physical Lab Test for Full NPK Report</button>
            </div>
          )}
        </div>
      )}
      {mode === "lab" && (
        <div className="glass-card">
          <h3 className="section-title">Book Physical Soil Lab Test</h3>
          <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", padding: "1rem", borderRadius: "12px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            Full on-field soil testing by a certified scientist team. Results include pH, N, P, K, Organic Carbon, and Micronutrients.<br/>
            <strong>Cost: Rs.799 total. Rs.299 advance now, Rs.500 after report delivery.</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            <div className="form-group"><label className="field-label">Farm Location *</label><input className="rs-input" placeholder="Village, Mandal, District..." value={labForm.farmLocation} onChange={(e) => setLabForm(f => ({...f, farmLocation: e.target.value}))} /></div>
            <div className="form-group"><label className="field-label">Farm Size (Acres) *</label><input className="rs-input" type="number" placeholder="e.g. 3" value={labForm.farmSizeAcres} onChange={(e) => setLabForm(f => ({...f, farmSizeAcres: e.target.value}))} /></div>
            <div className="form-group"><label className="field-label">Preferred Visit Date *</label><input className="rs-input" type="date" min={new Date().toISOString().split("T")[0]} value={labForm.preferredDate} onChange={(e) => setLabForm(f => ({...f, preferredDate: e.target.value}))} /></div>
            <div className="form-group"><label className="field-label">Preferred Time Slot</label>
              <select className="rs-select" value={labForm.preferredTimeSlot} onChange={(e) => setLabForm(f => ({...f, preferredTimeSlot: e.target.value}))}>
                <option>Morning (8:00 AM - 12:00 PM)</option><option>Afternoon (12:00 PM - 4:00 PM)</option><option>Evening (4:00 PM - 7:00 PM)</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(22,163,74,0.08)", borderRadius: "12px", border: "1px solid var(--green-light)", fontSize: "0.9rem" }}>
            <strong>Advance Payment: Rs.299 via UPI</strong><br/>UPI ID: 8688938604@upi
          </div>
          <button className="btn-primary mt-3" style={{ width: "auto", padding: "0.8rem 2rem" }} onClick={bookLabTest} disabled={booking}>{booking ? "Booking..." : "Book Lab Test and Pay Rs.299 Advance"}</button>
        </div>
      )}
      {mode === "status" && (
        <div className="glass-card">
          <h3 className="section-title">My Soil Test Requests</h3>
          {myRequests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}><p style={{ fontSize: "3rem" }}>&#129514;</p><p>No soil test requests yet.</p><button className="btn-primary mt-2" style={{ width: "auto" }} onClick={() => setMode("lab")}>Book Lab Test</button></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {myRequests.map(r => (
                <div key={r._id} style={{ padding: "1.5rem", background: "rgba(255,255,255,0.5)", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.8rem" }}>
                    <strong>{r.farmLocation}</strong><span className={"badge " + (statusColor[r.status] || "badge-yellow")}>{statusLabel[r.status] || r.status}</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Booked: {new Date(r.createdAt).toLocaleDateString("en-IN")} | Farm: {r.farmSizeAcres} acres</p>
                  {r.assignedTeam?.scientistName && <div style={{ marginTop: "0.8rem", padding: "0.8rem", background: "#f0fdf4", borderRadius: "8px", fontSize: "0.85rem" }}>{r.assignedTeam.scientistName} | {r.assignedTeam.contactPhone} | {r.assignedTeam.teamVehicleNumber}</div>}
                  {r.soilHealthReport && (
                    <div style={{ marginTop: "0.8rem", padding: "1rem", background: "#f0f9ff", borderRadius: "8px", border: "1px solid #0ea5e9" }}>
                      <strong>Official Lab Report:</strong>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.82rem" }}>
                        <div>pH: <strong>{r.soilHealthReport.phLevel}</strong></div><div>N: <strong>{r.soilHealthReport.nitrogenN}</strong></div><div>P: <strong>{r.soilHealthReport.phosphorusP}</strong></div><div>K: <strong>{r.soilHealthReport.potassiumK}</strong></div><div>OC%: <strong>{r.soilHealthReport.organicCarbonPercent}</strong></div>
                      </div>
                      {r.soilHealthReport.recommendedManure && <p style={{ marginTop: "0.5rem" }}>{r.soilHealthReport.recommendedManure}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
