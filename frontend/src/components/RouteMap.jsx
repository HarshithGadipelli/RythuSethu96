import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createNumberedIcon = (num, emoji, color) => {
  return L.divIcon({
    className: "custom-route-icon",
    html: `<div style="
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 36px; height: 36px; background: ${color};
      border: 2px solid white; border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3); color: white;
      font-weight: 800; font-size: 0.8rem; position: relative;
    ">
      <span>${emoji}</span>
      <span style="
        position: absolute; bottom: -4px; right: -4px;
        background: #0f172a; color: white; border: 1px solid white;
        border-radius: 50%; width: 16px; height: 16px; font-size: 0.65rem;
        display: flex; align-items: center; justify-content: center;
      ">${num}</span>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

const agentIcon = L.divIcon({
  className: "custom-agent-icon",
  html: `<div style="
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; background: #2563eb;
    border: 2px solid white; border-radius: 50%;
    box-shadow: 0 4px 12px rgba(37,99,235,0.4); font-size: 1.2rem;
  ">🚚</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

// Component to dynamically adjust map bounds to fit all markers
const MapBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const validPoints = points.filter(p => p.lat && p.lng);
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [points, map]);
  return null;
};

export default function RouteMap({ routeData, agentPos }) {
  const [routeLine, setRouteLine] = useState([]);

  const stops = routeData?.optimized || routeData?.optimizedRoute || [];

  useEffect(() => {
    if (!stops || stops.length === 0) return;

    const coords = [];
    if (agentPos && agentPos.lat && agentPos.lng) {
      coords.push(`${agentPos.lng},${agentPos.lat}`);
    }
    stops.forEach(stop => {
      const lat = stop.latitude || stop.lat;
      const lng = stop.longitude || stop.lng;
      if (lat && lng) {
        coords.push(`${lng},${lat}`);
      }
    });

    if (coords.length < 2) return;

    const fetchOSRMRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coords.join(";")}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const decoded = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteLine(decoded);
        }
      } catch (err) {
        // Fallback straight lines
        const fallback = [];
        if (agentPos) fallback.push([agentPos.lat, agentPos.lng]);
        stops.forEach(s => {
          if (s.latitude && s.longitude) fallback.push([s.latitude, s.longitude]);
        });
        setRouteLine(fallback);
      }
    };

    fetchOSRMRoute();
  }, [routeData, agentPos]);

  if (!stops || stops.length === 0) return null;

  const markers = [];
  if (agentPos && agentPos.lat && agentPos.lng) {
    markers.push({
      id: "agent_loc",
      lat: agentPos.lat,
      lng: agentPos.lng,
      isAgent: true,
      label: "📍 Your Dispatch Hub (Starting Point)"
    });
  }

  stops.forEach((stop, index) => {
    const isPickup = stop.action === "Pickup" || stop.type === "pickup";
    const lat = stop.latitude || stop.lat;
    const lng = stop.longitude || stop.lng;
    if (lat && lng) {
      markers.push({
        id: `stop-${index}`,
        lat,
        lng,
        isAgent: false,
        stopNumber: index + 1,
        isPickup,
        stop
      });
    }
  });

  const centerPos = agentPos ? [agentPos.lat, agentPos.lng] : (markers[0] ? [markers[0].lat, markers[0].lng] : [17.385, 78.4867]);

  return (
    <div style={{ height: "420px", width: "100%", borderRadius: "14px", overflow: "hidden", border: "1px solid #cbd5e1", zIndex: 0, position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <MapContainer center={centerPos} zoom={11} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {routeLine.length > 0 && (
          <Polyline positions={routeLine} color="#2563eb" weight={5} opacity={0.85} dashArray="8 4" />
        )}

        {markers.map((m) => {
          if (m.isAgent) {
            return (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={agentIcon}>
                <Popup>
                  <strong>{m.label}</strong>
                </Popup>
              </Marker>
            );
          }

          const stop = m.stop;
          const isPickup = m.isPickup;
          const color = isPickup ? "#16a34a" : "#ea580c";
          const emoji = isPickup ? "🌾" : "🏠";

          return (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={createNumberedIcon(m.stopNumber, emoji, color)}>
              <Popup maxWidth={260}>
                <div style={{ padding: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ background: isPickup ? "#dcfce7" : "#ffedd5", color: isPickup ? "#166534" : "#9a3412", padding: "2px 8px", borderRadius: "4px", fontWeight: 800, fontSize: "0.75rem" }}>
                      Stop #{m.stopNumber} • {isPickup ? "FARM PICKUP" : "DOORSTEP DELIVERY"}
                    </span>
                  </div>
                  <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block" }}>{stop.cropName || "Crop Produce"} ({stop.quantityKg || 1} kg)</strong>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", margin: "3px 0" }}>📍 {stop.location}</div>
                  <div style={{ fontSize: "0.75rem", color: "#334155" }}>Contact: <strong>{stop.farmerName || stop.customerName || "Recipient"}</strong></div>
                  
                  <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, background: "#2563eb", color: "white", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, textAlign: "center", textDecoration: "none" }}
                    >
                      🧭 Google Maps
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapBounds points={markers} />
      </MapContainer>
    </div>
  );
}
