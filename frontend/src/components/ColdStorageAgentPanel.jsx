import { useState } from "react";
import { Thermometer, Droplets, Wind, ShieldAlert, Snowflake, Package, CheckCircle2, TrendingUp, RefreshCw, AlertTriangle, ArrowUpRight, ShieldCheck } from "lucide-react";
import API from "../api/api";

const INITIAL_VAULT_BATCHES = [
  {
    id: "vault_1",
    farmerName: "Ramesh Reddy",
    cropName: "Banganapalli Mangoes",
    quantityTons: 45,
    entryDate: "2026-09-01",
    maxStorageDays: 30,
    daysStored: 12,
    tempZone: "Chilled (4°C)",
    storageFeePerTonDay: 25,
    totalAccruedFee: 13500,
    status: "Optimal Freshness",
    qualityGrade: "Grade-A Export"
  },
  {
    id: "vault_2",
    farmerName: "Lakshmi Narayana",
    cropName: "Hybrid Red Tomatoes",
    quantityTons: 30,
    entryDate: "2026-09-08",
    maxStorageDays: 14,
    daysStored: 5,
    tempZone: "Chilled (2.5°C)",
    storageFeePerTonDay: 20,
    totalAccruedFee: 3000,
    status: "Optimal Freshness",
    qualityGrade: "Grade-A Premium"
  },
  {
    id: "vault_3",
    farmerName: "Srinivas Rao",
    cropName: "Nashik Red Onions",
    quantityTons: 120,
    entryDate: "2026-08-15",
    maxStorageDays: 90,
    daysStored: 29,
    tempZone: "Controlled Atmosphere (10°C)",
    storageFeePerTonDay: 15,
    totalAccruedFee: 52200,
    status: "Stable Stock",
    qualityGrade: "Commercial Grade"
  },
  {
    id: "vault_4",
    farmerName: "Venkat Ramana",
    cropName: "Fresh Spinach & Palak",
    quantityTons: 15,
    entryDate: "2026-09-10",
    maxStorageDays: 7,
    daysStored: 6,
    tempZone: "Deep Chilled (1°C)",
    storageFeePerTonDay: 35,
    totalAccruedFee: 3150,
    status: "Near Expiry Alert",
    qualityGrade: "Fresh Leafy"
  }
];

export default function ColdStorageAgentPanel({ user, onUpdateTelemetry }) {
  const [targetTemp, setTargetTemp] = useState(user?.coldStorageTempCelsius || 3.5);
  const [humidity, setHumidity] = useState(user?.coldStorageHumidityPct || 85);
  const [ethyleneScrubber, setEthyleneScrubber] = useState(true);
  const [vaultBatches, setVaultBatches] = useState(INITIAL_VAULT_BATCHES);
  const [totalCapacityTons] = useState(user?.coldStorageCapacityTons || 500);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const totalOccupiedTons = vaultBatches.reduce((sum, b) => sum + b.quantityTons, 0);
  const availableSpaceTons = totalCapacityTons - totalOccupiedTons;
  const utilizationPct = Math.round((totalOccupiedTons / totalCapacityTons) * 100);

  const getTempZoneLabel = (temp) => {
    if (temp <= -10) return { label: "❄️ Deep Freeze (Meat/Dairy/Ice Cream)", color: "#38bdf8" };
    if (temp <= 4) return { label: "🥬 Chilled Fresh (Fruits & Leafy Veggies)", color: "#4ade80" };
    if (temp <= 12) return { label: "🧅 Controlled Atmosphere (Onions/Apples/Potatoes)", color: "var(--yellow-wheat)" };
    return { label: "⚠️ Ambient Warning (Risk of Perishable Spoilage)", color: "#f87171" };
  };

  const currentZone = getTempZoneLabel(targetTemp);

  const handleApplyTelemetry = async () => {
    try {
      setMsg({ type: "info", text: "Updating Cold Storage Telemetry..." });
      // Update local storage or user profile
      if (onUpdateTelemetry) {
        onUpdateTelemetry({ temp: targetTemp, humidity, ethyleneScrubber });
      }
      setMsg({ type: "success", text: `✅ Cold Storage Vault Telemetry calibrated: ${targetTemp}°C @ ${humidity}% Relative Humidity.` });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to calibrate cold storage telemetry." });
    }
  };

  const handleClearanceDiscount = (batchId, cropName) => {
    if (window.confirm(`Initiate 30% End-of-Day Cold Storage Clearance Sale for ${cropName}? This will list the stock on Marketplace to clear space before expiry.`)) {
      setVaultBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: "Clearance Initiated (30% OFF)" } : b));
      setMsg({ type: "success", text: `⚡ ${cropName} transferred to Cold Storage Clearance Marketplace!` });
    }
  };

  return (
    <div style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "16px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            ❄️ Cold Storage Warehouse & Climate Control Console
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "4px 0 0 0" }}>
            Warehouse: <strong>{user?.coldStorageName || "RythuJanaSethu Central Cold Storage Vault #1"}</strong> ({user?.location || "Hyderabad Suburb"})
          </p>
        </div>

        <div style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "100px", padding: "0.4rem 1rem", color: "#38bdf8", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
          <Snowflake size={16} /> Cold Chain Agent Active
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type} mb-3`}>{msg.text}</div>}

      {/* Top Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        
        {/* Capacity Gauge */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Vault Capacity</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginTop: "2px" }}>
            {totalOccupiedTons} / {totalCapacityTons} MT
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", marginTop: "8px", overflow: "hidden" }}>
            <div style={{ width: `${utilizationPct}%`, height: "100%", background: utilizationPct > 85 ? "#f87171" : "#38bdf8", borderRadius: "4px" }}></div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {utilizationPct}% Occupied ({availableSpaceTons} MT Free)
          </div>
        </div>

        {/* Live Temperature */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Vault Climate Temp</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#38bdf8", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Thermometer size={20} /> {targetTemp}°C
          </div>
          <div style={{ fontSize: "0.72rem", color: currentZone.color, fontWeight: 600, marginTop: "4px" }}>
            {currentZone.label}
          </div>
        </div>

        {/* Relative Humidity & Ethylene */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Humidity & Air Quality</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4ade80", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Droplets size={20} /> {humidity}% RH
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Ethylene Scrubber: <strong style={{ color: ethyleneScrubber ? "#4ade80" : "#f87171" }}>{ethyleneScrubber ? "ON (Active)" : "OFF"}</strong>
          </div>
        </div>

        {/* Total Accrued Storage Revenue */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Storage Receipts Revenue</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--yellow-wheat)", marginTop: "2px" }}>
            ₹{vaultBatches.reduce((acc, b) => acc + b.totalAccruedFee, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Across {vaultBatches.length} Stored Farmer Batches
          </div>
        </div>

      </div>

      {/* Telemetry Control Sliders */}
      <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h4 style={{ fontSize: "1rem", color: "white", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "6px" }}>
          ⚙️ Vault Climate Telemetry Calibration
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
          
          {/* Temperature Slider */}
          <div>
            <label style={{ fontSize: "0.83rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Target Vault Temperature:</span>
              <strong style={{ color: "#38bdf8" }}>{targetTemp}°C</strong>
            </label>
            <input
              type="range"
              min="-15"
              max="15"
              step="0.5"
              value={targetTemp}
              onChange={e => setTargetTemp(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
              <span>-15°C (Deep Freeze)</span>
              <span>0°C (Chilled)</span>
              <span>15°C (Ambient)</span>
            </div>
          </div>

          {/* Humidity Slider */}
          <div>
            <label style={{ fontSize: "0.83rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span>Relative Humidity (RH %):</span>
              <strong style={{ color: "#4ade80" }}>{humidity}%</strong>
            </label>
            <input
              type="range"
              min="50"
              max="98"
              step="1"
              value={humidity}
              onChange={e => setHumidity(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "#4ade80", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
              <span>50% (Dry)</span>
              <span>85% (Optimal)</span>
              <span>98% (Saturated)</span>
            </div>
          </div>

        </div>

        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.83rem", color: "white" }}>
            <input type="checkbox" checked={ethyleneScrubber} onChange={e => setEthyleneScrubber(e.target.checked)} style={{ width: 16, height: 16 }} />
            <span>Enable Ethylene Gas Scrubber (Prevents premature fruit ripening)</span>
          </label>

          <button
            type="button"
            className="btn-primary"
            onClick={handleApplyTelemetry}
            style={{ width: "auto", padding: "0.45rem 1.2rem", fontSize: "0.85rem" }}
          >
            Apply Climate Settings
          </button>
        </div>
      </div>

      {/* Stored Batches Table */}
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "1rem" }}>
          📦 Active Stored Farmer Crop Batches
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {vaultBatches.map(batch => (
            <div
              key={batch.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: batch.daysStored / batch.maxStorageDays > 0.8 ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "1rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <div>
                  <strong style={{ fontSize: "1rem", color: "white" }}>{batch.cropName}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                    by {batch.farmerName}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "100px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: batch.daysStored / batch.maxStorageDays > 0.8 ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.15)",
                    color: batch.daysStored / batch.maxStorageDays > 0.8 ? "#f87171" : "#4ade80"
                  }}>
                    {batch.status}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "8px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "0.8rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Batch Weight</span>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>{batch.quantityTons} Tons</div>
                </div>

                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Storage Days</span>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: batch.daysStored / batch.maxStorageDays > 0.8 ? "#f87171" : "var(--yellow-wheat)" }}>
                    {batch.daysStored} / {batch.maxStorageDays} days
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Temp Zone</span>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#38bdf8" }}>{batch.tempZone}</div>
                </div>

                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Accrued Storage Fee</span>
                  <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--green-light)" }}>₹{batch.totalAccruedFee.toLocaleString()}</div>
                </div>
              </div>

              {/* Action Button */}
              {batch.daysStored / batch.maxStorageDays > 0.7 && !batch.status.includes("Clearance") && (
                <button
                  type="button"
                  onClick={() => handleClearanceDiscount(batch.id, batch.cropName)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    borderRadius: "6px",
                    border: "none",
                    background: "rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  ⚡ Initiate 30% Clearance Discount Sale on Marketplace
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
