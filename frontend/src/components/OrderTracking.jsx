import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, MessageSquare, ShieldCheck, User, X, Send, Leaf, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import L from "leaflet";
import ReviewModal from "./ReviewModal";
import OrderInvoiceModal from "./OrderInvoiceModal";
import API, { BASE_URL } from "../api/api";
import io from "socket.io-client";

// Fix icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const vehicleIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3204/3204121.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const homeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

const farmerIcon = new L.divIcon({
  className: "custom-farmer-icon",
  html: `<div style="display:flex;justify-content:center;align-items:center;width:32px;height:32px;background:linear-gradient(135deg, #16a34a, #15803d);border-radius:50%;border:2px solid white;box-shadow:0 4px 6px rgba(0,0,0,0.3);font-size:16px;">🌾</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export default function OrderTracking({ orderId, onClose }) {
  const actualOrderId = typeof orderId === "object" ? (orderId?._id || orderId?.id) : orderId;
  const [order, setOrder] = useState(typeof orderId === "object" && orderId?.billNumber ? orderId : null);
  const [loading, setLoading] = useState(!order);
  const [showReview, setShowReview] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [farmPickupOtpInput, setFarmPickupOtpInput] = useState("");
  const [verifyingFarmOtp, setVerifyingFarmOtp] = useState(false);
  const [farmOtpError, setFarmOtpError] = useState("");
  const chatBottomRef = useRef(null);

  const handleVerifyFarmPickupOtp = async () => {
    if (!farmPickupOtpInput || farmPickupOtpInput.trim().length !== 6) {
      setFarmOtpError("Please enter the 6-digit OTP told by the farmer.");
      return;
    }
    setVerifyingFarmOtp(true);
    setFarmOtpError("");
    try {
      const res = await API.post(`/orders/${actualOrderId}/farm-pickup-complete`, { otp: farmPickupOtpInput.trim() });
      if (res.data?.success) {
        setToastMsg("🎉 Farm handover verified successfully! Fresh produce received & points credited.");
        setOrder(res.data.order);
        setFarmPickupOtpInput("");
      }
    } catch (err) {
      setFarmOtpError(err.response?.data?.error || "Invalid OTP. Please verify the code told by the farmer.");
    } finally {
      setVerifyingFarmOtp(false);
    }
  };

  useEffect(() => {
    if (order?.chatMessages) {
      setChatMessages(order.chatMessages);
    }
  }, [order]);

  useEffect(() => {
    if (showChatModal && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatModal]);

  const fetchOrder = async () => {
    if (!actualOrderId) {
      setLoading(false);
      return;
    }
    try {
      // Primary: full order endpoint
      const res = await API.get(`/orders/${actualOrderId}`);
      if (res.data) setOrder(res.data);
    } catch (e) {
      try {
        // Fallback: bill endpoint
        const billRes = await API.get(`/orders/${actualOrderId}/bill`);
        if (billRes.data) setOrder(billRes.data);
      } catch (err) {
        console.error("Failed to load order tracking data:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    
    // Live Tracking via Socket.io
    const socket = io(BASE_URL);
    
    socket.on("order_updated", (updated) => {
      if (updated._id === actualOrderId || updated.id === actualOrderId) {
        fetchOrder();
      }
    });

    socket.on("agent_location_updated", (data) => {
      if (data.orderId === actualOrderId) {
        setOrder(prev => {
          if (!prev) return prev;
          return { ...prev, agentLatitude: data.lat, agentLongitude: data.lng };
        });
      }
    });

    socket.on("agent_chat_message", (data) => {
      if (data.orderId === actualOrderId) {
        setChatMessages(prev => [...prev, data.message]);
        if (data.hasWetWasteDonation) {
          setOrder(prev => prev ? { ...prev, hasWetWasteDonation: true, wetWasteEstKg: data.wetWasteEstKg } : prev);
        }
      }
    });

    return () => socket.disconnect();
  }, [actualOrderId]);

  const handleSendChat = async (textToSend, isWasteAlert = false, wetWasteEstKg = 2) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;
    setSendingChat(true);
    try {
      const res = await API.post(`/orders/${actualOrderId}/agent-chat`, {
        sender: "customer",
        senderName: order?.customer?.name || "Customer",
        text,
        isWasteAlert,
        wetWasteEstKg
      });
      if (res.data?.chatMessages) {
        setChatMessages(res.data.chatMessages);
      }
      setChatInput("");
      if (isWasteAlert) {
        setOrder(prev => prev ? ({ ...prev, hasWetWasteDonation: true, wetWasteEstKg }) : prev);
        setToastMsg("🌱 Pre-delivery wet waste alert sent to rider!");
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setSendingChat(false);
    }
  };

  const handle1TapShortcut = (presetText, estKg = 2) => {
    handleSendChat(presetText, true, estKg);
  };

  const handleAddWasteShortcut = async (estKg = 2) => {
    try {
      const res = await API.put(`/orders/${actualOrderId}/add-waste-pickup`, { estKg });
      if (res.data?.order) {
        setOrder(res.data.order);
      }
      setToastMsg(`🌱 Added ${estKg}kg wet waste pickup! Agent alerted.`);
      setTimeout(() => setToastMsg(""), 4000);
      fetchOrder();
    } catch (err) {
      console.error("Failed to add waste pickup:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100000, background: "rgba(255,255,255,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div className="loader" style={{ width: 44, height: 44, border: "4px solid #16a34a", borderTopColor: "transparent" }}></div>
        <p style={{ color: "#166534", fontWeight: 700, fontSize: "1rem" }}>Connecting to Live Delivery Satellites...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200010, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div className="glass-card text-center" style={{ maxWidth: 440, width: "100%", padding: "2rem", background: "white" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📦</div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.3rem" }}>Live Tracking Initializing</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Your order has been recorded! Our delivery agent is synchronizing with platform route sensors. Please check back in a few moments.
          </p>
          <button 
            className="btn-primary" 
            onClick={onClose} 
            style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", fontWeight: 700 }}
          >
            Close Tracking
          </button>
        </div>
      </div>
    );
  }

  const statuses = ["pending", "confirmed", "assigned", "picked_up", "in_transit", "delivered"];
  const currentStatusIndex = statuses.indexOf(order.status) >= 0 ? statuses.indexOf(order.status) : 0;
  
  // Show review immediately if delivered
  if (order.status === "delivered" && !showReview && !order.reviewText) {
    setTimeout(() => setShowReview(true), 1500);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200010, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#1e293b", fontWeight: 800 }}>Order Tracking</h2>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>Bill #{order.billNumber} • ETA: {order.estimatedDeliveryMinutes || 35} mins</div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowInvoice(true)}
            style={{ padding: "0.6rem 1.2rem", borderRadius: "100px", border: "1px solid #16a34a", background: "#f0fdf4", color: "#16a34a", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
          >
            📄 View Tax Bill & Invoice
          </button>
          <button onClick={onClose} style={{ padding: "0.6rem 1.2rem", borderRadius: "100px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 600 }}>
            Close Tracking
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexWrap: "wrap" }}>
        
        {/* Left Column - Live Map & Agent Info */}
        <div style={{ flex: "1 1 500px", minHeight: "50vh", position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, position: "relative", background: "#e2e8f0" }}>
            {/* Real Map with Location Transparency */}
            {(() => {
              const pickupLat = order.pickupLatitude || order.farmer?.latitude || 17.385;
              const pickupLng = order.pickupLongitude || order.farmer?.longitude || 78.486;
              const deliveryLat = order.deliveryLatitude || order.customer?.latitude || (pickupLat + 0.04);
              const deliveryLng = order.deliveryLongitude || order.customer?.longitude || (pickupLng + 0.04);
              const isFarmPickup = order.deliveryType === "farm_pickup";
              const agentLat = isFarmPickup ? pickupLat : (order.agentCurrentLatitude || order.agentLatitude || (pickupLat + (deliveryLat - pickupLat) / 2));
              const agentLng = isFarmPickup ? pickupLng : (order.agentCurrentLongitude || order.agentLongitude || (pickupLng + (deliveryLng - pickupLng) / 2));
              
              return (
                <MapContainer 
                  center={isFarmPickup ? [pickupLat, pickupLng] : [agentLat, agentLng]} 
                  zoom={isFarmPickup ? 13 : 12} 
                  style={{ height: "100%", width: "100%", minHeight: "380px" }}
                  zoomControl={true}
                >
                  <TileLayer 
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <Marker position={[pickupLat, pickupLng]} icon={farmerIcon}>
                    <Popup>
                      <div style={{ padding: "4px" }}>
                        <strong style={{ color: "#166534" }}>🏡 {order.farmer?.farmName || "Direct Farm"}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                          GPS: {pickupLat.toFixed(5)}° N, {pickupLng.toFixed(5)}° E
                        </div>
                        <div style={{ fontSize: "0.75rem", marginTop: "2px" }}>{order.pickupAddress || order.farmer?.location}</div>
                      </div>
                    </Popup>
                  </Marker>

                  <Marker position={[deliveryLat, deliveryLng]} icon={homeIcon}>
                    <Popup>
                      <div style={{ padding: "4px" }}>
                        <strong style={{ color: "#2563eb" }}>📍 Customer Destination</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                          GPS: {deliveryLat.toFixed(5)}° N, {deliveryLng.toFixed(5)}° E
                        </div>
                        <div style={{ fontSize: "0.75rem", marginTop: "2px" }}>{order.deliveryAddress}</div>
                      </div>
                    </Popup>
                  </Marker>

                  {!isFarmPickup && (
                    <Marker position={[agentLat, agentLng]} icon={vehicleIcon}>
                      <Popup>
                        <div style={{ padding: "4px" }}>
                          <strong>🚴 {order.agent?.name || "Delivery Rider"}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Live GPS Tracking Active</div>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {isFarmPickup ? (
                    <Polyline positions={[[pickupLat, pickupLng], [deliveryLat, deliveryLng]]} color="#16a34a" weight={4} dashArray="6, 8" />
                  ) : (
                    <>
                      <Polyline positions={[[pickupLat, pickupLng], [agentLat, agentLng]]} color="#16a34a" weight={4} dashArray="5, 10" />
                      <Polyline positions={[[agentLat, agentLng], [deliveryLat, deliveryLng]]} color="#3b82f6" weight={4} dashArray="10, 10" />
                    </>
                  )}
                </MapContainer>
              );
            })()}

            {/* OTP Overlay for Doorstep Delivery ONLY */}
            {order.deliveryType !== "farm_pickup" && order.status !== "delivered" && order.verificationCode && (
              <div style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 1000, background: "rgba(255,255,255,0.96)", padding: "1.2rem", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", backdropFilter: "blur(4px)", border: "2px dashed #16a34a", textAlign: "center" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.3rem" }}>Doorstep Delivery Verification Code (OTP)</div>
                <div style={{ fontSize: "2.3rem", fontWeight: 900, color: "#16a34a", letterSpacing: "8px" }}>{order.verificationCode}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.3rem" }}>Share this with the delivery rider only upon inspecting and receiving your produce.</div>
              </div>
            )}
          </div>

          {/* Transparent Location & Handover Card */}
          {order.deliveryType === "farm_pickup" ? (
            /* Farm Gate Handover & Transparent GPS Card */
            <div style={{ background: "white", padding: "1.2rem 1.5rem", borderTop: "1px solid #e2e8f0", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <span style={{ 
                  background: "#dcfce7", color: "#166534", border: "1px solid #86efac", 
                  padding: "3px 10px", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 800,
                  display: "inline-flex", alignItems: "center", gap: "5px"
                }}>
                  🏡 Direct Farm Gate Pickup
                </span>
                <span style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 700 }}>
                  Zero Middlemen • Transparent GPS
                </span>
              </div>

              {/* Exact Farm Geolocation Transparency */}
              <div style={{ background: "#f8fafc", padding: "0.8rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "0.8rem", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <strong style={{ color: "#1e293b", fontSize: "0.88rem" }}>👨‍🌾 {order.farmer?.name || "Direct Farmer"}</strong>
                    <div style={{ color: "#64748b", marginTop: "2px" }}>
                      📍 {order.pickupAddress || order.farmer?.farmLocation || order.farmer?.location || "Farm Gate"}
                    </div>
                    <div style={{ color: "#0369a1", fontSize: "0.72rem", fontWeight: 700, marginTop: "3px" }}>
                      GPS: {(order.pickupLatitude || order.farmer?.latitude || 17.385).toFixed(5)}° N, {(order.pickupLongitude || order.farmer?.longitude || 78.486).toFixed(5)}° E
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.pickupLatitude || order.farmer?.latitude || 17.385},${order.pickupLongitude || order.farmer?.longitude || 78.486}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "5px 10px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
                        borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px"
                      }}
                    >
                      🗺️ Directions
                    </a>
                    {order.farmer?.phone && (
                      <a
                        href={`tel:${order.farmer.phone}`}
                        style={{
                          padding: "5px 10px", background: "#f0fdf4", color: "#166534", border: "1px solid #86efac",
                          borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px"
                        }}
                      >
                        📞 Call Farmer
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Farm OTP Handover Submission */}
              {order.status !== "delivered" ? (
                <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "12px", padding: "0.85rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#166534", marginBottom: "4px" }}>
                    🔐 Complete Payment at Farm Gate &amp; Enter Farmer's OTP:
                  </div>
                  <p style={{ margin: "0 0 0.6rem 0", fontSize: "0.75rem", color: "#475569", lineHeight: 1.4 }}>
                    {order.paymentStatus === "paid" 
                      ? "✓ Farmer has confirmed your payment! Ask the farmer for the 6-digit confirmation OTP and enter it below to complete handover:"
                      : `Pay ₹${(order.totalAmount || 0).toLocaleString()} to the farmer via Cash or UPI at the farm gate. The farmer will confirm payment and tell you the 6-digit handover OTP:`}
                  </p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input 
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP told by farmer..."
                      value={farmPickupOtpInput}
                      onChange={(e) => setFarmPickupOtpInput(e.target.value.replace(/\D/g, ""))}
                      style={{
                        flex: 1, padding: "0.55rem 0.8rem", borderRadius: "8px", border: "1.5px solid #86efac",
                        fontSize: "0.95rem", fontWeight: 800, letterSpacing: "3px", textAlign: "center"
                      }}
                    />
                    <button
                      onClick={handleVerifyFarmPickupOtp}
                      disabled={verifyingFarmOtp || farmPickupOtpInput.length !== 6}
                      className="btn-primary"
                      style={{ padding: "0.55rem 1.1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      {verifyingFarmOtp ? "Verifying..." : "Confirm Handover ✓"}
                    </button>
                  </div>

                  {farmOtpError && (
                    <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "4px", fontWeight: 600 }}>
                      ⚠️ {farmOtpError}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "10px", padding: "0.75rem", textAlign: "center", color: "#166534", fontWeight: 800, fontSize: "0.88rem" }}>
                  🎉 Farm Pickup Confirmed! Produce Handed Over &amp; Points Credited
                </div>
              )}
            </div>
          ) : (
            /* Agent Info Box (Doorstep Delivery) */
            order.status !== "delivered" && (
              <div style={{ background: "white", padding: "1.2rem 1.5rem", borderTop: "1px solid #e2e8f0", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                  <span style={{ 
                    background: "rgba(34, 197, 94, 0.12)", 
                    color: "#166534", 
                    border: "1px solid rgba(34, 197, 94, 0.3)", 
                    padding: "3px 10px", 
                    borderRadius: "100px", 
                    fontSize: "0.78rem", 
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px"
                  }}>
                    🚲 Hyperlocal Dabbawala Doorstep Delivery
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                    Cold Storage Hub ➔ Doorstep
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ecfdf5", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                    🚲
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1e293b" }}>
                      {order.agent?.name || "Ramesh Kumar (Dabbawala Rider #402)"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <ShieldCheck size={14} color="#16a34a" /> 2km Radial Cluster Specialist • ⭐ 4.9
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      onClick={() => setShowChatModal(true)}
                      style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#dcfce7", color: "#16a34a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title="Chat or Send Wet-Waste Alert to Rider"
                    >
                      <MessageSquare size={18} />
                    </button>
                    <button 
                      style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "#3b82f6", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} 
                      onClick={() => window.location.href = `tel:${order.agent?.phone || '9876543210'}`}
                      title="Call Dabbawala Rider"
                    >
                      <Phone size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Column - Status Timeline & Details */}
        <div style={{ flex: "1 1 400px", background: "white", padding: "2rem", borderLeft: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#1e293b" }}>Order Timeline</h3>
            <span style={{ fontSize: "0.78rem", background: "#eff6ff", color: "#1e40af", padding: "3px 9px", borderRadius: "12px", fontWeight: 700 }}>
              Live Satellite GPS
            </span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              { id: "pending", label: "Order Placed", icon: Package, desc: "Order safely received & verified" },
              { id: "confirmed", label: "Farm Gate Aggregated", icon: CheckCircle, desc: "Fresh produce received from farmer" },
              { id: "assigned", label: "Arrived at Cold Storage Hub", icon: ShieldCheck, desc: "Chilled & staged at nearest city hub" },
              { id: "picked_up", label: "Dabbawala Assigned", icon: User, desc: "Assigned to last-mile 2-wheeler courier" },
              { id: "in_transit", label: "Out for Doorstep Delivery", icon: Truck, desc: "Dabbawala rider is en route to your address" },
              { id: "delivered", label: "Delivered Fresh", icon: MapPin, desc: "Delivered directly to your hands" },
            ].map((step, idx) => {
              const isActive = currentStatusIndex >= idx;
              const isCurrent = currentStatusIndex === idx;
              
              return (
                <div key={step.id} style={{ display: "flex", gap: "1rem", position: "relative" }}>
                  {idx < 5 && (
                    <div style={{ position: "absolute", left: 19, top: 40, bottom: -15, width: 2, background: isActive ? "#16a34a" : "#e2e8f0" }}></div>
                  )}
                  <div style={{ 
                    width: 40, height: 40, borderRadius: "50%", 
                    background: isActive ? (isCurrent ? "#16a34a" : "#dcfce7") : "#f1f5f9", 
                    color: isActive ? (isCurrent ? "white" : "#16a34a") : "#94a3b8",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
                    boxShadow: isCurrent ? "0 0 0 4px rgba(22, 163, 74, 0.2)" : "none"
                  }}>
                    <step.icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: isActive ? "#1e293b" : "#94a3b8", fontSize: "1.05rem" }}>{step.label}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "3rem", padding: "1.5rem", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Delivery Details</h4>
            <div style={{ fontSize: "0.9rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div><strong>Items:</strong> {order.items?.[0]?.name || order.productSnapshot?.name || order.crop?.name || "Crop"} x{order.items?.[0]?.quantity || order.quantity}</div>
              <div><strong>Amount:</strong> ₹{order.totalAmount?.toLocaleString()}</div>
              <div><strong>Payment:</strong> <span style={{ textTransform: "uppercase" }}>{order.paymentMode}</span> ({order.paymentStatus})</div>
              <div><strong>Address:</strong> {order.customer?.address || order.deliveryAddress}</div>
            </div>

            {/* ── Circular Economy Wet-Waste Collection Status Card ── */}
            <div style={{
              marginTop: "1.25rem",
              padding: "1rem",
              borderRadius: "14px",
              background: order.hasWetWasteDonation ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#f8fafc",
              border: order.hasWetWasteDonation ? "1.5px solid #86efac" : "1.5px dashed #cbd5e1"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Leaf size={18} color="#16a34a" />
                  <strong style={{ fontSize: "0.92rem", color: "#166534" }}>
                    {order.hasWetWasteDonation ? "🌱 Wet Waste Pickup Confirmed" : "🌱 Zero-Waste Circular Delivery"}
                  </strong>
                </div>
                <span style={{ fontSize: "0.72rem", background: order.hasWetWasteDonation ? "#16a34a" : "#64748b", color: "white", padding: "2px 8px", borderRadius: "100px", fontWeight: 700 }}>
                  {order.hasWetWasteDonation ? `~${order.wetWasteEstKg || 2} kg` : "+15 Points"}
                </span>
              </div>

              {order.hasWetWasteDonation ? (
                <div>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "#334155", lineHeight: 1.4 }}>
                    Your delivery rider is notified to carry an airtight wet-waste collection kit & scale to collect your raw peels simultaneously during delivery, returning them to the <strong>Cold Storage Hub</strong> for vermicompost & biogas.
                  </p>
                  <div style={{ background: "#fffbeb", border: "1px solid #fef08a", borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "#854d0e" }}>
                    <strong>⚠️ Reminder:</strong> Only raw vegetable peels and fruit scraps accepted. Rider conducts AI inspection at doorstep.
                  </div>
                  <button
                    onClick={() => setShowChatModal(true)}
                    style={{ marginTop: "0.6rem", width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #16a34a", background: "white", color: "#16a34a", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <MessageSquare size={14} /> Send Note / Chat with Rider
                  </button>
                </div>
              ) : order.status !== "delivered" ? (
                <div>
                  <p style={{ margin: "0 0 0.6rem 0", fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                    Have vegetable or fruit peels? The rider will carry a collection kit and take them back to the cold storage hub for farmer compost & biogas generation.
                  </p>
                  <button
                    onClick={() => handleAddWasteShortcut(2)}
                    style={{
                      width: "100%", padding: "0.65rem", borderRadius: "8px", border: "none",
                      background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white",
                      fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)"
                    }}
                  >
                    <Sparkles size={14} /> Inform Rider: I will give Wet Waste (~2kg)
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReview && (
          <ReviewModal 
            orderId={orderId} 
            onClose={() => setShowReview(false)} 
            onSubmitted={() => { fetchOrder(); setShowReview(false); }} 
          />
        )}
      </AnimatePresence>

      {showInvoice && (
        <OrderInvoiceModal 
          order={order} 
          onClose={() => setShowInvoice(false)} 
        />
      )}

      {/* ─── INTERACTIVE RIDER CHAT & 1-TAP WASTE NOTIFICATION MODAL ─── */}
      {showChatModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100002, padding: "1rem"
        }}>
          <div style={{
            background: "white", borderRadius: "20px", maxWidth: "520px", width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "88vh"
          }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.25rem", background: "linear-gradient(135deg, #166534 0%, #15803d 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                  🚲
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                    {order.agent?.name || "Ramesh Kumar (Dabbawala Rider #402)"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#bbf7d0" }}>
                    Hyperlocal Carrier • Active on Delivery Route
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  onClick={() => window.location.href = `tel:${order.agent?.phone || '9876543210'}`}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  title="Call Rider"
                >
                  <Phone size={16} />
                </button>
                <button
                  onClick={() => setShowChatModal(false)}
                  style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Toast Notification */}
            {toastMsg && (
              <div style={{ background: "#dcfce7", color: "#166534", padding: "0.6rem 1rem", fontSize: "0.82rem", fontWeight: 700, textAlign: "center", borderBottom: "1px solid #86efac" }}>
                {toastMsg}
              </div>
            )}

            {/* 1-Tap Waste Alert Shortcuts Bar */}
            <div style={{ padding: "0.75rem 1rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <Sparkles size={13} color="#16a34a" /> 1-Tap Waste Pickup Shortcuts:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => handle1TapShortcut("🌱 I have ~2kg fruit & vegetable peels ready for collection upon delivery!", 2)}
                  style={{ padding: "5px 10px", borderRadius: "100px", border: "1px solid #86efac", background: "#f0fdf4", color: "#166534", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  🌱 I have ~2kg Peels Ready
                </button>
                <button
                  type="button"
                  onClick={() => handle1TapShortcut("📍 Kept segregated organic waste bin outside front door for pickup.", 2)}
                  style={{ padding: "5px 10px", borderRadius: "100px", border: "1px solid #86efac", background: "#f0fdf4", color: "#166534", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  📍 Waste Bin Kept Outside Door
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat("📞 Please call 2 minutes before arriving so I can bring the wet waste.")}
                  style={{ padding: "5px 10px", borderRadius: "100px", border: "1px solid #cbd5e1", background: "white", color: "#334155", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                >
                  📞 Call 2 mins before arriving
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", background: "#f1f5f9", minHeight: "220px" }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: "center", margin: "auto", color: "#64748b", padding: "1.5rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>No messages yet</div>
                  <p style={{ fontSize: "0.8rem", margin: "4px 0 0 0", color: "#64748b" }}>
                    Use the 1-tap shortcuts above or write to notify your delivery rider about wet-waste collection or delivery instructions.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isCustomer = msg.sender === "customer";
                  const isSystem = msg.sender === "system";

                  if (isSystem) {
                    return (
                      <div key={i} style={{ alignSelf: "center", maxWidth: "90%", background: "#e0f2fe", border: "1px solid #bae6fd", borderRadius: "10px", padding: "0.5rem 0.8rem", textAlign: "center", fontSize: "0.75rem", color: "#0369a1", margin: "0.25rem 0" }}>
                        {msg.text}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isCustomer ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        background: isCustomer ? (msg.isWasteAlert ? "#dcfce7" : "#16a34a") : "white",
                        color: isCustomer ? (msg.isWasteAlert ? "#166534" : "white") : "#1e293b",
                        padding: "0.65rem 0.9rem",
                        borderRadius: "14px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        border: msg.isWasteAlert ? "1px solid #86efac" : "none"
                      }}
                    >
                      {msg.isWasteAlert && (
                        <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#15803d", marginBottom: "2px" }}>
                          🌱 Wet Waste Pickup Alert
                        </div>
                      )}
                      <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>{msg.text}</div>
                      <div style={{ fontSize: "0.65rem", marginTop: "3px", textAlign: "right", opacity: 0.75 }}>
                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Strict Policy Reminder Banner */}
            <div style={{ background: "#fffbeb", padding: "0.4rem 1rem", borderTop: "1px solid #fef08a", fontSize: "0.72rem", color: "#92400e", textAlign: "center" }}>
              ⚠️ <strong>Strict Rule:</strong> ONLY raw vegetable & fruit scraps accepted. Cooked food/plastics strictly rejected at doorstep scan.
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{ padding: "0.75rem 1rem", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.5rem" }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message to delivery rider..."
                style={{ flex: 1, padding: "0.65rem 0.9rem", borderRadius: "100px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                style={{
                  background: "#16a34a", color: "white", border: "none", borderRadius: "50%",
                  width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: (!chatInput.trim() || sendingChat) ? "not-allowed" : "pointer", opacity: (!chatInput.trim() || sendingChat) ? 0.6 : 1
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
