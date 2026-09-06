import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import { Package, Clock, CheckCircle, Truck, MapPin, Phone, MessageSquare, ShieldCheck, User } from "lucide-react";
import L from "leaflet";
import ReviewModal from "./ReviewModal";
import API from "../api/api";
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

export default function OrderTracking({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await API.get(`/orders/${orderId}/bill`);
      setOrder(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    
    // Live Tracking via Socket.io
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
    
    socket.on("order_updated", (updated) => {
      if (updated._id === orderId) {
        fetchOrder();
      }
    });

    socket.on("agent_location_updated", (data) => {
      if (data.orderId === orderId) {
        setOrder(prev => {
          if (!prev) return prev;
          return { ...prev, agentLatitude: data.lat, agentLongitude: data.lng };
        });
      }
    });

    return () => socket.disconnect();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100000, background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loader" style={{ width: 40, height: 40, border: "4px solid #16a34a", borderTopColor: "transparent" }}></div>
      </div>
    );
  }

  if (!order) return null;

  const statuses = ["pending", "confirmed", "assigned", "picked_up", "in_transit", "delivered"];
  const currentStatusIndex = statuses.indexOf(order.status) >= 0 ? statuses.indexOf(order.status) : 0;
  
  // Show review immediately if delivered
  if (order.status === "delivered" && !showReview && !order.reviewText) {
    setTimeout(() => setShowReview(true), 1500);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "white", padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: "#1e293b", fontWeight: 800 }}>Order Tracking</h2>
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.2rem" }}>Bill #{order.billNumber} • ETA: {order.estimatedDeliveryMinutes || 35} mins</div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              const receiptHtml = `<html><head><title>Bill #${order.billNumber}</title><style>body{font-family:sans-serif;padding:2rem;max-width:500px;margin:0 auto}.row{display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #eee}h2{color:#16a34a}.total{font-weight:800;font-size:1.2rem}</style></head><body><h2>Rythu Sethu</h2><h3>Bill Receipt</h3><div class="row"><span>Bill No</span><strong>#${order.billNumber}</strong></div><div class="row"><span>Item</span><span>${order.items?.[0]?.name || order.crop?.name || "Crop"}</span></div><div class="row"><span>Quantity</span><span>${order.quantity} ${order.unit||"kg"}</span></div><div class="row"><span>Subtotal</span><span>&#8377;${order.subtotal||order.totalAmount}</span></div><div class="row"><span>Delivery</span><span>&#8377;${order.deliveryCharges||0}</span></div><div class="row total"><span>Total Paid</span><span>&#8377;${order.totalAmount}</span></div><div class="row"><span>Payment</span><span>${(order.paymentMode||"COD").toUpperCase()} - ${order.paymentStatus||"pending"}</span></div><div class="row"><span>Farmer</span><span>${order.farmer?.name||"Farmer"}</span></div><div class="row"><span>Status</span><span>${order.status}</span></div><p style="margin-top:1rem;color:#64748b;font-size:0.8rem">Thank you for supporting Indian farmers via Rythu Sethu!</p><script>window.print()</script></body></html>`;
              const w = window.open("", "_blank");
              if (w) { w.document.write(receiptHtml); w.document.close(); }
            }}
            style={{ padding: "0.6rem 1.2rem", borderRadius: "100px", border: "1px solid #16a34a", background: "#f0fdf4", color: "#16a34a", cursor: "pointer", fontWeight: 600 }}
          >
            🧾 View Receipt
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
            {/* Real Map */}
            {(order.deliveryLatitude && order.deliveryLongitude) ? (
              <MapContainer 
                center={[order.agentLatitude || order.deliveryLatitude, order.agentLongitude || order.deliveryLongitude]} 
                zoom={14} 
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
                <Marker position={[order.deliveryLatitude, order.deliveryLongitude]} icon={homeIcon} />
                {order.agentLatitude && order.agentLongitude && (
                  <>
                    <Marker position={[order.agentLatitude, order.agentLongitude]} icon={vehicleIcon} />
                    <Polyline positions={[[order.agentLatitude, order.agentLongitude], [order.deliveryLatitude, order.deliveryLongitude]]} color="#3b82f6" weight={4} dashArray="10, 10" />
                  </>
                )}
              </MapContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                Map tracking unavailable
              </div>
            )}

            {/* OTP Overlay for Delivery */}
            {order.status !== "delivered" && order.verificationCode && (
              <div style={{ position: "absolute", top: 20, left: 20, right: 20, zIndex: 1000, background: "rgba(255,255,255,0.95)", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", backdropFilter: "blur(4px)", border: "2px dashed #16a34a", textAlign: "center" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>Delivery Verification Code (OTP)</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#16a34a", letterSpacing: "8px" }}>{order.verificationCode}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.5rem" }}>Share this with the agent to receive your order securely.</div>
              </div>
            )}
          </div>

          {/* Agent Info Box */}
          {order.agent && order.status !== "delivered" && (
            <div style={{ background: "white", padding: "1.5rem", borderTop: "1px solid #e2e8f0", zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={24} color="#64748b" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1e293b" }}>{order.agent.name || "Delivery Partner"}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ShieldCheck size={14} color="#16a34a" /> Verified Agent • ⭐ 4.8
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "#dcfce7", color: "#16a34a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={20} /></button>
                  <button style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "#3b82f6", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => window.location.href = `tel:${order.agent.phone || ''}`}><Phone size={20} /></button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Status Timeline & Details */}
        <div style={{ flex: "1 1 400px", background: "white", padding: "2rem", borderLeft: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "2rem", color: "#1e293b" }}>Order Timeline</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {[
              { id: "pending", label: "Order Placed", icon: Package, desc: "Waiting for confirmation" },
              { id: "confirmed", label: "Confirmed", icon: CheckCircle, desc: "Farmer is preparing your items" },
              { id: "assigned", label: "Agent Assigned", icon: User, desc: "A delivery partner is heading to the farm" },
              { id: "picked_up", label: "Picked Up", icon: Package, desc: "Your items are securely collected" },
              { id: "in_transit", label: "On the Way", icon: Truck, desc: "Agent is heading to your location" },
              { id: "delivered", label: "Delivered", icon: MapPin, desc: "Successfully delivered" },
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
              <div><strong>Items:</strong> {order.items?.[0]?.name} x{order.items?.[0]?.quantity}</div>
              <div><strong>Amount:</strong> ₹{order.totalAmount?.toLocaleString()}</div>
              <div><strong>Payment:</strong> <span style={{ textTransform: "uppercase" }}>{order.paymentMode}</span> ({order.paymentStatus})</div>
              <div><strong>Address:</strong> {order.customer?.address || order.deliveryAddress}</div>
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
    </div>
  );
}
