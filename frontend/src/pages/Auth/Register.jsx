import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { useVoiceInput } from "../../utils/useVoiceInput";
import AutoSuggestInput from "../../components/AutoSuggestInput";
import { parseSpokenNumber, parseSpokenSequence, playTTS } from "../../utils/voiceParser";
import LocationButton from "../../components/LocationButton";
import VoiceMicButton from "../../components/VoiceMicButton";
import LocationPickerMap from "../../components/LocationPickerMap";
import { Mic, Loader2, Sparkles, MapPin } from "lucide-react";

const SOIL_TYPES = [
  "loamy", "clay", "sandy", "silt", "peat", "chalk", 
  "red_soil", "black_soil", "alluvial_soil", "laterite_soil", "arid_soil", "forest_soil", "saline",
  "other"
];
const LANGUAGES = [{ v: "en", l: "English" }, { v: "te", l: "తెలుగు" }, { v: "hi", l: "हिंदी" }, { v: "kn", l: "ಕನ್ನಡ" }, { v: "ta", l: "தமிழ்" }];

export default function Register() {
  const { login } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { listening, activeField, interim, startListening, stopListening } = useVoiceInput(lang);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [showFarmMap, setShowFarmMap] = useState(false);
  const [aiGuesserActive, setAiGuesserActive] = useState(false);
  const [assistantRunning, setAssistantRunning] = useState(false);
  const [assistantStep, setAssistantStep] = useState("");
  const [assistantMsg, setAssistantMsg] = useState("");
  const [sameAsPersonal, setSameAsPersonal] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", countryCode: "+91", password: "", confirmPass: "",
    role: "customer", language: "en", aadhaar: "",
    location: "", latitude: "", longitude: "",
    farmName: "", farmLocation: "", farmSize: "", soilType: "loamy", experience: "",
    soilTestRequested: false,
    address: "", pincode: "", city: "", state: "",
    customerType: "individual", requiresDailyDelivery: false,
    agentType: "bike", locationMethod: "gps",
    adminSecret: "", acceptedTerms: false
  });
  
  const [locationAudio, setLocationAudio] = useState(null);

  const set = (k) => (val) => {
    if (typeof val === "function") {
      setForm((f) => ({ ...f, [k]: val(f[k]) }));
    } else if (typeof val === "object" && val?.target) {
      setForm((f) => ({ ...f, [k]: val.target.value }));
    } else {
      setForm((f) => ({ ...f, [k]: val }));
    }
  };

  const readAloud = (label, value) => {
    let text = "";
    if (value && value.length > 20) {
      text = value; // Assume it's an instruction
    } else {
      text = value ? `${label}. ${t("currentValueIs")} ${value}` : `${t("pleaseEnter")} ${label}`;
    }
    playTTS(text, lang);
  };

  const speak = (field) => {
    if (listening && activeField === field) {
      if (typeof stopListening === "function") stopListening();
      return;
    }
    const isSequence = ["phone", "pincode", "aadhaar"].includes(field);
    const isNumeric = ["farmSize", "experience"].includes(field);
    const isEnglishOnly = ["email", "password", "confirmPass"].includes(field);

    startListening((val) => {
      if (typeof val === "function") {
        setForm((f) => {
          const prev = f[field];
          let newVal = val(prev);
          if (isSequence) newVal = parseSpokenSequence(newVal);
          else if (isNumeric) newVal = parseSpokenNumber(newVal);
          return { ...f, [field]: newVal };
        });
      } else {
        let newVal = val;
        if (isSequence) newVal = parseSpokenSequence(val);
        else if (isNumeric) newVal = parseSpokenNumber(val);

        if (isEnglishOnly && newVal) {
          newVal = newVal.replace(/\s+/g, '').toLowerCase();
          newVal = newVal.replace(/at/g, '@').replace(/dot/g, '.');
        }

        setForm((f) => ({ ...f, [field]: newVal }));
      }
    }, { fieldId: field, lang: isEnglishOnly ? "en" : lang });
  };

  // One-shot voice listen that resolves a promise
  const listenOnce = (fieldId, processVal) =>
    new Promise((resolve) => {
      startListening(
        (val) => {
          const raw = typeof val === "function" ? val("") : val;
          const processed = processVal ? processVal(raw) : raw;
          resolve(processed);
        },
        { fieldId, lang }
      );
    });

  const handleAssistantListening = async () => {
    if (assistantRunning) return;
    setAssistantRunning(true);
    setAssistantMsg("");
    try {
      // Step 1: Name
      setAssistantStep("name");
      setAssistantMsg(t("sayName"));
      await playTTS(t("sayName"), lang);
      const name = await listenOnce("assistant_name", (v) => v.trim());
      if (name) setForm((f) => ({ ...f, name }));

      // Step 2: Phone
      setAssistantStep("phone");
      setAssistantMsg(t("sayPhone"));
      await playTTS(t("sayPhone"), lang);
      const phone = await listenOnce("assistant_phone", (v) => parseSpokenSequence(v).replace(/\D/g, "").substring(0, 10));
      if (phone) setForm((f) => ({ ...f, phone }));

      // Step 3: Farm Location
      setAssistantStep("farmLocation");
      setAssistantMsg(t("sayFarmLoc"));
      await playTTS(t("sayFarmLoc"), lang);
      const farmLocation = await listenOnce("assistant_farmLocation", (v) => v.trim());
      if (farmLocation) setForm((f) => ({ ...f, farmLocation }));

      // Step 4: Farm Size
      setAssistantStep("farmSize");
      setAssistantMsg(t("sayAcres"));
      await playTTS(t("sayAcres"), lang);
      const farmSize = await listenOnce("assistant_farmSize", (v) => parseSpokenNumber(v));
      if (farmSize) setForm((f) => ({ ...f, farmSize }));

      // Step 5: Experience
      setAssistantStep("experience");
      setAssistantMsg(t("sayExp"));
      await playTTS(t("sayExp"), lang);
      const experience = await listenOnce("assistant_experience", (v) => parseSpokenNumber(v));
      if (experience) setForm((f) => ({ ...f, experience }));

      // Step 6: Email
      setAssistantStep("email");
      setAssistantMsg(t("guidedStart"));
      await playTTS(t("guidedStart"), lang);
      const email = await listenOnce("assistant_email", (v) => v.replace(/\s+/g, "").toLowerCase().replace(/at/g, "@").replace(/dot/g, "."));
      if (email) setForm((f) => ({ ...f, email }));

      // Step 7: Password
      setAssistantStep("password");
      setAssistantMsg(t("guidedPass"));
      await playTTS(t("guidedPass"), lang);
      const password = await listenOnce("assistant_password", (v) => v.replace(/\s+/g, "").toLowerCase());
      if (password) setForm((f) => ({ ...f, password, confirmPass: password })); // Auto confirm pass for voice

      setAssistantStep("done");
      setAssistantMsg(t("allDone"));
      await playTTS(t("allDone"), lang);
    } catch (err) {
      setAssistantMsg("Voice error. Please try again or fill manually.");
    } finally {
      setAssistantStep("");
      setAssistantRunning(false);
    }
  };



  const totalSteps = (form.role === "farmer" || form.role === "agent") ? 3 : 2;

  const handleNextStep1 = () => {
    setError("");
    if (!form.name.trim()) { setError("Please enter your full name."); return; }
    if (!form.email.trim() || !form.email.includes("@")) { setError("Please enter a valid email address."); return; }
    const phoneDigits = form.phone ? form.phone.replace(/\D/g, "") : "";
    if (phoneDigits.length !== 10) { setError("Phone number must be exactly 10 digits."); return; }
    if (!form.password || form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPass) { setError("Passwords do not match. Please re-enter."); return; }
    if (form.role === "admin" && !form.adminSecret) { setError("Admin access code is required."); return; }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setError("");
    if (!form.location && !form.address) { setError("Please provide your location or address."); return; }
    if ((form.role === "farmer" || form.role === "agent") && !form.aadhaar) {
      setError("Aadhaar number is required for identity verification.");
      return;
    }
    setStep(3);
  };

  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.email || !form.password || !form.phone) { setError("Name, email, phone & password are required."); return; }
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) { setError("Phone number must be exactly 10 digits."); return; }
    if (form.password !== form.confirmPass) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.role === "admin" && !form.adminSecret) { setError("Admin access code is required."); return; }
    if (!form.acceptedTerms) { setError("You must accept the Terms and Conditions to register."); return; }
    setLoading(true);
    try {
      let res;
      if ((form.role === "farmer" || form.role === "agent") && (form.farmerPhoto || form.farmPhoto || form.productPhoto || form.avatar || form.aadhaarPhoto)) {
        // Use FormData for file uploads
        const fd = new FormData();
        Object.entries(form).forEach(([key, val]) => {
          if (key === "confirmPass" || key.endsWith("Preview")) return;
          if (val instanceof File) {
            fd.append(key, val);
          } else if (val !== "" && val !== undefined) {
            fd.append(key, val);
          }
        });
        res = await API.post("/auth/register", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const payload = { ...form };
        delete payload.confirmPass;
        // Remove file/preview fields
        delete payload.farmerPhoto; delete payload.farmPhoto; delete payload.productPhoto;
        delete payload.avatar; delete payload.aadhaarPhoto;
        delete payload.farmerPhotoPreview; delete payload.farmPhotoPreview; delete payload.productPhotoPreview;
        delete payload.avatarPreview; delete payload.aadhaarPhotoPreview; delete payload.locationAudioPreview;
        res = await API.post("/auth/register", payload);
      }
      try {
        const saved = JSON.parse(localStorage.getItem("rs_saved_accounts")) || [];
        const filtered = saved.filter(a => a.email.toLowerCase() !== res.data.user.email.toLowerCase());
        filtered.unshift({
          email: res.data.user.email,
          password: form.password,
          name: res.data.user.name,
          role: res.data.user.role,
          avatar: res.data.user.avatar || ""
        });
        localStorage.setItem("rs_saved_accounts", JSON.stringify(filtered.slice(0, 4)));
      } catch (e) {}
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === "farmer") navigate("/farmer");
      else if (role === "agent") navigate("/agent");
      else if (role === "admin") navigate("/admin");
      else navigate("/marketplace");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "560px" }}>
        <div className="text-center mb-4">
          <span style={{ fontSize: "3.5rem", display: "block" }}>🌱</span>
          <h1 className="page-title" style={{ fontSize: "1.8rem" }}>Join {t("appName")}</h1>
        </div>

        <div className="glass-card">
          {/* Step indicator */}
          <div className="flex-between mb-3" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <span>Step {step} of {totalSteps}</span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                <div key={s} style={{
                  width: 28, height: 5, borderRadius: 3,
                  background: step >= s ? "var(--green-light)" : "rgba(82,183,136,0.2)"
                }} />
              ))}
            </div>
          </div>

          {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

          {/* Guided Assistant Panel (Farmers Only) */}
          {form.role === "farmer" && (
            <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "var(--green-mid)", color: "white", padding: "10px", borderRadius: "50%", display: "flex", flexShrink: 0 }}>
                <Sparkles size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: "var(--green-deep)", fontSize: "0.95rem" }}>Guided Assistant</h4>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {assistantRunning
                    ? assistantMsg || "Running..."
                    : assistantMsg || "Tap the mic to fill Name, Phone, Farm Location, Size & Experience by voice."}
                </p>
                {assistantRunning && (
                  <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    {["name", "phone", "farmLocation", "farmSize", "experience"].map((step) => (
                      <span key={step} style={{
                        fontSize: "0.65rem", padding: "2px 8px", borderRadius: "20px",
                        background: assistantStep === step ? "var(--green-mid)" : assistantStep === "done" || ["name","phone","farmLocation","farmSize","experience"].indexOf(assistantStep) > ["name","phone","farmLocation","farmSize","experience"].indexOf(step) ? "rgba(34,197,94,0.3)" : "rgba(0,0,0,0.1)",
                        color: assistantStep === step ? "white" : "var(--text-muted)",
                        fontWeight: assistantStep === step ? 700 : 400,
                        transition: "all 0.3s"
                      }}>{step === "farmLocation" ? "Farm Loc" : step === "farmSize" ? "Size" : step.charAt(0).toUpperCase() + step.slice(1)}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAssistantListening}
                disabled={assistantRunning || listening}
                style={{
                  background: assistantRunning ? "#fef3c7" : "white",
                  color: assistantRunning ? "#d97706" : "var(--green-mid)",
                  border: "1px solid var(--green-mid)", width: "45px", height: "45px", borderRadius: "50%",
                  cursor: assistantRunning ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                }}
              >
                {assistantRunning ? <Loader2 size={20} className="lucide-spin" style={{ animation: "spin 2s linear infinite" }} /> : <Mic size={20} />}
              </button>
            </div>
          )}

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <h3 className="section-title" style={{ margin: 0 }}>👤 Basic Information</h3>
                <button type="button" className="btn-icon" onClick={() => readAloud("Basic Information", "Fill out your name, email, phone, and role.")} title="Read Aloud" style={{ padding: 4 }}>🔊</button>
              </div>

              <AutoSuggestInput value={form.name} onChange={set("name")} onSpeak={() => speak("name")} listening={listening && activeField === "name"} interim={interim} label={t("name")} placeholder="e.g. Ravi Kumar" fieldType="name" />
              
              <div className="form-group">
                <label className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{t("email")}</span>
                  <button type="button" className="btn-icon" onClick={() => readAloud("Email", form.email)} style={{ padding: 0 }}>🔊</button>
                </label>
                <div className="input-wrapper">
                  <input
                    className="rs-input"
                    type="email"
                    placeholder="you@example.com"
                    value={listening && activeField === "email" && interim ? `${form.email} ${interim}...` : form.email}
                    onChange={set("email")}
                    style={listening && activeField === "email" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}}
                  />
                  <button type="button" className={`mic-btn ${listening && activeField === "email" ? "active" : ""}`} onClick={() => speak("email")}>🎤</button>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{t("phone")}</span>
                  <button type="button" className="btn-icon" onClick={() => readAloud("Phone", form.phone)} style={{ padding: 0 }}>🔊</button>
                </label>
                <div className="input-wrapper" style={{ display: "flex" }}>
                  <select className="rs-select" style={{ width: "80px", borderRight: "none", borderTopRightRadius: 0, borderBottomRightRadius: 0 }} value={form.countryCode} onChange={set("countryCode")}>
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    className="rs-input"
                    type="tel"
                    maxLength="10"
                    placeholder="9876543210"
                    value={listening && activeField === "phone" && interim ? `${form.phone} ${interim}...` : form.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 10) setForm(f => ({ ...f, phone: val }));
                    }}
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, ...(listening && activeField === "phone" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}) }}
                  />
                  <button type="button" className={`mic-btn ${listening && activeField === "phone" ? "active" : ""}`} onClick={() => speak("phone")}>🎤</button>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label">{t("password")}</label>
                <div className="input-wrapper">
                  <input className="rs-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
                </div>
              </div>
              
              <div className="form-group">
                <label className="field-label">Confirm Password</label>
                <div className="input-wrapper">
                  <input className="rs-input" type="password" placeholder="Repeat password" value={form.confirmPass} onChange={set("confirmPass")} />
                </div>
              </div>

              {/* Role selector — 4 roles */}
              <div className="form-group">
                <label className="field-label">{t("role")}</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.6rem" }}>
                  {[
                    { v: "farmer", icon: "🌾", l: t("farmer") },
                    { v: "customer", icon: "🛒", l: t("customer") },
                    { v: "agent", icon: "🚚", l: "Delivery" },
                    { v: "admin", icon: "🛡️", l: "Admin" }
                  ].map((r) => (
                    <button
                      key={r.v}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r.v }))}
                      style={{
                        padding: "0.75rem 0.3rem",
                        borderRadius: "var(--radius-md)",
                        border: form.role === r.v ? "2px solid var(--green-mid)" : "1.5px solid #cbd5e1",
                        background: form.role === r.v ? "rgba(22, 163, 74, 0.1)" : "white",
                        color: form.role === r.v ? "var(--green-deep)" : "var(--text-mid)",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ fontSize: "1.4rem" }}>{r.icon}</div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 600, marginTop: "0.25rem" }}>{r.l}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Type Fields */}
              {form.role === "customer" && (
                <div className="glass-card" style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)" }}>
                  <div className="form-group mb-2">
                    <label className="field-label">Are you registering as a Single Person or a Business?</label>
                    <select className="rs-select" value={form.customerType} onChange={set("customerType")}>
                      <option value="individual">Single Person / Individual</option>
                      <option value="business">Hotel / Restaurant / Business</option>
                    </select>
                  </div>
                  {form.customerType === "business" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input 
                        type="checkbox" 
                        id="daily-delivery" 
                        checked={form.requiresDailyDelivery} 
                        onChange={(e) => setForm(f => ({ ...f, requiresDailyDelivery: e.target.checked }))} 
                        style={{ width: 18, height: 18, cursor: "pointer" }} 
                      />
                      <label htmlFor="daily-delivery" style={{ fontSize: "0.9rem", color: "var(--text-dark)", cursor: "pointer" }}>
                        We require Daily Fresh Delivery
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Agent Type Fields */}
              {form.role === "agent" && (
                <div className="glass-card" style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)" }}>
                  <div className="form-group mb-2">
                    <label className="field-label">Select Agent Type / Vehicle</label>
                    <select className="rs-select" value={form.agentType} onChange={set("agentType")}>
                      <option value="bike">🛵 Two Wheeler / Bike (Light Orders)</option>
                      <option value="auto">🛺 Auto / 3-Wheeler (Medium Orders)</option>
                      <option value="truck">🚛 Mini Truck / LCV (Heavy & Intercity Orders)</option>
                      <option value="vermicompost">🪱 Vermicompost Collection Agent</option>
                      <option value="biogas">⚡ Bio-Gas Collection Agent</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Admin secret code */}
              {form.role === "admin" && (
                <div className="form-group">
                  <label className="field-label">🔐 Admin Access Code</label>
                  <div className="input-wrapper">
                    <input className="rs-input" type="password" placeholder="Enter admin secret code" value={form.adminSecret} onChange={set("adminSecret")} />
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                    Contact the platform administrator for the access code.
                  </p>
                </div>
              )}

              {/* Language */}
              <div className="form-group">
                <label className="field-label">{t("languagePref")}</label>
                <select className="rs-select" value={form.language} onChange={set("language")}>
                  {LANGUAGES.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
                </select>
              </div>

              <button className="btn-primary" onClick={handleNextStep1}>Next →</button>
            </>
          )}

          {/* ── STEP 2: Location & Identity ── */}
          {step === 2 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <h3 className="section-title" style={{ margin: 0 }}>📍 Location & Identity</h3>
                <button type="button" className="btn-icon" onClick={() => readAloud("Location and Identity", "Provide your address details.")} title="Read Aloud" style={{ padding: 4 }}>🔊</button>
              </div>

              <div className="form-group">
                <label className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{form.role === "farmer" ? "Personal Address" : form.role === "agent" ? "Agent's Address" : t("location")}</span>
                  <button type="button" className="btn-icon" onClick={() => readAloud(form.role === "farmer" ? "Personal Address" : "Location", form.location)} style={{ padding: 0 }}>🔊</button>
                </label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <div className="input-wrapper" style={{ flex: 1, display: "flex", gap: "0.5rem" }}>
                    <input
                      className="rs-input"
                      placeholder="Type or speak Village / Town / City..."
                      value={listening && activeField === "location" && interim ? `${form.location} ${interim}...` : form.location}
                      onChange={set("location")}
                      style={listening && activeField === "location" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}}
                    />
                    <VoiceMicButton
                      fieldId="location"
                      onResult={(t) => setForm((f) => ({ ...f, location: f.location ? f.location + " " + t : t }))}
                      startListening={startListening}
                      stopListening={stopListening}
                      listening={listening}
                      activeField={activeField}
                    />
                  </div>
                  <LocationButton
                    compact
                    onLocation={({ address, lat, lng }) => {
                      const parts = address.split(", ");
                      const possibleState = parts.length > 2 ? parts[parts.length - 2] : "";
                      const possibleCity = parts.length > 2 ? parts[parts.length - 3] : "";
                      setForm((f) => ({ ...f, location: address, latitude: lat, longitude: lng, city: possibleCity || f.city, state: possibleState || f.state }));
                    }}
                  />
                  <button type="button" className="btn-icon" title="Pick on Map" onClick={() => setShowMap(!showMap)} style={{ background: showMap ? "var(--green-pale)" : "transparent" }}>
                    <MapPin size={20} color={showMap ? "var(--green-deep)" : "var(--text-muted)"} />
                  </button>
                </div>
                {showMap && (
                  <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                    <LocationPickerMap 
                      onSelect={({ lat, lng, address }) => {
                        setForm(f => ({ ...f, location: address, latitude: lat, longitude: lng }));
                        setShowMap(false);
                      }} 
                    />
                  </div>
                )}
                {form.latitude && !showMap && (
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    ✅ {form.location.substring(0, 60)}...
                  </p>
                )}
              </div>

              <AutoSuggestInput value={form.address} onChange={set("address")} onSpeak={() => speak("address")} listening={listening && activeField === "address"} interim={interim} label={t("address")} placeholder="Full address" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <AutoSuggestInput value={form.pincode} onChange={set("pincode")} onSpeak={() => speak("pincode")} listening={listening && activeField === "pincode"} interim={interim} label="Pincode" placeholder="500001" />
                <AutoSuggestInput value={form.city} onChange={set("city")} onSpeak={() => speak("city")} listening={listening && activeField === "city"} interim={interim} label="City" placeholder="City" fieldType="city" />
              </div>

              <AutoSuggestInput value={form.state} onChange={set("state")} onSpeak={() => speak("state")} listening={listening && activeField === "state"} interim={interim} label="State" placeholder="State" fieldType="state" />

              {(form.role === "agent" || form.role === "farmer") && (
                <AutoSuggestInput value={form.aadhaar} onChange={set("aadhaar")} onSpeak={() => speak("aadhaar")} listening={listening && activeField === "aadhaar"} interim={interim} label={`${t("aadhaar")} (Required for Verification)`} placeholder="XXXX-XXXX-XXXX" />
              )}

              {form.role === "agent" && (
                <div className="form-group mb-2">
                  <label className="field-label">Agent Specialty & Service Type</label>
                  <select className="rs-select" value={form.agentType} onChange={set("agentType")}>
                    <option value="bike">🛵 Two-Wheeler Bike Agent (Local Express Delivery)</option>
                    <option value="auto">🛺 Auto / Mini-Van Agent (Mid-Volume Logistics)</option>
                    <option value="truck">🚚 Heavy Truck Transport Agent (Long Distance & Bulk Load)</option>
                    <option value="ridealong">🎒 Ride-Along Commuter Agent (Route Share Delivery)</option>
                    <option value="cold_storage">❄️ Cold Storage Warehouse Agent (Temperature Controlled Vault & Storage)</option>
                  </select>
                </div>
              )}

              {form.role !== "farmer" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <input type="checkbox" id="terms" checked={form.acceptedTerms} onChange={(e) => setForm(f => ({ ...f, acceptedTerms: e.target.checked }))} style={{ width:18, height:18, cursor:"pointer" }} />
                  <label htmlFor="terms" style={{ fontSize: "0.85rem", color: "var(--text-muted)", cursor:"pointer" }}>I agree to the Platform Rules, Conditions, and Security Policies.</label>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                {(form.role !== "farmer" && form.role !== "agent")
                  ? <button className="btn-primary" onClick={handleRegister} disabled={loading}>
                      {loading ? t("loading") : `✅ ${t("register")}`}
                    </button>
                  : <button className="btn-primary" onClick={handleNextStep2}>Next →</button>
                }
              </div>
            </>
          )}

          {/* ── STEP 3: Farmer Details ── */}
          {step === 3 && form.role === "farmer" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <h3 className="section-title" style={{ margin: 0 }}>🌾 Farm Details</h3>
                <button type="button" className="btn-icon" onClick={() => readAloud("Farm Details", "Enter your farm location, size, and experience.")} title="Read Aloud" style={{ padding: 4 }}>🔊</button>
              </div>

              <AutoSuggestInput value={form.farmName} onChange={set("farmName")} onSpeak={() => speak("farmName")} listening={listening && activeField === "farmName"} interim={interim} label={t("farmName")} placeholder="e.g. Sri Rama Farms" />
              
              <div className="form-group">
                <label className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Farm Location</span>
                  <button type="button" className="btn-icon" onClick={() => readAloud("Farm Location", form.farmLocation)} style={{ padding: 0 }}>🔊</button>
                </label>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <div className="input-wrapper" style={{ flex: 1 }}>
                    <input
                      className="rs-input"
                      placeholder="Village / District"
                      value={listening && activeField === "farmLocation" && interim ? `${form.farmLocation} ${interim}...` : form.farmLocation}
                      onChange={set("farmLocation")}
                      disabled={sameAsPersonal}
                      style={listening && activeField === "farmLocation" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : (sameAsPersonal ? { background: "#f1f5f9", color: "#64748b" } : {})}
                    />
                    {!sameAsPersonal && <button type="button" className={`mic-btn ${listening && activeField === "farmLocation" ? "active" : ""}`} onClick={() => speak("farmLocation")}>🎤</button>}
                  </div>
                  {!sameAsPersonal && (
                    <>
                      <LocationButton compact onLocation={({ address }) => setForm(f => ({ ...f, farmLocation: address }))} />
                      <button type="button" className="btn-icon" onClick={() => setShowFarmMap(!showFarmMap)} style={{ background: showFarmMap ? "var(--green-pale)" : "transparent" }}>
                        <MapPin size={20} color={showFarmMap ? "var(--green-deep)" : "var(--text-muted)"} />
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input 
                    type="checkbox" 
                    id="sameAsPersonal" 
                    checked={sameAsPersonal} 
                    onChange={(e) => {
                      setSameAsPersonal(e.target.checked);
                      if (e.target.checked) setForm(f => ({ ...f, farmLocation: f.location }));
                    }} 
                    style={{ width: 16, height: 16, cursor: "pointer" }} 
                  />
                  <label htmlFor="sameAsPersonal" style={{ fontSize: "0.85rem", color: "var(--text-muted)", cursor: "pointer" }}>Same as Personal Address</label>
                </div>
                {showFarmMap && !sameAsPersonal && (
                  <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                    <LocationPickerMap 
                      onSelect={({ address }) => {
                        setForm(f => ({ ...f, farmLocation: address }));
                        setShowFarmMap(false);
                      }} 
                    />
                  </div>
                )}
                
                <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(22,163,74,0.3)" }}>
                  <label className="field-label" style={{ color: "var(--green-mid)" }}>✅ Verification: How did you provide your location?</label>
                  <select className="rs-select" value={form.locationMethod} onChange={set("locationMethod")}>
                    <option value="gps">Current GPS Location</option>
                    <option value="pin">Pin-based (Map Dropper)</option>
                    <option value="mic">Mic Audio (Voice Clarification)</option>
                  </select>
                  
                  {form.locationMethod === "mic" && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <label className="field-label">Upload Voice Clarification (Audio File)</label>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={(e) => setForm(f => ({ ...f, locationAudio: e.target.files[0] }))}
                        className="rs-input"
                        style={{ padding: "0.4rem" }}
                      />
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        Please upload an audio recording describing your exact farm location and nearby landmarks. Admin will verify this.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="field-label">{t("farmSize")} (acres)</label>
                  <div className="input-wrapper" style={{ display: "flex" }}>
                    <input
                      className="rs-input"
                      type="number"
                      placeholder="e.g. 5"
                      value={listening && activeField === "farmSize" && interim ? `${form.farmSize} ${interim}...` : form.farmSize}
                      onChange={set("farmSize")}
                      style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, ...(listening && activeField === "farmSize" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}) }}
                    />
                    <select className="rs-select" style={{ width: "60px", padding: "0 5px", borderLeft: "none", borderRadius: 0 }} onChange={(e) => { if(e.target.value) setForm(f => ({ ...f, farmSize: e.target.value })); e.target.value = ""; }}>
                      <option value="">--</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="5">5</option>
                      <option value="10">10</option>
                    </select>
                    <button type="button" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} className={`mic-btn ${listening && activeField === "farmSize" ? "active" : ""}`} onClick={() => speak("farmSize")}>🎤</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="field-label">{t("experience")} (years)</label>
                  <div className="input-wrapper" style={{ display: "flex" }}>
                    <input
                      className="rs-input"
                      type="number"
                      placeholder="Years"
                      value={listening && activeField === "experience" && interim ? `${form.experience} ${interim}...` : form.experience}
                      onChange={set("experience")}
                      style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, ...(listening && activeField === "experience" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}) }}
                    />
                    <select className="rs-select" style={{ width: "60px", padding: "0 5px", borderLeft: "none", borderRadius: 0 }} onChange={(e) => { if(e.target.value) setForm(f => ({ ...f, experience: e.target.value })); e.target.value = ""; }}>
                      <option value="">--</option>
                      <option value="1">1</option>
                      <option value="3">3</option>
                      <option value="5">5</option>
                      <option value="10">10</option>
                    </select>
                    <button type="button" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} className={`mic-btn ${listening && activeField === "experience" ? "active" : ""}`} onClick={() => speak("experience")}>🎤</button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label">{t("soilType")}</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <select className="rs-select" style={{ flex: 1 }} value={form.soilType} onChange={set("soilType")}>
                    {SOIL_TYPES.map(s => <option key={s} value={s}>{t(s) || (s.charAt(0).toUpperCase() + s.slice(1))}</option>)}
                  </select>
                  <button type="button" className="btn-secondary" style={{ padding: "0 0.75rem", fontSize: "0.8rem", whiteSpace: "nowrap" }} onClick={handleAIGuessSoil} disabled={aiGuesserActive}>
                    {aiGuesserActive ? "🤖 Scanning..." : "🤖 AI Guess (Upload Photo)"}
                  </button>
                </div>
                
                <div style={{ background: "rgba(59, 130, 246, 0.05)", padding: "0.75rem", borderRadius: "8px", border: "1px dashed rgba(59, 130, 246, 0.3)", marginTop: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <input 
                      type="checkbox" 
                      id="soilTestRequested" 
                      checked={form.soilTestRequested} 
                      onChange={(e) => setForm(f => ({ ...f, soilTestRequested: e.target.checked }))} 
                      style={{ width: 16, height: 16, marginTop: "2px", cursor: "pointer" }} 
                    />
                    <label htmlFor="soilTestRequested" style={{ fontSize: "0.85rem", color: "var(--text-dark)", cursor: "pointer" }}>
                      <strong>Request Physical Soil Test</strong>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.2rem" }}>Can't decide? Request our admin to send a soil test team to your farm! <span style={{ color: "var(--green-mid)", fontWeight: 600 }}>First-time farmers get a 69% discount! 🎉</span></p>
                    </label>
                  </div>
                </div>
              </div>

              {/* ── Verification Photo Uploads ── */}
              <h3 className="section-title" style={{ marginTop: "1.5rem" }}>📸 Verification Photos</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Upload these photos so the admin can verify your identity and farm. This is required for approval.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                {[
                  { key: "farmerPhoto", label: "Your Photo (Selfie)", icon: "🧑‍🌾" },
                  { key: "farmPhoto", label: "Farm Photo", icon: "🌾" },
                  { key: "productPhoto", label: "Product Sample", icon: "🥬" }
                ].map((item) => (
                  <div key={item.key} style={{ textAlign: "center" }}>
                    <label
                      htmlFor={`upload-${item.key}`}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        width: "100%", aspectRatio: "1", borderRadius: "var(--radius-md)",
                        border: form[item.key] ? "2px solid var(--green-light)" : "2px dashed rgba(19,136,8,0.3)",
                        background: form[item.key] ? "rgba(19,136,8,0.05)" : "rgba(255,255,255,0.5)",
                        cursor: "pointer", transition: "all 0.3s", overflow: "hidden", position: "relative"
                      }}
                    >
                      {form[`${item.key}Preview`] ? (
                        <img src={form[`${item.key}Preview`]} alt={item.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <>
                          <span style={{ fontSize: "2rem" }}>{item.icon}</span>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.3rem", padding: "0 0.3rem" }}>{item.label}</span>
                        </>
                      )}
                    </label>
                    <input
                      id={`upload-${item.key}`}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setForm((f) => ({
                            ...f,
                            [item.key]: file,
                            [`${item.key}Preview`]: URL.createObjectURL(file)
                          }));
                        }
                      }}
                    />
                    {form[item.key] && <span style={{ fontSize: "0.65rem", color: "var(--green-mid)", fontWeight: 600, marginTop: "0.3rem", display: "block" }}>✅ Uploaded</span>}
                  </div>
                ))}
              </div>

              {/* Verification notice */}
              <div className="alert alert-info" style={{ marginTop: "1rem" }}>
                ℹ️ Your account will be reviewed by our admin team using the photos you uploaded. This ensures trust and quality on the platform.
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", marginBottom: "0.5rem" }}>
                <input type="checkbox" id="terms-farmer" checked={form.acceptedTerms} onChange={(e) => setForm(f => ({ ...f, acceptedTerms: e.target.checked }))} style={{ width:18, height:18, cursor:"pointer" }} />
                <label htmlFor="terms-farmer" style={{ fontSize: "0.85rem", color: "var(--text-muted)", cursor:"pointer" }}>I agree to the Farmer Rules, Conditions, and Quality Guidelines.</label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary" onClick={handleRegister} disabled={loading}>
                  {loading ? t("loading") : `🌾 ${t("register")}`}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Agent Details ── */}
          {step === 3 && form.role === "agent" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <h3 className="section-title" style={{ margin: 0 }}>🚚 Agent Verification</h3>
                <button type="button" className="btn-icon" onClick={() => readAloud("Agent Verification", "Upload your verification documents.")} title="Read Aloud" style={{ padding: 4 }}>🔊</button>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Please upload the following documents. These will be reviewed by our Admin team before you can start delivering orders.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {[
                  { key: "avatar", label: "Your Photo (Selfie)", icon: "📸" },
                  { key: "aadhaarPhoto", label: "Aadhaar Card (Front)", icon: "🪪" }
                ].map((item) => (
                  <div key={item.key} style={{ textAlign: "center" }}>
                    <label
                      htmlFor={`upload-${item.key}`}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        width: "100%", aspectRatio: "1.2", borderRadius: "var(--radius-md)",
                        border: form[item.key] ? "2px solid var(--blue-light)" : "2px dashed rgba(59, 130, 246, 0.3)",
                        background: form[item.key] ? "rgba(59, 130, 246, 0.05)" : "rgba(255,255,255,0.5)",
                        cursor: "pointer", transition: "all 0.3s", overflow: "hidden", position: "relative"
                      }}
                    >
                      {form[`${item.key}Preview`] ? (
                        <img src={form[`${item.key}Preview`]} alt={item.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <>
                          <span style={{ fontSize: "2rem" }}>{item.icon}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", padding: "0 0.5rem" }}>{item.label}</span>
                        </>
                      )}
                    </label>
                    <input
                      id={`upload-${item.key}`}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setForm((f) => ({
                            ...f,
                            [item.key]: file,
                            [`${item.key}Preview`]: URL.createObjectURL(file)
                          }));
                        }
                      }}
                    />
                    {form[item.key] && <span style={{ fontSize: "0.75rem", color: "var(--blue-light)", fontWeight: 600, marginTop: "0.4rem", display: "block" }}>✅ Uploaded</span>}
                  </div>
                ))}
              </div>

              <div className="alert alert-info" style={{ marginTop: "1.5rem" }}>
                ℹ️ After registration, your account will be in "Pending" status until an Admin reviews and approves your documents.
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", marginBottom: "0.5rem" }}>
                <input type="checkbox" id="terms-agent" checked={form.acceptedTerms} onChange={(e) => setForm(f => ({ ...f, acceptedTerms: e.target.checked }))} style={{ width:18, height:18, cursor:"pointer" }} />
                <label htmlFor="terms-agent" style={{ fontSize: "0.85rem", color: "var(--text-muted)", cursor:"pointer" }}>I agree to the Agent Rules, Delivery Conditions, and Security Policies.</label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary" onClick={handleRegister} disabled={loading}>
                  {loading ? t("loading") : `🚚 ${t("register")}`}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-3" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--yellow-wheat)", fontWeight: 600, textDecoration: "none" }}>
            {t("login")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
