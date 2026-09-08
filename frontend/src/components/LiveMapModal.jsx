import API, { BASE_URL } from '../api/api';
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";
import { X, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in leaflet with react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Agent Icon (Rythu Sethu Uniform Dark Green)
const agentIcon = L.divIcon({
  className: "custom-agent-icon",
  html: `<div style="
    display: flex; justify-content: center; align-items: center;
    width: 40px; height: 40px; background: linear-gradient(135deg, #064e3b, #047857);
    border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  "><span style="font-size: 1.2rem; animation: pulse 1s infinite;">🛵</span></div>`,
  iconSize: [40, 40], iconAnchor: [20, 20]
});

const farmerIcon = L.divIcon({
  className: "custom-farmer-icon",
  html: `<div style="
    display: flex; justify-content: center; align-items: center;
    width: 36px; height: 36px; background: linear-gradient(135deg, #16a34a, #15803d);
    border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  "><span style="font-size: 1.1rem;">🌾</span></div>`,
  iconSize: [36, 36], iconAnchor: [18, 18]
});

const customerIcon = L.divIcon({
  className: "custom-customer-icon",
  html: `<div style="
    display: flex; justify-content: center; align-items: center;
    width: 36px; height: 36px; background: linear-gradient(135deg, #eab308, #ca8a04);
    border: 2px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  "><span style="font-size: 1.1rem;">🏠</span></div>`,
  iconSize: [36, 36], iconAnchor: [18, 18]
});

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      const currentCenter = map.getCenter();
      const dist = currentCenter.distanceTo(L.latLng(position[0], position[1]));
      
      if (dist > 500) {
        map.flyTo(position, 16, { duration: 1.5 });
      } else if (dist > 10) {
        map.panTo(position, { animate: true, duration: 0.5 });
      }
    }
  }, [position]);
  return null;
}

export default function LiveMapModal({ order, onClose }) {
  const [orderData, setOrderData] = useState(typeof order === "object" ? order : null);

  useEffect(() => {
    if (typeof order === "string" && order) {
      API.get(`/orders/${order}`)
        .then(r => { if (r.data) setOrderData(r.data); })
        .catch(() => {
          API.get(`/orders/${order}/bill`)
            .then(r => { if (r.data) setOrderData(r.data); })
            .catch(() => {});
        });
    } else if (order) {
      setOrderData(order);
    }
  }, [order]);

  const activeOrder = orderData || (typeof order === "object" ? order : {});

  const pickupLat = activeOrder.crop?.latitude || activeOrder.farmer?.latitude || activeOrder.crop?.farmer?.latitude || 17.385;
  const pickupLng = activeOrder.crop?.longitude || activeOrder.farmer?.longitude || activeOrder.crop?.farmer?.longitude || 78.486;
  const pickupPos = [pickupLat, pickupLng];

  const deliveryLat = activeOrder.deliveryLatitude || activeOrder.customer?.latitude || (pickupLat + 0.04);
  const deliveryLng = activeOrder.deliveryLongitude || activeOrder.customer?.longitude || (pickupLng + 0.04);
  const deliveryPos = [deliveryLat, deliveryLng];

  const [agentPos, setAgentPos] = useState(
    activeOrder?.agent?.latitude && activeOrder?.agent?.longitude 
      ? [activeOrder.agent.latitude, activeOrder.agent.longitude] 
      : [deliveryLat - 0.015, deliveryLng - 0.015]
  );

  const [mapCenter, setMapCenter] = useState(agentPos || deliveryPos);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!activeOrder?.agent) return;
    const s = io(BASE_URL);
    setSocket(s);

    const agentId = typeof activeOrder.agent === "object" ? activeOrder.agent._id : activeOrder.agent;
    
    if (agentId) {
      s.emit("join_agent_room", agentId);
      s.on("agent_location_changed", (data) => {
        if (data.agentId === agentId) {
          setAgentPos([data.lat, data.lng]);
          setMapCenter([data.lat, data.lng]);
        }
      });
    }

    return () => {
      s.disconnect();
    };
  }, [activeOrder?.agent]);

  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "600px", padding: 0, overflow: "hidden", position: "relative" }}>
        
        {/* Header */}
        <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Navigation size={20} color="#3b82f6" /> Live Tracking
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Order: {order.crop?.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Map Container */}
        <div style={{ height: "400px", width: "100%", background: "#f1f5f9", position: "relative" }}>
          {mapCenter ? (
            <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer 
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" 
                attribution="Map data &copy; Google" 
                maxZoom={20}
              />
              <MapUpdater position={mapCenter} />
              
              {/* Draw Route Polyline */}
              {pickupPos && deliveryPos && (
                <Polyline 
                  positions={[
                    pickupPos,
                    agentPos || pickupPos,
                    deliveryPos
                  ]} 
                  color="#3b82f6" 
                  weight={5} 
                  opacity={0.8} 
                  dashArray="10, 10" 
                />
              )}

              {/* Farmer Marker */}
              {pickupPos && (
                <Marker position={pickupPos} icon={farmerIcon}>
                  <Popup>Pickup Location (Farmer)</Popup>
                </Marker>
              )}

              {agentPos && (
                <Marker position={agentPos} icon={agentIcon}>
                  <Popup>Delivery Agent is here</Popup>
                </Marker>
              )}

              {/* Customer Marker */}
              {deliveryPos && (
                <Marker position={deliveryPos} icon={customerIcon}>
                  <Popup>Delivery Destination (Customer)</Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="loader mb-2"></span>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading map...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

