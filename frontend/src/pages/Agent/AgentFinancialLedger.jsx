import React, { useState, useEffect } from "react";
import { Wallet, TrendingUp, Package, Clock, MapPin, CheckCircle, Calendar, ShieldCheck, AlertCircle, ArrowUpRight, DollarSign } from "lucide-react";
import { useLang } from "../../context/LangContext";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/api";

export default function AgentFinancialLedger({ deliveries = [], onOpenRemit, onOpenAgreement }) {
  const { t } = useLang();
  const { user } = useAuth();
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchSettlements();
  }, [user]);

  const fetchSettlements = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await API.get(`/delivery/settlements/${user._id}`);
      setSettlementData(res.data);
    } catch (err) {
      console.error("Failed to load agent settlements", err);
    } finally {
      setLoading(false);
    }
  };

  const nextPayoutDate = settlementData?.nextPayoutDate 
    ? new Date(settlementData.nextPayoutDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "Next Bi-Weekly Cutoff";

  const daysRemaining = settlementData?.daysRemainingInCycle ?? 14;
  const pastSettlements = settlementData?.pastSettlements || [];
  const isPayoutLocked = settlementData?.isPayoutLocked || (!user?.agentAgreementSigned || user?.agentVerificationStatus !== "verified");
  const escrowBalance = settlementData?.escrowBalance ?? (user?.escrowBalance || 0);

  return (
    <div className="glass-card" style={{ padding: "1.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
            <Wallet size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.4rem" }}>Agent Earnings & Settlement Ledger</h2>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Bi-weekly logistics earnings, COD collections, and Escrow payout safeguards.
            </p>
          </div>
        </div>

        {settlementData?.cashInHand > 0 && onOpenRemit && (
          <button
            onClick={onOpenRemit}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "linear-gradient(135deg, #e11d48, #be123c)", color: "white",
              padding: "0.65rem 1.25rem", borderRadius: "100px", border: "none",
              fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
              boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
            }}
          >
            <ArrowUpRight size={16} /> Remit COD Cash (₹{settlementData.cashInHand})
          </button>
        )}
      </div>

      {/* ─── ESCROW PAYOUT LOCK WARNING CALLOUT ─── */}
      {isPayoutLocked && (
        <div style={{
          background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
          borderRadius: "14px", border: "1.5px solid #f97316",
          padding: "1.1rem 1.35rem", marginBottom: "1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AlertCircle size={24} color="#ea580c" />
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#9a3412" }}>
                🔒 Escrow Settlement Lock Active ({settlementData?.lockReason || "Digital Agreement or Verification Pending"})
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#c2410c" }}>
                Earnings remain safely locked in Escrow until identity verification and Digital Agent Agreement signing are completed.
              </p>
            </div>
          </div>

          {!user?.agentAgreementSigned && onOpenAgreement && (
            <button
              onClick={onOpenAgreement}
              style={{
                background: "#ea580c", color: "white", border: "none",
                padding: "0.6rem 1rem", borderRadius: "10px", fontWeight: 800,
                fontSize: "0.82rem", cursor: "pointer", boxShadow: "0 2px 8px rgba(234, 88, 12, 0.3)"
              }}
            >
              📜 Sign Agreement Now
            </button>
          )}
        </div>
      )}

      {/* ─── 2-WEEK SETTLEMENT POLICY BANNER ─── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
        borderRadius: "16px", padding: "1.25rem 1.5rem", color: "white",
        marginBottom: "1.75rem", boxShadow: "0 8px 20px rgba(30, 58, 138, 0.25)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Calendar size={28} style={{ color: "#93c5fd" }} />
            <div>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1px", color: "#bfdbfe", fontWeight: 700 }}>
                Official Settlement Cycle
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800 }}>
                14-Day Bi-Weekly Payout Schedule
              </div>
              <p style={{ margin: "3px 0 0 0", fontSize: "0.82rem", color: "#dbeafe" }}>
                🔒 All delivery earnings are securely batched and disbursed every 2 weeks. (No daily settlements).
              </p>
            </div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(6px)",
            padding: "0.6rem 1.2rem", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.2)",
            textAlign: "right"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#bfdbfe", fontWeight: 600 }}>NEXT SETTLEMENT DATE</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>{nextPayoutDate}</div>
            <div style={{ fontSize: "0.72rem", color: "#86efac", fontWeight: 700 }}>
              ⏱️ {daysRemaining} days remaining in cycle
            </div>
          </div>
        </div>
      </div>

      {/* ─── SUMMARY STATS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {/* Escrow Locked Balance */}
        <div style={{ background: escrowBalance > 0 ? "#fff7ed" : "white", padding: "1.25rem", borderRadius: "14px", border: escrowBalance > 0 ? "1.5px solid #ffdbb5" : "1.5px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: escrowBalance > 0 ? "#ea580c" : "#64748b", fontWeight: 700 }}>ESCROW BALANCE (LOCKED)</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: escrowBalance > 0 ? "#ffedd5" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: escrowBalance > 0 ? "#c2410c" : "#1e293b" }}>
            ₹{escrowBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: escrowBalance > 0 ? "#ea580c" : "#64748b", marginTop: "4px", fontWeight: 600 }}>
            {escrowBalance > 0 ? "🔒 Unlocks upon agreement & verification" : "✅ 0 Escrow holds"}
          </div>
        </div>

        {/* Unsettled Wallet Balance */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>CURRENT WALLET BALANCE</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b" }}>
            ₹{(user?.walletBalance || settlementData?.unsettledWalletBalance || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#2563eb", marginTop: "4px", fontWeight: 600 }}>
            Ready for next bi-weekly payout batch
          </div>
        </div>

        {/* COD Cash in Hand */}
        <div style={{ background: (user?.cashInHand || settlementData?.cashInHand) > 0 ? "#fff1f2" : "white", padding: "1.25rem", borderRadius: "14px", border: (user?.cashInHand || settlementData?.cashInHand) > 0 ? "1.5px solid #fecdd3" : "1.5px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: (user?.cashInHand || settlementData?.cashInHand) > 0 ? "#be123c" : "#64748b", fontWeight: 700 }}>COD CASH IN HAND</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: (user?.cashInHand || settlementData?.cashInHand) > 0 ? "#ffe4e6" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#e11d48" }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: (user?.cashInHand || settlementData?.cashInHand) > 0 ? "#e11d48" : "#1e293b" }}>
            ₹{(user?.cashInHand || settlementData?.cashInHand || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: (user?.cashInHand || settlementData?.cashInHand) > 0 ? "#be123c" : "#64748b", marginTop: "4px", fontWeight: 600 }}>
            {(user?.cashInHand || settlementData?.cashInHand) > 0 ? "⚠️ Collected cash to be remitted to Admin" : "✅ No outstanding cash collection"}
          </div>
        </div>

        {/* Total Deliveries Completed */}
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "14px", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 700 }}>COMPLETED DELIVERIES</span>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#166534" }}>
            {deliveries.filter(d => d.status === "delivered").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#16a34a", marginTop: "4px", fontWeight: 600 }}>
            100% Verified OTP Deliveries
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
              Your accrued earnings will be processed in the upcoming bi-weekly settlement cycle ({nextPayoutDate}).
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
                      <strong style={{ fontFamily: "monospace", color: "#2563eb" }}>{s.transactionReference}</strong>
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
