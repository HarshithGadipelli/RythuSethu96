import React, { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Clock, CreditCard, Banknote, Calendar, BarChart3, Receipt, IndianRupee, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

export default function FarmerFinancialLedger({ orders = [] }) {
  const { user } = useAuth();
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const PLATFORM_FEE_PERCENT = 2; // 2%

  useEffect(() => {
    fetchSettlements();
  }, [user]);

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

  // Compute stats from orders
  const totalSales = orders
    .filter(o => o.status === "delivered" || o.paymentStatus === "paid")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const platformFees = Math.round(totalSales * (PLATFORM_FEE_PERCENT / 100));
  const netEarnings = Math.max(0, totalSales - platformFees);

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
              14-day bi-weekly payout accounting, harvest sales, and bank settlements.
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
                🔒 Harvest sales are locked and disbursed every 2 weeks directly to your registered UPI / Bank account.
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

      {/* ─── SUMMARY STATS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {/* Pending Settlement Balance */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #86efac", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 700 }}>PENDING 2-WEEK SETTLEMENT</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#166534" }}>
            ₹{pendingBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#15803d", marginTop: "4px", fontWeight: 600 }}>
            Scheduled for disbursement on {nextPayoutDate}
          </div>
        </div>

        {/* Total Gross Sales */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>TOTAL HARVEST SALES</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b" }}>
            ₹{totalSales.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", fontWeight: 600 }}>
            Across {orders.filter(o => o.status === 'delivered').length} completed deliveries
          </div>
        </div>

        {/* Registered Bank/UPI Account */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>PAYOUT DESTINATION</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.upiId || settlementData?.upiId || user?.bankAccountNumber || "Direct Bank Deposit"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#2563eb", marginTop: "4px", fontWeight: 600 }}>
            ✅ Verified Bank / UPI Account
          </div>
        </div>
      </div>

      {/* ─── PAST BI-WEEKLY SETTLEMENTS TABLE ─── */}
      <div style={{ marginTop: "2rem" }}>
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
