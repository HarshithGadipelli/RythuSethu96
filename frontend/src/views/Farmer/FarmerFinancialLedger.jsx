"use client";

import React, { useState, useEffect } from "react";
import { Wallet, TrendingUp, CreditCard, Calendar, IndianRupee, Store, Truck, Filter, CheckCircle2, PackageCheck } from "lucide-react";
import { motion } from "framer-motion";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

export default function FarmerFinancialLedger({ orders = [] }) {
  const { user } = useAuth();
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "offline_farm" | "delivery"
  const [effectiveOrders, setEffectiveOrders] = useState(orders || []);

  const PLATFORM_FEE_PERCENT = 2; // 2% fair-trade platform fee

  useEffect(() => {
    fetchSettlements();
  }, [user]);

  useEffect(() => {
    if (orders && orders.length > 0) {
      setEffectiveOrders(orders);
    } else if (user?._id) {
      API.get(`/orders/farmer/${user._id}`)
        .then(res => setEffectiveOrders(res.data || []))
        .catch(() => {});
    }
  }, [orders, user]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const res = await API.get("/farmer/settlements");
      setSettlementData(res.data);
    } catch (err) {
      console.error("Failed to load farmer settlements", err);
    } finally {
      setLoading(false);
    }
  };

  const nextPayoutDate = settlementData?.nextPayoutDate 
    ? new Date(settlementData.nextPayoutDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "Next Bi-Weekly Cutoff";

  const daysRemaining = settlementData?.daysRemainingInCycle ?? 14;
  const pastSettlements = settlementData?.pastSettlements || [];
  const pendingBalance = user?.pendingSettlement || settlementData?.pendingSettlementBalance || 0;

  // ─── Distinguish Completed Deliveries vs Offline Direct Farm Gate Buys ───
  const isSettledOrDelivered = (o) => 
    o.status === "delivered" || o.status === "completed" || o.paymentStatus === "paid" || o.paidAtFarm;

  const isFarmBuy = (o) => 
    o.deliveryType === "farm_pickup" || o.deliveryType === "pickup" || o.paidAtFarm || o.isOfflineBuy;

  const allCompleted = effectiveOrders.filter(isSettledOrDelivered);

  // Direct Farm Buys (Offline at Farm Gate)
  const offlineFarmOrders = allCompleted.filter(isFarmBuy);

  // Courier / Doorstep Deliveries
  const deliveryOrders = allCompleted.filter(o => !isFarmBuy(o));

  // Compute revenues using the full order price (subtotal or totalAmount minus delivery charge)
  const getOrderPrice = (o) => {
    if (isFarmBuy(o)) {
      // For offline buy at farm, order price is full subtotal / totalAmount (no delivery fee)
      return o.subtotal || o.totalAmount || 0;
    }
    // For deliveries, farmer gets product price (subtotal), delivery fee goes to courier
    return o.subtotal || Math.max(0, (o.totalAmount || 0) - (o.deliveryCharges || 0));
  };

  const offlineFarmRevenue = offlineFarmOrders.reduce((sum, o) => sum + getOrderPrice(o), 0);
  const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + getOrderPrice(o), 0);
  const totalGrossRevenue = offlineFarmRevenue + deliveryRevenue;

  // Filtered orders for the transaction breakdown table
  const displayedOrders = allCompleted.filter(o => {
    if (activeFilter === "offline_farm") return isFarmBuy(o);
    if (activeFilter === "delivery") return !isFarmBuy(o);
    return true;
  });

  return (
    <div className="glass-card" style={{ padding: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(22, 163, 74, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
            <Wallet size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.4rem" }}>Farmer Financial & Settlement Ledger</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Comprehensive accounting: offline buys at farm gate (at order price), doorstep deliveries, and 14-day bank settlements.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 2-WEEK BI-WEEKLY SETTLEMENT POLICY BANNER ─── */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #166534 100%)",
        borderRadius: "16px", padding: "1.25rem 1.5rem", color: "white",
        marginBottom: "1.75rem", boxShadow: "0 8px 20px rgba(6, 78, 59, 0.25)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Calendar size={28} style={{ color: "#86efac" }} />
            <div>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#bbf7d0", fontWeight: 700 }}>
                Bi-Weekly Payout Cycle
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800 }}>
                14-Day Farmer Settlement Schedule
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "#dcfce7" }}>
                🔒 Harvest sales from both offline farm buys and deliveries are credited to your ledger and disbursed every 14 days.
              </p>
            </div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(6px)",
            padding: "0.6rem 1.2rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.2)",
            textAlign: "right"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#bbf7d0", fontWeight: 600 }}>NEXT SETTLEMENT DATE</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>{nextPayoutDate}</div>
            <div style={{ fontSize: "0.72rem", color: "#fef08a", fontWeight: 700 }}>
              ⏱️ {daysRemaining} days remaining in cycle
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 REVENUE & BALANCE METRIC CARDS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        
        {/* 1. Offline Buy at Farm Gate Balance */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #86efac", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 700 }}>🏡 DIRECT FARM BUYS (OFFLINE)</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <Store size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#166534" }}>
            ₹{offlineFarmRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "4px", fontWeight: 600 }}>
            {offlineFarmOrders.length} offline farm gate purchases • Full order price credited (₹0 delivery deduction)
          </div>
        </div>

        {/* 2. Doorstep Deliveries Revenue */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #bfdbfe", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#1e40af", fontWeight: 700 }}>🚚 DOORSTEP DELIVERIES</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <Truck size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e40af" }}>
            ₹{deliveryRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#3b82f6", marginTop: "4px", fontWeight: 600 }}>
            {deliveryOrders.length} courier deliveries completed
          </div>
        </div>

        {/* 3. Combined Total Harvest Sales */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>TOTAL HARVEST SALES</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b" }}>
            ₹{totalGrossRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>
            Across {allCompleted.length} total completed orders
          </div>
        </div>

        {/* 4. Pending 2-Week Settlement */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #fde047", boxShadow: "0 4px 12px rgba(234, 179, 8, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#854d0e", fontWeight: 700 }}>PENDING 2-WEEK PAYOUT</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", color: "#ca8a04" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#854d0e" }}>
            ₹{pendingBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#a16207", marginTop: "4px", fontWeight: 600 }}>
            Disbursing to UPI/Bank on {nextPayoutDate}
          </div>
        </div>

      </div>

      {/* ─── HARVEST ORDERS & OFFLINE BUYS BREAKDOWN TABLE ─── */}
      <div style={{ marginTop: "2rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", color: "#1e293b", fontWeight: 800, margin: 0 }}>
              📊 Order Price & Channel Sales Breakdown
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Detailed ledger accounting for both offline farm purchases and courier deliveries.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "10px", gap: "4px" }}>
            {[
              { id: "all", label: `All Orders (${allCompleted.length})` },
              { id: "offline_farm", label: `🏡 Direct Farm Buys (${offlineFarmOrders.length})` },
              { id: "delivery", label: `🚚 Deliveries (${deliveryOrders.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "8px",
                  border: "none",
                  background: activeFilter === tab.id ? "white" : "transparent",
                  color: activeFilter === tab.id ? "#166534" : "#64748b",
                  fontWeight: activeFilter === tab.id ? 700 : 500,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: activeFilter === tab.id ? "0 2px 4px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {displayedOrders.length === 0 ? (
          <div style={{
            padding: "2.5rem", textAlign: "center", background: "#f8fafc",
            borderRadius: "14px", border: "1px dashed #cbd5e1"
          }}>
            <PackageCheck size={36} color="#94a3b8" style={{ marginBottom: "0.5rem" }} />
            <div style={{ fontWeight: 700, color: "#475569" }}>No Orders in this Channel Yet</div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Completed harvest orders and direct farm purchases will automatically record in this ledger.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="rs-table">
              <thead>
                <tr>
                  <th>Bill / Order ID</th>
                  <th>Date</th>
                  <th>Produce / Item</th>
                  <th>Channel</th>
                  <th>Order Price</th>
                  <th>Platform Fee</th>
                  <th>Net Farmer Share</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map(o => {
                  const isOffline = isFarmBuy(o);
                  const orderPrice = getOrderPrice(o);
                  const fee = Math.round(orderPrice * (PLATFORM_FEE_PERCENT / 100));
                  const netShare = Math.max(0, orderPrice - fee);

                  return (
                    <tr key={o._id}>
                      <td>
                        <strong style={{ fontFamily: "monospace", color: "#166534", fontSize: "0.85rem" }}>
                          {o.billNumber || o._id.slice(-6).toUpperCase()}
                        </strong>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#475569" }}>
                        {new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td>
                        <strong style={{ fontSize: "0.9rem", color: "#1e293b" }}>
                          {o.crop?.name || o.cropName || "Harvest Produce"}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>
                          {o.quantity} {o.crop?.unit || "kg"}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "100px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: isOffline ? "#dcfce7" : "#eff6ff",
                          color: isOffline ? "#166534" : "#1e40af"
                        }}>
                          {isOffline ? <Store size={12} /> : <Truck size={12} />}
                          {isOffline ? "🏡 Farm Gate Buy (Offline)" : "🚚 Doorstep Delivery"}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                          ₹{orderPrice.toLocaleString()}
                        </strong>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        -₹{fee.toLocaleString()} (2%)
                      </td>
                      <td>
                        <strong style={{ fontSize: "1rem", color: "#166534" }}>
                          ₹{netShare.toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span style={{
                          background: o.paymentStatus === "paid" ? "#dcfce7" : "#fef9c3",
                          color: o.paymentStatus === "paid" ? "#166534" : "#854d0e",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textTransform: "uppercase"
                        }}>
                          {isOffline ? (o.paidAtFarm ? "Paid at Farm" : "Farm Cash / UPI") : (o.paymentMode || "Paid")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── PAST BI-WEEKLY SETTLEMENTS TABLE ─── */}
      <div style={{ marginTop: "1rem" }}>
        <h3 style={{ fontSize: "1.15rem", color: "#1e293b", fontWeight: 800, marginBottom: "1rem" }}>
          📜 Bi-Weekly Settlement Disbursement History
        </h3>

        {pastSettlements.length === 0 ? (
          <div style={{
            padding: "2.5rem", textAlign: "center", background: "#f8fafc",
            borderRadius: "14px", border: "1px dashed #cbd5e1"
          }}>
            <Calendar size={36} color="#94a3b8" style={{ marginBottom: "0.5rem" }} />
            <div style={{ fontWeight: 700, color: "#475569" }}>No Prior Settlements Disbursed Yet</div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Your accrued sales will be disbursed in the upcoming bi-weekly settlement cycle ({nextPayoutDate}).
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="rs-table">
              <thead>
                <tr>
                  <th>Settlement Ref</th>
                  <th>Cycle Period</th>
                  <th>Payout Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pastSettlements.map(s => (
                  <tr key={s._id}>
                    <td>
                      <strong style={{ fontFamily: "monospace", color: "#166534" }}>{s.transactionReference}</strong>
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {new Date(s.cycleStartDate).toLocaleDateString()} - {new Date(s.cycleEndDate).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {new Date(s.payoutDate || s.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <strong style={{ color: "#166534", fontSize: "1rem" }}>₹{s.amount.toLocaleString()}</strong>
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {s.paymentMethod?.toUpperCase()} {s.upiId ? `(${s.upiId})` : ""}
                    </td>
                    <td>
                      <span style={{
                        background: "#dcfce7", color: "#166534", padding: "3px 8px",
                        borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700
                      }}>
                        ✅ Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
