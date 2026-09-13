import { BASE_URL } from '../../api/api';
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { useVoiceInput } from "../../utils/useVoiceInput";
import AutoSuggestInput from "../../components/AutoSuggestInput";
import API from "../../api/api";
import { io } from "socket.io-client";
import AgentLiveMap from "../../components/AgentLiveMap";
import AgentFinancialLedger from "./AgentFinancialLedger";
import SecurityPledgeModal from "../../components/SecurityPledgeModal";
import { Volume2, MapPin, LocateFixed, Compass, Radio, Camera, CheckCircle2, ShieldCheck, KeyRound, Coins, Sparkles, UploadCloud, Loader2, Check, X, ArrowUpRight, ShieldAlert, Star } from "lucide-react";
import LocationUpdateModal from "../../components/LocationUpdateModal";
import ColdStorageAgentPanel from "../../components/ColdStorageAgentPanel";
import { playTTS } from "../../utils/voiceParser";
const STATUS_STEPS = ["assigned","picked_up","in_transit","delivered"];
const STATUS_ICONS = { assigned:"📋", picked_up:"📦", in_transit:"🚚", delivered:"✅", failed:"❌" };
const STATUS_LABELS = { assigned:"Assigned", picked_up:"Picked Up", in_transit:"In Transit", delivered:"Delivered", failed:"Failed" };

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SmartETA = ({ agentLat, agentLng, destLat, destLng, orderSizeKg }) => {
  const [etaData, setEtaData] = useState(null);

  useEffect(() => {
    if (!agentLat || !destLat) return;
    API.post("/ml/predict-eta", { agentLat, agentLng, destLat, destLng, orderSizeKg })
      .then(res => setEtaData(res.data))
      .catch(err => console.error("ETA error", err));
  }, [agentLat, agentLng, destLat, destLng, orderSizeKg]);

  if (!etaData) return null;

  return (
    <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-dark)" }}>⏱️ <strong>{etaData.estimatedTimeMins} mins</strong> ({etaData.distanceKm} km)</span>
        {etaData.riskLevel !== "Low" && (
          <span style={{ color: etaData.riskLevel === "High" ? "#ef4444" : "#f59e0b", fontWeight: 600 }}>
            ⚠️ {etaData.riskLevel} Risk
          </span>
        )}
      </div>
      {etaData.riskReason && <div style={{ color: "var(--text-muted)", marginTop: "0.2rem" }}>{etaData.riskReason}</div>}
    </div>
  );
};

const LiveSLATracker = ({ delivery, onLogDelay }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  if (delivery.status === "delivered") {
    const perf = delivery.deliveryPerformance;
    if (!perf) return null;
    return (
      <div style={{
        marginTop: "0.75rem", padding: "0.65rem 0.85rem", borderRadius: "10px",
        background: perf.isEarly ? "rgba(22, 163, 74, 0.08)" : "rgba(239, 68, 68, 0.08)",
        border: perf.isEarly ? "1px solid #86efac" : "1px solid #fca5a5",
        display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem"
      }}>
        <div>
          {perf.isEarly ? (
            <span style={{ color: "#166534", fontWeight: 700 }}>
              ⚡ Delivered {perf.diffMinutes} mins early • Speed Bonus: +{perf.speedBonusPoints} pts (+₹{perf.speedBonusCash} tip)
            </span>
          ) : (
            <span style={{ color: "#991b1b", fontWeight: 700 }}>
              ⏰ Delivered {Math.abs(perf.diffMinutes)} mins late • {perf.isDisputed ? "🛡️ Penalty Waived (Dispute Logged)" : `Points reduced: -${perf.latePenaltyPoints} pts`}
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {new Date(perf.deliveredAt || delivery.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  }

  // Active delivery
  const deadlineMs = delivery.estimatedDeliveryDeadline 
    ? new Date(delivery.estimatedDeliveryDeadline).getTime()
    : new Date(delivery.createdAt).getTime() + (delivery.estimatedMinutes || 35) * 60 * 1000;

  const diffMinutes = Math.round((deadlineMs - now) / (60 * 1000));
  const isUrgent = diffMinutes <= 5 && diffMinutes > 0;
  const isLate = diffMinutes <= 0;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${delivery.pickupLatitude || ''},${delivery.pickupLongitude || ''}&destination=${delivery.deliveryLatitude || ''},${delivery.deliveryLongitude || ''}`;

  return (
    <div style={{
      marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: "12px",
      background: isLate ? "#fef2f2" : isUrgent ? "#fffbeb" : "#f0fdf4",
      border: isLate ? "1px solid #fecaca" : isUrgent ? "1px solid #fde68a" : "1px solid #bbf7d0",
      display: "flex", flexDirection: "column", gap: "0.5rem"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          {isLate ? (
            <div style={{ color: "#b91c1c", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>⏰ Delivery Overdue by {Math.abs(diffMinutes)} mins!</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#dc2626" }}>(-20 pts penalty on delivery)</span>
            </div>
          ) : isUrgent ? (
            <div style={{ color: "#b45309", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>⚠️ Urgent SLA: Only {diffMinutes} mins remaining!</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#d97706" }}>(Deliver now to avoid late deduction)</span>
            </div>
          ) : (
            <div style={{ color: "#15803d", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>⚡ Fast-Track Window: {diffMinutes} mins left</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16a34a" }}>(Deliver early for +35 Speed Pts & ₹20 Tip!)</span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#2563eb", color: "white", padding: "0.35rem 0.75rem",
              borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "0.3rem"
            }}
          >
            🧭 Fast GPS Route
          </a>
          <button
            type="button"
            onClick={onLogDelay}
            style={{
              background: "white", color: "#475569", border: "1px solid #cbd5e1",
              padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.75rem",
              fontWeight: 600, cursor: "pointer"
            }}
            title="Log delay reason to excuse late points deduction"
          >
            ⚠️ Log Delay
          </button>
        </div>
      </div>
      {delivery.deliveryPerformance?.delayReason && (
        <div style={{ fontSize: "0.75rem", color: "#0369a1", background: "#e0f2fe", padding: "0.3rem 0.6rem", borderRadius: "6px" }}>
          🛡️ Dispute Note: {delivery.deliveryPerformance.delayReason}
        </div>
      )}
    </div>
  );
};

const AgentTips = ({ user }) => {
  const isBike = user?.agentType === 'bike' || !user?.agentType;
  const tips = [
    "📸 Always take clear photos for AI verification (REQUIRED for marking as Delivered).",
    isBike ? "🛵 Security Rule: You are on a Bike (Max 50kg). Do not accept over-capacity orders." : "🚚 Security Rule: You are on a Truck (Max 5000kg). Maintain logbooks and load limits.",
    isBike ? "🎒 Use insulated backpacks for dairy or perishable crops." : "❄️ Ensure truck refrigeration is on for long-distance perishables.",
    "📦 Handle organic produce carefully—avoid crushing soft fruits.",
    "⛽ Plan your routes to minimize fuel consumption and delivery time.",
    "🛡️ Keep your app location tracking on so customers can monitor ETA accurately."
  ];
  return (
    <div className="glass-card mt-3">
      <h3 className="section-title">💡 Smart Delivery Tips</h3>
      <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>Boost your delivery score and efficiency with these daily tips:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {tips.map((t, i) => (
          <div key={i} style={{ background: "rgba(34, 197, 94, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.1)" }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AgentDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [tab, setTab] = useState("my");
  const [deliveries, setDeliveries] = useState([]);
  const [available, setAvailable] = useState([]);
  const [earnings, setEarnings] = useState({ totalDeliveries:0, totalEarnings:0, todayDeliveries:0, perDeliveryAvg:0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState({ type:"", text:"" });
  const [search, setSearch] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [agentPos, setAgentPos] = useState(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState("");

  useEffect(() => {
    if (user?.latitude && user?.longitude && !agentPos) {
      setAgentPos({ lat: user.latitude, lng: user.longitude });
    }
  }, [user, agentPos]);

  useEffect(() => {
    const handleLocUpdate = (e) => {
      if (e.detail?.latitude && e.detail?.longitude) {
        setAgentPos({ lat: e.detail.latitude, lng: e.detail.longitude });
      }
    };
    window.addEventListener("user_location_updated", handleLocUpdate);
    return () => window.removeEventListener("user_location_updated", handleLocUpdate);
  }, []);
  const [perfData, setPerfData] = useState({ totalCompleted: 0, earlyDeliveries: 0, lateDeliveries: 0, onTimeRate: 100, totalSpeedPoints: 0, totalSpeedCash: 0, totalPenaltyPoints: 0 });
  const [delayModal, setDelayModal] = useState(null);
  const [delayReason, setDelayReason] = useState("Traffic Jam");
  const [delayNote, setDelayNote] = useState("");
  const { listening, activeField, interim, startListening, stopListening } = useVoiceInput(lang || "en");
  const [showPledge, setShowPledge] = useState(user?.acceptedTerms === false);

  // ─── AI Farm Produce Inspection State ───
  const [inspectModal, setInspectModal] = useState(null);
  const [inspectImageFile, setInspectImageFile] = useState(null);
  const [inspectPreview, setInspectPreview] = useState(null);
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);

  // ─── Secure Doorstep Handover & OTP State ───
  const [handoverModal, setHandoverModal] = useState(null);
  const [handoverOtp, setHandoverOtp] = useState("");
  const [handoverWasteKg, setHandoverWasteKg] = useState("");
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);

  // ─── COD Cash Remittance to Admin State ───
  const [remitModal, setRemitModal] = useState(false);
  const [remitAmount, setRemitAmount] = useState("");
  const [remitMethod, setRemitMethod] = useState("UPI");
  const [remitTxRef, setRemitTxRef] = useState("");
  const [remitting, setRemitting] = useState(false);

  // ─── Multi-Algorithm Routing Constraint State ───
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("dabbawala_cluster");

  const [ridealongForm, setRidealongForm] = useState({
    fromLocation: user?.ridealongRoute?.fromLocation || "",
    toLocation: user?.ridealongRoute?.toLocation || "",
    fromLat: user?.ridealongRoute?.fromLat || (user?.latitude || 17.385),
    fromLng: user?.ridealongRoute?.fromLng || (user?.longitude || 78.486),
    toLat: user?.ridealongRoute?.toLat || 17.2403,
    toLng: user?.ridealongRoute?.toLng || 78.4294,
    departureTime: user?.ridealongRoute?.departureTime ? new Date(user.ridealongRoute.departureTime).toISOString().slice(0, 16) : "",
    isActive: user?.ridealongRoute?.isActive ?? false
  });
  const [savingRoute, setSavingRoute] = useState(false);

  const saveRidealongRoute = async (e) => {
    e.preventDefault();
    setSavingRoute(true);
    try {
      const res = await API.put("/delivery/ridealong/route", {
        agentId: user?._id,
        ...ridealongForm
      });
      setMsg({ type: "success", text: "🎒 Ride-Along route saved! Platform will auto-match orders along your commute." });
      if (user) {
        user.ridealongRoute = res.data.ridealongRoute;
        user.agentType = "ridealong";
      }
      loadAll();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to update ride-along route." });
    } finally {
      setSavingRoute(false);
      setTimeout(() => setMsg({ type:"", text:"" }), 4000);
    }
  };

  useEffect(() => { 
    loadAll();
    const socket = io(BASE_URL);
    socket.on("delivery_assigned", () => loadAll());
    socket.on("delivery_updated", () => loadAll());
    socket.on("order_created", () => fetchAvailable());
    
    // Live Admin Route Dispatch listener
    socket.on("admin_route_dispatched", (data) => {
      if (data.agentId === user?._id || data.agentId?.toString() === user?._id?.toString()) {
        setRouteData(data.routeData);
        setMsg({ type: "success", text: `📢 ${data.message || "Admin has optimized and dispatched your live route!"}` });
      }
    });

    const handleAINavigate = (e) => {
      if (e.detail.targetTab) setTab(e.detail.targetTab);
    };
    window.addEventListener("ai_navigate", handleAINavigate);

    let watchId;
    if (navigator.geolocation && user) {
      // Get initial position first to populate immediately
      navigator.geolocation.getCurrentPosition((pos) => setAgentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setAgentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          socket.emit("agent_location_update", {
            agentId: user._id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now()
          });
        },
        (err) => console.log("Location watch error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      socket.disconnect();
      if (watchId) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("ai_navigate", handleAINavigate);
    };
  }, [user]);

  const loadAll = () => {
    fetchDeliveries();
    fetchAvailable();
    fetchEarnings();
    fetchPerformance();
  };

  const fetchPerformance = async () => {
    try {
      const res = await API.get(`/delivery/agent-performance/${user?._id}`);
      setPerfData(res.data);
    } catch {}
  };

  const logDelayReason = async () => {
    if (!delayModal) return;
    try {
      await API.post(`/delivery/${delayModal._id}/log-delay`, {
        reason: delayReason,
        notes: delayNote
      });
      setMsg({ type: "success", text: "🛡️ Delay reason recorded. Late penalty waiver submitted for review." });
      setDelayModal(null);
      setDelayNote("");
      loadAll();
    } catch (err) {
      setMsg({ type: "error", text: "Failed to log delay." });
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/delivery/agent/${user?._id}`);
      setDeliveries(res.data);
    } catch {} finally { setLoading(false); }
  };

  const fetchAvailable = async () => {
    try {
      const q = agentPos ? `?lat=${agentPos.lat}&lng=${agentPos.lng}` : "";
      const res = await API.get(`/delivery/available${q}`);
      setAvailable(res.data);
    } catch {}
  };

  useEffect(() => {
    if (tab === "available") fetchAvailable();
  }, [agentPos?.lat, agentPos?.lng, tab]);

  const fetchEarnings = async () => {
    try {
      const res = await API.get(`/delivery/earnings/${user?._id}`);
      setEarnings(res.data);
    } catch {}
  };

  const updateAgentLocation = async (orderId) => {
    if (!agentPos) {
      setMsg({ type: "error", text: "Location not available. Please wait for GPS to connect." });
      return;
    }
    try {
      setUpdating(orderId);
      await API.put(`/orders/${orderId}/live-location`, { lat: agentPos.lat, lng: agentPos.lng });
      setMsg({ type: "success", text: "📍 Location updated successfully on the server." });
    } catch (e) {
      setMsg({ type: "error", text: "Failed to update live location." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 3000);
    }
  };

  const generateOtp = async (d) => {
    setUpdating(d._id);
    try {
      await API.post(`/delivery/${d._id}/generate-otp`);
      setMsg({ type:"success", text:"🔑 OTP generated and sent to customer!" });
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to generate OTP." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 3000);
    }
  };

  const updateStatus = async (d, status) => {
    setUpdating(d._id);
    let wasteCollectedKg = 0;
    try {
      if (status === "delivered") {
        if (!d.deliveryPhoto) {
          setMsg({ type:"error", text: "Security Rule: Quality Verification Photo is required before marking as delivered. Please upload it first." });
          setUpdating(null);
          return;
        }
        
        const otp = prompt("Enter the 6-digit OTP sent to the customer:");
        if (!otp) {
          setUpdating(null);
          return;
        }
        await API.post(`/delivery/${d._id}/verify-otp`, { otp });

        // Waste Collection Prompt
        const wasteInput = prompt("Did you collect any organic waste from the customer? Enter amount in kg (or 0):");
        if (wasteInput && !isNaN(wasteInput) && Number(wasteInput) > 0) {
          wasteCollectedKg = Number(wasteInput);
        }
      }
      await API.put(`/delivery/${d._id}/status`, { status, wasteCollectedKg });
      setMsg({ type:"success", text:`✅ Status updated to "${STATUS_LABELS[status]}"` });
      loadAll();
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to update status." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 3000);
    }
  };

  const verifyProduct = async (orderId) => {
    try {
      await API.put(`/orders/${orderId}/verify-product`);
      setMsg({ type:"success", text:"✅ Product verified successfully." });
      loadAll();
    } catch (e) { setMsg({ type:"error", text:"Failed to verify product." }); }
  };

  const reportMismatch = async (orderId) => {
    const reason = prompt("Enter reason for product mismatch:");
    if (!reason) return;
    try {
      await API.put(`/orders/${orderId}/report-mismatch`, { reason });
      setMsg({ type:"error", text:"🚨 Mismatch reported. Admin notified." });
      loadAll();
    } catch (e) { setMsg({ type:"error", text:"Failed to report mismatch." }); }
  };

  const uploadPhoto = async (deliveryId, type, file) => {
    setUpdating(deliveryId);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("type", type);
      await API.put(`/delivery/${deliveryId}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMsg({ type:"success", text:`📸 ${type === "pickup" ? "Pickup" : "Delivery"} photo uploaded successfully!` });
      loadAll();
    } catch (err) {
      setMsg({ type:"error", text:"Failed to upload photo." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 3000);
    }
  };

  const uploadWastePhoto = async (deliveryId, file) => {
    setUpdating(deliveryId);
    try {
      const formData = new FormData();
      formData.append("wastePhoto", file);
      setMsg({ type:"info", text:"Uploading photo & running AI Biodegradable Scan..." });
      const res = await API.post(`/delivery/${deliveryId}/verify-waste`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.isVerified) {
        setMsg({ type:"success", text:"🌱 AI Verified: Organic waste accepted!" });
      } else {
        setMsg({ type:"error", text:`❌ AI Alert: ${res.data.reason}` });
      }
      loadAll();
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to verify waste." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 4000);
    }
  };

  // ─── AI Produce Inspection Handlers ───
  const handleOpenInspection = (deliveryItem) => {
    setInspectModal(deliveryItem);
    setInspectImageFile(null);
    setInspectPreview(null);
    setInspectResult(null);
  };

  const handleRunAIInspection = async () => {
    if (!inspectModal || !inspectImageFile) {
      setMsg({ type: "error", text: "Please capture or choose a live photo of the farm produce first." });
      return;
    }
    setInspecting(true);
    try {
      const formData = new FormData();
      formData.append("producePhoto", inspectImageFile);
      const res = await API.post(`/delivery/${inspectModal._id}/verify-produce`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setInspectResult(res.data);
      setMsg({ type: "success", text: `✨ AI Quality Inspection Complete: ${res.data.grade} (${res.data.freshnessScore}% Freshness)!` });
      loadAll();
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: err.response?.data?.error || "AI Produce Inspection failed." });
    } finally {
      setInspecting(false);
    }
  };

  // ─── Secure Handover & OTP Completion ───
  const handleOpenHandover = (deliveryItem) => {
    setHandoverModal(deliveryItem);
    setHandoverOtp("");
    setHandoverWasteKg("");
  };

  const handleCompleteHandover = async () => {
    if (!handoverModal || !handoverOtp.trim() || handoverOtp.trim().length !== 6) {
      setMsg({ type: "error", text: "Please enter the valid 6-digit Delivery OTP provided by the customer." });
      return;
    }
    setHandoverSubmitting(true);
    try {
      const res = await API.post(`/delivery/${handoverModal._id}/complete-handover`, {
        otp: handoverOtp.trim(),
        wasteCollectedKg: Number(handoverWasteKg) || 0
      });
      setMsg({
        type: "success",
        text: `🎉 Secure Handover Verified! ${res.data.codCollected > 0 ? `Collected ₹${res.data.codCollected} COD.` : ""} Earned ₹${res.data.agentEarnings} credited to your Bi-Weekly Settlement Ledger.`
      });
      setHandoverModal(null);
      loadAll();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to verify OTP." });
    } finally {
      setHandoverSubmitting(false);
      setTimeout(() => setMsg({ type: "", text: "" }), 5000);
    }
  };

  // ─── Remit COD Cash to Admin ───
  const handleRemitCodCash = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    setRemitting(true);
    try {
      const res = await API.post("/delivery/remit-cod", {
        agentId: user._id,
        amount: Number(remitAmount) || user.cashInHand || 0,
        paymentMethod: remitMethod,
        transactionRef: remitTxRef
      });
      setMsg({ type: "success", text: `💵 ${res.data.message}` });
      if (user) user.cashInHand = res.data.cashInHand;
      setRemitModal(false);
      setRemitAmount("");
      setRemitTxRef("");
      loadAll();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to submit COD remittance." });
    } finally {
      setRemitting(false);
      setTimeout(() => setMsg({ type: "", text: "" }), 5000);
    }
  };

  const dropoffWaste = async (deliveryId) => {
    setUpdating(deliveryId);
    try {
      await API.post(`/delivery/${deliveryId}/dropoff-waste`);
      setMsg({ type:"success", text:"♻️ Waste dropped off at Admin Storage successfully!" });
      loadAll();
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to drop off waste." });
    } finally {
      setUpdating(null);
    }
  };

  const runAIVerification = async (deliveryId) => {
    setUpdating(deliveryId);
    setMsg({ type:"info", text:"🤖 Running AI Vision Verification... Please wait." });
    try {
      const res = await API.post(`/ai/verify-delivery`, { deliveryId });
      if (res.data.result === "match") {
        setMsg({ type:"success", text:"✅ AI Verification Passed! Products match perfectly." });
      } else {
        setMsg({ type:"error", text:`🚨 AI Fraud Alert: ${res.data.notes}` });
      }
      loadAll();
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "AI Verification failed." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 6000);
    }
  };

  const runPickupVerification = async (deliveryData) => {
    setUpdating(deliveryData._id);
    setMsg({ type:"info", text:"🤖 Verifying Pickup Photo vs Marketplace Image..." });
    try {
      const orderId = deliveryData.order?._id || deliveryData.order;
      const res = await API.post(`/ai/verify-pickup`, { orderId, pickupPhotoUrl: deliveryData.pickupPhoto });
      if (res.data.result === "match") {
        setMsg({ type:"success", text:"✅ AI Verification Passed! Farm pickup matches marketplace product." });
      } else {
        setMsg({ type:"error", text:`🚨 AI Fraud Alert: ${res.data.notes}` });
      }
      loadAll();
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Verification failed." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 6000);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!agentPos) {
      setMsg({ type: "error", text: "Wait for GPS location before optimizing." });
      return;
    }
    const pending = deliveries.filter(d => d.status === "assigned" || d.status === "in_transit" || d.status === "picked_up");
    if (pending.length === 0) {
      setMsg({ type: "error", text: "No pending deliveries to optimize." });
      return;
    }
    
    setOptimizing(true);
    try {
      const payload = {
        agentLocation: { lat: agentPos.lat, lng: agentPos.lng },
        deliveries: pending.map(d => ({
          _id: d._id,
          pickupLocation: { lat: d.pickupLatitude || 0, lng: d.pickupLongitude || 0, address: d.pickupLocation },
          deliveryLocation: { lat: d.deliveryLatitude || 0, lng: d.deliveryLongitude || 0, address: d.deliveryLocation },
          status: d.status
        }))
      };
      const res = await API.post("/ml/route-optimize", payload);
      setRouteData(res.data);
      setMsg({ type: "success", text: "📍 Route Optimized Successfully!" });
    } catch (e) {
      setMsg({ type: "error", text: "Failed to optimize route." });
    } finally {
      setOptimizing(false);
    }
  };

  const acceptOrder = async (orderId) => {
    setUpdating(orderId);
    try {
      await API.post(`/delivery/accept/${orderId}`, { agentId: user?._id });
      setMsg({ type:"success", text:"✅ Delivery accepted! Check your deliveries tab." });
      loadAll();
      setTab("my");
    } catch (err) {
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to accept." });
    } finally {
      setUpdating(null);
      setTimeout(() => setMsg({ type:"", text:"" }), 3000);
    }
  };

  const nextStatus = (current) => {
    const idx = STATUS_STEPS.indexOf(current);
    return idx < STATUS_STEPS.length - 1 ? STATUS_STEPS[idx + 1] : null;
  };

  const optimizeRoute = async (overrideAlgo) => {
    const algoToUse = overrideAlgo || selectedAlgorithm;
    const activeDeliveries = deliveries.filter(d => ["assigned", "picked_up", "in_transit"].includes(d.status));
    
    if (activeDeliveries.length === 0) {
      setMsg({ type: "info", text: "No active or assigned deliveries to optimize." });
      return;
    }

    const runWithCoords = async (lat, lng) => {
      setOptimizing(true);
      setMsg({ type: "info", text: `🗺️ Calculating route using [${algoToUse.toUpperCase()}] algorithm...` });
      try {
        const res = await API.post("/ml/route-optimize", { 
          agentLat: lat, 
          agentLng: lng, 
          orders: activeDeliveries,
          agentType: user?.agentType || "bike",
          algorithm: algoToUse
        });
        setRouteData(res.data);
        setMsg({ type: "success", text: `✅ Route optimized with ${res.data.stopsCount || res.data.optimized?.length || 0} stops! Distance: ${res.data.totalDistance} km (${res.data.totalMinutes} mins)` });
      } catch (err) {
        console.error("Optimize route error:", err);
        setMsg({ type: "error", text: err.response?.data?.error || "Failed to optimize route." });
      } finally {
        setOptimizing(false);
      }
    };

    if (!agentPos || !agentPos.lat) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setAgentPos(p);
            runWithCoords(p.lat, p.lng);
          },
          () => {
            // Fallback to default Telangana hub
            runWithCoords(user?.latitude || 17.3850, user?.longitude || 78.4867);
          }
        );
      } else {
        runWithCoords(user?.latitude || 17.3850, user?.longitude || 78.4867);
      }
    } else {
      runWithCoords(agentPos.lat, agentPos.lng);
    }
  };

  const lowerSearch = search.toLowerCase();
  const filteredDeliveries = deliveries.filter(d => 
    d.trackingCode?.toLowerCase().includes(lowerSearch) || 
    d.order?.crop?.name?.toLowerCase().includes(lowerSearch) ||
    d.deliveryLocation?.toLowerCase().includes(lowerSearch)
  );

  let filteredAvailable = available.filter(o => 
    o.crop?.name?.toLowerCase().includes(lowerSearch) ||
    o.deliveryAddress?.toLowerCase().includes(lowerSearch) ||
    o.customer?.name?.toLowerCase().includes(lowerSearch)
  );

  if (radiusFilter && agentPos) {
    const maxDist = Number(radiusFilter);
    filteredAvailable = filteredAvailable.filter(o => {
      const cLat = o.farmer?.latitude || o.crop?.latitude;
      const cLng = o.farmer?.longitude || o.crop?.longitude;
      const dist = haversineDistance(agentPos.lat, agentPos.lng, cLat, cLng);
      return dist !== null && dist <= maxDist;
    });
  }

  // Multi-Agent Mode Routing
  filteredAvailable = filteredAvailable.filter(o => {
    const isTruck = user?.agentType === 'truck';
    const cLat = o.farmer?.latitude || o.crop?.latitude;
    const cLng = o.farmer?.longitude || o.crop?.longitude;
    const dist = agentPos && cLat && cLng ? haversineDistance(agentPos.lat, agentPos.lng, cLat, cLng) : 0;
    const isHeavy = o.quantity >= 30 || dist >= 25;
    
    if (isTruck) return isHeavy;
    return !isHeavy;
  });

  const filtered = filter === "all"
    ? filteredDeliveries
    : filteredDeliveries.filter(d => d.status === filter);

  const counts = STATUS_STEPS.reduce((acc, s) => {
    acc[s] = filteredDeliveries.filter(d => d.status === s).length;
    return acc;
  }, {});

  return (
    <div className="page-wrapper">
      {!user?.isVerified ? (
        <div className="glass-card text-center" style={{ padding: "4rem 2rem", maxWidth: 600, margin: "2rem auto", background: "var(--blue-pale)", border: "1px solid var(--blue-light)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⏳</div>
          <h2 style={{ color: "var(--blue-deep)", marginBottom: "1rem" }}>Verification Pending</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
            Your agent account is currently under review. Our admin team is verifying your Aadhaar and Profile photo. 
            Once verified, you will be able to access the delivery dashboard and start earning!
          </p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>🔄 Check Status</button>
        </div>
      ) : (
        <>

      {showPledge && <SecurityPledgeModal user={user} onAccepted={() => { setShowPledge(false); user.acceptedTerms = true; }} />}
      
      <div className="flex-between mb-3" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ textAlign:"left", fontSize:"1.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {user?.agentType === 'truck' ? '🚛' : user?.agentType === 'cold_storage' ? '❄️' : (user?.agentType === 'ridealong' || user?.agentType === 'freelance_commuter') ? '🎒' : '🛵'} {t("welcome")}, {user?.name?.split(" ")[0] || "Agent"}
            <span className="badge badge-green" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {user?.agentType === 'truck' ? 'Heavy Freight Truck' : user?.agentType === 'cold_storage' ? 'Cold Storage Warehouse' : (user?.agentType === 'ridealong' || user?.agentType === 'freelance_commuter') ? 'Freelance Commuter Agent' : 'Local Express'}
            </span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize:"0.85rem" }}>Manage deliveries & accept new orders</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <button 
             className="btn-secondary" 
             style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(59, 130, 246, 0.1)", color: "#2563eb", border: "1px solid rgba(59, 130, 246, 0.3)" }}
             onClick={() => playTTS(`Welcome Agent ${user?.name}. You are assigned as a ${user?.agentType || 'bike'} agent. Review your available orders below.`, lang)}
          >
             🔊 Audio Guide
          </button>
          <div style={{ minWidth: 250 }}>
            <AutoSuggestInput
               value={search}
               onChange={setSearch}
               placeholder="🔍 Search deliveries, crops..."
               fieldType="default"
               onSpeak={() => {
                 if (listening && activeField === "search") {
                   if (typeof stopListening === "function") stopListening();
                   return;
                 }
                 startListening((val) => {
                   if (typeof val === "function") setSearch(f=>val(f));
                   else setSearch(val);
                 }, { replace: true, fieldId: "search" });
               }}
               listening={listening && activeField === "search"}
               interim={interim}
            />
          </div>
          <button className="btn-secondary" onClick={loadAll}>🔄 Refresh</button>
        </div>
      </div>

      {/* ── Agent Live Location & GPS Status Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        border: "1.5px solid #93c5fd",
        borderRadius: "14px",
        padding: "0.9rem 1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            background: "#2563eb", color: "white", width: 40, height: 40,
            borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)", flexShrink: 0
          }}>
            <MapPin size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.95rem", color: "#1e3a8a" }}>
                Delivery Dispatch Hub: {user?.location || "No base address set"}
              </strong>
              {agentPos && (
                <span style={{
                  background: "#16a34a", color: "white", padding: "2px 8px", borderRadius: "100px",
                  fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px"
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }}></span>
                  Live GPS Active
                </span>
              )}
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#475569" }}>
              {agentPos
                ? `📍 Current Location: ${agentPos.lat.toFixed(4)}° N, ${agentPos.lng.toFixed(4)}° E • Broadcasting live to Marketplace Map & active customers`
                : "⚠️ Waiting for GPS lock. Click update to set your delivery dispatch hub."}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                  setAgentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  setMsg({ type: "success", text: "✅ GPS coordinates refreshed successfully!" });
                  setTimeout(() => setMsg({ type:"", text:"" }), 3000);
                });
              }
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.55rem 0.9rem", borderRadius: "100px",
              background: "white", color: "#2563eb", border: "1.5px solid #2563eb",
              fontSize: "0.82rem", fontWeight: 700, cursor: "pointer"
            }}
          >
            <LocateFixed size={15} /> Refresh GPS
          </button>

          <button
            type="button"
            onClick={() => setShowLocModal(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              padding: "0.55rem 1.1rem", borderRadius: "100px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white", border: "none",
              fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
            }}
          >
            <MapPin size={16} /> Update Location
          </button>
        </div>
      </div>

      {/* Earnings, Speed Bonuses & Trust Row */}
      <div className="grid-5 mb-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        <div className="earnings-card">
          <div className="earnings-value">₹{earnings.totalEarnings?.toLocaleString() || 0}</div>
          <div className="earnings-label">Total Earnings</div>
        </div>
        <div className="stat-card" style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid #86efac" }}>
          <span className="stat-icon">⚡</span>
          <div className="stat-value" style={{ color: "#166534" }}>+{perfData.totalSpeedPoints || 0} pts</div>
          <div className="stat-label">Speed Bonuses (₹{perfData.totalSpeedCash || 0} tip)</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <div className="stat-value">{perfData.onTimeRate || 100}%</div>
          <div className="stat-label">On-Time Success Rate</div>
        </div>
        <div className="stat-card" style={{ background: (perfData.totalPenaltyPoints || 0) > 0 ? "rgba(239, 68, 68, 0.08)" : undefined, borderColor: (perfData.totalPenaltyPoints || 0) > 0 ? "#fca5a5" : undefined }}>
          <span className="stat-icon">⚠️</span>
          <div className="stat-value" style={{ color: (perfData.totalPenaltyPoints || 0) > 0 ? "#dc2626" : "var(--text-dark)" }}>
            -{perfData.totalPenaltyPoints || 0} pts
          </div>
          <div className="stat-label">Late Penalties Incurred</div>
        </div>
        <div className="stat-card" style={{ background: "rgba(22, 163, 74, 0.05)", border: "1px solid var(--green-mid)" }}>
          <span className="stat-icon">🛡️</span>
          <div className="stat-value" style={{ color: "var(--green-mid)" }}>{user?.deliveryScore || earnings.trustScore?.score || 100}</div>
          <div className="stat-label">Delivery Score ({earnings.trustScore?.rating || 5.0} ⭐)</div>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

      {/* Tabs */}
      <div className="tab-bar mb-3">
        {[
          { k:"my", l:"📦 My Deliveries" },
          { k:"available", l:"🚚 Available Orders" },
          { k:"coldstorage", l:"❄️ Cold Storage Vault" },
          { k:"ridealong", l:"🎒 Ride-Along Route" },
          { k:"earnings", l:"💰 Earnings" },
          { k:"tips", l:"💡 Smart Tips" }
        ].map(tb => (
          <button key={tb.k} className={`tab-btn ${tab===tb.k?"active":""}`} onClick={() => setTab(tb.k)}>
            {tb.l}
          </button>
        ))}
      </div>

      {tab === "coldstorage" && (
        <div className="mb-3">
          <ColdStorageAgentPanel user={user} />
        </div>
      )}

      {tab === "my" && (
        <div className="glass-card mb-3" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", padding: "1.25rem", borderRadius: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.3rem" }}>🗺️</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#f8fafc", fontWeight: 800 }}>Multi-Algorithm Smart Route Optimizer</h3>
              </div>
              <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.8rem" }}>
                AI-optimized itinerary considering pickup precedence, cold-chain perishability, and vehicle type.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={selectedAlgorithm}
                onChange={(e) => {
                  setSelectedAlgorithm(e.target.value);
                  optimizeRoute(e.target.value);
                }}
                style={{
                  background: "#1e293b", color: "#e2e8f0", border: "1px solid #475569",
                  padding: "8px 12px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer"
                }}
              >
                <option value="dabbawala_cluster">🚲 Dabbawala Zone Cluster (Bike)</option>
                <option value="tsp_genetic">🚚 TSP Genetic Annealing (Min KM / Truck)</option>
                <option value="perishable_priority">🥬 Cold-Chain Perishable First (Freshness Priority)</option>
                <option value="greedy_fastest">⚡ Fastest ETA (Nearest Urgent Drop)</option>
                <option value="eco_fuel_saver">🌱 Eco-Fuel Saver (Low Emission)</option>
              </select>

              <button
                className="btn-primary hover-scale"
                onClick={() => optimizeRoute(selectedAlgorithm)}
                disabled={optimizing || deliveries.filter(d => ["assigned", "picked_up", "in_transit"].includes(d.status)).length === 0}
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none",
                  padding: "8px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "0.85rem",
                  boxShadow: "0 4px 12px rgba(22,163,74,0.3)"
                }}
              >
                {optimizing ? `🔄 Optimizing Route...` : `🚀 Optimize & Refresh Itinerary`}
              </button>
            </div>
          </div>

          {/* Route Optimization Result & Map */}
          {routeData && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", background: "rgba(255,255,255,0.06)", padding: "10px 14px", borderRadius: "10px", marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                    Total Distance: <strong style={{ color: "#4ade80", fontSize: "1rem" }}>{routeData.totalDistance} km</strong>
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                    Est. Travel Duration: <strong style={{ color: "#60a5fa", fontSize: "1rem" }}>~{routeData.totalMinutes || Math.round(Number(routeData.totalDistance) * 2 + 10)} mins</strong>
                  </span>
                  <span style={{ fontSize: "0.75rem", background: "#334155", color: "#f8fafc", padding: "2px 8px", borderRadius: "6px", textTransform: "uppercase", fontWeight: 800 }}>
                    Algorithm: {routeData.algorithmUsed || selectedAlgorithm}
                  </span>
                </div>
              </div>

              {/* Live Route Map */}
              <div style={{ marginBottom: "1.2rem" }}>
                <RouteMap routeData={routeData} agentPos={agentPos} />
              </div>

              {/* Stop-by-Stop Itinerary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                {(routeData.optimized || routeData.optimizedRoute || []).map((stop, i) => {
                  const isPickup = stop.action === "Pickup" || stop.type === "pickup";
                  return (
                    <div
                      key={i}
                      style={{
                        background: isPickup ? "rgba(22, 163, 74, 0.15)" : "rgba(234, 88, 12, 0.15)",
                        border: isPickup ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid rgba(249, 115, 22, 0.3)",
                        borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ background: isPickup ? "#16a34a" : "#ea580c", color: "white", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 900 }}>
                          STOP #{stop.stopNumber || i + 1}: {isPickup ? "🌾 FARM PICKUP" : "🏠 DOORSTEP DELIVERY"}
                        </span>
                        {stop.isPerishable && (
                          <span style={{ background: "#fee2e2", color: "#dc2626", fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>
                            🥬 Perishable Priority
                          </span>
                        )}
                      </div>

                      <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#f8fafc" }}>
                        {stop.cropName || "Produce Order"} {stop.quantityKg ? `(${stop.quantityKg} kg)` : ""}
                      </div>

                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                        📍 {stop.location}
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "#cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                        <span>Contact: <strong>{stop.farmerName || stop.customerName || "Recipient"}</strong></span>
                        {stop.legDistanceKm && <span style={{ color: "#60a5fa" }}>+{stop.legDistanceKm} km (~{stop.estimatedMinutes}m)</span>}
                      </div>

                      <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                        <a
                          href={stop.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude || stop.lat},${stop.longitude || stop.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1, background: "#2563eb", color: "white", padding: "6px 0",
                            borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, textAlign: "center", textDecoration: "none"
                          }}
                        >
                          🧭 Turn Navigation
                        </a>
                        {(stop.customerPhone || stop.farmerPhone) && (
                          <a
                            href={`tel:${stop.customerPhone || stop.farmerPhone}`}
                            style={{
                              background: "#334155", color: "#f8fafc", padding: "6px 12px",
                              borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center"
                            }}
                          >
                            📞 Call
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MY DELIVERIES ── */}
      {tab === "my" && (
        <>
          {/* Filter tabs */}
          <div className="tab-bar mb-3" style={{ background:"transparent", padding:0 }}>
            {[{ k:"all", l:"📦 All" }, ...STATUS_STEPS.map(s => ({ k:s, l:`${STATUS_ICONS[s]} ${STATUS_LABELS[s]} (${counts[s]||0})` }))].map(tb => (
              <button key={tb.k} className={`tab-btn ${filter===tb.k?"active":""}`} onClick={() => setFilter(tb.k)} style={{ flex:"none", padding:"0.5rem 0.85rem", fontSize:"0.78rem" }}>
                {tb.l}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loader-wrapper"><div className="loader"></div><p className="loader-text">{t("loading")}</p></div>
          ) : filtered.length === 0 ? (
            <div className="glass-card text-center" style={{ padding:"3rem" }}>
              <p style={{ fontSize:"3rem" }}>📭</p>
              <p style={{ color: "var(--text-muted)", marginTop:"1rem" }}>No deliveries in this category. Check "Available" tab for new orders!</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
              {filtered.map(d => {
                const next = nextStatus(d.status);
                const stepIdx = STATUS_STEPS.indexOf(d.status);
                const order = d.order;

                return (
                  <div className="glass-card" key={d._id} style={{ padding:"1.5rem" }}>
                    <div className="flex-between mb-2">
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <h3 style={{ color: "var(--text-dark)", fontWeight:700, margin: 0 }}>
                            {d.trackingCode || `#${d._id.substring(0,8).toUpperCase()}`}
                          </h3>
                          <button 
                            type="button" 
                            onClick={() => {
                              const text = `Delivery ${d.trackingCode || ''}. Pickup from ${d.pickupLocation || 'farmer'}. Deliver to ${order?.customer?.name || 'customer'} at ${d.deliveryLocation || ''}. Order value ${order?.totalAmount || 0} rupees. Status: ${STATUS_LABELS[d.status]}.`;
                              playTTS(text, lang);
                            }}
                            style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "6px", padding: "2px 6px", cursor: "pointer", color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.72rem" }}
                            title="🔊 Read Delivery Details Out Loud"
                          >
                            <Volume2 size={12} /> 🔊 Hear Details
                          </button>
                        </div>
                        {order?.crop && <p style={{ color:"var(--yellow-wheat)", fontSize:"0.88rem", marginTop:"0.2rem" }}>🌾 {order.crop.name} — {order.quantity} {order.crop.unit||"kg"}</p>}
                        <p style={{ color:"var(--text-muted)", fontSize:"0.78rem", marginTop:"0.2rem" }}>
                          {new Date(d.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                        </p>
                      </div>
                      <span className={`badge ${d.status==="delivered"?"badge-green":d.status==="in_transit"?"badge-blue":d.status==="failed"?"badge-red":"badge-yellow"}`}>
                        {STATUS_ICONS[d.status]} {STATUS_LABELS[d.status]}
                      </span>
                    </div>

                    {/* Live SLA & Speed Incentive Tracker */}
                    <LiveSLATracker delivery={d} onLogDelay={() => setDelayModal(d)} />

                    {/* Progress Bar */}
                    <div className="delivery-progress mb-2">
                      {STATUS_STEPS.map((s, i) => (
                        <div key={s} style={{ display:"flex", alignItems:"center", flex:1 }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                            <div className={`dp-circle ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`}>
                              {STATUS_ICONS[s]}
                            </div>
                            <span className="dp-label" style={{ fontSize:"0.6rem", marginTop:"0.3rem" }}>{STATUS_LABELS[s]}</span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`dp-line ${i < stepIdx ? "done" : ""}`} style={{ flex:1, height:2, margin:"0 4px", marginBottom:"1.2rem" }}></div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Info grid */}
                    <div className="grid-2" style={{ gap:"0.75rem", marginBottom:"1rem" }}>
                      {d.pickupLocation && (
                        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                          <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>📤 PICKUP FROM</p>
                          <p style={{ fontSize:"0.85rem", color: "var(--text-dark)" }}>{d.pickupLocation.substring(0,50)}</p>
                        </div>
                      )}
                      {d.dropoffs && d.dropoffs.length > 0 ? (
                        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem", gridColumn: "1 / -1" }}>
                          <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.4rem" }}>📍 MULTIPLE DROPOFFS (Route)</p>
                          {d.dropoffs.map((drop, idx) => (
                            <div key={idx} style={{ marginBottom:"0.5rem", padding:"0.5rem", background:"rgba(0,0,0,0.03)", borderRadius:"6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <p style={{ fontSize:"0.85rem", color: "var(--text-dark)", margin: 0 }}><strong>Stop {idx+1}:</strong> {drop.location.substring(0, 60)}</p>
                              <span className={`badge ${drop.status==="delivered"?"badge-green":"badge-yellow"}`} style={{ fontSize:"0.7rem" }}>{drop.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : d.deliveryLocation ? (
                        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                          <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>📍 DELIVER TO</p>
                          <p style={{ fontSize:"0.85rem", color: "var(--text-dark)" }}>{d.deliveryLocation.substring(0,50)}</p>
                        </div>
                      ) : null}
                      {order?.customer && (
                        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                          <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>👤 CUSTOMER</p>
                          <p style={{ fontSize:"0.85rem", color: "var(--text-dark)" }}>{order.customer.name} {order.customer.phone ? `• ${order.customer.phone}` : ""}</p>
                        </div>
                      )}
                      {order?.totalAmount && (
                        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                          <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>💰 ORDER VALUE</p>
                          <p style={{ fontSize:"0.85rem", color:"var(--yellow-wheat)", fontWeight:700 }}>₹{order.totalAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {d.status === "in_transit" && agentPos && d.deliveryLatitude && (
                      <SmartETA 
                        agentLat={agentPos.lat} agentLng={agentPos.lng} 
                        destLat={d.deliveryLatitude} destLng={d.deliveryLongitude}
                        orderSizeKg={order?.quantity || 10}
                      />
                    )}

                    {(d.status === "assigned" || d.status === "picked_up" || d.status === "in_transit") && (
                      <div style={{ marginBottom: "1rem" }}>
                        <AgentTips user={user} />
                        <AgentLiveMap agentPos={agentPos} deliveryData={d} />
                        <button 
                          className="btn-secondary mt-2" 
                          style={{ width: "100%", fontSize: "0.85rem" }}
                          disabled={updating === d._id || !agentPos}
                          onClick={() => updateAgentLocation(order?._id)}
                        >
                          {updating === d._id ? "Updating..." : "📍 Update Current Location"}
                        </button>
                      </div>
                    )}

                    {/* ── Action Buttons for Active Workflow ── */}
                    {d.status !== "delivered" && d.status !== "failed" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", width: "100%" }}>
                        {d.status === "assigned" && (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleOpenInspection(d)}
                            style={{
                              background: "linear-gradient(135deg, #16a34a, #15803d)",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                              padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700, borderRadius: "10px",
                              boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)"
                            }}
                          >
                            <Camera size={18} /> 🌾 1. Inspect Farm Produce & Pack (AI Model)
                          </button>
                        )}

                        {d.status === "picked_up" && (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => updateStatus(d, "in_transit")}
                            style={{
                              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                              padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700, borderRadius: "10px",
                              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
                            }}
                          >
                            🚚 2. Start Transit to Customer
                          </button>
                        )}

                        {d.status === "in_transit" && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button 
                              className="btn-secondary" 
                              style={{ flex: 1, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                              disabled={updating === d._id} 
                              onClick={() => generateOtp(d)}
                            >
                              <KeyRound size={14} /> Resend OTP
                            </button>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleOpenHandover(d)}
                              style={{
                                flex: 2,
                                background: "linear-gradient(135deg, #16a34a, #059669)",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                padding: "0.85rem", fontSize: "0.95rem", fontWeight: 700, borderRadius: "10px",
                                boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)"
                              }}
                            >
                              <KeyRound size={18} /> 🔑 3. Secure Doorstep OTP Handover
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Photo Verification Layer */}
                    <div className="mt-2" style={{ background:"rgba(255,255,255,0.05)", padding:"1rem", borderRadius:"var(--radius-sm)", border:"1px solid rgba(255,255,255,0.1)" }}>
                      <h4 style={{ color: "var(--text-dark)", marginBottom:"0.5rem", fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                        🤖 AI Visual Verification
                      </h4>
                      
                      <div className="grid-2" style={{ gap:"0.5rem", marginBottom: (d.pickupPhoto && d.deliveryPhoto) ? "1rem" : "0" }}>
                        {/* Pickup Photo */}
                        <div>
                          {!d.pickupPhoto && d.status === "assigned" ? (
                            <label className="btn-secondary" style={{ display:"block", textAlign:"center", padding:"0.5rem", cursor:"pointer", fontSize:"0.8rem" }}>
                              📸 Capture Pickup
                              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
                                if (e.target.files[0]) uploadPhoto(d._id, "pickup", e.target.files[0]);
                              }} />
                            </label>
                          ) : d.pickupPhoto ? (
                            <>
                              <div style={{ color:"var(--green-light)", fontSize:"0.8rem", textAlign:"center", padding:"0.5rem", background:"rgba(34,197,94,0.1)", borderRadius:"4px" }}>✅ Pickup Captured</div>
                              {d.status === "assigned" && (
                                <button 
                                  className="btn-warn w-100" 
                                  style={{ marginTop: "0.5rem", padding: "0.4rem", fontSize: "0.75rem" }}
                                  onClick={() => runPickupVerification(d)}
                                  disabled={updating === d._id}
                                >
                                  🔍 Verify vs Marketplace
                                </button>
                              )}
                            </>
                          ) : (
                            <div style={{ color:"var(--text-muted)", fontSize:"0.8rem", textAlign:"center", padding:"0.5rem" }}>Pickup Pending</div>
                          )}
                        </div>

                        {/* Delivery Photo */}
                        <div>
                          {!d.deliveryPhoto && (d.status === "picked_up" || d.status === "in_transit") ? (
                            <label className="btn-secondary" style={{ display:"block", textAlign:"center", padding:"0.5rem", cursor:"pointer", fontSize:"0.8rem" }}>
                              📸 Capture Delivery
                              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
                                if (e.target.files[0]) uploadPhoto(d._id, "delivery", e.target.files[0]);
                              }} />
                            </label>
                          ) : d.deliveryPhoto ? (
                            <div style={{ color:"var(--green-light)", fontSize:"0.8rem", textAlign:"center", padding:"0.5rem", background:"rgba(34,197,94,0.1)", borderRadius:"4px" }}>✅ Delivery Captured</div>
                          ) : (
                            <div style={{ color:"var(--text-muted)", fontSize:"0.8rem", textAlign:"center", padding:"0.5rem" }}>Delivery Pending</div>
                          )}
                        </div>
                      </div>

                      {/* AI Verification Action */}
                      {d.pickupPhoto && d.deliveryPhoto && d.aiVerificationResult === "pending" && (
                        <button 
                          className="btn-primary w-100" 
                          style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", border:"none" }}
                          onClick={() => runAIVerification(d._id)}
                          disabled={updating === d._id}
                        >
                          {updating === d._id ? "Verifying..." : "🔍 Run AI Authenticity Check"}
                        </button>
                      )}

                      {/* AI Verification Results */}
                      {d.aiVerificationResult === "match" && (
                        <div style={{ color:"#22c55e", fontSize:"0.85rem", marginTop:"0.5rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <span style={{ fontSize:"1.2rem" }}>✅</span> AI Verified Match: Authentic Crop
                        </div>
                      )}
                      
                      {d.aiVerificationResult === "mismatch" && (
                        <div style={{ color:"#ef4444", fontSize:"0.85rem", marginTop:"0.5rem" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontWeight:700 }}>
                            <span style={{ fontSize:"1.2rem" }}>🚨</span> AI Fraud Alert: Product Mismatch
                          </div>
                          <p style={{ marginTop:"0.2rem", color:"var(--text-muted)" }}>{d.aiVerificationNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Waste Management UI */}
                    {d.wasteCollectedKg > 0 && d.status === "delivered" && (
                      <div className="mt-2" style={{ background:"rgba(34, 197, 94, 0.05)", padding:"1rem", borderRadius:"var(--radius-sm)", border:"1px solid rgba(34, 197, 94, 0.2)" }}>
                        <h4 style={{ color: "var(--green-deep)", marginBottom:"0.5rem", fontSize:"0.9rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          🌱 Waste Verification ({d.wasteCollectedKg} kg collected)
                        </h4>
                        
                        <div style={{ marginBottom: "0.5rem" }}>
                          {d.wasteScanStatus === "pending" && (
                            <label className="btn-secondary w-100" style={{ display:"block", textAlign:"center", padding:"0.5rem", cursor:"pointer", fontSize:"0.8rem" }}>
                              📸 Upload Waste Photo & Verify AI
                              <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
                                if (e.target.files[0]) uploadWastePhoto(d._id, e.target.files[0]);
                              }} disabled={updating === d._id} />
                            </label>
                          )}
                          
                          {d.wasteScanStatus === "verified" && (
                            <div style={{ color:"#22c55e", fontSize:"0.85rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                              <span style={{ fontSize:"1.2rem" }}>✅</span> Verified Organic Waste
                            </div>
                          )}

                          {d.wasteScanStatus === "rejected" && (
                            <div style={{ color:"#ef4444", fontSize:"0.85rem", marginTop:"0.5rem" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:"0.3rem", fontWeight:700 }}>
                                <span style={{ fontSize:"1.2rem" }}>❌</span> Rejected: Non-Biodegradable
                              </div>
                              <p style={{ marginTop:"0.2rem", color:"var(--text-muted)" }}>{d.aiVerificationNotes}</p>
                            </div>
                          )}
                        </div>

                        {d.wasteScanStatus === "verified" && !d.wasteDroppedOff && (
                          <button 
                            className="btn-primary w-100" 
                            style={{ background: "var(--green-mid)", border:"none", marginTop: "0.5rem" }}
                            onClick={() => dropoffWaste(d._id)}
                            disabled={updating === d._id}
                          >
                            {updating === d._id ? "Processing..." : "♻️ Drop-off Waste at Storage"}
                          </button>
                        )}
                        {d.wasteDroppedOff && (
                           <div style={{ color:"var(--text-muted)", fontSize:"0.8rem", textAlign:"center", marginTop: "0.5rem" }}>
                             ✓ Dropped off at Admin Storage
                           </div>
                        )}
                      </div>
                    )}


                    {d.status === "delivered" && (
                      <div className="alert alert-success" style={{ marginTop:0 }}>
                        ✅ Delivery completed successfully!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── AVAILABLE ORDERS ── */}
      {tab === "available" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--green-deep)", fontWeight: 600 }}>📍 Radius Filter:</span>
            <select className="rs-select" style={{ width: "auto", padding: "0.4rem 1rem", fontSize: "0.85rem" }} value={radiusFilter} onChange={(e) => setRadiusFilter(e.target.value)}>
              <option value="">Any Distance</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>
          {filteredAvailable.length === 0 ? (
            <div className="glass-card text-center" style={{ padding:"3rem" }}>
              <p style={{ fontSize:"3rem" }}>🔍</p>
              <p style={{ color: "var(--text-muted)", marginTop:"1rem" }}>No orders available for delivery right now. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              {filteredAvailable.map(o => (
                <div className="glass-card" key={o._id} style={{ padding:"1.5rem" }}>
                  <div className="flex-between mb-2">
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <h3 style={{ color: "var(--text-dark)", fontWeight:700, margin: 0 }}>🌾 {o.crop?.name || "Order"}</h3>
                        <button 
                          type="button" 
                          onClick={() => {
                            const text = `Available Order: ${o.quantity || ''} ${o.crop?.unit || 'kg'} of ${o.crop?.name || 'produce'}. Pickup from ${o.farmer?.location || o.crop?.location || 'farmer'}. Deliver to ${o.deliveryAddress || 'customer'}. Delivery fee: ₹${o.deliveryCharges || 30}.`;
                            playTTS(text, lang);
                          }}
                          style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "6px", padding: "2px 6px", cursor: "pointer", color: "#4ade80", display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.72rem" }}
                          title="🔊 Read Order Out Loud"
                        >
                          <Volume2 size={12} /> 🔊 Hear Details
                        </button>
                      </div>
                      <p style={{ color: "var(--text-muted)", fontSize:"0.85rem", marginTop:"0.2rem" }}>
                        {o.quantity} {o.crop?.unit||"kg"} • ₹{(o.totalAmount||0).toLocaleString()}
                      </p>
                    </div>
                    <span className="badge badge-yellow">⏳ Needs Delivery</span>
                  </div>

                  <div className="grid-2" style={{ gap:"0.75rem", marginBottom:"1rem" }}>
                    <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                      <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>📤 PICKUP</p>
                      <p style={{ fontSize:"0.85rem", color: "var(--text-dark)" }}>{o.farmer?.location?.substring(0,40) || o.crop?.location?.substring(0,40) || "Farm"}</p>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                      <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>📍 DELIVER TO</p>
                      <p style={{ fontSize:"0.85rem", color: "var(--text-dark)" }}>{o.deliveryAddress?.substring(0,40) || "Customer"}</p>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                      <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>👤 CUSTOMER</p>
                      <p style={{ fontSize:"0.85rem", color: "var(--text-dark)" }}>{o.customer?.name || "—"}</p>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"var(--radius-sm)", padding:"0.75rem" }}>
                      <p style={{ fontSize:"0.72rem", color: "var(--text-muted)", marginBottom:"0.2rem" }}>💰 DELIVERY FEE</p>
                      <p style={{ fontSize:"0.85rem", color:"var(--yellow-wheat)", fontWeight:700 }}>₹{o.deliveryCharges || 30}</p>
                    </div>
                  </div>

                  <button className="btn-primary" onClick={() => acceptOrder(o._id)} disabled={updating === o._id}>
                    {updating === o._id ? "Accepting..." : "✅ Accept This Delivery"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RIDE-ALONG FREELANCE ROUTE CONFIGURATION ── */}
      {tab === "ridealong" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <h3 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>🎒</span> Ride-Along Freelance Delivery Mode
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.3rem" }}>
                Traveling somewhere? Set your commute route to carry agricultural packages along the way!
              </p>
            </div>
            <span className={`badge ${ridealongForm.isActive ? "badge-green" : "badge-yellow"}`} style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
              {ridealongForm.isActive ? "🟢 Active Commuter" : "⚪ Offline"}
            </span>
          </div>

          {/* Pricing Model Highlight: 50% to ride along, 10% platform, 40% discount to customer */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)", padding: "1rem", borderRadius: "10px" }}>
              <div style={{ color: "#166534", fontSize: "0.75rem", fontWeight: 700 }}>YOUR EARNINGS</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#15803d" }}>50%</div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Of delivery fee paid directly to your wallet</p>
            </div>

            <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "1rem", borderRadius: "10px" }}>
              <div style={{ color: "#1d4ed8", fontSize: "0.75rem", fontWeight: 700 }}>CUSTOMER DISCOUNT</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#2563eb" }}>40% Off</div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Incentivizes customers along your route</p>
            </div>

            <div style={{ background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.25)", padding: "1rem", borderRadius: "10px" }}>
              <div style={{ color: "#92400e", fontSize: "0.75rem", fontWeight: 700 }}>PLATFORM SHARE</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#d97706" }}>10%</div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Covers insurance & tracking telemetry</p>
            </div>
          </div>

          <form onSubmit={saveRidealongRoute} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div className="grid-2" style={{ gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                  📍 Commute Origin (Starting Point):
                </label>
                <input
                  type="text"
                  className="rs-input"
                  required
                  value={ridealongForm.fromLocation}
                  onChange={e => setRidealongForm({ ...ridealongForm, fromLocation: e.target.value })}
                  placeholder="e.g. Secunderabad Station, Medchal..."
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                  🎯 Commute Destination (Ending Point):
                </label>
                <input
                  type="text"
                  className="rs-input"
                  required
                  value={ridealongForm.toLocation}
                  onChange={e => setRidealongForm({ ...ridealongForm, toLocation: e.target.value })}
                  placeholder="e.g. Shamshabad Airport, Gachibowli..."
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                  ⏰ Estimated Departure Time:
                </label>
                <input
                  type="datetime-local"
                  className="rs-input"
                  value={ridealongForm.departureTime}
                  onChange={e => setRidealongForm({ ...ridealongForm, departureTime: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                  Network Availability:
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.88rem", color: "var(--text-dark)" }}>
                  <input
                    type="checkbox"
                    checked={ridealongForm.isActive}
                    onChange={e => setRidealongForm({ ...ridealongForm, isActive: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--green-mid)" }}
                  />
                  <span><strong>Accept Ride-Along Deliveries</strong> (Visible to auto-assign engine)</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={savingRoute}
                style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}
              >
                {savingRoute ? "Saving..." : "💾 Save Ride-Along Route"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "earnings" && (
        <AgentFinancialLedger deliveries={deliveries} onOpenRemit={() => setRemitModal(true)} />
      )}

      {/* ── POLICIES TAB ── */}
      {tab === "policies" && (
        <div className="glass-card">
          <h3 className="section-title">📜 Delivery Agent Policies & Guidelines</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Please adhere to the following rules to ensure a secure and trustworthy marketplace. Violations may result in account suspension.
          </p>
          <div className="grid-2">
            <div style={{ background: "rgba(37, 99, 235, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
              <h4 style={{ color: "#2563eb", marginBottom: "0.5rem" }}>🚚 Timely Delivery</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>Only accept orders you can deliver within the stipulated timeframe. Consistent delays will lower your assignment priority.</p>
            </div>
            <div style={{ background: "rgba(22, 163, 74, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(22, 163, 74, 0.2)" }}>
              <h4 style={{ color: "var(--green-deep)", marginBottom: "0.5rem" }}>✅ Verification is Mandatory</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>You must verify the product quality and quantity against the order details at pickup. Use the "Verify Match" or "Report Mismatch" buttons.</p>
            </div>
            <div style={{ background: "rgba(225, 29, 72, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(225, 29, 72, 0.2)" }}>
              <h4 style={{ color: "#e11d48", marginBottom: "0.5rem" }}>🚨 Misuse of Information</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>Customer and Farmer details (phone, address) are strictly for delivery purposes. Misuse will lead to immediate termination.</p>
            </div>
            <div style={{ background: "rgba(217, 119, 6, 0.05)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(217, 119, 6, 0.2)" }}>
              <h4 style={{ color: "#d97706", marginBottom: "0.5rem" }}>📍 Location Tracking & Speed SLA</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-mid)" }}>You must allow GPS tracking while on duty. Early deliveries earn up to +50 speed points & instant cash tips, while delays reduce points unless a valid delay reason is logged.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── DELAY REASON & WAIVER MODAL ── */}
      {delayModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem"
        }}>
          <div style={{
            background: "white", borderRadius: "16px", maxWidth: "520px", width: "100%",
            padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ color: "#b45309", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: 0 }}>
              ⚠️ Log Delay Reason & Request Waiver
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
              Facing unexpected transit delays? Select a valid reason so that late points reduction and score penalties are waived for order <strong>{delayModal.trackingCode}</strong>.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                  Select Primary Delay Cause:
                </label>
                <select
                  value={delayReason}
                  onChange={e => setDelayReason(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                >
                  <option value="Heavy Traffic Jam">🚦 Heavy Road Traffic / Gridlock</option>
                  <option value="Monsoon Rain & Waterlogging">🌧️ Heavy Rain / Waterlogged Roads</option>
                  <option value="Farmer Packing Delay">👨‍🌾 Farmer Harvesting / Packaging Delay</option>
                  <option value="Vehicle Breakdown">🛵 Vehicle Puncture / Mechanical Issue</option>
                  <option value="Customer Address Unreachable">📍 Incorrect / Unreachable Customer Address</option>
                  <option value="Other Unavoidable Reason">❓ Other Transit Emergency</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                  Additional Notes (Optional):
                </label>
                <textarea
                  rows={3}
                  value={delayNote}
                  onChange={e => setDelayNote(e.target.value)}
                  placeholder="Provide any details (e.g., stuck on Outer Ring Road for 20 mins)..."
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button className="btn-secondary" onClick={() => setDelayModal(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={logDelayReason} style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}>
                🛡️ Submit Delay Waiver
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocModal && (
        <LocationUpdateModal
          isOpen={showLocModal}
          onClose={() => setShowLocModal(false)}
        />
      )}

      {/* ─── MODAL 1: AI FARM PRODUCE INSPECTION & PACKING ─── */}
      {inspectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000, padding: "1rem"
        }}>
          <div style={{
            background: "white", borderRadius: "20px", maxWidth: "600px", width: "100%", maxHeight: "90vh",
            overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", border: "1px solid #e2e8f0"
          }}>
            <div style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #064e3b 0%, #166534 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  🌾 AI Farm Produce Quality & Inspection
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#bbf7d0" }}>
                  Verify whether harvested produce matches listed specifications before packing.
                </p>
              </div>
              <button onClick={() => setInspectModal(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Target Order Info */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>ORDERED CROP</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b" }}>
                    {inspectModal.order?.crop?.name || inspectModal.order?.productSnapshot?.name || "Farm Produce"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                    Quantity: {inspectModal.order?.quantity} {inspectModal.order?.crop?.unit || "kg"} • {inspectModal.order?.crop?.isOrganic ? "🌱 Certified Organic" : "Standard Harvest"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>FARM PICKUP LOCATION</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#166534" }}>
                    {inspectModal.pickupLocation || inspectModal.order?.farmer?.location || "Farm Plot"}
                  </div>
                </div>
              </div>

              {/* Photo Upload / Capture */}
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                  📸 Capture Live Farm Produce Photo at Pickup:
                </label>
                <div style={{
                  border: "2px dashed #94a3b8", borderRadius: "14px", padding: "1.5rem",
                  textAlign: "center", background: inspectPreview ? "#f0fdf4" : "#f8fafc", cursor: "pointer"
                }} onClick={() => document.getElementById("produce-camera-input")?.click()}>
                  {inspectPreview ? (
                    <div>
                      <img src={inspectPreview} alt="Produce Preview" style={{ maxHeight: "200px", borderRadius: "10px", objectFit: "cover", margin: "0 auto", display: "block", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} />
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>
                        ✅ Live photo selected. Click Run Inspection below.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud size={40} color="#64748b" style={{ margin: "0 auto 0.5rem auto", display: "block" }} />
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>Tap to Snap Photo with Camera or Upload</div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>Supports JPG, PNG, WEBP live farm captures</p>
                    </div>
                  )}
                  <input
                    id="produce-camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setInspectImageFile(e.target.files[0]);
                        setInspectPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Run AI Scan Button */}
              {inspectImageFile && !inspectResult && (
                <button
                  type="button"
                  onClick={handleRunAIInspection}
                  disabled={inspecting}
                  style={{
                    width: "100%", padding: "0.9rem", borderRadius: "12px",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                    color: "white", fontWeight: 800, fontSize: "1rem", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)"
                  }}
                >
                  {inspecting ? <Loader2 size={20} className="spin" /> : <Sparkles size={20} />}
                  {inspecting ? "Analyzing Produce Freshness & Match via Gemini AI..." : "🤖 Run AI Quality & Authenticity Check"}
                </button>
              )}

              {/* AI Inspection Result Card */}
              {inspectResult && (
                <div style={{
                  background: inspectResult.isMatch ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: inspectResult.isMatch ? "1.5px solid #86efac" : "1.5px solid #fca5a5",
                  borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {inspectResult.isMatch ? <CheckCircle2 size={22} color="#16a34a" /> : <ShieldAlert size={22} color="#dc2626" />}
                      <strong style={{ fontSize: "1.05rem", color: inspectResult.isMatch ? "#166534" : "#991b1b" }}>
                        {inspectResult.isMatch ? "✅ Verified Authentic Match" : "⚠️ Product Mismatch Detected"}
                      </strong>
                    </div>
                    <span style={{
                      background: inspectResult.isMatch ? "#dcfce7" : "#fee2e2",
                      color: inspectResult.isMatch ? "#166534" : "#991b1b",
                      padding: "4px 10px", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 800
                    }}>
                      {inspectResult.grade}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                      <span>Freshness Confidence Score:</span>
                      <span style={{ color: "#16a34a" }}>{inspectResult.freshnessScore}%</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "100px", overflow: "hidden" }}>
                      <div style={{ width: `${inspectResult.freshnessScore}%`, height: "100%", background: "linear-gradient(90deg, #22c55e, #16a34a)" }}></div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.4 }}>
                    <strong>AI Notes:</strong> {inspectResult.summary}
                  </p>

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectModal(null);
                        setMsg({ type: "success", text: "✅ Produce verified and packed. Proceeding to transit!" });
                      }}
                      style={{
                        flex: 1, padding: "0.85rem", borderRadius: "10px",
                        background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white",
                        border: "none", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer"
                      }}
                    >
                      📦 Confirm Quality & Start Transit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SECURE DOORSTEP OTP HANDOVER & COD COLLECTION ─── */}
      {handoverModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000, padding: "1rem"
        }}>
          <div style={{
            background: "white", borderRadius: "20px", maxWidth: "520px", width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", overflow: "hidden", border: "1px solid #e2e8f0"
          }}>
            <div style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  🔑 Secure Doorstep OTP Handover
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#bfdbfe" }}>
                  Verify customer OTP & reconcile COD payments atomically.
                </p>
              </div>
              <button onClick={() => setHandoverModal(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Payment Type & COD Collection Alert */}
              {handoverModal.order?.paymentMode === "cod" ? (
                <div style={{
                  background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: "12px",
                  padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem"
                }}>
                  <Coins size={28} color="#b45309" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>
                      CASH ON DELIVERY (COD) ORDER
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#78350f" }}>
                      Collect ₹{handoverModal.order?.totalAmount?.toLocaleString()} Cash
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#92400e" }}>
                      Please collect exact cash from customer before entering OTP. This will be added to your COD cash balance.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: "12px",
                  padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem"
                }}>
                  <CheckCircle2 size={26} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#166534" }}>PREPAID ONLINE ORDER</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#14532d" }}>
                      No Cash to Collect (₹0)
                    </div>
                  </div>
                </div>
              )}

              {/* 6-Digit OTP Entry */}
              <div>
                <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                  Enter 6-Digit Delivery OTP (Customer shares this):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={handoverOtp}
                  onChange={(e) => setHandoverOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  style={{
                    width: "100%", textAlign: "center", fontSize: "1.8rem", fontWeight: 800,
                    letterSpacing: "12px", padding: "0.75rem", borderRadius: "12px",
                    border: "2px solid #3b82f6", outline: "none", color: "#1e3a8a"
                  }}
                  autoFocus
                />
              </div>

              {/* Circular Economy Waste (Optional) */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                  🌱 Kitchen Organic Waste Donated by Customer (kg):
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={handoverWasteKg}
                  onChange={(e) => setHandoverWasteKg(e.target.value)}
                  placeholder="e.g. 2.5 kg (leaves 0 if none)"
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              {/* Complete Handover Button */}
              <button
                type="button"
                onClick={handleCompleteHandover}
                disabled={handoverSubmitting || handoverOtp.length !== 6}
                style={{
                  width: "100%", padding: "1rem", borderRadius: "12px",
                  background: handoverOtp.length === 6 ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" : "#cbd5e1",
                  color: "white", fontWeight: 800, fontSize: "1.05rem", border: "none",
                  cursor: handoverOtp.length === 6 ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  boxShadow: handoverOtp.length === 6 ? "0 4px 14px rgba(22, 163, 74, 0.35)" : "none"
                }}
              >
                {handoverSubmitting ? <Loader2 size={20} className="spin" /> : <ShieldCheck size={20} />}
                {handoverSubmitting ? "Verifying OTP & Completing Delivery..." : "✅ Verify OTP & Finalize Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: REMIT COD CASH TO ADMIN ─── */}
      {remitModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000, padding: "1rem"
        }}>
          <div style={{
            background: "white", borderRadius: "20px", maxWidth: "480px", width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", overflow: "hidden", border: "1px solid #e2e8f0"
          }}>
            <div style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  💵 Remit COD Cash to Admin
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#ffe4e6" }}>
                  Deposit collected Cash on Delivery funds back to platform account.
                </p>
              </div>
              <button onClick={() => setRemitModal(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRemitCodCash} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "0.78rem", color: "#be123c", fontWeight: 700 }}>OUTSTANDING COD CASH IN HAND</div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#9f1239" }}>
                  ₹{(user?.cashInHand || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.3rem" }}>
                  Remittance Amount (₹):
                </label>
                <input
                  type="number"
                  required
                  max={user?.cashInHand || 0}
                  value={remitAmount || user?.cashInHand || ""}
                  onChange={(e) => setRemitAmount(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem", fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.3rem" }}>
                  Payment Method:
                </label>
                <select
                  value={remitMethod}
                  onChange={(e) => setRemitMethod(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem" }}
                >
                  <option value="UPI">UPI Direct Transfer (Admin QR / VPA)</option>
                  <option value="Bank Transfer">NEFT / IMPS Bank Deposit</option>
                  <option value="Hub Deposit">Cash Deposit at Logistics Hub</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.3rem" }}>
                  UTR / Transaction Reference (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref # 42819830219"
                  value={remitTxRef}
                  onChange={(e) => setRemitTxRef(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setRemitModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={remitting || (user?.cashInHand || 0) <= 0}
                  style={{
                    flex: 2, padding: "0.85rem", borderRadius: "10px",
                    background: "linear-gradient(135deg, #e11d48, #be123c)", color: "white",
                    border: "none", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer"
                  }}
                >
                  {remitting ? "Submitting..." : "💵 Submit COD Remittance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </>
      )}
    </div>
  );
}

