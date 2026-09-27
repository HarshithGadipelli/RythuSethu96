import React, { useState } from "react";
import API from "../api/api";
import { playTTS, stopTTS } from "../utils/voiceParser";
import { Bug, Sparkles, AlertCircle, ShieldAlert, CheckCircle2, Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";

const SEVERITY_BADGE = {
  Low: { bg: "#dcfce7", text: "#15803d", border: "#86efac", icon: "🟢" },
  Moderate: { bg: "#fef3c7", text: "#b45309", border: "#fde68a", icon: "🟡" },
  High: { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5", icon: "🟠" },
  Severe: { bg: "#fef2f2", text: "#991b1b", border: "#f87171", icon: "🔴" },
  Healthy: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0", icon: "🌱" },
  Unknown: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1", icon: "⚪" }
};

export default function PestDetectionPanel({ user, lang = "en" }) {
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [cropName, setCropName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRefLibrary, setShowRefLibrary] = useState(false);

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

    let textToSpeak = "";
    if (result.disease === "Healthy" || result.disease === "None/Healthy") {
      textToSpeak = "Your crop appears healthy and vigorous. No pathogen or insect pest detected.";
    } else if (result.disease === "Not a Crop/Plant") {
      textToSpeak = "The uploaded photo does not appear to show a crop leaf or agricultural plant. Please upload a clear photo of your plant.";
    } else {
      textToSpeak = `Issue identified: ${result.disease}. Severity rating: ${result.severity || "Moderate"}. ${result.symptoms ? `Symptoms observed: ${result.symptoms}.` : ""} Treatment: ${result.remedy}`;
    }

    setIsSpeaking(true);
    playTTS(textToSpeak, lang);

    // Auto toggle off state when speaking finishes
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const checkDone = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsSpeaking(false);
          clearInterval(checkDone);
        }
      }, 500);
    }
  };

  const runPestDetect = async () => {
    if (!photoPreview && !cropName && !symptoms) {
      setMsg({ type: "error", text: "Please upload a crop leaf photo or describe symptoms." });
      return;
    }
    setLoading(true);
    setMsg({ type: "", text: "" });
    stopSpeaking();

    try {
      const res = await API.post("/ai/pest-detect", {
        imageBase64: photoPreview || null,
        cropName: cropName || undefined,
        symptoms: symptoms || undefined,
      });
      setResult(res.data);
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.error || "Pest diagnosis failed. Please check network or try a clearer photo." });
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = result?.disease === "Healthy" || result?.disease === "None/Healthy";
  const isInvalid = result?.disease === "Not a Crop/Plant" || result?.disease === "Diagnosis Inconclusive";
  const severityStyle = SEVERITY_BADGE[result?.severity] || SEVERITY_BADGE.Unknown;

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bug className="text-emerald-600" /> AI Crop Health & Pest Diagnostics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Multimodal Computer Vision analysis for insect pests, bacterial/fungal blights, and organic remedies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUT COLUMN (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              1. Leaf / Plant Photo
            </label>
            <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-emerald-50/30 transition text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <span className="text-3xl mb-1">📸</span>
              <p className="text-xs font-semibold text-gray-700">
                {photoFile ? `Selected: ${photoFile.name}` : "Tap to capture or upload leaf photo"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Supports JPG, PNG, WEBP</p>
            </label>

            {photoPreview && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                <img
                  src={photoPreview}
                  alt="Crop preview"
                  className="w-full max-h-52 object-cover"
                />
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
              2. Cultivated Crop (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Tomato, Cotton, Paddy, Chilli..."
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              3. Visual Symptoms Observed (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Yellowing leaf margins, white powdery coating, brown concentric spots, wilting during mid-day..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          {msg.text && (
            <div className={`p-3 rounded-lg text-xs font-medium ${msg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {msg.text}
            </div>
          )}

          <button
            onClick={runPestDetect}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">⚙️</span>
                <span>Running Computer Vision Diagnostics...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Diagnose Crop Health</span>
              </>
            )}
          </button>
        </div>

        {/* OUTPUT COLUMN (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {!result && !loading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 text-3xl">
                🔬
              </div>
              <h4 className="text-base font-bold text-gray-700 mb-1">No Crop Diagnosis Active</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                Upload a clear close-up photograph of an affected leaf, stem, or fruit. The AI Vision model inspects pathological patterns, pest bite vectors, and nutrient chlorosis.
              </p>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-left text-xs text-gray-600 w-full max-w-md space-y-1">
                <span className="font-semibold text-gray-800 block mb-1">📸 Photography Tips for Best Accuracy:</span>
                <p>• Capture under bright natural daylight (avoid heavy shadows or flash glare).</p>
                <p>• Include both affected discolored tissue and healthy leaf margin for contrast.</p>
                <p>• Flip leaf to inspect underside for aphids, whiteflies, or fungal pustules.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex-1 flex flex-col items-center justify-center">
              <div className="animate-bounce text-4xl mb-3">🌿</div>
              <h4 className="font-bold text-gray-800 text-lg">AI Multimodal Vision Analyzing Leaf Patterns</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Scanning leaf veins, lesion coloration, necrosis margins, and pest frass vectors...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 flex-1 flex flex-col justify-between space-y-5 animate-in fade-in">
              {/* Single Unified Diagnostic Header */}
              <div>
                <div className="flex items-start justify-between gap-3 flex-wrap border-b pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-xl text-2xl">
                      {isHealthy ? "🌱" : isInvalid ? "⚠️" : "🦠"}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                        Diagnostic Assessment
                      </span>
                      <h3 className="text-xl font-extrabold text-gray-800">{result.disease}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {result.severity && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border"
                        style={{
                          backgroundColor: severityStyle.bg,
                          color: severityStyle.text,
                          borderColor: severityStyle.border
                        }}
                      >
                        {severityStyle.icon} Severity: {result.severity}
                      </span>
                    )}

                    {/* Single Unified Audio Speaker Toggle */}
                    <button
                      onClick={toggleSpeech}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
                        isSpeaking
                          ? "bg-red-500 text-white border-red-600 animate-pulse"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      }`}
                      title={isSpeaking ? "Stop audio" : "Listen to diagnosis"}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX size={14} /> Stop Audio
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} /> Listen
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Symptoms & Pathological Markers */}
                {result.symptoms && (
                  <div className="mb-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1">
                      Identified Symptoms & Indicators
                    </span>
                    <p className="text-xs text-gray-800 leading-relaxed">{result.symptoms}</p>
                  </div>
                )}

                {/* Unified Organic Remedy & Action Protocol */}
                <div
                  className={`p-4 rounded-xl border ${
                    isHealthy
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                      : isInvalid
                      ? "bg-amber-50/70 border-amber-200 text-amber-900"
                      : "bg-red-50/40 border-red-200 text-red-950"
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    {isHealthy ? "🛡️ Maintenance & Crop Vigour Routine" : "💊 Prescribed Organic Remedy & Action Plan"}
                  </span>
                  <div className="text-xs space-y-1.5 whitespace-pre-line leading-relaxed font-medium">
                    {result.remedy}
                  </div>
                </div>
              </div>

              {/* Footer Meta & Single Audio Button */}
              <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
                <span className="flex items-center gap-1">
                  ⚡ Model: <strong>{result.source || "Gemini Vision Multimodal AI"}</strong>
                </span>
                <span className="text-gray-400">Diagnosis strictly for agricultural advisement</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Reference Library (only when user clicks) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowRefLibrary(!showRefLibrary)}
          className="w-full p-4 flex items-center justify-between text-left font-semibold text-gray-700 hover:bg-gray-50 transition text-sm"
        >
          <span className="flex items-center gap-2">
            <span>📚</span> Common Regional Pest & Pathogen Field Reference
          </span>
          {showRefLibrary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showRefLibrary && (
          <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs border-t bg-gray-50/50">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 block text-sm mb-1">🍂 Early / Late Blight</span>
              <p className="text-gray-600 mb-1">Brown concentric target rings on leaves, spreading upward.</p>
              <strong className="text-emerald-700">Remedy:</strong> Spray Copper Oxychloride (2.5g/L) or Trichoderma viride.
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 block text-sm mb-1">🦟 Aphids & Thrips</span>
              <p className="text-gray-600 mb-1">Leaf curling upward, sticky honeydew secretion on underside.</p>
              <strong className="text-emerald-700">Remedy:</strong> Neem Oil 10,000 ppm (3-5ml/L) + yellow sticky traps.
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 block text-sm mb-1">🐛 Helicoverpa (Fruit Borer)</span>
              <p className="text-gray-600 mb-1">Circular boreholes in fruits, flower bud drop.</p>
              <strong className="text-emerald-700">Remedy:</strong> Pheromone traps (5/acre) + NPV virus or Bt bio-spray.
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-800 block text-sm mb-1">⚪ Powdery Mildew</span>
              <p className="text-gray-600 mb-1">White talcum powder-like fungal patches on leaf surfaces.</p>
              <strong className="text-emerald-700">Remedy:</strong> Wettable Sulfur 80% WP (2g/L) or cow urine spray (10%).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
