import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Snowflake, Thermometer, Droplets, ShieldCheck, Box, AlertTriangle, ArrowLeft, RefreshCw, Plus, CheckCircle } from "lucide-react";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";

export default function ColdStoragePortal() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [chambers, setChambers] = useState([
    { id: "Chamber A", temp: 3.2, targetTemp: 3.0, humidity: 88, capacityKg: 20000, occupiedKg: 14500, status: "Optimal", cropTypes: "Tomatoes, Leafy Greens, Bell Peppers" },
    { id: "Chamber B", temp: 11.5, targetTemp: 12.0, humidity: 75, capacityKg: 30000, occupiedKg: 18200, status: "Optimal", cropTypes: "Potatoes, Onions, Garlic" },
    { id: "Chamber C (Deep Freeze)", temp: -2.1, targetTemp: -2.0, humidity: 60, capacityKg: 15000, occupiedKg: 6800, status: "Optimal", cropTypes: "Pulp, Purees, Dairy" }
  ]);

  const [intakeRequests, setIntakeRequests] = useState([
    { id: "INT-891", farmer: "Srinivas Reddy", crop: "Naatu Tomatoes", quantity: 800, unit: "kg", days: 7, fee: 1400, status: "stored", entryDate: "2026-09-12" },
    { id: "INT-894", farmer: "Devender Chary", crop: "Bell Peppers (Capsicum)", quantity: 450, unit: "kg", days: 5, fee: 900, status: "pending_intake", entryDate: "2026-09-13" },
    { id: "INT-899", farmer: "Mallesh Goud", crop: "Banganapalli Mangoes", quantity: 1200, unit: "kg", days: 10, fee: 3600, status: "pending_intake", entryDate: "2026-09-13" }
  ]);

  const [msg, setMsg] = useState("");

  const handleApproveIntake = (id) => {
    setIntakeRequests(prev => prev.map(req => req.id === id ? { ...req, status: "stored" } : req));
    setMsg(`✅ Intake Request ${id} approved & allocated to Chamber!`);
    setTimeout(() => setMsg(""), 3500);
  };

  const totalCapacity = chambers.reduce((acc, c) => acc + c.capacityKg, 0);
  const totalOccupied = chambers.reduce((acc, c) => acc + c.occupiedKg, 0);
  const occupancyRate = Math.round((totalOccupied / totalCapacity) * 100);

  return (
    <div className="page-wrapper" style={{ padding: "1.5rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Header & Breadcrumbs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link to="/agent" style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
              ← Return to Agent Dashboard
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Cold Chain Logistics</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>❄️</span> Cold Storage Facility Agent Portal
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Managed Hub: {user?.location || "Regional Agritech Cold Vault #4"} • Temperature & Perishable Crop Holding
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button 
            type="button" 
            onClick={() => {
              setMsg("🔄 Telemetry sensors refreshed.");
              setTimeout(() => setMsg(""), 2000);
            }} 
            className="btn-secondary" 
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={15} /> Refresh Sensors
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success mb-3">{msg}</div>}

      {/* Facility Overview KPIs */}
      <div className="grid-4 mb-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1.5px solid #bfdbfe" }}>
          <span className="stat-icon">📦</span>
          <div className="stat-value" style={{ color: "#1d4ed8" }}>{occupancyRate}%</div>
          <div className="stat-label">Total Chamber Utilization ({totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()} kg)</div>
        </div>

        <div className="stat-card" style={{ background: "rgba(34, 197, 94, 0.08)", border: "1.5px solid #86efac" }}>
          <span className="stat-icon">🌡️</span>
          <div className="stat-value" style={{ color: "#166534" }}>3.2°C</div>
          <div className="stat-label">Chamber A Perishable Zone (Avg 88% Humidity)</div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-value">{intakeRequests.filter(r => r.status === "pending_intake").length}</div>
          <div className="stat-label">Pending Inbound Intake Requests</div>
        </div>

        <div className="stat-card" style={{ background: "rgba(234, 179, 8, 0.08)", border: "1.5px solid #fde047" }}>
          <span className="stat-icon">💵</span>
          <div className="stat-value" style={{ color: "#854d0e" }}>₹{intakeRequests.reduce((a, b) => a + b.fee, 0).toLocaleString()}</div>
          <div className="stat-label">Weekly Storage Revenue Generated</div>
        </div>
      </div>

      {/* Chamber Status Telemetry */}
      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", marginBottom: "1rem" }}>
        🏢 Multi-Zone Temperature & Humidity Chambers
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {chambers.map(ch => {
          const usedPct = Math.round((ch.occupiedKg / ch.capacityKg) * 100);
          return (
            <div key={ch.id} className="glass-card" style={{ padding: "1.25rem", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>{ch.id}</strong>
                <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {ch.status}
                </span>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
                <div style={{ flex: 1, background: "#f8fafc", padding: "0.65rem", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Live Temp</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0284c7" }}>{ch.temp}°C</div>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Target: {ch.targetTemp}°C</span>
                </div>
                <div style={{ flex: 1, background: "#f8fafc", padding: "0.65rem", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Humidity</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#16a34a" }}>{ch.humidity}%</div>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Condensation OK</span>
                </div>
              </div>

              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#64748b", marginBottom: "4px" }}>
                  <span>Capacity: {ch.occupiedKg.toLocaleString()} / {ch.capacityKg.toLocaleString()} kg</span>
                  <span><strong>{usedPct}%</strong></span>
                </div>
                <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${usedPct}%`, height: "100%", background: usedPct > 80 ? "#f97316" : "#22c55e" }}></div>
                </div>
              </div>

              <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
                🏷️ Suited For: {ch.cropTypes}
              </p>
            </div>
          );
        })}
      </div>

      {/* Inbound Intake Requests Table */}
      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", marginBottom: "1rem" }}>
        📥 Farmer Crop Storage & Holding Requests
      </h3>
      <div className="glass-card" style={{ padding: "1.25rem", borderRadius: "16px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
              <th style={{ padding: "0.75rem" }}>ID</th>
              <th style={{ padding: "0.75rem" }}>Farmer</th>
              <th style={{ padding: "0.75rem" }}>Produce</th>
              <th style={{ padding: "0.75rem" }}>Quantity</th>
              <th style={{ padding: "0.75rem" }}>Duration</th>
              <th style={{ padding: "0.75rem" }}>Fee</th>
              <th style={{ padding: "0.75rem" }}>Status</th>
              <th style={{ padding: "0.75rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {intakeRequests.map(req => (
              <tr key={req.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.75rem", fontWeight: 700, color: "#2563eb" }}>{req.id}</td>
                <td style={{ padding: "0.75rem" }}><strong>{req.farmer}</strong></td>
                <td style={{ padding: "0.75rem" }}>{req.crop}</td>
                <td style={{ padding: "0.75rem" }}>{req.quantity} {req.unit}</td>
                <td style={{ padding: "0.75rem" }}>{req.days} days</td>
                <td style={{ padding: "0.75rem", fontWeight: 700, color: "#15803d" }}>₹{req.fee}</td>
                <td style={{ padding: "0.75rem" }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700,
                    background: req.status === "stored" ? "#dcfce7" : "#fff7ed",
                    color: req.status === "stored" ? "#15803d" : "#c2410c"
                  }}>
                    {req.status === "stored" ? "Vault Stored" : "Pending Intake"}
                  </span>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {req.status === "pending_intake" ? (
                    <button
                      type="button"
                      onClick={() => handleApproveIntake(req.id)}
                      style={{
                        background: "#16a34a", color: "white", border: "none",
                        padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem",
                        fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      ✓ Approve Intake
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Active in Rack</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
