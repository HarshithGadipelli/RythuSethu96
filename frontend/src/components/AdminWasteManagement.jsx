import React, { useState, useEffect } from "react";
import axios from "axios";
import { Leaf, DollarSign, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../api/api";

const AdminWasteManagement = () => {
  const { user } = useAuth();
  const [wasteData, setWasteData] = useState({ totalBiodegradableWasteKg: 0, requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sellForm, setSellForm] = useState({ quantityKg: "", pricePerKg: "" });
  const [sellLoading, setSellLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const fetchWasteData = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/admin/waste/management`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setWasteData(data);
    } catch (err) {
      setError("Failed to fetch waste management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWasteData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.post(`${BASE_URL}/api/admin/waste/approve-request/${id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMsg({ type: "success", text: "Request approved successfully!" });
      fetchWasteData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to approve request." });
    }
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleSellBiogas = async (e) => {
    e.preventDefault();
    setSellLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/admin/waste/sell-biogas`, sellForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMsg({ type: "success", text: `Sold ${sellForm.quantityKg} kg to Biogas Plant.` });
      setSellForm({ quantityKg: "", pricePerKg: "" });
      fetchWasteData();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to sell waste." });
    } finally {
      setSellLoading(false);
      setTimeout(() => setMsg({ type: "", text: "" }), 3000);
    }
  };

  if (loading) return <p>Loading waste management module...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 text-green-700 rounded-full">
          <Leaf size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Circular Economy & Waste Management</h2>
          <p className="text-gray-500 text-sm">Manage cold storage biodegradable waste and fulfill farmer compost requests.</p>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 mb-4 rounded-md ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 border border-green-200 p-5 rounded-lg flex flex-col justify-center items-center">
          <Leaf size={32} className="text-green-600 mb-2" />
          <h3 className="text-green-800 font-semibold text-lg">Central Inventory</h3>
          <p className="text-3xl font-bold text-green-900 mt-2">{wasteData.totalBiodegradableWasteKg} Kg</p>
          <p className="text-green-700 text-xs mt-1">Biodegradable Waste in Storage</p>
        </div>

        <div className="md:col-span-2 bg-gray-50 border border-gray-200 p-5 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={18} /> Sell Excess to Biogas Plant
          </h3>
          <form onSubmit={handleSellBiogas} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Kg)</label>
              <input 
                type="number" min="1" required
                value={sellForm.quantityKg} onChange={e => setSellForm({...sellForm, quantityKg: e.target.value})}
                className="w-full p-2 border rounded-md" placeholder="Max: 1000"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Price / Kg (₹)</label>
              <input 
                type="number" min="0.1" step="0.1" required
                value={sellForm.pricePerKg} onChange={e => setSellForm({...sellForm, pricePerKg: e.target.value})}
                className="w-full p-2 border rounded-md" placeholder="e.g. 5"
              />
            </div>
            <button type="submit" disabled={sellLoading || !sellForm.quantityKg} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 h-10">
              {sellLoading ? "Processing..." : "Sell to Plant"}
            </button>
          </form>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Farmer Vermi Compost Requests</h3>
          <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full border border-green-300">
            🌱 Subsidized Rate: ₹3/Kg
          </span>
        </div>
        {wasteData.requests.length === 0 ? (
          <p className="text-gray-500">No requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Req Qty</th>
                  <th className="px-4 py-3">Cost (₹)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {wasteData.requests.map(req => (
                  <tr key={req._id} className="border-b">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {req.farmer?.name} <br/>
                      <span className="text-xs text-gray-500">{req.farmer?.phone}</span>
                    </td>
                    <td className="px-4 py-3">₹{req.farmer?.walletBalance || 0}</td>
                    <td className="px-4 py-3">{req.requestedKg} Kg</td>
                    <td className="px-4 py-3">₹{req.totalCost}</td>
                    <td className="px-4 py-3">
                      {req.status === "pending" ? (
                        <span className="bg-yellow-100 text-yellow-800 py-1 px-2 rounded-full text-xs flex items-center gap-1 w-max"><Clock size={12}/> Pending</span>
                      ) : (
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-full text-xs flex items-center gap-1 w-max"><CheckCircle size={12}/> Approved</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === "pending" && (
                        <button 
                          onClick={() => handleApprove(req._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Approve & Auto-Debit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWasteManagement;
