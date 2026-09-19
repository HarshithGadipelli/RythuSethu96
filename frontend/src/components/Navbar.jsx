import { BASE_URL } from '../api/api';
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LangContext";
import { useLayout } from "../context/LayoutContext";
import { useCart } from "../context/CartContext";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ShoppingBag, Leaf, Truck, Shield, LogOut, User, Bell, Headphones, Volume2, VolumeX, ShoppingCart, MapPin, Smartphone, Tablet, Monitor, Laptop, Globe, Package, Check, Play } from "lucide-react";
import API from "../api/api";
import { io } from "socket.io-client";
import { createPortal } from "react-dom";
import { toggleNatureSound, toggleKrishnaFlute, getNatureSoundStatus, stopAllNatureAudio } from "../utils/ambientSoundEngine";

import CartSidebar from "./CartSidebar";
import LocationUpdateModal from "./LocationUpdateModal";
import TrustScoreModal from "./TrustScoreModal";
import APMCTicker from "./APMCTicker";
export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, changeLang, t } = useLang();
  const { layoutMode, setLayoutMode } = useLayout();
  const { getCartCount, setIsCartOpen } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, search: searchParams?.toString() || "" };
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isAnnouncerActive, setIsAnnouncerActive] = useState(false);
  const [birdsPlaying, setBirdsPlaying] = useState(false);
  
  const [fluteBgm, setFluteBgm] = useState(localStorage.getItem("rs_flute_bgm") === "true");
  const [natureAudioInfo, setNatureAudioInfo] = useState(() => getNatureSoundStatus());

  useEffect(() => {
    localStorage.setItem("rs_flute_bgm", fluteBgm);
  }, [fluteBgm]);

  useEffect(() => {
    const handleStateChange = (e) => {
      if (e.detail) {
        setNatureAudioInfo(e.detail);
      }
    };
    window.addEventListener("nature_audio_state_change", handleStateChange);
    return () => window.removeEventListener("nature_audio_state_change", handleStateChange);
  }, []);
  
  // Settings States
  const [showSettings, setShowSettings] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankAcc, setBankAcc] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [settingsTab, setSettingsTab] = useState("profile");
  const [notificationMode, setNotificationMode] = useState("both"); // "view", "hear", "both"
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const handleOpenSettings = (e) => {
      if (e?.detail?.tab) setSettingsTab(e.detail.tab);
      setShowSettings(true);
    };
    window.addEventListener("open_user_settings", handleOpenSettings);
    return () => window.removeEventListener("open_user_settings", handleOpenSettings);
  }, []);

  useEffect(() => {
    const handleClickOutsideSettings = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        if (!e.target.closest?.(".settings-popover-panel") && !e.target.closest?.(".settings-mobile-sheet")) {
          setShowSettings(false);
        }
      }
    };
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutsideSettings);
    }
    return () => document.removeEventListener("mousedown", handleClickOutsideSettings);
  }, [showSettings]);

  // Universal Location States
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [currentLocText, setCurrentLocText] = useState("");

  useEffect(() => {
    const updateLocFromUserOrStorage = () => {
      if (user?.location) {
        setCurrentLocText(user.location);
      } else {
        try {
          const guest = JSON.parse(localStorage.getItem("guest_location") || "{}");
          if (guest.location) setCurrentLocText(guest.location);
        } catch {}
      }
    };
    updateLocFromUserOrStorage();
    const handler = (e) => {
      if (e.detail?.location) setCurrentLocText(e.detail.location);
    };
    window.addEventListener("user_location_updated", handler);
    return () => window.removeEventListener("user_location_updated", handler);
  }, [user]);
  
  const notifRef = useRef(null);

  useEffect(() => {
    const savedActive = localStorage.getItem("rs_nature_bgm_active") === "true";
    if (savedActive) {
      toggleNatureSound(true);
    }
    toggleKrishnaFlute(fluteBgm);
  }, []);

  const handleNatureToggle = () => {
    if (natureAudioInfo.isPlaying) {
      stopAllNatureAudio();
      if (isAnnouncerActive) {
        setIsAnnouncerActive(false);
        window.dispatchEvent(new CustomEvent("market_announcer_toggle", { detail: { isActive: false } }));
      }
    } else {
      toggleNatureSound(true);
      if (!isAnnouncerActive) {
        setIsAnnouncerActive(true);
        window.dispatchEvent(new CustomEvent("market_announcer_toggle", { detail: { isActive: true } }));
      }
    }
  };

  const handleFluteToggle = () => {
    const next = !fluteBgm;
    setFluteBgm(next);
    toggleKrishnaFlute(next);
  };

  const handleAnnouncerToggle = () => {
    const nextState = !isAnnouncerActive;
    setIsAnnouncerActive(nextState);
    window.dispatchEvent(new CustomEvent("market_announcer_toggle", { detail: { isActive: nextState } }));
  };

  // Sync announcer icon with Marketplace audio state if it changes externally
  useEffect(() => {
    const syncHandler = (e) => {
      if (e.detail && e.detail.isActive !== undefined) {
        setIsAnnouncerActive(e.detail.isActive);
      }
    };
    window.addEventListener("market_audio_state", syncHandler);
    return () => window.removeEventListener("market_audio_state", syncHandler);
  }, []);


  useEffect(() => {
    if (showSettings && user) {
      const stored = localStorage.getItem("rs_notification_mode");
      if (stored) setNotificationMode(stored);

      API.get("/auth/profile").then(res => {
        setName(res.data.user?.name || "");
        setPhone(res.data.user?.phone || "");
        setUpiId(res.data.user?.upiId || "");
        setBankAcc(res.data.user?.bankAccountNumber || "");
        if (res.data.user?.notificationPreference) {
          setNotificationMode(res.data.user.notificationPreference);
          localStorage.setItem("rs_notification_mode", res.data.user.notificationPreference);
        }
      }).catch(console.error);
    }
  }, [showSettings, user]);

  const handleTestVoiceNotification = () => {
    if (typeof window === "undefined" || !('speechSynthesis' in window)) {
      alert("Voice speech is not supported in this environment.");
      return;
    }
    setIsSpeakingTest(true);
    window.speechSynthesis.cancel();

    try {
      const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    const text = "Rythu Jana Sethu Voice Alert: Your fresh organic farm harvest order has been assigned to your local bike partner for swift doorstep delivery!";
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const ind = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en_IN")) || voices[0];
    if (ind) utter.voice = ind;
    utter.onend = () => setIsSpeakingTest(false);
    utter.onerror = () => setIsSpeakingTest(false);
    window.speechSynthesis.speak(utter);
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      setSettingsMsg("");
      localStorage.setItem("rs_notification_mode", notificationMode);
      await API.put("/auth/profile", { 
        name, 
        phone, 
        upiId, 
        bankAccountNumber: bankAcc,
        notificationPreference: notificationMode 
      });
      setSettingsMsg("✅ Settings saved successfully!");
      setTimeout(() => setShowSettings(false), 1200);
    } catch (e) {
      setSettingsMsg("❌ Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const socket = io(BASE_URL);
      socket.on("notification", (data) => {
        if (data.userId === user._id) fetchNotifications();
      });
      return () => socket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get(`/notifications/${user._id}`);
      setNotifications(res.data);
    } catch (e) { console.error("Failed to fetch notifications"); }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {}
  };

  const clearAllNotifications = async () => {
    try {
      await API.delete(`/notifications/${user._id}/clear`);
      setNotifications([]);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const active = (path) => location.pathname === path ? "navbar-link active" : "navbar-link";

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="navbar-brand">
          <motion.img whileHover={{ scale: 1.05 }} src="/logo.png?v=2" alt="Rythu Jana Sethu Logo" style={{ height: "42px", width: "auto", borderRadius: "12px" }} />
          <div>
            <span className="navbar-title notranslate" translate="no">{t("appName")}</span>
            <span className="navbar-subtitle notranslate" translate="no">{t("tagline")}</span>
          </div>
        </Link>

        <ul className="navbar-links">
          <li><Link href="/" className={active("/")}><Home size={18} /> {t("home")}</Link></li>
          <li><Link href="/marketplace" className={active("/marketplace")}><ShoppingBag size={18} /> {t("marketplace")}</Link></li>
          {user?.role === "farmer" && (
            <li><Link href="/farmer" className={active("/farmer")}><Leaf size={18} /> {t("dashboard")}</Link></li>
          )}
          {user?.role === "agent" && (
            <li><Link href="/agent" className={active("/agent")}><Truck size={18} /> {t("deliveries")}</Link></li>
          )}
          {user?.role === "admin" && (
            <li><Link href="/admin" className={active("/admin")}><Shield size={18} /> {t("adminPanel")}</Link></li>
          )}
          {user && (
            <li><Link href="/support" className={active("/support")}><Headphones size={18} /> Support</Link></li>
          )}
          <li>
            <select className="lang-select" value={lang} onChange={(e) => changeLang(e.target.value)}>
              <option value="en">🇬🇧 EN</option>
              <option value="hi">🇮🇳 Hindi (हि)</option>
              <option value="te">🇮🇳 Telugu (తె)</option>
              <option value="ta">🇮🇳 Tamil (தமி)</option>
              <option value="kn">🇮🇳 Kannada (ಕನ್)</option>
              <option value="ml">🇮🇳 Malayalam (മല)</option>
            </select>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(22, 163, 74, 0.08)",
                border: "1.5px solid rgba(22, 163, 74, 0.3)",
                borderRadius: "100px",
                padding: "0.35rem 0.8rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#166534",
                cursor: "pointer",
                transition: "all 0.2s",
                maxWidth: "190px"
              }}
              title="Click to update your location & coordinates"
            >
              <MapPin size={15} color="#16a34a" style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentLocText ? (currentLocText.split(",")[0] || currentLocText) : (user ? (user.role === 'farmer' ? "Farm GPS" : "Set Location") : "Detect GPS")}
              </span>
            </button>
          </li>
          <li>
            <button 
              className={`icon-btn ${natureAudioInfo.isPlaying ? "nature-sound-active" : ""}`} 
              onClick={handleNatureToggle} 
              title={`Ambient Farm & Market Sounds (Click to ${natureAudioInfo.isPlaying ? "Mute" : "Play"})`}
              style={{ position: "relative" }}
            >
              <span style={{ fontSize: "1.1rem", filter: natureAudioInfo.isPlaying ? "none" : "grayscale(1) opacity(0.5)" }}>
                {natureAudioInfo.isPlaying ? natureAudioInfo.icon : "🔇"}
              </span>
              {natureAudioInfo.isPlaying && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px #22c55e",
                  animation: "pulse 1.5s infinite"
                }} />
              )}
            </button>
          </li>
          <li>
            <button className="icon-btn" onClick={handleFluteToggle} title="Krishna Flute">
              {fluteBgm ? <span style={{fontSize:"1.1rem"}}>🎵</span> : <span style={{fontSize:"1.1rem", filter:"grayscale(1) opacity(0.5)"}}>🎵</span>}
            </button>
          </li>
          <li>
            <button 
              className={`icon-btn ${isAnnouncerActive ? "market-audio-active" : ""}`} 
              onClick={handleAnnouncerToggle} 
              title={`Marketplace Voice Audio (${isAnnouncerActive ? "Voice Announcements On - Click to Mute" : "Voice Announcements Muted - Click to Play"})`}
              style={{ position: "relative" }}
            >
              <span style={{ fontSize: "1.1rem", filter: isAnnouncerActive ? "none" : "grayscale(1) opacity(0.5)" }}>
                📢
              </span>
              {isAnnouncerActive && (
                <span style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#f59e0b",
                  boxShadow: "0 0 8px #f59e0b",
                  animation: "pulse 1.5s infinite"
                }} />
              )}
            </button>
          </li>
          <li>
            <button 
              className="device-mode-badge" 
              onClick={() => {
                const modes = ["auto", "mobile", "tablet", "desktop"];
                const nextIdx = (modes.indexOf(layoutMode) + 1) % modes.length;
                setLayoutMode(modes[nextIdx]);
              }} 
              title={`Active Device View: ${layoutMode.toUpperCase()} (Click to cycle between Auto, Mobile, Tablet, Desktop)`}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.35rem",
                background: "rgba(22, 101, 52, 0.08)",
                border: "1.5px solid rgba(22, 101, 52, 0.25)",
                color: "var(--green-deep)",
                padding: "0.35rem 0.65rem",
                borderRadius: "100px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 700
              }}
            >
              {layoutMode === "mobile" ? <Smartphone size={14} /> : layoutMode === "tablet" ? <Tablet size={14} /> : layoutMode === "desktop" ? <Monitor size={14} /> : <Globe size={14} />}
              <span style={{ textTransform: "capitalize" }}>{layoutMode === "auto" ? "Responsive" : layoutMode}</span>
            </button>
          </li>
          {user ? (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => setShowTrustModal(true)}
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    border: "1.5px solid #86efac",
                    color: "#166534",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "100px",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.15)"
                  }}
                  title="Click to view full Trust Score breakdown & audit"
                >
                  <span>🛡️</span>
                  <span>Trust: {user.trustScore || 85}%</span>
                  {user.rewardPoints > 0 && <span>• 🪙 {user.rewardPoints} Pts</span>}
                </button>
              </li>
              {user.role === "agent" && user.experiencePoints > 0 && (
                <li>
                  <span className="rewards-badge" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>⭐ {user.experiencePoints} XP</span>
                </li>
              )}
              {user.role !== "agent" && user.rewardPoints > 0 && (
                <li>
                  <span className="rewards-badge" style={{ padding: "0.3rem 0.8rem", fontSize: "0.8rem" }}>🏆 {user.rewardPoints} Pts</span>
                </li>
              )}
              <li style={{ color: "var(--text-dark)", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ background: "var(--green-pale)", padding: "6px", borderRadius: "50%", color: "var(--green-deep)" }}><User size={16} /></div>
                {user.name ? user.name.split(" ")[0] : "User"}
              </li>
              <li ref={notifRef} style={{ position: "relative" }}>
                <button 
                  className="btn-icon" 
                  style={{ position: "relative", background: showNotifs ? "var(--green-pale)" : "transparent" }}
                  onClick={() => setShowNotifs(!showNotifs)}
                >
                  <Bell size={20} color="var(--text-dark)" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span style={{ position: "absolute", top: 0, right: 0, background: "#ef4444", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", border: "2px solid white" }}>
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="notif-dropdown"
                    >
                      <div className="notif-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h4 style={{ fontSize: "1rem", margin: 0 }}>{t("notifications")}</h4>
                          <span style={{ fontSize: "0.75rem", color: "var(--green-mid)" }}>{notifications.filter(n => !n.isRead).length} {t("unread")}</span>
                        </div>
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearAllNotifications}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
                          >
                            🧹 Clear All
                          </button>
                        )}
                      </div>
                      <div className="notif-body" style={{ background: "#efeae2", padding: "1rem" }}>
                        {notifications.length === 0 ? (
                          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem 0" }}>{t("noNotifications")}</p>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n._id} 
                              style={{
                                display: "flex",
                                justifyContent: "flex-start",
                                marginBottom: "0.75rem"
                              }}
                              onClick={() => { if (!n.isRead) markAsRead(n._id); }}
                            >
                              <div style={{
                                background: !n.isRead ? "#dcf8c6" : "white",
                                padding: "0.75rem 1rem",
                                borderRadius: "12px",
                                borderTopLeftRadius: "0",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                maxWidth: "90%",
                                position: "relative",
                                cursor: "pointer",
                                border: !n.isRead ? "1px solid #c7e8b5" : "1px solid #e2e8f0"
                              }}>
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                                  <span style={{ fontSize: "1rem" }}>{n.type === "order" ? "📦" : n.type === "delivery" ? "🚚" : n.type === "payment" ? "💰" : "🔔"}</span>
                                  <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-dark)" }}>{n.title}</span>
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-mid)", lineHeight: 1.4 }}>
                                  {n.message}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem" }}>
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {n.isRead && <span style={{ color: "#53bdeb", fontSize: "0.8rem" }}>✓✓</span>}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
              
              {/* Cart Button */}
              <li style={{ position: "relative" }}>
                <button 
                  className="btn-icon" 
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart size={20} color="var(--text-dark)" />
                  {getCartCount() > 0 && (
                    <span style={{ position: "absolute", top: 0, right: 0, background: "#eab308", color: "black", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", border: "2px solid white" }}>
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </li>

              {user.role === 'customer' && (
                <li>
                  <Link href="/my-orders" style={{ textDecoration: 'none' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--green-deep)", borderColor: "var(--green-pale)", background: "rgba(34,197,94,0.05)" }}>
                      <Package size={16} /> Orders & Boxes
                    </motion.button>
                  </Link>
                </li>
              )}
              <li ref={settingsRef} style={{ position: "relative" }}>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  className="btn-secondary" 
                  onClick={() => setShowSettings(prev => !prev)} 
                  style={{ 
                    padding: "0.5rem 1rem", fontSize: "0.85rem", 
                    display: "flex", alignItems: "center", gap: "0.4rem", 
                    color: showSettings ? "var(--green-deep)" : "var(--text-dark)", 
                    borderColor: showSettings ? "var(--green-mid)" : "#e2e8f0",
                    background: showSettings ? "rgba(34, 197, 94, 0.08)" : "transparent"
                  }}
                >
                  <User size={16} color={showSettings ? "var(--green-mid)" : "currentColor"} /> Profile & Settings
                </motion.button>

                {/* Desktop Anchored Popover - directly under the button */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="settings-popover-panel"
                    >
                      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", maxHeight: "82vh", overflowY: "auto" }}>
                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <User size={18} color="var(--green-mid)" />
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-dark)", fontWeight: 700 }}>Personal Settings</h4>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user?.email || user?.role}</span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setShowSettings(false)} 
                            style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
                            title="Close Settings"
                          >
                            ×
                          </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "3px", marginBottom: "1rem" }}>
                          {[
                            { id: "profile", label: "👤 Profile & Audio" },
                            { id: "app", label: "📱 Display" },
                            { id: "wallet", label: "💳 Wallet" }
                          ].map(tab => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSettingsTab(tab.id)}
                              style={{
                                flex: 1, padding: "0.45rem 0.3rem", background: settingsTab === tab.id ? "white" : "transparent",
                                border: "none", borderRadius: "8px", cursor: "pointer",
                                fontSize: "0.8rem", fontWeight: settingsTab === tab.id ? 700 : 500,
                                color: settingsTab === tab.id ? "var(--green-deep)" : "var(--text-muted)",
                                boxShadow: settingsTab === tab.id ? "0 2px 5px rgba(0,0,0,0.08)" : "none",
                                transition: "all 0.2s"
                              }}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab Contents */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {settingsTab === "profile" && (
                            <>
                              {/* Notification Mode Selection (Hear vs View) */}
                              <div style={{ background: "#f8fafc", padding: "0.9rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Volume2 size={16} color="var(--green-mid)" /> Notification Alert Mode
                                  </span>
                                  <span style={{ fontSize: "0.7rem", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                                    {notificationMode === "hear" ? "Voice Only" : notificationMode === "view" ? "Visual Only" : "Voice + Visual"}
                                  </span>
                                </div>
                                <p style={{ margin: "0 0 0.65rem 0", fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                                  Toggle to hear notifications read aloud on your phone (ideal while walking or working) or view screen alerts.
                                </p>

                                {/* 3 Option Selector */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", marginBottom: "0.65rem" }}>
                                  {[
                                    { id: "hear", label: "🔊 Hear on Phone", desc: "Voice speech" },
                                    { id: "view", label: "👁️ View on Screen", desc: "Visual popups" },
                                    { id: "both", label: "🔔 Both", desc: "Voice & screen" }
                                  ].map(opt => {
                                    const active = notificationMode === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          setNotificationMode(opt.id);
                                          localStorage.setItem("rs_notification_mode", opt.id);
                                        }}
                                        style={{
                                          padding: "0.55rem 0.25rem", borderRadius: "8px",
                                          border: active ? "2px solid var(--green-mid)" : "1px solid #cbd5e1",
                                          background: active ? "rgba(34,197,94,0.09)" : "white",
                                          cursor: "pointer", textAlign: "center",
                                          display: "flex", flexDirection: "column", gap: "2px", alignItems: "center"
                                        }}
                                      >
                                        <span style={{ fontSize: "0.78rem", fontWeight: active ? 700 : 500, color: active ? "var(--green-deep)" : "var(--text-dark)" }}>
                                          {opt.label}
                                        </span>
                                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                          {opt.desc}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Test Voice Readout */}
                                <button
                                  type="button"
                                  onClick={handleTestVoiceNotification}
                                  disabled={isSpeakingTest}
                                  style={{
                                    width: "100%", padding: "0.45rem", borderRadius: "8px",
                                    background: isSpeakingTest ? "#dcfce7" : "#f1f5f9",
                                    border: "1px dashed #86efac", color: isSpeakingTest ? "#166534" : "#334155",
                                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                                  }}
                                >
                                  <Volume2 size={14} color={isSpeakingTest ? "#16a34a" : "#64748b"} />
                                  {isSpeakingTest ? "Speaking alert aloud..." : "▶️ Test Voice Notification"}
                                </button>
                              </div>

                              {/* Profile Form Fields */}
                              <div>
                                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>Full Name</label>
                                <input 
                                  type="text" 
                                  value={name} 
                                  onChange={e => setName(e.target.value)} 
                                  placeholder="e.g. John Doe" 
                                  style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.88rem" }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>Mobile Number</label>
                                <input 
                                  type="text" 
                                  value={phone} 
                                  onChange={e => setPhone(e.target.value)} 
                                  placeholder="e.g. 9876543210" 
                                  style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.88rem" }}
                                />
                              </div>
                            </>
                          )}

                          {settingsTab === "app" && (
                            <>
                              <div style={{ background: "#f8fafc", padding: "0.9rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                  <h4 style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Smartphone size={16} color="var(--green-mid)" /> Device Compatibility View
                                  </h4>
                                  <span style={{ fontSize: "0.68rem", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "8px", fontWeight: 700 }}>
                                    {layoutMode.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.4rem" }}>
                                  {[
                                    { id: "auto", title: "Auto Responsive", icon: <Globe size={15} /> },
                                    { id: "mobile", title: "Mobile", icon: <Smartphone size={15} /> },
                                    { id: "tablet", title: "Tablet Grid", icon: <Tablet size={15} /> },
                                    { id: "desktop", title: "Desktop Wide", icon: <Monitor size={15} /> },
                                  ].map(device => {
                                    const isSelected = layoutMode === device.id;
                                    return (
                                      <button
                                        key={device.id}
                                        type="button"
                                        onClick={() => setLayoutMode(device.id)}
                                        style={{
                                          padding: "0.5rem", borderRadius: "8px",
                                          border: isSelected ? "2px solid var(--green-mid)" : "1px solid #cbd5e1",
                                          background: isSelected ? "rgba(34, 197, 94, 0.08)" : "white",
                                          cursor: "pointer", textAlign: "left",
                                          display: "flex", alignItems: "center", gap: "0.35rem",
                                          fontSize: "0.78rem", fontWeight: isSelected ? 700 : 500,
                                          color: isSelected ? "var(--green-deep)" : "var(--text-dark)"
                                        }}
                                      >
                                        {device.icon}
                                        <span>{device.title}</span>
                                        {isSelected && <span style={{ marginLeft: "auto", color: "var(--green-mid)", fontWeight: 800 }}>✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div style={{ background: "#f8fafc", padding: "0.9rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.88rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                  <Volume2 size={16} /> Global Audio Settings
                                </h4>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "0.8rem", color: "var(--text-mid)", fontWeight: 500 }}>Chime Tone</span>
                                  <select 
                                    className="rs-select" 
                                    style={{ padding: "0.3rem", fontSize: "0.78rem", width: "150px" }}
                                    value={localStorage.getItem("rs_notif_sound") || "default"}
                                    onChange={(e) => {
                                      localStorage.setItem("rs_notif_sound", e.target.value);
                                      if (e.target.value === "nature") {
                                        const audio = new Audio("https://freesound.org/data/previews/352/352514_5062143-lq.mp3");
                                        audio.play().catch(()=>{});
                                      }
                                    }}
                                  >
                                    <option value="default">System Default</option>
                                    <option value="nature">Nature (Water Drop)</option>
                                    <option value="birds">Nature (Bird Chirp)</option>
                                    <option value="mute">Muted</option>
                                  </select>
                                </div>
                              </div>
                            </>
                          )}

                          {settingsTab === "wallet" && (
                            <>
                              <div style={{ background: "linear-gradient(135deg, #16a34a, #059669)", padding: "1rem", borderRadius: "12px", color: "white" }}>
                                <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.82rem", opacity: 0.9 }}>💳 My Wallet Balance</h4>
                                <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                                  ₹{(user?.walletBalance || 0).toLocaleString()}
                                </div>
                                <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", opacity: 0.85 }}>
                                  Use this balance for instant checkout or delivery earnings.
                                </p>
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                                <div>
                                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>UPI ID</label>
                                  <input 
                                    type="text" 
                                    value={upiId} 
                                    onChange={e => setUpiId(e.target.value)} 
                                    placeholder="e.g. 9876543210@ybl" 
                                    style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.88rem" }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>Bank Account Number</label>
                                  <input 
                                    type="text" 
                                    value={bankAcc} 
                                    onChange={e => setBankAcc(e.target.value)} 
                                    placeholder="e.g. 123456789012" 
                                    style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.88rem" }}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {settingsMsg && (
                            <div style={{ padding: "0.55rem", borderRadius: "8px", fontSize: "0.82rem", textAlign: "center", fontWeight: 600, background: settingsMsg.includes("success") ? "#dcfce7" : "#fee2e2", color: settingsMsg.includes("success") ? "#166534" : "#991b1b" }}>
                              {settingsMsg}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.35rem", paddingTop: "0.65rem", borderTop: "1px solid #e2e8f0" }}>
                            <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.55rem", fontSize: "0.85rem" }} onClick={() => setShowSettings(false)}>Close</button>
                            <button type="button" className="btn-primary" style={{ flex: 1, padding: "0.55rem", fontSize: "0.85rem" }} onClick={handleSaveSettings} disabled={savingSettings}>
                              {savingSettings ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
              <li>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={handleLogout} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem", background: "#fef2f2", color: "#ef4444", borderColor: "#fecaca" }}>
                  <LogOut size={16} /> {t("logout")}
                </motion.button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem", display: "inline-block", borderRadius: "100px", color: "var(--text-dark)", borderColor: "#e2e8f0" }}>{t("login")}</motion.span>
                </Link>
              </li>
              <li>
                <Link href="/register" style={{ textDecoration: "none" }}>
                  <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem", display: "inline-block", width: "auto", borderRadius: "100px" }}>{t("register")}</motion.span>
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Mobile Settings Drawer - Anchored above BottomNav on mobile */}
        {showSettings && typeof window !== "undefined" && window.innerWidth <= 768 && createPortal(
          <div className="modal-overlay" onClick={() => setShowSettings(false)} style={{ zIndex: 10004 }}>
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="settings-mobile-sheet"
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", maxHeight: "82vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "8px", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <User size={18} color="var(--green-mid)" />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-dark)", fontWeight: 700 }}>Personal Settings</h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user?.email || user?.role}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowSettings(false)} 
                    style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", cursor: "pointer", color: "#64748b" }}
                  >
                    ×
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "3px", marginBottom: "1rem" }}>
                  {[
                    { id: "profile", label: "👤 Profile & Audio" },
                    { id: "app", label: "📱 Display" },
                    { id: "wallet", label: "💳 Wallet" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSettingsTab(tab.id)}
                      style={{
                        flex: 1, padding: "0.45rem 0.3rem", background: settingsTab === tab.id ? "white" : "transparent",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        fontSize: "0.8rem", fontWeight: settingsTab === tab.id ? 700 : 500,
                        color: settingsTab === tab.id ? "var(--green-deep)" : "var(--text-muted)",
                        boxShadow: settingsTab === tab.id ? "0 2px 5px rgba(0,0,0,0.08)" : "none"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Contents for mobile */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {settingsTab === "profile" && (
                    <>
                      <div style={{ background: "#f8fafc", padding: "0.9rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Volume2 size={16} color="var(--green-mid)" /> Notification Alert Mode
                          </span>
                          <span style={{ fontSize: "0.7rem", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                            {notificationMode === "hear" ? "Voice Only" : notificationMode === "view" ? "Visual Only" : "Voice + Visual"}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 0.65rem 0", fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                          Choose whether to hear notifications spoken aloud on phone or view alerts.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem", marginBottom: "0.65rem" }}>
                          {[
                            { id: "hear", label: "🔊 Hear", desc: "Voice speech" },
                            { id: "view", label: "👁️ View", desc: "Silent alerts" },
                            { id: "both", label: "🔔 Both", desc: "Voice + visual" }
                          ].map(opt => {
                            const active = notificationMode === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setNotificationMode(opt.id);
                                  localStorage.setItem("rs_notification_mode", opt.id);
                                }}
                                style={{
                                  padding: "0.55rem 0.25rem", borderRadius: "8px",
                                  border: active ? "2px solid var(--green-mid)" : "1px solid #cbd5e1",
                                  background: active ? "rgba(34,197,94,0.09)" : "white",
                                  cursor: "pointer", textAlign: "center"
                                }}
                              >
                                <span style={{ fontSize: "0.78rem", fontWeight: active ? 700 : 500, color: active ? "var(--green-deep)" : "var(--text-dark)" }}>
                                  {opt.label}
                                </span>
                                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                  {opt.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={handleTestVoiceNotification}
                          disabled={isSpeakingTest}
                          style={{
                            width: "100%", padding: "0.5rem", borderRadius: "8px",
                            background: isSpeakingTest ? "#dcfce7" : "#f1f5f9",
                            border: "1px dashed #86efac", color: isSpeakingTest ? "#166534" : "#334155",
                            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                          }}
                        >
                          <Volume2 size={14} color={isSpeakingTest ? "#16a34a" : "#64748b"} />
                          {isSpeakingTest ? "Speaking alert aloud..." : "▶️ Test Voice Notification"}
                        </button>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>Full Name</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          placeholder="e.g. John Doe" 
                          style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.88rem" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>Mobile Number</label>
                        <input 
                          type="text" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          placeholder="e.g. 9876543210" 
                          style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "white", fontSize: "0.88rem" }}
                        />
                      </div>
                    </>
                  )}

                  {settingsTab === "app" && (
                    <div style={{ background: "#f8fafc", padding: "0.9rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.88rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Volume2 size={16} /> Global Audio Settings
                      </h4>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-mid)", fontWeight: 500 }}>Chime Tone</span>
                        <select 
                          className="rs-select" 
                          style={{ padding: "0.3rem", fontSize: "0.78rem", width: "150px" }}
                          value={localStorage.getItem("rs_notif_sound") || "default"}
                          onChange={(e) => {
                            localStorage.setItem("rs_notif_sound", e.target.value);
                          }}
                        >
                          <option value="default">System Default</option>
                          <option value="nature">Nature (Water Drop)</option>
                          <option value="birds">Nature (Bird Chirp)</option>
                          <option value="mute">Muted</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {settingsTab === "wallet" && (
                    <div style={{ background: "linear-gradient(135deg, #16a34a, #059669)", padding: "1rem", borderRadius: "12px", color: "white" }}>
                      <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.82rem", opacity: 0.9 }}>💳 My Wallet Balance</h4>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                        ₹{(user?.walletBalance || 0).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {settingsMsg && (
                    <div style={{ padding: "0.55rem", borderRadius: "8px", fontSize: "0.82rem", textAlign: "center", fontWeight: 600, background: settingsMsg.includes("success") ? "#dcfce7" : "#fee2e2", color: settingsMsg.includes("success") ? "#166534" : "#991b1b" }}>
                      {settingsMsg}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.35rem", paddingTop: "0.65rem", borderTop: "1px solid #e2e8f0" }}>
                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.55rem", fontSize: "0.85rem" }} onClick={() => setShowSettings(false)}>Close</button>
                    <button type="button" className="btn-primary" style={{ flex: 1, padding: "0.55rem", fontSize: "0.85rem" }} onClick={handleSaveSettings} disabled={savingSettings}>
                      {savingSettings ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}

        <CartSidebar />
        {showLocationModal && createPortal(
          <LocationUpdateModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />,
          document.body
        )}
        {showTrustModal && createPortal(
          <TrustScoreModal
            userId={user?._id}
            userRole={user?.role}
            isOpen={showTrustModal}
            onClose={() => setShowTrustModal(false)}
          />,
          document.body
        )}
      </nav>
      <APMCTicker />
    </>
  );
}
