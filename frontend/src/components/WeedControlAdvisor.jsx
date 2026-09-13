import { useState } from "react";
import { ShieldAlert, Droplets, Leaf, AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";

const WEED_DATA = {
  rice: {
    cropName: "Paddy / Rice (Vari / Vadlu)",
    criticalPeriod: "15 - 45 days after transplanting / sowing",
    majorWeeds: [
      {
        name: "Cyperus rotundus (Nut Grass / Tungi)",
        type: "Sedge Weed",
        severity: "High",
        description: "Perennial sedge with underground tubers. Competes heavily for soil nitrogen and moisture.",
        chemicalControl: "Apply Pyrazosulfuron Ethyl 10% WP @ 80g/acre in 150L water (Pre-emergence 0-3 DAT) or Ethoxysulfuron 15% WDG @ 50g/acre (Post-emergence 15-20 DAT).",
        organicControl: "Cono-weeder operation in flooded fields at 15 & 30 days. Maintain 5cm continuous standing water layer to suppress tuber germination.",
        dosagePerAcre: "80g Pyrazosulfuron Ethyl in 150 liters water"
      },
      {
        name: "Echinochloa crus-galli (Barnyard Grass / Oora Gaddi)",
        type: "Grassy Weed",
        severity: "Severe",
        description: "Morphologically resembles paddy seedlings. Causes up to 60% yield reduction if unmanaged.",
        chemicalControl: "Spray Bispyribac Sodium 10% SC @ 80-100 ml/acre at 2-3 leaf weed stage (15-20 DAT). Ensure field is drained before spraying, re-flood after 48 hrs.",
        organicControl: "Azolla bio-fertilizer mat cover (suppresses light reaching weed seeds) + manual hand weeding at 20 DAT.",
        dosagePerAcre: "90 ml Bispyribac Sodium in 150L water"
      },
      {
        name: "Ludwigia parviflora (Water Primrose / Broadleaf)",
        type: "Broadleaf Weed",
        severity: "Moderate",
        description: "Fleshy aquatic broadleaf weed in flooded paddy ecosystems.",
        chemicalControl: "Spray 2,4-D Ethyl Ester 38% EC @ 400 ml/acre at 25 DAT.",
        organicControl: "Manual hand pulling during mid-season weeding.",
        dosagePerAcre: "400 ml 2,4-D in 200L water"
      }
    ]
  },
  cotton: {
    cropName: "Cotton (Patti / Kapas)",
    criticalPeriod: "15 - 60 days after sowing",
    majorWeeds: [
      {
        name: "Parthenium hysterophorus (Congress Grass / Gaddi)",
        type: "Broadleaf Weed",
        severity: "Severe",
        description: "Aggressive invasive weed producing allelopathic toxins that stunt cotton boll growth.",
        chemicalControl: "Pre-emergence: Pendimethalin 30% EC @ 1.0 Litre/acre within 48 hours of sowing. Post-emergence directed spray: Pyrithiobac Sodium 10% EC @ 250 ml/acre at 20 DAS.",
        organicControl: "Intercropping with Cowpea or Green Gram to cover inter-row spaces. Release of Zygogramma bicolorata biocontrol beetles.",
        dosagePerAcre: "1.0 Litre Pendimethalin in 200L water"
      },
      {
        name: "Cynodon dactylon (Bermuda Grass / Garika Gaddi)",
        type: "Grassy Weed",
        severity: "High",
        description: "Creeping stoloniferous grass that binds soil and robs cotton root nutrition.",
        chemicalControl: "Spray Quizalofop-ethyl 5% EC @ 300-400 ml/acre when grass is in active growth phase.",
        organicControl: "Deep summer plowing (disc harrow) to expose rhizomes to scorching solar heat.",
        dosagePerAcre: "350 ml Quizalofop-ethyl in 150L water"
      }
    ]
  },
  chili: {
    cropName: "Chili / Red Pepper (Mirchi)",
    criticalPeriod: "20 - 50 days after transplanting",
    majorWeeds: [
      {
        name: "Amaranthus viridis (Thotakura / Wild Amaranth)",
        type: "Broadleaf Weed",
        severity: "Moderate",
        description: "Fast growing broadleaf weed competing for phosphorus and potassium.",
        chemicalControl: "Spray Oxyfluorfen 23.5% EC @ 200 ml/acre pre-transplanting or Pendimethalin @ 1.0L/acre.",
        organicControl: "Black polyethylene plastic mulch film (25-30 micron thickness) installed on raised planting beds.",
        dosagePerAcre: "200 ml Oxyfluorfen in 150L water"
      },
      {
        name: "Digera arvensis (Kanjru)",
        type: "Broadleaf Weed",
        severity: "Moderate",
        description: "Common annual broadleaf weed in rainfed chili farms.",
        chemicalControl: "Directed spray of Quizalofop-p-tefuryl 4.41% EC @ 300 ml/acre.",
        organicControl: "Manual hoeing with wheel hoe at 15 & 35 days post transplanting.",
        dosagePerAcre: "300 ml Quizalofop in 150L water"
      }
    ]
  },
  tomato: {
    cropName: "Tomato (Tamota)",
    criticalPeriod: "15 - 45 days after transplanting",
    majorWeeds: [
      {
        name: "Solanum nigrum (Black Nightshade / Kamanchi)",
        type: "Broadleaf Weed",
        severity: "High",
        description: "Belongs to nightshade family; acts as an alternate host for Tomato Leaf Curl Virus (ToLCV) vector whiteflies.",
        chemicalControl: "Pre-transplanting: Metribuzin 70% WP @ 100-150 g/acre applied to soil 3 days prior to planting.",
        organicControl: "Silver-black reflective mulch (prevents whitefly landing and smothers weeds completely).",
        dosagePerAcre: "120g Metribuzin in 150L water"
      }
    ]
  },
  maize: {
    cropName: "Maize / Corn (Mokka Jonna)",
    criticalPeriod: "15 - 30 days after sowing",
    majorWeeds: [
      {
        name: "Trianthema portulacastrum (Horse Purslane / Alsani)",
        type: "Broadleaf Weed",
        severity: "Severe",
        description: "Prostrate succulent weed smothering young maize seedlings.",
        chemicalControl: "Pre-emergence: Atrazine 50% WP @ 500g - 1kg/acre applied immediately after sowing. Post-emergence: Tembotrione 34.4% SC @ 115 ml/acre with surfactant.",
        organicControl: "Inter-row cultivation using tractor-drawn cultivator at 20 DAS.",
        dosagePerAcre: "500g Atrazine in 200L water"
      }
    ]
  }
};

export default function WeedControlAdvisor() {
  const [selectedCropKey, setSelectedCropKey] = useState("rice");
  const cropData = WEED_DATA[selectedCropKey] || WEED_DATA.rice;

  return (
    <div style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "16px", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
      
      <div style={{ marginBottom: "1.2rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          🌿 Precision Weed Control & Herbicide Advisor
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "4px 0 0 0" }}>
          Targeted chemical dosages, organic management, and critical weed-free period protection
        </p>
      </div>

      {/* Crop Selector Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1.2rem" }}>
        {Object.keys(WEED_DATA).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedCropKey(key)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "100px",
              border: selectedCropKey === key ? "1.5px solid var(--green-light)" : "1px solid rgba(255,255,255,0.1)",
              background: selectedCropKey === key ? "var(--green-deep)" : "rgba(255,255,255,0.04)",
              color: selectedCropKey === key ? "white" : "var(--text-muted)",
              fontSize: "0.82rem",
              fontWeight: selectedCropKey === key ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {WEED_DATA[key].cropName}
          </button>
        ))}
      </div>

      {/* Critical Weed Free Period Banner */}
      <div style={{ background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.3)", borderRadius: "10px", padding: "0.9rem 1.2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <AlertTriangle size={24} style={{ color: "var(--yellow-wheat)", flexShrink: 0 }} />
        <div>
          <strong style={{ color: "var(--yellow-wheat)", fontSize: "0.9rem" }}>
            Critical Weed-Free Period (CWFP): {cropData.criticalPeriod}
          </strong>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Controlling weeds during this exact window prevents up to 50% crop yield loss and saves fertilizer nutrients.
          </p>
        </div>
      </div>

      {/* Weeds Cards Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        {cropData.majorWeeds.map((weed, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "1.25rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", margin: 0 }}>
                {weed.name}
              </h4>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                  {weed.type}
                </span>
                <span style={{ padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, background: weed.severity === "Severe" ? "rgba(239, 68, 68, 0.2)" : "rgba(234, 179, 8, 0.2)", color: weed.severity === "Severe" ? "#f87171" : "var(--yellow-wheat)" }}>
                  {weed.severity} Impact
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
              {weed.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              
              {/* Chemical Control */}
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.9rem", borderRadius: "8px", borderLeft: "3px solid #3b82f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#60a5fa", fontWeight: 700, fontSize: "0.85rem", marginBottom: "4px" }}>
                  <Droplets size={16} /> Chemical Herbicide Spray
                </div>
                <div style={{ fontSize: "0.8rem", color: "#e2e8f0", lineHeight: 1.5, marginBottom: "6px" }}>
                  {weed.chemicalControl}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--green-light)", fontWeight: 700, background: "rgba(34, 197, 94, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                  🧪 Dosage: {weed.dosagePerAcre}
                </div>
              </div>

              {/* Organic Control */}
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.9rem", borderRadius: "8px", borderLeft: "3px solid #22c55e" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4ade80", fontWeight: 700, fontSize: "0.85rem", marginBottom: "4px" }}>
                  <Leaf size={16} /> Organic & Cultural Management
                </div>
                <div style={{ fontSize: "0.8rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                  {weed.organicControl}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
