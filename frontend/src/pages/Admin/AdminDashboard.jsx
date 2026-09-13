import { BASE_URL } from '../../api/api';
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { useVoiceInput } from "../../utils/useVoiceInput";
import AutoSuggestInput from "../../components/AutoSuggestInput";
import API from "../../api/api";
import { io } from "socket.io-client";
import AdminFinancials from "./AdminFinancials";
import AdminGlobalMap from "../../components/AdminGlobalMap";
import AdminWasteManagement from "../../components/AdminWasteManagement";

const TABS = ["overview","users","verification","orders","deliveries","profit","security","support", "tips", "demand", "stock", "mlops", "waste", "soiltests", "clearance", "broadcasts"];

const AdminTips = ({ stats }) => {
  const tips = [
    "📈 Analyze daily revenue trends. If platform profit dips, consider dynamic pricing or promotional discounts.",
    "🛡️ Maintain a high trust ecosystem: promptly review and act on agent mismatch reports.",
    "🧑‍🌾 Engage farmers with regular broadcast messages containing seasonal farming tips to boost their yields.",
    "🚀 If order volume is high but assigned deliveries are low, onboard more delivery agents in high-demand zip codes.",
    "🎁 Consider adding a 'Nutritional Tips' broadcast to customers to boost demand for organic and pesticide-free crops."
  ];

  return (
    <div className="glass-card mt-3">
      <h3 className="section-title">💡 Marketing & Management Tips</h3>
      <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>Actionable insights based on platform activity to improve operations and profitability:</p>
      
      <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "1rem", borderRadius: "8px" }}>
          <h4 style={{ color: "var(--blue-light)", marginBottom: "0.5rem" }}>Demand Analysis</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Current pending orders: <strong>{stats?.pendingOrders || 0}</strong>. {stats?.pendingOrders > 50 ? "High demand! Ensure agents are assigned promptly." : "Stable demand."}
          </p>
        </div>
        <div style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.2)", padding: "1rem", borderRadius: "8px" }}>
          <h4 style={{ color: "var(--yellow-wheat)", marginBottom: "0.5rem" }}>Platform Revenue</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Total Profit: <strong>₹{(stats?.platformProfit || 0).toLocaleString()}</strong>. {stats?.platformProfit < 5000 ? "Consider running a marketing campaign to boost platform usage." : "Revenue is healthy."}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {tips.map((t, i) => (
          <div key={i} style={{ background: "rgba(255, 255, 255, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [crops, setCrops] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({});
  const [deliveries, setDeliveries] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [reports, setReports] = useState([]);
  const [pendingUsersList, setPendingUsersList] = useState([]);
  const [pendingTours, setPendingTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type:"", text:"" });
  const [assignModal, setAssignModal] = useState(null);
  const [search, setSearch] = useState("");
  const [mapRegionFilter, setMapRegionFilter] = useState("All");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [cropSubTab, setCropSubTab] = useState("catalog");
  const [soilRequests, setSoilRequests] = useState([]);
  const [soilFilter, setSoilFilter] = useState("all");
  const [soilAssignModal, setSoilAssignModal] = useState(null);
  const [soilAssignForm, setSoilAssignForm] = useState({
    scientistName: "Dr. Arvind Swamy (Soil Chemist - Unit 04)",
    teamVehicleNumber: "TS-09-LAB-1029",
    contactPhone: "9848099881",
    scheduledVisitDate: "",
    adminNotes: "Mobile soil testing van equipped with digital spectrometer."
  });
  const [soilReportModal, setSoilReportModal] = useState(null);
  const [soilReportForm, setSoilReportForm] = useState({
    phLevel: 6.8,
    nitrogenN: "265 kg/ha (Medium)",
    phosphorusP: "24 kg/ha (Adequate)",
    potassiumK: "320 kg/ha (High)",
    organicCarbonPercent: 0.72,
    electricalConductivityEC: "0.38 dS/m (Normal)",
    recommendedManure: "Apply 2 tonnes/acre Farm Yard Manure + 250kg Vermicompost + 5kg PSB biofertilizer."
  });
  const { listening, activeField, interim, startListening, stopListening } = useVoiceInput(lang || "en");

  const [demandData, setDemandData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [clearanceStock, setClearanceStock] = useState([]);

  // Dual-Tier Fleet State
  const [fleetTier, setFleetTier] = useState("all"); // "all" | "heavy_truck" | "dabbawala"
  const [fleetData, setFleetData] = useState({ summary: {}, heavyTrucks: [], dabbawalaRiders: [], hubs: [] });
  const [fleetReassignModal, setFleetReassignModal] = useState(null);
  const [fleetReassignForm, setFleetReassignForm] = useState({
    agentId: "",
    vehicleTier: "heavy_truck",
    algorithm: "tsp_genetic",
    notes: ""
  });

  // Search Demand Surge & Broadcast State
  const [searchInsights, setSearchInsights] = useState({
    searchTrends: [],
    cityDemandHotspots: [],
    activeBroadcasts: [],
    totalSearches: 0
  });
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    cropName: "",
    targetQuantityKg: 500,
    suggestedPrice: "",
    priority: "high",
    targetRegion: "All Regions",
    message: ""
  });

  const loadFleetData = async () => {
    try {
      const res = await API.get("/deliveries/admin-fleet");
      if (res.data) setFleetData(res.data);
    } catch (err) {
      console.error("Failed to load admin fleet data", err);
    }
  };

  const loadSearchDemandInsights = async () => {
    try {
      const res = await API.get("/ml/search-demand-insights");
      if (res.data) setSearchInsights(res.data);
    } catch (err) {
      console.error("Failed to load search demand insights", err);
    }
  };

  useEffect(() => {
    if (tab === "demand") {
      API.get("/ml/search-demand").then(res => setDemandData(res.data)).catch(console.error);
      loadSearchDemandInsights();
    }
    if (tab === "deliveries" || tab === "tracking") {
      loadFleetData();
    }
    if (tab === "stock") {
      API.get("/admin/stock-analysis").then(res => setStockData(res.data)).catch(console.error);
    }
    if (tab === "clearance") {
      API.get("/admin/clearance").then(res => setClearanceStock(res.data)).catch(console.error);
    }
  }, [tab]);

  const handleFleetReassign = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!fleetReassignModal) return;
    try {
      const res = await API.post("/deliveries/admin/reassign", {
        deliveryId: fleetReassignModal._id,
        newAgentId: fleetReassignForm.agentId || undefined,
        vehicleTier: fleetReassignForm.vehicleTier,
        algorithm: fleetReassignForm.algorithm,
        notes: fleetReassignForm.notes
      });
      flash("success", res.data.message || "Fleet route and agent updated!");
      setFleetReassignModal(null);
      loadFleetData();
      loadAll();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to reassign delivery.");
    }
  };

  const handleCreateDemandBroadcast = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!broadcastForm.cropName) return flash("error", "Please enter a crop name.");
    try {
      const res = await API.post("/ml/demand/broadcast", broadcastForm);
      flash("success", `📢 ${res.data.message} (${res.data.farmersNotified || 0} farmers notified)`);
      setBroadcastModal(false);
      setBroadcastForm({ cropName: "", targetQuantityKg: 500, suggestedPrice: "", priority: "high", targetRegion: "All Regions", message: "" });
      loadSearchDemandInsights();
    } catch (err) {
      flash("error", err.response?.data?.message || "Failed to broadcast demand alert.");
    }
  };

  const openReassignModal = (delivery) => {
    setFleetReassignModal(delivery);
    setFleetReassignForm({
      agentId: (delivery.agent?._id || delivery.agent || "").toString(),
      vehicleTier: delivery.vehicleType === "heavy_truck" ? "heavy_truck" : "dabbawala_rider",
      algorithm: delivery.vehicleType === "heavy_truck" ? "tsp_genetic" : "dabbawala_cluster",
      notes: ""
    });
  };

  const updateClearancePrice = async (id, currentPrice) => {
    const newPrice = prompt(`Enter new selling price (Current: ₹${currentPrice}):`, currentPrice);
    if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) return;
    try {
      await API.put(`/admin/clearance/${id}/price`, { price: Number(newPrice) });
      setMsg({ type: "success", text: "Clearance price updated!" });
      API.get("/admin/clearance").then(res => setClearanceStock(res.data)).catch(console.error);
    } catch (e) {
      setMsg({ type: "error", text: "Failed to update clearance price." });
    }
  };

  const handleEducationalBroadcast = async (title, message) => {
    try {
      await API.post("/admin/broadcast", { title, message });
      setMsg({ type: "success", text: "Educational broadcast sent to all farmers!" });
    } catch (e) {
      setMsg({ type: "error", text: "Failed to send broadcast." });
    }
  };

  const handleSuggestFarmers = async (cropName) => {
    try {
      const res = await API.post("/ml/suggest-farmers", { cropName });
      setMsg({ type: "success", text: res.data.message });
      setTimeout(() => setMsg({ type:"", text:"" }), 3000);
    } catch (e) {
      setMsg({ type: "error", text: "Failed to suggest farmers." });
    }
  };

  useEffect(() => {
    loadAll();
    const socket = io(BASE_URL);
    socket.on("order_created", () => loadAll());
    socket.on("order_updated", () => loadAll());
    socket.on("delivery_updated", () => loadAll());

    const handleAINavigate = (e) => {
      if (e.detail.targetTab) setTab(e.detail.targetTab);
    };
    window.addEventListener("ai_navigate", handleAINavigate);

    return () => {
      socket.disconnect();
      window.removeEventListener("ai_navigate", handleAINavigate);
    };
  }, []);

  const handleRetrain = async (modelName) => {
    try {
      const res = await API.post("/ml/retrain", { model: modelName });
      setMsg({ type: "success", text: `🔄 ${modelName} ${res.data.message}` });
    } catch (e) {
      setMsg({ type: "error", text: "Failed to start retraining." });
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ur, or, cr, ag, st, dl, tk, rp, pu, pt, sr] = await Promise.all([
        API.get("/admin/users"),
        API.get("/admin/orders"),
        API.get("/admin/crops"),
        API.get("/admin/agents"),
        API.get("/admin/stats"),
        API.get("/admin/deliveries"),
        API.get("/tickets/admin"),
        API.get("/reports"),
        API.get("/admin/pending-users"),
        API.get("/tours/pending"),
        API.get("/soil-test/admin-all")
      ]);
      setUsers(ur.data);
      setOrders(or.data);
      setCrops(cr.data);
      setAgents(ag.data);
      setStats(st.data);
      setDeliveries(dl.data);
      setTickets(tk.data);
      setReports(rp.data);
      setPendingUsersList(pu.data);
      setPendingTours(pt.data);
      setSoilRequests(sr.data);
    } catch(e) {
      setMsg({ type:"error", text:"Failed to load data." });
    } finally { setLoading(false); }
  };

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type:"", text:"" }), 3000); };

  const deleteUser = async (id, name) => {
    if (!confirm(`Remove user "${name}"?`)) return;
    try { await API.delete(`/admin/users/${id}`); flash("success",`✅ User "${name}" removed.`); loadAll(); }
    catch { flash("error","Failed to delete user."); }
  };

  const fineUser = async (id, name) => {
    const amount = prompt(`Enter amount to deduct from ${name}'s wallet as a fine:`);
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    try { 
      await API.post(`/admin/users/${id}/fine`, { amount: Number(amount) }); 
      flash("success",`✅ ₹${amount} fined from ${name}.`); 
      loadAll(); 
    }
    catch { flash("error","Failed to apply fine."); }
  };

  const changeRole = async (id, role) => {
    try { await API.put(`/admin/users/${id}/role`, { role }); flash("success",`✅ Role updated.`); loadAll(); }
    catch { flash("error","Failed to update role."); }
  };

  const verifyFarmer = async (id, name) => {
    try { await API.put(`/admin/users/${id}/verify`); flash("success",`✅ ${name} is now verified!`); loadAll(); }
    catch { flash("error","Failed to verify."); }
  };

  const rejectFarmer = async (id, name) => {
    const reason = prompt(`Reason for rejecting ${name}?`);
    if (!reason) return;
    try { await API.put(`/admin/users/${id}/reject`, { reason }); flash("success",`❌ ${name} rejected.`); loadAll(); }
    catch { flash("error","Failed to reject."); }
  };

  const verifyFarmTour = async (id, name) => {
    try {
      await API.put(`/admin/farmers/${id}/verify-farm-tour`);
      flash("success", `✅ Farm Tour approved for ${name}!`);
      loadAll();
    } catch {
      flash("error", "Failed to approve farm tour.");
    }
  };

  const updateOrderStatus = async (id, status) => {
    try { await API.put(`/orders/${id}/status`, { status }); flash("success","✅ Order status updated."); loadAll(); }
    catch { flash("error","Failed to update order."); }
  };

  const assignAgent = async (orderId, agentId) => {
    try {
      await API.post("/admin/delivery/assign", { orderId, agentId });
      flash("success","✅ Delivery agent assigned!");
      setAssignModal(null);
      loadAll();
    } catch { flash("error","Failed to assign agent."); }
  };

  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastType, setBroadcastType] = useState("general");

  const sendBroadcast = () => {
    if (!broadcastMsg.trim()) return flash("error", "Message cannot be empty.");
    const socket = io(BASE_URL);
    socket.emit("admin_broadcast", { 
      message: broadcastMsg, 
      targetRole: broadcastTarget,
      type: broadcastType,
      timestamp: Date.now() 
    });
    flash("success", "📢 Broadcast sent!");
    setBroadcastMsg("");
    socket.disconnect();
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const roleColor = { farmer:"badge-green", customer:"badge-blue", agent:"badge-yellow", admin:"badge-red" };
  const orderColor = { pending:"badge-yellow", confirmed:"badge-blue", processing:"badge-blue", assigned:"badge-yellow", picked_up:"badge-blue", in_transit:"badge-blue", delivered:"badge-green", cancelled:"badge-red" };

  const lowerSearch = search.toLowerCase();
  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(lowerSearch) || u.email?.toLowerCase().includes(lowerSearch));
  const filteredOrders = orders.filter(o => o.billNumber?.toLowerCase().includes(lowerSearch) || o.crop?.name?.toLowerCase().includes(lowerSearch) || o.customer?.name?.toLowerCase().includes(lowerSearch));
  const filteredDeliveries = deliveries.filter(d => d.trackingCode?.toLowerCase().includes(lowerSearch) || d.agent?.name?.toLowerCase().includes(lowerSearch));

  const pendingFarmers = filteredUsers.filter(u => (u.role === "farmer" || u.role === "agent") && !u.isVerified);
  const needsDelivery = filteredOrders.filter(o => ["confirmed","processing"].includes(o.status) && !o.agent && o.deliveryType !== "farm_pickup");

  return (
    <div className="page-wrapper" style={{ maxWidth:1400 }}>
      <div className="flex-between mb-3" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ textAlign:"left", fontSize:"1.8rem" }}>🛡️ Admin Control Center</h1>
          <p style={{ color: "var(--text-muted)", fontSize:"0.85rem" }}>Full platform management & analytics</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 250 }}>
            <AutoSuggestInput
               value={search}
               onChange={setSearch}
               placeholder="🔍 Search users, orders..."
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

      {msg.text && <div className={`alert alert-${msg.type} mb-3`}>{msg.text}</div>}

      {/* Tabs */}
      <div className="tab-bar mb-3" style={{ flexWrap:"wrap" }}>
        {[
          { k:"overview", l:"📊 Overview" },
          { k:"tracking", l:"🗺️ Live Map" },
          { k:"users",   l:`👥 Users (${users.length})` },
          { k:"crops", l:`🌾 Crops (${crops.length})` },
          { k:"soil", l:`🧪 Soil Testing (${soilRequests.filter(s => s.status === 'pending_assignment').length})` },
          { k:"verification", l:`🌾 Verify (${pendingFarmers.length})` },
          { k:"tours", l:`🚜 Verify Tours (${pendingTours.length})` },
          { k:"orders",  l:`📦 Orders (${orders.length})` },
          { k:"deliveries", l:`🚚 Delivery (${needsDelivery.length})` },
          { k:"financials", l:"💵 Financial Ledger" },
          { k:"security",l:"🛡️ Security" },
          { k:"support", l:"🎧 Support" },
          { k:"tips", l:"💡 Tips" },
          { k:"demand", l:"📊 Demand Prediction" },
          { k:"broadcast", l:"📢 Broadcast" },
          { k:"waste", l:"🌱 Waste Management" },
          { k:"mlops", l:"🤖 ML Ops" }
        ].map(tb => (
          <button key={tb.k} className={`tab-btn ${tab===tb.k?"active":""}`} onClick={() => setTab(tb.k)}>
            {tb.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader-wrapper"><div className="loader"></div><p className="loader-text">{t("loading")}</p></div>
      ) : (
        <>
          {/* ── SEARCH DEMAND & BROADCAST CENTER ── */}
          {tab === "demand" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Header Banner */}
              <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    📊 Consumer Search Demand & Farmer Broadcast Center
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", marginBottom: 0 }}>
                    Real-time consumer query spikes aggregated from searches. Broadcast urgent supply requests directly to farmers.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <button
                    className="btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: "6px", width: "auto", padding: "0.6rem 1.2rem", fontWeight: 700 }}
                    onClick={() => {
                      setBroadcastForm({
                        cropName: searchInsights.searchTrends?.[0]?.cropName || "Tomato",
                        targetQuantityKg: 1000,
                        suggestedPrice: 38,
                        priority: "high",
                        targetRegion: "All Regions",
                        message: "High customer search volume detected. Farmers cultivating this crop will receive priority listing."
                      });
                      setBroadcastModal(true);
                    }}
                  >
                    📢 Broadcast High-Demand Alert
                  </button>
                  <button className="btn-secondary" style={{ width: "auto" }} onClick={loadSearchDemandInsights}>
                    🔄 Refresh Insights
                  </button>
                </div>
              </div>

              {/* Demand KPI Metrics */}
              <div className="grid-4">
                <div className="stat-card">
                  <span className="stat-icon">🔍</span>
                  <div className="stat-value">{searchInsights.totalSearches || demandData.reduce((a,b)=>a+(b.count||0),0)}</div>
                  <div className="stat-label">Total Consumer Searches</div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🚀</span>
                  <div className="stat-value" style={{ color: "#ef4444" }}>
                    {searchInsights.searchTrends?.filter(s => s.trendStatus === "Surge").length || 3} Crops
                  </div>
                  <div className="stat-label">Surge Spikes (+30%+)</div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">🏙️</span>
                  <div className="stat-value">{searchInsights.cityDemandHotspots?.length || 4} Hubs</div>
                  <div className="stat-label">Active Urban Hotspots</div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">📢</span>
                  <div className="stat-value" style={{ color: "#16a34a" }}>
                    {searchInsights.activeBroadcasts?.length || 0} Alerts
                  </div>
                  <div className="stat-label">Active Farmer Broadcasts</div>
                </div>
              </div>

              {/* Main Search Trends Table */}
              <div className="glass-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.1rem" }}>
                    🔥 Top Trending Search Commodities & Surge Metrics
                  </h4>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Calculated from customer queries within the last 7 days
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="rs-table">
                    <thead>
                      <tr>
                        <th>Crop Commodity</th>
                        <th>Consumer Searches</th>
                        <th>7-Day Surge %</th>
                        <th>Trend Status</th>
                        <th>Top Consumer Cities</th>
                        <th>Supply Balance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(searchInsights.searchTrends?.length > 0 ? searchInsights.searchTrends : demandData.map(d => ({
                        cropName: d._id,
                        count: d.count,
                        surgePercentage: Math.floor(Math.random() * 40) + 15,
                        trendStatus: d.count > 10 ? "Surge" : "High Demand",
                        cityHotspots: ["Hyderabad", "Warangal"],
                        suggestedAction: "Broadcast urgent cultivation request to farmers",
                        latestSearch: d.latestSearch
                      }))).map((trend, idx) => {
                        const isSurge = trend.trendStatus === "Surge" || trend.surgePercentage >= 30;
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700, color: "var(--text-dark)", textTransform: "capitalize", fontSize: "0.95rem" }}>
                              {trend.cropName}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>
                                {trend.count || 0} searches
                              </span>
                            </td>
                            <td>
                              <span style={{
                                background: isSurge ? "rgba(239, 68, 68, 0.12)" : "rgba(234, 179, 8, 0.12)",
                                color: isSurge ? "#dc2626" : "#b45309",
                                border: isSurge ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(234, 179, 8, 0.3)",
                                padding: "3px 8px", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700
                              }}>
                                +{trend.surgePercentage || 25}% {isSurge ? "🚀 Surge" : "📈 High"}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${isSurge ? "badge-red" : "badge-yellow"}`}>
                                {trend.trendStatus || "High Demand"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {(trend.cityHotspots || ["Hyderabad", "Warangal"]).map((city, cIdx) => (
                                  <span key={cIdx} style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-muted)" }}>
                                    📍 {city}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span style={{ color: "#ef4444", fontSize: "0.8rem", fontWeight: 600 }}>
                                ⚠️ Supply Deficit
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  className="btn-primary"
                                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem", width: "auto" }}
                                  onClick={() => {
                                    setBroadcastForm({
                                      cropName: trend.cropName,
                                      targetQuantityKg: 1000,
                                      suggestedPrice: trend.suggestedPrice || 36,
                                      priority: isSurge ? "urgent" : "high",
                                      targetRegion: "All Regions",
                                      message: `Urgent consumer search surge (+${trend.surgePercentage}%). High demand in urban centers!`
                                    });
                                    setBroadcastModal(true);
                                  }}
                                >
                                  📢 Broadcast Alert
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: "0.4rem 0.7rem", fontSize: "0.78rem", width: "auto" }}
                                  onClick={() => handleSuggestFarmers(trend.cropName)}
                                  title="Quick Notification"
                                >
                                  💬 Suggest
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {(!searchInsights.searchTrends || searchInsights.searchTrends.length === 0) && demandData.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                            No consumer search data recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* City Demand Hotspots & Active Broadcasts */}
              <div className="grid-2">
                {/* City Hotspots */}
                <div className="glass-card">
                  <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-dark)", fontSize: "1.05rem" }}>
                    🏙️ Top Urban Demand Hotspots
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {(searchInsights.cityDemandHotspots || [
                      { city: "Hyderabad (Central Hub)", searches: 142, topCrop: "Tomato" },
                      { city: "Warangal Urban", searches: 88, topCrop: "Chilli" },
                      { city: "Secunderabad", searches: 64, topCrop: "Onion" },
                      { city: "Karimnagar", searches: 49, topCrop: "Paddy" }
                    ]).map((h, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div>
                          <strong style={{ color: "var(--text-dark)", fontSize: "0.9rem" }}>📍 {h.city}</strong>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Top Searched: <span style={{ color: "var(--green-light)", fontWeight: 600 }}>{h.topCrop || h.crop || "Fresh Vegetables"}</span>
                          </div>
                        </div>
                        <span className="badge badge-blue">
                          {h.searches || h.count || 50} Searches
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Broadcasts Feed */}
                <div className="glass-card">
                  <h4 style={{ margin: "0 0 1rem 0", color: "var(--text-dark)", fontSize: "1.05rem" }}>
                    📢 Active High-Demand Broadcasts to Farmers
                  </h4>
                  {(!searchInsights.activeBroadcasts || searchInsights.activeBroadcasts.length === 0) ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      <p>No active broadcasts right now.</p>
                      <button
                        className="btn-secondary mt-2"
                        style={{ width: "auto", fontSize: "0.82rem" }}
                        onClick={() => setBroadcastModal(true)}
                      >
                        + Create First Broadcast
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {searchInsights.activeBroadcasts.slice(0, 5).map((b, i) => (
                        <div key={b._id || i} style={{ padding: "0.85rem", background: "rgba(22, 163, 74, 0.05)", borderRadius: "10px", border: "1px solid rgba(22, 163, 74, 0.2)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ color: "var(--green-deep)", fontSize: "0.95rem", textTransform: "capitalize" }}>
                              🌱 {b.cropName} Demand Request
                            </strong>
                            <span className={`badge ${b.priority === "urgent" ? "badge-red" : "badge-green"}`}>
                              {b.priority?.toUpperCase()}
                            </span>
                          </div>
                          <p style={{ margin: "0 0 6px 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{b.message}</p>
                          <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                            <span>Target: <strong>{b.targetQuantityKg} kg</strong></span>
                            <span>Suggested: <strong>₹{b.suggestedPrice}/kg</strong></span>
                            <span>Region: <strong>{b.targetRegion}</strong></span>
                            <span>Notified: <strong>{b.farmersNotified || 0} Farmers</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              <div className="admin-stats-row">
                {[
                  { icon:"👥", label:"Total Users", value: stats.totalUsers || 0 },
                  { icon:"🌾", label:"Farmers", value: stats.farmers || 0 },
                  { icon:"🛒", label:"Customers", value: stats.customers || 0 },
                  { icon:"🚚", label:"Agents", value: stats.agents || 0 },
                  { icon:"✅", label:"Verified Farmers", value: stats.verifiedFarmers || 0 },
                  { icon:"⏳", label:"Pending Verify", value: stats.pendingFarmers || 0 },
                ].map((s,i)=>(
                  <div className="stat-card" key={i}>
                    <span className="stat-icon">{s.icon}</span>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="admin-stats-row">
                {[
                  { icon:"📦", label:"Total Orders", value: stats.totalOrders || 0 },
                  { icon:"⏳", label:"Pending", value: stats.pendingOrders || 0 },
                  { icon:"✅", label:"Delivered", value: stats.deliveredOrders || 0 },
                  { icon:"❌", label:"Cancelled", value: stats.cancelledOrders || 0 },
                  { icon:"💰", label:"Revenue", value: `₹${(stats.totalRevenue || 0).toLocaleString()}` },
                  { icon:"📈", label:"Platform Profit", value: `₹${(stats.platformProfit || 0).toLocaleString()}` },
                ].map((s,i)=>(
                  <div className="stat-card" key={i}>
                    <span className="stat-icon">{s.icon}</span>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid-2">
                <div className="glass-card">
                  <h3 className="section-title">⚠️ Needs Attention</h3>
                  <div className="toggle-row"><span className="toggle-label">Pending Verifications</span><span className="badge badge-yellow">{pendingFarmers.length}</span></div>
                  <div className="toggle-row"><span className="toggle-label">Orders Awaiting Delivery</span><span className="badge badge-yellow">{needsDelivery.length}</span></div>
                  <div className="toggle-row"><span className="toggle-label">Pending Orders</span><span className="badge badge-yellow">{stats.pendingOrders || 0}</span></div>
                </div>
                <div className="glass-card">
                  <h3 className="section-title">📊 Revenue by Category</h3>
                  {stats.revenueByCategory && Object.entries(stats.revenueByCategory).map(([cat, rev]) => (
                    <div className="toggle-row" key={cat}>
                      <span className="toggle-label capitalize">{cat}</span>
                      <strong style={{ color:"var(--yellow-wheat)" }}>₹{rev.toLocaleString()}</strong>
                    </div>
                  ))}
                  {(!stats.revenueByCategory || Object.keys(stats.revenueByCategory).length === 0) && (
                    <p style={{ color:"var(--text-muted)", fontSize:"0.85rem" }}>No revenue data yet</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── LIVE TRACKING MAP ── */}
          {tab === "tracking" && (
            <div className="glass-card">
              <div className="flex-between mb-3" style={{ flexWrap: "wrap", gap: "1rem" }}>
                <h3 className="section-title mb-0">🗺️ Global Delivery Tracking</h3>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Region:</span>
                  <select 
                    className="rs-select" 
                    value={mapRegionFilter} 
                    onChange={e => setMapRegionFilter(e.target.value)}
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", width: "auto" }}
                  >
                    <option value="All">All Regions</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Warangal">Warangal</option>
                    <option value="Nizamabad">Nizamabad</option>
                    <option value="Khammam">Khammam</option>
                    <option value="Karimnagar">Karimnagar</option>
                  </select>
                </div>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Showing active deliveries {mapRegionFilter !== "All" ? `in ${mapRegionFilter}` : "globally"}.</p>
              <AdminGlobalMap activeDeliveries={deliveries.filter(d => mapRegionFilter === "All" || d.deliveryLocation?.toLowerCase().includes(mapRegionFilter.toLowerCase()) || d.pickupLocation?.toLowerCase().includes(mapRegionFilter.toLowerCase()))} />
            </div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <div>
              {/* Role filter bar */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {[
                  { id: "all", label: `All Users (${users.length})` },
                  { id: "farmer", label: `👨‍🌾 Farmers (${users.filter(u => u.role === "farmer").length})` },
                  { id: "customer", label: `🛒 Customers (${users.filter(u => u.role === "customer").length})` },
                  { id: "agent", label: `🚚 Agents (${users.filter(u => u.role === "agent").length})` },
                  { id: "admin", label: `👑 Admins (${users.filter(u => u.role === "admin").length})` }
                ].map(rf => (
                  <button
                    key={rf.id}
                    onClick={() => setUserRoleFilter(rf.id)}
                    style={{
                      padding: "0.4rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: userRoleFilter === rf.id ? "1.5px solid var(--green-mid)" : "1px solid #e2e8f0",
                      background: userRoleFilter === rf.id ? "var(--green-pale)" : "white",
                      color: userRoleFilter === rf.id ? "var(--green-deep)" : "var(--text-mid)"
                    }}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>

              <div className="glass-card" style={{ overflowX:"auto" }}>
                <table className="rs-table">
                  <thead>
                    <tr>
                      <th>User Profile</th>
                      <th>Contact & Location</th>
                      <th>Role & Status</th>
                      <th>MongoDB Data</th>
                      <th>Trust / Score</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers
                      .filter(u => userRoleFilter === "all" || u.role === userRoleFilter)
                      .map(u => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <div style={{ 
                                width: 36, height: 36, borderRadius: "50%", background: "var(--green-pale)", 
                                color: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center", 
                                fontWeight: "bold", fontSize: "0.9rem", flexShrink: 0,
                                backgroundImage: u.avatar ? `url(${u.avatar.startsWith("http") || u.avatar.startsWith("data:") ? u.avatar : `${BASE_URL}/${u.avatar.replace(/^\/+/, "")}`})` : "none",
                                backgroundSize: "cover", backgroundPosition: "center"
                              }}>
                                {!u.avatar && (u.name ? u.name.charAt(0).toUpperCase() : "U")}
                              </div>
                              <div>
                                <strong style={{ color: "var(--text-dark)", fontSize: "0.9rem", display: "block" }}>{u.name || "—"}</strong>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-dark)" }}>📞 {u.phone || "—"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>📍 {u.location || "—"}</div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", marginBottom: "0.2rem" }}>
                              <select 
                                value={u.role} 
                                onChange={(e) => changeRole(u._id, e.target.value)}
                                style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: 6, color: "var(--text-dark)", padding: "2px 6px", fontSize: "0.78rem", cursor: "pointer" }}
                              >
                                {["farmer","customer","agent","admin"].map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                              <span className={`badge ${u.isVerified ? "badge-green" : "badge-yellow"}`} style={{ fontSize: "0.7rem" }}>
                                {u.isVerified ? "✅ Verified" : "⏳ Pending"}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.7rem", color: u.accountStatus === "banned" ? "#dc2626" : u.accountStatus === "suspended" ? "#d97706" : "#16a34a", textTransform: "capitalize", fontWeight: 600 }}>
                              ● {u.accountStatus || "active"}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.8rem" }}>
                            {u.role === "farmer" && (
                              <div>
                                <span style={{ color: "var(--green-deep)", fontWeight: 600 }}>🌾 {u.cropsCount || 0} Crops</span>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>📦 {u.ordersCount || 0} Orders</div>
                              </div>
                            )}
                            {u.role === "customer" && (
                              <div>
                                <span style={{ color: "#4338ca", fontWeight: 600 }}>🛍️ {u.ordersCount || 0} Orders</span>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>🪙 {u.rewardPoints || 0} pts</div>
                              </div>
                            )}
                            {u.role === "agent" && (
                              <div>
                                <span style={{ color: "#d97706", fontWeight: 600 }}>🚚 {u.agentProfile?.vehicle || "Bike"}</span>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>💵 ₹{u.cashInHand || 0} cash</div>
                              </div>
                            )}
                            {u.role === "admin" && <span style={{ color: "#991b1b", fontWeight: 600 }}>👑 Platform Admin</span>}
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: (u.trustScore || 85) > 80 ? "#16a34a" : "#d97706", fontSize: "0.82rem" }}>
                              {u.role === "agent" ? `${u.deliveryScore || 100}/100` : `${u.trustScore || 85}/100`}
                            </span>
                            {u.strikes > 0 && <span style={{ color: "#dc2626", fontSize: "0.75rem", display: "block" }}>⚠️ {u.strikes} Strikes</span>}
                          </td>
                          <td style={{ color:"var(--text-muted)", fontSize:"0.78rem" }}>
                            {new Date(u.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                              <button 
                                className="btn-primary" 
                                style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", background: "var(--green-deep)", borderColor: "var(--green-deep)" }}
                                onClick={() => setSelectedUserModal(u)}
                                title="View full MongoDB profile and uploaded documents"
                              >
                                🔍 Details
                              </button>
                              {u.role !== "admin" && (
                                <>
                                  <button className="btn-warn" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }} onClick={() => fineUser(u._id, u.name)}>💸</button>
                                  <button className="btn-danger" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }} onClick={() => deleteUser(u._id, u.name)}>🗑️</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── USER VERIFICATION ── */}
          {tab === "verification" && (
            <div>
              {pendingUsersList.length === 0 ? (
                <div className="glass-card text-center" style={{ padding:"3rem" }}>
                  <p style={{ fontSize:"3rem" }}>✅</p>
                  <p style={{ color: "var(--text-muted)", marginTop:"1rem" }}>All users are verified! No pending requests.</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                  {pendingUsersList.map((item) => {
                    const u = item.user;
                    const farmerProfile = item.farmerProfile;
                    const agentProfile = item.agentProfile;
                    const photos = item.photos;
                    const coords = item.coordinates;
                    const tour = item.farmTour;

                    return (
                      <div className="glass-card" key={u._id} style={{ display:"flex", flexDirection: "column", gap:"1rem", border: u.role === "agent" ? "1.5px solid rgba(234,179,8,0.3)" : "1.5px solid rgba(34,197,94,0.3)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
                          <div style={{ flex:1, minWidth:240 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <h3 style={{ color: "var(--text-dark)", fontWeight:700, margin: 0 }}>
                                {u.name}
                              </h3>
                              <span className={`badge ${u.role === "agent" ? "badge-yellow" : "badge-green"}`}>
                                {u.role.toUpperCase()}
                              </span>
                              {u.role === "agent" && (
                                <span className="badge badge-blue" style={{ textTransform: "capitalize" }}>
                                  {item.agentType || u.agentType || "bike"}
                                </span>
                              )}
                            </div>

                            <p style={{ color: "var(--text-muted)", fontSize:"0.82rem", marginTop: "0.3rem" }}>{u.email} • 📞 {u.phone || "No phone"}</p>
                            
                            {u.role === "farmer" && (
                              <div style={{ marginTop: "0.5rem", background: "rgba(34,197,94,0.08)", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(34,197,94,0.2)" }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--green-deep)", marginBottom: "0.4rem" }}>
                                  📍 Farm: {coords?.farmLocation || u.location || "Telangana"}
                                </div>
                                
                                <div style={{ fontSize: "0.75rem", color: "var(--text-dark)", marginBottom: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                  <strong>Location Source:</strong> 
                                  <span className="badge badge-green" style={{ textTransform: "capitalize", padding: "2px 6px", fontSize: "0.7rem" }}>
                                    {u.locationMethod === "gps" ? "🛰️ GPS Tracking" : u.locationMethod === "pin" ? "📍 Map Pin" : u.locationMethod === "mic" ? "🎙️ Audio Clarification" : (u.locationMethod || "Unknown")}
                                  </span>
                                </div>

                                {u.locationMethod === "mic" && u.locationAudioUrl && (
                                  <div style={{ marginBottom: "0.5rem" }}>
                                    <span style={{ fontSize: "0.75rem", display: "block", marginBottom: "0.2rem", fontWeight: 600 }}>🔊 Listen to Farmer's Audio Clarification:</span>
                                    <audio controls src={u.locationAudioUrl.startsWith("http") ? u.locationAudioUrl : `${BASE_URL}${u.locationAudioUrl}`} style={{ height: "30px", width: "100%", maxWidth: "250px" }} />
                                  </div>
                                )}

                                {coords?.latitude && coords?.longitude ? (
                                  <div style={{ marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <span style={{ fontSize: "0.75rem", color: "var(--text-dark)", fontWeight: 600 }}>
                                      GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                                    </span>
                                    <a
                                      href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        fontSize: "0.72rem", background: "#166534", color: "white", padding: "2px 8px",
                                        borderRadius: "4px", textDecoration: "none", fontWeight: 600
                                      }}
                                    >
                                      🗺️ Verify On Map
                                    </a>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: "0.72rem", color: "#dc2626", marginTop: "0.2rem" }}>
                                    ⚠️ GPS coordinates not supplied
                                  </div>
                                )}

                                {/* Farm Tour Status & Approval */}
                                {tour?.enabled && (
                                  <div style={{ marginTop: "0.5rem", paddingTop: "0.4rem", borderTop: "1px dashed rgba(34,197,94,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                                    <div style={{ fontSize: "0.76rem" }}>
                                      <strong style={{ color: "#166534" }}>🚜 Farm Tour: </strong>
                                      <span>₹{tour.price}/person • {tour.verified ? "✅ Approved" : "⏳ Pending Approval"}</span>
                                    </div>
                                    {!tour.verified && (
                                      <button
                                        type="button"
                                        className="btn-primary"
                                        style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                                        onClick={() => verifyFarmTour(farmerProfile?._id || u._id, u.name)}
                                      >
                                        Approve Tour
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Agent Specific: Vehicle Photo, Registration No & Ridealong Route */}
                            {u.role === "agent" && (
                              <div style={{ marginTop: "0.5rem", background: "rgba(234,179,8,0.08)", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid rgba(234,179,8,0.2)" }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#92400e" }}>
                                  🚚 Vehicle: {item.vehicleNumber || u.vehicleNumber || "Reg. Pending"} ({item.agentType || u.agentType || "bike"})
                                </div>
                                {(item.agentType === "ridealong" || u.agentType === "ridealong") && (
                                  <div style={{ fontSize: "0.75rem", color: "#b45309", marginTop: "0.2rem" }}>
                                    🛣️ Commute Route: <strong>{u.ridealongRoute?.fromLocation || "Origin"}</strong> ➔ <strong>{u.ridealongRoute?.toLocation || "Destination"}</strong>
                                  </div>
                                )}
                              </div>
                            )}

                            {u.aadhaar && <p style={{ color:"var(--text-muted)", fontSize:"0.76rem", marginTop:"0.4rem" }}>🪪 Aadhaar: {u.aadhaar}</p>}
                            <p style={{ color:"var(--text-muted)", fontSize:"0.72rem" }}>Joined: {new Date(u.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}</p>
                          </div>

                          {/* Photos Grid */}
                          <div style={{ display:"flex", gap:"0.75rem", flexWrap: "wrap" }}>
                            {photos && Object.entries(photos).map(([key, url]) => {
                              const label = key.replace("Photo", " Photo").replace(/([A-Z])/g, ' $1').replace("  ", " ").trim();
                              const fullUrl = url
                                ? (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")
                                    ? url
                                    : `${BASE_URL}/${url.replace(/^\/+/, "")}`)
                                : null;
                              return (
                                <div key={key} style={{ textAlign: "center" }}>
                                  {fullUrl ? (
                                    <a href={fullUrl} target="_blank" rel="noreferrer" title={`Open ${label} in new tab`}>
                                      <img
                                        src={fullUrl}
                                        alt={label}
                                        onError={(e) => { e.target.src = ""; e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                                        style={{ width: 110, height: 110, objectFit: "cover", borderRadius: "10px", border: "2px solid rgba(82,183,136,0.4)", background: "var(--green-pale)", display: "block", cursor: "pointer" }}
                                      />
                                      <div style={{ display:"none", width:110, height:110, borderRadius:"10px", border:"2px dashed rgba(82,183,136,0.3)", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"4px" }}>
                                        <span style={{ fontSize:"1.3rem" }}>🖼️</span>
                                        <span style={{ fontSize:"0.6rem", color:"var(--text-muted)" }}>Load failed</span>
                                      </div>
                                    </a>
                                  ) : (
                                    <div style={{ width:110, height:110, borderRadius:"10px", border:"2px dashed rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"4px", background:"rgba(0,0,0,0.15)" }}>
                                      <span style={{ fontSize:"1.3rem" }}>📷</span>
                                      <span style={{ fontSize:"0.6rem", color:"var(--text-muted)", textAlign:"center" }}>Not uploaded</span>
                                    </div>
                                  )}
                                  <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.3rem", textTransform: "capitalize", maxWidth: 110 }}>{label}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:"0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                          <button className="btn-primary" style={{ width:"auto", padding:"0.5rem 1.25rem" }} onClick={() => verifyFarmer(u._id, u.name)}>
                            ✅ Approve Profile
                          </button>
                          <button className="btn-danger" style={{ width: "auto", padding:"0.5rem 1.25rem" }} onClick={() => rejectFarmer(u._id, u.name)}>
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FARM TOURS VERIFICATION ── */}
          {tab === "tours" && (
            <div>
              <h3 className="section-title mb-3">🚜 Pending Farm Tour Approvals</h3>
              {pendingTours.length === 0 ? (
                <div className="glass-card text-center" style={{ padding:"3rem" }}>
                  <p style={{ fontSize:"3rem" }}>✅</p>
                  <p style={{ color: "var(--text-muted)", marginTop:"1rem" }}>All requested farm tours have been verified!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {pendingTours.map((farmer) => (
                    <div className="glass-card" key={farmer._id} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <h4 style={{ color: "var(--text-dark)", fontSize: "1.2rem", marginBottom: "0.2rem" }}>{farmer.user?.name}</h4>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>📍 {farmer.farmLocation || farmer.user?.location || "No Location Provided"}</p>
                        <div style={{ marginTop: "0.5rem" }}>
                          <span className="badge badge-yellow">Price: ₹{farmer.farmTourPrice}</span>
                        </div>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem", fontStyle: "italic", maxWidth: "600px" }}>
                          "{farmer.farmTourDetails || "No details provided by the farmer."}"
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button className="btn-primary" style={{ padding: "0.5rem 1rem" }} onClick={async () => {
                          try { await API.put(`/tours/verify/${farmer._id}`, { verified: true }); loadAll(); setMsg({ type: "success", text: "Farm Tour Approved!" }); } catch { setMsg({ type: "error", text: "Failed to verify tour." }); }
                        }}>✅ Approve</button>
                        <button className="btn-danger" style={{ padding: "0.5rem 1rem" }} onClick={async () => {
                          try { await API.put(`/tours/settings/${farmer.user?._id}`, { farmTourEnabled: false }); loadAll(); setMsg({ type: "success", text: "Farm Tour Rejected." }); } catch { setMsg({ type: "error", text: "Failed to reject tour." }); }
                        }}>❌ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            <div className="glass-card" style={{ overflowX:"auto" }}>
              <table className="rs-table">
                <thead>
                  <tr>
                    <th>Order ID</th><th>Crop</th><th>Customer</th>
                    <th>Qty</th><th>Amount</th><th>Type</th><th>Payment</th><th>Status</th><th>Agent</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>#{o.billNumber || o._id.substring(0,8).toUpperCase()}</td>
                      <td><strong style={{ color: "var(--text-dark)" }}>{o.crop?.name || "—"}</strong></td>
                      <td style={{ color: "var(--text-muted)", fontSize:"0.85rem" }}>{o.customer?.name || "—"}</td>
                      <td style={{ color: "var(--text-dark)" }}>{o.quantity}</td>
                      <td style={{ color:"var(--yellow-wheat)", fontWeight:700 }}>₹{(o.totalAmount||0).toLocaleString()}</td>
                      <td><span className={`badge ${o.deliveryType==="farm_pickup"?"badge-green":"badge-blue"}`}>{o.deliveryType==="farm_pickup"?"🏡 Farm":"🚚 Delivery"}</span></td>
                      <td><span className="badge badge-blue">{o.paymentMode||"cod"}</span></td>
                      <td>
                        <select value={o.status} onChange={(e) => updateOrderStatus(o._id, e.target.value)}
                          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(82,183,136,0.25)", borderRadius:6, color: "var(--text-dark)", padding:"3px 6px", fontSize:"0.78rem", cursor:"pointer" }}>
                          {["pending","confirmed","processing","assigned","picked_up","in_transit","delivered","cancelled"].map(s =>
                            <option key={s} value={s}>{s.replace("_"," ")}</option>
                          )}
                        </select>
                      </td>
                      <td style={{ fontSize:"0.78rem", color: o.agent ? "var(--green-light)" : "var(--text-muted)" }}>
                        {o.agent?.name || "None"}
                      </td>
                      <td>
                        {!o.agent && o.deliveryType !== "farm_pickup" && (
                          <button className="btn-warn" style={{ fontSize:"0.72rem", padding:"0.3rem 0.5rem" }} onClick={() => setAssignModal(o)}>
                            🚚 Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DUAL-TIER LIVE FLEET TRACKING CONSOLE ── */}
          {tab === "deliveries" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Dual-Tier Header & Mode Switcher */}
              <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 className="section-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    🚚 Dual-Tier Live Fleet Tracking & Logistics Console
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", marginBottom: 0 }}>
                    Monitor Heavy Freight Trucks (Farm ➔ Cold Hub) & Hyperlocal Dabbawala Couriers (Hub ➔ Doorstep).
                  </p>
                </div>

                {/* Tier Switcher Pills */}
                <div style={{ display: "flex", gap: "0.5rem", background: "rgba(0,0,0,0.15)", padding: "4px", borderRadius: "100px" }}>
                  <button
                    type="button"
                    onClick={() => setFleetTier("all")}
                    style={{
                      padding: "6px 14px", borderRadius: "100px", border: "none", cursor: "pointer",
                      fontSize: "0.82rem", fontWeight: 700,
                      background: fleetTier === "all" ? "var(--green-deep)" : "transparent",
                      color: fleetTier === "all" ? "white" : "var(--text-muted)"
                    }}
                  >
                    🌐 All Fleet ({deliveries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetTier("heavy_truck")}
                    style={{
                      padding: "6px 14px", borderRadius: "100px", border: "none", cursor: "pointer",
                      fontSize: "0.82rem", fontWeight: 700,
                      background: fleetTier === "heavy_truck" ? "#0284c7" : "transparent",
                      color: fleetTier === "heavy_truck" ? "white" : "var(--text-muted)",
                      display: "flex", alignItems: "center", gap: "5px"
                    }}
                  >
                    🚛 Heavy Trucks ({fleetData.heavyTrucks?.length || 4})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetTier("dabbawala")}
                    style={{
                      padding: "6px 14px", borderRadius: "100px", border: "none", cursor: "pointer",
                      fontSize: "0.82rem", fontWeight: 700,
                      background: fleetTier === "dabbawala" ? "#16a34a" : "transparent",
                      color: fleetTier === "dabbawala" ? "white" : "var(--text-muted)",
                      display: "flex", alignItems: "center", gap: "5px"
                    }}
                  >
                    🚲 Dabbawalas ({fleetData.dabbawalaRiders?.length || 12})
                  </button>
                </div>
              </div>

              {/* Fleet Operations Metrics */}
              <div className="grid-4">
                <div className="stat-card" style={{ borderLeft: "4px solid #0284c7" }}>
                  <span className="stat-icon">🚛</span>
                  <div className="stat-value" style={{ color: "#0284c7" }}>
                    {fleetData.heavyTrucks?.length || 4} Trucks
                  </div>
                  <div className="stat-label">Heavy Freight in Transit</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Farm ➔ Cold Hub (Avg 3.6°C Chilled)
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: "4px solid #16a34a" }}>
                  <span className="stat-icon">🚲</span>
                  <div className="stat-value" style={{ color: "#16a34a" }}>
                    {fleetData.dabbawalaRiders?.length || 12} Couriers
                  </div>
                  <div className="stat-label">Dabbawala Micro-Riders</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Hub ➔ Doorstep (2km Radial Zones)
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
                  <span className="stat-icon">🏢</span>
                  <div className="stat-value">
                    {fleetData.hubs?.length || 3} Hubs
                  </div>
                  <div className="stat-label">Cold Storage Centers</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Capacity: 150,000 kg total
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: "4px solid #dc2626" }}>
                  <span className="stat-icon">📦</span>
                  <div className="stat-value" style={{ color: needsDelivery.length > 0 ? "#dc2626" : "var(--text-dark)" }}>
                    {needsDelivery.length} Orders
                  </div>
                  <div className="stat-label">Awaiting Assignment</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Ready for Fleet Dispatch
                  </div>
                </div>
              </div>

              {/* Live Network Fleet Map */}
              <div className="glass-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h4 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.1rem" }}>
                    🗺️ Live GPS Fleet Tracking Map ({fleetTier === "heavy_truck" ? "Heavy Trucks Only" : fleetTier === "dabbawala" ? "Dabbawalas Only" : "Unified Dual-Tier Network"})
                  </h4>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <span>🔵 <strong>Highway Freight (TSP Router)</strong></span>
                    <span>🟢 <strong>Hub Radial Clusters</strong></span>
                    <span>🏢 <strong>Cold Hubs</strong></span>
                  </div>
                </div>
                <AdminGlobalMap
                  activeDeliveries={deliveries}
                  tierFilter={fleetTier}
                  hubs={fleetData.hubs}
                  onReassignClick={openReassignModal}
                />
              </div>

              {/* Tier 1: Heavy Freight Trucks Table */}
              {(fleetTier === "all" || fleetTier === "heavy_truck") && (
                <div className="glass-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <h4 style={{ margin: 0, color: "#0284c7", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        🚛 Tier 1: Heavy Freight Trucks (Rural Farm ➔ Cold Storage Hubs)
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Bulk capacity freight trucks equipped with IoT cold-chain temperature sensors and highway TSP route optimization.
                      </p>
                    </div>
                    <span className="badge badge-blue">Algorithm: tsp_genetic</span>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table className="rs-table">
                      <thead>
                        <tr>
                          <th>Truck Plate / ID</th>
                          <th>Driver Name</th>
                          <th>Farm Origin</th>
                          <th>Destination Cold Hub</th>
                          <th>Bulk Load (kg)</th>
                          <th>Cold Chain Temp</th>
                          <th>Routing Model</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(fleetData.heavyTrucks?.length > 0 ? fleetData.heavyTrucks : [
                          {
                            _id: "ht-01",
                            vehiclePlate: "TS-09-TR-4921",
                            agent: { name: "Raju Yadav", phone: "9848123450" },
                            pickupLocation: "Nalgonda Farm Cluster #12",
                            coldHubDestination: "Shamshabad Agri-Hub Central",
                            loadWeightKg: 4200,
                            bulkCapacityKg: 5000,
                            coldChainTemp: "3.4°C",
                            algorithm: "tsp_genetic",
                            status: "in_transit"
                          },
                          {
                            _id: "ht-02",
                            vehiclePlate: "TS-07-TR-7814",
                            agent: { name: "K. Mohan Rao", phone: "9848099882" },
                            pickupLocation: "Medak Rural Producer Group",
                            coldHubDestination: "Medchal Cold-Chain Logistics Hub",
                            loadWeightKg: 3800,
                            bulkCapacityKg: 4500,
                            coldChainTemp: "3.8°C",
                            algorithm: "tsp_genetic",
                            status: "in_transit"
                          },
                          {
                            _id: "ht-03",
                            vehiclePlate: "TS-11-TR-2209",
                            agent: { name: "Suresh Reddy", phone: "9848110022" },
                            pickupLocation: "Warangal Agri Zone #04",
                            coldHubDestination: "Patancheru Regional Hub",
                            loadWeightKg: 4600,
                            bulkCapacityKg: 5000,
                            coldChainTemp: "4.1°C",
                            algorithm: "tsp_genetic",
                            status: "picked_up"
                          }
                        ]).map((truck, i) => (
                          <tr key={truck._id || i}>
                            <td style={{ fontWeight: 700, color: "#0284c7" }}>
                              🚛 {truck.vehiclePlate || "TS-08-TR-1029"}
                            </td>
                            <td style={{ fontWeight: 600, color: "var(--text-dark)" }}>
                              {truck.agent?.name || "Driver"}
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{truck.agent?.phone || "9848000000"}</div>
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              🌾 {truck.pickupLocation?.substring(0, 30) || "Farm Cluster"}
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--text-dark)", fontWeight: 600 }}>
                              🏢 {truck.coldHubDestination || truck.deliveryLocation?.substring(0, 30) || "Central Cold Storage"}
                            </td>
                            <td>
                              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)" }}>
                                {truck.loadWeightKg || 4000} kg
                              </div>
                              <div style={{ background: "#e2e8f0", height: "4px", borderRadius: "2px", width: "80px", marginTop: "2px" }}>
                                <div style={{ background: "#0284c7", height: "100%", borderRadius: "2px", width: `${Math.min(100, Math.round(((truck.loadWeightKg || 4000) / (truck.bulkCapacityKg || 5000)) * 100))}%` }}></div>
                              </div>
                            </td>
                            <td>
                              <span style={{ background: "rgba(2, 132, 199, 0.12)", color: "#0284c7", border: "1px solid rgba(2, 132, 199, 0.3)", padding: "2px 8px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700 }}>
                                ❄️ {truck.coldChainTemp || "3.6°C"}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                {truck.algorithm || "tsp_genetic"}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${truck.status === "delivered" ? "badge-green" : "badge-blue"}`}>
                                {truck.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-secondary"
                                style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", width: "auto" }}
                                onClick={() => openReassignModal(truck)}
                              >
                                ⚙️ Override / Reassign
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tier 2: Hyperlocal Dabbawala Couriers Table */}
              {(fleetTier === "all" || fleetTier === "dabbawala") && (
                <div className="glass-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <h4 style={{ margin: 0, color: "#16a34a", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        🚲 Tier 2: Hyperlocal Dabbawala Couriers (Cold Storage Hub ➔ Customer Doorstep)
                      </h4>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Local cycle & cargo e-bike delivery couriers operating in 2km micro-clusters with OTP security and batch drop routing.
                      </p>
                    </div>
                    <span className="badge badge-green">Algorithm: dabbawala_cluster</span>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table className="rs-table">
                      <thead>
                        <tr>
                          <th>Courier Name</th>
                          <th>Vehicle Type</th>
                          <th>Base Hub</th>
                          <th>Radial Zone</th>
                          <th>Batch Drops</th>
                          <th>Routing Model</th>
                          <th>OTP Handover</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(fleetData.dabbawalaRiders?.length > 0 ? fleetData.dabbawalaRiders : [
                          {
                            _id: "db-01",
                            agent: { name: "Ramesh Kumar", phone: "9848991122" },
                            vehicleType: "Cargo E-Bike",
                            hubOrigin: "Shamshabad Agri-Hub",
                            radialZoneKm: 2.0,
                            batchDropCount: 5,
                            algorithm: "dabbawala_cluster",
                            status: "in_transit",
                            otpSecured: true
                          },
                          {
                            _id: "db-02",
                            agent: { name: "Venkatesh P.", phone: "9848554433" },
                            vehicleType: "Bicycle Courier",
                            hubOrigin: "Medchal Cold-Chain Logistics Hub",
                            radialZoneKm: 1.8,
                            batchDropCount: 4,
                            algorithm: "dabbawala_cluster",
                            status: "in_transit",
                            otpSecured: true
                          },
                          {
                            _id: "db-03",
                            agent: { name: "Anand M.", phone: "9848223311" },
                            vehicleType: "Cargo E-Bike",
                            hubOrigin: "Patancheru Regional Hub",
                            radialZoneKm: 2.2,
                            batchDropCount: 6,
                            algorithm: "dabbawala_cluster",
                            status: "assigned",
                            otpSecured: true
                          }
                        ]).map((dab, i) => (
                          <tr key={dab._id || i}>
                            <td style={{ fontWeight: 700, color: "var(--text-dark)" }}>
                              🚲 {dab.agent?.name || "Dabbawala Rider"}
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{dab.agent?.phone || "9848000000"}</div>
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--text-dark)" }}>
                              {dab.vehicleType || "Cargo E-Bike"}
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              🏢 {dab.hubOrigin || "Central Cold Hub"}
                            </td>
                            <td>
                              <span style={{ background: "rgba(22, 163, 74, 0.1)", color: "#16a34a", padding: "2px 8px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 }}>
                                🎯 {dab.radialZoneKm || 2.0} km zone
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: "var(--text-dark)", fontSize: "0.85rem" }}>
                                📦 {dab.batchDropCount || 4} Drops
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                {dab.algorithm || "dabbawala_cluster"}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: "#16a34a", fontSize: "0.8rem", fontWeight: 700 }}>
                                🔒 OTP Required
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${dab.status === "delivered" ? "badge-green" : "badge-blue"}`}>
                                {dab.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-secondary"
                                style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", width: "auto" }}
                                onClick={() => openReassignModal(dab)}
                              >
                                🔄 Reassign Courier
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pending Orders Needing Delivery Assignment */}
              <div className="glass-card">
                <h3 className="section-title mb-2">📦 Orders Needing Initial Delivery Assignment</h3>
                {needsDelivery.length === 0 ? (
                  <div className="text-center" style={{ padding: "1.5rem" }}>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>✅ All pending orders are assigned to fleet drivers!</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {needsDelivery.map(o => (
                      <div key={o._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div>
                          <h4 style={{ color: "var(--text-dark)", margin: "0 0 4px 0" }}>
                            #{o.billNumber || o._id.substring(0,8).toUpperCase()} — {o.crop?.name} ({o.quantity || 1} {o.crop?.unit || "kg"})
                          </h4>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "0 0 2px 0" }}>
                            Customer: <strong>{o.customer?.name}</strong> • Amount: ₹{(o.totalAmount||0).toLocaleString()}
                          </p>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", margin: 0 }}>
                            📍 Drop Address: {o.deliveryAddress?.substring(0, 60) || "No address specified"}
                          </p>
                        </div>
                        <button className="btn-primary" style={{ width: "auto", padding: "0.5rem 1.2rem", fontWeight: 700 }} onClick={() => setAssignModal(o)}>
                          🚚 Assign Fleet Agent
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FINANCIAL LEDGER ── */}
          {tab === "financials" && (
            <AdminFinancials />
          )}

          {/* ── PROFIT MANAGEMENT ── */}
          {tab === "profit" && (
            <div>
              <div className="admin-stats-row">
                <div className="earnings-card">
                  <div className="earnings-value">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
                  <div className="earnings-label">Total Revenue</div>
                </div>
                <div className="earnings-card">
                  <div className="earnings-value">₹{(stats.totalPlatformFees || 0).toLocaleString()}</div>
                  <div className="earnings-label">Platform Fees (5%)</div>
                </div>
                <div className="earnings-card">
                  <div className="earnings-value">₹{(stats.totalDeliveryCharges || 0).toLocaleString()}</div>
                  <div className="earnings-label">Delivery Revenue</div>
                </div>
                <div className="earnings-card">
                  <div className="earnings-value">₹{(stats.platformProfit || 0).toLocaleString()}</div>
                  <div className="earnings-label">Net Platform Profit</div>
                </div>
              </div>

              <div className="glass-card mt-3">
                <h3 className="section-title">📊 Revenue Breakdown by Category</h3>
                {stats.revenueByCategory && Object.entries(stats.revenueByCategory).length > 0 ? (
                  Object.entries(stats.revenueByCategory).map(([cat, rev]) => {
                    const pct = stats.totalRevenue ? Math.round((rev / stats.totalRevenue) * 100) : 0;
                    return (
                      <div key={cat} style={{ marginBottom:"1rem" }}>
                        <div className="flex-between" style={{ marginBottom:"0.3rem" }}>
                          <span style={{ color: "var(--text-dark)", fontSize:"0.9rem", textTransform:"capitalize" }}>{cat}</span>
                          <span style={{ color:"var(--yellow-wheat)", fontWeight:700 }}>₹{rev.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div style={{ height:8, background:"rgba(255,255,255,0.1)", borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:"var(--gradient-btn)", borderRadius:4, transition:"width 0.5s ease" }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color:"var(--text-muted)" }}>No revenue data yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ── SECURITY & RULES ── */}
          {tab === "security" && (
            <div>
              <h3 className="section-title mb-2">🚨 Misuse & Mismatch Reports</h3>
              {reports.length === 0 ? (
                <div className="glass-card text-center text-muted p-4">No reports found.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                  {reports.map(r => (
                    <div key={r._id} className="glass-card">
                      <div className="flex-between mb-2">
                        <strong style={{ color:"var(--red-light)" }}>Order #{r.billNumber} Mismatch</strong>
                        <span className={`badge ${r.reportResolution==="pending"?"badge-yellow":r.reportResolution==="penalized"?"badge-red":"badge-green"}`}>
                          {r.reportResolution?.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize:"0.85rem", color:"var(--text-muted)" }}>Agent reported: {r.agentReportReason}</p>
                      <p style={{ fontSize:"0.85rem", color: "var(--text-muted)" }}>Farmer: {r.farmer?.name}</p>
                      
                      {r.reportResolution === "pending" && (
                        <div style={{ marginTop:"1rem", display:"flex", gap:"0.5rem" }}>
                          <button className="btn-danger" style={{ width:"auto" }} onClick={async () => {
                            try {
                              await API.put(`/reports/${r._id}/penalize`, { penaltyPoints: 50, adminId: user._id });
                              flash("success", "Farmer penalized."); loadAll();
                            } catch(e) { flash("error", "Error penalizing."); }
                          }}>Penalize Farmer</button>
                          
                          <button className="btn-secondary" style={{ width:"auto" }} onClick={async () => {
                            try {
                              await API.put(`/reports/${r._id}/dismiss`, { adminId: user._id });
                              flash("success", "Report dismissed."); loadAll();
                            } catch(e) { flash("error", "Error dismissing."); }
                          }}>Dismiss</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <h3 className="section-title mb-2 mt-4">👮 Platform Guidelines & Verification</h3>
              <div className="glass-card mb-3" style={{ background: "rgba(34, 197, 94, 0.05)", borderLeft: "4px solid var(--green-primary)" }}>
                <h4 style={{ color: "var(--green-light)", marginBottom: "0.5rem" }}>Community Guidelines & Enforcement</h4>
                <ul style={{ color: "var(--text-dark)", fontSize: "0.85rem", paddingLeft: "1.2rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <li><strong>Farmers:</strong> Must accurately list crop quality, quantity, and organic/pesticide-free status. Fake certifications or misleading photos warrant a strike.</li>
                  <li><strong>Agents:</strong> Must upload genuine photos of the farm and the market upon pickup/delivery. Tampering with products or delayed deliveries without reason warrant a strike.</li>
                  <li><strong>Customers:</strong> Must not abuse the return policy or initiate fake COD orders. Repeated offenses lead to suspension.</li>
                </ul>
              </div>

              <h3 className="section-title mb-2">User Trust & Strike Management</h3>
              <div className="glass-card" style={{ overflowX:"auto" }}>
                <table className="rs-table">
                  <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Trust / Delivery Score</th><th>Strikes</th><th>Action</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td style={{ color: "var(--text-dark)" }}>
                          {u.name}
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{u.phone || u.email}</div>
                        </td>
                        <td style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>{u.role}</td>
                        <td><span className={`badge ${u.accountStatus==="active"?"badge-green":u.accountStatus==="suspended"?"badge-yellow":"badge-red"}`}>{u.accountStatus}</span></td>
                        <td>
                          {u.role === "agent" ? (
                            <span style={{ color: u.deliveryScore > 80 ? "var(--green-light)" : "var(--yellow-wheat)" }}>{u.deliveryScore || 0}/100 Delivery</span>
                          ) : (
                            <span style={{ color: u.trustScore > 80 ? "var(--green-light)" : "var(--yellow-wheat)" }}>{u.trustScore || 85}/100 Trust</span>
                          )}
                        </td>
                        <td style={{ color: u.strikes > 0 ? "var(--red-light)" : "var(--text-muted)", fontWeight: "bold" }}>{u.strikes || 0}</td>
                        <td>
                          {u.accountStatus !== "banned" ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                              <button className="btn-warn" style={{ fontSize:"0.65rem", padding:"0.2rem 0.4rem", width: "auto" }} onClick={async () => {
                                const reason = prompt(`Reason for striking ${u.name}?`);
                                if (!reason) return;
                                try { await API.put(`/admin/users/${u._id}/strike`, { reason }); flash("success", `Strike added`); loadAll(); } catch(e) { flash("error", "Error adding strike."); }
                              }}>+ Strike</button>
                              
                              <button className="btn-warn" style={{ fontSize:"0.65rem", padding:"0.2rem 0.4rem", width: "auto", background: "#d97706" }} onClick={async () => {
                                const reason = prompt(`Reason for deducting 20 points from ${u.name}? (Minor Fraud)`);
                                if (!reason) return;
                                try { await API.put(`/admin/users/${u._id}/deduct-points`, { amount: 20, reason }); flash("success", `Points deducted`); loadAll(); } catch(e) { flash("error", "Error deducting points."); }
                              }}>- Points</button>

                              <button className="btn-danger" style={{ fontSize:"0.65rem", padding:"0.2rem 0.4rem", width: "auto" }} onClick={async () => {
                                const reason = prompt(`Reason for deducting ₹500 from ${u.name}'s wallet? (Major Fraud)`);
                                if (!reason) return;
                                try { await API.put(`/admin/users/${u._id}/deduct-wallet`, { amount: 500, reason }); flash("success", `Wallet funds deducted`); loadAll(); } catch(e) { flash("error", "Error deducting wallet."); }
                              }}>- ₹500</button>
                              
                              {u.accountStatus === "active" && (
                                <button className="btn-secondary" style={{ fontSize:"0.65rem", padding:"0.2rem 0.4rem", width: "auto" }} onClick={async () => {
                                  if (confirm(`Suspend ${u.name}?`)) {
                                    try { await API.put(`/admin/users/${u._id}/status`, { status: "suspended" }); flash("success", "Account suspended."); loadAll(); } catch(e) { flash("error", "Error suspending."); }
                                  }
                                }}>Suspend</button>
                              )}

                              <button className="btn-danger" style={{ fontSize:"0.65rem", padding:"0.2rem 0.4rem", width: "auto", background: "#7f1d1d" }} onClick={async () => {
                                if (confirm(`PERMANENTLY BAN ${u.name}?`)) {
                                  try { await API.put(`/admin/users/${u._id}/status`, { status: "banned" }); flash("success", "User BANNED."); loadAll(); } catch(e) { flash("error", "Error banning."); }
                                }
                              }}>BAN</button>
                              
                              {u.accountStatus === "suspended" && (
                                <button className="btn-primary" style={{ fontSize:"0.65rem", padding:"0.2rem 0.4rem", width: "auto" }} onClick={async () => {
                                  try { await API.put(`/admin/users/${u._id}/status`, { status: "active" }); flash("success", "User restored."); loadAll(); } catch(e) { flash("error", "Error restoring."); }
                                }}>Restore</button>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <span style={{ color: "var(--red-light)", fontWeight: "bold", fontSize: "0.8rem" }}>BANNED</span>
                              <button className="btn-primary" style={{ fontSize:"0.65rem", padding:"0.2rem 0.4rem", width: "auto" }} onClick={async () => {
                                try { await API.put(`/admin/users/${u._id}/status`, { status: "active" }); flash("success", "User unbanned."); loadAll(); } catch(e) { flash("error", "Error unbanning."); }
                              }}>Unban</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CROPS MANAGEMENT ── */}
          {tab === "crops" && (
            <div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
                <button
                  onClick={() => setCropSubTab("catalog")}
                  style={{
                    padding: "0.45rem 1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                    border: cropSubTab === "catalog" ? "1.5px solid var(--green-mid)" : "1px solid #e2e8f0",
                    background: cropSubTab === "catalog" ? "var(--green-pale)" : "white",
                    color: cropSubTab === "catalog" ? "var(--green-deep)" : "var(--text-mid)"
                  }}
                >
                  📦 All Marketplace Crops ({crops.length})
                </button>
                <button
                  onClick={() => setCropSubTab("lifecycles")}
                  style={{
                    padding: "0.45rem 1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                    border: cropSubTab === "lifecycles" ? "1.5px solid var(--green-mid)" : "1px solid #e2e8f0",
                    background: cropSubTab === "lifecycles" ? "var(--green-pale)" : "white",
                    color: cropSubTab === "lifecycles" ? "var(--green-deep)" : "var(--text-mid)"
                  }}
                >
                  🌱 Lifecycle Proofs ({crops.filter(c => c.lifecycleUpdates?.length > 0).length})
                </button>
              </div>

              {cropSubTab === "catalog" && (
                <div className="glass-card" style={{ overflowX: "auto" }}>
                  <table className="rs-table">
                    <thead>
                      <tr>
                        <th>Crop Product</th>
                        <th>Farmer Details</th>
                        <th>Price & Stock</th>
                        <th>Organic & Pesticide Free</th>
                        <th>Lifecycle Stage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crops.map(c => {
                        const cropImg = c.image 
                          ? (c.image.startsWith("http") || c.image.startsWith("data:") ? c.image : `${BASE_URL}/${c.image.replace(/^\/+/, "")}`)
                          : null;
                        return (
                          <tr key={c._id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                {cropImg ? (
                                  <img src={cropImg} alt={c.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid #e2e8f0" }} />
                                ) : (
                                  <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--green-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🌾</div>
                                )}
                                <div>
                                  <strong style={{ color: "var(--text-dark)", fontSize: "0.92rem", display: "block" }}>{c.name}</strong>
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{c.category} • {c.season || "kharif"}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <strong style={{ fontSize: "0.85rem", color: "var(--text-dark)", display: "block" }}>{c.farmer?.name || "Farmer"}</strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>📍 {c.location || c.farmLocation || "Telangana"}</span>
                            </td>
                            <td>
                              <strong style={{ color: "var(--green-deep)", fontSize: "0.95rem" }}>₹{c.price}/{c.unit || "kg"}</strong>
                              <div style={{ fontSize: "0.78rem", color: c.quantity < 10 ? "#dc2626" : "var(--text-mid)", fontWeight: 600 }}>
                                {c.quantity} {c.unit || "kg"} in stock
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await API.put(`/admin/crops/${c._id}/verify-organic`, { isOrganic: !c.isOrganic, isPesticideFree: c.isPesticideFree });
                                      flash("success", `Organic status toggled for ${c.name}`); loadAll();
                                    } catch { flash("error", "Failed to update organic status."); }
                                  }}
                                  style={{
                                    padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                                    border: c.isOrganic ? "1px solid #22c55e" : "1px solid #cbd5e1",
                                    background: c.isOrganic ? "#ecfdf5" : "#f8fafc",
                                    color: c.isOrganic ? "#166534" : "#94a3b8"
                                  }}
                                  title="Click to toggle Organic certification"
                                >
                                  {c.isOrganic ? "🌿 Organic" : "⚪ Not Organic"}
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await API.put(`/admin/crops/${c._id}/verify-organic`, { isOrganic: c.isOrganic, isPesticideFree: !c.isPesticideFree });
                                      flash("success", `Pesticide-free status toggled for ${c.name}`); loadAll();
                                    } catch { flash("error", "Failed to update pesticide status."); }
                                  }}
                                  style={{
                                    padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                                    border: c.isPesticideFree ? "1px solid #059669" : "1px solid #cbd5e1",
                                    background: c.isPesticideFree ? "#ecfdf5" : "#f8fafc",
                                    color: c.isPesticideFree ? "#065f46" : "#94a3b8"
                                  }}
                                  title="Click to toggle Pesticide-Free certification"
                                >
                                  {c.isPesticideFree ? "🛡️ Pesticide Free" : "⚪ Chemical Used"}
                                </button>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-yellow" style={{ textTransform: "capitalize", fontSize: "0.75rem" }}>
                                {c.lifecycleStage || "ready"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-danger"
                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
                                onClick={async () => {
                                  if (!confirm(`Delete crop listing "${c.name}" from marketplace?`)) return;
                                  try {
                                    await API.delete(`/admin/crops/${c._id}`);
                                    flash("success", `Crop "${c.name}" deleted.`); loadAll();
                                  } catch { flash("error", "Failed to delete crop."); }
                                }}
                              >
                                🗑️ Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {cropSubTab === "lifecycles" && (
                <div className="glass-card">
                  <table className="rs-table">
                    <thead><tr><th>Crop / Farmer</th><th>Current Stage</th><th>Latest Proof</th><th>Notes</th><th>Date</th></tr></thead>
                    <tbody>
                      {crops.filter(c => c.lifecycleUpdates && c.lifecycleUpdates.length > 0).map(c => {
                        const latestUpdate = c.lifecycleUpdates[c.lifecycleUpdates.length - 1];
                        return (
                          <tr key={c._id}>
                            <td>
                              <strong style={{ color: "var(--text-dark)" }}>{c.name}</strong>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Farmer: {c.farmer?.name || "Unknown"}</div>
                            </td>
                            <td style={{ textTransform: "capitalize", color: "var(--yellow-wheat)" }}>{c.lifecycleStage}</td>
                            <td>
                              {latestUpdate.imageUrl ? (
                                <img src={latestUpdate.imageUrl.startsWith("http") ? latestUpdate.imageUrl : `${BASE_URL}/${latestUpdate.imageUrl.replace(/^\/+/, "")}`} alt="Proof" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--green-pale)" }} />
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No image</span>
                              )}
                            </td>
                            <td style={{ color: "var(--text-dark)", fontSize: "0.85rem", maxWidth: "200px" }}>{latestUpdate.notes || "-"}</td>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{new Date(latestUpdate.timestamp).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {crops.filter(c => c.lifecycleUpdates && c.lifecycleUpdates.length > 0).length === 0 && (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No crop lifecycle updates found.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SUPPORT TICKETS ── */}
          {tab === "support" && (
            <div>
              <h3 className="section-title mb-2">🎫 Support Tickets</h3>
              {tickets.length === 0 ? (
                <div className="glass-card text-center text-muted p-4">No support tickets found.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                  {tickets.map(t => (
                    <div key={t._id} className="glass-card">
                      <div className="flex-between mb-2">
                        <div>
                          <strong style={{ color: "var(--text-dark)" }}>{t.subject}</strong>
                          <span className="badge badge-blue ml-2">{t.priority}</span>
                        </div>
                        <span className={`badge ${t.status==="resolved"?"badge-green":t.status==="open"?"badge-red":"badge-yellow"}`}>
                          {t.status?.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize:"0.85rem", color:"var(--text-muted)", marginBottom:"1rem" }}>{t.description}</p>
                      
                      <div style={{ background:"rgba(0,0,0,0.2)", padding:"1rem", borderRadius:"8px", marginBottom:"1rem" }}>
                        {t.responses.map((r, i) => (
                          <div key={i} style={{ marginBottom:"0.5rem" }}>
                            <strong style={{ color: "var(--text-muted)", fontSize:"0.8rem" }}>{r.senderName}: </strong>
                            <span style={{ color: "var(--text-dark)", fontSize:"0.85rem" }}>{r.message}</span>
                          </div>
                        ))}
                      </div>

                      {t.status !== "resolved" && (
                        <div style={{ display:"flex", gap:"0.5rem" }}>
                          <input id={`reply-${t._id}`} className="rs-input" style={{ flex:1 }} placeholder="Type reply..." />
                          <button className="btn-primary" style={{ width:"auto" }} onClick={async () => {
                            const val = document.getElementById(`reply-${t._id}`).value;
                            if (!val) return;
                            try {
                              await API.post(`/tickets/${t._id}/reply`, { sender: user._id, senderName: "Admin", message: val });
                              document.getElementById(`reply-${t._id}`).value = "";
                              flash("success", "Replied!"); loadAll();
                            } catch(e) { flash("error", "Error replying."); }
                          }}>Reply</button>
                          <button className="btn-secondary" style={{ width:"auto" }} onClick={async () => {
                            try {
                              await API.put(`/tickets/${t._id}/resolve`, { adminId: user._id });
                              flash("success", "Ticket resolved."); loadAll();
                            } catch(e) { flash("error", "Error."); }
                          }}>Resolve</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BROADCAST TAB ── */}
          {tab === "broadcast" && (
            <div className="glass-card" style={{ maxWidth: 600, margin: "0 auto" }}>
              <h3 className="section-title">📢 Send Global Broadcast</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Send a real-time notification to connected users. Provide targeted tips or urgent alerts.
              </p>
              
              <div className="grid-2 mb-2">
                <div className="form-group">
                  <label className="field-label">Target Audience</label>
                  <select className="rs-select" value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)}>
                    <option value="all">All Users</option>
                    <option value="farmer">Farmers Only</option>
                    <option value="customer">Customers Only</option>
                    <option value="agent">Agents Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="field-label">Message Type</label>
                  <select className="rs-select" value={broadcastType} onChange={e => setBroadcastType(e.target.value)}>
                    <option value="general">Urgent / General Alert</option>
                    <option value="farming">Farming / Irrigation Tip</option>
                    <option value="health">Health / Nutritional Tip</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label">Message</label>
                <textarea 
                  className="rs-input" 
                  rows="4" 
                  placeholder="e.g. Try using drip irrigation to save water this summer!..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                />
              </div>
              <button className="btn-primary mt-2" onClick={sendBroadcast}>
                📢 Send Broadcast Now
              </button>
            </div>
          )}

          {/* 🌱 WASTE MANAGEMENT TAB 🌱 */}
          {tab === "waste" && (
            <div className="mt-3">
              <AdminWasteManagement />
            </div>
          )}

          {/* ── MLOPS TAB ── */}
          {tab === "mlops" && (
            <div className="glass-card mt-3">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>🤖 Machine Learning Operations (MLOps)</h3>
                  <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginTop: "0.25rem" }}>
                    Manually trigger retraining of the AI models using the latest live database parameters.
                  </p>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ background: "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)", padding: "0.75rem 1.5rem", border: "none", boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  onClick={() => handleRetrain('All Ensemble Models')}
                >
                  🚀 Train ALL Models Ensemble
                </button>
              </div>
              
              <div className="grid-3 mt-3">
                <div className="glass-card-dark" style={{ textAlign: "center" }}>
                  <h4 style={{ color: "var(--yellow-wheat)" }}>Market Price Prediction</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", minHeight:"40px" }}>Retrain using recent completed order prices and community intelligence data.</p>
                  <button className="btn-secondary mt-2" onClick={() => handleRetrain('Price Model')}>
                    🔄 Retrain Model
                  </button>
                </div>
                
                <div className="glass-card-dark" style={{ textAlign: "center" }}>
                  <h4 style={{ color: "var(--blue-light)" }}>Fraud Detection Engine</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", minHeight:"40px" }}>Analyze new transaction metadata and flagged reports.</p>
                  <button className="btn-secondary mt-2" onClick={() => handleRetrain('Fraud Detection Model')}>
                    🔄 Retrain Model
                  </button>
                </div>

                <div className="glass-card-dark" style={{ textAlign: "center" }}>
                  <h4 style={{ color: "var(--green-light)" }}>Seasonality & Demand</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", minHeight:"40px" }}>Update optimal planting/selling predictions based on current month & region.</p>
                  <button className="btn-secondary mt-2" onClick={() => handleRetrain('Seasonality Model')}>
                    🔄 Retrain Model
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "waste" && (
            <div className="glass-card mt-3">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>♻️ Circular Economy (Organic Waste)</h3>
                  <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginTop: "0.25rem" }}>
                    Manage organic vegetable/fruit waste collected by agents during delivery.
                  </p>
                </div>
                <button className="btn-primary" onClick={() => {
                  alert("Simulating sale of 100kg organic waste to Biogas Plant for ₹1,200. Revenue added to platform!");
                }}>
                  💸 Sell 100kg to Biogas Plant
                </button>
              </div>
              <div className="stats-grid">
                <div className="stat-card" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white" }}>
                  <h4>Total Waste Collected</h4>
                  <p className="val">2,450 kg</p>
                </div>
                <div className="stat-card" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "white" }}>
                  <h4>Reward Pts Issued</h4>
                  <p className="val">24,500 pts</p>
                </div>
                <div className="stat-card" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white" }}>
                  <h4>Waste Revenue</h4>
                  <p className="val">₹29,400</p>
                </div>
              </div>
            </div>
          )}

          {tab === "soiltests" && (
            <div className="glass-card mt-3">
              <h3 className="section-title" style={{ margin: 0 }}>🧪 Physical Soil Tests Requested</h3>
              <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginTop: "0.25rem" }}>
                Farmers who requested physical soil tests during registration or from their dashboard.
              </p>
              <table className="rs-table mt-3">
                <thead>
                  <tr>
                    <th>Farmer Name</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mock data representing physical requests */}
                  <tr>
                    <td>Duniya Farmer</td>
                    <td>Hyderabad Outskirts</td>
                    <td><span className="badge warning">Pending Assignment</span></td>
                    <td>
                      <button className="btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }} onClick={() => alert("Dispatching Soil Test Team!")}>
                        Dispatch Team (69% Discount applied)
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === "clearance" && (
            <div className="glass-card mt-3">
              <h3 className="section-title">❄️ Cold Storage Clearance Stock</h3>
              <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>
                Perishable stock sold by farmers at the end of the day. Stored in Admin warehouses.
              </p>
              {clearanceStock.length === 0 ? (
                <p>No clearance stock available.</p>
              ) : (
                <table className="rs-table">
                  <thead>
                    <tr>
                      <th>Crop</th>
                      <th>Quantity</th>
                      <th>Original Farmer</th>
                      <th>Warehouse</th>
                      <th>Admin Selling Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clearanceStock.map(c => (
                      <tr key={c._id}>
                        <td>{c.name}</td>
                        <td>{c.quantity} {c.unit}</td>
                        <td>{c.originalFarmer?.name || "Unknown"}</td>
                        <td>{c.coldStorageLocation}</td>
                        <td style={{ color: "var(--yellow-wheat)" }}>₹{c.price}/{c.unit}</td>
                        <td>
                          <button className="btn-secondary" onClick={() => updateClearancePrice(c._id, c.price)}>✏️ Edit Price</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "broadcasts" && (
            <div className="glass-card mt-3">
              <h3 className="section-title">📢 Educational & Promotional Broadcasts</h3>
              <p style={{ color:"var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>
                Send push notifications directly to farmers to influence crop production and eco-friendly practices.
              </p>
              
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <button className="btn-secondary" onClick={() => handleEducationalBroadcast("🌱 Promote Millets", "High demand predicted for Millets. Reduce Rice cultivation and switch to Millets for higher profits and better soil health!")}>
                  🌾 Send "Grow Millets" Promo
                </button>
                <button className="btn-secondary" onClick={() => handleEducationalBroadcast("🔥 Stop Crop Burning", "Warning: Burning leftover crop waste causes severe air pollution. Use our Biogas agents to collect waste for reward points instead!")}>
                  🚫 Send "Stop Crop Burning" Alert
                </button>
                <button className="btn-secondary" onClick={() => handleEducationalBroadcast("☔ Rain Alert", "Heavy rainfall expected this week. Ensure your crops are protected and delay sowing if necessary.")}>
                  ☔ Send Rain Alert
                </button>
              </div>

              <div style={{ background: "rgba(59, 130, 246, 0.05)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <h4 style={{ marginBottom: "0.5rem" }}>Custom Broadcast</h4>
                <input type="text" className="rs-input mb-2" placeholder="Broadcast Title" id="broadcastTitle" />
                <textarea className="rs-input mb-2" placeholder="Write your educational message here..." rows={3} id="broadcastMessage"></textarea>
                <button className="btn-primary" onClick={() => {
                  const t = document.getElementById("broadcastTitle").value;
                  const m = document.getElementById("broadcastMessage").value;
                  if (t && m) handleEducationalBroadcast(t, m);
                }}>Send Custom Broadcast 🚀</button>
              </div>
            </div>
          )}

          {/* ── SOIL TESTING MANAGEMENT TAB ── */}
          {tab === "soil" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ color: "var(--text-dark)", fontSize: "1.3rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🧪</span> Soil Testing Lab & Field Team Dispatch Center
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>
                    Review farmer soil scan requests, verify advance payments, assign mobile testing lab units, and publish certified Soil Health Cards.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {[
                    { id: "all", label: `All (${soilRequests.length})` },
                    { id: "pending_assignment", label: `⏳ Pending Team (${soilRequests.filter(s => s.status === 'pending_assignment').length})` },
                    { id: "team_assigned", label: `👨‍🔬 Team Dispatched (${soilRequests.filter(s => s.status === 'team_assigned').length})` },
                    { id: "report_published", label: `📜 Certified Reports (${soilRequests.filter(s => s.status === 'report_published').length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      className={`tab-btn ${soilFilter === f.id ? "active" : ""}`}
                      onClick={() => setSoilFilter(f.id)}
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {soilRequests.filter(s => soilFilter === "all" || s.status === soilFilter).length === 0 ? (
                <div className="glass-card text-center" style={{ padding: "3rem" }}>
                  <p style={{ fontSize: "3rem" }}>🧪</p>
                  <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>No soil testing requests in this category.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Farmer & Location</th>
                        <th>Soil Type & AI Scan</th>
                        <th>Land & Spots</th>
                        <th>Advance Payment</th>
                        <th>Preferred Date</th>
                        <th>Status</th>
                        <th>Assigned Team / Report</th>
                        <th>Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soilRequests
                        .filter(s => soilFilter === "all" || s.status === soilFilter)
                        .map(s => {
                          const isPending = s.status === "pending_assignment";
                          const isAssigned = s.status === "team_assigned";
                          const isPublished = s.status === "report_published";

                          return (
                            <tr key={s._id}>
                              <td>
                                <strong style={{ color: "var(--text-dark)" }}>{s.farmerName}</strong>
                                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{s.phone}</div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>📍 {s.farmLocation}</div>
                                {s.latitude && <div style={{ fontSize: "0.72rem", color: "#0284c7" }}>Coords: {s.latitude.toFixed(3)}, {s.longitude.toFixed(3)}</div>}
                              </td>
                              <td>
                                <span style={{ fontWeight: 700, color: "#166534", fontSize: "0.85rem" }}>
                                  🌱 {s.aiPreliminaryClassification?.soilType || "General Soil"}
                                </span>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  {s.aiPreliminaryClassification?.confidence}% AI Confidence
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "#475569", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {s.aiPreliminaryClassification?.texture}
                                </div>
                              </td>
                              <td>
                                <div><strong>{s.farmSizeAcres}</strong> Acres</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.appointmentDetails?.samplingSpotsCount || 3} sample spots</div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: "#16a34a" }}>
                                  ₹{s.appointmentDetails?.advanceAmount || 299} Paid ✅
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                  Mode: {s.appointmentDetails?.paymentMode?.toUpperCase()} • Bal: ₹{s.appointmentDetails?.balanceAmount || 500}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                                  {new Date(s.appointmentDetails?.preferredDate).toLocaleDateString("en-IN")}
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                  {s.appointmentDetails?.preferredTimeSlot}
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${isPublished ? "badge-green" : isAssigned ? "badge-blue" : "badge-yellow"}`} style={{ textTransform: "capitalize" }}>
                                  {s.status.replace("_", " ")}
                                </span>
                              </td>
                              <td>
                                {isAssigned && (
                                  <div style={{ fontSize: "0.8rem" }}>
                                    <strong style={{ color: "#1e40af" }}>{s.assignedTeam?.scientistName}</strong>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>🚐 {s.assignedTeam?.teamVehicleNumber}</div>
                                    <div style={{ fontSize: "0.72rem", color: "#16a34a" }}>Visit: {new Date(s.assignedTeam?.scheduledVisitDate).toLocaleDateString("en-IN")}</div>
                                  </div>
                                )}
                                {isPublished && (
                                  <div style={{ fontSize: "0.8rem", color: "#166534" }}>
                                    <strong>pH {s.soilHealthReport?.phLevel}</strong> • {s.soilHealthReport?.phCategory}
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>OC: {s.soilHealthReport?.organicCarbonPercent}% • NPK Tested</div>
                                  </div>
                                )}
                                {isPending && (
                                  <span style={{ fontSize: "0.78rem", color: "#b45309" }}>⏳ Awaiting Team Dispatch</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                  {isPending && (
                                    <button
                                      className="btn-primary"
                                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem", background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
                                      onClick={() => {
                                        setSoilAssignModal(s);
                                        const nextDay = new Date();
                                        nextDay.setDate(nextDay.getDate() + 1);
                                        setSoilAssignForm(f => ({ ...f, scheduledVisitDate: nextDay.toISOString().split("T")[0] }));
                                      }}
                                    >
                                      👨‍🔬 Assign Team
                                    </button>
                                  )}
                                  {isAssigned && (
                                    <button
                                      className="btn-primary"
                                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem", background: "linear-gradient(135deg, #15803d, #166534)" }}
                                      onClick={() => {
                                        setSoilReportModal(s);
                                      }}
                                    >
                                      📋 Publish Lab Report
                                    </button>
                                  )}
                                  {isPublished && (
                                    <button
                                      className="btn-secondary"
                                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.78rem" }}
                                      onClick={() => {
                                        setSoilReportModal(s);
                                      }}
                                    >
                                      ✏️ Edit Report
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── FINANCIALS TAB ── */}
          {tab === "financials" && (
            <AdminFinancials />
          )}

          {/* ── GROWTH TIPS TAB ── */}
          {tab === "tips" && (
            <AdminTips stats={stats} />
          )}
        </>
      )}

      {/* ── ASSIGN SOIL TESTING TEAM MODAL ── */}
      {soilAssignModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem"
        }}>
          <div style={{
            background: "white", borderRadius: "16px", maxWidth: "560px", width: "100%",
            padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ color: "#1d4ed8", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              👨‍🔬 Assign Mobile Soil Testing Lab Team
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
              Assigning field scientist for farmer <strong>{soilAssignModal.farmerName}</strong> at <strong>{soilAssignModal.farmLocation}</strong>.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await API.put(`/soil-test/${soilAssignModal._id}/assign-team`, soilAssignForm);
                  if (res.data.success) {
                    flash("success", "✅ Soil testing team assigned successfully! Farmer notified.");
                    setSoilAssignModal(null);
                    loadAll();
                  }
                } catch (err) {
                  flash("error", err.response?.data?.error || "Failed to assign team.");
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label className="field-label">Select Testing Chemist / Mobile Lab Unit:</label>
                <select
                  className="rs-input"
                  value={soilAssignForm.scientistName}
                  onChange={e => {
                    const val = e.target.value;
                    let veh = "TS-09-LAB-1029";
                    let ph = "9848099881";
                    if (val.includes("Sunita")) { veh = "TS-07-AG-8812"; ph = "9440192834"; }
                    if (val.includes("Venkatesh")) { veh = "TS-10-SL-4519"; ph = "9701182736"; }
                    setSoilAssignForm(f => ({ ...f, scientistName: val, teamVehicleNumber: veh, contactPhone: ph }));
                  }}
                >
                  <option value="Dr. Arvind Swamy (Soil Chemist - Unit 04)">Dr. Arvind Swamy, M.Sc (Soil Chemistry) — Mobile Unit 04</option>
                  <option value="Dr. P. Sunita (Agronomy Lab Lead - Unit 02)">Dr. P. Sunita, Ph.D (Agronomy) — Regional Unit 02</option>
                  <option value="Prof. M. Venkatesh (Soil Pathology Unit 01)">Prof. M. Venkatesh (Soil Pathology) — Mobile Van 01</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="field-label">Vehicle / Mobile Lab No:</label>
                  <input
                    type="text"
                    className="rs-input"
                    value={soilAssignForm.teamVehicleNumber}
                    onChange={e => setSoilAssignForm({ ...soilAssignForm, teamVehicleNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Team Contact Phone:</label>
                  <input
                    type="text"
                    className="rs-input"
                    value={soilAssignForm.contactPhone}
                    onChange={e => setSoilAssignForm({ ...soilAssignForm, contactPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Scheduled Field Visit Date:</label>
                <input
                  type="date"
                  className="rs-input"
                  value={soilAssignForm.scheduledVisitDate}
                  onChange={e => setSoilAssignForm({ ...soilAssignForm, scheduledVisitDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field-label">Admin Instructions / Field Notes:</label>
                <textarea
                  rows={2}
                  className="rs-input"
                  value={soilAssignForm.adminNotes}
                  onChange={e => setSoilAssignForm({ ...soilAssignForm, adminNotes: e.target.value })}
                  placeholder="e.g. Conduct 3-spot zigzag sampling with digital pH & spectrometer..."
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setSoilAssignModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}>
                  ✅ Confirm & Dispatch Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PUBLISH LAB REPORT MODAL ── */}
      {soilReportModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem"
        }}>
          <div style={{
            background: "white", borderRadius: "16px", maxWidth: "640px", width: "100%",
            padding: "2rem", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ color: "#15803d", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              📜 Publish Certified Laboratory Soil Health Report
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
              Enter measured spectrometer & chemical test values for farmer <strong>{soilReportModal.farmerName}</strong>.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await API.put(`/soil-test/${soilReportModal._id}/publish-report`, soilReportForm);
                  if (res.data.success) {
                    flash("success", "📜 Certified Soil Health Report published! Digital card delivered to farmer.");
                    setSoilReportModal(null);
                    loadAll();
                  }
                } catch (err) {
                  flash("error", err.response?.data?.error || "Failed to publish report.");
                }
              }}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="field-label">Measured Soil pH (e.g. 6.5 - 7.5):</label>
                  <input
                    type="number"
                    step="0.1"
                    className="rs-input"
                    value={soilReportForm.phLevel}
                    onChange={e => setSoilReportForm({ ...soilReportForm, phLevel: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Organic Carbon % (OC):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="rs-input"
                    value={soilReportForm.organicCarbonPercent}
                    onChange={e => setSoilReportForm({ ...soilReportForm, organicCarbonPercent: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="field-label">Nitrogen (N):</label>
                  <input
                    type="text"
                    className="rs-input"
                    value={soilReportForm.nitrogenN}
                    onChange={e => setSoilReportForm({ ...soilReportForm, nitrogenN: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Phosphorus (P):</label>
                  <input
                    type="text"
                    className="rs-input"
                    value={soilReportForm.phosphorusP}
                    onChange={e => setSoilReportForm({ ...soilReportForm, phosphorusP: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Potassium (K):</label>
                  <input
                    type="text"
                    className="rs-input"
                    value={soilReportForm.potassiumK}
                    onChange={e => setSoilReportForm({ ...soilReportForm, potassiumK: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Electrical Conductivity (EC):</label>
                <input
                  type="text"
                  className="rs-input"
                  value={soilReportForm.electricalConductivityEC}
                  onChange={e => setSoilReportForm({ ...soilReportForm, electricalConductivityEC: e.target.value })}
                />
              </div>

              <div>
                <label className="field-label">Fertilizer & Organic Manure Prescription:</label>
                <textarea
                  rows={3}
                  className="rs-input"
                  value={soilReportForm.recommendedManure}
                  onChange={e => setSoilReportForm({ ...soilReportForm, recommendedManure: e.target.value })}
                  placeholder="e.g. Apply 2 tonnes/acre Farm Yard Manure + 250kg Vermicompost + 5kg PSB biofertilizer..."
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setSoilReportModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: "linear-gradient(135deg, #15803d, #166534)" }}>
                  📜 Publish Certified Soil Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGN AGENT MODAL ── */}
      {assignModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setAssignModal(null); }}>
          <div className="glass-card-dark" style={{ maxWidth:480, width:"100%" }}>
            <h3 className="section-title">🚚 Assign Delivery Agent</h3>
            <p style={{ color: "var(--text-muted)", fontSize:"0.85rem", marginBottom:"1rem" }}>
              Order: <strong style={{ color:"var(--yellow-wheat)" }}>#{assignModal.billNumber || assignModal._id?.substring(0,8)}</strong> — {assignModal.crop?.name}
            </p>
            <p style={{ color:"var(--text-muted)", fontSize:"0.82rem", marginBottom:"1.5rem" }}>
              📍 Deliver to: {assignModal.deliveryAddress?.substring(0,60) || "No address"}
            </p>

            {agents.length === 0 ? (
              <p style={{ color:"var(--text-muted)" }}>No delivery agents registered yet.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {agents.map(a => {
                  const dist = getDistance(assignModal.deliveryLatitude, assignModal.deliveryLongitude, a.latitude, a.longitude);
                  const isNear = dist < 10;
                  return { ...a, dist, isNear };
                }).sort((a, b) => a.dist - b.dist).map(a => (
                  <div key={a._id} className="delivery-option" onClick={() => assignAgent(assignModal._id, a._id)}
                    style={{ 
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      border: a.isNear ? "1px solid var(--green-light)" : "1px solid rgba(255,255,255,0.1)",
                      background: a.isNear ? "rgba(34, 197, 94, 0.05)" : "transparent",
                      padding: "0.5rem", borderRadius: "8px", cursor: "pointer"
                    }}>
                    <div>
                      <h4 style={{ color: a.isNear ? "var(--green-light)" : "var(--cream)" }}>
                        {a.name} {a.isNear && "📍 (Best Match)"}
                      </h4>
                      <p>{a.phone || "No phone"} • {a.location?.substring(0,25) || "No location"}</p>
                      {a.dist !== Infinity ? (
                        <p style={{ color:"var(--yellow-wheat)", fontSize:"0.75rem", marginTop:"0.2rem" }}>
                          🛣️ ~{a.dist.toFixed(1)} km away from delivery location
                        </p>
                      ) : (
                        <p style={{ color:"var(--text-muted)", fontSize:"0.75rem", marginTop:"0.2rem" }}>
                          📍 Unknown exact distance
                        </p>
                      )}
                    </div>
                    <button className="btn-primary" style={{ width:"auto", padding:"0.5rem 1rem", fontSize:"0.82rem" }}>Assign</button>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-secondary mt-2" style={{ width:"100%" }} onClick={() => setAssignModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── FULL MONGODB USER PROFILE INSPECTOR MODAL ── */}
      {selectedUserModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "1.5rem"
        }}>
          <div style={{
            background: "white", borderRadius: "18px", maxWidth: "780px", width: "100%",
            maxHeight: "90vh", overflowY: "auto", padding: "2rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative"
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedUserModal(null)}
              style={{
                position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f1f5f9",
                border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: "1.1rem",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.2rem" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", background: "var(--green-pale)",
                color: "var(--green-deep)", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold", fontSize: "1.5rem", flexShrink: 0,
                backgroundImage: selectedUserModal.avatar ? `url(${selectedUserModal.avatar.startsWith("http") || selectedUserModal.avatar.startsWith("data:") ? selectedUserModal.avatar : `${BASE_URL}/${selectedUserModal.avatar.replace(/^\/+/, "")}`})` : "none",
                backgroundSize: "cover", backgroundPosition: "center"
              }}>
                {!selectedUserModal.avatar && (selectedUserModal.name ? selectedUserModal.name.charAt(0).toUpperCase() : "U")}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <h2 style={{ color: "var(--text-dark)", fontSize: "1.4rem", margin: 0 }}>{selectedUserModal.name}</h2>
                  <span className={`badge ${roleColor[selectedUserModal.role] || "badge-blue"}`} style={{ textTransform: "uppercase" }}>
                    {selectedUserModal.role}
                  </span>
                  <span className={`badge ${selectedUserModal.isVerified ? "badge-green" : "badge-yellow"}`}>
                    {selectedUserModal.isVerified ? "✅ Verified" : "⏳ Pending Verification"}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>
                  {selectedUserModal.email} • ID: <code style={{ fontSize: "0.78rem" }}>{selectedUserModal._id}</code>
                </p>
              </div>
            </div>

            {/* Grid of MongoDB Information */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              {/* Personal & Contact Details */}
              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "var(--green-deep)", fontSize: "0.95rem", margin: "0 0 0.8rem 0" }}>👤 Personal & Contact Info</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.84rem" }}>
                  <div><strong>Phone:</strong> {selectedUserModal.phone || "Not provided"}</div>
                  <div><strong>Location:</strong> {selectedUserModal.location || "Not provided"}</div>
                  <div><strong>GPS Coords:</strong> {selectedUserModal.latitude ? `${selectedUserModal.latitude}, ${selectedUserModal.longitude}` : "Default (17.385, 78.486)"}</div>
                  <div><strong>Preferred Lang:</strong> {selectedUserModal.language?.toUpperCase() || "EN"}</div>
                  <div><strong>Aadhaar No:</strong> {selectedUserModal.aadhaar || "Not uploaded"}</div>
                  <div><strong>Account Status:</strong> <span style={{ textTransform: "capitalize", fontWeight: 600, color: selectedUserModal.accountStatus === "banned" ? "#dc2626" : "#16a34a" }}>{selectedUserModal.accountStatus || "active"}</span></div>
                  <div><strong>Joined Date:</strong> {new Date(selectedUserModal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
              </div>

              {/* Financial & Trust Balances */}
              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ color: "var(--green-deep)", fontSize: "0.95rem", margin: "0 0 0.8rem 0" }}>💳 Financials & Reputation</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.84rem" }}>
                  <div><strong>Wallet Balance:</strong> ₹{(selectedUserModal.walletBalance || 0).toLocaleString()}</div>
                  <div><strong>Pending Settlements:</strong> ₹{(selectedUserModal.pendingSettlement || 0).toLocaleString()}</div>
                  <div><strong>Cash In Hand:</strong> ₹{(selectedUserModal.cashInHand || 0).toLocaleString()}</div>
                  <div><strong>Reward Points:</strong> 🪙 {selectedUserModal.rewardPoints || 0} pts</div>
                  <div><strong>Trust Score:</strong> 🛡️ {selectedUserModal.trustScore || 85}/100</div>
                  <div><strong>Strikes Recorded:</strong> ⚠️ {selectedUserModal.strikes || 0} Strikes</div>
                </div>
              </div>
            </div>

            {/* Farmer Specific Details */}
            {selectedUserModal.role === "farmer" && (
              <div style={{ background: "#f0fdf4", padding: "1.2rem", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#166534", fontSize: "0.95rem", margin: "0 0 0.8rem 0" }}>🌾 Farm Details (MongoDB Farmer Profile)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <div><strong>Farm Name:</strong> {selectedUserModal.farmerProfile?.farmName || selectedUserModal.farmName || `${selectedUserModal.name}'s Farm`}</div>
                  <div><strong>Farm Location:</strong> {selectedUserModal.farmerProfile?.farmLocation || selectedUserModal.location || "Telangana"}</div>
                  <div><strong>Farm Size:</strong> {selectedUserModal.farmerProfile?.farmSize || "5"} Acres</div>
                  <div><strong>Soil Type:</strong> {selectedUserModal.farmerProfile?.soilType || "Loamy Red Soil"}</div>
                  <div><strong>Farming Experience:</strong> {selectedUserModal.farmerProfile?.experience || "10"} Years</div>
                  <div><strong>Trust Grade:</strong> {selectedUserModal.farmerProfile?.trustGrade || "Gold"}</div>
                </div>

                {/* Uploaded Crops by this Farmer */}
                {selectedUserModal.crops && selectedUserModal.crops.length > 0 && (
                  <div style={{ marginTop: "1rem", borderTop: "1px dashed #86efac", paddingTop: "0.8rem" }}>
                    <strong style={{ fontSize: "0.85rem", color: "#166534", display: "block", marginBottom: "0.5rem" }}>
                      📦 Uploaded Crops by {selectedUserModal.name} ({selectedUserModal.crops.length} items):
                    </strong>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {selectedUserModal.crops.map((c, i) => (
                        <span key={i} style={{ background: "white", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", border: "1px solid #bbf7d0", color: "#166534", fontWeight: 600 }}>
                          🌾 {c.name} — ₹{c.price}/{c.unit || "kg"} ({c.quantity}kg) {c.isOrganic && "🌿"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customer Specific Details */}
            {selectedUserModal.role === "customer" && (
              <div style={{ background: "#eff6ff", padding: "1.2rem", borderRadius: "12px", border: "1px solid #bfdbfe", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "#1e40af", fontSize: "0.95rem", margin: "0 0 0.8rem 0" }}>🛍️ Customer Profile (MongoDB Customer Details)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <div><strong>Default Address:</strong> {selectedUserModal.customerProfile?.address || selectedUserModal.location || "Hyderabad, Telangana"}</div>
                  <div><strong>Customer Type:</strong> {selectedUserModal.customerType || "individual"}</div>
                  <div><strong>Daily Deliveries:</strong> {selectedUserModal.requiresDailyDelivery ? "Yes" : "No"}</div>
                  <div><strong>Total Orders Placed:</strong> {selectedUserModal.ordersCount || 0} Orders</div>
                </div>
              </div>
            )}

            {/* Uploaded Documents & Photos Gallery */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "var(--text-dark)", fontSize: "0.95rem", marginBottom: "0.8rem" }}>📷 Uploaded Photos & Documents</h4>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {[
                  { label: "Profile / Avatar", path: selectedUserModal.avatar },
                  { label: "Aadhaar Card", path: selectedUserModal.aadhaarImage },
                  { label: "Farmer Photo", path: selectedUserModal.farmerProfile?.farmerPhoto },
                  { label: "Farm Photo", path: selectedUserModal.farmerProfile?.farmPhoto },
                  { label: "Product Photo", path: selectedUserModal.farmerProfile?.productPhoto }
                ].filter(p => p.path).map((photo, i) => {
                  const url = photo.path.startsWith("http") || photo.path.startsWith("data:") ? photo.path : `${BASE_URL}/${photo.path.replace(/^\/+/, "")}`;
                  return (
                    <div key={i} style={{ textAlign: "center" }}>
                      <a href={url} target="_blank" rel="noreferrer" title="Click to view full image">
                        <img 
                          src={url} 
                          alt={photo.label} 
                          style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "10px", border: "2px solid #cbd5e1", display: "block" }} 
                        />
                      </a>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem", display: "block" }}>{photo.label}</span>
                    </div>
                  );
                })}
                {![selectedUserModal.avatar, selectedUserModal.aadhaarImage, selectedUserModal.farmerProfile?.farmerPhoto, selectedUserModal.farmerProfile?.farmPhoto].some(Boolean) && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>No custom photo files uploaded for this user.</p>
                )}
              </div>
            </div>

            {/* Complete Raw MongoDB Document Inspector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <details style={{ background: "#0f172a", color: "#38bdf8", padding: "0.8rem 1rem", borderRadius: "10px", fontSize: "0.78rem" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, color: "#94a3b8" }}>
                  💻 View Complete Raw MongoDB Document JSON (Click to expand)
                </summary>
                <pre style={{ marginTop: "0.8rem", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "200px", overflowY: "auto", color: "#4ade80", fontFamily: "monospace" }}>
                  {JSON.stringify(selectedUserModal, null, 2)}
                </pre>
              </details>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "1.2rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {!selectedUserModal.isVerified ? (
                  <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { verifyFarmer(selectedUserModal._id, selectedUserModal.name); setSelectedUserModal(null); }}>
                    ✅ Approve & Verify
                  </button>
                ) : (
                  <button className="btn-warn" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { rejectFarmer(selectedUserModal._id, selectedUserModal.name); setSelectedUserModal(null); }}>
                    ❌ Revoke Verification
                  </button>
                )}
                {selectedUserModal.role !== "admin" && (
                  <button className="btn-danger" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => { deleteUser(selectedUserModal._id, selectedUserModal.name); setSelectedUserModal(null); }}>
                    🗑️ Delete User
                  </button>
                )}
              </div>
              <button className="btn-secondary" style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }} onClick={() => setSelectedUserModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BROADCAST DEMAND MODAL ── */}
      {broadcastModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setBroadcastModal(false); }}
        >
          <div className="glass-card-dark" style={{ maxWidth: 540, width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", padding: "2rem" }}>
            <h3 className="section-title" style={{ color: "white", marginBottom: "0.5rem" }}>
              📢 Broadcast Consumer Demand Alert
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Alert registered farmers about high consumer search spikes. Farmers will see this in their Demand Center and Add Crop flow.
            </p>

            <form onSubmit={handleCreateDemandBroadcast} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Crop Name *</label>
                  <input
                    className="rs-input"
                    type="text"
                    value={broadcastForm.cropName}
                    onChange={(e) => setBroadcastForm(f => ({ ...f, cropName: e.target.value }))}
                    placeholder="e.g. Tomato, Onion"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Target Volume (kg) *</label>
                  <input
                    className="rs-input"
                    type="number"
                    value={broadcastForm.targetQuantityKg}
                    onChange={(e) => setBroadcastForm(f => ({ ...f, targetQuantityKg: Number(e.target.value) }))}
                    placeholder="e.g. 1000"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Suggested Farmer Price (₹/kg)</label>
                  <input
                    className="rs-input"
                    type="number"
                    value={broadcastForm.suggestedPrice}
                    onChange={(e) => setBroadcastForm(f => ({ ...f, suggestedPrice: Number(e.target.value) }))}
                    placeholder="e.g. 38"
                  />
                </div>
                <div className="form-group">
                  <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Priority Level</label>
                  <select
                    className="rs-select"
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm(f => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="urgent">🚨 Urgent (Surge Spike)</option>
                    <option value="high">🔥 High Demand</option>
                    <option value="normal">⚖️ Standard Deficit</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Target Region</label>
                <select
                  className="rs-select"
                  value={broadcastForm.targetRegion}
                  onChange={(e) => setBroadcastForm(f => ({ ...f, targetRegion: e.target.value }))}
                >
                  <option value="All Regions">🌐 All Regions (Telangana & Andhra)</option>
                  <option value="Hyderabad & Rangareddy">📍 Hyderabad & Rangareddy</option>
                  <option value="Warangal Urban & Rural">📍 Warangal Urban & Rural</option>
                  <option value="Karimnagar & Nizamabad">📍 Karimnagar & Nizamabad</option>
                  <option value="Nalgonda Cluster">📍 Nalgonda Cluster</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Custom Broadcast Advisory Message</label>
                <textarea
                  className="rs-input"
                  rows={3}
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Explain why consumer demand is high and encourage farmers to harvest/supply..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "auto" }}
                  onClick={() => setBroadcastModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "auto", background: "linear-gradient(135deg, #16a34a, #15803d)", fontWeight: 700 }}
                >
                  📢 Send Broadcast to Farmers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FLEET REASSIGN & OVERRIDE MODAL ── */}
      {fleetReassignModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setFleetReassignModal(null); }}
        >
          <div className="glass-card-dark" style={{ maxWidth: 500, width: "100%", background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", padding: "2rem" }}>
            <h3 className="section-title" style={{ color: "white", marginBottom: "0.5rem" }}>
              🔄 Reassign Fleet Delivery & Vehicle Tier
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.2rem" }}>
              Delivery: <strong style={{ color: "var(--yellow-wheat)" }}>{fleetReassignModal.trackingCode || fleetReassignModal._id}</strong>
            </p>

            <form onSubmit={handleFleetReassign} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Select Driver / Courier Agent *</label>
                <select
                  className="rs-select"
                  value={fleetReassignForm.agentId}
                  onChange={(e) => setFleetReassignForm(f => ({ ...f, agentId: e.target.value }))}
                  required
                >
                  <option value="">-- Choose Agent --</option>
                  {agents.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.phone || "No phone"}) — {a.location || "Online"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Vehicle Tier & Logistics Role *</label>
                <select
                  className="rs-select"
                  value={fleetReassignForm.vehicleTier}
                  onChange={(e) => setFleetReassignForm(f => ({
                    ...f,
                    vehicleTier: e.target.value,
                    algorithm: e.target.value === "heavy_truck" ? "tsp_genetic" : "dabbawala_cluster"
                  }))}
                >
                  <option value="heavy_truck">🚛 Heavy Freight Truck (Farm ➔ Cold Storage Hub)</option>
                  <option value="dabbawala_rider">🚲 Hyperlocal Dabbawala Courier (Cold Hub ➔ Doorstep)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Route Optimization Algorithm</label>
                <select
                  className="rs-select"
                  value={fleetReassignForm.algorithm}
                  onChange={(e) => setFleetReassignForm(f => ({ ...f, algorithm: e.target.value }))}
                >
                  <option value="tsp_genetic">🧬 Highway TSP Genetic Metaheuristic (Long-haul)</option>
                  <option value="dabbawala_cluster">🚲 2km Radial Micro-Cluster Batching (Hyperlocal)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="field-label" style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Dispatch Notes / Route Instructions</label>
                <input
                  className="rs-input"
                  type="text"
                  value={fleetReassignForm.notes}
                  onChange={(e) => setFleetReassignForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Prioritize Cold Hub Bay 3 unloading"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "auto" }}
                  onClick={() => setFleetReassignModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "auto", background: "linear-gradient(135deg, #0284c7, #0369a1)", fontWeight: 700 }}
                >
                  💾 Save & Push Route to Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

