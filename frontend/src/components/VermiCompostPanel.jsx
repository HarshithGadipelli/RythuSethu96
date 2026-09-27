import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Leaf, Plus, Info, Clock, CheckCircle, XCircle, Droplets,
  Thermometer, Trash2, RefreshCw, AlertTriangle, ShieldCheck,
  ChevronRight, Calendar, Activity, Sparkles, BookOpen
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../api/api";

const VermiCompostPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("beds"); // "beds" | "new_bed" | "waste_request" | "guide"
  
  // Beds State
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  
  // Waste Requests State
  const [requests, setRequests] = useState([]);
  const [requestedKg, setRequestedKg] = useState("");
  const [wasteType, setWasteType] = useState("fruit_veg_peels");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.location || "");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [requestMsg, setRequestMsg] = useState({ type: "", text: "" });

  // New Bed Form State
  const [bedForm, setBedForm] = useState({
    bedName: "",
    dimensions: "10 ft x 3 ft x 2 ft",
    wormSpecies: "Eisenia fetida (Red Wigglers)",
    wormQuantityKg: 2,
    biomassCapacityKg: 150,
    currentBiomassKg: 80,
    moisturePercent: 65,
    temperatureC: 26,
    phLevel: 7.0
  });
  const [creatingBed, setCreatingBed] = useState(false);

  // Quick Action Modal / Update State
  const [selectedBed, setSelectedBed] = useState(null);
  const [actionType, setActionType] = useState(""); // "moisture" | "harvest_wash" | "harvest_compost"
  const [actionInput, setActionInput] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [savingAction, setSavingAction] = useState(false);

  const PRICE_PER_KG = 3; // ₹3 per kg for organic scraps

  useEffect(() => {
    fetchBatches();
    fetchRequests();
  }, []);

  const fetchBatches = async () => {
    setLoadingBatches(true);
    try {
      const { data } = await axios.get(`${BASE_URL}/api/farmer/vermi-compost/batches`);
      setBatches(data);
    } catch (err) {
      console.error("Failed to fetch vermi beds:", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/farmer/vermi-compost/requests`);
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    setCreatingBed(true);
    try {
      await axios.post(`${BASE_URL}/api/farmer/vermi-compost/batches`, bedForm);
      await fetchBatches();
      setActiveTab("beds");
      setBedForm({
        bedName: "",
        dimensions: "10 ft x 3 ft x 2 ft",
        wormSpecies: "Eisenia fetida (Red Wigglers)",
        wormQuantityKg: 2,
        biomassCapacityKg: 150,
        currentBiomassKg: 80,
        moisturePercent: 65,
        temperatureC: 26,
        phLevel: 7.0
      });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create bed");
    } finally {
      setCreatingBed(false);
    }
  };

  const handleApplyAction = async (e) => {
    e.preventDefault();
    if (!selectedBed) return;
    setSavingAction(true);
    try {
      const payload = {
        logAction: actionType === "moisture" ? `Logged Watering / Moisture (${actionInput}%)`
                 : actionType === "harvest_wash" ? `Harvested ${actionInput} Liters Vermiwash`
                 : `Harvested ${actionInput} Kg Vermicompost`,
        logNote: actionNote
      };
      if (actionType === "moisture") payload.moisturePercent = Number(actionInput);
      if (actionType === "harvest_wash") payload.vermiwashCollectedLiters = Number(actionInput);
      if (actionType === "harvest_compost") {
        payload.harvestedCompostKg = Number(actionInput);
        payload.stage = "harvested";
      }

      await axios.put(`${BASE_URL}/api/farmer/vermi-compost/batches/${selectedBed._id}`, payload);
      await fetchBatches();
      setSelectedBed(null);
      setActionType("");
      setActionInput("");
      setActionNote("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update bed telemetry");
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteBed = async (id) => {
    if (!window.confirm("Are you sure you want to remove this vermicompost bed?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/farmer/vermi-compost/batches/${id}`);
      fetchBatches();
    } catch (err) {
      alert("Failed to delete bed");
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoadingRequest(true);
    setRequestMsg({ type: "", text: "" });

    if (!requestedKg || Number(requestedKg) <= 0) {
      setRequestMsg({ type: "error", text: "Please enter a valid quantity in kg." });
      setLoadingRequest(false);
      return;
    }

    try {
      const totalCost = Number(requestedKg) * PRICE_PER_KG;
      await axios.post(`${BASE_URL}/api/farmer/vermi-compost/request`, {
        requestedKg: Number(requestedKg),
        totalCost,
        wasteType,
        deliveryAddress
      });
      setRequestMsg({ type: "success", text: "Waste collection request dispatched to local delivery agents!" });
      setRequestedKg("");
      fetchRequests();
    } catch (err) {
      setRequestMsg({ type: "error", text: err.response?.data?.error || "Failed to submit request." });
    } finally {
      setLoadingRequest(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved": return <CheckCircle size={16} className="text-green-500" />;
      case "fulfilled": return <CheckCircle size={16} className="text-blue-500" />;
      case "rejected": return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const calculateDaysRemaining = (harvestDate) => {
    if (!harvestDate) return null;
    const diffTime = new Date(harvestDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur rounded-xl border border-white/20">
              <Leaf size={28} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Vermi Compost Production Hub</h2>
              <p className="text-emerald-100 text-sm mt-0.5">
                Batch lifecycle telemetry, earthworm ecology, vermiwash harvest & biomass supply.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("beds")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "beds" ? "bg-white text-emerald-800 shadow" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              🌱 Active Beds ({batches.length})
            </button>
            <button
              onClick={() => setActiveTab("new_bed")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "new_bed" ? "bg-white text-emerald-800 shadow" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              ➕ Setup New Bed
            </button>
            <button
              onClick={() => setActiveTab("waste_request")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "waste_request" ? "bg-white text-emerald-800 shadow" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              🚛 Request Biomass Waste
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "guide" ? "bg-white text-emerald-800 shadow" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              📘 Master Guide
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: ACTIVE BEDS & TELEMETRY */}
        {activeTab === "beds" && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Your Active Vermicompost Pits & Beds</h3>
                <p className="text-gray-500 text-xs">Monitor moisture, soil temperature, worm health, and harvest readiness.</p>
              </div>
              <button
                onClick={fetchBatches}
                className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
              >
                <RefreshCw size={14} className={loadingBatches ? "animate-spin" : ""} /> Refresh Telemetry
              </button>
            </div>

            {loadingBatches ? (
              <div className="text-center py-16 text-gray-400">Loading your vermicompost beds...</div>
            ) : batches.length === 0 ? (
              <div className="text-center py-14 bg-emerald-50/50 rounded-xl border border-dashed border-emerald-200">
                <Leaf size={48} className="mx-auto text-emerald-400 mb-3" />
                <h4 className="font-semibold text-gray-700 text-lg">No Vermicompost Beds Initialized Yet</h4>
                <p className="text-gray-500 text-sm max-w-md mx-auto mt-1 mb-4">
                  Transform farm biomass and kitchen peels into nutrient-rich black gold fertilizer with earthworms.
                </p>
                <button
                  onClick={() => setActiveTab("new_bed")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg shadow transition"
                >
                  ➕ Setup Your First Vermicompost Bed
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {batches.map((b) => {
                  const daysLeft = calculateDaysRemaining(b.expectedHarvestDate);
                  const moistureOk = b.moisturePercent >= 60 && b.moisturePercent <= 75;
                  const tempOk = b.temperatureC >= 20 && b.temperatureC <= 30;

                  return (
                    <div
                      key={b._id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow transition flex flex-col justify-between overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {b.stage.replace("_", " ")}
                            </span>
                            <h4 className="text-lg font-bold text-gray-800 mt-1">{b.bedName}</h4>
                          </div>
                          <button
                            onClick={() => handleDeleteBed(b._id)}
                            className="text-gray-400 hover:text-red-500 p-1 transition"
                            title="Remove bed"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                          <span>📐 Size: {b.dimensions}</span> • <span>🪱 {b.wormSpecies.split(" ")[0]} ({b.wormQuantityKg}kg)</span>
                        </p>

                        {/* Telemetry Meters */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className={`p-3 rounded-lg border ${moistureOk ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span className="flex items-center gap-1"><Droplets size={13} className="text-blue-500" /> Moisture</span>
                              <span className="font-bold">{b.moisturePercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${moistureOk ? "bg-blue-500" : "bg-amber-500"}`}
                                style={{ width: `${Math.min(100, b.moisturePercent)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1 block">
                              {moistureOk ? "✓ Optimal (60-75%)" : b.moisturePercent < 60 ? "⚠️ Too Dry (Water Bed)" : "⚠️ Too Wet (Aerate)"}
                            </span>
                          </div>

                          <div className={`p-3 rounded-lg border ${tempOk ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span className="flex items-center gap-1"><Thermometer size={13} className="text-emerald-500" /> Temp</span>
                              <span className="font-bold">{b.temperatureC}°C</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${tempOk ? "bg-emerald-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, (b.temperatureC / 45) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1 block">
                              {tempOk ? "✓ Favorable" : "⚠️ Thermal stress"}
                            </span>
                          </div>
                        </div>

                        {/* Harvest Days Counter */}
                        <div className="p-3 bg-gray-50 rounded-lg text-xs flex items-center justify-between mb-4">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Calendar size={14} className="text-emerald-600" /> Estimated Harvest:
                          </span>
                          <span className="font-bold text-emerald-800">
                            {daysLeft > 0 ? `${daysLeft} days remaining` : "✅ Ready for Harvest!"}
                          </span>
                        </div>

                        {/* Harvested Stats */}
                        {(b.vermiwashCollectedLiters > 0 || b.harvestedCompostKg > 0) && (
                          <div className="flex gap-2 text-xs mb-3">
                            {b.harvestedCompostKg > 0 && (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                                🪴 {b.harvestedCompostKg}kg Compost
                              </span>
                            )}
                            {b.vermiwashCollectedLiters > 0 && (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                                🧪 {b.vermiwashCollectedLiters}L Vermiwash
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="bg-gray-50 px-5 py-3 border-t flex items-center justify-between gap-2">
                        <button
                          onClick={() => { setSelectedBed(b); setActionType("moisture"); setActionInput(b.moisturePercent); }}
                          className="text-xs font-semibold text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded transition"
                        >
                          💧 Water / Moisture
                        </button>
                        <button
                          onClick={() => { setSelectedBed(b); setActionType("harvest_wash"); setActionInput(""); }}
                          className="text-xs font-semibold text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded transition"
                        >
                          🧪 Extract Wash
                        </button>
                        <button
                          onClick={() => { setSelectedBed(b); setActionType("harvest_compost"); setActionInput(b.biomassCapacityKg * 0.7); }}
                          className="text-xs font-semibold text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded transition"
                        >
                          🪴 Harvest
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SETUP NEW BED */}
        {activeTab === "new_bed" && (
          <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Plus className="text-emerald-600" /> Initialize New Vermicompost Bed
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Configure bed dimensions, organic substrate ratio, and earthworm inoculant.
            </p>

            <form onSubmit={handleCreateBed} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bed Identifier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Orchard Bed #2"
                    value={bedForm.bedName}
                    onChange={(e) => setBedForm({ ...bedForm, bedName: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bed Dimensions (L x W x H)</label>
                  <input
                    type="text"
                    value={bedForm.dimensions}
                    onChange={(e) => setBedForm({ ...bedForm, dimensions: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Earthworm Species</label>
                  <select
                    value={bedForm.wormSpecies}
                    onChange={(e) => setBedForm({ ...bedForm, wormSpecies: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  >
                    <option value="Eisenia fetida (Red Wigglers)">Eisenia fetida (Red Wigglers - Fast Composting)</option>
                    <option value="Eudrilus eugeniae (African Nightcrawler)">Eudrilus eugeniae (African Nightcrawler - High Biomass)</option>
                    <option value="Perionyx excavatus (Indian Blue Worm)">Perionyx excavatus (Indian Blue - High Moisture Tolerance)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Inoculated Earthworms (Kg)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={bedForm.wormQuantityKg}
                    onChange={(e) => setBedForm({ ...bedForm, wormQuantityKg: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Substrate (Kg)</label>
                  <input
                    type="number"
                    value={bedForm.currentBiomassKg}
                    onChange={(e) => setBedForm({ ...bedForm, currentBiomassKg: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Max Capacity (Kg)</label>
                  <input
                    type="number"
                    value={bedForm.biomassCapacityKg}
                    onChange={(e) => setBedForm({ ...bedForm, biomassCapacityKg: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Moisture (%)</label>
                  <input
                    type="number"
                    min="30"
                    max="90"
                    value={bedForm.moisturePercent}
                    onChange={(e) => setBedForm({ ...bedForm, moisturePercent: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg text-xs text-emerald-800 space-y-1">
                <strong>💡 Recommendation for Optimal Inoculation:</strong>
                <p>• Layer bottom 2 inches with dry sugarcane bagasse or coconut coir for aeration.</p>
                <p>• Add 30% semi-decomposed cow dung slurry + 70% shredded crop residue/fruit scraps.</p>
                <p>• Expected maturity: ~50-55 days. Yield expectation: ~65-70% dark vermicompost by weight.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("beds")}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBed}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  {creatingBed ? "Initializing..." : "🚀 Launch Vermicompost Bed"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: REQUEST BIOMASS SCRAPS */}
        {activeTab === "waste_request" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Plus size={18} className="text-emerald-600" /> Order Raw Organic Waste
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Delivery agents collect segregated kitchen & market scraps and deliver them directly to your farm.
              </p>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Waste Type</label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  >
                    <option value="fruit_veg_peels">Fresh Fruit & Vegetable Peels (High Nitrogen)</option>
                    <option value="dry_leaves_straw">Shredded Dry Leaves & Straw (High Carbon)</option>
                    <option value="mixed_organic">Mixed Pre-sorted Compost Scraps</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Required (Kg)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={requestedKg}
                    onChange={(e) => setRequestedKg(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                    placeholder="e.g. 50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery / Farm Location</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-sm bg-white"
                    placeholder="Your farm address"
                  />
                </div>

                <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Rate:</span> <strong>₹{PRICE_PER_KG} / kg</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Cost:</span> <strong>₹{(Number(requestedKg) || 0) * PRICE_PER_KG}</strong>
                  </div>
                </div>

                {requestMsg.text && (
                  <p className={`text-xs p-2.5 rounded-lg ${requestMsg.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                    {requestMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loadingRequest || !requestedKg}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {loadingRequest ? "Dispatching..." : "Submit Waste Order"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-3">Recent Waste Delivery Requests</h3>
              {requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border text-gray-400 text-sm">
                  No active or past waste collection requests.
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs text-left text-gray-600">
                    <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-3">Order Date</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {requests.map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{r.requestedKg} Kg</td>
                          <td className="px-4 py-3 font-medium text-emerald-700">₹{r.totalCost}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 font-semibold capitalize">
                              {getStatusIcon(r.status)} {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{r.adminNotes || "Standard Doorstep Delivery"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MASTER VERMICULTURE GUIDE */}
        {activeTab === "guide" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-900 text-base mb-3 flex items-center gap-2">
                ✅ What To Feed Earthworms
              </h4>
              <ul className="space-y-2 text-xs text-emerald-800">
                <li>• <strong>Fruit & Veggie Scraps:</strong> Gourds, leafy trimmings, banana peels, apple cores.</li>
                <li>• <strong>Decomposed Cow Dung:</strong> 10-15 days aged dung (kills anaerobic heat).</li>
                <li>• <strong>Crushed Eggshells:</strong> Adds vital calcium for worm cocoon reproduction.</li>
                <li>• <strong>Spent Coffee Grounds & Tea Leaves:</strong> Excellent nitrogen boost.</li>
                <li>• <strong>Dry Brown Biomass:</strong> Shredded paddy straw, coconut coir, fallen tree leaves.</li>
              </ul>
            </div>

            <div className="p-5 bg-red-50/60 rounded-xl border border-red-200">
              <h4 className="font-bold text-red-900 text-base mb-3 flex items-center gap-2">
                ❌ Toxic / Harmful Feed (NEVER ADD)
              </h4>
              <ul className="space-y-2 text-xs text-red-800">
                <li>• <strong>Citrus Peels (Lemon/Orange):</strong> Limonene oil burns worm skin; highly acidic.</li>
                <li>• <strong>Onions, Garlic & Chillies:</strong> Volatile sulfur compounds kill worm colonies.</li>
                <li>• <strong>Meats, Dairy, Oily Food:</strong> Causes anaerobic stink, flies, and maggots.</li>
                <li>• <strong>Fresh Hot Cow Dung:</strong> Internal heat exceeds 60°C, suffocating earthworms.</li>
                <li>• <strong>Chemical-Treated Straw:</strong> Herbicide residues will poison earthworms.</li>
              </ul>
            </div>

            <div className="p-5 bg-blue-50/60 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-900 text-base mb-2">💧 The Squeeze Test for Moisture</h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Take a fistful of compost from 4 inches deep and squeeze gently.
                <strong> Ideal:</strong> Only 1-2 drops of water should seep between your fingers. If no water comes out and it crumbles, spray water immediately. If water runs like a stream, add dry straw to prevent earthworm drowning.
              </p>
            </div>

            <div className="p-5 bg-amber-50/60 rounded-xl border border-amber-200">
              <h4 className="font-bold text-amber-900 text-base mb-2">🧪 Vermiwash Foliar Spray Ratio</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Dilute <strong>1 Liter Vermiwash in 10 Liters water</strong> (10% solution).
                Spray early morning on crop foliage to boost plant immunity, prevent leaf spots, and accelerate blossom set.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ACTION MODAL (Watering, Extraction, Harvest) */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              {actionType === "moisture" ? "💧 Record Bed Moisture & Watering"
               : actionType === "harvest_wash" ? "🧪 Record Vermiwash Collection"
               : "🪴 Harvest Finished Vermicompost"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Bed: <strong>{selectedBed.bedName}</strong></p>

            <form onSubmit={handleApplyAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {actionType === "moisture" ? "Measured Moisture Level (%)"
                   : actionType === "harvest_wash" ? "Vermiwash Extracted (Liters)"
                   : "Harvested Finished Compost (Kg)"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Maintenance Note (Optional)</label>
                <textarea
                  rows={2}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm bg-white"
                  placeholder="e.g. Added fresh cowpea straw, turned upper 2 inches..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBed(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg"
                >
                  {savingAction ? "Saving..." : "Confirm & Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VermiCompostPanel;
