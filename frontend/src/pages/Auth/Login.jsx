import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { useVoiceInput } from "../../utils/useVoiceInput";
import { playTTS } from "../../utils/voiceParser";

export default function Login() {
  const { login } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);
  const { listening, activeField, interim, startListening, stopListening } = useVoiceInput(lang);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [guidedStep, setGuidedStep] = useState(null); // null | 'email' | 'password' | 'done'
  const [guidedRunning, setGuidedRunning] = useState(false);
  const DEFAULT_PROFILES = [
    { name: "Ram Sharma", email: "ram@test.com", role: "farmer", password: "password123" },
    { name: "Srinivas Reddy", email: "farmer@test.com", role: "farmer", password: "password123" },
    { name: "Anand Verma", email: "customer@test.com", role: "customer", password: "password123" },
    { name: "Raju Delivery", email: "agent@test.com", role: "agent", password: "password123" },
    { name: "Admin Raj", email: "admin@test.com", role: "admin", password: "password123" }
  ];

  const [savedAccounts, setSavedAccounts] = useState(() => {
    try {
      const raw = localStorage.getItem("rs_saved_accounts");
      const list = raw ? JSON.parse(raw) : [];
      if (!list || list.length === 0) return DEFAULT_PROFILES;
      // Auto-sanitize existing profiles so legacy records never fail
      return list.map(acc => {
        let email = acc.email;
        if (!email || email === "undefined" || email.includes("gmail.com")) {
          const lowerName = (acc.name || "").toLowerCase();
          email = lowerName.includes("ram") ? "ram@test.com" : lowerName.includes("raj") ? "admin@test.com" : "farmer@test.com";
        }
        let role = acc.role || "customer";
        if (email.includes("admin") || acc.name?.toLowerCase().includes("raj")) role = "admin";
        return {
          name: acc.name || (email.includes("farmer") || email.includes("ram") ? "Farmer" : email.includes("admin") ? "Admin" : "User"),
          email: email.trim(),
          role: role,
          password: acc.password || "password123",
          avatar: acc.avatar || ""
        };
      });
    } catch {
      return DEFAULT_PROFILES;
    }
  });

  const saveAccountToLocal = (user, password) => {
    if (!user || !user.email) return;
    const accs = savedAccounts.filter(a => a.email.toLowerCase() !== user.email.toLowerCase());
    accs.unshift({ 
      email: user.email, 
      password: password || "test123", 
      name: user.name || "User", 
      role: user.role || "customer", 
      avatar: user.avatar || user.profilePic || "" 
    });
    const limited = accs.slice(0, 4); // Keep last 4
    setSavedAccounts(limited);
    localStorage.setItem("rs_saved_accounts", JSON.stringify(limited));
  };

  const removeAccount = (email, e) => {
    e.stopPropagation();
    const accs = savedAccounts.filter(a => a.email.toLowerCase() !== email.toLowerCase());
    setSavedAccounts(accs);
    localStorage.setItem("rs_saved_accounts", JSON.stringify(accs));
  };

  const resetSavedProfiles = (e) => {
    e.preventDefault();
    setSavedAccounts(DEFAULT_PROFILES);
    localStorage.setItem("rs_saved_accounts", JSON.stringify(DEFAULT_PROFILES));
    setInfoMsg("Saved profiles reset to verified demo accounts.");
  };

  const performLogin = async (email, password) => {
    setError("");
    setInfoMsg("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { 
        email: (email || "").trim(), 
        password: password || "test123"
      });
      saveAccountToLocal(res.data.user, password);
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === "farmer") navigate("/farmer");
      else if (role === "agent") navigate("/agent");
      else if (role === "admin") navigate("/admin");
      else navigate("/marketplace");
    } catch (err) {
      const errMsg = err.response?.data?.error || "Login failed. Please check credentials and try again.";
      setError(errMsg);
      // Auto pre-fill the email so the user can easily re-enter password
      setForm(f => ({ ...f, email: email || f.email }));
      if (passwordInputRef.current) passwordInputRef.current.focus();
    } finally {
      setLoading(false);
    }
  };

  const fastLogin = async (acc) => {
    setError("");
    setInfoMsg("");
    const targetEmail = (acc.email || acc.username || acc.name || "ram@gmail.com").trim();
    const passToTry = acc.password || "test123";
    await performLogin(targetEmail, passToTry);
  };

  const quickDemoLogin = (roleEmail, defaultPass = "test123") => {
    setForm({ email: roleEmail, password: defaultPass });
    performLogin(roleEmail, defaultPass);
  };

  const readAloud = (label, value) => {
    const text = value ? `${label}. ${t("currentValueIs") || "is currently set to"} ${value}` : `${t("pleaseEnter")} ${label}`;
    playTTS(text, lang);
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleVoice = (field) => {
    if (listening && activeField === field) {
      if (typeof stopListening === "function") stopListening();
      return;
    }
    startListening((val) => {
      if (typeof val === "function") {
        setForm((f) => {
          let newVal = val(f[field]);
          newVal = newVal.replace(/\s+/g, '').toLowerCase().replace(/at/g, '@').replace(/dot/g, '.');
          return { ...f, [field]: newVal };
        });
      } else {
        let newVal = val;
        newVal = newVal.replace(/\s+/g, '').toLowerCase().replace(/at/g, '@').replace(/dot/g, '.');
        setForm((f) => ({ ...f, [field]: newVal }));
      }
    }, { fieldId: field, lang: "en" });
  };

  // A one-shot voice listener that resolves a Promise when speech is detected
  const listenOnce = (field) =>
    new Promise((resolve) => {
      startListening(
        (val) => {
          let result = typeof val === "function" ? val("") : val;
          if (field === "email") {
            result = result.replace(/\s+/g, "").toLowerCase().replace(/at/gi, "@").replace(/dot/gi, ".");
          }
          setForm((f) => ({ ...f, [field]: result }));
          resolve(result);
        },
        { fieldId: field, lang: field === "email" ? "en" : lang }
      );
    });

  const startGuidedAssistant = async () => {
    if (guidedRunning) return;
    setGuidedRunning(true);
    try {
      setGuidedStep("email");
      await playTTS(t("guidedStart") || "Please say your email address now.", lang);
      await listenOnce("email");

      setGuidedStep("password");
      await playTTS(t("guidedPass") || "Now please say your password.", lang);
      await listenOnce("password");

      setGuidedStep("done");
      await playTTS(t("guidedDone") || "All set! You can now tap login.", lang);
    } finally {
      setGuidedStep(null);
      setGuidedRunning(false);
    }
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { 
      setError("Please fill in both email and password."); 
      return; 
    }
    await performLogin(form.email, form.password);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        {/* Logo */}
        <div className="text-center mb-4">
          <span style={{ fontSize: "3.8rem", display: "block", animation: "floatUp 3s ease infinite" }}>🌾</span>
          <h1 className="page-title" style={{ fontSize: "2rem" }}>{t("appName") || "Rythu Sethu"}</h1>
          <p style={{ color: "var(--text-mid)", fontSize: "0.9rem", marginTop: "0.3rem" }}>{t("tagline") || "Empowering Farmers & Buyers Directly"}</p>
        </div>

        <div className="glass-card" style={{ padding: "2rem" }}>
          <h2 style={{ color: "var(--text-dark)", fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.2rem" }}>
            {t("login") || "Login"} 👋
          </h2>

          {error && <div className="alert alert-error mb-3" style={{ fontSize: "0.88rem" }}>⚠️ {error}</div>}
          {infoMsg && <div className="alert alert-info mb-3" style={{ fontSize: "0.88rem", background: "rgba(59,130,246,0.1)", border: "1px solid #93c5fd", color: "#1d4ed8", padding: "0.6rem 0.8rem", borderRadius: "8px" }}>ℹ️ {infoMsg}</div>}

          {/* Saved Profiles */}
          {savedAccounts.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Saved Profiles
                </span>
                <button 
                  type="button" 
                  onClick={resetSavedProfiles} 
                  style={{ background: "none", border: "none", color: "var(--green-deep)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
                  title="Reset saved profiles to verified demo accounts"
                >
                  🔄 Reset Defaults
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {savedAccounts.map((acc, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => fastLogin(acc)}
                    title={`Click to login as ${acc.name} (${acc.email})`}
                    style={{ 
                      minWidth: "105px", maxWidth: "120px", padding: "0.6rem 0.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", 
                      background: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", position: "relative",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--green-mid)"}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  >
                    <button 
                      onClick={(e) => removeAccount(acc.email, e)}
                      title="Remove profile"
                      style={{ position: "absolute", top: -5, right: -5, background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >×</button>
                    <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--green-pale)", color: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.35rem", backgroundImage: acc.avatar ? `url(${acc.avatar})` : "none", backgroundSize: "cover", backgroundPosition: "center" }}>
                      {!acc.avatar && (acc.name ? acc.name.charAt(0).toUpperCase() : "U")}
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-dark)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{acc.name || "User"}</span>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{acc.role}</span>
                  </div>
                ))}
              </div>
              <div className="section-divider mt-2 mb-3">
                <hr /><span>or login manually</span><hr />
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn-success"
            onClick={startGuidedAssistant}
            disabled={guidedRunning || loading}
            style={{ width: "100%", marginBottom: "1.2rem", opacity: guidedRunning ? 0.7 : 1 }}
          >
            {guidedRunning
              ? guidedStep === "email" ? "🎤 Listening for Email..."
              : guidedStep === "password" ? "🎤 Listening for Password..."
              : guidedStep === "done" ? "✅ All Done!"
              : "🎙️ Running..."
              : "🎙️ Start Guided Voice Assistant"}
          </button>

          {/* Email or Username */}
          <div className="form-group mb-3">
            <label className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("email") || "Email or Username"}</span>
              <button type="button" className="btn-icon" onClick={() => readAloud("Email or Username", form.email)} style={{ padding: 0 }}>🔊</button>
            </label>
            <div className="input-wrapper">
              <input
                className="rs-input"
                type="text"
                placeholder="ram / raj / farmer@test.com / email"
                value={listening && activeField === "email" && interim ? `${form.email} ${interim}...` : form.email}
                onChange={set("email")}
                autoComplete="username"
                style={listening && activeField === "email" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}}
              />
              <button
                type="button"
                className={`mic-btn ${listening && activeField === "email" ? "active" : ""}`}
                onClick={() => handleVoice("email")}
                title="Speak email or username"
              >🎤</button>
            </div>
          </div>

          {/* Password */}
          <div className="form-group mb-3">
            <label className="field-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{t("password") || "Password"}</span>
            </label>
            <div className="input-wrapper">
              <input
                ref={passwordInputRef}
                className="rs-input"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="mic-btn"
                onClick={() => setShowPass((s) => !s)}
                title="Toggle password"
              >{showPass ? "🙈" : "👁️"}</button>
            </div>
          </div>

          <button className="btn-primary mt-2" onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "0.85rem", fontSize: "1rem" }}>
            {loading ? <><span className="loader" style={{ width: 18, height: 18, borderWidth: 2, marginRight: 8 }}></span> {t("loading") || "Logging in..."}</> : `🚀 ${t("login") || "Login"}`}
          </button>

          <div className="section-divider mt-4 mb-3">
            <hr /><span>⚡ 1-Click Quick Demo Switcher</span><hr />
          </div>

          {/* Quick Demo Switchers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => quickDemoLogin("ram@test.com", "password123")}
              disabled={loading}
              style={{
                padding: "0.6rem 0.5rem", borderRadius: "10px", border: "1px solid #d1fae5",
                background: "#ecfdf5", color: "#065f46", fontSize: "0.82rem", fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              🌾 Ram (Farmer)
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin("admin@test.com", "password123")}
              disabled={loading}
              style={{
                padding: "0.6rem 0.5rem", borderRadius: "10px", border: "1px solid #fee2e2",
                background: "#fef2f2", color: "#991b1b", fontSize: "0.82rem", fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              👑 Admin Demo
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin("farmer@test.com", "password123")}
              disabled={loading}
              style={{
                padding: "0.6rem 0.5rem", borderRadius: "10px", border: "1px solid #d1fae5",
                background: "#f0fdf4", color: "#166534", fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              👨‍🌾 Srinivas Reddy
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin("customer@test.com", "password123")}
              disabled={loading}
              style={{
                padding: "0.6rem 0.5rem", borderRadius: "10px", border: "1px solid #e0e7ff",
                background: "#f5f3ff", color: "#5b21b6", fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              🛒 Anand Verma
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin("agent@test.com", "password123")}
              disabled={loading}
              style={{
                padding: "0.6rem 0.5rem", borderRadius: "10px", border: "1px solid #fef3c7",
                background: "#fffbeb", color: "#92400e", fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              🚚 Raju Delivery
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin("raj@test.com", "password123")}
              disabled={loading}
              style={{
                padding: "0.6rem 0.5rem", borderRadius: "10px", border: "1px solid #fee2e2",
                background: "#fef2f2", color: "#991b1b", fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem"
              }}
            >
              🛡️ Raj Admin
            </button>
          </div>

          <p className="text-center mt-4" style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: 0 }}>
            New to Rythu Sethu?{" "}
            <Link to="/register" style={{ color: "var(--green-deep)", fontWeight: 600, textDecoration: "none" }}>
              {t("register") || "Register"} →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}