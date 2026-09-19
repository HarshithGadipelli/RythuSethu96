"use client";

import { BASE_URL } from '../../api/api';
import React, { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Package, CheckCircle, Clock, MapPin } from "lucide-react";
import API from "../../api/api";
import LiveMapModal from "../../components/LiveMapModal";
import AuthenticityCertificate from "../../components/AuthenticityCertificate";
import OrderInvoiceModal from "../../components/OrderInvoiceModal";
import { useAuth } from "../../context/AuthContext";
import { getImgSrc } from "./Marketplace";

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let farmerIcon = null;
if (typeof window !== "undefined" && L && L.divIcon) {
  farmerIcon = L.divIcon({
    className: "custom-farmer-icon",
    html: `<div style="
      display: flex; justify-content: center; align-items: center;
      width: 36px; height: 36px; background: linear-gradient(135deg, #16a34a, #15803d);
      border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    "><span style="font-size: 1.1rem;">🌾</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

export default function CustomerOrders({ orders, fetchOrders }) {
  const { user } = useAuth();
  const [reviewModal, setReviewModal] = useState(null);
  const [farmRating, setFarmRating] = useState(5);
  const [farmerRating, setFarmerRating] = useState(5);
  const [platformRating, setPlatformRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [certificateOrder, setCertificateOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stageModalOrder, setStageModalOrder] = useState(null);
  const [farmOriginModalOrder, setFarmOriginModalOrder] = useState(null);
  const [transitInfoModalOrder, setTransitInfoModalOrder] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;
    try {
      const res = await API.get(`/boxes/user/${user._id}`);
      setSubscriptions(res.data || []);
    } catch (e) {
      console.error("Failed to fetch subscriptions", e);
    }
  };

  const toggleSubscription = async (id) => {
    try {
      await API.put(`/boxes/toggle/${id}`);
      fetchSubscriptions();
    } catch (e) {
      console.error(e);
    }
  };

  const openReviewModal = (order) => {
    setReviewModal(order);
    setFarmRating(order.farmRating || 5);
    setFarmerRating(order.farmerRating || 5);
    setPlatformRating(order.platformRating || 5);
    setDeliveryRating(order.deliveryRating || 5);
    setComment(order.reviewFeedback || order.reviewText || "");
    setMsg("");
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const isFarmBuy = reviewModal.deliveryType === "farm_pickup" || reviewModal.deliveryType === "pickup" || !reviewModal.agent;
      await API.post(`/orders/${reviewModal._id}/review`, {
        farmRating,
        farmerRating,
        platformRating,
        deliveryRating: isFarmBuy ? undefined : deliveryRating,
        comment,
        reviewFeedback: comment,
        buyType: isFarmBuy ? "farm" : "delivery",
        userId: user?._id
      });

      setMsg("✅ Review submitted successfully! Thank you for rating.");
      setTimeout(() => {
        setReviewModal(null);
        setMsg("");
        if (typeof fetchOrders === "function") fetchOrders();
      }, 1500);
    } catch (err) {
      setMsg(err.response?.data?.message || err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const res = await API.put(`/orders/${cancelModal._id}/cancel`, { userId: user?._id });
      setMsg(res.data?.message || "Order cancelled successfully.");
      if (typeof fetchOrders === "function") fetchOrders();
      setTimeout(() => {
        setCancelModal(null);
        setMsg("");
      }, 1200);
    } catch (err) {
      setMsg(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="customer-orders" style={{ paddingTop: "1rem" }}>
      <h2 style={{ color: "var(--text-dark)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Package size={24} color="var(--green-mid)" /> My Orders
      </h2>

      {!orders || orders.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
          <h3 style={{ color: "var(--text-mid)" }}>No orders yet!</h3>
          <p style={{ color: "var(--text-muted)" }}>Start exploring the marketplace to buy fresh crops.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {orders?.map(o => (
            <div key={o._id} style={{ 
              background: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", 
              border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "space-between", alignItems: "center" 
            }}>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "12px", background: "var(--green-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", overflow: "hidden" }}>
                  <img src={getImgSrc(o.crop?.image, o.cropName || o.crop?.name, o.crop?.category)} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"12px"}} alt=""/>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem", color: "var(--text-dark)", fontSize: "1.2rem" }}>{o.cropName || o.crop?.name}</h3>
                  <p style={{ margin: "0 0 0.5rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {o.quantity} {o.unit || "kg"} • ₹{o.totalAmount}
                  </p>
                    <div style={{ width: "100%", marginTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", marginBottom: "0.5rem" }}>
                        <div style={{ position: "absolute", top: "10px", left: "10%", right: "10%", height: "2px", background: "#e2e8f0", zIndex: 0 }}></div>
                        
                        {/* Progress Line fill */}
                        {o.status !== "cancelled" && (
                          <div style={{ 
                            position: "absolute", top: "10px", left: "10%", 
                            width: (o.deliveryLegs && o.deliveryLegs.length > 1)
                              ? (o.logisticsPhase === "pending" ? "0%" : o.logisticsPhase === "farm_to_hub" ? "25%" : o.logisticsPhase === "hub_to_storage" ? "50%" : o.logisticsPhase === "storage_to_customer" ? "75%" : o.logisticsPhase === "completed" ? "80%" : "0%")
                              : (o.status === "pending" ? "0%" : o.status === "assigned" ? "25%" : o.status === "picked_up" ? "50%" : o.status === "in_transit" ? "75%" : o.status === "delivered" ? "80%" : "0%"),
                            height: "2px", background: "var(--green-mid)", zIndex: 0, transition: "width 0.5s ease" 
                          }}></div>
                        )}

                        {(() => {
                          const steps = (o.deliveryLegs && o.deliveryLegs.length > 1) 
                            ? [
                                { key: "pending", label: "Pending" },
                                { key: "farm_to_hub", label: "Farm to Hub" },
                                { key: "hub_to_storage", label: "City Storage" },
                                { key: "storage_to_customer", label: "Out for Delivery" },
                                { key: "completed", label: "Delivered" }
                              ]
                            : [
                                { key: "pending", label: "Pending" },
                                { key: "assigned", label: "Assigned" },
                                { key: "picked_up", label: "Under Pickup" },
                                { key: "in_transit", label: "In Transit" },
                                { key: "delivered", label: "Delivered" }
                              ];
                          const statusOrder = steps.map(s => s.key);
                          const currentIdx = statusOrder.indexOf(o.deliveryLegs && o.deliveryLegs.length > 1 ? o.logisticsPhase : o.status);
                          
                          return steps.map((step, idx) => {
                            const isCompleted = currentIdx >= idx && o.status !== "cancelled";
                            const isCurrent = currentIdx === idx && o.status !== "cancelled";
                            
                            return (
                              <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, flex: 1 }}>
                                <div style={{ 
                                  width: "20px", height: "20px", borderRadius: "50%", 
                                  background: isCompleted ? "var(--green-mid)" : "#f1f5f9",
                                  border: `2px solid ${isCompleted ? "var(--green-mid)" : "#cbd5e1"}`,
                                  display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                  {isCompleted && <CheckCircle size={12} color="white" />}
                                </div>
                                <span style={{ 
                                  fontSize: "0.75rem", marginTop: "0.4rem", 
                                  color: isCurrent ? "var(--green-deep)" : isCompleted ? "var(--green-mid)" : "var(--text-muted)",
                                  fontWeight: isCurrent ? 600 : 400, textAlign: "center"
                                }}>
                                  {step.label}
                                  {isCurrent && (step.key === "in_transit" || step.key === "storage_to_customer") && <div style={{ fontSize: "0.7rem", color: "#d97706" }}>About to Deliver</div>}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {o.status === "cancelled" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626", marginTop: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                          <span className="badge" style={{ background: "#fee2e2", color: "#dc2626", margin: 0 }}>Cancelled</span> Order was cancelled.
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Clock size={12} /> {new Date(o.createdAt).toLocaleDateString()}
                      </span>
                    
                    {/* Payment Status Badge */}
                    <span className="badge" style={{ 
                      background: o.paymentStatus === "paid" ? "#dcfce7" : "#f1f5f9", 
                      color: o.paymentStatus === "paid" ? "#16a34a" : "#64748b",
                      border: `1px solid ${o.paymentStatus === "paid" ? "#bbf7d0" : "#e2e8f0"}`,
                      marginLeft: "0.5rem"
                    }}>
                      💳 {o.paymentStatus === "paid" ? "Paid" : "Cash on Delivery"}
                    </span>

                    {o.isPreBooking && o.crop?.expectedHarvestDate && (
                      <span className="badge" style={{ background: "#e0e7ff", color: "#4338ca", marginLeft: "0.5rem" }}>
                        📅 Expected: {new Date(o.crop.expectedHarvestDate).toLocaleDateString()}
                      </span>
                    )}

                    {o.crop && (o.crop.lifecycleStage || o.crop.growingStage) && (
                      <button 
                        onClick={() => setStageModalOrder(o)}
                        style={{
                          background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a",
                          borderRadius: "100px", padding: "2px 10px", fontSize: "0.78rem", fontWeight: 700,
                          cursor: "pointer", marginLeft: "0.5rem", display: "inline-flex", alignItems: "center", gap: "4px"
                        }}
                        title="Click to see farmer's stage-wise updates and field photos"
                      >
                        🌱 Stage: {(o.crop.lifecycleStage || o.crop.growingStage).replace("_", " ")}
                        {o.crop.lifecycleUpdates?.length > 0 && (
                          <span style={{ background: "#d97706", color: "white", padding: "1px 5px", borderRadius: "100px", fontSize: "0.65rem" }}>
                            {o.crop.lifecycleUpdates.length}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Real Farm Location & Origin Section */}
                  <div style={{
                    marginTop: "0.85rem", padding: "0.65rem 0.9rem",
                    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px",
                    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.84rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>🌾</span>
                      <div>
                        <span style={{ fontWeight: 700, color: "#166534" }}>
                          Farm of Origin: {o.farmerProfile?.farmName || o.farmer?.farmName || o.crop?.realFarmDetails?.farmName || `${o.farmer?.name || "Verified Farmer"}'s Farm`}
                        </span>
                        <span style={{ color: "#15803d", marginLeft: "0.4rem", fontSize: "0.78rem" }}>
                          • 📍 {o.farmerProfile?.farmLocation || o.crop?.realFarmDetails?.farmLocation || o.crop?.farmLocation || o.farmer?.location || "Telangana Agro Zone"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFarmOriginModalOrder(o)}
                      style={{
                        background: "#16a34a", color: "white", border: "none",
                        borderRadius: "6px", padding: "4px 10px", fontSize: "0.76rem", fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                      }}
                    >
                      <MapPin size={13} /> View Farm Details & Media
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-end" }}>
                <button onClick={() => setInvoiceOrder(o)} className="btn-secondary" style={{ padding: "0.6rem 1rem", fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", fontWeight: 700 }}>
                  📄 View Tax Bill
                </button>

                {(o.deliveryType === "farm_pickup" || ["in_transit", "assigned", "picked_up", "confirmed", "pending"].includes(o.status)) && o.status !== "delivered" && o.status !== "cancelled" && (
                  (() => {
                    const isMultiHop = o.deliveryLegs && o.deliveryLegs.length > 1;
                    const bikeLeg = isMultiHop ? o.deliveryLegs.find(l => l.legType === "storage_to_customer" || l.vehicleType === "bike") : null;
                    const hasBikePartner = isMultiHop 
                      ? (o.logisticsPhase === "storage_to_customer" || Boolean(bikeLeg && bikeLeg.agent))
                      : Boolean(o.agent || o.deliveryType === "farm_pickup");

                    if (!hasBikePartner && o.deliveryType !== "farm_pickup") {
                      return (
                        <button 
                          onClick={() => setTransitInfoModalOrder(o)}
                          className="btn-secondary" 
                          style={{ 
                            padding: "0.6rem 1rem", fontSize: "0.85rem", 
                            display: "flex", gap: "0.4rem", alignItems: "center", 
                            background: "#f8fafc", color: "#64748b", border: "1px dashed #cbd5e1",
                            cursor: "pointer"
                          }}
                          title="Click to view city cold storage transit status"
                        >
                          <Clock size={15} color="#94a3b8" /> 🚴 Live Bike Tracking
                          <span style={{ fontSize: "0.68rem", background: "#e2e8f0", padding: "2px 6px", borderRadius: "8px", fontWeight: 600 }}>
                            Activates on Bike Assignment
                          </span>
                        </button>
                      );
                    }
                    
                    return (
                      <button 
                        onClick={() => setTrackingOrder(o)} 
                        className="btn-primary" 
                        style={{ 
                          padding: "0.6rem 1rem", fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", 
                          background: o.deliveryType === "farm_pickup" ? "#16a34a" : "#2563eb",
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
                        }}
                      >
                        <MapPin size={16} /> {o.deliveryType === "farm_pickup" ? "🏡 Farm Pickup & OTP" : "🚴 Track Live Bike Partner"}
                      </button>
                    );
                  })()
                )}

                {o.status !== "delivered" && o.status !== "cancelled" && (
                  <button onClick={() => { setCancelModal(o); setMsg(""); }} className="btn-secondary" style={{ padding: "0.6rem 1rem", fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                    ❌ Cancel Order
                  </button>
                )}
                
                {o.crop && (
                  <button onClick={() => setCertificateOrder(o)} className="btn-secondary" style={{ padding: "0.6rem 1rem", fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", background: "rgba(34, 197, 94, 0.1)", color: "var(--green-deep)", border: "1px solid var(--green-pale)" }}>
                    📜 View Certificate
                  </button>
                )}
                
                {/* Allow Review for any completed purchase (delivery delivered OR farm pickup paid/completed) */}
                {(() => {
                  const isCompleted = o.status === "delivered" || o.status === "completed" || (o.deliveryType === "farm_pickup" && o.paymentStatus === "paid");
                  const isReviewed = o.hasReviewed || o.reviewGiven || (o.farmerRating && o.farmerRating > 0);
                  const isFarmBuy = o.deliveryType === "farm_pickup" || o.deliveryType === "pickup" || !o.agent;

                  if (isCompleted && !isReviewed) {
                    return (
                      <button 
                        onClick={() => openReviewModal(o)} 
                        className="btn-secondary" 
                        style={{ 
                          padding: "0.6rem 1rem", 
                          fontSize: "0.9rem", 
                          display: "flex", 
                          gap: "0.5rem", 
                          alignItems: "center",
                          background: isFarmBuy ? "#f0fdf4" : "#eff6ff",
                          borderColor: isFarmBuy ? "#86efac" : "#bfdbfe",
                          color: isFarmBuy ? "#166534" : "#1e40af"
                        }}
                      >
                        <Star size={16} fill={isFarmBuy ? "#22c55e" : "#3b82f6"} color={isFarmBuy ? "#16a34a" : "#2563eb"} /> 
                        {isFarmBuy ? "Review Farm & Farmer" : "Rate Delivery & Harvest"}
                      </button>
                    );
                  }

                  if (isReviewed) {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "var(--green-mid)", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Star size={15} fill="var(--green-mid)" /> Reviewed
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Farm: {o.farmRating || 5}★ • Farmer: {o.farmerRating || 5}★ • App: {o.platformRating || 5}★
                          {!isFarmBuy && o.deliveryRating ? ` • Delivery: ${o.deliveryRating}★` : ""}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {subscriptions.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h3 style={{ color: "var(--text-dark)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={20} color="#8b5cf6" /> Manage Box Subscriptions
          </h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {subscriptions.map(s => (
              <div key={s._id} style={{ 
                background: "white", padding: "1.5rem", borderRadius: "var(--radius-md)", 
                border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "space-between", alignItems: "center" 
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{s.boxType}</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0.2rem 0" }}>₹{s.price} / {s.frequency}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.2rem 0" }}>Next Delivery: {new Date(s.nextDeliveryDate).toLocaleDateString()}</p>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <span className={`badge ${s.status === "active" ? "badge-green" : "badge-yellow"}`}>
                    {s.status}
                  </span>
                  <button className="btn-secondary" onClick={() => toggleSubscription(s._id)}>
                    {s.status === "active" ? "Pause Subscription" : "Resume Subscription"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal with Dual Support: Farm Buy vs Delivery Buy */}
      <AnimatePresence>
        {reviewModal && (() => {
          const isFarmBuy = reviewModal.deliveryType === "farm_pickup" || reviewModal.deliveryType === "pickup" || !reviewModal.agent;
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(4px)" }}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ background: "white", padding: "2rem", borderRadius: "20px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ margin: 0, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem" }}>
                    {isFarmBuy ? "🧑‍🌾 Farm Purchase Feedback" : "🚚 Delivery Order Feedback"}
                  </h3>
                  <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "100px", background: isFarmBuy ? "#dcfce7" : "#dbeafe", color: isFarmBuy ? "#166534" : "#1e40af", fontWeight: 700 }}>
                    {isFarmBuy ? "🏡 Direct Farm Gate Buy" : "🚚 Courier Delivery"}
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.4 }}>
                  {isFarmBuy 
                    ? `How was your offline experience buying ${reviewModal.cropName || reviewModal.crop?.name || "produce"} directly from the farm? Your review directly rewards the farmer's Trust Score!`
                    : `How was your order of ${reviewModal.cropName || reviewModal.crop?.name || "produce"}? Please rate the farm, farmer, platform, and delivery courier.`}
                </p>

                {/* 1. Farm Rating */}
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>🏡 Farm Quality & Produce Environment</span>
                    <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>{farmRating} / 5 Stars</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={"farm-" + star} 
                        size={28} 
                        color={star <= farmRating ? "#16a34a" : "#cbd5e1"} 
                        fill={star <= farmRating ? "#16a34a" : "transparent"} 
                        style={{ cursor: "pointer", transition: "all 0.15s" }}
                        onClick={() => setFarmRating(star)}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Farmer Rating */}
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>🧑‍🌾 Farmer Produce & Service</span>
                    <span style={{ fontSize: "0.8rem", color: "#eab308", fontWeight: 700 }}>{farmerRating} / 5 Stars</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={"farmer-" + star} 
                        size={28} 
                        color={star <= farmerRating ? "#eab308" : "#cbd5e1"} 
                        fill={star <= farmerRating ? "#eab308" : "transparent"} 
                        style={{ cursor: "pointer", transition: "all 0.15s" }}
                        onClick={() => setFarmerRating(star)}
                      />
                    ))}
                  </div>
                </div>

                {/* 3. Platform Rating */}
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b" }}>🌐 Platform (Rythu Sethu) Experience</span>
                    <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 700 }}>{platformRating} / 5 Stars</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={"plat-" + star} 
                        size={28} 
                        color={star <= platformRating ? "#0284c7" : "#cbd5e1"} 
                        fill={star <= platformRating ? "#0284c7" : "transparent"} 
                        style={{ cursor: "pointer", transition: "all 0.15s" }}
                        onClick={() => setPlatformRating(star)}
                      />
                    ))}
                  </div>
                </div>

                {/* 4. Delivery Rating (ONLY IF DELIVERY BUY) */}
                {!isFarmBuy && (
                  <div style={{ background: "#eff6ff", padding: "1rem", borderRadius: "12px", border: "1px solid #bfdbfe", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e40af" }}>🚚 Delivery Agent & Speed</span>
                      <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700 }}>{deliveryRating} / 5 Stars</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={"del-" + star} 
                          size={28} 
                          color={star <= deliveryRating ? "#2563eb" : "#cbd5e1"} 
                          fill={star <= deliveryRating ? "#2563eb" : "transparent"} 
                          style={{ cursor: "pointer", transition: "all 0.15s" }}
                          onClick={() => setDeliveryRating(star)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Detailed Written Feedback */}
                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                    ✍️ Written Review & Feedback
                  </label>
                  <textarea 
                    className="rs-input" 
                    rows="3" 
                    placeholder={isFarmBuy ? "Share details about the farm, crop freshness, and farmer hospitality..." : "Share feedback on crop freshness, packaging, and delivery courier..."}
                    value={comment} 
                    onChange={e => setComment(e.target.value)}
                    style={{ width: "100%", borderRadius: "10px", padding: "0.75rem", border: "1.5px solid #cbd5e1" }}
                  />
                </div>

                {msg && (
                  <p style={{ color: msg.includes("✅") || msg.includes("success") ? "var(--green-mid)" : "#dc2626", fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center", fontWeight: 600 }}>
                    {msg}
                  </p>
                )}

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button className="btn-secondary" onClick={() => setReviewModal(null)} style={{ flex: 1 }}>Cancel</button>
                  <button className="btn-primary" onClick={submitReview} disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Cancel Order Modal with Farmer Sympathy Graphic */}
      <AnimatePresence>
        {cancelModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)", padding: "1rem" }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} style={{ background: "white", borderRadius: "24px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
              {/* Sympathetic Farmer Illustration Header */}
              <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden", background: "#fef3c7" }}>
                <img 
                  src="/assets/farmer_sympathy_cancel.jpg" 
                  alt="Please support fresh harvest" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  padding: "0.8rem 1.2rem 0.5rem", color: "white"
                }}>
                  <span style={{ background: "#d97706", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                    🌾 Direct Farm Harvest
                  </span>
                  <h3 style={{ margin: "0.2rem 0 0", fontSize: "1.15rem", fontWeight: 700 }}>Please Don't Cancel Your Fresh Produce!</h3>
                </div>
              </div>

              <div style={{ padding: "1.5rem" }}>
                <p style={{ color: "var(--text-dark)", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                  🥺 Our farmers prepare and harvest <strong>{cancelModal.cropName || cancelModal.crop?.name}</strong> specifically for your order. Getting direct farm-fresh goods guarantees peak nutrition for your family and prevents wastage of rural harvests!
                </p>
                
                {(() => {
                  const isLate = (new Date() - new Date(cancelModal.createdAt)) / 60000 > 2;
                  return isLate ? (
                    <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", padding: "0.8rem 1rem", borderRadius: "10px", marginBottom: "1.2rem" }}>
                      <strong style={{ color: "#dc2626", fontSize: "0.85rem" }}>⚠️ 5% Cancellation Surcharge</strong>
                      <p style={{ margin: "0.2rem 0 0", color: "#991b1b", fontSize: "0.8rem" }}>
                        Since more than 2 minutes have passed, a small 5% cancellation charge applies to offset harvest packing.
                      </p>
                    </div>
                  ) : (
                    <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.8rem 1rem", borderRadius: "10px", marginBottom: "1.2rem" }}>
                      <strong style={{ color: "#166534", fontSize: "0.85rem" }}>🌱 100% Farm-Fresh Guarantee</strong>
                      <p style={{ margin: "0.2rem 0 0", color: "#15803d", fontSize: "0.8rem" }}>
                        Harvested fresh from the field with zero artificial chemical ripening.
                      </p>
                    </div>
                  );
                })()}

                {msg && <p style={{ color: msg.includes("success") ? "var(--green-mid)" : "#dc2626", fontSize: "0.9rem", marginBottom: "1rem", textAlign: "center", fontWeight: 600 }}>{msg}</p>}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <button 
                    className="btn-primary" 
                    onClick={() => setCancelModal(null)} 
                    style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem", borderRadius: "12px", background: "var(--green-deep)", borderColor: "var(--green-deep)" }}
                  >
                    💚 Keep Order & Enjoy Fresh Harvest
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handleCancelOrder} 
                    disabled={cancelling} 
                    style={{ width: "100%", padding: "0.65rem", fontSize: "0.85rem", borderRadius: "12px", color: "#dc2626", borderColor: "#fca5a5", background: "#fff5f5" }}
                  >
                    {cancelling ? "Cancelling..." : "Cancel Order Anyway"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {trackingOrder && (
        <LiveMapModal order={trackingOrder} onClose={() => setTrackingOrder(null)} viewerRole="customer" />
      )}

      {certificateOrder && (
        <AuthenticityCertificate order={certificateOrder} onClose={() => setCertificateOrder(null)} />
      )}

      {invoiceOrder && (
        <OrderInvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

      {/* Farmer Stage Updates & Growth Proofs Modal for Customer */}
      <AnimatePresence>
        {stageModalOrder && (
          <div className="modal-overlay" onClick={() => setStageModalOrder(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "520px", maxHeight: "85vh", overflowY: "auto" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    🌱 {stageModalOrder.crop?.name || "Crop"} Live Growth Updates
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                    Farmer: <strong>{stageModalOrder.farmer?.name || stageModalOrder.crop?.farmer?.name || "Direct Producer"}</strong>
                    {stageModalOrder.crop?.farmLocation && ` • 📍 ${stageModalOrder.crop.farmLocation}`}
                  </div>
                </div>
                <button 
                  onClick={() => setStageModalOrder(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem", padding: "0.2rem" }}
                >
                  ✕
                </button>
              </div>

              {/* Visual Stepper */}
              <div style={{ background: "#f8fafc", padding: "0.8rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {["sowing", "vegetative", "flowering", "harvesting", "ready"].map((st, idx) => {
                    const STAGES = ["sowing", "vegetative", "flowering", "harvesting", "ready"];
                    const curr = (stageModalOrder.crop?.lifecycleStage || "ready").toLowerCase();
                    const currIdx = STAGES.indexOf(curr);
                    const isDone = currIdx >= idx;
                    const isCurrent = curr === st;

                    return (
                      <div key={st} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, textAlign: "center" }}>
                        <div style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          background: isCurrent ? "#16a34a" : isDone ? "#86efac" : "#e2e8f0",
                          color: isCurrent ? "white" : isDone ? "#166534" : "#94a3b8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 800,
                          boxShadow: isCurrent ? "0 0 0 3px rgba(22, 163, 74, 0.25)" : "none"
                        }}>
                          {isDone ? "✓" : idx + 1}
                        </div>
                        <span style={{
                          fontSize: "0.65rem", marginTop: "4px", textTransform: "capitalize",
                          color: isCurrent ? "#15803d" : "#64748b", fontWeight: isCurrent ? 800 : 500
                        }}>
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Updates List */}
              {stageModalOrder.crop?.lifecycleUpdates && stageModalOrder.crop.lifecycleUpdates.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  {[...stageModalOrder.crop.lifecycleUpdates].reverse().map((up, i) => (
                    <div key={i} style={{ background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "0.85rem", display: "flex", gap: "0.8rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                      {up.imageUrl && (
                        <img 
                          src={up.imageUrl.startsWith("http") || up.imageUrl.startsWith("data:") ? up.imageUrl : `${BASE_URL}/${up.imageUrl.replace(/^\/+/, "")}`}
                          alt="Stage proof" 
                          style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0", flexShrink: 0 }} 
                        />
                      )}
                      <div style={{ flex: 1, minWidth: "180px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, textTransform: "capitalize" }}>
                            🌱 {up.stage?.replace("_", " ")}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{new Date(up.timestamp).toLocaleDateString()}</span>
                        </div>
                        {up.notes && <p style={{ margin: "0.25rem 0", fontSize: "0.82rem", color: "#334155", lineHeight: 1.4 }}>{up.notes}</p>}
                        {up.aiSuggestion && (
                          <div style={{ fontSize: "0.73rem", color: "#15803d", marginTop: "0.3rem", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px" }}>
                            💡 <em>{up.aiSuggestion}</em>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem", background: "#f8fafc", borderRadius: "10px", color: "#64748b", fontSize: "0.85rem" }}>
                  Your pre-ordered crop is safely growing on the farm in <strong>{stageModalOrder.crop?.lifecycleStage || "sowing"}</strong> stage. New field photos will appear as the farmer submits stage updates.
                </div>
              )}

              <button 
                className="btn-secondary" 
                style={{ width: "100%", marginTop: "1.2rem", padding: "0.6rem" }}
                onClick={() => setStageModalOrder(null)}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

        {/* Farm Origin & Uploaded Media Modal */}
        {farmOriginModalOrder && (
          <div className="modal-overlay" onClick={() => setFarmOriginModalOrder(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "580px", maxHeight: "88vh", overflowY: "auto", padding: "1.5rem" }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>🌾</span>
                    <h3 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.2rem", fontWeight: 700 }}>
                      {farmOriginModalOrder.farmerProfile?.farmName || farmOriginModalOrder.crop?.realFarmDetails?.farmName || `${farmOriginModalOrder.farmer?.name || "Verified Farmer"}'s Farm`}
                    </h3>
                  </div>
                  <p style={{ margin: "4px 0 0 0", color: "#16a34a", fontSize: "0.85rem", fontWeight: 600 }}>
                    📍 {farmOriginModalOrder.farmerProfile?.farmLocation || farmOriginModalOrder.crop?.realFarmDetails?.farmLocation || farmOriginModalOrder.crop?.farmLocation || farmOriginModalOrder.farmer?.location || "Telangana Farm Belt"}
                  </p>
                </div>
                <button 
                  onClick={() => setFarmOriginModalOrder(null)}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              {/* Verified Farmer Badge & Info */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "0.85rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", overflow: "hidden" }}>
                    {farmOriginModalOrder.farmerProfile?.farmerPhoto || farmOriginModalOrder.farmer?.avatar ? (
                      <img src={getImgSrc(farmOriginModalOrder.farmerProfile?.farmerPhoto || farmOriginModalOrder.farmer?.avatar)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : "👨‍🌾"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#166534", fontSize: "0.95rem" }}>
                      Farmer: {farmOriginModalOrder.farmer?.name || "Direct Producer"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#15803d" }}>
                      🛡️ Verified Producer • Trust Score: {farmOriginModalOrder.farmerProfile?.trustScore || farmOriginModalOrder.farmer?.trustScore || 85}/100
                    </div>
                  </div>
                </div>
                <span style={{ background: "#16a34a", color: "white", padding: "3px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700 }}>
                  Direct Harvest
                </span>
              </div>

              {/* Interactive Leaflet Map for Real Farm Pin */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)" }}>
                    🗺️ Verified Farm Location Coordinates
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
                    {farmOriginModalOrder.farmerProfile?.latitude || farmOriginModalOrder.crop?.latitude || 17.385}° N, {farmOriginModalOrder.farmerProfile?.longitude || farmOriginModalOrder.crop?.longitude || 78.486}° E
                  </span>
                </div>
                <div style={{ height: "220px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                  <MapContainer 
                    center={[
                      farmOriginModalOrder.farmerProfile?.latitude || farmOriginModalOrder.crop?.latitude || 17.385,
                      farmOriginModalOrder.farmerProfile?.longitude || farmOriginModalOrder.crop?.longitude || 78.486
                    ]} 
                    zoom={13} 
                    style={{ height: "100%", width: "100%" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer 
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                      attribution="Esri World Imagery" 
                    />
                    <Marker 
                      position={[
                        farmOriginModalOrder.farmerProfile?.latitude || farmOriginModalOrder.crop?.latitude || 17.385,
                        farmOriginModalOrder.farmerProfile?.longitude || farmOriginModalOrder.crop?.longitude || 78.486
                      ]}
                      icon={farmerIcon || undefined}
                    >
                      <Popup>
                        <strong>{farmOriginModalOrder.farmerProfile?.farmName || "Real Farm Location"}</strong>
                        <br />
                        {farmOriginModalOrder.farmerProfile?.farmLocation || farmOriginModalOrder.crop?.farmLocation || "Telangana Farm"}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>

              {/* Farm Media & Tour Uploads */}
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  📸 Farmer Uploaded Photos & Farm Tour Media
                </h4>

                {(() => {
                  const mediaList = [];
                  if (farmOriginModalOrder.farmerProfile?.farmPhoto) mediaList.push({ type: "photo", url: farmOriginModalOrder.farmerProfile.farmPhoto, title: "Farm Panorama" });
                  if (farmOriginModalOrder.farmerProfile?.productPhoto) mediaList.push({ type: "photo", url: farmOriginModalOrder.farmerProfile.productPhoto, title: "Crop Harvest" });
                  if (farmOriginModalOrder.crop?.image) mediaList.push({ type: "photo", url: farmOriginModalOrder.crop.image, title: "Crop Item" });
                  if (farmOriginModalOrder.farmerProfile?.farmTourMedia && farmOriginModalOrder.farmerProfile.farmTourMedia.length > 0) {
                    farmOriginModalOrder.farmerProfile.farmTourMedia.forEach(m => mediaList.push({ type: m.type || "photo", url: m.url, title: "Farm Tour Media" }));
                  }

                  if (mediaList.length === 0) {
                    return (
                      <div style={{ textAlign: "center", padding: "1.2rem", background: "#f8fafc", borderRadius: "10px", color: "#64748b", fontSize: "0.82rem" }}>
                        Farm location is GPS-verified. Farmer has not uploaded additional promotional tour media yet.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.6rem" }}>
                      {mediaList.map((m, idx) => (
                        <div key={idx} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                          {m.type === "video" ? (
                            <video controls src={getImgSrc(m.url)} style={{ width: "100%", height: "95px", objectFit: "cover" }} />
                          ) : (
                            <img src={getImgSrc(m.url)} alt="" style={{ width: "100%", height: "95px", objectFit: "cover", display: "block" }} />
                          )}
                          <div style={{ padding: "4px 6px", fontSize: "0.7rem", color: "#64748b", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Farm Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ background: "#f8fafc", padding: "0.6rem", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Soil Type</div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b", textTransform: "capitalize" }}>
                    {(farmOriginModalOrder.farmerProfile?.soilType || farmOriginModalOrder.crop?.realFarmDetails?.soilType || "Red Soil").replace("_", " ")}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "0.6rem", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Farm Size</div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>
                    {farmOriginModalOrder.farmerProfile?.farmSize || farmOriginModalOrder.crop?.realFarmDetails?.farmSizeAcres || 5} Acres
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "0.6rem", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Crop Purity</div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: farmOriginModalOrder.crop?.isOrganic ? "#16a34a" : "#0284c7" }}>
                    {farmOriginModalOrder.crop?.isOrganic ? "100% Organic" : "Natural Farm"}
                  </div>
                </div>
              </div>

              {/* Logistics & Bike Tracking Notice */}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "0.75rem", fontSize: "0.8rem", color: "#1e40af", lineHeight: 1.45, marginBottom: "1rem" }}>
                ℹ️ <strong>Freshness Assurance:</strong> Your produce was harvested directly at this verified farm. It is transported safely via temperature-controlled regional hubs to prevent nutrient loss. Live real-time moving GPS map tracking activates once your local neighborhood bike partner departs with your order from the cold storage.
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", padding: "0.65rem" }}
                onClick={() => setFarmOriginModalOrder(null)}
              >
                Close Farm Details
              </button>
            </motion.div>
          </div>
        )}

        {/* Transit Info Modal (Before Bike Partner Assigned) */}
        {transitInfoModalOrder && (
          <div className="modal-overlay" onClick={() => setTransitInfoModalOrder(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "480px", padding: "1.5rem" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  🚚 Order in Regional Hub Transit
                </h3>
                <button 
                  onClick={() => setTransitInfoModalOrder(null)}
                  style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.1rem", color: "#64748b" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
                Your fresh crop from <strong>{transitInfoModalOrder.farmerProfile?.farmName || "the farm"}</strong> is safely in transit through our temperature-controlled cold chain network:
              </p>

              {/* Transit Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", padding: "0.6rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "1.2rem" }}>🌾</span>
                  <div style={{ fontSize: "0.82rem" }}>
                    <strong style={{ color: "#166534" }}>Phase 1: Harvested & Loaded at Farm</strong>
                    <div style={{ color: "#15803d" }}>Tractors & mini-trucks transport stock to regional hub</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f8fafc", padding: "0.6rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "1.2rem" }}>🏢</span>
                  <div style={{ fontSize: "0.82rem" }}>
                    <strong style={{ color: "#334155" }}>Phase 2: Regional Hub to City Cold Storage</strong>
                    <div style={{ color: "#64748b" }}>Aggregated into temperature-monitored city hubs</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#eff6ff", padding: "0.6rem", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                  <span style={{ fontSize: "1.2rem" }}>🚴</span>
                  <div style={{ fontSize: "0.82rem" }}>
                    <strong style={{ color: "#1d4ed8" }}>Phase 3: Doorstep Delivery by Bike Partner</strong>
                    <div style={{ color: "#2563eb" }}>Live real-time GPS map tracking starts the moment bike rider is assigned!</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1, padding: "0.6rem" }}
                  onClick={() => {
                    const orderToOpen = transitInfoModalOrder;
                    setTransitInfoModalOrder(null);
                    setFarmOriginModalOrder(orderToOpen);
                  }}
                >
                  🌾 View Farm Origin
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ flex: 1, padding: "0.6rem" }}
                  onClick={() => setTransitInfoModalOrder(null)}
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

