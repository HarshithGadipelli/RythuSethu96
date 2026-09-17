"use client";

import { BASE_URL } from '../../api/api';
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Package, CheckCircle, Clock, MapPin } from "lucide-react";
import API from "../../api/api";
import LiveMapModal from "../../components/LiveMapModal";
import AuthenticityCertificate from "../../components/AuthenticityCertificate";
import OrderInvoiceModal from "../../components/OrderInvoiceModal";
import { useAuth } from "../../context/AuthContext";
import { getImgSrc } from "./Marketplace";

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
                            width: o.status === "pending" ? "0%" 
                                 : o.status === "assigned" ? "25%" 
                                 : o.status === "picked_up" ? "50%" 
                                 : o.status === "in_transit" ? "75%" 
                                 : o.status === "delivered" ? "80%" : "0%",
                            height: "2px", background: "var(--green-mid)", zIndex: 0, transition: "width 0.5s ease" 
                          }}></div>
                        )}

                        {[
                          { key: "pending", label: "Pending" },
                          { key: "assigned", label: "Assigned" },
                          { key: "picked_up", label: "Under Pickup" },
                          { key: "in_transit", label: "In Transit" },
                          { key: "delivered", label: "Delivered" }
                        ].map((step, idx, arr) => {
                          const statusOrder = ["pending", "assigned", "picked_up", "in_transit", "delivered"];
                          const currentIdx = statusOrder.indexOf(o.status);
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
                                {isCurrent && step.key === "in_transit" && <div style={{ fontSize: "0.7rem", color: "#d97706" }}>About to Deliver</div>}
                              </span>
                            </div>
                          );
                        })}
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
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-end" }}>
                <button onClick={() => setInvoiceOrder(o)} className="btn-secondary" style={{ padding: "0.6rem 1rem", fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", fontWeight: 700 }}>
                  📄 View Tax Bill
                </button>

                {(o.deliveryType === "farm_pickup" || ["in_transit", "assigned", "picked_up", "confirmed", "pending"].includes(o.status)) && o.status !== "delivered" && o.status !== "cancelled" && (
                  <button 
                    onClick={() => setTrackingOrder(o)} 
                    className="btn-primary" 
                    style={{ 
                      padding: "0.6rem 1rem", fontSize: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", 
                      background: o.deliveryType === "farm_pickup" ? "#16a34a" : "#2563eb" 
                    }}
                  >
                    <MapPin size={16} /> {o.deliveryType === "farm_pickup" ? "🏡 Farm Pickup & OTP" : "Track Live"}
                  </button>
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
      </AnimatePresence>
    </div>
  );
}

