import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import API, { BASE_URL } from "../api/api";
import { Truck, Send, CheckCircle2, Navigation, Zap } from "lucide-react";

// Fix for default marker icons in leaflet with react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createCustomIcon = (emoji, color) => {
  return L.divIcon({
    className: "custom-map-icon",
    html: `<div style="
      display: flex; justify-content: center; align-items: center;
      width: 32px; height: 32px; background: ${color};
      border: 2px solid white; border-radius: 50%;
      box-shadow: 0 4px 8px rgba(0,0,0,0.35); font-size: 1.1rem;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const ICONS = {
  agent: createCustomIcon("🚚", "#2563eb"),
  pickup: createCustomIcon("🌾", "#16a34a"),
  delivery: createCustomIcon("🏠", "#ea580c"),
};

const MapBounds = ({ points }) => {
  const map = useMap();
  const init = React.useRef(false);
  useEffect(() => {
    const validPoints = points.filter(p => p.lat && p.lng);
    if (validPoints.length > 0 && !init.current) {
      const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
      init.current = true;
    }
  }, [points, map]);
  return null;
};

export default function AdminGlobalMap({ activeDeliveries = [] }) {
  const [liveAgents, setLiveAgents] = useState({});
  const [dispatchingAgentId, setDispatchingAgentId] = useState(null);
  const [dispatchMsg, setDispatchMsg] = useState("");

  useEffect(() => {
    const socket = io(BASE_URL);
    socket.emit("join_admin_map");

    socket.on("agent_location_changed", (data) => {
      setLiveAgents(prev => ({
        ...prev,
        [data.agentId]: { lat: data.lat, lng: data.lng, timestamp: data.timestamp }
      }));
    });

    socket.on("agent_location_update", (data) => {
      setLiveAgents(prev => ({
        ...prev,
        [data.agentId]: { lat: data.lat, lng: data.lng, timestamp: data.timestamp }
      }));
    });

    return () => {
      socket.emit("leave_admin_map");
      socket.disconnect();
    };
  }, []);

  // Admin 1-Click Route Dispatch function
  const handleAdminDispatchRoute = async (agentId, agentDeliveries) => {
    setDispatchingAgentId(agentId);
    setDispatchMsg("");
    try {
      const agentPos = liveAgents[agentId] || { lat: 17.3850, lng: 78.4867 };
      // 1. Calculate optimal route
      const optRes = await API.post("/ml/route-optimize", {
        agentLat: agentPos.lat,
        agentLng: agentPos.lng,
        orders: agentDeliveries,
        algorithm: "tsp_genetic"
      });

      // 2. Push to Agent via admin dispatch endpoint
      await API.post("/admin/dispatch-route", {
        agentId,
        routeData: optRes.data,
        message: "Admin has optimized and dispatched your live route!"
      });

      setDispatchMsg(`✅ Optimized route (${optRes.data.stopsCount || optRes.data.optimized?.length} stops) dispatched to agent!`);
      setTimeout(() => setDispatchMsg(""), 5000);
    } catch (err) {
      console.error(err);
      setDispatchMsg("❌ Failed to dispatch route.");
      setTimeout(() => setDispatchMsg(""), 5000);
    } finally {
      setDispatchingAgentId(null);
    }
  };

  const markers = [];
  const polylines = [];
  const agentGroups = {};

  activeDeliveries.forEach(d => {
    if (d.status === "delivered" || d.status === "cancelled") return;

    const pickupLat = d.pickupLatitude || d.order?.crop?.latitude || d.order?.farmer?.latitude || d.order?.crop?.farmer?.latitude;
    const pickupLng = d.pickupLongitude || d.order?.crop?.longitude || d.order?.farmer?.longitude || d.order?.crop?.farmer?.longitude;
    const deliveryLat = d.deliveryLatitude || d.order?.customer?.latitude;
    const deliveryLng = d.deliveryLongitude || d.order?.customer?.longitude;

    const agentId = (d.agent?._id || d.agent)?.toString();
    if (agentId) {
      if (!agentGroups[agentId]) {
        agentGroups[agentId] = {
          agentId,
          name: d.agent?.name || "Delivery Agent",
          phone: d.agent?.phone || "",
          deliveries: []
        };
      }
      agentGroups[agentId].deliveries.push(d);
    }

    const currentAgentPos = liveAgents[agentId] || (d.agentLatitude && d.agentLongitude ? { lat: d.agentLatitude, lng: d.agentLongitude } : null);

    if (pickupLat && pickupLng) {
      markers.push({ id: `pickup-${d._id}`, lat: pickupLat, lng: pickupLng, type: "pickup", label: `🌾 Farm Pickup: ${d.order?.crop?.name || "Order"} (${d.trackingCode})`, delivery: d });
    }

    if (deliveryLat && deliveryLng) {
      markers.push({ id: `delivery-${d._id}`, lat: deliveryLat, lng: deliveryLng, type: "delivery", label: `🏠 Drop-off: ${d.deliveryLocation}`, delivery: d });
    }

    if (currentAgentPos) {
      markers.push({ id: `agent-${agentId}`, lat: currentAgentPos.lat, lng: currentAgentPos.lng, type: "agent", label: `🚚 Agent: ${d.agent?.name || "Driver"} (${d.trackingCode})`, agentId, delivery: d });
      
      if (pickupLat && deliveryLat) {
        polylines.push([
          [pickupLat, pickupLng],
          [currentAgentPos.lat, currentAgentPos.lng],
          [deliveryLat, deliveryLng]
        ]);
      }
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {dispatchMsg && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 16px", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem", border: "1px solid #86efac" }}>
          {dispatchMsg}
        </div>
      )}

      {/* Live Agent Fleet Status Bar */}
      {Object.keys(agentGroups).length > 0 && (
        <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "4px" }}>
          {Object.values(agentGroups).map(ag => (
            <div
              key={ag.agentId}
              style={{
                background: "white", padding: "10px 14px", borderRadius: "12px", border: "1px solid #e2e8f0",
                minWidth: "260px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>🚚 {ag.name}</strong>
                <span style={{ background: "#eff6ff", color: "#2563eb", padding: "1px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800 }}>
                  {ag.deliveries.length} Active Orders
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "8px" }}>
                Status: {liveAgents[ag.agentId] ? "🟢 Live GPS Online" : "🟡 In Transit"}
              </div>
              <button
                onClick={() => handleAdminDispatchRoute(ag.agentId, ag.deliveries)}
                disabled={dispatchingAgentId === ag.agentId}
                style={{
                  width: "100%", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white",
                  border: "none", padding: "6px 0", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
              >
                <Zap size={14} /> {dispatchingAgentId === ag.agentId ? "Dispatching..." : "⚡ Push AI Route to Agent"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Map */}
      <div style={{ height: "550px", width: "100%", borderRadius: "14px", overflow: "hidden", border: "1px solid #cbd5e1", position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <style>{`
          @keyframes flowDash {
            to { stroke-dashoffset: -20; }
          }
          .admin-flow-path {
            animation: flowDash 1s linear infinite;
          }
          .custom-map-icon {
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .custom-map-icon:hover {
            transform: scale(1.2);
          }
        `}</style>
        <MapContainer center={[17.385, 78.4867]} zoom={8} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          
          {polylines.map((path, i) => (
             <Polyline key={i} positions={path} color="#2563eb" weight={3} opacity={0.8} dashArray="8, 8" className="admin-flow-path" />
          ))}

          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={ICONS[m.type]}>
              <Popup maxWidth={260}>
                <div style={{ padding: "4px" }}>
                  <strong style={{ fontSize: "0.88rem", display: "block", color: "#0f172a" }}>{m.label}</strong>
                  {m.delivery && (
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                      Tracking: <code>{m.delivery.trackingCode}</code><br />
                      Status: <strong style={{ textTransform: "capitalize", color: "#16a34a" }}>{m.delivery.status}</strong>
                    </div>
                  )}
                  {m.agentId && agentGroups[m.agentId] && (
                    <button
                      onClick={() => handleAdminDispatchRoute(m.agentId, agentGroups[m.agentId].deliveries)}
                      style={{
                        marginTop: "8px", width: "100%", background: "#16a34a", color: "white",
                        border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      🚀 Dispatch AI Route
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          <MapBounds points={markers} />
        </MapContainer>
      </div>
    </div>
  );
}
