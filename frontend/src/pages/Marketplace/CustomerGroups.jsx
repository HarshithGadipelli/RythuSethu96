import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TrendingDown, Target, CheckCircle, Plus, Share2, Copy, Sparkles, MapPin, Search, ArrowRight, ShieldCheck } from "lucide-react";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

export default function CustomerGroups({ crops = [], preselectedCrop = null, onClearPreselected = () => {} }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [cropsList, setCropsList] = useState(crops || []);
  const [loading, setLoading] = useState(true);
  const [joinQty, setJoinQty] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [copiedId, setCopiedId] = useState(null);

  // Quick Join by ID State
  const [poolCodeInput, setPoolCodeInput] = useState("");
  const [poolCodeQty, setPoolCodeQty] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  // Create Pool State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submittingPool, setSubmittingPool] = useState(false);
  const [newPool, setNewPool] = useState({
    name: "",
    cropId: "",
    targetQuantity: 100,
    quantity: 15,
    region: user?.location || ""
  });

  // Ensure crops list is available even if not passed
  useEffect(() => {
    if (crops && crops.length > 0) {
      setCropsList(crops);
    } else {
      API.get("/crops")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setCropsList(res.data);
          }
        })
        .catch((err) => console.error("Could not fetch crops for pools:", err));
    }
  }, [crops]);

  // Handle preselected crop triggered from marketplace crop cards
  useEffect(() => {
    if (preselectedCrop) {
      setNewPool((prev) => ({
        ...prev,
        cropId: preselectedCrop._id,
        name: `${preselectedCrop.name} Neighbourhood Pool`,
        targetQuantity: 100,
        quantity: 10,
        region: user?.location || "Local Community"
      }));
      setShowCreateModal(true);
    }
  }, [preselectedCrop, user]);

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups/crop/all");
      if (res.data && Array.isArray(res.data)) {
        // Filter out any entries with missing crops
        const valid = res.data.filter((g) => g.crop != null);
        setGroups(valid);
      } else {
        setGroups([]);
      }
    } catch (e) {
      console.error("Failed to load groups:", e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoin = async (groupId) => {
    const qty = Number(joinQty[groupId]);
    if (!qty || qty < 1) {
      setMsg({ type: "error", text: "Please enter a valid quantity to pledge." });
      return;
    }
    try {
      const uId = user?._id || user?.id || "guest";
      await API.post(`/groups/join/${groupId}`, { userId: uId, quantity: qty });
      setMsg({ type: "success", text: `🎉 Successfully pledged ${qty} units to the pool!` });
      setJoinQty((prev) => ({ ...prev, [groupId]: "" }));
      await fetchGroups();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.error || "Failed to join pool." });
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!poolCodeInput.trim()) {
      setMsg({ type: "error", text: "Please enter a valid Pool ID (e.g. POOL-TOM50)." });
      return;
    }
    const qty = Number(poolCodeQty) || 5;
    setJoiningCode(true);
    try {
      const uId = user?._id || user?.id || "guest";
      await API.post("/groups/join-by-id", {
        poolId: poolCodeInput.trim().toUpperCase(),
        userId: uId,
        quantity: qty
      });
      setMsg({ type: "success", text: `🎉 Successfully joined pool ${poolCodeInput.toUpperCase()} with ${qty} units!` });
      setPoolCodeInput("");
      setPoolCodeQty("");
      await fetchGroups();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.error || "Pool not found or already closed." });
    } finally {
      setJoiningCode(false);
    }
  };

  const handleOpenCreateModal = (specificCrop = null) => {
    const cropToUse = specificCrop || (cropsList.length > 0 ? cropsList[0] : null);
    setNewPool({
      name: cropToUse ? `${cropToUse.name} Community Pool` : "Fresh Harvest Bulk Pool",
      cropId: cropToUse ? cropToUse._id : "",
      targetQuantity: 100,
      quantity: 15,
      region: user?.location || "Local Hub"
    });
    setShowCreateModal(true);
  };

  const handleCreatePool = async (e) => {
    if (e) e.preventDefault();
    if (!newPool.name.trim() || !newPool.cropId) {
      setMsg({ type: "error", text: "Please provide a Pool Name and choose a Crop." });
      return;
    }
    const tQty = Number(newPool.targetQuantity);
    const pQty = Number(newPool.quantity);
    if (!tQty || tQty < 5) {
      setMsg({ type: "error", text: "Target quantity must be at least 5 units." });
      return;
    }
    if (pQty > tQty) {
      setMsg({ type: "error", text: "Your initial pledge cannot exceed the pool's target quantity." });
      return;
    }

    setSubmittingPool(true);
    try {
      const uId = user?._id || user?.id || "guest";
      const res = await API.post("/groups/create", {
        name: newPool.name.trim(),
        type: "customer_buy",
        cropId: newPool.cropId,
        targetQuantity: tQty,
        quantity: pQty,
        userId: uId,
        region: newPool.region.trim() || user?.location || "Community Neighborhood"
      });

      const created = res.data;
      setMsg({
        type: "success",
        text: `✨ Bulk Pool "${created.name}" created successfully! Pool Code: ${created.poolId}`
      });
      setShowCreateModal(false);
      onClearPreselected();
      await fetchGroups();
    } catch (err) {
      console.error("Pool creation failed:", err);
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to create pool. Please try again." });
    } finally {
      setSubmittingPool(false);
    }
  };

  const copyPoolCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Selected crop details for modal preview
  const selectedCropObj = cropsList.find((c) => c._id === newPool.cropId) || cropsList[0];

  return (
    <div style={{ paddingTop: "0.5rem" }}>
      {/* ── Header Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a, #2563eb, #3b82f6)",
        borderRadius: "16px",
        padding: "2rem",
        color: "white",
        marginBottom: "2rem",
        boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.25)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem"
      }}>
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.2)", padding: "0.3rem 0.8rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            <Sparkles size={14} /> Community Bulk Purchasing
          </div>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#ffffff" }}>
            Pool Together. Buy Direct. Save Up to 15%.
          </h2>
          <p style={{ margin: 0, color: "#dbeafe", fontSize: "1rem", lineHeight: 1.5 }}>
            Team up with neighbors to order directly from farmers in farm-gate bulk quantities.
            Unlock higher wholesale discounts as more community members join!
          </p>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenCreateModal()}
            style={{
              background: "#ffffff",
              color: "#1e40af",
              border: "none",
              padding: "0.9rem 1.6rem",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "1.05rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.15)"
            }}>
            <Plus size={20} color="#2563eb" /> Create Another Pool
          </motion.button>
          <span style={{ fontSize: "0.78rem", color: "#bfdbfe", textAlign: "center" }}>
            Open to all crops & communities
          </span>
        </div>
      </div>

      {/* ── Status Message Alert ── */}
      <AnimatePresence>
        {msg.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "10px",
              marginBottom: "1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              background: msg.type === "error" ? "#fee2e2" : "#dcfce7",
              color: msg.type === "error" ? "#991b1b" : "#166534",
              border: msg.type === "error" ? "1px solid #f87171" : "1px solid #86efac",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
            <span>{msg.text}</span>
            <button
              onClick={() => setMsg({ type: "", text: "" })}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "inherit" }}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Join by Pool ID & Controls ── */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        padding: "1rem 1.5rem",
        marginBottom: "2rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
            <Users size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-dark)" }}>Have a Pool Invite Code?</h4>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Enter your neighbor's pool ID to join their collective order</span>
          </div>
        </div>

        <form onSubmit={handleJoinByCode} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            className="rs-input"
            placeholder="e.g. POOL-TOM50"
            value={poolCodeInput}
            onChange={(e) => setPoolCodeInput(e.target.value)}
            style={{ width: "170px", padding: "0.55rem 0.8rem", textTransform: "uppercase", fontWeight: 600 }}
          />
          <input
            type="number"
            className="rs-input"
            placeholder="Qty (kg)"
            value={poolCodeQty}
            min="1"
            onChange={(e) => setPoolCodeQty(e.target.value)}
            style={{ width: "95px", padding: "0.55rem 0.8rem" }}
          />
          <button
            type="submit"
            disabled={joiningCode}
            className="btn-primary"
            style={{ background: "#2563eb", padding: "0.55rem 1.1rem", fontSize: "0.9rem" }}>
            {joiningCode ? "Joining..." : "Join Pool"}
          </button>
        </form>
      </div>

      {/* ── Active Pools List ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Active Bulk Pools <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 500 }}>({groups.length} live)</span>
        </h3>
        <button
          onClick={() => handleOpenCreateModal()}
          style={{
            background: "rgba(37, 99, 235, 0.08)",
            border: "1px solid rgba(37, 99, 235, 0.3)",
            color: "#2563eb",
            padding: "0.45rem 1rem",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem"
          }}>
          <Plus size={15} /> Start Another Pool
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div className="loader" style={{ margin: "0 auto" }}></div>
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading active pools...</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {groups.map((g) => {
            const tiers = g.tiers && g.tiers.length > 0 ? g.tiers : [{ qty: g.targetQuantity, discount: g.discountPercent || 15 }];
            const maxTier = tiers[tiers.length - 1];
            const pct = Math.min(Math.round(((g.currentQuantity || 0) / (maxTier.qty || g.targetQuantity)) * 100), 100);

            // Active discount tier check
            let currentDiscount = 0;
            let nextTier = tiers[0];
            for (const t of tiers) {
              if (g.currentQuantity >= t.qty) {
                currentDiscount = t.discount;
              } else if (g.currentQuantity < t.qty) {
                nextTier = t;
                break;
              }
            }

            return (
              <motion.div
                whileHover={{ y: -4 }}
                key={g._id}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "1.5rem",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                {/* Discount Badge */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: currentDiscount > 0 ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #dbeafe, #bfdbfe)",
                  color: currentDiscount > 0 ? "#ffffff" : "#1e40af",
                  padding: "0.4rem 0.9rem",
                  borderBottomLeftRadius: "14px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}>
                  <TrendingDown size={13} />
                  {currentDiscount > 0 ? `${currentDiscount}% UNLOCKED` : `UP TO ${maxTier.discount}% OFF`}
                </div>

                <div>
                  {/* Pool ID & Region */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    {g.poolId && (
                      <span
                        onClick={() => copyPoolCode(g.poolId)}
                        title="Click to copy Pool ID"
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}>
                        {copiedId === g.poolId ? "✓ Copied" : g.poolId}
                        <Copy size={11} />
                      </span>
                    )}
                    {g.region && (
                      <span style={{ fontSize: "0.78rem", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <MapPin size={11} /> {g.region}
                      </span>
                    )}
                  </div>

                  {/* Title & Crop Details */}
                  <h4 style={{ color: "var(--text-dark)", fontSize: "1.25rem", margin: "0.3rem 0 0.25rem 0", fontWeight: 700 }}>
                    {g.name}
                  </h4>
                  <p style={{ color: "var(--green-mid)", fontWeight: 600, fontSize: "1rem", margin: "0 0 1.25rem 0" }}>
                    🌾 {g.crop?.name || "Organic Farm Produce"} <span style={{ color: "#64748b", fontWeight: 400 }}>(₹{g.crop?.price || 0}/{g.crop?.unit || "kg"})</span>
                  </p>

                  {/* Progress info */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                      <span><strong style={{ color: "var(--text-dark)" }}>{g.currentQuantity}</strong> {g.crop?.unit || "kg"} pledged ({pct}%)</span>
                      <span style={{ fontWeight: 600, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Target size={13} /> Target: {maxTier.qty} {g.crop?.unit || "kg"}
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div style={{ height: 10, background: "#f1f5f9", borderRadius: 8, position: "relative", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ height: "100%", background: "linear-gradient(90deg, #3b82f6, #16a34a)", borderRadius: 8 }}
                      />
                    </div>

                    {/* Tier Milestones */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.45rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {tiers.map((t, idx) => (
                        <div key={idx} style={{
                          textAlign: idx === tiers.length - 1 ? "right" : idx === 0 ? "left" : "center",
                          color: g.currentQuantity >= t.qty ? "#16a34a" : "inherit",
                          fontWeight: g.currentQuantity >= t.qty ? 700 : 500
                        }}>
                          {t.qty} {g.crop?.unit || "kg"} → {t.discount}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Join Interaction */}
                <div>
                  {pct >= 100 ? (
                    <div style={{
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem"
                    }}>
                      <CheckCircle size={16} /> Maximum 15% Wholesale Discount Reached!
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        type="number"
                        className="rs-input"
                        placeholder={`Qty (${g.crop?.unit || "kg"})`}
                        value={joinQty[g._id] || ""}
                        min="1"
                        onChange={(e) => setJoinQty({ ...joinQty, [g._id]: e.target.value })}
                        style={{ flex: 1, padding: "0.55rem 0.75rem", fontSize: "0.9rem" }}
                      />
                      <button
                        className="btn-primary"
                        onClick={() => handleJoin(g._id)}
                        style={{ flex: 2, background: "#2563eb", padding: "0.55rem 1rem", fontSize: "0.9rem" }}>
                        Pledge & Join
                      </button>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Users size={13} /> {g.members?.length || 1} buyer{g.members?.length !== 1 ? "s" : ""} joined
                    </span>
                    <button
                      onClick={() => copyPoolCode(g.poolId)}
                      style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                      <Share2 size={12} /> Share Pool
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* ── CREATE ANOTHER POOL CARD (Direct in-grid entry) ── */}
          <motion.div
            whileHover={{ y: -4, borderColor: "#2563eb" }}
            onClick={() => handleOpenCreateModal()}
            style={{
              background: "rgba(37, 99, 235, 0.02)",
              borderRadius: "16px",
              border: "2px dashed #93c5fd",
              padding: "2.5rem 1.5rem",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "300px",
              transition: "all 0.2s ease"
            }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563eb",
              marginBottom: "1rem"
            }}>
              <Plus size={26} />
            </div>
            <h4 style={{ color: "#1e40af", fontSize: "1.2rem", margin: "0 0 0.5rem 0", fontWeight: 700 }}>
              + Start Another Buying Pool
            </h4>
            <p style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: "260px", margin: "0 0 1.25rem 0", lineHeight: 1.4 }}>
              Want to bulk buy another crop with your community? Set a custom target and invite neighbors!
            </p>
            <span style={{
              background: "#2563eb",
              color: "white",
              padding: "0.5rem 1.2rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600
            }}>
              Create New Pool
            </span>
          </motion.div>
        </div>
      )}

      {/* ── CREATE POOL MODAL ── */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Users color="#2563eb" size={22} /> Create Bulk Buying Pool
                </h3>
                <p style={{ margin: "0.3rem 0 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Set up a community bulk order to unlock farm-direct wholesale discounts.
                </p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); onClearPreselected(); }}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#94a3b8", cursor: "pointer" }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePool}>
              {/* Select Crop */}
              <div className="form-group mb-3">
                <label className="field-label" style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.3rem" }}>
                  Select Crop to Buy in Bulk *
                </label>
                <select
                  className="rs-select"
                  value={newPool.cropId}
                  onChange={(e) => {
                    const found = cropsList.find((c) => c._id === e.target.value);
                    setNewPool({
                      ...newPool,
                      cropId: e.target.value,
                      name: found ? `${found.name} Community Bulk Buy` : newPool.name
                    });
                  }}
                  required
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px" }}>
                  <option value="">-- Choose Crop --</option>
                  {cropsList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — ₹{c.price}/{c.unit || "kg"} ({c.category || "fresh"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pool Name & Quick Suggestions */}
              <div className="form-group mb-3">
                <label className="field-label" style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.3rem" }}>
                  Pool Name *
                </label>
                <input
                  type="text"
                  className="rs-input"
                  value={newPool.name}
                  onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                  placeholder="e.g. Skyline Apartments Tomato Bulk Buy"
                  required
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px" }}
                />
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                  {["Apartment Group", "Neighbourhood Pool", "Weekend Savings Club"].map((sugg, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setNewPool({ ...newPool, name: `${selectedCropObj?.name || "Fresh Produce"} ${sugg}` })}
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: "100px",
                        padding: "0.2rem 0.6rem",
                        fontSize: "0.72rem",
                        color: "#475569",
                        cursor: "pointer"
                      }}>
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantities */}
              <div className="grid-2 mb-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="field-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    Target Quantity ({selectedCropObj?.unit || "kg"}) *
                  </label>
                  <input
                    type="number"
                    className="rs-input"
                    value={newPool.targetQuantity}
                    min="10"
                    max="10000"
                    onChange={(e) => setNewPool({ ...newPool, targetQuantity: e.target.value })}
                    required
                    style={{ width: "100%", padding: "0.6rem" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>e.g. 100 kg to unlock 15%</span>
                </div>

                <div className="form-group">
                  <label className="field-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                    Your Initial Pledge ({selectedCropObj?.unit || "kg"}) *
                  </label>
                  <input
                    type="number"
                    className="rs-input"
                    value={newPool.quantity}
                    min="1"
                    onChange={(e) => setNewPool({ ...newPool, quantity: e.target.value })}
                    required
                    style={{ width: "100%", padding: "0.6rem" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>What you will take</span>
                </div>
              </div>

              {/* Region / Delivery Hub */}
              <div className="form-group mb-3">
                <label className="field-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  Delivery Hub / Locality
                </label>
                <input
                  type="text"
                  className="rs-input"
                  value={newPool.region}
                  onChange={(e) => setNewPool({ ...newPool, region: e.target.value })}
                  placeholder="e.g. Gachibowli, Hyderabad"
                  style={{ width: "100%", padding: "0.6rem" }}
                />
              </div>

              {/* Tier Preview Card */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "0.8rem 1rem",
                marginBottom: "1.5rem"
              }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <ShieldCheck size={14} color="#16a34a" /> Automated Community Discount Tiers
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                  <span>Tier 1: <strong>5% OFF</strong> at {Math.round(Number(newPool.targetQuantity) * 0.25)} {selectedCropObj?.unit || "kg"}</span>
                  <span>Tier 2: <strong>10% OFF</strong> at {Math.round(Number(newPool.targetQuantity) * 0.5)} {selectedCropObj?.unit || "kg"}</span>
                  <span>Tier 3: <strong>15% OFF</strong> at {Number(newPool.targetQuantity)} {selectedCropObj?.unit || "kg"}</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setShowCreateModal(false); onClearPreselected(); }}
                  style={{ flex: 1, padding: "0.75rem" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPool}
                  className="btn-primary"
                  style={{ flex: 2, background: "#2563eb", padding: "0.75rem" }}>
                  {submittingPool ? "Creating Pool..." : "Launch Buying Pool"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
