import React, { useState } from "react";
import API from "../api/api";
import { playTTS, stopTTS } from "../utils/voiceParser";
import {
  Sparkles, AlertTriangle, ShieldCheck, DollarSign,
  HeartPulse, Beef, Sprout, Volume2, VolumeX, Search,
  ChevronRight, BookOpen, Trash2
} from "lucide-react";

const COMMON_WEEDS = [
  {
    name: "Purple Nutsedge (Motha / Tunga)",
    botanical: "Cyperus rotundus",
    threat: "High",
    use: "Ayurvedic liver tonic & high value dried rhizome sales",
    desc: "Tough triangular stem sedge with underground nut tubers in cluster."
  },
  {
    name: "Parthenium (Congress Grass / Vayyari Bhamalu)",
    botanical: "Parthenium hysterophorus",
    threat: "Invasive",
    use: "Anaerobic biogas slurry biomass (Wear gloves; allergen!)",
    desc: "White flowering toxic invasive weed that suppresses native biodiversity."
  },
  {
    name: "Bermuda Grass (Doob / Garika)",
    botanical: "Cynodon dactylon",
    threat: "Moderate",
    use: "Premium livestock fodder, Ayurvedic skin cooling & soil erosion control",
    desc: "Creeping stolon grass with profound drought tolerance and root binding."
  },
  {
    name: "Purslane (Kulfa / Gangapavili)",
    botanical: "Portulaca oleracea",
    threat: "Low",
    use: "Rich in Omega-3 fatty acids, delicious edible wild leafy green",
    desc: "Succulent reddish stems with small paddle leaves and yellow blossoms."
  },
  {
    name: "Bhumi Amla (Nela Usiri)",
    botanical: "Phyllanthus niruri",
    threat: "Low",
    use: "Famous Ayurvedic remedy for jaundice, hepatitis & liver revitalization",
    desc: "Small delicate feather-like compound leaves with tiny round capsules below."
  }
];

export default function WeedControlPanel({ user, lang = "en" }) {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [cropName, setCropName] = useState("Paddy / Rice");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeCardTab, setActiveCardTab] = useState("both"); // "both" | "removal" | "benefits"
  const [errorMsg, setErrorMsg] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    setResult(null);
    stopSpeaking();
  };

  const stopSpeaking = () => {
    try {
      stopTTS();
    } catch (e) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
    setIsSpeaking(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (!result) return;

    const speechText = `Weed detected: ${result.weedName}. Botanical classification: ${result.botanicalName}. Threat level: ${result.threatLevel}. ${
      result.beneficialUses?.isUseful ? `Beneficial uses: ${result.beneficialUses.medicinal || ""} ${result.beneficialUses.fodder || ""}` : ""
    } Eradication method: ${result.eradicationMethods?.mechanical || ""}.`;

    setIsSpeaking(true);
    playTTS(speechText, lang);

    if (typeof window !== "undefined" && window.speechSynthesis) {
      const checkDone = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          clearInterval(checkDone);
        }
      }, 500);
    }
  };

  const runWeedDetect = async (customPrompt) => {
    if (!photoPreview && !description && !customPrompt) {
      setErrorMsg("Please upload a weed photo or enter a weed description.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    stopSpeaking();

    try {
      const res = await API.post("/ai/weed-detect", {
        imageBase64: photoPreview || null,
        cropName,
        description: customPrompt || description || undefined
      });
      setResult(res.data);
    } catch (e) {
      setErrorMsg(e.response?.data?.error || "Weed identification failed. Please retry with a clearer photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-green-900 p-6 rounded-2xl text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Ecological Weed Science & Resource Recovery
            </span>
            <h2 className="text-2xl font-bold mt-1">🌿 AI Weed Detection & Dual-Use Advisor</h2>
            <p className="text-emerald-100 text-xs mt-1 max-w-xl">
              Identify invasive weeds, protect standing crop yields, and discover high-value Ayurvedic medicinal, livestock fodder, and vermicompost biomass uses.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUT FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              1. Upload Weed Photograph
            </label>
            <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/30 transition text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <span className="text-3xl mb-1">🌱</span>
              <p className="text-xs font-semibold text-gray-700">
                {photoFile ? `Selected: ${photoFile.name}` : "Tap to capture or upload weed photo"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Captures flower, seedhead, leaf & stem</p>
            </label>

            {photoPreview && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                <img src={photoPreview} alt="Weed preview" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white text-xs px-2 py-1 rounded-md backdrop-blur transition"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              2. Main Cultivated Crop
            </label>
            <select
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Paddy / Rice">Paddy / Rice (Wetland / Irrigated)</option>
              <option value="Cotton">Cotton (Kharif Cash Crop)</option>
              <option value="Maize / Corn">Maize / Corn</option>
              <option value="Chilli / Tomato">Chilli / Tomato / Vegetables</option>
              <option value="Red Gram / Pulses">Red Gram / Moong / Pulses</option>
              <option value="Orchard / Fruit Plantation">Fruit Orchards (Mango, Citrus, Guava)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              3. Visual Notes / Weed Habitat (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Growing between furrow rows, forming deep underground tubers, spreading flat like carpet..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm bg-white resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <button
            onClick={() => runWeedDetect()}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">⚙️</span>
                <span>Identifying Weed & Utility Profile...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Analyze Weed & Useful Value</span>
              </>
            )}
          </button>

          {/* Quick Weed Presets */}
          <div className="pt-2 border-t">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Common Indian Weeds Quick Library
            </span>
            <div className="space-y-1.5">
              {COMMON_WEEDS.slice(0, 3).map((w, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDescription(`Weed identified as ${w.name} (${w.botanical}). ${w.desc}`);
                    runWeedDetect(`Weed specimen: ${w.name} (${w.botanical}). ${w.desc}`);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-100 text-xs flex items-center justify-between transition group"
                >
                  <div>
                    <span className="font-semibold text-gray-800 group-hover:text-emerald-800">{w.name}</span>
                    <span className="block text-[10px] text-gray-500">{w.botanical}</span>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-emerald-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OUTPUT ANALYSIS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {!result && !loading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 text-3xl">
                🌿
              </div>
              <h4 className="text-base font-bold text-gray-700 mb-1">No Weed Sample Diagnosed Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                Upload a weed photo or pick a specimen from the library. You will get both eradication techniques and any valuable commercial, medicinal, or livestock uses!
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex-1 flex flex-col items-center justify-center">
              <div className="animate-spin text-4xl mb-3">🌱</div>
              <h4 className="font-bold text-gray-800 text-lg">AI Weed Botanist Inspecting Specimen</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Classifying weed species, rhizome morphology, allelopathic toxicity, and beneficial ethnobotanical value...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 flex-1 flex flex-col justify-between space-y-5 animate-in fade-in">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap border-b pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {result.weedType || "Agricultural Weed"}
                    </span>
                    <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{result.weedName}</h3>
                    <p className="text-xs italic text-gray-500">{result.botanicalName}</p>

                    {result.localNames && (
                      <div className="flex gap-2 text-[11px] text-gray-600 mt-1 flex-wrap">
                        {result.localNames.te && <span>🇮🇳 Telugu: <strong>{result.localNames.te}</strong></span>}
                        {result.localNames.hi && <span>• Hindi: <strong>{result.localNames.hi}</strong></span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      result.threatLevel === "Invasive" || result.threatLevel === "High"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      ⚠️ Threat: {result.threatLevel}
                    </span>

                    <button
                      onClick={toggleSpeech}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
                        isSpeaking
                          ? "bg-red-500 text-white border-red-600 animate-pulse"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      {isSpeaking ? "Stop" : "Listen"}
                    </button>
                  </div>
                </div>

                {/* Competition Impact & Window */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-900 block mb-0.5">🌾 Crop Competition Impact</span>
                    <p className="text-amber-800 leading-relaxed">{result.competitionImpact}</p>
                  </div>
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-0.5">⏱️ Critical Removal Window</span>
                    <p className="text-blue-800 leading-relaxed">{result.criticalControlWindow}</p>
                  </div>
                </div>

                {/* DUAL COLUMNS: REMOVAL vs USEFUL VALUE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* RED COLUMN: ERADICATION */}
                  <div className="bg-red-50/40 p-4 rounded-xl border border-red-200 text-xs space-y-2.5">
                    <h4 className="font-bold text-red-950 text-sm flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-red-600" /> Eradication & Removal Guide
                    </h4>
                    <div>
                      <strong className="text-gray-700 block">🚜 Mechanical & Interculture:</strong>
                      <p className="text-gray-600 mt-0.5">{result.eradicationMethods?.mechanical}</p>
                    </div>
                    <div>
                      <strong className="text-gray-700 block">🌿 Organic Mulching & Bio-Control:</strong>
                      <p className="text-gray-600 mt-0.5">{result.eradicationMethods?.organic}</p>
                    </div>
                    <div>
                      <strong className="text-gray-700 block">🛡️ Recurrence Prevention:</strong>
                      <p className="text-gray-600 mt-0.5">{result.eradicationMethods?.preventive}</p>
                    </div>
                  </div>

                  {/* GREEN COLUMN: BENEFICIAL UTILIZATION */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 text-xs space-y-2.5">
                    <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                      <DollarSign size={16} className="text-emerald-600" /> Beneficial Uses & Economic Value
                    </h4>
                    {result.beneficialUses?.medicinal && (
                      <div>
                        <strong className="text-emerald-900 flex items-center gap-1">
                          <HeartPulse size={13} /> Ayurvedic / Therapeutic Value:
                        </strong>
                        <p className="text-emerald-800 mt-0.5">{result.beneficialUses.medicinal}</p>
                      </div>
                    )}
                    {result.beneficialUses?.fodder && (
                      <div>
                        <strong className="text-emerald-900 flex items-center gap-1">
                          <Beef size={13} /> Livestock & Cattle Forage:
                        </strong>
                        <p className="text-emerald-800 mt-0.5">{result.beneficialUses.fodder}</p>
                      </div>
                    )}
                    {result.beneficialUses?.compostValue && (
                      <div>
                        <strong className="text-emerald-900 flex items-center gap-1">
                          <Sprout size={13} /> Vermicompost Biomass:
                        </strong>
                        <p className="text-emerald-800 mt-0.5">{result.beneficialUses.compostValue}</p>
                      </div>
                    )}
                    {result.economicPotential && (
                      <div className="p-2 bg-emerald-100/70 rounded-lg text-emerald-900 font-semibold border border-emerald-300">
                        💰 Market Value: {result.economicPotential}
                      </div>
                    )}
                  </div>
                </div>

                {result.safetyWarning && (
                  <div className="mt-3 p-3 bg-red-100/70 border border-red-300 text-red-900 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span><strong>Safety Notice:</strong> {result.safetyWarning}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                <span>Model: <strong>{result.source || "Gemini Vision AI"}</strong></span>
                <span className="text-gray-400">Integrated Weed Management (IWM) Standard</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
