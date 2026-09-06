import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ShieldCheck, Heart, User, Send, X } from "lucide-react";
import API from "../api/api";

const StarRating = ({ label, value, onChange }) => (
  <div style={{ marginBottom: "1rem" }}>
    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem" }}>{label}</div>
    <div style={{ display: "flex", gap: "0.4rem" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={24}
          onClick={() => onChange(star)}
          fill={value >= star ? "#f59e0b" : "none"}
          color={value >= star ? "#f59e0b" : "#cbd5e1"}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          className="hover-scale"
        />
      ))}
    </div>
  </div>
);

export default function ReviewModal({ orderId, onClose, onSubmitted }) {
  const [agentRating, setAgentRating] = useState(0);
  const [farmerRating, setFarmerRating] = useState(0);
  const [platformRating, setPlatformRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (agentRating === 0 || farmerRating === 0 || platformRating === 0) {
      alert("Please rate all categories to help us improve!");
      return;
    }

    setSubmitting(true);
    try {
      const avg = (agentRating + farmerRating + platformRating) / 3;
      let sentiment = "Neutral";
      if (avg >= 4) sentiment = "Positive";
      if (avg <= 2) sentiment = "Negative";

      await API.post(`/orders/${orderId}/review`, {
        agentRating,
        farmerRating,
        platformRating,
        reviewText,
        sentimentScore: avg,
        reviewSentiment: sentiment
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        if (onClose) onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100050,
      background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          background: "white", borderRadius: "24px", width: "100%", maxWidth: "450px",
          padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative"
        }}
      >
        <button onClick={onClose} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
          <X size={20} />
        </button>

        {success ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ width: 60, height: 60, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Heart size={30} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: "1.4rem", color: "#16a34a", fontWeight: 800 }}>Thank You!</h3>
            <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Your feedback helps farmers and agents grow.</p>
          </motion.div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <ShieldCheck size={40} color="#3b82f6" style={{ margin: "0 auto 0.5rem" }} />
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>Rate Your Experience</h2>
              <p style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "0.3rem" }}>How was your delivery and product?</p>
            </div>

            <StarRating label="🛵 Rate the Delivery Agent" value={agentRating} onChange={setAgentRating} />
            <StarRating label="🌾 Rate the Farmer's Crop Quality" value={farmerRating} onChange={setFarmerRating} />
            <StarRating label="🌟 Rate Rythu Sethu Platform" value={platformRating} onChange={setPlatformRating} />

            <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b", marginBottom: "0.4rem" }}>Additional Comments (Optional)</div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us what you loved..."
                style={{ width: "100%", padding: "0.8rem", borderRadius: "12px", border: "1px solid #cbd5e1", minHeight: "80px", fontFamily: "inherit", fontSize: "0.9rem", resize: "none" }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%", padding: "1rem", borderRadius: "16px", background: "#3b82f6", color: "white",
                border: "none", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? "Submitting..." : <><Send size={18} /> Submit Review</>}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
