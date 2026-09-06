import React from "react";
import { X, ShieldCheck, Leaf, Tractor, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function CompareModal({ crops, onClose }) {
  if (!crops || crops.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex",
      alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: "white", padding: "2rem", borderRadius: "12px", width: "90%",
          maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto", position: "relative",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
        }}
      >
        <button 
          onClick={onClose}
          style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }}
        >
          <X size={24} color="#666" />
        </button>

        <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>
          <Activity color="var(--primary)" style={{ display: "inline-block", marginRight: "0.5rem", verticalAlign: "middle" }} />
          Product Comparison
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr>
                <th style={{ padding: "1rem", borderBottom: "2px solid #eee", textAlign: "left", width: "20%" }}>Feature</th>
                {crops.map(c => (
                  <th key={c._id} style={{ padding: "1rem", borderBottom: "2px solid #eee", textAlign: "center", width: `${80/crops.length}%` }}>
                    <div style={{ width: "80px", height: "80px", margin: "0 auto 0.5rem", borderRadius: "8px", overflow: "hidden" }}>
                      <img 
                        src={c.image ? (c.image.startsWith("http") ? c.image : `http://localhost:5000${c.image}`) : "/placeholder.png"} 
                        alt={c.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ fontSize: "1.1rem", color: "var(--text-dark)", fontWeight: "bold" }}>{c.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price */}
              <tr>
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee", fontWeight: "bold", color: "#666" }}>Price</td>
                {crops.map(c => (
                  <td key={c._id} style={{ padding: "1rem", borderBottom: "1px solid #eee", textAlign: "center", fontSize: "1.1rem", color: "var(--green-deep)", fontWeight: "bold" }}>
                    ₹{c.price}/{c.unit}
                  </td>
                ))}
              </tr>
              {/* Organic Status */}
              <tr>
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee", fontWeight: "bold", color: "#666" }}>Organic</td>
                {crops.map(c => (
                  <td key={c._id} style={{ padding: "1rem", borderBottom: "1px solid #eee", textAlign: "center" }}>
                    {c.isOrganic ? <span style={{ color: "var(--green-mid)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}><ShieldCheck size={16} /> Yes</span> : <span style={{ color: "#aaa" }}>No</span>}
                  </td>
                ))}
              </tr>
              {/* Pesticide Free */}
              <tr>
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee", fontWeight: "bold", color: "#666" }}>Pesticide Free</td>
                {crops.map(c => (
                  <td key={c._id} style={{ padding: "1rem", borderBottom: "1px solid #eee", textAlign: "center" }}>
                    {c.isPesticideFree || c.isOrganic ? <span style={{ color: "var(--green-mid)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}><Leaf size={16} /> Yes</span> : <span style={{ color: "#aaa" }}>No</span>}
                  </td>
                ))}
              </tr>
              {/* Farmer Trust */}
              <tr>
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee", fontWeight: "bold", color: "#666" }}>Farmer Trust</td>
                {crops.map(c => (
                  <td key={c._id} style={{ padding: "1rem", borderBottom: "1px solid #eee", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                      <Tractor size={16} color="var(--primary)" />
                      {c.farmer?.name || "Unknown"}
                    </div>
                  </td>
                ))}
              </tr>
              {/* Location */}
              <tr>
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee", fontWeight: "bold", color: "#666" }}>Location</td>
                {crops.map(c => (
                  <td key={c._id} style={{ padding: "1rem", borderBottom: "1px solid #eee", textAlign: "center", fontSize: "0.9rem", color: "#555" }}>
                    {c.location || "N/A"}
                  </td>
                ))}
              </tr>
              {/* Quantity Available */}
              <tr>
                <td style={{ padding: "1rem", borderBottom: "1px solid #eee", fontWeight: "bold", color: "#666" }}>Stock Available</td>
                {crops.map(c => (
                  <td key={c._id} style={{ padding: "1rem", borderBottom: "1px solid #eee", textAlign: "center", color: c.quantity < 10 ? "#eab308" : "#22c55e" }}>
                    {c.quantity} {c.unit}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
