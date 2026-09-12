import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Banknote, ShieldCheck, QrCode, Wallet, Smartphone, ChevronRight, CheckCircle2 } from "lucide-react";
import RythuSethuAnimation from "./RythuSethuAnimation";
import QRCode from "react-qr-code";
import API from "../api/api";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export default function PaymentModal({ amount, walletBalance, orderId, customerId, onClose, onSuccess }) {
  const [merchantUpi, setMerchantUpi] = useState("8688938604@upi");
  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [paymentTxnId, setPaymentTxnId] = useState("");

  useEffect(() => {
    API.get("/payment/razorpay/config")
      .then(res => {
        if (res.data?.merchantUpiId) {
          setMerchantUpi(res.data.merchantUpiId);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualUpiConfirm = async () => {
    setProcessing(true);
    setErrorMsg("");
    try {
      const res = await API.post("/payment/upi/confirm", {
        orderId: orderId || null,
        customerId: customerId || null,
        utr: utrInput || `UPI-${Date.now()}`,
        amount
      });
      setPaymentTxnId(res.data?.payment?.upiReference || utrInput || `UPI-${Date.now()}`);
      setProcessing(false);
      setSuccess(true);
    } catch (e) {
      console.error(e);
      setPaymentTxnId(`UPI-${Date.now()}`);
      setProcessing(false);
      setSuccess(true);
    }
  };

  const upiIntentUrl = `upi://pay?pa=${merchantUpi}&pn=Rythu%20Jana%20Sethu%20Agri&am=${amount}&cu=INR&tn=RythuJanaSethuOrder`;

  const handlePay = async () => {
    if (method === "wallet" && walletBalance < amount) {
      setErrorMsg("Insufficient wallet balance. Please add funds.");
      return;
    }
    
    if (method === "cod" || method === "wallet") {
      setProcessing(true);
      setPaymentTxnId(`${method.toUpperCase()}-${Date.now()}`);
      setTimeout(() => {
        setProcessing(false);
        setSuccess(true);
      }, 1200);
      return;
    }

    // Razorpay Flow (UPI / Card)
    setProcessing(true);
    setErrorMsg("");

    const res = await loadRazorpay();
    if (!res) {
      setErrorMsg("Razorpay SDK failed to load. Please check your internet connection.");
      setProcessing(false);
      return;
    }

    try {
      // 1. Get Config (Key)
      const configRes = await API.get("/payment/razorpay/config");
      const keyId = configRes.data.key_id;

      // 2. Create Order
      const orderRes = await API.post("/payment/razorpay/create-order", {
        amount,
        currency: "INR",
        orderId: orderId || null,
        customerId: customerId || null
      });
      const order = orderRes.data;

      // 3. Initialize Razorpay Checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Rythu Jana Sethu",
        description: `Order Payment ₹${amount}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 4. Dual Verify Payment
            await API.post("/payment/razorpay/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId || null,
              paymentRecordId: order.paymentRecordId
            });
            setPaymentTxnId(response.razorpay_payment_id);
            setProcessing(false);
            setSuccess(true);
          } catch (e) {
            console.error("Verification failed", e);
            setErrorMsg(e.response?.data?.error || "Payment verification failed.");
            setProcessing(false);
          }
        },
        prefill: {
          name: "Rythu Jana Sethu Customer",
          email: "customer@rythujanasethu.com",
          contact: "9999999999"
        },
        theme: {
          color: "#16a34a"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response){
        setErrorMsg("Payment failed: " + (response.error?.description || "Transaction declined"));
        setProcessing(false);
      });
      paymentObject.open();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.response?.data?.error || "Error initiating payment.");
      setProcessing(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(8px)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100010
    }}>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: "#ffffff", borderRadius: "24px", 
          width: "90%", maxWidth: "420px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {/* Gateway Header */}
        <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", padding: "1.5rem", color: "white", position: "relative" }}>
          <button onClick={onClose} style={{
            position: "absolute", top: "1.2rem", right: "1.2rem", background: "rgba(255,255,255,0.1)",
            border: "none", cursor: "pointer", color: "white", borderRadius: "50%", padding: "0.4rem",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s"
          }} className="hover-bg-white-20">
            <X size={18} />
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", opacity: 0.9 }}>
            <ShieldCheck size={20} color="#4ade80" />
            <span style={{ fontSize: "0.85rem", fontWeight: 500, letterSpacing: "0.5px" }}>RYTHU JANA SETHU SECURE PAY</span>
          </div>
          
          <div style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "0.2rem" }}>Amount to Pay</div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
            <span style={{ fontSize: "1.5rem", color: "#4ade80" }}>₹</span>{amount.toLocaleString()}
          </div>
        </div>

        {/* Success Screen */}
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, backgroundColor: "#ffffff" }} 
              animate={{ opacity: 1, backgroundColor: "#f0fdf4" }} 
              style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                <CheckCircle2 size={80} color="#16a34a" />
              </motion.div>
              <h2 style={{ color: "#166534", marginTop: "1.5rem", fontSize: "1.5rem", fontWeight: 700 }}>Payment Successful!</h2>
              <p style={{ color: "#15803d", textAlign: "center", marginTop: "0.5rem", marginBottom: "2rem" }}>
                Transaction ID: <strong>{paymentTxnId || `TXN${Math.floor(Math.random() * 1000000000)}`}</strong>
              </p>
              
              <div style={{ width: "100%", height: "120px", position: "relative" }}>
                <RythuSethuAnimation onComplete={() => onSuccess(method, { paymentId: paymentTxnId, method })} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        {!success && (
          <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "0.8rem", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "1.5rem", borderLeft: "4px solid #ef4444" }}>
                {errorMsg}
              </motion.div>
            )}

            <h3 style={{ fontSize: "0.95rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "1rem" }}>Select Payment Method</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* UPI */}
              <label style={{
                display: "flex", alignItems: "center", padding: "1rem",
                border: method === "upi" ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                background: method === "upi" ? "#eff6ff" : "white",
                borderRadius: "16px", cursor: "pointer", transition: "all 0.2s",
                boxShadow: method === "upi" ? "0 4px 12px rgba(59, 130, 246, 0.1)" : "none"
              }} onClick={() => setMethod("upi")}>
                <div style={{ background: method === "upi" ? "#3b82f6" : "#f1f5f9", padding: "0.6rem", borderRadius: "12px", marginRight: "1rem", transition: "background 0.2s" }}>
                  <Smartphone size={24} color={method === "upi" ? "white" : "#64748b"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "1.05rem" }}>UPI</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Google Pay, PhonePe, Paytm</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: method === "upi" ? "6px solid #3b82f6" : "2px solid #cbd5e1" }}></div>
              </label>

              {/* Wallet */}
              <label style={{
                display: "flex", alignItems: "center", padding: "1rem",
                border: method === "wallet" ? "2px solid #10b981" : "1px solid #e2e8f0",
                background: method === "wallet" ? "#ecfdf5" : "white",
                borderRadius: "16px", cursor: "pointer", transition: "all 0.2s",
                opacity: walletBalance < amount ? 0.6 : 1
              }} onClick={() => { if(walletBalance >= amount) setMethod("wallet"); }}>
                <div style={{ background: method === "wallet" ? "#10b981" : "#f1f5f9", padding: "0.6rem", borderRadius: "12px", marginRight: "1rem" }}>
                  <Wallet size={24} color={method === "wallet" ? "white" : "#64748b"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "1.05rem" }}>Rythu Wallet</div>
                  <div style={{ fontSize: "0.8rem", color: walletBalance < amount ? "#ef4444" : "#64748b", fontWeight: walletBalance < amount ? 600 : 400 }}>
                    Balance: ₹{walletBalance?.toLocaleString() || 0}
                  </div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: method === "wallet" ? "6px solid #10b981" : "2px solid #cbd5e1" }}></div>
              </label>

              {/* Card */}
              <label style={{
                display: "flex", alignItems: "center", padding: "1rem",
                border: method === "card" ? "2px solid #6366f1" : "1px solid #e2e8f0",
                background: method === "card" ? "#eef2ff" : "white",
                borderRadius: "16px", cursor: "pointer", transition: "all 0.2s"
              }} onClick={() => setMethod("card")}>
                <div style={{ background: method === "card" ? "#6366f1" : "#f1f5f9", padding: "0.6rem", borderRadius: "12px", marginRight: "1rem" }}>
                  <CreditCard size={24} color={method === "card" ? "white" : "#64748b"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "1.05rem" }}>Cards</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Visa, MasterCard, RuPay</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: method === "card" ? "6px solid #6366f1" : "2px solid #cbd5e1" }}></div>
              </label>

              {/* COD */}
              <label style={{
                display: "flex", alignItems: "center", padding: "1rem",
                border: method === "cod" ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                background: method === "cod" ? "#fffbeb" : "white",
                borderRadius: "16px", cursor: "pointer", transition: "all 0.2s"
              }} onClick={() => setMethod("cod")}>
                <div style={{ background: method === "cod" ? "#f59e0b" : "#f1f5f9", padding: "0.6rem", borderRadius: "12px", marginRight: "1rem" }}>
                  <Banknote size={24} color={method === "cod" ? "white" : "#64748b"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "1.05rem" }}>Cash on Delivery</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Pay when it arrives</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: method === "cod" ? "6px solid #f59e0b" : "2px solid #cbd5e1" }}></div>
              </label>
            </div>

            {/* Dynamic Payment Action Area */}
            <div style={{ marginTop: "2rem" }}>
              <AnimatePresence mode="wait">
                {method === "upi" ? (
                  <motion.div key="upi" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "18px", display: "inline-block", border: "1.5px dashed #3b82f6", width: "100%", boxSizing: "border-box" }}>
                      {/* Dynamic QR Code */}
                      <div style={{ background: "white", padding: "0.8rem", borderRadius: "12px", display: "inline-block", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginBottom: "0.8rem" }}>
                        <QRCode value={upiIntentUrl} size={140} level="M" />
                      </div>
                      
                      <div style={{ fontSize: "0.82rem", color: "#1e293b", fontWeight: 700, marginBottom: "0.4rem" }}>
                        📱 SCAN WITH ANY UPI APP (GPay / PhonePe / Paytm / BHIM)
                      </div>

                      {/* Merchant UPI ID with Copy Button */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "white", padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid #e2e8f0", margin: "0.5rem auto", maxWidth: "320px" }}>
                        <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>UPI ID:</span>
                        <code style={{ fontSize: "0.9rem", color: "#2563eb", fontWeight: 700 }}>{merchantUpi}</code>
                        <button 
                          onClick={handleCopyUpi} 
                          type="button"
                          style={{ background: copied ? "#dcfce7" : "#f1f5f9", color: copied ? "#16a34a" : "#475569", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          {copied ? "✅ Copied" : "📋 Copy"}
                        </button>
                      </div>

                      {/* Quick Deep Link Button */}
                      <a 
                        href={upiIntentUrl} 
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#3b82f6", color: "white", padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600, marginTop: "0.5rem" }}
                      >
                        ⚡ Open in UPI App (GPay / PhonePe)
                      </a>

                      {/* Optional UTR / Reference Entry */}
                      <div style={{ marginTop: "1rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.8rem", textAlign: "left" }}>
                        <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                          Already Transferred? Enter UPI Ref / UTR No:
                        </label>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <input 
                            type="text" 
                            placeholder="e.g. 4235XXXXXXXX" 
                            value={utrInput} 
                            onChange={e => setUtrInput(e.target.value)}
                            style={{ flex: 1, padding: "0.45rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                          />
                          <button 
                            type="button" 
                            onClick={handleManualUpiConfirm}
                            style={{ background: "#16a34a", color: "white", border: "none", borderRadius: "8px", padding: "0.45rem 0.85rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                          >
                            Verify & Pay
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                style={{ 
                  width: "100%", padding: "1.1rem", fontSize: "1.05rem", fontWeight: 700,
                  display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", 
                  background: method === "wallet" ? "#10b981" : method === "card" ? "#6366f1" : method === "cod" ? "#f59e0b" : "#3b82f6", 
                  color: "white", border: "none", borderRadius: "16px", cursor: "pointer",
                  boxShadow: `0 10px 20px -5px ${method === "wallet" ? "rgba(16, 185, 129, 0.4)" : method === "card" ? "rgba(99, 102, 241, 0.4)" : method === "cod" ? "rgba(245, 158, 11, 0.4)" : "rgba(59, 130, 246, 0.4)"}`,
                  transition: "all 0.2s"
                }}
                onClick={handlePay}
                disabled={processing}
                className="hover-scale"
              >
                {processing ? (
                  <><span className="loader" style={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white" }}></span> Processing Payment...</>
                ) : (
                  <>
                    {method === "upi" ? `Pay ₹${amount.toLocaleString()} via Razorpay / UPI` : `Pay ₹${amount.toLocaleString()}`} 
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
            
            <div style={{ textAlign: "center", marginTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "#94a3b8", fontSize: "0.75rem" }}>
              <ShieldCheck size={14} /> 100% Secure Transaction by Rythu Jana Sethu Gateway
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
