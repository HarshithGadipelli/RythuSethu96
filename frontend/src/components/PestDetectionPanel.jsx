import React, { useState } from "react";
import API from "../api/api";
import { playTTS } from "../utils/voiceParser";

const VOICE = {
  en: "Upload a photo of your crop leaf. Our AI will detect pests and diseases instantly.",
  te: "మీ పంట ఆకు ఫోటో అప్‌లోడ్ చేయండి. మన AI వెంటనే తెగుళ్ళు గుర్తిస్తుంది.",
  hi: "अपनी फसल के पत्ते की फोटो अपलोड करें। हमारा AI तुरंत कीट पहचानेगा।",
  kn: "ನಿಮ್ಮ ಬೆಳೆ ಎಲೆಯ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಮ್ಮ AI ತಕ್ಷಣ ಕೀಟಗಳನ್ನು ಗುರ್ತಿಸುತ್ತದೆ.",
  ta: "உங்கள் பயிர் இலையின் புகைப்படத்தை பதிவேற்றவும். AI உடனடியாக பூச்சிகளை கண்டறியும்.",
};

const SEVERITY_COLOR = { Low: "#16a34a", Moderate: "#f59e0b", High: "#ef4444", Severe: "#7f1d1d", Healthy: "#16a34a" };

export default function PestDetectionPanel({ user, lang = "en" }) {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [cropName, setCropName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const runPestDetect = async () => {
    if (!photoPreview && !cropName && !symptoms) {
      setMsg({ type: "error", text: "Please upload a crop photo or describe the symptoms." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await API.post("/ai/pest-detect", {
        imageBase64: photoPreview || null,
        cropName: cropName || undefined,
        symptoms: symptoms || undefined,
      });
      setResult(res.data);
      const ttsText = res.data.disease === "Healthy"
        ? "Your crop looks healthy. No pest detected."
        : "Issue detected: " + res.data.disease + ". Severity: " + res.data.severity + ". " + res.data.remedy;
      playTTS(ttsText, lang);
    } catch (e) {
      setMsg({ type: "error", text: "Detection failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="section-title mb-0">Crop Health and Pest Detection</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>{VOICE[lang] || VOICE.en}</p>
        </div>
        <button onClick={() => playTTS(VOICE[lang] || VOICE.en, lang)} style={{ background: "var(--green-pale)", border: "1px solid var(--green-light)", padding: "0.5rem 1rem", borderRadius: "100px", cursor: "pointer", color: "var(--green-deep)", fontWeight: 600 }}>Listen</button>
      </div>

      <div className="glass-card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <div>
            <div className="form-group mb-3">
              <label className="field-label">Upload Crop or Leaf Photo</label>
              <label className="file-upload-area" style={{ cursor: "pointer" }}>
                <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhotoChange} />
                <span style={{ fontSize: "2rem" }}>&#127807;</span>
                <p className="file-upload-text">{photoFile ? ("Selected: " + photoFile.name) : "Tap to capture or upload crop photo"}</p>
              </label>
              {photoPreview && <img src={photoPreview} alt="Crop preview" style={{ width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "12px", marginTop: "1rem" }} />}
            </div>
            <div className="form-group mb-3">
              <label className="field-label">Crop Name (Optional)</label>
              <input className="rs-input" placeholder="e.g. Tomato, Rice, Cotton..." value={cropName} onChange={(e) => setCropName(e.target.value)} />
            </div>
            <div className="form-group mb-3">
              <label className="field-label">Describe Symptoms (Optional)</label>
              <textarea className="rs-input" rows={3} placeholder="e.g. Yellow leaves, white powder on leaves, holes in stem, wilting..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} style={{ resize: "vertical" }} />
            </div>
            {msg.text && <div className={"alert alert-" + msg.type + " mb-3"}>{msg.text}</div>}
            <button className="btn-primary" style={{ width: "100%", padding: "0.9rem" }} onClick={runPestDetect} disabled={loading}>{loading ? "Analyzing crop..." : "Detect Pest or Disease"}</button>
          </div>

          <div>
            {!result && !loading && (
              <div style={{ padding: "3rem 2rem", textAlign: "center", color: "var(--text-muted)", border: "2px dashed #e2e8f0", borderRadius: "16px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                <div style={{ fontSize: "4rem" }}>&#128126;</div>
                <p style={{ fontSize: "1rem" }}>Upload a photo or describe symptoms to get an instant AI diagnosis</p>
                <div style={{ fontSize: "0.85rem", textAlign: "left", background: "rgba(0,0,0,0.03)", padding: "1rem", borderRadius: "10px", width: "100%" }}>
                  <strong>How it works:</strong>
                  <ul style={{ paddingLeft: "1.2rem", margin: "0.5rem 0 0 0" }}>
                    <li>Upload a clear photo of the affected leaf or plant</li>
                    <li>Our AI model analyzes it with Gemini Vision</li>
                    <li>Get instant diagnosis with organic remedy advice</li>
                    <li>Audio read-out available in your language</li>
                  </ul>
                </div>
              </div>
            )}
            {loading && (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>&#128300;</div>
                <p style={{ color: "var(--text-muted)" }}>Analyzing your crop with AI Vision...</p>
              </div>
            )}
            {result && (
              <div style={{ padding: "1.5rem", background: result.disease === "Healthy" ? "rgba(22,163,74,0.05)" : "rgba(239,68,68,0.05)", border: "1px solid " + (result.disease === "Healthy" ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.3)"), borderRadius: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.2rem" }}>{result.disease}</h4>
                  {result.severity && (
                    <span style={{ padding: "0.3rem 0.8rem", borderRadius: "100px", background: SEVERITY_COLOR[result.severity] || "#64748b", color: "white", fontSize: "0.8rem", fontWeight: 700 }}>{result.severity}</span>
                  )}
                </div>
                {result.symptoms && (
                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Observed Symptoms</strong>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-dark)", marginTop: "0.3rem" }}>{result.symptoms}</p>
                  </div>
                )}
                {result.remedy && (
                  <div style={{ padding: "1rem", background: "rgba(255,255,255,0.8)", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <strong style={{ fontSize: "0.85rem", color: "#16a34a", textTransform: "uppercase" }}>Organic Remedy and Treatment</strong>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-dark)", marginTop: "0.5rem", whiteSpace: "pre-line", lineHeight: 1.7 }}>{result.remedy}</p>
                  </div>
                )}
                {result.source && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.8rem" }}>Powered by: {result.source}</p>}
                <button className="btn-secondary mt-3" style={{ width: "100%" }} onClick={() => playTTS(result.remedy || "No remedy available.", lang)}>Listen to Remedy in Your Language</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card mt-3" style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <h4 className="section-title">Common Crop Diseases - Quick Reference</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            { name: "Leaf Blight", emoji: "&#127807;", tip: "Remove infected leaves. Spray copper fungicide." },
            { name: "Aphids", emoji: "&#128027;", tip: "Spray Neem oil 5ml/L. Introduce ladybugs." },
            { name: "Root Rot", emoji: "&#127758;", tip: "Improve drainage. Use Trichoderma biofungicide." },
            { name: "Powdery Mildew", emoji: "&#129419;", tip: "Spray potassium bicarbonate or sulfur." },
          ].map((d, i) => (
            <div key={i} style={{ padding: "1rem", background: "white", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }} dangerouslySetInnerHTML={{ __html: d.emoji }} />
              <strong style={{ color: "var(--text-dark)", fontSize: "0.9rem" }}>{d.name}</strong>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{d.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
