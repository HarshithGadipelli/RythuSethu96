import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Activity, Truck, Leaf, ShieldCheck, Plus, RefreshCw, CheckCircle, Droplets, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";

export default function BiogasAgentPortal() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  // Digester Telemetry
  const [digesters, setDigesters] = useState([
    {
      id: "Anaerobic Digester Alpha",
      pressureBar: 1.85,
      targetPressure: 1.80,
      methanePurity: 68.4, // % CH4
      tempC: 37.5, // Mesophilic
      capacityTons: 15,
      activeLoadTons: 11.2,
      phLevel: 7.2,
      status: "Optimal Methanation",
      wasteSource: "Bovine Manure & Agri-Stubble"
    },
    {
      id: "Thermophilic Methanator Beta",
      pressureBar: 2.10,
      targetPressure: 2.00,
      methanePurity: 72.1,
      tempC: 52.0, // Thermophilic
      capacityTons: 25,
      activeLoadTons: 19.8,
      phLevel: 7.4,
      status: "High Output",
      wasteSource: "Mandi Vegetable Waste & Fruit Scraps"
    },
    {
      id: "Bio-Slurry Enrichment Tank #3",
      pressureBar: 1.05,
      targetPressure: 1.00,
      methanePurity: 22.0,
      tempC: 31.0,
      capacityTons: 10,
      activeLoadTons: 8.5,
      phLevel: 6.9,
      status: "Compost Maturation",
      wasteSource: "Digested Liquid Fertilizer"
    }
  ]);

  // Waste Inflow Collections & Requests
  const [wasteLogs, setWasteLogs] = useState([
    {
      id: "BIO-1029",
      farmerName: "B. Narsimha Reddy",
      village: "Thimmapur",
      wasteType: "Dry Paddy Straw & Maize Stalks",
      weightKg: 1400,
      carbonCreditsEarned: 18,
      incentiveAmt: 2100,
      status: "collected",
      intakeDate: "2026-09-12"
    },
    {
      id: "BIO-1034",
      farmerName: "G. Venkateswarlu",
      village: "Kondapur",
      wasteType: "Dairy Cow Dung Slurry",
      weightKg: 2200,
      carbonCreditsEarned: 26,
      incentiveAmt: 3300,
      status: "pending_pickup",
      intakeDate: "2026-09-13"
    },
    {
      id: "BIO-1041",
      farmerName: "M. Yadaiah",
      village: "Gudur",
      wasteType: "Mandi Vegetable Biomass & Spoiled Produce",
      weightKg: 950,
      carbonCreditsEarned: 12,
      incentiveAmt: 1425,
      status: "in_transit",
      intakeDate: "2026-09-13"
    }
  ]);

  // Fertilizer Output Dispatch Orders
  const [fertilizerDispatches, setFertilizerDispatches] = useState([
    {
      id: "SLURRY-401",
      buyer: "Kavitha Natural Farms",
      product: "Enriched Liquid Bio-Slurry (NPK Rich)",
      quantityLtrs: 500,
      orderValue: 4000,
      status: "Dispatched",
      destination: "Alair Mandi"
    },
    {
      id: "COMPOST-408",
      buyer: "Sanjeevaiah Organic Cluster",
      product: "Solid Bio-Compost Granules (50kg bags)",
      quantityBags: 30,
      orderValue: 7500,
      status: "Processing",
      destination: "Jangaon Rural"
    }
  ]);

  const [msg, setMsg] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({
    farmerName: "",
    village: "",
    wasteType: "Dry Paddy Straw & Maize Stalks",
    weightKg: "",
    incentiveAmt: ""
  });

  const handleUpdateStatus = (id, newStatus) => {
    setWasteLogs(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    setMsg(`✅ Waste intake #${id} updated to "${newStatus.replace('_', ' ')}"!`);
    setTimeout(() => setMsg(""), 3500);
  };

  const handleCreateWasteLog = (e) => {
    e.preventDefault();
    if (!newLog.farmerName || !newLog.weightKg) {
      alert("Please fill in the farmer name and waste weight!");
      return;
    }
    const weight = parseFloat(newLog.weightKg) || 0;
    const incentive = parseFloat(newLog.incentiveAmt) || Math.round(weight * 1.5);
    const credits = Math.round(weight * 0.012);

    const logEntry = {
      id: `BIO-${Math.floor(1000 + Math.random() * 9000)}`,
      farmerName: newLog.farmerName,
      village: newLog.village || "Local Cluster",
      wasteType: newLog.wasteType,
      weightKg: weight,
      carbonCreditsEarned: credits,
      incentiveAmt: incentive,
      status: "pending_pickup",
      intakeDate: new Date().toISOString().split("T")[0]
    };

    setWasteLogs([logEntry, ...wasteLogs]);
    setShowLogModal(false);
    setNewLog({ farmerName: "", village: "", wasteType: "Dry Paddy Straw & Maize Stalks", weightKg: "", incentiveAmt: "" });
    setMsg(`✅ Successfully scheduled waste collection #${logEntry.id}!`);
    setTimeout(() => setMsg(""), 4000);
  };

  const totalWasteProcessedKg = wasteLogs.reduce((sum, item) => sum + item.weightKg, 0);
  const totalIncentivesPaid = wasteLogs.reduce((sum, item) => sum + item.incentiveAmt, 0);
  const totalCarbonOffsetKg = Math.round(totalWasteProcessedKg * 1.45);

  return (
    <div className="page-wrapper" style={{ padding: "1.5rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Header & Breadcrumbs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link to="/agent" style={{ color: "#16a34a", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700 }}>
              ← Return to Agent Dashboard
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Renewable Circular Economy</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Flame style={{ color: "#ea580c" }} size={28} /> Bio-Gas & Organic Waste Management Hub
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Agent Facility: {user?.location || "Regional Agritech Bio-Energy Plant #2"} • Paddy Straw, Slurry & Waste-to-Energy Processing
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button 
            type="button" 
            onClick={() => {
              setMsg("🔄 Live bio-gas pressure & purity telemetry refreshed.");
              setTimeout(() => setMsg(""), 2500);
            }} 
            className="btn-secondary" 
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <RefreshCw size={15} /> Refresh Telemetry
          </button>
          <button 
            type="button" 
            onClick={() => setShowLogModal(true)} 
            className="btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#16a34a", borderColor: "#16a34a" }}
          >
            <Plus size={16} /> Schedule Biomass Intake
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1.25rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={18} /> {msg}
        </div>
      )}

      {/* KPI Overview Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Total Biomass Intake</span>
            <Leaf size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a" }}>
            {(totalWasteProcessedKg / 1000).toFixed(1)} <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#64748b" }}>Metric Tons</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>
            🌾 Preventing stubble burning & greenhouse leaks
          </p>
        </div>

        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Avg Methane Purity</span>
            <Flame size={20} color="#ea580c" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#ea580c" }}>
            70.2% <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>CH₄ gas</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>
            🔥 Grade-A Clean cooking & power generation fuel
          </p>
        </div>

        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Farmer Incentives</span>
            <Activity size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#2563eb" }}>
            ₹{totalIncentivesPaid.toLocaleString("en-IN")}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748b" }}>
            Direct earnings paid to local cultivators for waste
          </p>
        </div>

        <div style={{ background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Carbon Offset</span>
            <ShieldCheck size={20} color="#059669" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#059669" }}>
            {totalCarbonOffsetKg} <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>kg CO₂e</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#16a34a", fontWeight: 600 }}>
            🌱 Verified green ESG audit credits
          </p>
        </div>
      </div>

      {/* Main Grid: Digester Live Telemetry & Waste Intake Queue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Digester Monitoring Units */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={18} color="#ea580c" /> Active Digesters & Bio-Reactors
            </h3>
            <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, color: "#475569" }}>
              3 Live Vessels
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {digesters.map((dig, idx) => (
              <div key={idx} style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#fafafa" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>{dig.id}</h4>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{dig.wasteSource}</span>
                  </div>
                  <span style={{ 
                    fontSize: "0.75rem", 
                    fontWeight: 700, 
                    padding: "3px 8px", 
                    borderRadius: "12px", 
                    background: "#dcfce7", 
                    color: "#166534" 
                  }}>
                    ● {dig.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "0.5rem", background: "white", padding: "0.5rem", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase" }}>Pressure</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: dig.pressureBar > 2.0 ? "#ea580c" : "#0f172a" }}>
                      {dig.pressureBar} bar
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase" }}>Methane</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#16a34a" }}>
                      {dig.methanePurity}%
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase" }}>Temperature</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                      {dig.tempC}°C
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase" }}>pH Level</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#2563eb" }}>
                      {dig.phLevel}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "0.65rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginBottom: "3px" }}>
                    <span>Vessel Load Capacity</span>
                    <span style={{ fontWeight: 700 }}>{dig.activeLoadTons} / {dig.capacityTons} Tons ({Math.round((dig.activeLoadTons / dig.capacityTons) * 100)}%)</span>
                  </div>
                  <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ 
                      width: `${(dig.activeLoadTons / dig.capacityTons) * 100}%`, 
                      height: "100%", 
                      background: "#16a34a" 
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Organic Waste Pickup & Inflow Queue */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Truck size={18} color="#2563eb" /> Waste Intake & Farmer Collections
            </h3>
            <button 
              type="button" 
              onClick={() => setShowLogModal(true)}
              style={{ fontSize: "0.75rem", color: "#16a34a", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "3px 8px", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
            >
              + Add Inflow
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {wasteLogs.map((log) => (
              <div key={log.id} style={{ padding: "0.85rem", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#ffffff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>{log.farmerName}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>📍 {log.village} • {log.intakeDate}</div>
                  </div>
                  <span style={{ 
                    fontSize: "0.72rem", 
                    fontWeight: 800, 
                    padding: "2px 8px", 
                    borderRadius: "10px", 
                    textTransform: "capitalize",
                    background: log.status === "collected" ? "#dcfce7" : log.status === "in_transit" ? "#dbeafe" : "#fef3c7",
                    color: log.status === "collected" ? "#166534" : log.status === "in_transit" ? "#1d4ed8" : "#92400e"
                  }}>
                    {log.status.replace("_", " ")}
                  </span>
                </div>

                <div style={{ fontSize: "0.82rem", color: "#334155", background: "#f8fafc", padding: "0.4rem 0.6rem", borderRadius: "6px", margin: "0.4rem 0" }}>
                  <strong>{log.wasteType}</strong>: {log.weightKg} kg (Incentive: ₹{log.incentiveAmt} | +{log.carbonCreditsEarned} credits)
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.4rem" }}>
                  {log.status === "pending_pickup" && (
                    <button 
                      type="button" 
                      onClick={() => handleUpdateStatus(log.id, "in_transit")}
                      style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                    >
                      🚀 Dispatch Pickup Truck
                    </button>
                  )}
                  {log.status === "in_transit" && (
                    <button 
                      type="button" 
                      onClick={() => handleUpdateStatus(log.id, "collected")}
                      style={{ fontSize: "0.75rem", padding: "4px 10px", background: "#16a34a", color: "white", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}
                    >
                      ✅ Weigh & Unload at Digester
                    </button>
                  )}
                  {log.status === "collected" && (
                    <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>
                      ✔ Digestion active & compensation credited
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fertilizer & Slurry Output Dispatch Section */}
      <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Droplets size={18} color="#0284c7" /> Organic Bio-Slurry & Compost Dispatches
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              Enriched natural nutrient by-products dispatched to organic farmer cooperatives
            </p>
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a" }}>
            Available Stock: 4,200 Ltrs Slurry | 180 Compost Bags
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Order ID</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Buyer / Cooperative</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Product Type</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Quantity</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Value</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Destination</th>
                <th style={{ padding: "0.75rem 1rem", color: "#475569" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {fertilizerDispatches.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#0f172a" }}>{item.id}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{item.buyer}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>{item.product}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#0f172a" }}>
                    {item.quantityLtrs ? `${item.quantityLtrs} Litres` : `${item.quantityBags} Bags`}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#16a34a" }}>₹{item.orderValue}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>{item.destination}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ 
                      fontSize: "0.72rem", 
                      fontWeight: 800, 
                      padding: "3px 8px", 
                      borderRadius: "10px",
                      background: item.status === "Dispatched" ? "#dcfce7" : "#e0e7ff",
                      color: item.status === "Dispatched" ? "#166534" : "#3730a3"
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Schedule Biomass Intake */}
      {showLogModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "480px", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
              🌱 Schedule Farm Biomass Pickup
            </h3>
            <form onSubmit={handleCreateWasteLog} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Farmer / Source Name
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Ramesh Reddy" 
                  value={newLog.farmerName} 
                  onChange={e => setNewLog({ ...newLog, farmerName: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Village / Cluster
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Shamirpet, Medchal" 
                  value={newLog.village} 
                  onChange={e => setNewLog({ ...newLog, village: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Biomass / Waste Type
                </label>
                <select 
                  value={newLog.wasteType} 
                  onChange={e => setNewLog({ ...newLog, wasteType: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                >
                  <option value="Dry Paddy Straw & Maize Stalks">Dry Paddy Straw & Maize Stalks (Stubble)</option>
                  <option value="Dairy Cow Dung Slurry">Dairy Cow Dung Slurry (Bovine)</option>
                  <option value="Mandi Vegetable Biomass & Spoiled Produce">Mandi Vegetable Biomass & Spoiled Produce</option>
                  <option value="Sugarcane Bagasse & Pressmud">Sugarcane Bagasse & Pressmud</option>
                  <option value="Cotton Crop Residue">Cotton Crop Residue</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Estimated Weight (Kg)
                  </label>
                  <input 
                    type="number" 
                    required
                    min="50"
                    placeholder="e.g. 1000" 
                    value={newLog.weightKg} 
                    onChange={e => {
                      const val = e.target.value;
                      setNewLog({ 
                        ...newLog, 
                        weightKg: val, 
                        incentiveAmt: val ? Math.round(parseFloat(val) * 1.5) : "" 
                      });
                    }}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Farmer Compensation (₹)
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500" 
                    value={newLog.incentiveAmt} 
                    onChange={e => setNewLog({ ...newLog, incentiveAmt: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowLogModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ background: "#16a34a", borderColor: "#16a34a" }}
                >
                  Submit & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
