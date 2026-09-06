import React from 'react';
import { Volume2, CheckCircle2, TrendingUp } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { playTTS } from '../utils/voiceParser';
import { CROP_BENCHMARKS } from '../utils/voiceParser';

export const VISUAL_CROPS = [
  { id: "Tomato", emoji: "🍅", category: "vegetable", names: { en: "Tomato", te: "టమోటా", hi: "टमाटर", ta: "தக்காளி", kn: "ಟೊಮೆಟೊ" } },
  { id: "Onion", emoji: "🧅", category: "vegetable", names: { en: "Onion", te: "ఉల్లిపాయ", hi: "प्याज", ta: "வெங்காயம்", kn: "ಈರುಳ್ಳಿ" } },
  { id: "Potato", emoji: "🥔", category: "vegetable", names: { en: "Potato", te: "బంగాళదుంప", hi: "आलू", ta: "உருளைக்கிழங்கு", kn: "ಆಲೂಗಡ್ಡೆ" } },
  { id: "Chili", emoji: "🌶️", category: "spice", names: { en: "Chili", te: "మిరపకాయ", hi: "मिर्च", ta: "மிளகாய்", kn: "ಮೆಣಸಿನಕಾಯಿ" } },
  { id: "Rice", emoji: "🌾", category: "grain", names: { en: "Rice", te: "వరి / బియ్యం", hi: "चावल / धान", ta: "அரிசி / நெல்", kn: "ಅಕ್ಕಿ / ಭತ್ತ" } },
  { id: "Wheat", emoji: "🌾", category: "grain", names: { en: "Wheat", te: "గోధుమలు", hi: "गेहूं", ta: "கோதுமை", kn: "ಗೋಧಿ" } },
  { id: "Cotton", emoji: "☁️", category: "other", names: { en: "Cotton", te: "పత్తి / దూది", hi: "कपास", ta: "பருத்தி", kn: "ಹತ್ತಿ" } },
  { id: "Mango", emoji: "🥭", category: "fruit", names: { en: "Mango", te: "మామిడిపండు", hi: "आम", ta: "மாம்பழம்", kn: "ಮಾವಿನಹಣ್ಣು" } },
  { id: "Banana", emoji: "🍌", category: "fruit", names: { en: "Banana", te: "అరటిపండు", hi: "केला", ta: "வாழைப்பழம்", kn: "ಬಾಳೆಹಣ್ಣು" } },
  { id: "Garlic", emoji: "🧄", category: "spice", names: { en: "Garlic", te: "వెల్లుల్లి", hi: "लहसुन", ta: "பூண்டு", kn: "ಬೆಳ್ಳುಳ್ಳಿ" } },
  { id: "Ginger", emoji: "🫚", category: "spice", names: { en: "Ginger", te: "అల్లం", hi: "अदरक", ta: "இஞ்சி", kn: "ಶುಂಠಿ" } },
  { id: "Turmeric", emoji: "🟡", category: "spice", names: { en: "Turmeric", te: "పసుపు", hi: "हल्दी", ta: "மஞ்சள்", kn: "ಅರಿಶಿನ" } },
  { id: "Groundnut", emoji: "🥜", category: "pulse", names: { en: "Groundnut", te: "వేరుశనగ / పల్లీలు", hi: "मूंगफली", ta: "வேர்க்கடலை", kn: "ನೆಲಗಡಲೆ" } },
  { id: "Maize", emoji: "🌽", category: "grain", names: { en: "Maize / Corn", te: "మొక్కజొన్న", hi: "मक्का / भुट्टा", ta: "மக்காச்சோளம்", kn: "ಜೋಳ" } },
  { id: "Cabbage", emoji: "🥬", category: "vegetable", names: { en: "Cabbage", te: "క్యాబేజీ", hi: "पत्तागोभी", ta: "முட்டைக்கோஸ்", kn: "ಕೋಸು" } },
  { id: "Okra", emoji: "🥒", category: "vegetable", names: { en: "Okra / Bhindi", te: "బెండకాయ", hi: "भिंडी", ta: "வெண்டைக்காய்", kn: "ಬೆಂಡೆಕಾಯಿ" } }
];

export default function CropVisualPicker({ selectedCrop, onSelectCrop }) {
  const { lang } = useLang();
  const langKey = (lang ? lang.split("-")[0] : "en") || "en";

  const handleSpeakCrop = (e, crop) => {
    e.stopPropagation();
    const cropName = crop.names[langKey] || crop.names.en;
    const bm = CROP_BENCHMARKS[crop.id];
    let speech = `${cropName}. `;
    if (bm) {
      if (langKey === "te") {
        speech += `మార్కెట్ సగటు ధర కేజీకి ₹${bm.avg}.`;
      } else if (langKey === "hi") {
        speech += `मंडी का औसत भाव ₹${bm.avg} प्रति किलो है।`;
      } else if (langKey === "kn") {
        speech += `ಮಾರುಕಟ್ಟೆ ಸರಾಸರಿ ಬೆಲೆ ಕೆಜಿಗೆ ₹${bm.avg}.`;
      } else if (langKey === "ta") {
        speech += `சந்தை சராசரி விலை கிலோவிற்கு ₹${bm.avg}.`;
      } else {
        speech += `Average market mandi rate is ₹${bm.avg} per ${bm.unit}.`;
      }
    }
    playTTS(speech, langKey);
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--green-mid)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            🖼️ {langKey === "te" ? "చిత్రం చూసి ఎంచుకోండి (ఇల్లెటరేట్ స్నేహపూర్వక)" : (langKey === "hi" ? "फोटो देखकर फसल चुनें" : "Tap Crop Photo or Icon")}
          </h4>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {langKey === "te" ? "వినడానికి స్పీకర్ నొక్కండి • ఎంచుకోవడానికి కార్డ్ నొక్కండి" : (langKey === "hi" ? "सुनने के लिए स्पीकर दबाएं • चुनने के लिए कार्ड छुएं" : "Tap speaker to hear name & price • Tap card to select")}
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", background: "rgba(34, 197, 94, 0.15)", color: "#86efac", padding: "3px 8px", borderRadius: "12px", fontWeight: 600 }}>
          {VISUAL_CROPS.length} Popular Crops
        </span>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", 
        gap: "0.75rem",
        maxHeight: "260px",
        overflowY: "auto",
        padding: "4px"
      }}>
        {VISUAL_CROPS.map((crop) => {
          const isSelected = selectedCrop === crop.id;
          const bm = CROP_BENCHMARKS[crop.id];
          const displayName = crop.names[langKey] || crop.names.en;

          return (
            <div
              key={crop.id}
              onClick={() => onSelectCrop(crop)}
              style={{
                background: isSelected ? "rgba(34, 197, 94, 0.2)" : "rgba(15, 23, 42, 0.5)",
                border: isSelected ? "2px solid #22c55e" : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "0.75rem 0.5rem",
                textAlign: "center",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 0 16px rgba(34, 197, 94, 0.35)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.border = "1px solid rgba(34, 197, 94, 0.5)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.08)";
              }}
            >
              {/* Selected badge */}
              {isSelected && (
                <div style={{ position: "absolute", top: "6px", right: "6px" }}>
                  <CheckCircle2 size={16} color="#22c55e" />
                </div>
              )}

              {/* Speaker button */}
              <button
                type="button"
                onClick={(e) => handleSpeakCrop(e, crop)}
                style={{
                  position: "absolute",
                  top: "6px",
                  left: "6px",
                  background: "rgba(0,0,0,0.4)",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#60a5fa"
                }}
                title="Hear Pronunciation & APMC Rate"
              >
                <Volume2 size={13} />
              </button>

              <div style={{ fontSize: "2.2rem", margin: "0.3rem 0" }}>{crop.emoji}</div>
              
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: isSelected ? "#4ade80" : "#f1f5f9", marginBottom: "0.2rem", lineHeight: "1.2" }}>
                {displayName}
              </div>

              {bm && (
                <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600 }}>
                  ₹{bm.avg}/{bm.unit}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
