import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Sparkles, ShoppingBag, Plus, Trash2, CheckCircle2, ChevronRight, Users, Calendar, Filter, HeartHandshake, ShieldCheck, DollarSign, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useVoiceInput } from "../utils/useVoiceInput";
import { useLang } from "../context/LangContext";
import API, { BASE_URL } from "../api/api";
import { getImgSrc } from "../pages/Marketplace/Marketplace";

const PRESET_LISTS = [
  { label: "🍛 Weekly Kitchen Essentials", text: "5kg rice, 2kg onions, 2kg tomatoes, 1kg potatoes, 500g ginger, 250g green chillies" },
  { label: "🌿 100% Organic Greens & Veggies", text: "2 bunches spinach, 1kg brinjal, 500g ladyfinger, 1kg carrots, 1 bunch coriander" },
  { label: "🍲 South Indian Sambar & Curry", text: "1kg toor dal, 2kg tomatoes, 1kg onions, 1kg brinjal, 500g ladyfinger, 200g turmeric" },
  { label: "🍎 Fresh Fruits & Nutrition", text: "2kg bananas, 1kg apples, 2kg mangoes" }
];

export default function SmartCuratedBasket({ onAddToCartSuccess }) {
  const { addToCart, setIsCartOpen, clearCart } = useCart();
  const { lang, t } = useLang();

  const [activeMode, setActiveMode] = useState("list"); // "list" | "event"
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [organicOnly, setOrganicOnly] = useState(false);
  const [pesticideFreeOnly, setPesticideFreeOnly] = useState(false);
  const [farmerPreference, setFarmerPreference] = useState("best_price"); // "best_price" | "top_rated" | "random"
  const [maxBudget, setMaxBudget] = useState("");

  // Event Catering States
  const [eventType, setEventType] = useState("wedding");
  const [guestCount, setGuestCount] = useState(100);
  const [mealType, setMealType] = useState("south_indian_thali");

  // Voice Input Hook
  const { listening, interim, startListening, stopListening } = useVoiceInput(lang || "en");

  const handleVoiceToggle = () => {
    if (listening) {
      if (typeof stopListening === "function") stopListening();
    } else {
      startListening((val) => {
        if (typeof val === "function") setRawText(prev => val(prev));
        else setRawText(prev => (prev ? `${prev}, ${val}` : val));
      }, { replace: false, fieldId: "smart_basket" });
    }
  };

  // Run Smart Shopping List Parser
  const handleParseList = async () => {
    if (!rawText.trim()) {
      setErrorMsg("Please type or speak your list of items.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const res = await API.post("/ai/parse-shopping-list", {
        rawInput: rawText,
        filters: {
          organicOnly,
          pesticideFreeOnly,
          farmerPreference,
          maxPrice: maxBudget ? Number(maxBudget) : null
        }
      });
      setResult({ mode: "list", data: res.data });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Could not parse shopping list. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  // Run Event Catering AI Estimator
  const handleEstimateEvent = async () => {
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const res = await API.post("/ai/event-catering-estimator", {
        eventType,
        guestCount: Number(guestCount) || 100,
        mealType,
        filters: {
          organicOnly,
          pesticideFreeOnly,
          maxBudget: maxBudget ? Number(maxBudget) : null
        }
      });
      setResult({ mode: "event", data: res.data });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Could not estimate event catering items.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-Fill Cart with all matched items
  const handleAutoFillCart = (replaceCart = false) => {
    if (!result) return;
    if (replaceCart) clearCart();

    const items = result.mode === "list" ? result.data.matchedItems : result.data.ingredients;
    if (!items || items.length === 0) return;

    items.forEach((item, i) => {
      const crop = item.crop || {
        _id: item.cropId,
        name: item.cropName,
        price: item.pricePerUnit,
        unit: item.unit || "kg",
        image: item.image,
        isOrganic: item.isOrganic
      };
      const qty = item.allocatedQuantity || item.quantity || 1;
      // Do not auto-open on every single item, open once at the end
      addToCart(crop, qty, false, i === items.length - 1);
    });

    if (typeof onAddToCartSuccess === "function") {
      onAddToCartSuccess();
    }
  };

  return (
    <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
      {/* Top Selector Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <Sparkles size={14} /> AI Smart Cart
            </span>
            <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--text-dark)" }}>
              Voice / Text List & Event Catering Auto-Fill
            </h3>
          </div>
          <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Give any list or specify event guests. AI automatically matches farm-direct stock and fills your cart in 1 click!
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "12px", gap: "4px" }}>
          <button
            type="button"
            onClick={() => { setActiveMode("list"); setResult(null); setErrorMsg(""); }}
            style={{
              padding: "0.5rem 1rem", borderRadius: "10px", border: "none", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
              background: activeMode === "list" ? "white" : "transparent",
              color: activeMode === "list" ? "var(--green-deep)" : "#64748b",
              boxShadow: activeMode === "list" ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
            }}
          >
            🎙️ Voice & Text List
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode("event"); setResult(null); setErrorMsg(""); }}
            style={{
              padding: "0.5rem 1rem", borderRadius: "10px", border: "none", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
              background: activeMode === "event" ? "white" : "transparent",
              color: activeMode === "event" ? "var(--green-deep)" : "#64748b",
              boxShadow: activeMode === "event" ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
            }}
          >
            💒 Event Catering AI
          </button>
        </div>
      </div>

      {/* ── FILTER PREFERENCES BAR ── */}
      <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-dark)", fontSize: "0.85rem", fontWeight: 700 }}>
          <Filter size={16} color="var(--green-deep)" /> Filter Preferences:
        </div>

        {/* Organic Pill */}
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", cursor: "pointer", background: organicOnly ? "#ecfdf5" : "white", border: organicOnly ? "1.5px solid #22c55e" : "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "20px", color: organicOnly ? "#166534" : "#475569", fontWeight: 600 }}>
          <input type="checkbox" checked={organicOnly} onChange={e => setOrganicOnly(e.target.checked)} style={{ display: "none" }} />
          🌿 100% Organic Only
        </label>

        {/* Pesticide Free Pill */}
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", cursor: "pointer", background: pesticideFreeOnly ? "#ecfdf5" : "white", border: pesticideFreeOnly ? "1.5px solid #059669" : "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "20px", color: pesticideFreeOnly ? "#065f46" : "#475569", fontWeight: 600 }}>
          <input type="checkbox" checked={pesticideFreeOnly} onChange={e => setPesticideFreeOnly(e.target.checked)} style={{ display: "none" }} />
          🛡️ Pesticide-Free
        </label>

        {/* Farmer Strategy */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem" }}>
          <span style={{ color: "#64748b", fontWeight: 600 }}>Farmer Choice:</span>
          <select 
            value={farmerPreference} 
            onChange={e => setFarmerPreference(e.target.value)}
            style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.8rem", background: "white" }}
          >
            <option value="best_price">💰 Best Price (Lowest)</option>
            <option value="top_rated">⭐ Top Rated Farmers (High Trust)</option>
            <option value="random">🎲 Random Local Farmer (Empower All)</option>
          </select>
        </div>
      </div>

      {/* ── MODE A: VOICE & TEXT LIST INPUT ── */}
      {activeMode === "list" && (
        <div>
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <textarea
              rows={3}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="🎙️ Click the mic or type items: e.g. 5kg sona masoori rice, 2kg onions, 1kg tomatoes, 500g ginger, 2 bunches palak..."
              style={{
                width: "100%", padding: "1rem 4rem 1rem 1rem", borderRadius: "14px",
                border: "1.5px solid #cbd5e1", fontSize: "0.95rem", lineHeight: 1.5,
                boxSizing: "border-box", fontFamily: "inherit"
              }}
            />
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={handleVoiceToggle}
              style={{
                position: "absolute", right: "12px", top: "12px", width: "42px", height: "42px",
                borderRadius: "50%", border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                background: listening ? "#ef4444" : "var(--green-main)", color: "white",
                boxShadow: listening ? "0 0 15px rgba(239,68,68,0.6)" : "0 4px 10px rgba(22,163,74,0.3)"
              }}
              title={listening ? "Stop Recording" : "Speak your shopping list in any language"}
            >
              {listening ? <MicOff size={20} className="spin-anim" /> : <Mic size={20} />}
            </button>
          </div>

          {listening && (
            <div style={{ color: "#ef4444", fontSize: "0.82rem", marginBottom: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
              Listening... Speak crop names and quantities in English, Telugu, or Hindi. {interim}
            </div>
          )}

          {/* Quick Preset Example Chips */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.2rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Quick Packs:</span>
            {PRESET_LISTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRawText(p.text)}
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "15px", fontSize: "0.75rem", color: "#334155", fontWeight: 600, cursor: "pointer" }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleParseList}
            disabled={loading || !rawText.trim()}
            className="btn-primary"
            style={{
              padding: "0.85rem 1.8rem", fontSize: "0.95rem", borderRadius: "12px",
              display: "flex", alignItems: "center", gap: "0.5rem", width: "auto"
            }}
          >
            {loading ? <><span className="loader" style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }}></span> Matching Farm Stock...</> : <><Sparkles size={18} /> Find & Match Crops from Farm Stock</>}
          </button>
        </div>
      )}

      {/* ── MODE B: EVENT CATERING CALCULATOR ── */}
      {activeMode === "event" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {/* Event Type */}
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                Select Event Type:
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                <option value="wedding">💒 Marriage / Wedding Reception</option>
                <option value="birthday">🎂 Birthday & Anniversary Party</option>
                <option value="festival">🛕 Temple Pooja / Annadanam / Festival</option>
                <option value="housewarming">🏠 Housewarming (Gruhapravesam)</option>
                <option value="corporate">🏢 Corporate & Community Gathering</option>
              </select>
            </div>

            {/* Guest Count */}
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                Estimated Guest Count:
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  step="10"
                  value={guestCount}
                  onChange={e => setGuestCount(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.95rem", fontWeight: 700 }}
                />
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>People</span>
              </div>
            </div>

            {/* Meal Style */}
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark)", display: "block", marginBottom: "0.4rem" }}>
                Meal Style / Menu:
              </label>
              <select
                value={mealType}
                onChange={e => setMealType(e.target.value)}
                style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "white" }}
              >
                <option value="south_indian_thali">🌿 South Indian Traditional Feast (Thali)</option>
                <option value="north_indian_feast">🍛 North Indian Grand Meal</option>
                <option value="biryani_meal">🍲 Biryani & Curry Special</option>
                <option value="satvik_pooja">🛕 Satvik Pooja Meal (Zero Onion/Garlic)</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleEstimateEvent}
            disabled={loading}
            className="btn-primary"
            style={{
              padding: "0.85rem 1.8rem", fontSize: "0.95rem", borderRadius: "12px",
              display: "flex", alignItems: "center", gap: "0.5rem", width: "auto"
            }}
          >
            {loading ? <><span className="loader" style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }}></span> Calculating Bulk Catering Needs...</> : <><Users size={18} /> Calculate Bulk Farm-Direct Catering Plan</>}
          </button>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: "0.8rem", background: "#fef2f2", color: "#991b1b", borderRadius: "10px", marginTop: "1.2rem", fontSize: "0.85rem" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ── MATCHED RESULTS & AUTO-FILL PAYLOAD ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ marginTop: "1.5rem", borderTop: "1.5px dashed #cbd5e1", paddingTop: "1.5rem" }}
          >
            {/* Header Summary Box */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "1.2rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ background: "var(--green-main)", color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
                  ✅ AI Matching Complete
                </span>
                <h4 style={{ color: "#166534", fontSize: "1.15rem", margin: "0.3rem 0 0", fontWeight: 800 }}>
                  {result.mode === "list" ? `${result.data.matchedCount} Items Ready from Farm Stock` : `${result.data.eventTitle} (${result.data.guests} Guests)`}
                </h4>
                <p style={{ margin: "0.2rem 0 0", color: "#15803d", fontSize: "0.85rem" }}>
                  {result.data.summary || result.data.message}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Total Farm-Direct Cost</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--green-deep)" }}>
                  ₹{(result.data.estimatedTotal || 0).toLocaleString()}
                </div>
                {result.mode === "event" && result.data.costPerGuest && (
                  <div style={{ fontSize: "0.75rem", color: "#15803d", fontWeight: 600 }}>
                    Only ₹{result.data.costPerGuest}/person • Saved ₹{result.data.totalSavings?.toLocaleString()} vs Retail
                  </div>
                )}
              </div>
            </div>

            {/* Matched Items Table / List */}
            <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", color: "#475569", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem 0.8rem", borderRadius: "8px 0 0 8px" }}>Crop Item</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Farmer & Origin</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Quantity</th>
                    <th style={{ padding: "0.6rem 0.8rem" }}>Rate</th>
                    <th style={{ padding: "0.6rem 0.8rem", borderRadius: "0 8px 8px 0", textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.mode === "list" ? result.data.matchedItems : result.data.ingredients).map((item, idx) => {
                    const imgSrc = getImgSrc(item.image, item.cropName, item.category);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 0.8rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            {imgSrc ? (
                              <img src={imgSrc} alt={item.cropName} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--green-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🌾</div>
                            )}
                            <div>
                              <strong style={{ color: "var(--text-dark)", display: "block" }}>{item.cropName}</strong>
                              <span style={{ fontSize: "0.72rem", color: item.isOrganic ? "#166534" : "#64748b" }}>
                                {item.isOrganic ? "🌿 Organic" : item.isPesticideFree ? "🛡️ Pesticide Free" : "Standard"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0.8rem", color: "#475569" }}>
                          👨‍🌾 {item.farmerName}
                        </td>
                        <td style={{ padding: "0.75rem 0.8rem" }}>
                          <span style={{ fontWeight: 700, color: "var(--green-deep)" }}>
                            {item.allocatedQuantity || item.quantity} {item.unit || "kg"}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.8rem", color: "#64748b" }}>
                          ₹{item.pricePerUnit}/{item.unit || "kg"}
                        </td>
                        <td style={{ padding: "0.75rem 0.8rem", textAlign: "right", fontWeight: 700, color: "var(--text-dark)" }}>
                          ₹{item.subtotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Unmatched Items Warning */}
            {result.data.unmatchedItems && result.data.unmatchedItems.length > 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fef08a", padding: "0.8rem 1rem", borderRadius: "10px", marginBottom: "1.5rem", fontSize: "0.82rem", color: "#854d0e" }}>
                <strong>⚠️ Note:</strong> Some items were temporarily out of stock: {result.data.unmatchedItems.join(", ")}. Available items have been matched.
              </div>
            )}

            {/* ── 1-CLICK AUTOFILL CART BUTTON ── */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => handleAutoFillCart(false)}
                className="btn-primary"
                style={{
                  padding: "1rem 2rem", fontSize: "1.05rem", borderRadius: "14px",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  boxShadow: "0 10px 25px rgba(22,163,74,0.3)"
                }}
              >
                <ShoppingBag size={20} /> Auto-Fill Cart & Checkout (₹{(result.data.estimatedTotal || 0).toLocaleString()})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
