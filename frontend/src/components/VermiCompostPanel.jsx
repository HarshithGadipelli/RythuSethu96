import React, { useState, useEffect } from "react";
import axios from "axios";
import { Leaf, Plus, Info, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const VermiCompostPanel = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [requestedKg, setRequestedKg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const PRICE_PER_KG = 3; // ₹3 per kg

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/farmer/vermi-compost/requests");
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!requestedKg || Number(requestedKg) <= 0) {
      setError("Please enter a valid quantity.");
      setLoading(false);
      return;
    }

    try {
      const totalCost = Number(requestedKg) * PRICE_PER_KG;
      await axios.post("http://localhost:5000/api/farmer/vermi-compost/request", {
        requestedKg: Number(requestedKg),
        totalCost
      });
      setSuccess("Your request has been submitted to Admin. It will be auto-debited upon approval.");
      setRequestedKg("");
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred while submitting the request.");
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "approved": return <CheckCircle size={16} className="text-green-500" />;
      case "fulfilled": return <CheckCircle size={16} className="text-blue-500" />;
      case "rejected": return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 text-green-700 rounded-full">
          <Leaf size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vermi Compost Center</h2>
          <p className="text-gray-500 text-sm">Request biodegradable waste for your vermicompost pits.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="md:col-span-1 bg-gray-50 p-5 rounded-lg border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={18} /> New Request
          </h3>
          <form onSubmit={handleRequestSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Waste Quantity (Kg)</label>
              <input
                type="number"
                min="1"
                value={requestedKg}
                onChange={(e) => setRequestedKg(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 50"
              />
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md flex gap-2 text-sm">
              <Info size={16} className="shrink-0 mt-0.5" />
              <div>
                <p><strong>Cost:</strong> ₹{PRICE_PER_KG} / Kg</p>
                <p className="mt-1">
                  Total Estimate: <span className="font-bold text-lg">₹{(Number(requestedKg) || 0) * PRICE_PER_KG}</span>
                </p>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

            <button
              type="submit"
              disabled={loading || !requestedKg}
              className="w-full bg-green-600 text-white font-medium py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              *Amount will be auto-debited from your wallet upon admin approval.
            </p>
          </form>
        </div>

        {/* Request History */}
        <div className="md:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4">Request History</h3>
          {requests.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100 text-gray-500">
              <Leaf size={32} className="mx-auto mb-2 opacity-50" />
              <p>No past requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 rounded-t-lg">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Total Cost</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req._id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-3">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium">{req.requestedKg} Kg</td>
                      <td className="px-4 py-3">₹{req.totalCost}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        {getStatusIcon(req.status)}
                        <span className="capitalize">{req.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VermiCompostPanel;
