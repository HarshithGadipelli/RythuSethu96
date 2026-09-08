import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { MapPin, ArrowLeft, Calendar, Users, Tractor, CheckCircle2, Star, ShieldCheck, Play, Sparkles, Clock, Compass, PhoneCall } from "lucide-react";
import PaymentModal from "../../components/PaymentModal";

const FALLBACK_FARM_IMAGES = [
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80"
];

export default function CustomerOfflineTours({ isEmbedded = false }) {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [virtualCrops, setVirtualCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tourMode, setTourMode] = useState("in_person"); // "in_person" | "virtual"

  // Booking states
  const [bookingModal, setBookingModal] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("10:00");
  const [bookPeople, setBookPeople] = useState(2);
  const [bookedPass, setBookedPass] = useState(null);

  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  useEffect(() => {
    fetchTours();
    fetchVirtualTours();
  }, []);

  const fetchTours = async () => {
    try {
      const res = await API.get("/tours/available");
      if (Array.isArray(res.data)) {
        setFarmers(res.data);
      }
    } catch (e) {
      console.error("Failed to load farm tours", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVirtualTours = async () => {
    try {
      const res = await API.get("/crops");
      if (Array.isArray(res.data)) {
        const withTours = res.data.filter((c) => (c.farmTourVideo || c.farmTourUrl) && c.isLive !== false);
        setVirtualCrops(withTours);
      }
    } catch (e) {
      console.error("Failed to load virtual farm tours", e);
    }
  };

  const handleBookInitiate = () => {
    if (!bookDate || !bookTime) {
      setMsg({ type: "error", text: "Please choose a date and preferred tour time." });
      return;
    }
    const totalPrice = (bookingModal.farmTourPrice || 150) * bookPeople;
    const uId = user?._id || user?.id;

    if (!uId) {
      setMsg({ type: "error", text: "Please log in to confirm your farm tour reservation." });
      return;
    }

    setPendingBooking({
      farmer: bookingModal.user?._id || bookingModal.user,
      customer: uId,
      date: bookDate,
      time: bookTime,
      numberOfPeople: bookPeople,
      totalPrice: totalPrice,
      farmName: bookingModal.farmName || `${bookingModal.user?.name}'s Farm`
    });
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentMethod) => {
    setShowPayment(false);
    try {
      setMsg({ type: "info", text: "Finalizing your farm booking pass..." });
      const res = await API.post("/tours/book", {
        ...pendingBooking,
        paymentMode: paymentMethod
      });

      const confirmed = res.data;
      setBookedPass({
        ...confirmed,
        farmName: pendingBooking.farmName,
        date: pendingBooking.date,
        time: pendingBooking.time,
        guests: pendingBooking.numberOfPeople,
        total: pendingBooking.totalPrice
      });
      setBookingModal(null);
      setPendingBooking(null);
      setMsg({ type: "success", text: "🌾 Farm Tour booked successfully! Check your tour pass below." });
    } catch (e) {
      setMsg({ type: "error", text: "Failed to book farm tour. Please try again." });
    }
  };

  return (
    <div style={{ padding: isEmbedded ? "0.5rem 0" : "2rem 1rem", minHeight: "75vh" }}>
      {/* ── Top Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #14532d, #16a34a, #15803d)",
        borderRadius: "16px",
        padding: "2.2rem",
        color: "white",
        marginBottom: "2rem",
        boxShadow: "0 10px 25px -5px rgba(22, 163, 74, 0.25)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 2, maxWidth: "650px" }}>
          {!isEmbedded && (
            <Link to="/marketplace" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#bbf7d0", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
              <ArrowLeft size={16} /> Back to Marketplace
            </Link>
          )}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.2)", padding: "0.25rem 0.8rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            <Compass size={14} /> Agro-Tourism & Verified Field Visits
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#ffffff" }}>
            Experience the Soil. Meet Your Farmers.
          </h2>
          <p style={{ margin: 0, color: "#dcfce7", fontSize: "1rem", lineHeight: 1.5 }}>
            Book a guided in-person tour of organic farms across Telangana & Andhra Pradesh.
            Walk through crop fields, harvest your own vegetables, and enjoy authentic farm-to-table hospitality.
          </p>

          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem" }}>
            <button
              onClick={() => setTourMode("in_person")}
              style={{
                background: tourMode === "in_person" ? "#ffffff" : "rgba(255,255,255,0.2)",
                color: tourMode === "in_person" ? "#14532d" : "#ffffff",
                border: "none",
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
              <Tractor size={16} /> In-Person Visits ({farmers.length})
            </button>
            <button
              onClick={() => setTourMode("virtual")}
              style={{
                background: tourMode === "virtual" ? "#ffffff" : "rgba(255,255,255,0.2)",
                color: tourMode === "virtual" ? "#14532d" : "#ffffff",
                border: "none",
                padding: "0.55rem 1.1rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
              <Play size={16} /> Virtual 360° Tours ({virtualCrops.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── Status Alert ── */}
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
              background: msg.type === "error" ? "#fee2e2" : msg.type === "info" ? "#dbeafe" : "#dcfce7",
              color: msg.type === "error" ? "#991b1b" : msg.type === "info" ? "#1e40af" : "#166534",
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

      {/* ── Booked Pass Confirmation Card ── */}
      {bookedPass && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "linear-gradient(135deg, #064e3b, #047857)",
            color: "white",
            borderRadius: "16px",
            padding: "1.75rem",
            marginBottom: "2rem",
            boxShadow: "0 10px 25px rgba(6, 78, 59, 0.3)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1.5rem"
          }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#34d399", color: "#064e3b", padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
              ✓ CONFIRMED BOOKING PASS
            </div>
            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>{bookedPass.farmName}</h3>
            <p style={{ margin: "0.3rem 0 0 0", color: "#a7f3d0", fontSize: "0.95rem" }}>
              📅 {bookedPass.date} at {bookedPass.time} • 👥 {bookedPass.guests} Guest(s) • Total Paid: ₹{bookedPass.total}
            </p>
          </div>
          <button
            onClick={() => setBookedPass(null)}
            style={{
              background: "white",
              color: "#064e3b",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer"
            }}>
            Close Pass
          </button>
        </motion.div>
      )}

      {/* ── Tour Grid ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <div className="loader" style={{ margin: "0 auto" }}></div>
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading verified farm destinations...</p>
        </div>
      ) : tourMode === "in_person" ? (
        farmers.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <Tractor size={48} color="var(--text-muted)" style={{ marginBottom: "1rem", opacity: 0.5 }} />
            <h3 style={{ color: "var(--text-dark)", marginBottom: "0.5rem" }}>No Farm Tours Scheduled Currently</h3>
            <p style={{ color: "var(--text-muted)" }}>Check back soon as verified farmers update their harvest visitation calendars!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {farmers.map((f, idx) => {
              const farmImg = f.farmPhoto || FALLBACK_FARM_IMAGES[idx % FALLBACK_FARM_IMAGES.length];
              const price = f.farmTourPrice || 150;
              const location = f.farmLocation || f.user?.location || "Telangana Farm Belt";

              return (
                <motion.div
                  whileHover={{ y: -5 }}
                  key={f._id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                  <div>
                    {/* Farm Image Header */}
                    <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden" }}>
                      <img
                        src={farmImg}
                        alt={f.farmName || "Farm Tour"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "0.4rem" }}>
                        <span style={{ background: "rgba(22, 163, 74, 0.9)", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                          <ShieldCheck size={13} /> Verified Farm
                        </span>
                        {f.trustScore && (
                          <span style={{ background: "rgba(124, 58, 237, 0.9)", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                            ⭐ {f.trustScore}/100 Trust
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: "1.4rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-dark)", fontWeight: 700 }}>
                          {f.farmName || `${f.user?.name}'s Organic Farm`}
                        </h3>
                        <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.2rem", whiteSpace: "nowrap" }}>
                          ₹{price}<span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>/guest</span>
                        </span>
                      </div>

                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.8rem" }}>
                        <MapPin size={14} color="#16a34a" /> {location}
                      </div>

                      <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.45, margin: "0 0 1rem 0" }}>
                        {f.farmTourDetails || "Guided walkthrough of organic farm beds, livestock care overview, and traditional agricultural demo."}
                      </p>

                      {/* Amenities */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1rem" }}>
                        {["🍃 Fresh Harvest Demo", "🥤 Natural Refreshments", "🚜 Bullock / Tractor Ride"].map((chip, cIdx) => (
                          <span key={cIdx} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 600 }}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Booking Footer */}
                  <div style={{ padding: "0 1.4rem 1.4rem 1.4rem" }}>
                    <button
                      className="btn-primary"
                      style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", fontWeight: 700 }}
                      onClick={() => {
                        setBookingModal(f);
                        setMsg({ type: "", text: "" });
                      }}>
                      📅 Book Farm Tour (₹{price}/guest)
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Virtual Tours ── */
        virtualCrops.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <Play size={48} color="var(--text-muted)" style={{ marginBottom: "1rem", opacity: 0.5 }} />
            <h3 style={{ color: "var(--text-dark)", marginBottom: "0.5rem" }}>No Virtual Tours Uploaded</h3>
            <p style={{ color: "var(--text-muted)" }}>Farmers are currently filming 360° field videos for their active crops.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {virtualCrops.map((c) => (
              <div key={c._id} className="glass-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", width: "100%", height: "210px", backgroundColor: "#000" }}>
                  {c.farmTourUrl ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={c.farmTourUrl}
                      title={c.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={`http://localhost:5000${c.farmTourVideo}`}
                      controls
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      poster={c.image ? (c.image.startsWith("http") ? c.image : `http://localhost:5000${c.image}`) : null}
                    />
                  )}
                  {c.isOrganic && (
                    <div style={{ position: "absolute", top: "10px", right: "10px", background: "var(--green-deep)", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold" }}>
                      <ShieldCheck size={14} /> 100% Organic
                    </div>
                  )}
                </div>

                <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                    <h4 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-dark)" }}>{c.name}</h4>
                    <span style={{ fontWeight: "bold", color: "var(--primary)", fontSize: "1rem" }}>₹{c.price}/{c.unit}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "1rem" }}>
                    <MapPin size={14} /> {c.location || "Organic Field, Telangana"}
                  </div>
                  <Link to={`/marketplace?tab=shop`} className="btn-secondary" style={{ textAlign: "center", marginTop: "auto", fontSize: "0.85rem" }}>
                    View in Marketplace
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Booking Modal ── */}
      {bookingModal && !showPayment && (
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
            style={{ width: "100%", maxWidth: "500px", padding: "2rem", background: "white", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "var(--text-dark)" }}>
                  Book Tour: {bookingModal.farmName || `${bookingModal.user?.name}'s Farm`}
                </h3>
                <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  Fee: <strong>₹{bookingModal.farmTourPrice || 150}</strong> per visitor
                </p>
              </div>
              <button
                onClick={() => setBookingModal(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", color: "#94a3b8", cursor: "pointer" }}>
                ✕
              </button>
            </div>

            <div className="form-group mb-3">
              <label className="field-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                <Calendar size={14} style={{ display: "inline", marginRight: "5px" }} /> Select Visit Date *
              </label>
              <input
                type="date"
                className="rs-input"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
                style={{ width: "100%", padding: "0.65rem" }}
              />
            </div>

            <div className="grid-2 mb-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="field-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  <Clock size={14} style={{ display: "inline", marginRight: "5px" }} /> Preferred Slot
                </label>
                <select
                  className="rs-select"
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem" }}>
                  <option value="09:00">09:00 AM (Morning Dew Walk)</option>
                  <option value="11:00">11:00 AM (Harvest Experience)</option>
                  <option value="14:00">02:00 PM (Bio-Agri Workshop)</option>
                  <option value="16:00">04:00 PM (Sunset Cattle Tour)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="field-label" style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  <Users size={14} style={{ display: "inline", marginRight: "5px" }} /> Total Visitors
                </label>
                <input
                  type="number"
                  className="rs-input"
                  value={bookPeople}
                  min="1"
                  max="25"
                  onChange={(e) => setBookPeople(Math.max(1, Number(e.target.value)))}
                  style={{ width: "100%", padding: "0.65rem" }}
                />
              </div>
            </div>

            {/* Price Calculation */}
            <div style={{
              background: "rgba(22, 163, 74, 0.08)",
              border: "1px solid rgba(22, 163, 74, 0.2)",
              padding: "1rem",
              borderRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#14532d" }}>Total Tour Reservation:</span>
                <div style={{ fontSize: "0.75rem", color: "#166534" }}>₹{bookingModal.farmTourPrice || 150} × {bookPeople} visitor(s)</div>
              </div>
              <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#16a34a" }}>
                ₹{(bookingModal.farmTourPrice || 150) * bookPeople}
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: "0.75rem" }}
                onClick={() => setBookingModal(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ flex: 2, padding: "0.75rem", background: "#16a34a" }}
                onClick={handleBookInitiate}>
                Proceed to Payment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Payment Modal Integration ── */}
      {showPayment && pendingBooking && (
        <PaymentModal
          amount={pendingBooking.totalPrice}
          walletBalance={user?.walletBalance || 0}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
