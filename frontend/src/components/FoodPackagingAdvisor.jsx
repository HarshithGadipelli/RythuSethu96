import React, { useState } from "react";
import API from "../api/api";
import {
  Package, Sparkles, TrendingUp, AlertTriangle, ShieldCheck,
  Clock, DollarSign, Leaf, Truck, CheckCircle2, ChevronRight
} from "lucide-react";

const CROP_PRESETS = [
  { name: "Tomato", class: "perishable", shelfLife: 8, distance: 80, icon: "🍅" },
  { name: "Spinach / Leafy Greens", class: "perishable", shelfLife: 5, distance: 30, icon: "🥬" },
  { name: "Banana", class: "perishable", shelfLife: 10, distance: 150, icon: "🍌" },
  { name: "Mango", class: "perishable", shelfLife: 14, distance: 300, icon: "🥭" },
  { name: "Button Mushroom", class: "perishable", shelfLife: 6, distance: 40, icon: "🍄" },
  { name: "Onion / Potato", class: "semi_perishable", shelfLife: 30, distance: 200, icon: "🧅" }
];

export default function FoodPackagingAdvisor({ user, lang = "en" }) {
  const [cropName, setCropName] = useState("Tomato");
  const [perishability, setPerishability] = useState("perishable");
  const [transitDistanceKm, setTransitDistanceKm] = useState(60);
  const [transitMode, setTransitMode] = useState("ambient_truck");
  const [targetShelfLifeDays, setTargetShelfLifeDays] = useState(8);
  const [marketTier, setMarketTier] = useState("farm_to_consumer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelectPreset = (p) => {
    setCropName(p.name);
    setPerishability(p.class);
    setTargetShelfLifeDays(p.shelfLife);
    setTransitDistanceKm(p.distance);
    getRecommendation(p.name, p.class, p.shelfLife, p.distance);
  };

  const getRecommendation = async (
    cName = cropName,
    pClass = perishability,
    sLife = targetShelfLifeDays,
    tDist = transitDistanceKm
  ) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await API.post("/ai/packaging-recommend", {
        cropName: cName,
        perishability: pClass,
        transitDistanceKm: Number(tDist),
        transitMode,
        targetShelfLifeDays: Number(sLife),
        marketTier
      });
      setResult(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to generate packaging recommendation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-emerald-700 p-6 rounded-2xl text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-amber-200 text-xs font-bold uppercase tracking-wider">
              Zero-Waste Post-Harvest Cold-Chain Technology
            </span>
            <h2 className="text-2xl font-bold mt-1">📦 AI Food Packaging Material Recommendation</h2>
            <p className="text-amber-100 text-xs mt-1 max-w-xl">
              Prevent produce bruising, control ethylene respiration, and extend farm-to-fork shelf life with biodegradable and active packaging.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Produce Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-1">
          Quick Crops:
        </span>
        {CROP_PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition flex items-center gap-1.5 border ${
              cropName === p.name
                ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUT PARAMETERS (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">
            Transit & Produce Criteria
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Produce Name</label>
            <input
              type="text"
              required
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g. Tomato, Papaya, Capsicum, Guava..."
              className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Perishability Class</label>
              <select
                value={perishability}
                onChange={(e) => setPerishability(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs bg-white"
              >
                <option value="perishable">Perishable (1-3 days)</option>
                <option value="semi_perishable">Semi-Perishable (1-4 weeks)</option>
                <option value="shelf_stable">Durable Grains / Pulses</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Shelf Life</label>
              <input
                type="number"
                min="2"
                max="60"
                value={targetShelfLifeDays}
                onChange={(e) => setTargetShelfLifeDays(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs bg-white"
                placeholder="Days"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Transit Distance (Km)</label>
              <input
                type="number"
                min="5"
                max="2500"
                value={transitDistanceKm}
                onChange={(e) => setTransitDistanceKm(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Transit Mode</label>
              <select
                value={transitMode}
                onChange={(e) => setTransitMode(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-xs bg-white"
              >
                <option value="ambient_truck">Ambient Open Truck / Auto</option>
                <option value="two_wheeler">Delivery Agent Bike / Box</option>
                <option value="reefer_van">Refrigerated Reefer Van</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Market Channel</label>
            <select
              value={marketTier}
              onChange={(e) => setMarketTier(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-xs bg-white"
            >
              <option value="farm_to_consumer">Farm-to-Doorstep Consumer (Premium)</option>
              <option value="mandi_wholesale">Wholesale Mandi / APMC</option>
              <option value="supermarket">Organized Retail Supermarket</option>
              <option value="interstate_export">Interstate / Export Shipment</option>
            </select>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <button
            onClick={() => getRecommendation()}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">⚙️</span>
                <span>Synthesizing Post-Harvest Chemistry...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generate Smart Packaging Recipe</span>
              </>
            )}
          </button>
        </div>

        {/* OUTPUT SPECIFICATION (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {!result && !loading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center flex-1 flex flex-col items-center justify-center text-gray-400">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full mb-3 text-3xl">
                📦
              </div>
              <h4 className="text-base font-bold text-gray-700 mb-1">No Packaging Recipe Active</h4>
              <p className="text-xs text-gray-500 max-w-sm mb-4">
                Select your harvested crop and transit distance to calculate the exact micro-perforated liners, ventilation rates, and ethylene absorbers needed to minimize rot.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex-1 flex flex-col items-center justify-center">
              <div className="animate-bounce text-4xl mb-3">📦</div>
              <h4 className="font-bold text-gray-800 text-lg">AI Post-Harvest Engine Calculating Packaging</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Evaluating respiratory CO2 rates, ethylene sensitivity, and moisture vapor transmission rates (MVTR)...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 flex-1 flex flex-col justify-between space-y-5 animate-in fade-in">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap border-b pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Post-Harvest Packaging Protocol
                    </span>
                    <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{result.cropName}</h3>
                    <p className="text-xs text-gray-500">
                      Respiration: <strong>{result.respirationProfile}</strong> • Ethylene: <strong>{result.ethyleneClassification}</strong>
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Leaf size={14} /> {result.sustainabilityScore || "Eco-Friendly"}
                  </span>
                </div>

                {/* SHELF LIFE EXTENSION PROGRESS BAR */}
                {result.shelfLifeMetrics && (
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 mb-4">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1.5">
                      <span>Freshness Lifespan Extension:</span>
                      <span className="text-emerald-700 bg-white px-2 py-0.5 rounded shadow-xs">
                        🚀 {result.shelfLifeMetrics.extensionRatio}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Baseline (Unpackaged Ambient):</span>
                        <strong>{result.shelfLifeMetrics.baselineAmbientDays} Days</strong>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full" style={{ width: "35%" }} />
                      </div>

                      <div className="flex items-center justify-between text-emerald-800 font-semibold pt-1">
                        <span>With AI Recommended Packaging:</span>
                        <strong>{result.shelfLifeMetrics.extendedShelfLifeDays} Days</strong>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-800 font-medium mt-2 pt-1 border-t border-emerald-200">
                      ✨ Impact: <strong>{result.shelfLifeMetrics.wasteReductionPercent}</strong>
                    </p>
                  </div>
                )}

                {/* PACKAGING MATERIALS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-gray-700 block mb-1">🛍️ Primary / Inner Contact Packaging:</span>
                    <p className="text-gray-900 font-medium leading-relaxed">{result.primaryPackaging}</p>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="font-bold text-gray-700 block mb-1">📦 Secondary Master Transport:</span>
                    <p className="text-gray-900 font-medium leading-relaxed">{result.secondaryPackaging}</p>
                  </div>
                </div>

                {/* ACTIVE ATMOSPHERIC TECH & ROI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-1">🧪 Active Atmosphere Control:</span>
                    <p className="text-blue-900 leading-relaxed font-medium">{result.activePackagingTech}</p>
                  </div>
                  {result.costEconomics && (
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-1">💰 Financial Cost-Benefit:</span>
                      <p className="text-amber-950 font-medium">Cost: {result.costEconomics.estCostPerKg}</p>
                      <p className="text-emerald-700 font-bold mt-0.5">{result.costEconomics.savedRevenuePerKg}</p>
                    </div>
                  )}
                </div>

                {/* CRITICAL POST-HARVEST GUIDELINES */}
                {result.criticalGuidelines && (
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
                    <span className="font-bold text-gray-800 block mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-emerald-600" /> Essential Post-Harvest Packaging Rules:
                    </span>
                    <ul className="space-y-1 text-gray-600">
                      {result.criticalGuidelines.map((g, i) => (
                        <li key={i}>• {g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                <span>Model: <strong>{result.modelUsed}</strong></span>
                <span className="text-gray-400">Post-Harvest Loss Prevention Standard</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
