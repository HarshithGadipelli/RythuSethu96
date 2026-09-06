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
import { Volume2 } from "lucide-react";
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
  const [radiusFilter, setRadiusFilter] = useState("");
  const [perfData, setPerfData] = useState({ totalCompleted: 0, earlyDeliveries: 0, lateDeliveries: 0, onTimeRate: 100, totalSpeedPoints: 0, totalSpeedCash: 0, totalPenaltyPoints: 0 });
  const [delayModal, setDelayModal] = useState(null);
  const [delayReason, setDelayReason] = useState("Traffic Jam");
  const [delayNote, setDelayNote] = useState("");
  const { listening, activeField, interim, startListening, stopListening } = useVoiceInput(lang || "en");
  const [showPledge, setShowPledge] = useState(user?.acceptedTerms === false);

  useEffect(() => { 
    loadAll();
    const socket = io(BASE_URL);
    socket.on("delivery_assigned", () => loadAll());
    socket.on("delivery_updated", () => loadAll());
    socket.on("order_created", () => fetchAvailable());

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

  const optimizeRoute = async () => {
    if (!agentPos) {
      setMsg({ type: "error", text: "Waiting for GPS location..." });
      return;
    }
    const activeDeliveries = deliveries.filter(d => ["assigned", "picked_up", "in_transit"].includes(d.status));
    if (activeDeliveries.length < 2) {
      setMsg({ type: "info", text: "Need at least 2 active deliveries to optimize." });
      return;
    }

    setOptimizing(true);
    setMsg({ type: "info", text: "🗺️ Calculating optimal route using AI..." });
    try {
      const res = await API.post("/ml/route-optimize", { 
        agentLat: agentPos.lat, 
        agentLng: agentPos.lng, 
        orders: activeDeliveries 
      });
      setRouteData(res.data);
      setMsg({ type: "success", text: `✅ Route optimized! Shortest path calculated.` });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to optimize route." });
    } finally {
      setOptimizing(false);
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
            {user?.agentType === 'truck' ? '🚛' : '🛵'} {t("welcome")}, {user?.name?.split(" ")[0] || "Agent"}
            <span className="badge badge-green" style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              {user?.agentType === 'truck' ? 'Heavy / Long Distance' : 'Light / Local'} Agent
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
          { k:"earnings", l:"💰 Earnings" },
          { k:"tips", l:"💡 Smart Tips" }
        ].map(tb => (
          <button key={tb.k} className={`tab-btn ${tab===tb.k?"active":""}`} onClick={() => setTab(tb.k)}>
            {tb.l}
          </button>
        ))}
      </div>

      {tab === "my" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
          <button className="btn-primary" onClick={optimizeRoute} disabled={optimizing || deliveries.filter(d=>["assigned", "picked_up", "in_transit"].includes(d.status)).length < 2} style={{ width:"100%", background: "linear-gradient(135deg, #eab308, #ca8a04)", border: "none" }}>
            {optimizing ? `🔄 Optimizing...` : `🗺️ Smart Route Optimize`}
          </button>
        </div>
      )}

      {routeData && tab === "my" && (
        <div className="glass-card mb-3" style={{ background:"var(--green-pale)", border:"1px solid var(--green-mid)" }}>
            <h3 style={{ color:"var(--green-deep)", marginBottom:"0.5rem" }}>{t("routeGenerated")}</h3>
            <p style={{ color:"var(--green-mid)", fontSize:"0.9rem", marginBottom:"1rem" }}>
              {t("totalDistance")}: {parseFloat(routeData.totalDistance).toFixed(2)} km
            </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            {routeData.optimizedRoute.map((stop, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ background: "var(--gradient-btn)", color: "white", padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
                  {i+1}. {stop.action} at {stop.location}
                </div>
                {i < routeData.optimizedRoute.length - 1 && <span style={{ color: "var(--text-muted)" }}>➡️</span>}
              </div>
            ))}
          </div>
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

                    {/* Actions */}
                    {d.status !== "delivered" && d.status !== "failed" && next && (
                      <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                        {d.status === "in_transit" && (
                          <button 
                            className="btn-secondary" 
                            style={{ flex: 1 }}
                            disabled={updating === d._id} 
                            onClick={() => generateOtp(d)}
                          >
                            🔑 Gen OTP
                          </button>
                        )}
                        <button
                          className="btn-primary"
                          style={{ flex: 2 }}
                          disabled={updating === d._id}
                          onClick={() => updateStatus(d, next)}
                        >
                          {updating === d._id ? t("loading") : `${STATUS_ICONS[next]} Mark as ${STATUS_LABELS[next]}`}
                        </button>
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

      {tab === "earnings" && (
        <AgentFinancialLedger deliveries={deliveries} />
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

      </>
      )}
    </div>
  );
}

