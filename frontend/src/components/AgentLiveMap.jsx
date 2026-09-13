import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
      width: 30px; height: 30px; background: ${color};
      border: 2px solid white; border-radius: 50%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 1rem;
    ">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const ICONS = {
  agent: L.divIcon({
    className: "custom-map-icon",
    html: `<div style="
      display: flex; justify-content: center; align-items: center;
      width: 30px; height: 30px; background: linear-gradient(135deg, #064e3b, #047857);
      border: 2px solid white; border-radius: 50%;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 1rem;
    "><span style="animation: pulse 1s infinite;">🛵</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  }),
  pickup: createCustomIcon("📍", "#22c55e"), // Green marker for pickup
  delivery: createCustomIcon("📍", "#eab308"), // Yellow marker for delivery
};

const MapBounds = ({ points }) => {
  const map = useMap();
  const init = React.useRef(false);
  useEffect(() => {
    if (points.length > 0 && !init.current) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
      init.current = true;
    }
  }, [points, map]);
  return null;
};

export default function AgentLiveMap({ agentPos, deliveryData }) {
  const [routeLine, setRouteLine] = useState([]);
  const [routeStats, setRouteStats] = useState(null);

  useEffect(() => {
    const coords = [];
    if (agentPos) {
      coords.push(`${agentPos.lng},${agentPos.lat}`);
    }

    if (deliveryData) {
      if (deliveryData.pickupLongitude && deliveryData.pickupLatitude) {
        coords.push(`${deliveryData.pickupLongitude},${deliveryData.pickupLatitude}`);
      } else if (deliveryData.order?.crop?.longitude && deliveryData.order?.crop?.latitude) {
        coords.push(`${deliveryData.order.crop.longitude},${deliveryData.order.crop.latitude}`);
      }

      const dLat = deliveryData.deliveryLatitude || deliveryData.order?.customer?.latitude;
      const dLng = deliveryData.deliveryLongitude || deliveryData.order?.customer?.longitude;
      if (dLng && dLat) {
        coords.push(`${dLng},${dLat}`);
      }
    }

    if (coords.length < 2) {
      setRouteLine([]);
      setRouteStats(null);
      return;
    }

    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coords.join(";")}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const decoded = route.geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteLine(decoded);
          setRouteStats({
            distanceKm: (route.distance / 1000).toFixed(1),
            durationMins: Math.round(route.duration / 60)
          });
        }
      } catch (err) {
        console.error("Failed to fetch OSRM route", err);
      }
    };

    fetchOSRMRoute();
  }, [deliveryData, agentPos]);

  if (!deliveryData) return null;

  const isHeavyTruck = deliveryData.vehicleType === "heavy_truck" || deliveryData.tier === "heavy_truck";

  const markers = [];
  if (agentPos) {
    markers.push({ id: "agent", lat: agentPos.lat, lng: agentPos.lng, type: "agent", label: "Your Location" });
  }

  const pickupLat = deliveryData.pickupLatitude || deliveryData.order?.crop?.latitude || deliveryData.order?.farmer?.latitude || deliveryData.order?.crop?.farmer?.latitude;
  const pickupLng = deliveryData.pickupLongitude || deliveryData.order?.crop?.longitude || deliveryData.order?.farmer?.longitude || deliveryData.order?.crop?.farmer?.longitude;
  
  if (pickupLat && pickupLng) {
    markers.push({ id: "pickup", lat: pickupLat, lng: pickupLng, type: "pickup", label: isHeavyTruck ? "🌾 Farm Pickup" : "🏢 Cold Hub Pickup" });
  }

  const deliveryLat = deliveryData.deliveryLatitude || deliveryData.order?.customer?.latitude;
  const deliveryLng = deliveryData.deliveryLongitude || deliveryData.order?.customer?.longitude;

  if (deliveryLat && deliveryLng) {
    markers.push({ id: "delivery", lat: deliveryLat, lng: deliveryLng, type: "delivery", label: isHeavyTruck ? "🏢 Cold Hub Destination" : "🏠 Doorstep Drop-off" });
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Route & Vehicle Tier Banner */}
      <div style={{
        background: isHeavyTruck ? "rgba(2, 132, 199, 0.08)" : "rgba(22, 163, 74, 0.08)",
        border: isHeavyTruck ? "1px solid rgba(2, 132, 199, 0.3)" : "1px solid rgba(22, 163, 74, 0.3)",
        borderRadius: "10px",
        padding: "0.65rem 0.9rem",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: "0.85rem", color: isHeavyTruck ? "#0369a1" : "#166534" }}>
            {isHeavyTruck ? "🚛 Heavy Freight Truck (Farm ➔ Cold Hub)" : "🚲 Hyperlocal Dabbawala Courier (Hub ➔ Doorstep)"}
          </span>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Routing Algorithm: <code>{isHeavyTruck ? "tsp_genetic (Highway Genetic TSP)" : "dabbawala_cluster (2km Radial Cluster)"}</code>
            {isHeavyTruck && deliveryData.coldChainTemp && (
              <span style={{ marginLeft: "8px", color: "#0284c7", fontWeight: 700 }}>
                ❄️ Cold Chain: {deliveryData.coldChainTemp}
              </span>
            )}
          </div>
        </div>

        {routeStats && (
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-dark)" }}>
            ⚡ Shortest Route: {routeStats.distanceKm} km (~{routeStats.durationMins} mins)
          </div>
        )}
      </div>

      <div style={{ height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", zIndex: 0 }}>
        <style>{`
          @keyframes dashFlowAgent {
            to { stroke-dashoffset: -20; }
          }
          .agent-flow-path {
            animation: dashFlowAgent 1s linear infinite;
          }
        `}</style>
        <MapContainer center={agentPos || [20.5937, 78.9629]} zoom={10} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          
          {routeLine.length > 0 && (
            <Polyline
              positions={routeLine}
              color={isHeavyTruck ? "#0284c7" : "#22c55e"}
              weight={4}
              opacity={0.85}
              dashArray={isHeavyTruck ? "12, 6" : "8, 8"}
              className="agent-flow-path"
            />
          )}

          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={ICONS[m.type]}>
              <Popup>
                <strong>{m.label}</strong>
              </Popup>
            </Marker>
          ))}

          <MapBounds points={markers} />
        </MapContainer>
      </div>
    </div>
  );
}
