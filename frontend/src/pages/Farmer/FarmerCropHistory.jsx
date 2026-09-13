import { useState, useEffect } from "react";
import { History, TrendingUp, DollarSign, Calendar, PlusCircle, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import API from "../../api/api";

const INITIAL_HISTORY = [
  {
    id: "hist_1",
    season: "Kharif 2025",
    cropName: "Sona Masoori Rice (Paddy)",
    variety: "RNR 15048",
    acres: 3,
    harvestYieldKg: 9000, // 9 Tons
    totalRevenue: 432000, // ₹4.32 Lakhs
    inputCosts: 125000,
    netProfit: 307000,
    profitMarginPct: 71.0,
    harvestDate: "2025-11-15",
    buyerType: "Direct Marketplace & APMC Mandi",
    soilType: "Red Loamy Soil",
    notes: "Applied Azolla bio-fertilizer + organic neem oil. Minimal pest damage."
  },
  {
    id: "hist_2",
    season: "Rabi 2024-25",
    cropName: "Hybrid Red Tomato",
    variety: "Arka Rakshak",
    acres: 1.5,
    harvestYieldKg: 45000, // 45 Tons
    totalRevenue: 675000,
    inputCosts: 180000,
    netProfit: 495000,
    profitMarginPct: 73.3,
    harvestDate: "2025-03-20",
    buyerType: "RythuJanaSethu Direct Consumers",
    soilType: "Black Cotton Soil",
    notes: "Pre-booking orders fetched ₹15/kg flat rate before market crash."
  },
  {
    id: "hist_3",
    season: "Kharif 2024",
    cropName: "Guntur Teja Red Chili",
    variety: "Teja S17",
    acres: 2,
    harvestYieldKg: 4200, // 4.2 Tons Dry
    totalRevenue: 630000,
    inputCosts: 210000,
    netProfit: 420000,
    profitMarginPct: 66.6,
    harvestDate: "2024-12-10",
    buyerType: "Export Aggregator",
    soilType: "Red Clay Soil",
    notes: "Solar dried chilli pods. High capsaicin grade A rating."
  }
];

export default function FarmerCropHistory() {
  const [historyList, setHistoryList] = useState(INITIAL_HISTORY);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    season: "Kharif 2026",
    cropName: "",
    variety: "",
    acres: "",
    harvestYieldKg: "",
    totalRevenue: "",
    inputCosts: "",
    harvestDate: new Date().toISOString().split("T")[0],
    soilType: "Loamy",
    notes: ""
  });

  const totalLifetimeRevenue = historyList.reduce((acc, h) => acc + (Number(h.totalRevenue) || 0), 0);
  const totalLifetimeProfit = historyList.reduce((acc, h) => acc + (Number(h.netProfit) || 0), 0);
  const totalHarvestTons = historyList.reduce((acc, h) => acc + ((Number(h.harvestYieldKg) || 0) / 1000), 0);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.cropName || !form.totalRevenue) return;

    const rev = Number(form.totalRevenue) || 0;
    const cost = Number(form.inputCosts) || 0;
    const profit = rev - cost;
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : 0;

    const newRecord = {
      id: "hist_" + Date.now(),
      season: form.season,
      cropName: form.cropName,
      variety: form.variety || "Local Hybrid",
      acres: Number(form.acres) || 1,
      harvestYieldKg: Number(form.harvestYieldKg) || 0,
      totalRevenue: rev,
      inputCosts: cost,
      netProfit: profit,
      profitMarginPct: margin,
      harvestDate: form.harvestDate,
      soilType: form.soilType,
      notes: form.notes
    };

    setHistoryList([newRecord, ...historyList]);
    setShowAddModal(false);
    setForm({ season: "Kharif 2026", cropName: "", variety: "", acres: "", harvestYieldKg: "", totalRevenue: "", inputCosts: "", harvestDate: "", soilType: "Loamy", notes: "" });
  };

  return (
    <div style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "16px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            📜 Farmer Crop Harvest History & Performance Ledger
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "4px 0 0 0" }}>
            Track past seasonal yields, gross selling revenues, input costs, and net profitability
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "0.55rem 1.2rem",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <PlusCircle size={16} /> Record Past Harvest
        </button>
      </div>

      {/* Lifetime Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", padding: "1rem", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--green-light)", textTransform: "uppercase", fontWeight: 700 }}>Total Revenue Recorded</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>₹{totalLifetimeRevenue.toLocaleString()}</div>
        </div>

        <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", padding: "1rem", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.75rem", color: "#60a5fa", textTransform: "uppercase", fontWeight: 700 }}>Total Net Profit</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#93c5fd" }}>₹{totalLifetimeProfit.toLocaleString()}</div>
        </div>

        <div style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.2)", padding: "1rem", borderRadius: "10px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--yellow-wheat)", textTransform: "uppercase", fontWeight: 700 }}>Lifetime Harvest Output</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>{totalHarvestTons.toFixed(1)} Metric Tons</div>
        </div>
      </div>

      {/* History Records Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {historyList.map(item => (
          <div
            key={item.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "1.25rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <div>
                <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)", marginRight: "8px" }}>
                  {item.season}
                </span>
                <strong style={{ fontSize: "1.1rem", color: "white" }}>{item.cropName}</strong>
                {item.variety && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>({item.variety})</span>}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--green-light)", fontWeight: 700 }}>
                Harvested: {item.harvestDate}
              </div>
            </div>

            {/* Financial & Yield Grid */}
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.9rem", borderRadius: "8px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "0.8rem" }}>
              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Harvest Yield</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>{(item.harvestYieldKg / 1000).toFixed(2)} Tons</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>({item.harvestYieldKg} kg over {item.acres} acres)</div>
              </div>

              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Gross Revenue</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4ade80" }}>₹{item.totalRevenue.toLocaleString()}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Input Costs</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f87171" }}>₹{item.inputCosts.toLocaleString()}</div>
              </div>

              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Net Profit</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "white" }}>₹{item.netProfit.toLocaleString()}</div>
                <div style={{ fontSize: "0.75rem", color: "#4ade80", fontWeight: 700 }}>{item.profitMarginPct}% Margin</div>
              </div>
            </div>

            {item.notes && (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                💡 <strong>Farmer Notes & Soil:</strong> {item.notes} ({item.soilType})
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Harvest Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "16px", padding: "1.5rem", width: "100%", maxWidth: "550px", color: "white" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "white" }}>📝 Record Past Harvest Entry</h3>
            
            <form onSubmit={handleAddSubmit}>
              <div className="grid-2 mb-2">
                <div className="form-group">
                  <label className="field-label">Season & Year</label>
                  <select className="rs-select" value={form.season} onChange={e => setForm({...form, season: e.target.value})}>
                    <option value="Kharif 2026">Kharif 2026</option>
                    <option value="Rabi 2025-26">Rabi 2025-26</option>
                    <option value="Kharif 2025">Kharif 2025</option>
                    <option value="Rabi 2024-25">Rabi 2024-25</option>
                    <option value="Zaid 2025">Zaid (Summer) 2025</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">Crop Name</label>
                  <input type="text" className="rs-input" required placeholder="e.g. Sona Masoori Rice" value={form.cropName} onChange={e => setForm({...form, cropName: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="field-label">Variety Name</label>
                  <input type="text" className="rs-input" placeholder="e.g. RNR 15048" value={form.variety} onChange={e => setForm({...form, variety: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="field-label">Cultivated Acres</label>
                  <input type="number" step="0.1" className="rs-input" placeholder="e.g. 2.5" value={form.acres} onChange={e => setForm({...form, acres: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="field-label">Total Yield (in Kg)</label>
                  <input type="number" className="rs-input" placeholder="e.g. 8000" value={form.harvestYieldKg} onChange={e => setForm({...form, harvestYieldKg: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="field-label">Gross Sales Revenue (₹)</label>
                  <input type="number" className="rs-input" required placeholder="e.g. 350000" value={form.totalRevenue} onChange={e => setForm({...form, totalRevenue: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="field-label">Total Input Costs (₹)</label>
                  <input type="number" className="rs-input" placeholder="Seeds + Fertilizer + Labor" value={form.inputCosts} onChange={e => setForm({...form, inputCosts: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="field-label">Harvest Date</label>
                  <input type="date" className="rs-input" value={form.harvestDate} onChange={e => setForm({...form, harvestDate: e.target.value})} />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="field-label">Farmer Notes & Season Remarks</label>
                <textarea className="rs-input" rows={2} placeholder="Weather conditions, pest incidents, selling tips..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: "auto" }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
