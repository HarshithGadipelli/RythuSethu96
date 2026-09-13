import { useState, useMemo } from "react";
import { Dna, Award, Sparkles, ShieldCheck, Zap, Thermometer, CheckCircle2, ChevronRight } from "lucide-react";

export const VARIETY_CATALOG = [
  {
    id: "rnr15048",
    crop: "Paddy / Rice",
    varietyName: "Telangana Sona (RNR 15048)",
    releasedBy: "PJTSAU (Professor Jayashankar Telangana State Agricultural University)",
    durationDays: "120 - 125 days",
    yieldPerAcre: "28 - 32 Quintals/acre",
    traits: ["High Yielding", "Disease Immunity", "Early Maturity", "High Protein / Quality"],
    resistanceDetails: "Immune to Rice Blast & tolerant to Sheath Blight. Ultra-low Glycemic Index (GI = 51.5) preferred by diabetic consumers.",
    agroZone: "Telangana, Andhra Pradesh, Karnataka, Tamil Nadu",
    recommendation: "Commands ₹300/qntl over standard paddy due to high diabetic rice demand."
  },
  {
    id: "bpt5204",
    crop: "Paddy / Rice",
    varietyName: "Samba Mahsuri (BPT 5204 - Improved)",
    releasedBy: "ANGRAU & CCMB Hyderabad",
    durationDays: "135 - 145 days",
    yieldPerAcre: "30 - 35 Quintals/acre",
    traits: ["High Yielding", "Disease Immunity", "High Protein / Quality"],
    resistanceDetails: "Marker-assisted breeding gives 100% resistance to Bacterial Leaf Blight (BLB Xa21 gene).",
    agroZone: "Andhra Pradesh, Telangana, Tamil Nadu, Odisha",
    recommendation: "Premium superfine cooking quality. Benchmark for Indian urban households."
  },
  {
    id: "arka_rakshak",
    crop: "Tomato",
    varietyName: "Arka Rakshak (F1 Hybrid)",
    releasedBy: "ICAR - IIHR Bengaluru",
    durationDays: "140 - 150 days",
    yieldPerAcre: "35 - 40 Tons/acre",
    traits: ["High Yielding", "Disease Immunity", "Heat / Salinity Tolerance"],
    resistanceDetails: "Triple Disease Resistant F1 hybrid resistant to Tomato Leaf Curl Virus (ToLCV), Bacterial Wilt (BW), and Early Blight (EB).",
    agroZone: "All India (South, West & North Belts)",
    recommendation: "Firm fruits with deep red color & 15 days post-harvest shelf life. High transportability."
  },
  {
    id: "guntur_teja",
    crop: "Chili",
    varietyName: "Guntur Teja (S17 / LCA 334)",
    releasedBy: "Lamas Research Station ANGRAU",
    durationDays: "150 - 160 days",
    yieldPerAcre: "20 - 25 Quintals/acre (Dry)",
    traits: ["High Yielding", "High Protein / Quality", "Drought Resistance"],
    resistanceDetails: "High Capsaicin content (0.55-0.70%) & ASTA color value 90-100. Resistant to Fruit Rot.",
    agroZone: "Andhra Pradesh, Telangana, Karnataka",
    recommendation: "Top international export variety to China & Southeast Asia."
  },
  {
    id: "rch659",
    crop: "Cotton",
    varietyName: "RCH-659 BGII",
    releasedBy: "Rasi Seeds / CICR Nagpur",
    durationDays: "150 - 160 days",
    yieldPerAcre: "12 - 16 Quintals/acre",
    traits: ["High Yielding", "Disease Immunity", "Drought Resistance"],
    resistanceDetails: "Bollgard II technology resistant to American & Pink Bollworms. Excellent staple length (>30mm).",
    agroZone: "Central & South Zone Cotton Belts",
    recommendation: "Deep taproot system suitable for rainfed red & black soils."
  },
  {
    id: "dhm117",
    crop: "Maize / Corn",
    varietyName: "DHM-117 (Single Cross Hybrid)",
    releasedBy: "Winter Nursery Centre ICAR-IIMR Hyderabad",
    durationDays: "100 - 105 days",
    yieldPerAcre: "32 - 38 Quintals/acre",
    traits: ["High Yielding", "Drought Resistance", "Early Maturity"],
    resistanceDetails: "Single cross hybrid tolerant to Turcicum Leaf Blight & drought spells during cob filling.",
    agroZone: "Telangana, AP, Karnataka, Maharashtra",
    recommendation: "High shelling percentage (>84%). Excellent for poultry feed mills."
  }
];

export default function SelectiveBreedingAdvisor() {
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [selectedTraits, setSelectedTraits] = useState([]);

  const traitList = [
    { id: "High Yielding", label: "🌾 High Yield (HYV)", icon: Sparkles },
    { id: "Disease Immunity", label: "🛡️ Disease & Pest Immunity", icon: ShieldCheck },
    { id: "Drought Resistance", label: "☀️ Drought / Water Stress", icon: Zap },
    { id: "Heat / Salinity Tolerance", label: "🌡️ Heat & Salinity Tolerance", icon: Thermometer },
    { id: "Early Maturity", label: "⏱️ Early Maturity (Short Duration)", icon: Zap },
    { id: "High Protein / Quality", label: "🧪 High Quality / Protein / GI", icon: Award }
  ];

  const toggleTrait = (traitId) => {
    setSelectedTraits(prev => 
      prev.includes(traitId) ? prev.filter(t => t !== traitId) : [...prev, traitId]
    );
  };

  const filteredCatalog = useMemo(() => {
    return VARIETY_CATALOG.filter(v => {
      const matchCrop = selectedCrop === "All" || v.crop.toLowerCase().includes(selectedCrop.toLowerCase());
      const matchTraits = selectedTraits.length === 0 || selectedTraits.every(t => v.traits.includes(t));
      return matchCrop && matchTraits;
    });
  }, [selectedCrop, selectedTraits]);

  return (
    <div style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "16px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
      
      <div style={{ marginBottom: "1.2rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          🧬 Selective Breeding & High-Yield Variety (HYV) Selector
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "4px 0 0 0" }}>
          Select target genetic traits & agro-climatic zones for ICAR/SAU certified crop varieties
        </p>
      </div>

      {/* Crop Filter Dropdown */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
        <div>
          <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Filter Crop Type:</label>
          <select
            className="rs-select"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "white", minWidth: 200 }}
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
          >
            <option value="All">🌾 All Crop Categories</option>
            <option value="Paddy">Paddy / Rice</option>
            <option value="Tomato">Tomato</option>
            <option value="Chili">Chili</option>
            <option value="Cotton">Cotton</option>
            <option value="Maize">Maize / Corn</option>
          </select>
        </div>
      </div>

      {/* Trait Selection Filter Chips */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Select Desired Genetic Traits:</label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {traitList.map(tr => {
            const isSelected = selectedTraits.includes(tr.id);
            return (
              <button
                key={tr.id}
                type="button"
                onClick={() => toggleTrait(tr.id)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "100px",
                  border: isSelected ? "1.5px solid var(--green-light)" : "1px solid rgba(255,255,255,0.1)",
                  background: isSelected ? "var(--green-deep)" : "rgba(255,255,255,0.04)",
                  color: isSelected ? "white" : "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {tr.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Variety Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.2rem" }}>
        {filteredCatalog.map(item => (
          <div
            key={item.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justify: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <div>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", margin: 0 }}>
                    {item.varietyName}
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--green-light)", fontWeight: 600 }}>
                    {item.crop}
                  </span>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                  ICAR / SAU Certified
                </span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>
                🏛️ Released by: <strong>{item.releasedBy}</strong>
              </div>

              {/* Trait Pills */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
                {item.traits.map(t => (
                  <span key={t} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", padding: "2px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 600 }}>
                    ✓ {t}
                  </span>
                ))}
              </div>

              {/* Key Specs */}
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.8rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Expected Yield</span>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "white" }}>
                    {item.yieldPerAcre}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Duration</span>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--yellow-wheat)" }}>
                    {item.durationDays}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: "0.6rem" }}>
                <strong>Resistance & Genetics:</strong> {item.resistanceDetails}
              </div>
              
              <div style={{ fontSize: "0.75rem", color: "#e2e8f0", background: "rgba(255,255,255,0.02)", padding: "6px 8px", borderRadius: "6px" }}>
                📍 <strong>Suitable Belts:</strong> {item.agroZone}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
