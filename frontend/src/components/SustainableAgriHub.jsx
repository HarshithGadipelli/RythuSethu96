import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, Leaf, ShieldAlert, ShieldCheck, Droplets, Sun, 
  Heart, AlertTriangle, ArrowRight, BookOpen, Award, CheckCircle2, 
  Flame, Sprout, Compass, RefreshCw, CloudRain, Layers, Activity,
  Sliders, Calendar, ChevronRight, Trees
} from "lucide-react";

export default function SustainableAgriHub({ user, onSelectTool, onAddMillet }) {
  // Navigation Tabs: "carbon" | "rainwater" | "millets" | "thaati_bellam" | "pesticides" | "permaculture"
  const [activeTab, setActiveTab] = useState("carbon");
  const [activeRecipe, setActiveRecipe] = useState("neemastra");
  const [selectedMillet, setSelectedMillet] = useState("kodo");
  
  // Interactive Calculator States
  const [acreCount, setAcreCount] = useState(2);
  const [socAcres, setSocAcres] = useState(2);
  const [currentSoc, setCurrentSoc] = useState(0.40);
  const [soilType, setSoilType] = useState("red_soil");
  
  // Rainwater Calculator States
  const [rwhAcres, setRwhAcres] = useState(3);
  const [rainfallMm, setRainfallMm] = useState(850);
  const [runoffCoeff, setRunoffCoeff] = useState(0.35); // 35% standard for drylands

  // Botanical Defense & Biological Barriers States
  const [nskeAcres, setNskeAcres] = useState(2);
  const [activeDefenseSubtab, setActiveDefenseSubtab] = useState("nske");

  // 4 Natural Contact Spray Recipes
  const RECIPES = {
    neemastra: {
      name: "🌿 Neemastra (Botanical Contact Insecticide)",
      target: "Aphids, Whiteflies, Jassids, Leafhoppers & Sap-Sucking Pests",
      effect: "Acts strictly on pest contact without penetrating the crop's vascular sap. Harmless to bees, earthworms, and soil microbes.",
      duration: "Ferment for 48 hours in shade. Shelf life: 6 months.",
      ingredients: [
        { item: "Fresh Neem leaves (or crushed neem seeds)", qty: "5 kg" },
        { item: "Indigenous Cow Dung (Gomaya)", qty: "5 kg" },
        { item: "Indigenous Cow Urine (Gomutra)", qty: "5 Litres" },
        { item: "Clean Water (Chlorine-free)", qty: "100 Litres" }
      ],
      steps: [
        "Crush 5kg fresh neem leaves into a coarse pulp.",
        "In a 200L barrel, mix cow dung and cow urine thoroughly.",
        "Add the crushed neem paste and 100 litres of clean well/bore water.",
        "Stir clockwise for 5 minutes with a wooden stick twice daily for 48 hours under shade.",
        "Filter through a muslin cloth and spray directly on crops early morning or late evening."
      ]
    },
    agniastra: {
      name: "🔥 Agniastra (Fiery Contact Repellent)",
      target: "Stem Borers, Fruit Borers, Caterpillars & Pod Borers",
      effect: "Creates an impenetrable pungent alkaline barrier on plant surfaces. Pests cannot feed or lay eggs.",
      duration: "Boiled decoction. Shelf life: 3 months.",
      ingredients: [
        { item: "Indigenous Cow Urine (Gomutra)", qty: "10 Litres" },
        { item: "Crushed Neem leaf paste", qty: "2 kg" },
        { item: "Spicy Green Chilli paste (Tikha Mirch)", qty: "500 grams" },
        { item: "Raw Garlic paste (Lasan)", qty: "500 grams" },
        { item: "Crushed Tobacco or Ginger paste", qty: "250 grams" }
      ],
      steps: [
        "In an earthen or stainless pot, combine cow urine with neem, garlic, and chilli pastes.",
        "Boil on a slow flame until the liquid reduces to half.",
        "Allow to cool completely for 48 hours in the shade.",
        "Filter with fine cotton cloth.",
        "Dosage: Dilute 2 to 3 Litres in 100 Litres of water per acre. Spray on foliage."
      ]
    },
    dashaparni: {
      name: "🍃 Dashaparni Kashayam (10-Leaf Contact Extract)",
      target: "Broad-Spectrum Pest Shield & Contact Anti-Bacterial",
      effect: "Harnesses natural alkaloids of 10 pest-resistant native trees. Zero toxic residues in vegetables.",
      duration: "Ferment for 30 to 45 days. Shelf life: 6 months.",
      ingredients: [
        { item: "Water", qty: "200 Litres" },
        { item: "Indigenous Cow Dung & Urine", qty: "5 kg + 10 Litres" },
        { item: "10 Native bitter/aromatic leaves (Neem, Pongamia, Custard Apple, Papaya, Castor, Datura, Guava, Marigold, Tulsi, Lantana)", qty: "2 kg each (20 kg total)" },
        { item: "Turmeric powder & Ginger paste", qty: "500 grams each" }
      ],
      steps: [
        "Chop all 10 leaf varieties into small fragments.",
        "Mix with cow urine, cow dung, turmeric, and water in a large plastic drum.",
        "Cover with gunny bag and stir twice daily clockwise for 30-45 days.",
        "The potent dark brown liquid provides complete immunity against caterpillars, blights, and mites.",
        "Dosage: Dilute 5 Litres in 100 Litres water per acre."
      ]
    },
    buttermilk: {
      name: "🥛 Sour Buttermilk & Hing Spray (Contact Bio-Fungicide)",
      target: "Powdery Mildew, Downy Mildew, Rust, Leaf Curl & Blights",
      effect: "Lactic acid bacteria and sulfur compounds in asafetida destroy fungal spores on contact while feeding soil microbes.",
      duration: "Ferment buttermilk for 5 to 7 days until extremely sour.",
      ingredients: [
        { item: "Naturally Sour Cow Milk Buttermilk", qty: "5 Litres" },
        { item: "Pure Compounded Hing (Asafetida)", qty: "50 grams" },
        { item: "Water", qty: "100 Litres" }
      ],
      steps: [
        "Take 5L buttermilk in a copper or mud pot and let it ferment for 5 days until a greenish layer forms.",
        "Dissolve 50g asafoetida in warm water and blend into the sour buttermilk.",
        "Dilute with 100L water and spray over both top and undersides of leaves.",
        "Provides immediate fungal suppression with 100% food-grade safety."
      ]
    }
  };

  // 8 Ancient Millets Data with Arikelu Superfood Spotlight
  const MILLETS = {
    kodo: {
      name: "Arikelu (Kodo Millet / కోదో మిల్లెట్)",
      botanical: "Paspalum scrobiculatum",
      hindiName: "कोदो / कोदरा",
      teluguName: "అరికెలు",
      isSpotlight: true,
      superfoodBadge: "👑 Crown Superfood of Ancient India",
      keyHighlight: "Ultra-low GI (50) for Diabetes Reversal, Highest Polyphenol Antioxidants & Blood Purifier",
      waterSaving: "80% less water than Paddy (Survives on 150-200mm rain)",
      soilImpact: "Fibrous deep root network deposits recalcitrant carbon, binds topsoil against severe erosion, tolerates salinity.",
      healthBenefits: "Clinically proven to reverse insulin resistance. Richest in quercetin and phenolic antioxidants (3.8x wheat, 8.5x white rice). Dr. Khadar Vali Siridhanya protocol identifies Arikelu as the primary food for purifying bone marrow, lymphatic system, and blood; accelerates platelet recovery in dengue fever.",
      harvestDays: "105 - 120 days",
      idealSeason: "Kharif (Monsoon)",
      mspPerQuintal: "₹4,100 / quintal",
      fiber: "9.0% - 10.2%",
      gi: "50 (Ultra-Low)",
      iron: "4.8 mg / 100g"
    },
    foxtail: {
      name: "Korralu (Foxtail Millet / కొర్రలు)",
      botanical: "Setaria italica",
      hindiName: "कंगनी / काकुन",
      teluguName: "కొర్రలు",
      superfoodBadge: "🧠 Nervous System & Lung Cleanser",
      keyHighlight: "High Vitamin B12, balances nervous system and lowers bad LDL cholesterol",
      waterSaving: "70% less water than Paddy",
      soilImpact: "Super-fast canopy cover suffocates weeds, minimal nutrient requirement.",
      healthBenefits: "Packed with Vitamin B12, iron, and dietary fiber. Strengthens lungs and soothes nervous disorders and arthritis.",
      harvestDays: "75 - 90 days",
      idealSeason: "Early Kharif / Summer",
      mspPerQuintal: "₹3,850 / quintal",
      fiber: "8.0%",
      gi: "54 (Low)",
      iron: "3.5 mg / 100g"
    },
    little: {
      name: "Samalu (Little Millet / సామలు)",
      botanical: "Panicum sumatrense",
      hindiName: "कुटकी / सावां",
      teluguName: "సామలు",
      superfoodBadge: "🧬 Endocrine & Reproductive Wellness",
      keyHighlight: "Ovarian health, PCOS relief, and gentle weaning food for infants",
      waterSaving: "Grows on rocky, poor drylands with zero irrigation",
      soilImpact: "Survives drought where all other grains fail; fixes organic root residues in topsoil.",
      healthBenefits: "High phosphorus and antioxidant profile. Cleanses reproductive organs and balances hormones; ideal weaning food for infants.",
      harvestDays: "75 - 85 days",
      idealSeason: "Kharif",
      mspPerQuintal: "₹3,750 / quintal",
      fiber: "7.6%",
      gi: "52 (Low)",
      iron: "9.3 mg / 100g"
    },
    barnyard: {
      name: "Udalu (Barnyard Millet / ఊదలు)",
      botanical: "Echinochloa frumentacea",
      hindiName: "सांवा / झंगोरा",
      teluguName: "ఊదలు",
      superfoodBadge: "🩸 Liver & Kidney Detoxifier",
      keyHighlight: "Highest dietary fiber (13.6g) & lowest carbohydrate content",
      waterSaving: "Fastest growing millet, extremely low water",
      soilImpact: "Excellent rotation crop after heavy feeders like tomato and cotton to restore soil balance.",
      healthBenefits: "Highest dietary fiber among all grains (13.6g/100g). Deeply detoxifies liver, kidneys, and gallbladder; fastest grain for weight loss.",
      harvestDays: "60 - 75 days (Record harvest speed)",
      idealSeason: "Kharif / Zaid",
      mspPerQuintal: "₹3,900 / quintal",
      fiber: "13.6%",
      gi: "48 (Lowest GI)",
      iron: "18.6 mg / 100g"
    },
    browntop: {
      name: "Andu Korralu (Browntop Millet / అండు కొర్రలు)",
      botanical: "Brachiaria ramosa",
      hindiName: "हरी कंगनी",
      teluguName: "అండు కొర్రలు",
      superfoodBadge: "🛡️ Digestive Tract & Colon Restorer",
      keyHighlight: "12.5% fiber, heals gastric ulcers, hemorrhoids, and colon inflammation",
      waterSaving: "Thrives in shallow dryland gravel with minimal rainfall",
      soilImpact: "Acts as a remarkable living green mulch; dense root network aerates hardpan soils.",
      healthBenefits: "Rarest positive Siridhanya millet. Cleanses the entire alimentary canal, relieves chronic constipation, cures ulcers and hemorrhoids.",
      harvestDays: "75 - 80 days",
      idealSeason: "Kharif / Rabi",
      mspPerQuintal: "₹4,500 / quintal",
      fiber: "12.5%",
      gi: "51 (Low)",
      iron: "7.7 mg / 100g"
    },
    ragi: {
      name: "Ragulu (Finger Millet / రాగులు)",
      botanical: "Eleusine coracana",
      hindiName: "रागी / मंडुआ",
      teluguName: "రాగులు",
      superfoodBadge: "🦴 344mg Calcium Bone Builder",
      keyHighlight: "Highest natural calcium among all cereals, prevents osteoporosis",
      waterSaving: "72% less water than Paddy",
      soilImpact: "Fibrous deep root system breaks hardpan, thrives in red loamy & sandy soils.",
      healthBenefits: "Massive calcium content (344mg/100g). Completely eliminates bone density loss, fortifies infant bone growth, low GI reverses diabetes.",
      harvestDays: "100 - 115 days",
      idealSeason: "Kharif & Late Rabi",
      mspPerQuintal: "₹4,290 / quintal",
      fiber: "3.6%",
      gi: "55 (Low)",
      iron: "3.9 mg / 100g"
    },
    jowar: {
      name: "Jonnalu (Sorghum / జొన్నలు)",
      botanical: "Sorghum bicolor",
      hindiName: "ज्वार",
      teluguName: "జొన్నలు",
      superfoodBadge: "❤️ Heart Health & Gluten-Free Energy",
      keyHighlight: "Rich in copper, potassium & magnesium for cardiovascular strength",
      waterSaving: "68% less water than Rice",
      soilImpact: "Extensive roots prevent wind & water erosion, deposits deep root organic carbon.",
      healthBenefits: "Gluten-free, rich in copper and magnesium, slows down carbohydrate absorption, lowers blood pressure.",
      harvestDays: "105 - 120 days",
      idealSeason: "Kharif & Rabi",
      mspPerQuintal: "₹3,377 / quintal",
      fiber: "6.7%",
      gi: "62 (Medium-Low)",
      iron: "4.1 mg / 100g"
    },
    bajra: {
      name: "Sajjalu (Pearl Millet / సజ్జలు)",
      botanical: "Pennisetum glaucum",
      hindiName: "बाजरा",
      teluguName: "సజ్జలు",
      superfoodBadge: "⚡ High Iron & Cellular Energy",
      keyHighlight: "Massive bio-available iron (8mg/100g) curing maternal anemia",
      waterSaving: "75% less water than Wheat",
      soilImpact: "Tolerates high soil salinity, extreme heat up to 46°C, restores exhausted arid lands.",
      healthBenefits: "Highest iron among common millets (8mg/100g), eradicates maternal anemia, rich in prebiotic fiber and zinc.",
      harvestDays: "80 - 90 days (Quick cycle)",
      idealSeason: "Kharif",
      mspPerQuintal: "₹2,625 / quintal",
      fiber: "8.0%",
      gi: "55 (Low)",
      iron: "8.0 mg / 100g"
    }
  };

  // Calculations for Soil Organic Carbon (SOC)
  const annualBiomassTonnes = (socAcres * 10.5).toFixed(1);
  const greenManureSeedKg = socAcres * 20;
  const nitrogenFixedKg = socAcres * 72;
  const waterRetentionGallons = Math.round(socAcres * 22500);
  const fertilizerCostSaved = Math.round(socAcres * 12500);

  // Calculations for Rainwater Harvesting (RWH)
  // Catchment Litres = Acres * 4046.86 m2 * (Rainfall mm / 1000) * 1000 Litres/m3
  const totalRainOnCatchment = Math.round(rwhAcres * 4046.86 * rainfallMm);
  const harvestableRunoffLitres = Math.round(totalRainOnCatchment * runoffCoeff);
  const farmPondsFilled = (harvestableRunoffLitres / 200000).toFixed(1);
  const borewellRechargePotential = Math.round(harvestableRunoffLitres * 0.75);
  const protectiveIrrigationDays = Math.round(harvestableRunoffLitres / (rwhAcres * 25000));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── HEADER BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
        color: "white",
        borderRadius: "20px",
        padding: "2rem",
        boxShadow: "0 10px 30px rgba(6, 78, 59, 0.25)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: "-30px", top: "-30px", opacity: 0.12, fontSize: "14rem", pointerEvents: "none" }}>
          🌱
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ background: "#10b981", color: "#064e3b", padding: "4px 12px", borderRadius: "100px", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            National Soil Regeneration &amp; Wellness Mission
          </span>
          <span style={{ background: "rgba(255,255,255,0.2)", color: "#fef08a", padding: "4px 12px", borderRadius: "100px", fontWeight: 700, fontSize: "0.75rem" }}>
            🌾 Shree Anna (Arikelu) &amp; 🌴 Thaati Bellam
          </span>
          <span style={{ background: "rgba(56, 189, 248, 0.2)", color: "#bae6fd", padding: "4px 12px", borderRadius: "100px", fontWeight: 700, fontSize: "0.75rem" }}>
            💧 Rainwater Harvesting &amp; Borewell Recharge
          </span>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 900, margin: "0 0 0.5rem 0", lineHeight: 1.2 }}>
          Soil Organic Carbon, Rainwater Harvesting &amp; Ancient Superfoods Hub
        </h1>
        <p style={{ margin: 0, fontSize: "0.95rem", color: "#d1fae5", maxWidth: "860px", lineHeight: 1.5 }}>
          Triple topsoil organic carbon (from &lt;0.4% to 2.5%), capture monsoons via Farm Ponds &amp; Borewell Recharge, eliminate toxic systemic chemicals with botanical sprays, and champion India&apos;s ancient superfoods: <strong>Arikelu (Kodo Millet)</strong> and pure <strong>Thaati Bellam (Palmyra Palm Jaggery)</strong>.
        </p>

        {/* Top 4 Metric Badges */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>Soil Organic Carbon (SOC)</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" }}>Target: 2.0% - 2.5%</div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5" }}>+22,000 Gallons water/acre per 1% SOC</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>Farmland Rain Catchment</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff" }}>2,00,000 L / Pond</div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5" }}>Krishi Honda + Borewell Filter Pits</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>Spotlight Superfood</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fef08a" }}>Arikelu (Kodo Millet)</div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5" }}>GI 50 • Diabetes Reversal • Blood Detox</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>Ancestral Sweetener</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fed7aa" }}>Thaati Bellam</div>
            <div style={{ fontSize: "0.72rem", color: "#d1fae5" }}>60x Iron, 1050mg Calcium, Zero Bone-Char</div>
          </div>
        </div>
      </div>

      {/* ── 6 NAVIGATION TABS ── */}
      <div style={{ display: "flex", gap: "0.5rem", background: "#f1f5f9", padding: "6px", borderRadius: "14px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        {[
          { id: "carbon", label: "🌱 Soil Organic Carbon (SOC)", icon: Leaf },
          { id: "rainwater", label: "💧 Rainwater Harvesting (RWH)", icon: CloudRain },
          { id: "millets", label: "🌾 Arikelu & Shree Anna Millets", icon: Sparkles },
          { id: "thaati_bellam", label: "🌴 Thaati Bellam (Palm Jaggery)", icon: Trees },
          { id: "botanical_defense", label: "🌿 Botanical Defense: NSKE, Corn & Catch Crops", icon: ShieldAlert },
          { id: "pesticides", label: "🛡️ Contact vs Systemic Sprays", icon: ShieldCheck },
          { id: "permaculture", label: "🔄 Permaculture & Jeevamrutham", icon: Sprout },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: "1 0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "0.75rem 1.1rem",
                borderRadius: "10px",
                border: "none",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#065f46" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}
            >
              <Icon size={16} color={isActive ? "#059669" : "#64748b"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: SOIL ORGANIC CARBON (SOC) REGENERATION BLUEPRINT ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "carbon" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Scientific Context Banner */}
          <div style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
            border: "1.5px solid #86efac",
            borderRadius: "16px",
            padding: "1.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.6rem" }}>🌱</span>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 900, color: "#166534" }}>
                Soil Organic Carbon (SOC): The Master Engine of Farmland Fertility
              </h2>
            </div>
            <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.92rem", color: "#15803d", lineHeight: 1.5 }}>
              In the 1960s, Indian soils naturally possessed <strong>1.5% to 2.5% Soil Organic Carbon (SOC)</strong>. Decades of heavy synthetic chemical fertilizers, disc plowing that exposes humus to the scorching sun, and stubble burning have collapsed Indian farmland SOC to <strong>less than 0.40%</strong>. This turns living soil into inert dust. By following the 5 concrete steps below, farmers can restore SOC to healthy 1.5% - 2.0% within 3 to 4 seasons.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#166534", display: "block", marginBottom: "0.25rem", fontSize: "0.92rem" }}>
                  💧 Massive Water Holding Capacity
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.4, display: "block" }}>
                  Every 1% increase in SOC allows 1 acre of soil to absorb and retain an extra <strong>20,000 to 25,000 gallons of rainfall</strong>, keeping crops lush through severe 30-day dry spells.
                </span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#166534", display: "block", marginBottom: "0.25rem", fontSize: "0.92rem" }}>
                  🦠 Unlocks Bound Phosphorus &amp; Potash
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.4, display: "block" }}>
                  Soil carbon feeds billions of phosphate-solubilizing bacteria (PSB) and mycorrhizal fungi, converting locked minerals into free plant nutrition with zero chemical DAP/Urea needed.
                </span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#166534", display: "block", marginBottom: "0.25rem", fontSize: "0.92rem" }}>
                  💰 Saves ₹12,000+ / Acre / Year
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.4, display: "block" }}>
                  Eliminates commercial tractor plowing, synthetic chemical urea purchases, and pest sprays while fetching premium organic and export prices.
                </span>
              </div>
            </div>
          </div>

          {/* The 5 Concrete Scientific Steps */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Leaf size={20} color="#059669" />
              The 5 Golden Steps to Triple Topsoil Organic Carbon (SOC)
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "0 0 1.5rem 0" }}>
              Follow this step-by-step protocol every agricultural cycle to systematically rebuild your topsoil humus:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Step 1 */}
              <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "#16a34a", color: "white", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                    STEP 1
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#1e293b" }}>
                    High-Biomass Green Manuring (పచ్చిరొట్ట ఎరువులు / हरी खाद)
                  </h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#166534", display: "block", marginBottom: "0.3rem" }}>
                      📋 Seed Mix &amp; Dosage Per Acre:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                      <li><strong>Sunhemp (Janumu / Sanai):</strong> 20 kg / acre (Fastest nitrogen fixer).</li>
                      <li><strong>Dhaincha (Jeeluga):</strong> 15-20 kg / acre (Thrives in waterlogged &amp; alkaline soils).</li>
                      <li><strong>Cowpea (Alasandalu):</strong> 10 kg / acre (Lush groundcover suppressing weeds).</li>
                    </ul>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#166534", display: "block", marginBottom: "0.3rem" }}>
                      ⏳ Scientific Timing &amp; Incorporation:
                    </strong>
                    <p style={{ margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                      Sow immediately after the first pre-monsoon shower. Allow crops to grow for <strong>45 to 50 days</strong> until 50% flowering stage. Incorporate into top 4-6 inches with a rotavator while the stems are tender and green (before woody lignification). Injects <strong>8 to 12 tonnes of succulent biomass</strong> and 60-80 kg pure biological Nitrogen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "#16a34a", color: "white", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                    STEP 2
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#1e293b" }}>
                    100% Continuous Surface Biomass Mulching (ఆచ్ఛాదన - Achhadana)
                  </h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#166534", display: "block", marginBottom: "0.3rem" }}>
                      🍂 Mulching Materials:
                    </strong>
                    <p style={{ margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                      Paddy straw, crushed sugarcane bagasse, maize/sorghum post-harvest stalks, coconut coir pith, or dried Gliricidia and Subabul tree prunings. Apply a continuous <strong>3 to 4 inch thick carpet</strong>.
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#166534", display: "block", marginBottom: "0.3rem" }}>
                      🔬 Biological Impact on Topsoil:
                    </strong>
                    <p style={{ margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                      <strong>Never leave soil bare under 42°C sun!</strong> Mulch lowers soil temperature by 6-8°C, stops carbon from oxidizing into atmospheric CO2 gas, eliminates 65% evaporative water loss, and feeds native epigeic earthworms that manufacture natural vermicompost 24/7.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "#16a34a", color: "white", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                    STEP 3
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#1e293b" }}>
                    Inoculated Biochar &amp; Ghana-Jeevamrutham Matrix
                  </h4>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginTop: "0.75rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#166534", display: "block", marginBottom: "0.3rem" }}>
                      🔥 Recalcitrant Carbon (Biochar):
                    </strong>
                    <p style={{ margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                      Pyrolyze woody farm wastes (cotton stalks, pigeonpea sticks, coconut shells) in low-oxygen earth kilns. Unlike raw organic matter which decays in months, Biochar carbon has a <strong>half-life of 300+ years in soil</strong> with 400 m²/g microscopic honeycomb surface area.
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#166534", display: "block", marginBottom: "0.3rem" }}>
                      🧪 Microbial Activation:
                    </strong>
                    <p style={{ margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                      Never apply raw biochar directly. Blend 100 kg crushed biochar with <strong>200 kg Ghana-Jeevamrutham</strong> (desi cow dung + cow urine + jaggery + besan + banyan rhizosphere soil) for 7 days. The pores fill with billions of mycorrhizal spores, creating a self-sustaining fertility bank.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "#16a34a", color: "white", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                    STEP 4
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#1e293b" }}>
                    Conservation Tillage &amp; Zero Deep-Inversion Plowing
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                  Deep mechanical tractor disc inversion plowing cuts fragile fungal mycorrhizae networks into pieces, pulverizes natural soil crumb aggregates, and exposes underground organic matter to air—where it instantly burns into CO2 gas. Transition to <strong>shallow surface aeration (&lt; 2-3 inches)</strong>, broadbed furrows (BBF), or direct zero-till seed drilling (Happy Seeder) directly into standing crop stubble.
                </p>
              </div>

              {/* Step 5 */}
              <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ background: "#16a34a", color: "white", padding: "3px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 800 }}>
                    STEP 5
                  </span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#1e293b" }}>
                    Navadhanya (9-Crop Polyculture) &amp; Glomalin Synthesis
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                  Monocropping starves the soil. Planting a bio-diverse blend of 9 crops (millets, pulses, oilseeds, spices) ensures roots reach multiple depths—from shallow 3-inch fiber networks to 6-foot deep taproots. Each plant species secretes distinct carbohydrate and amino acid root exudates. Soil fungi convert these exudates into <strong>Glomalin</strong>—the indestructible biological &quot;superglue&quot; that locks organic carbon permanently inside soil aggregates for decades.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive SOC Growth & Biomass Sequestration Calculator */}
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: "16px", border: "1.5px solid #86efac", padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#166534" }}>
                  🧮 Interactive Soil Organic Carbon (SOC) Growth &amp; Biomass Calculator
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#15803d" }}>
                  Simulate your farm&apos;s carbon trajectory, biomass generation, water gain, and chemical savings based on acreage and current soil condition:
                </p>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "white", padding: "6px 12px", borderRadius: "10px", border: "1px solid #86efac" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>Farm Size:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={socAcres}
                    onChange={(e) => setSocAcres(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: "48px", padding: "3px 6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: 800, textAlign: "center" }}
                  />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>Acres</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "white", padding: "6px 12px", borderRadius: "10px", border: "1px solid #86efac" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>Current SOC:</span>
                  <select
                    value={currentSoc}
                    onChange={(e) => setCurrentSoc(parseFloat(e.target.value))}
                    style={{ padding: "3px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: 700, fontSize: "0.82rem" }}
                  >
                    <option value={0.30}>0.30% (Severely Depleted)</option>
                    <option value={0.40}>0.40% (Average Indian Farmland)</option>
                    <option value={0.65}>0.65% (Moderately Healthy)</option>
                    <option value={1.00}>1.00% (Living Farm Humus)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1.25rem" }}>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Annual Green Biomass</span>
                <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#166534" }}>{annualBiomassTonnes} Tonnes</div>
                <span style={{ fontSize: "0.72rem", color: "#166534" }}>From Sunhemp + Dhaincha</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Biological Nitrogen</span>
                <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#0369a1" }}>{nitrogenFixedKg} kg Pure N</div>
                <span style={{ fontSize: "0.72rem", color: "#0369a1" }}>Replaces 12-16 bags of Urea</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Extra Water Retained</span>
                <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#0284c7" }}>+{waterRetentionGallons.toLocaleString()} Gal</div>
                <span style={{ fontSize: "0.72rem", color: "#0284c7" }}>30-day drought immunity</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Fertilizer Cost Saved</span>
                <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#b45309" }}>₹{fertilizerCostSaved.toLocaleString()}</div>
                <span style={{ fontSize: "0.72rem", color: "#b45309" }}>Per Year across {socAcres} Acres</span>
              </div>
            </div>

            {/* 4-Year SOC Trajectory Progression */}
            <div style={{ marginTop: "1.25rem", background: "white", padding: "1.25rem", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
              <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block", marginBottom: "0.75rem" }}>
                📈 Projected 4-Year Soil Organic Carbon (SOC) Trajectory:
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                <div style={{ background: "#fef2f2", padding: "0.75rem", borderRadius: "8px", border: "1px solid #fecaca", textAlign: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#991b1b", fontWeight: 700 }}>Baseline (Today)</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#dc2626" }}>{currentSoc.toFixed(2)}%</div>
                  <span style={{ fontSize: "0.7rem", color: "#7f1d1d" }}>Severely Depleted</span>
                </div>
                <div style={{ background: "#fefce8", padding: "0.75rem", borderRadius: "8px", border: "1px solid #fef08a", textAlign: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#854d0e", fontWeight: 700 }}>Year 1 Post-Manure</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#d97706" }}>{(currentSoc + 0.25).toFixed(2)}%</div>
                  <span style={{ fontSize: "0.7rem", color: "#713f12" }}>Biomass Activated</span>
                </div>
                <div style={{ background: "#f0fdf4", padding: "0.75rem", borderRadius: "8px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>Year 2 + Biochar</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#16a34a" }}>{(currentSoc + 0.65).toFixed(2)}%</div>
                  <span style={{ fontSize: "0.7rem", color: "#14532d" }}>Microbes Multiplying</span>
                </div>
                <div style={{ background: "#ecfdf5", padding: "0.75rem", borderRadius: "8px", border: "1px solid #6ee7b7", textAlign: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#065f46", fontWeight: 700 }}>Year 3 + Navadhanya</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#059669" }}>{(currentSoc + 1.15).toFixed(2)}%</div>
                  <span style={{ fontSize: "0.7rem", color: "#064e3b" }}>Living Humus Standard</span>
                </div>
                <div style={{ background: "linear-gradient(135deg, #064e3b, #047857)", color: "white", padding: "0.75rem", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "#a7f3d0", fontWeight: 700 }}>Year 4 Peak Health</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fef08a" }}>{(currentSoc + 1.70).toFixed(2)}%</div>
                  <span style={{ fontSize: "0.7rem", color: "#d1fae5" }}>Forest Humus Grade!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: FARMLAND RAINWATER HARVESTING & AQUIFER RECHARGE ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "rainwater" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Engineering Banner */}
          <div style={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 60%, #075985 100%)",
            color: "white",
            borderRadius: "16px",
            padding: "1.75rem",
            boxShadow: "0 6px 20px rgba(2, 132, 199, 0.25)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.6rem" }}>💧</span>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 900, color: "#ffffff" }}>
                Farmland Rainwater Harvesting (RWH): Slow It, Spread It, Sink It
              </h2>
            </div>
            <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.92rem", color: "#e0f2fe", lineHeight: 1.5 }}>
              In tropical India, 80% of rainfall cascades in just 100 concentrated hours during the monsoon season. Without engineered catchment, this deluge triggers severe sheet erosion, carrying away millions of tonnes of fertile topsoil while borewells dry up by February. Implementing <strong>Farm Ponds (Krishi Honda)</strong> and <strong>Borewell Recharging Filter Pits</strong> captures every drop of rain right where it falls.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <strong style={{ color: "#7dd3fc", display: "block", marginBottom: "0.25rem", fontSize: "0.92rem" }}>
                  🌊 2,00,000 Litres Farm Pond Storage
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#e0f2fe", lineHeight: 1.4, display: "block" }}>
                  A standard 10m × 10m × 3m pond stores 200 kL of water, providing 2 crucial life-saving protective irrigations during 20-day dry spells in Kharif/Rabi.
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <strong style={{ color: "#7dd3fc", display: "block", marginBottom: "0.25rem", fontSize: "0.92rem" }}>
                  ⚡ Borewell Revival: 10,00,000+ L
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#e0f2fe", lineHeight: 1.4, display: "block" }}>
                  Direct filtration pits channel over 10 lakh litres of pure silt-free rainwater deep into depleted aquifers, reviving failed borewells across a 20-acre zone.
                </span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <strong style={{ color: "#7dd3fc", display: "block", marginBottom: "0.25rem", fontSize: "0.92rem" }}>
                  🌱 400% In-Situ Soil Moisture
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#e0f2fe", lineHeight: 1.4, display: "block" }}>
                  Contour swales and bunding slow down surface runoff velocity from 2 m/s to 0.1 m/s, recharging capillary moisture plumes for fruit orchards.
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Engineering Blueprints for Ponds and Borewell Recharge */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
            {/* System 1: Farm Pond (Krishi Honda) */}
            <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #cbd5e1", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ background: "#0284c7", color: "white", padding: "4px 10px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 800 }}>
                  SYSTEM 1
                </span>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                  Farm Pond (కృషి హోండా - Krishi Honda)
                </h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 1rem 0" }}>
                Trapezoidal excavation at the farm&apos;s lowest natural drainage point to capture surface runoff:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.83rem", color: "#334155" }}>
                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong>📐 Standard Dimensions &amp; Capacity:</strong>
                  <div style={{ color: "#0284c7", fontWeight: 700, marginTop: "2px" }}>
                    Top: 10m × 10m • Bottom: 6m × 6m • Depth: 3m • Slope: 1:1 • Capacity: ~2,00,000 Litres
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong>🪨 Inlet Silt-Trap Chamber (సిల్ట్ ట్రాప్):</strong>
                  <p style={{ margin: "2px 0 0", lineHeight: 1.4 }}>
                    Construct a 2m × 1.5m masonry pit packed with 100mm boulders and river sand at the entry. Traps 95% of incoming sediment before clean water pours into the main pond.
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong>🛡️ Seepage Prevention Lining Options:</strong>
                  <ul style={{ margin: "2px 0 0", paddingLeft: "1.2rem", lineHeight: 1.4 }}>
                    <li><strong>Bentonite Clay (Low Cost):</strong> 6-inch compacted layer of bentonite clay mixed with cow dung slurry (10:1 ratio) rolled until watertight.</li>
                    <li><strong>HDPE Geomembrane (Permanent):</strong> 500-micron multi-layered UV-stabilized geomembrane tarpaulin anchored in a 1ft perimeter trench.</li>
                  </ul>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong>🌿 Spillway &amp; Evaporation Shielding:</strong>
                  <p style={{ margin: "2px 0 0", lineHeight: 1.4 }}>
                    Stone-pitch the emergency overflow weir and plant deep-rooted <strong>Vetiver grass (Khus)</strong> to prevent bund washouts. Grow native Azolla or duckweed on the surface to cut evaporation by 40%.
                  </p>
                </div>
              </div>
            </div>

            {/* System 2: Direct Borewell Recharge Filter Pit */}
            <div style={{ background: "white", borderRadius: "16px", border: "1.5px solid #cbd5e1", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ background: "#16a34a", color: "white", padding: "4px 10px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 800 }}>
                  SYSTEM 2
                </span>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                  Direct Borewell Recharge Filter Pit (భూగర్భ జలాల పునరుద్ధరణ)
                </h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 1rem 0" }}>
                Revive low-yielding or dead borewells by injecting filtered monsoon rainwater into deep rock aquifers:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.83rem", color: "#334155" }}>
                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong>⛏️ Excavation Around Existing Casing:</strong>
                  <p style={{ margin: "2px 0 0", lineHeight: 1.4 }}>
                    Excavate a <strong>10ft × 10ft square pit, 10ft deep</strong>, centered directly around the borewell casing pipe.
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong>🔩 Casing Perforation &amp; Mesh Shield:</strong>
                  <p style={{ margin: "2px 0 0", lineHeight: 1.4 }}>
                    Drill 8mm to 10mm holes at 2-inch intervals across the bottom 4 to 6 vertical feet of the casing pipe inside the pit. Wrap tightly with <strong>2 layers of SS 304 wire mesh (100 mesh)</strong> clamped with stainless hose clamps to prevent any sand ingress.
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong>🪨 4 Graded Geological Filtration Strata:</strong>
                  <ol style={{ margin: "2px 0 0", paddingLeft: "1.2rem", lineHeight: 1.4 }}>
                    <li><strong>Bottom (3.5 ft):</strong> Boulders (100-150mm) for rapid drainage into perforations.</li>
                    <li><strong>Second Layer (2.5 ft):</strong> 40mm crushed metal aggregate.</li>
                    <li><strong>Third Layer (2.0 ft):</strong> 20mm blue metal gravel.</li>
                    <li><strong>Top Layer (2.0 ft):</strong> Coarse river sand + activated charcoal layer to capture fine silt.</li>
                  </ol>
                </div>

                <div style={{ background: "#f0fdf4", padding: "0.75rem", borderRadius: "8px", border: "1px solid #86efac", color: "#166534", fontWeight: 700 }}>
                  🌟 Seasonal Inflow: Injects 10 to 15 Lakh Litres directly into subterranean fissures, raising the regional water table by 30 to 100 feet!
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Rainwater Yield & Recharging Potential Calculator */}
          <div style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", borderRadius: "16px", border: "1.5px solid #7dd3fc", padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0369a1" }}>
                  💧 Interactive Farmland Rainwater Catchment &amp; Yield Calculator
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#0284c7" }}>
                  Compute harvestable runoff volume and determine how many Farm Ponds and Borewells you can recharge:
                </p>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "white", padding: "6px 12px", borderRadius: "10px", border: "1px solid #7dd3fc" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0369a1" }}>Catchment:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={rwhAcres}
                    onChange={(e) => setRwhAcres(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: "48px", padding: "3px 6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: 800, textAlign: "center" }}
                  />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0369a1" }}>Acres</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "white", padding: "6px 12px", borderRadius: "10px", border: "1px solid #7dd3fc" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0369a1" }}>Annual Rain:</span>
                  <input
                    type="number"
                    min="300"
                    max="2500"
                    step="50"
                    value={rainfallMm}
                    onChange={(e) => setRainfallMm(Math.max(300, parseInt(e.target.value) || 300))}
                    style={{ width: "60px", padding: "3px 6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: 800, textAlign: "center" }}
                  />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0369a1" }}>mm</span>
                </div>
              </div>
            </div>

            {/* Calculated Results */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.25rem" }}>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #7dd3fc", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Total Rain Falling</span>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0284c7" }}>{(totalRainOnCatchment / 100000).toFixed(1)} Lakh Litres</div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Across {rwhAcres} acres</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #7dd3fc", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Harvestable Runoff</span>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0369a1" }}>{(harvestableRunoffLitres / 100000).toFixed(1)} Lakh Litres</div>
                <span style={{ fontSize: "0.72rem", color: "#0369a1" }}>Based on 35% runoff coeff</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #7dd3fc", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Krishi Honda Ponds</span>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#16a34a" }}>{farmPondsFilled} Ponds</div>
                <span style={{ fontSize: "0.72rem", color: "#16a34a" }}>Full 200,000L capacity</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #7dd3fc", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Protective Irrigation</span>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#b45309" }}>{protectiveIrrigationDays} Days</div>
                <span style={{ fontSize: "0.72rem", color: "#b45309" }}>Life-saving drought shield</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: ANCIENT MILLETS & ARIKELU SUPERFOOD SPOTLIGHT ─── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "millets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* CROWN SUPERFOOD SPOTLIGHT: ARIKELU (KODO MILLET) */}
          <div style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fed7aa 100%)",
            border: "2px solid #f59e0b",
            borderRadius: "18px",
            padding: "1.75rem",
            boxShadow: "0 8px 24px rgba(245, 158, 11, 0.15)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ maxWidth: "720px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ background: "#d97706", color: "white", padding: "4px 12px", borderRadius: "100px", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                    👑 CROWN SUPERFOOD SPOTLIGHT
                  </span>
                  <span style={{ background: "#16a34a", color: "white", padding: "4px 10px", borderRadius: "100px", fontWeight: 700, fontSize: "0.75rem" }}>
                    Dr. Khadar Vali Siridhanya Protocol
                  </span>
                </div>
                <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.6rem", fontWeight: 900, color: "#78350f" }}>
                  Arikelu (Kodo Millet / Paspalum scrobiculatum / వరగు / కోదో)
                </h2>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#92400e", lineHeight: 1.5 }}>
                  Arikelu is the undisputed emperor of ancestral Indian super-grains. Cultivated in the Deccan plateau for over 3,000 years, Arikelu is renowned for its miraculous medicinal properties: <strong>ultra-low Glycemic Index (GI 50)</strong> that reverses Type-2 diabetes, the highest polyphenol antioxidant concentration of any grain, and its classical status as the ultimate purifier of blood, lymphatic fluid, and bone marrow.
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ background: "white", padding: "0.75rem 1.25rem", borderRadius: "14px", border: "1.5px solid #f59e0b", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)" }}>
                  <span style={{ fontSize: "0.72rem", color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Govt MSP</span>
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#166534" }}>₹4,100 / Qntl</div>
                  <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 600 }}>High Market Premium</span>
                </div>
              </div>
            </div>

            {/* 4 Health Superpowers Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: "1.25rem", marginBottom: "0.3rem" }}>🩺</div>
                <strong style={{ color: "#92400e", display: "block", fontSize: "0.92rem", marginBottom: "0.2rem" }}>
                  Type-2 Diabetes Reversal
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#78350f", lineHeight: 1.4, display: "block" }}>
                  GI of 50 releases slow, sustained glucose over 6-8 hours. Completely eliminates post-meal sugar spikes and reduces HbA1c levels.
                </span>
              </div>

              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: "1.25rem", marginBottom: "0.3rem" }}>🛡️</div>
                <strong style={{ color: "#92400e", display: "block", fontSize: "0.92rem", marginBottom: "0.2rem" }}>
                  Richest in Quercetin &amp; Polyphenols
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#78350f", lineHeight: 1.4, display: "block" }}>
                  Contains 3.8x more polyphenols than wheat and 8.5x more than white rice. Ferociously scavenges free radicals, preventing cellular aging.
                </span>
              </div>

              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: "1.25rem", marginBottom: "0.3rem" }}>🩸</div>
                <strong style={{ color: "#92400e", display: "block", fontSize: "0.92rem", marginBottom: "0.2rem" }}>
                  Blood &amp; Bone Marrow Purifier
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#78350f", lineHeight: 1.4, display: "block" }}>
                  Prescribed in Dr. Khadar Vali&apos;s protocols for rapid platelet recovery in dengue fever, anemia management, and lymphatic cleansing.
                </span>
              </div>

              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: "1.25rem", marginBottom: "0.3rem" }}>🌾</div>
                <strong style={{ color: "#92400e", display: "block", fontSize: "0.92rem", marginBottom: "0.2rem" }}>
                  Survives on 150mm Rainfall
                </strong>
                <span style={{ fontSize: "0.82rem", color: "#78350f", lineHeight: 1.4, display: "block" }}>
                  Thrives in gravelly drylands with 80% less water than rice. Natural silica hull repels pests without any chemical pesticides!
                </span>
              </div>
            </div>

            {/* Arikelu vs White Rice vs Refined Wheat Head-to-Head Table */}
            <div style={{ marginTop: "1.5rem", background: "white", borderRadius: "12px", padding: "1.25rem", border: "1px solid #fde68a", overflowX: "auto" }}>
              <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block", marginBottom: "0.75rem" }}>
                ⚔️ Nutritional Showdown: Arikelu (Kodo) vs Polished White Rice vs Refined Wheat
              </strong>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fef3c7", borderBottom: "2px solid #fcd34d" }}>
                    <th style={{ padding: "8px 12px", color: "#92400e" }}>Nutrient / Metric (Per 100g)</th>
                    <th style={{ padding: "8px 12px", color: "#166534", fontWeight: 800 }}>🌾 Ancient Arikelu</th>
                    <th style={{ padding: "8px 12px", color: "#64748b" }}>🍚 Polished White Rice</th>
                    <th style={{ padding: "8px 12px", color: "#64748b" }}>🍞 Refined Wheat (Maida)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Dietary Fiber (Soluble + Insoluble)</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>9.0% to 10.2% (Super-High)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>0.2% (Negligible)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>1.2% (Very Low)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Glycemic Index (GI)</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>50 (Ultra-Low)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>78 (Dangerous Spike)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>72 (Rapid Spike)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Iron Content</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>4.8 mg</td>
                    <td style={{ padding: "8px 12px" }}>0.7 mg</td>
                    <td style={{ padding: "8px 12px" }}>1.5 mg</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Antioxidant Polyphenols</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>Highest (Quercetin rich)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>Zero</td>
                    <td style={{ padding: "8px 12px" }}>Low</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Irrigation Requirement</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>250 mm (Rainfed)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>1,250 mm (Water Guzzler)</td>
                    <td style={{ padding: "8px 12px" }}>650 mm</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Traditional Arikelu Healing Recipes */}
            <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #fde68a" }}>
                <strong style={{ fontSize: "0.88rem", color: "#92400e", display: "block", marginBottom: "0.3rem" }}>
                  🥣 Fermented Siridhanya Ambali (Probiotic Elixir)
                </strong>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#78350f", lineHeight: 1.5 }}>
                  Boil 1 cup coarse Arikelu in 6 cups water in an earthen mud pot. Tie the mouth with a breathable cotton cloth and let ferment for 6 to 8 hours under shade. Supplies billions of live <em>Bifidobacteria</em> to cure chronic constipation and gut dysbiosis.
                </p>
              </div>

              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #fde68a" }}>
                <strong style={{ fontSize: "0.88rem", color: "#92400e", display: "block", marginBottom: "0.3rem" }}>
                  🍲 Diabetic-Friendly Arikelu Pongal
                </strong>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#78350f", lineHeight: 1.5 }}>
                  Pressure cook 1 cup soaked Arikelu with 1/2 cup yellow moong dal and rock salt. Temper with A2 cow ghee, crushed cumin, fresh ginger, and whole black peppercorns for an anti-inflammatory, low-glycemic traditional breakfast.
                </p>
              </div>
            </div>
          </div>

          {/* Explore all 8 Super-Millets of India */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
              Explore the 8 Ancient Millets of India (Shree Anna)
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", fontSize: "0.85rem", color: "#64748b" }}>
              Select any millet to inspect its agricultural cultivation specs, soil regeneration benefits, and consumer health power:
            </p>

            {/* Millet Buttons */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              {Object.keys(MILLETS).map(key => {
                const isSel = selectedMillet === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedMillet(key)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "100px",
                      border: isSel ? "2px solid #d97706" : "1px solid #cbd5e1",
                      background: isSel ? "#fef3c7" : "white",
                      color: isSel ? "#92400e" : "#475569",
                      fontWeight: isSel ? 800 : 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    <span>🌾</span>
                    <span>{MILLETS[key].name.split(" ")[0]}</span>
                    {MILLETS[key].isSpotlight && (
                      <span style={{ background: "#d97706", color: "white", fontSize: "0.65rem", padding: "1px 6px", borderRadius: "100px" }}>
                        Spotlight
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Millet Card */}
            {(() => {
              const m = MILLETS[selectedMillet];
              return (
                <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#0f172a" }}>
                          {m.name}
                        </h4>
                        <span style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
                          ({m.botanical})
                        </span>
                      </div>
                      <span style={{ fontSize: "0.82rem", color: "#059669", fontWeight: 700 }}>
                        ⏳ Harvest Cycle: {m.harvestDays} • Ideal: {m.idealSeason}
                      </span>
                    </div>
                    <div style={{ background: "#dcfce7", color: "#166534", padding: "6px 14px", borderRadius: "100px", fontWeight: 800, fontSize: "0.85rem" }}>
                      Govt MSP: {m.mspPerQuintal}
                    </div>
                  </div>

                  {/* Superfood Badge */}
                  <div style={{ background: "#fffbeb", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #fde68a", color: "#92400e", fontWeight: 700, fontSize: "0.85rem", marginBottom: "1rem" }}>
                    {m.superfoodBadge} — {m.keyHighlight}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                    <div style={{ background: "white", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "#0369a1", fontWeight: 800, fontSize: "0.95rem" }}>
                        <Droplets size={18} /> Water &amp; Soil Regeneration Impact
                      </div>
                      <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>
                        <strong>Water Savings:</strong> {m.waterSaving}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>
                        <strong>Soil Health:</strong> {m.soilImpact}
                      </p>
                    </div>

                    <div style={{ background: "white", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "#dc2626", fontWeight: 800, fontSize: "0.95rem" }}>
                        <Heart size={18} /> Consumer Health Superpowers
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>
                        {m.healthBenefits}
                      </p>
                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>
                        <span><strong>Fiber:</strong> {m.fiber}</span>
                        <span><strong>GI:</strong> {m.gi}</span>
                        <span><strong>Iron:</strong> {m.iron}</span>
                      </div>
                    </div>
                  </div>

                  {/* Direct Action */}
                  <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => onAddMillet && onAddMillet()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        padding: "0.65rem 1.25rem",
                        borderRadius: "100px",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
                      }}
                    >
                      <span>🌾 List {m.name.split(" ")[0]} Crop on Marketplace</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: THAATI BELLAM (PALMYRA PALM JAGGERY) & AGRO-FORESTRY ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "thaati_bellam" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Main Thaati Bellam Showcase */}
          <div style={{
            background: "linear-gradient(135deg, #451a03 0%, #78350f 60%, #9a3412 100%)",
            color: "white",
            borderRadius: "18px",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(69, 26, 3, 0.25)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", right: "-20px", top: "-20px", opacity: 0.12, fontSize: "12rem", pointerEvents: "none" }}>
              🌴
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ background: "#ea580c", color: "white", padding: "4px 12px", borderRadius: "100px", fontWeight: 800, fontSize: "0.75rem" }}>
                ANCIENT UNREFINED NATURAL SWEETENER
              </span>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#fed7aa", padding: "4px 12px", borderRadius: "100px", fontWeight: 700, fontSize: "0.75rem" }}>
                తాటి బెల్లం • Karupatti • Borassus Flabellifer
              </span>
            </div>

            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, margin: "0 0 0.5rem 0", lineHeight: 1.2 }}>
              Pure Traditional Thaati Bellam (Palmyra Palm Jaggery / తాటి బెల్లం)
            </h2>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#ffedd5", maxWidth: "820px", lineHeight: 1.5 }}>
              Hand-crafted from the unfermented morning sweet sap (<em>Neera</em> / <em>Padaneer</em>) of the majestic Palmyra Palm (తాటి చెట్టు), Thaati Bellam is India&apos;s most nutrient-dense unrefined sweetener. Unlike refined white sugar bleached with sulphur dioxide and filtered through bone-char, Thaati Bellam is boiled purely in heavy shallow iron cauldrons over palm frond fires.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: "0.75rem", color: "#fed7aa" }}>Bio-Available Iron</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff" }}>11.5 mg / 100g</div>
                <span style={{ fontSize: "0.72rem", color: "#ffedd5" }}>60x higher than white sugar</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: "0.75rem", color: "#fed7aa" }}>Natural Calcium</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff" }}>1,050 mg / 100g</div>
                <span style={{ fontSize: "0.72rem", color: "#ffedd5" }}>Exceptional bone strength</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: "0.75rem", color: "#fed7aa" }}>Glycemic Index (GI)</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fef08a" }}>35 - 40 (Low)</div>
                <span style={{ fontSize: "0.72rem", color: "#ffedd5" }}>Zero insulin spikes</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: "0.75rem", color: "#fed7aa" }}>Plant Vitamin B12</span>
                <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff" }}>Natural Complex</div>
                <span style={{ fontSize: "0.72rem", color: "#ffedd5" }}>Rare in vegetarian diets</span>
              </div>
            </div>
          </div>

          {/* Health Benefits & Processing Guide */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {/* Health Superpowers */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#78350f", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Heart size={20} color="#ea580c" />
                Medicinal &amp; Ayurvedic Healing Properties
              </h3>

              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#334155", lineHeight: 1.7 }}>
                <li><strong>Cures Chronic Iron Deficiency &amp; Anemia:</strong> High bio-available iron restores red blood cell count and eliminates maternal exhaustion naturally.</li>
                <li><strong>Respiratory &amp; Lung Cleanser:</strong> Traditional Ayurvedic remedy for asthma, chronic dry cough, and seasonal bronchitis. Soothes mucosal linings.</li>
                <li><strong>Post-Pregnancy Uterine Healing:</strong> Given to new nursing mothers for 40 days to expel postnatal toxins, stimulate breast milk, and strengthen the pelvis.</li>
                <li><strong>Electrolyte &amp; Potassium Balance:</strong> With 1,000mg potassium per 100g, it prevents muscle cramps, water retention, and high blood pressure.</li>
                <li><strong>Zero Refined Chemicals:</strong> Never treated with bleaching sulphur, bone-char, or phosphoric acid found in supermarket white sugars.</li>
              </ul>
            </div>

            {/* Palmyra Agro-Forestry for Farmers */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#166534", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Trees size={20} color="#16a34a" />
                Farmer Economics: Zero-Input Palmyra Agro-Forestry
              </h3>

              <div style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 0.75rem 0" }}>
                  Palmyra trees (Borassus flabellifer) planted along field boundaries act as permanent cyclone windbreaks and erosion barriers:
                </p>
                <ul style={{ margin: "0 0 1rem 0", paddingLeft: "1.2rem" }}>
                  <li><strong>Zero Irrigation:</strong> Roots tap groundwater 30 feet below without competing with surface crops.</li>
                  <li><strong>Zero Chemical Inputs:</strong> Naturally impervious to all pests, requiring ₹0 fertilizer or sprays.</li>
                  <li><strong>High Passive Income:</strong> 50 boundary palms yield 1,200 to 1,500 kg of pure Thaati Bellam annually, generating <strong>₹1,80,000 to ₹2,50,000 net profit</strong>.</li>
                </ul>

                <div style={{ background: "#f0fdf4", padding: "0.75rem", borderRadius: "10px", border: "1px solid #86efac", fontSize: "0.82rem", color: "#166534", fontWeight: 700 }}>
                  🌟 Certified Farmers can list authentic Thaati Bellam on the Marketplace at ₹180 - ₹220 / kg!
                </div>
              </div>
            </div>
          </div>

          {/* Nutritional Showdown: Thaati Bellam vs Cane Jaggery vs White Sugar */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
              📊 Sweetener Comparison: Thaati Bellam vs Cane Jaggery vs White Sugar
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#fef3c7", borderBottom: "2px solid #fcd34d" }}>
                    <th style={{ padding: "8px 12px", color: "#92400e" }}>Parameter (Per 100g)</th>
                    <th style={{ padding: "8px 12px", color: "#78350f", fontWeight: 800 }}>🌴 Thaati Bellam (Palm)</th>
                    <th style={{ padding: "8px 12px", color: "#64748b" }}>🎋 Sugarcane Jaggery</th>
                    <th style={{ padding: "8px 12px", color: "#dc2626" }}>⚪ Refined White Sugar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Iron Content</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>11.5 mg (Highest)</td>
                    <td style={{ padding: "8px 12px" }}>2.5 mg</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>0.05 mg (Trace)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Calcium Content</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>1,050 mg (Super-High)</td>
                    <td style={{ padding: "8px 12px" }}>80 mg</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>1 mg</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Glycemic Index (GI)</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>35 - 40 (Low)</td>
                    <td style={{ padding: "8px 12px" }}>55 - 60 (Medium)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>80+ (Severe Spike)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Chemical Bleaching</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>Zero (Pure Woodfire)</td>
                    <td style={{ padding: "8px 12px" }}>Low (Vegetable okra mucilage)</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>Sulphur dioxide + Bone-char</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 12px", fontWeight: 600 }}>Vitamin B12</td>
                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#16a34a" }}>Present (Natural)</td>
                    <td style={{ padding: "8px 12px" }}>Trace</td>
                    <td style={{ padding: "8px 12px", color: "#dc2626" }}>Zero</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Direct Marketplace Actions */}
            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                to="/marketplace?category=byproduct"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#78350f",
                  color: "white",
                  textDecoration: "none",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "100px",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 12px rgba(120, 53, 15, 0.25)"
                }}
              >
                <span>🛒 View Thaati Bellam in Marketplace</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 5: CONTACT VS SYSTEMIC PESTICIDES ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "pesticides" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Scientific Comparison Card */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={22} color="#059669" />
              Why Contact-Based Pesticides Make Soil Vastly More Fertile
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem 0" }}>
              The fundamental agronomic difference between contact and systemic chemicals dictates whether your farm soil thrives with living biology or becomes an inert, chemical-dependent dust bowl.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {/* Green Card: Contact Based */}
              <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: "14px", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ background: "#16a34a", color: "white", padding: "4px 8px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 800 }}>
                    RECOMMENDED
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#166534" }}>
                    Contact &amp; Botanical Sprays
                  </h3>
                </div>

                <ul style={{ paddingLeft: "1.2rem", margin: "0 0 1rem 0", fontSize: "0.87rem", color: "#166534", lineHeight: 1.6 }}>
                  <li><strong>Acts Strictly on the Exterior:</strong> Destroys pest cuticles or repels them upon direct surface contact.</li>
                  <li><strong>Zero Vascular Infiltration:</strong> Does NOT enter plant xylem or phloem sap. The vegetable pulp remains 100% clean and chemical-free for consumers.</li>
                  <li><strong>Protects Earthworms &amp; Mycorrhizae:</strong> Natural extracts (Neem, Agniastra) break down into harmless organic matter under sunlight within 48 hours without sterilizing the soil microbiome.</li>
                  <li><strong>Preserves Groundwater:</strong> Zero synthetic chemical leaching into borewells and drinking water reserves.</li>
                  <li><strong>Higher Market Value:</strong> Sells at premium organic rates with direct customer trust.</li>
                </ul>

                <div style={{ background: "#dcfce7", padding: "0.75rem", borderRadius: "10px", fontSize: "0.82rem", color: "#14532d", fontWeight: 700 }}>
                  🌟 Platform Bonus: Earns +15 points towards Farmer Platinum Trust Tier!
                </div>
              </div>

              {/* Red Card: Systemic Pesticides */}
              <div style={{ background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: "14px", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span style={{ background: "#dc2626", color: "white", padding: "4px 8px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 800 }}>
                    AVOID / HARMFUL
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#991b1b" }}>
                    Synthetic Systemic Chemicals
                  </h3>
                </div>

                <ul style={{ paddingLeft: "1.2rem", margin: "0 0 1rem 0", fontSize: "0.87rem", color: "#991b1b", lineHeight: 1.6 }}>
                  <li><strong>Vascular Absorption:</strong> Absorbed through roots and leaves, circulating through every cell, fruit flesh, and flower nectar.</li>
                  <li><strong>Soil Sterilization:</strong> Destroys beneficial nitrogen-fixing Azotobacter, rhizobia, and phosphorus-solubilizing bacteria in the rhizosphere.</li>
                  <li><strong>Earthworm Mortality:</strong> Causes earthworms to flee or perish, leading to dense, un-aerated soil compaction and loss of natural humus.</li>
                  <li><strong>Poisons Pollinators:</strong> Neonicotinoid systemics enter nectar, disorienting honeybees and reducing cross-pollination yields by 30%.</li>
                  <li><strong>Pesticide Resistance Cycle:</strong> Creates super-pests, forcing farmers to buy increasingly expensive chemical cocktails every season.</li>
                </ul>

                <div style={{ background: "#fee2e2", padding: "0.75rem", borderRadius: "10px", fontSize: "0.82rem", color: "#7f1d1d", fontWeight: 700 }}>
                  ⚠️ Warning: High systemic chemical usage reduces platform trust ratings and flags crops.
                </div>
              </div>
            </div>
          </div>

          {/* Botanical Preparation Guide (DIY Recipes) */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  🏺 DIY Organic Contact Spray Masterclasses (Zero Cost on Farm)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Prepare 100% organic, highly effective contact sprays using farm-available native botanicals and cow products.
                </p>
              </div>

              {/* Recipe Selector Pills */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {Object.keys(RECIPES).map(key => (
                  <button
                    key={key}
                    onClick={() => setActiveRecipe(key)}
                    style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: "8px",
                      border: activeRecipe === key ? "1.5px solid #059669" : "1px solid #cbd5e1",
                      background: activeRecipe === key ? "#ecfdf5" : "white",
                      color: activeRecipe === key ? "#065f46" : "#475569",
                      fontWeight: activeRecipe === key ? 800 : 600,
                      fontSize: "0.82rem",
                      cursor: "pointer"
                    }}
                  >
                    {RECIPES[key].name.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Recipe Details */}
            {(() => {
              const recipe = RECIPES[activeRecipe];
              return (
                <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1.5px solid #e2e8f0", padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{recipe.name}</h4>
                      <span style={{ fontSize: "0.82rem", color: "#059669", fontWeight: 700 }}>🎯 Target Pests: {recipe.target}</span>
                    </div>
                    <span style={{ fontSize: "0.78rem", background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: "100px", fontWeight: 700 }}>
                      ⏳ {recipe.duration}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.88rem", color: "#334155", lineHeight: 1.5, marginBottom: "1.25rem", background: "white", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <strong>Biological Action:</strong> {recipe.effect}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                    {/* Ingredients */}
                    <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block", marginBottom: "0.5rem" }}>
                        📋 Required Raw Ingredients
                      </strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {recipe.ingredients.map((ing, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.83rem", padding: "4px 0", borderBottom: i < recipe.ingredients.length - 1 ? "1px dashed #e2e8f0" : "none" }}>
                            <span style={{ color: "#334155" }}>{ing.item}</span>
                            <strong style={{ color: "#059669" }}>{ing.qty}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-Step Preparation */}
                    <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block", marginBottom: "0.5rem" }}>
                        🥣 Step-by-Step Brewing Instructions
                      </strong>
                      <ol style={{ paddingLeft: "1.2rem", margin: 0, fontSize: "0.83rem", color: "#334155", lineHeight: 1.6 }}>
                        {recipe.steps.map((step, idx) => (
                          <li key={idx} style={{ marginBottom: "0.3rem" }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 6: PERMACULTURE & LIVING SOIL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "permaculture" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Permaculture Principles Grid */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sprout size={22} color="#059669" />
              6 Core Permaculture Principles for Indian Farmlands
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem 0" }}>
              Permaculture mimics natural forest ecosystems, creating self-sustaining, drought-proof, pest-resistant farms with multi-tier cropping and active living soil biology.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {[
                {
                  icon: "🌿",
                  title: "1. Multi-Tier Companion Guilds",
                  desc: "Intercrop tall crops (Maize, Jowar), medium fruit/veg (Tomato, Brinjal), and groundcover legumes (Cowpea, Moong) to maximize photosynthesis."
                },
                {
                  icon: "🍂",
                  title: "2. Continuous Living Mulch (Achhadana)",
                  desc: "Never leave topsoil bare. Mulch with crop straw, dry leaves, or live creeping cover crops to retain 60% more moisture and feed earthworms."
                },
                {
                  icon: "💧",
                  title: "3. Contour Swales & Rain Catchment",
                  desc: "Dig on-contour swales and bunds to slow, spread, and sink every drop of rainwater directly into groundwater tables instead of allowing runoff."
                },
                {
                  icon: "🌼",
                  title: "4. Beneficial Insect Trap Cropping",
                  desc: "Surround vegetable fields with borders of Marigolds (repels nematodes), Mustard, and Sunflower (attracts beneficial predatory wasps & ladybugs)."
                },
                {
                  icon: "🌱",
                  title: "5. Zero Deep-Tillage Practice",
                  desc: "Avoid deep mechanical inversion plowing that bakes soil microbes in the sun. Practice shallow aeration to preserve fungal hyphae networks."
                },
                {
                  icon: "🔄",
                  title: "6. Circular Nutrient Loops",
                  desc: "Re-introduce post-harvest stalks, cold storage waste, and biogas slurry back into field composting, completing zero-waste circular loops."
                }
              ].map((card, i) => (
                <div key={i} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{card.icon}</div>
                  <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block", marginBottom: "0.3rem" }}>{card.title}</strong>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Jeevamrutham Bio-Inoculant Engine */}
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)", borderRadius: "16px", border: "1.5px solid #86efac", padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#166534" }}>
                  🧪 Interactive Jeevamrutham (Living Microbiology) Calculator
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#15803d" }}>
                  1 single gram of fresh indigenous cow dung contains over 300 to 500 crore beneficial microbes. Jeevamrutham multiplies them 100x.
                </p>
              </div>

              {/* Acre Scaler */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "white", padding: "6px 12px", borderRadius: "10px", border: "1px solid #86efac" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>Calculate For:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={acreCount}
                  onChange={(e) => setAcreCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: "50px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontWeight: 800, textAlign: "center" }}
                />
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>Acres</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Water</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0369a1" }}>{200 * acreCount} L</div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Clean chlorine-free water</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Fresh Desi Cow Dung</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#166534" }}>{10 * acreCount} kg</div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Microbial seed inoculant</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Desi Cow Urine</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#d97706" }}>{10 * acreCount} L</div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Urea &amp; mineral catalyst</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Organic Jaggery</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#b45309" }}>{2 * acreCount} kg</div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Carbon &amp; energy for bacteria</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Gram Flour (Besan)</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#9333ea" }}>{2 * acreCount} kg</div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Protein source for microbes</span>
              </div>
              <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Living Forest Soil</span>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#475569" }}>{acreCount} Handfuls</div>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>From under Banyan tree</span>
              </div>
            </div>

            <div style={{ marginTop: "1rem", background: "white", padding: "0.85rem 1rem", borderRadius: "10px", fontSize: "0.85rem", color: "#166534", border: "1px solid #bbf7d0" }}>
              💡 <strong>Application Method:</strong> Stir twice daily for 48 to 72 hours under tree shade. Apply through drip irrigation or flood irrigation channels twice every month. Transforms barren soil into rich, spongy, earthworm-filled black humus within 1 season.
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── TAB 7: BOTANICAL DEFENSE: NSKE 5%, CORN BORDERS & CATCH CROPS ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "botanical_defense" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Header Banner */}
          <div style={{
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
            color: "white", borderRadius: "18px", padding: "2rem",
            boxShadow: "0 10px 30px rgba(6, 78, 59, 0.25)", position: "relative", overflow: "hidden"
          }}>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                <span>🛡️ Zero-Chemical Pest Barrier Architecture (జీవ రక్షణ కవచం)</span>
              </div>
              <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.8rem", fontWeight: 900 }}>
                Botanical Defense Guilds: NSKE 5%, Corn Borders &amp; Catch Crops
              </h2>
              <p style={{ margin: 0, maxWidth: "760px", fontSize: "0.95rem", color: "#d1fae5", lineHeight: 1.6 }}>
                Synthetic pesticides cause catastrophic pest resurgence and toxic chemical residues. Certified organic farmers eliminate synthetic sprays by deploying a three-layered biological fortress: <strong>Neem Seed Kernel Extract (NSKE 5%)</strong> botanical contact repellent, <strong>4-tier Corn perimeter shields</strong> that stop chemical drift, and <strong>decoy Catch Crops</strong> that lure pests away naturally.
              </p>
            </div>
          </div>

          {/* Sub-Navigation Buttons */}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", background: "#f8fafc", padding: "8px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            {[
              { id: "nske", label: "🌿 NSKE 5% Preparation (వేప గింజల కషాయం)", icon: "🧪" },
              { id: "corn_border", label: "🌽 4-Row Corn Border Shields (మొక్కజొన్న సరిహద్దు)", icon: "🛡️" },
              { id: "catch_crops", label: "🎯 Catch & Trap Crop Matrix (ఆకర్షక పంటలు)", icon: "🌼" },
              { id: "field_layout", label: "🗺️ Integrated 3-Tier Farm Blueprint", icon: "📐" }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveDefenseSubtab(sub.id)}
                style={{
                  padding: "0.65rem 1.1rem",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: activeDefenseSubtab === sub.id ? 800 : 600,
                  fontSize: "0.85rem",
                  background: activeDefenseSubtab === sub.id ? "#065f46" : "white",
                  color: activeDefenseSubtab === sub.id ? "white" : "#475569",
                  boxShadow: activeDefenseSubtab === sub.id ? "0 4px 12px rgba(6, 95, 70, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.2s"
                }}
              >
                <span>{sub.icon}</span>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>

          {/* SUBTAB 1: NSKE 5% */}
          {activeDefenseSubtab === "nske" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Interactive NSKE Preparation Calculator */}
              <div style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)", borderRadius: "16px", border: "1.5px solid #a7f3d0", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#065f46", fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>🧮 NSKE 5% Acreage Dosage &amp; Cost Savings Calculator</span>
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#047857" }}>
                      Accurately calculate neem seed requirements, water volume, and financial savings over toxic synthetics.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "white", padding: "0.5rem 1rem", borderRadius: "100px", border: "1px solid #6ee7b7" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#065f46" }}>Farm Size:</span>
                    <input
                      type="range" min="1" max="20" step="1"
                      value={nskeAcres}
                      onChange={(e) => setNskeAcres(Number(e.target.value))}
                      style={{ accentColor: "#059669", cursor: "pointer", width: "120px" }}
                    />
                    <span style={{ fontWeight: 900, color: "#065f46", minWidth: "55px" }}>{nskeAcres} {nskeAcres === 1 ? "Acre" : "Acres"}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Neem Seed Kernels</span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#166534" }}>{5 * nskeAcres} kg</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Mature 3-8 month dried seeds</span>
                  </div>
                  <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Soapnut / Khadi Soap</span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#d97706" }}>{100 * nskeAcres} g</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Emulsifier &amp; leaf sticker</span>
                  </div>
                  <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Soaking Water</span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0284c7" }}>{10 * nskeAcres} L</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Porous cotton pouch soak</span>
                  </div>
                  <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Final Spray Dilution</span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0369a1" }}>{100 * nskeAcres} L</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Fine knapsack nozzle spray</span>
                  </div>
                  <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1.5px solid #86efac", textAlign: "center" }}>
                    <span style={{ fontSize: "0.72rem", color: "#166534", textTransform: "uppercase", fontWeight: 800 }}>💰 Farmer Savings</span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#15803d" }}>₹{(1650 * nskeAcres).toLocaleString()}</div>
                    <span style={{ fontSize: "0.72rem", color: "#15803d" }}>vs synthetic chemicals</span>
                  </div>
                </div>
              </div>

              {/* 6-Step SOP Guide */}
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
                <h3 style={{ margin: "0 0 1rem", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📋 6-Step Standard Operating Procedure (వేప గింజల కషాయం తయారీ)</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                  {[
                    { step: "01", title: "Seed Selection & Drying", desc: "Collect ripe neem fruits, depulp them, and dry under shade. Use kernels stored for 3 to 8 months. Kernels must be aromatic and light cream/brown, never black or mould-infested." },
                    { step: "02", title: "Pounding (Not Grinding)", desc: "Gently pound 5kg neem seed kernels into coarse gravel-sized grist using a wooden mortar. Do NOT grind into fine flour in high-speed mills, as oil friction overheats and destroys Azadirachtin." },
                    { step: "03", title: "Overnight Soaking Pouch", desc: "Tie the coarse neem powder into a porous muslin cloth pouch. Immerse the pouch in a plastic or earthen vessel containing 10 Litres of chlorine-free clean well/rainwater for 12 hours overnight." },
                    { step: "04", title: "Emulsion Squeezing", desc: "In the morning, repeatedly squeeze and massage the pouch inside the water until the water turns into a thick, concentrated, milky-white botanical emulsion containing maximum bitter limonoids." },
                    { step: "05", title: "Natural Surfactant Addition", desc: "Dissolve 100g mild khadi soap or crushed soapnut (Kunkudukai) solution in 1L warm water and add to the extract. This acts as a harmless biological wetting agent so spray adheres to waxy foliage." },
                    { step: "06", title: "Dusk Foliage Application", desc: "Dilute the milky concentrate to 100 Litres with clean water. Spray using a clean knapsack sprayer late in the evening (after 4:30 PM) to avoid UV photodegradation of Azadirachtin." }
                  ].map((s) => (
                    <div key={s.step} style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1rem", position: "relative" }}>
                      <div style={{ background: "#065f46", color: "white", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                        {s.step}
                      </div>
                      <h4 style={{ margin: "0 0 0.35rem", fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>{s.title}</h4>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mechanism of Action & Target Pests */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
                <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 800, color: "#065f46" }}>
                    🔬 Botanical Mode of Action (Why Pests Cannot Resist)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.84rem", color: "#334155", lineHeight: 1.6 }}>
                    <li><strong>Potent Antifeedant:</strong> Pests take one taste of treated leaves, become nauseated, and immediately cease feeding within 15 minutes.</li>
                    <li><strong>Insect Growth Disrupter (IGR):</strong> Blocks Ecdysone hormone production, permanently preventing caterpillars and nymphs from molting into adults.</li>
                    <li><strong>Oviposition Deterrent:</strong> Female moths and butterflies refuse to lay eggs on NSKE-treated foliage.</li>
                    <li><strong>100% Predator-Safe:</strong> Zero harm to honeybees, ladybirds, spiders, earthworms, or predatory wasps who feed on nectar or insects rather than leaves.</li>
                  </ul>
                </div>

                <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.25rem" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                    🎯 Target Pests Successfully Suppressed
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                    {[
                      { name: "Helicoverpa (Pod Borer)", rate: "94% Control" },
                      { name: "Spodoptera (Armyworm)", rate: "92% Control" },
                      { name: "Diamondback Moth", rate: "96% Control" },
                      { name: "Whiteflies & Aphids", rate: "89% Control" },
                      { name: "Thrips & Mites", rate: "88% Control" },
                      { name: "Shoot & Fruit Borers", rate: "91% Control" }
                    ].map((p, i) => (
                      <div key={i} style={{ background: "#f0fdf4", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#166534", fontWeight: 600 }}>{p.name}</span>
                        <strong style={{ color: "#15803d" }}>{p.rate}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: CORN BORDERS */}
          {activeDefenseSubtab === "corn_border" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "2rem" }}>🌽</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                      4-Tier Corn Border Barrier System (మొక్కజొన్న సరిహద్దు రక్షణ)
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                      Dense perimeter windbreaks and biological shields protecting organic crops from pesticide drift.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginTop: "1rem" }}>
                  <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1px solid #cbd5e1", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                      <span>🛡️ 1. Physical Chemical Drift Shield</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#475569", lineHeight: 1.55 }}>
                      When neighboring non-organic farmers spray toxic synthetic chemicals (like Glyphosate, Chlorpyrifos, or Cypermethrin), fine aerosol droplets drift across property lines. A dense perimeter of 3 to 4 rows of tall Indian Maize (*Zea mays*) or Sorghum (*Jowar*) creates an impassable living filter, capturing 98% of airborne droplets and preserving organic certification integrity.
                    </p>
                  </div>

                  <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1px solid #cbd5e1", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                      <span>🐞 2. Predator Nursery &amp; Insect Bank</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#475569", lineHeight: 1.55 }}>
                      Corn produces copious amounts of high-protein pollen. This pollen serves as a critical food source sustaining beneficial predators—including Ladybird Beetles (*Coccinellidae*), Green Lacewings (*Chrysoperla*), and predatory spiders—during early crop stages before insect pests appear. Once pests arrive, armies of resident predators march into your cash crop!
                    </p>
                  </div>

                  <div style={{ background: "#f8fafc", borderRadius: "14px", border: "1px solid #cbd5e1", padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0369a1", fontWeight: 800, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                      <span>💨 3. Microclimate Windbreak &amp; Transpiration Saver</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#475569", lineHeight: 1.55 }}>
                      High velocity dry summer winds desiccate tender vegetable leaves, causing blossom drop and excessive moisture evaporation. The tall corn barrier slows boundary wind speed by 40-60%, reducing water evaporation from your soil and boosting crop yields by 15-20%.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: "1.25rem", background: "#fef3c7", padding: "1rem", borderRadius: "12px", border: "1px solid #fde68a", fontSize: "0.85rem", color: "#92400e" }}>
                  📌 <strong>Planting Architecture Rule:</strong> Sow the 3-4 border rows of Corn or Sorghum 15 to 20 days <em>prior</em> to planting the central cash crop (vegetables, chillies, or millets). By the time your main crop germinates, the corn wall is already 2-3 feet high, offering immediate defense from day one.
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: CATCH & TRAP CROPS */}
          {activeDefenseSubtab === "catch_crops" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "2rem" }}>🎯</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                      Catch Crop &amp; Trap Crop Guild Matrix (ఆకర్షక పంటల వ్యూహం)
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                      Sacrificial decoy crops that lure pests away from your high-value commercial harvest.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginTop: "1rem" }}>
                  {/* Marigold */}
                  <div style={{ background: "#fffbeb", borderRadius: "14px", border: "1.5px solid #fde68a", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>🌼</span>
                      <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>Tomato &amp; Chilli Guardian</span>
                    </div>
                    <h4 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 800, color: "#b45309" }}>African Marigold (*Banti Chettu*)</h4>
                    <div style={{ fontSize: "0.8rem", color: "#78350f", marginBottom: "0.6rem" }}>Ratio: 1 row for every 14 to 16 rows of Tomato/Chilli</div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#451a03", lineHeight: 1.5 }}>
                      • <strong>Fruit Borer Trap:</strong> *Helicoverpa armigera* moths prefer bright yellow marigold flowers for egg laying over tomato foliage.<br />
                      • <strong>Nematode Exterminator:</strong> Marigold root secretions emit <em>Alpha-Terthienyl</em>, which destroys deadly root-knot nematodes (*Meloidogyne incognita*).
                    </p>
                  </div>

                  {/* Mustard */}
                  <div style={{ background: "#f0fdf4", borderRadius: "14px", border: "1.5px solid #bbf7d0", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>🌾</span>
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>Cole Crop Shield</span>
                    </div>
                    <h4 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 800, color: "#166534" }}>Yellow Mustard (*Aavalu*)</h4>
                    <div style={{ fontSize: "0.8rem", color: "#15803d", marginBottom: "0.6rem" }}>Ratio: 2 perimeter rows + 1 row every 25 rows of Cabbage/Cauliflower</div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#14532d", lineHeight: 1.5 }}>
                      • <strong>Diamondback Moth Magnet:</strong> 90%+ of Diamondback Moths (*Plutella xylostella*) and mustard aphids preferentially lay eggs on tender mustard foliage.<br />
                      • Spray only the mustard trap rows with NSKE 5%, leaving 95% of your cabbage field completely untouched!
                    </p>
                  </div>

                  {/* Castor */}
                  <div style={{ background: "#fdf2f8", borderRadius: "14px", border: "1.5px solid #fbcfe8", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>🌿</span>
                      <span style={{ background: "#fce7f3", color: "#9d174d", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>Cotton &amp; Groundnut Shield</span>
                    </div>
                    <h4 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 800, color: "#9d174d" }}>Castor (*Aamudam*)</h4>
                    <div style={{ fontSize: "0.8rem", color: "#be185d", marginBottom: "0.6rem" }}>Ratio: Border plant spaced every 5 to 6 meters around the field</div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#701a75", lineHeight: 1.5 }}>
                      • <strong>Spodoptera Decoy:</strong> Tobacco caterpillars (*Spodoptera litura*) lay golden-brown hairy egg clusters on broad castor leaves.<br />
                      • Farmers easily monitor the castor leaves once weekly, clipping and burning egg masses before larvae ever hatch.
                    </p>
                  </div>

                  {/* Cowpea */}
                  <div style={{ background: "#f5f3ff", borderRadius: "14px", border: "1.5px solid #ddd6fe", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>🌱</span>
                      <span style={{ background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>Ladybird Nursery</span>
                    </div>
                    <h4 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 800, color: "#6d28d9" }}>Cowpea / Lobia (*Alasandalu*)</h4>
                    <div style={{ fontSize: "0.8rem", color: "#7c3aed", marginBottom: "0.6rem" }}>Ratio: Intercrop 1 row for every 8 rows of Sorghum / Millets / Cotton</div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#4c1d95", lineHeight: 1.5 }}>
                      • <strong>Predator Booster:</strong> Black cowpea aphids attack cowpea first without damaging the main crop.<br />
                      • Attracts immense populations of *Coccinella septempunctata* (7-spotted ladybirds) that devour 50+ aphids each per day.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: FIELD LAYOUT BLUEPRINT */}
          {activeDefenseSubtab === "field_layout" && (
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                📐 Three-Tier Organic Farm Perimeter Architecture
              </h3>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "#64748b" }}>
                Physical cross-section blueprint ensuring zero synthetic chemical drift and 100% genuine organic verification.
              </p>

              {/* Graphical Blueprint Visualizer */}
              <div style={{
                background: "#0f172a", borderRadius: "16px", padding: "1.75rem",
                color: "white", display: "flex", flexDirection: "column", gap: "1rem"
              }}>
                {/* Outer Ring */}
                <div style={{
                  border: "2px dashed #f59e0b", borderRadius: "12px", padding: "1.25rem",
                  background: "rgba(245, 158, 11, 0.08)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fbbf24" }}>
                      🌽 TIER 1: OUTER PERIMETER (3 to 4 Rows of Tall Maize / Jowar)
                    </span>
                    <span style={{ fontSize: "0.72rem", background: "#f59e0b", color: "#0f172a", padding: "2px 8px", borderRadius: "100px", fontWeight: 800 }}>
                      Chemical Drift Filter &amp; Windbreak
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#cbd5e1" }}>
                    Forms a 7-foot vertical living wall that physically halts pesticide sprays from conventional neighbors and nurtures lacewings.
                  </p>

                  {/* Middle Ring */}
                  <div style={{
                    marginTop: "1rem", border: "2px solid #10b981", borderRadius: "10px", padding: "1rem",
                    background: "rgba(16, 185, 129, 0.1)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#34d399" }}>
                        🌼 TIER 2: TRAP CROP BUFFER ZONE (Marigold, Mustard &amp; Castor)
                      </span>
                      <span style={{ fontSize: "0.72rem", background: "#10b981", color: "#0f172a", padding: "2px 8px", borderRadius: "100px", fontWeight: 800 }}>
                        Insect Decoy Belt
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#cbd5e1" }}>
                      Pests crossing the corn wall are intercepted here by attractive floral scents, preventing them from touching the central crops.
                    </p>

                    {/* Inner Core */}
                    <div style={{
                      marginTop: "1rem", border: "2px solid #38bdf8", borderRadius: "8px", padding: "1.25rem",
                      background: "rgba(56, 189, 248, 0.15)", textAlign: "center"
                    }}>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>🌾 👑 🥗</div>
                      <strong style={{ fontSize: "1rem", color: "#7dd3fc", display: "block" }}>
                        TIER 3: PROTECTED ORGANIC SANCTUARY (Main Cash Crop / Arikelu Millets)
                      </strong>
                      <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#e2e8f0" }}>
                        Sprayed strictly with <strong>NSKE 5% + Neemastra</strong>. Zero chemical residues (0.00 ppm). Certified 100% Genuine Organic!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
