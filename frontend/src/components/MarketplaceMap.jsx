/**
 * MarketplaceMap — Immersive, realistic map for the Marketplace.
 *
 * Features:
 *  • Multiple tile layer options (satellite, street, terrain)
 *  • Customer "You Are Here" marker with accuracy circle
 *  • Distance rings (5km, 10km) from customer location
 *  • Distance line from customer to hovered/selected crop
 *  • Animated farmer markers with trust badge
 *  • Polyline routing on click
 */
import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, useMap,
  Circle, Polyline, Polygon, ZoomControl, useMapEvents
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BASE_URL } from "../api/api";

// Fix for default marker icons in leaflet with react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const pulseStyle = `
@keyframes heatmapPulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 0.4; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.heatmap-circle {
  animation: heatmapPulse 3s infinite ease-in-out;
  transform-origin: center;
}
@keyframes radarSweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.radar-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, rgba(59,130,246,0) 70%, rgba(59,130,246,0.4) 100%);
  animation: radarSweep 4s infinite linear;
  pointer-events: none;
}
@keyframes dashFlow {
  to { stroke-dashoffset: -20; }
}
.animated-path {
  animation: dashFlow 1s linear infinite;
}
.delivery-truck-icon {
  background: white;
  border: 2px solid #22c55e;
  border-radius: 50%;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 10px rgba(34,197,94,0.4);
  font-size: 1.1rem;
  z-index: 900;
}
.heatmap-legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid #e2e8f0;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
}
.heatmap-legend h4 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.75rem;
  color: #475569;
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
`;

// ─── Tile Layer Presets ───────────────────────────────────────────────────────
const TILE_LAYERS = {
  carto: {
    label: "🌍 Clean View",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© CARTO, © OpenStreetMap",
  },
  satellite: {
    label: "🛰️ Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "© Google Maps",
  },
  street: {
    label: "🗺️ OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  google: {
    label: "🚗 Google Roads",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "© Google Maps",
  },
  terrain: {
    label: "🏔️ Topo Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "© OpenTopoMap, © OpenStreetMap",
  },
  dark: {
    label: "🌙 Night Mode",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© CARTO, © OpenStreetMap",
  },
};

// ─── Custom Icons ─────────────────────────────────────────────────────────────
function createFarmerIcon(grade = "New", isOrganic = false, imgUrl = null, cropCount = 1) {
  const colors = {
    Platinum: "#7c3aed",
    Gold: "#d97706",
    Silver: "#6b7280",
    Bronze: "#c2410c",
    New: "#16a34a",
  };
  const bg = colors[grade] || colors.New;
  
  // Format the image URL correctly if it exists to handle local vs absolute
  const parsedImg = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `${BASE_URL}${imgUrl}`) : null;
  
  const innerHtml = parsedImg 
    ? `<div style="width:38px;height:38px;border-radius:50%;background-image:url('${parsedImg}');background-size:cover;background-position:center;transform:rotate(45deg);"></div>`
    : `<span style="transform:rotate(45deg);font-size:1.3rem;line-height:1">${isOrganic ? "🌿" : "🌾"}</span>`;

  const badgeHtml = cropCount > 1 
    ? `<span style="position:absolute;top:-6px;right:-6px;background:#ef4444;color:white;font-size:10px;font-weight:800;border-radius:10px;padding:1px 5px;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);transform:none;">${cropCount}</span>`
    : (isOrganic ? `<span style="position:absolute;top:-6px;right:-6px;background:#16a34a;color:white;font-size:10px;border-radius:10px;padding:1px 4px;border:2px solid white;transform:none;">🌿</span>` : "");

  return L.divIcon({
    className: "",
    html: `<div style="
      position:relative;
      width:44px;height:44px;
      background:${bg};
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 5px 18px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
    ">
      ${innerHtml}
      ${badgeHtml}
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -48],
  });
}

const customerIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;
    background:white;
    border:3px solid #3b82f6;
    border-radius:50%;
    box-shadow:0 0 0 6px rgba(59,130,246,0.25);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ─── Helper: fly-to on selection ─────────────────────────────────────────────
function FlyTo({ lat, lng, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [lat, lng, map, zoom]);
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 200); }, []);
  return null;
}

// ─── Distance formatter ───────────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Live Delivery Trucks Layer ─────────────────────────────────────────────
const LiveTrucksLayer = React.memo(() => {
  const [trucks, setTrucks] = useState([]);
  
  useEffect(() => {
    let mounted = true;

    const fetchAgents = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/public/agents`);
        if (!res.ok) return;
        const liveAgents = await res.json();
        
        if (mounted) {
          setTrucks(prevTrucks => {
            return liveAgents.map(agent => {
              const existing = prevTrucks.find(t => t.id === agent._id);
              if (existing) {
                return { ...existing, targetLat: agent.latitude, targetLng: agent.longitude, name: agent.name };
              }
              return {
                id: agent._id, lat: agent.latitude, lng: agent.longitude,
                targetLat: agent.latitude, targetLng: agent.longitude,
                name: agent.name, speed: 0.0001
              };
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch live agents:", err);
      }
    };

    fetchAgents();
    const pollInterval = setInterval(fetchAgents, 15000); // Update target every 15 seconds

    // High-fps Animation Loop to interpolate positions smoothly
    const animInterval = setInterval(() => {
      setTrucks(prev => prev.map(t => {
        const dLat = t.targetLat - t.lat;
        const dLng = t.targetLng - t.lng;
        const dist = Math.sqrt(dLat*dLat + dLng*dLng);
        
        if (dist < 0.0001) return { ...t, lat: t.targetLat, lng: t.targetLng };
        return { ...t, lat: t.lat + (dLat / dist) * t.speed, lng: t.lng + (dLng / dist) * t.speed };
      }));
    }, 100);
    
    return () => {
      mounted = false;
      clearInterval(pollInterval);
      clearInterval(animInterval);
    };
  }, []);

  return (
    <>
      {trucks.map(truck => (
        <Marker 
          key={truck.id} 
          position={[truck.lat, truck.lng]} 
          icon={L.divIcon({
            className: "",
            html: `<div class="delivery-truck-icon" title="${truck.name || 'Delivery'}">🚚</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })}
          zIndexOffset={900}
        >
          <Popup>
            <strong>🚚 Active Agent</strong><br />
            {truck.name}
          </Popup>
        </Marker>
      ))}
    </>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarketplaceMap({
  crops = [],
  selected = null,
  onCropClick,
  trustScores = {},
  customerLat,
  customerLng,
  onCustomerLocationChange,
}) {
  // Day/Night Sync
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 18 || currentHour <= 6;
  const defaultTile = isNight ? "dark" : "satellite";

  const [tileKey, setTileKey] = useState(defaultTile);
  const [hoveredCrop, setHoveredCrop] = useState(null);
  const [showDemand, setShowDemand] = useState(false);
  const [showWeatherRadar, setShowWeatherRadar] = useState(false);
  const [showFarmBoundaries, setShowFarmBoundaries] = useState(false);

  // NEW STATES
  const [searchRadius, setSearchRadius] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quickFilter, setQuickFilter] = useState("all");
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [osrmRoute, setOsrmRoute] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showDirectionsDrawer, setShowDirectionsDrawer] = useState(false);
  const [weatherRadarTime, setWeatherRadarTime] = useState(null);
  const tile = TILE_LAYERS[tileKey];

  useEffect(() => {
    if (showWeatherRadar && !weatherRadarTime) {
      fetch("https://api.rainviewer.com/public/weather-maps.json")
        .then(res => res.json())
        .then(data => {
          if (data.radar && data.radar.past && data.radar.past.length > 0) {
            setWeatherRadarTime(data.radar.past[data.radar.past.length - 1].time);
          }
        }).catch(err => console.error("Weather radar fetch error", err));
    }
  }, [showWeatherRadar, weatherRadarTime]);

  // Auto-fly to customer location when detected
  useEffect(() => {
    if (customerLat && customerLng && !hoveredCrop && !selected) {
      setFlyToCoords({ lat: customerLat, lng: customerLng, zoom: 12 });
    }
  }, [customerLat, customerLng, hoveredCrop, selected]);

  // Determine centre: prefer selected crop, else customer loc, else Hyderabad
  const focusCrop = hoveredCrop || selected;
  const focusLat = focusCrop?.latitude || focusCrop?.farmer?.latitude;
  const focusLng = focusCrop?.longitude || focusCrop?.farmer?.longitude;

  // High-accuracy live GPS locator
  const handleAcquireCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setIsLocating(false);
        let address = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
          const d = await r.json();
          address = d.display_name?.split(",").slice(0, 3).join(",") || address;
        } catch {}
        if (onCustomerLocationChange) {
          onCustomerLocationChange({ lat: coords.latitude, lng: coords.longitude, address });
        }
        setFlyToCoords({ lat: coords.latitude, lng: coords.longitude, zoom: 14 });
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation warning:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // OSRM Route & Step-by-Step Directions Fetching
  useEffect(() => {
    if (customerLat && customerLng && focusLat && focusLng) {
      const url = `https://router.project-osrm.org/route/v1/driving/${customerLng},${customerLat};${focusLng},${focusLat}?overview=full&geometries=geojson&steps=true`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            const steps = route.legs?.[0]?.steps?.map((s, idx) => ({
              id: idx,
              instruction: s.maneuver?.type === "depart" ? "Depart towards farm" : s.name ? `Turn on ${s.name}` : `Continue on road (${Math.round(s.distance)}m)`,
              distanceMeters: Math.round(s.distance),
              durationSecs: Math.round(s.duration)
            })) || [];

            setOsrmRoute({
              positions: coords,
              duration: route.duration,
              distance: route.distance,
              steps: steps,
              targetFarm: focusCrop?.farmer?.farmLocation || focusCrop?.farmer?.name || "Direct Farm Parcel"
            });
          } else {
            setOsrmRoute(null);
          }
        }).catch(err => {
          console.error("OSRM route fetch failed:", err);
          setOsrmRoute(null);
        });
    } else {
      setOsrmRoute(null);
    }
  }, [customerLat, customerLng, focusLat, focusLng]);

  const centre =
    focusLat && focusLng
      ? [focusLat, focusLng]
      : customerLat && customerLng
      ? [customerLat, customerLng]
      : [17.385, 78.4867];

  // Distance from customer to focused crop
  const distKm =
    customerLat && customerLng && focusLat && focusLng
      ? haversine(customerLat, customerLng, focusLat, focusLng)
      : null;

  const routeLine =
    customerLat && customerLng && focusLat && focusLng
      ? [
          [customerLat, customerLng],
          [focusLat, focusLng],
        ]
      : null;

  // Extract organic zones and apply filters
  const visibleCrops = crops.filter(c => {
    if (quickFilter === "organic" && !c.isOrganic) return false;
    if (quickFilter === "prebook" && !c.isPrebooking) return false;
    if (!customerLat || !customerLng) return true;
    const lat = c.latitude || c.farmer?.latitude;
    const lng = c.longitude || c.farmer?.longitude;
    if (!lat || !lng) return false;
    return haversine(customerLat, customerLng, lat, lng) <= searchRadius;
  });

  const organicFarms = visibleCrops.filter(c => c.isOrganic && (c.latitude || c.farmer?.latitude));
  const organicZonePositions = organicFarms.length >= 3 
    ? organicFarms.map(c => [c.latitude || c.farmer?.latitude, c.longitude || c.farmer?.longitude])
    : [];

  const topFarms = Object.values(
    visibleCrops.reduce((acc, c) => {
      const lat = c.latitude || c.farmer?.latitude;
      const lng = c.longitude || c.farmer?.longitude;
      if (!lat || !lng) return acc;
      const fid = (c.farmer?._id || c.farmer)?.toString?.() || "unknown";
      if (!acc[fid]) {
         acc[fid] = { id: fid, name: c.farmer?.name || "Farmer", lat, lng, image: c.farmer?.profilePic || c.image || null };
      }
      return acc;
    }, {})
  ).sort((a, b) => (trustScores[b.id]?.score || 0) - (trustScores[a.id]?.score || 0)).slice(0, 5);

  return (
    <div style={{ 
      position: isFullscreen ? "fixed" : "relative", 
      top: isFullscreen ? 0 : "auto", 
      left: isFullscreen ? 0 : "auto",
      width: isFullscreen ? "100vw" : "100%", 
      height: isFullscreen ? "100vh" : "100%", 
      zIndex: isFullscreen ? 9999 : 1,
      background: "#fff"
    }}>
      <style>{pulseStyle}</style>

      <button
        onClick={() => {
          setIsFullscreen(!isFullscreen);
          setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
        }}
        title="Toggle Fullscreen"
        style={{
          position: "absolute", top: 10, left: 50, zIndex: 1000,
          background: "white", border: "2px solid rgba(0,0,0,0.2)",
          borderRadius: 4, width: 34, height: 34,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontWeight: 800, fontSize: "1.2rem", color: "#475569"
        }}
      >
        {isFullscreen ? "↙" : "↗"}
      </button>

      <div style={{
        position: "absolute", top: 60, left: 10, zIndex: 1000,
        display: "flex", flexDirection: "column", gap: "0.4rem"
      }}>
        {["all", "organic", "prebook"].map(type => (
          <button key={type} onClick={() => setQuickFilter(type)} style={{
            padding: "6px 12px", borderRadius: "100px", border: "1px solid #e2e8f0",
            background: quickFilter === type ? "#16a34a" : "rgba(255,255,255,0.9)",
            color: quickFilter === type ? "white" : "#475569",
            fontWeight: 700, fontSize: "0.75rem", cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            transition: "all 0.2s"
          }}>
            {type === "all" ? "🌍 All Crops" : type === "organic" ? "🌿 Organic Only" : "⏳ Pre-Book"}
          </button>
        ))}
      </div>

      {/* Tile Layer Switcher */}
      <div style={{
        position: "absolute", top: 10, right: 10, zIndex: 1000,
        display: "flex", gap: "0.3rem", flexWrap: "wrap",
        background: "rgba(255,255,255,0.95)", borderRadius: 12,
        padding: "6px 10px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        border: "1px solid #e2e8f0",
      }}>
        {Object.entries(TILE_LAYERS).map(([key, layer]) => (
          <button
            key={key}
            onClick={() => setTileKey(key)}
            style={{
              padding: "3px 10px",
              borderRadius: 100,
              border: "none",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              background: tileKey === key ? "var(--green-mid, #16a34a)" : "transparent",
              color: tileKey === key ? "white" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            {layer.label}
          </button>
        ))}
        <div style={{ width: "1px", height: "20px", background: "#cbd5e1", margin: "0 4px" }} />
        <button
          onClick={() => setShowDemand(!showDemand)}
          style={{
            padding: "3px 10px",
            borderRadius: 100,
            fontSize: "0.72rem",
            fontWeight: 700,
            cursor: "pointer",
            background: showDemand ? "linear-gradient(135deg, #ef4444, #dc2626)" : "transparent",
            color: showDemand ? "white" : "#ef4444",
            border: showDemand ? "none" : "1px solid #ef4444",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          🔥 {showDemand ? "Demand View ON" : "Demand View OFF"}
        </button>
        <button
          onClick={() => setShowWeatherRadar(!showWeatherRadar)}
          style={{
            padding: "3px 10px",
            borderRadius: 100,
            fontSize: "0.72rem",
            fontWeight: 700,
            cursor: "pointer",
            background: showWeatherRadar ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "transparent",
            color: showWeatherRadar ? "white" : "#3b82f6",
            border: showWeatherRadar ? "none" : "1px solid #3b82f6",
            transition: "all 0.2s",
          }}
        >
          🌧️ Radar
        </button>
        <button
          onClick={handleAcquireCurrentLocation}
          disabled={isLocating}
          style={{
            padding: "3px 12px",
            borderRadius: 100,
            fontSize: "0.72rem",
            fontWeight: 800,
            cursor: "pointer",
            background: customerLat ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "white",
            border: "none",
            boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
          title="Detect and center your live high-accuracy GPS position"
        >
          📍 {isLocating ? "Locating..." : customerLat ? "Live GPS Locked" : "Find My GPS"}
        </button>

        {osrmRoute && (
          <button
            onClick={() => setShowDirectionsDrawer(!showDirectionsDrawer)}
            style={{
              padding: "3px 12px",
              borderRadius: 100,
              fontSize: "0.72rem",
              fontWeight: 800,
              cursor: "pointer",
              background: showDirectionsDrawer ? "#0f172a" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            🛣️ {showDirectionsDrawer ? "Hide Directions" : "Turn-by-Turn Directions"}
          </button>
        )}
      </div>

      {/* Demand Heatmap Legend */}
      {showDemand && (
        <div className="heatmap-legend">
          <h4>🔥 Demand Heatmap</h4>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#ef4444" }}></div>
            <span>High Demand (&gt;50 orders)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#f97316" }}></div>
            <span>Medium Demand (20-50 orders)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#eab308" }}></div>
            <span>Low Demand (&lt;20 orders)</span>
          </div>
        </div>
      )}

      {/* Distance Info Badge with 1-Click Directions Drawer */}
      {distKm !== null && (
        <div 
          onClick={() => setShowDirectionsDrawer(true)}
          style={{
            position: "absolute", bottom: 14, left: 14, zIndex: 1000,
            background: "rgba(255,255,255,0.98)",
            borderRadius: 14, padding: "10px 16px",
            boxShadow: "0 6px 25px rgba(0,0,0,0.18)",
            border: "1px solid #bbf7d0",
            display: "flex", flexDirection: "column", gap: 2,
            cursor: "pointer", transition: "transform 0.15s"
          }}
          className="hover-scale"
          title="Click to view full turn-by-turn driving directions"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 800, textTransform: "uppercase" }}>
              🛣️ Live Road Directions
            </span>
            <span style={{ fontSize: "0.7rem", background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "10px", fontWeight: 700 }}>
              {osrmRoute ? `${Math.round(osrmRoute.distance / 1000)} km` : `${distKm.toFixed(1)} km`}
            </span>
          </div>
          <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#16a34a" }}>
            {osrmRoute ? `~${Math.round(osrmRoute.duration / 60)} Mins Drive` : `~${Math.round(distKm * 2 + 15)} Mins`}
          </span>
          <span style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
            Click to open step-by-step route ➔
          </span>
        </div>
      )}

      {/* Step-by-Step Directions Side Drawer */}
      {showDirectionsDrawer && osrmRoute && (
        <div style={{
          position: "absolute", top: 10, left: 10, bottom: 10, width: "320px", maxWidth: "90%",
          background: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(8px)",
          zIndex: 1001, borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div style={{ padding: "12px 16px", background: "#064e3b", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "0.9rem", display: "block" }}>🛣️ Turn-by-Turn Navigation</strong>
              <span style={{ fontSize: "0.72rem", opacity: 0.85 }}>Direct route to {osrmRoute.targetFarm}</span>
            </div>
            <button onClick={() => setShowDirectionsDrawer(false)} style={{ background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ padding: "10px 16px", background: "#f0fdf4", borderBottom: "1px solid #dcfce7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>TOTAL DISTANCE</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#15803d" }}>{(osrmRoute.distance / 1000).toFixed(1)} km</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700 }}>ESTIMATED TIME</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#15803d" }}>{Math.round(osrmRoute.duration / 60)} Mins</div>
            </div>
          </div>

          {/* Turn Steps List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {osrmRoute.steps && osrmRoute.steps.length > 0 ? (
              osrmRoute.steps.map((st, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "6px 8px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ background: "#2563eb", color: "white", borderRadius: "50%", width: "20px", height: "20px", fontSize: "0.7rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.25 }}>{st.instruction}</div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>{st.distanceMeters > 1000 ? `${(st.distanceMeters/1000).toFixed(1)} km` : `${st.distanceMeters} m`} • ~{Math.ceil(st.durationSecs/60)} min</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: "0.8rem", color: "#64748b", textAlign: "center", marginTop: "2rem" }}>Direct highway link loaded. Follow animated polyline on map.</div>
            )}
          </div>

          {/* External Google Navigation link */}
          <div style={{ padding: "10px 16px", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "6px" }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${focusLat},${focusLng}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white", padding: "8px 0",
                borderRadius: "10px", textAlign: "center", textDecoration: "none", fontWeight: 700, fontSize: "0.8rem",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
              }}
            >
              🧭 Start Live GPS in Google Maps
            </a>
          </div>
        </div>
      )}

      {/* "Use My Location" button */}
      {!customerLat && onCustomerLocationChange && (
        <div style={{
          position: "absolute", bottom: 14, left: 14, zIndex: 1000,
        }}>
          <button
            onClick={() => {
              navigator.geolocation?.getCurrentPosition(async ({ coords }) => {
                let address = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
                try {
                  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
                  const d = await r.json();
                  address = d.display_name?.split(",").slice(0, 3).join(",") || address;
                } catch {}
                onCustomerLocationChange({ lat: coords.latitude, lng: coords.longitude, address });
              });
            }}
            style={{
              padding: "8px 14px", borderRadius: 100,
              background: "#3b82f6", color: "white", border: "none",
              fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
              boxShadow: "0 4px 15px rgba(59,130,246,0.4)",
            }}
          >
            📍 Show My Location
          </button>
        </div>
      )}

      {customerLat && customerLng && (
        <div style={{
          position: "absolute", bottom: 20, right: 10, zIndex: 1000,
          background: "rgba(255,255,255,0.95)", padding: "10px 15px",
          borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
          border: "1px solid #e2e8f0", width: 200,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>Search Radius</span>
            <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: 700 }}>{searchRadius} km</span>
          </div>
          <input 
            type="range" min="1" max="100" value={searchRadius} 
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#3b82f6" }}
          />
        </div>
      )}

      {topFarms.length > 0 && (
        <div className="no-scrollbar" style={{
          position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
          display: "flex", gap: "10px", overflowX: "auto", maxWidth: "50%", padding: "10px"
        }}>
          {topFarms.map(f => (
            <div key={f.id} onClick={() => setFlyToCoords({ lat: f.lat, lng: f.lng })} style={{
              background: "rgba(255,255,255,0.95)", borderRadius: "100px", padding: "6px 14px",
              display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", flexShrink: 0
            }}>
              <img src={f.image ? (f.image.startsWith("http") ? f.image : `${BASE_URL}${f.image}`) : "/default.png"} style={{width:24,height:24,borderRadius:"50%",objectFit:"cover"}} alt=""/>
              <div>
                <strong style={{fontSize:"0.75rem", display:"block", whiteSpace:"nowrap"}}>{f.name}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      <MapContainer
        center={centre}
        zoom={customerLat ? 12 : 7}
        style={{ height: "100%", width: "100%", borderRadius: "calc(var(--radius-lg, 12px) - 4px)" }}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer url={tile.url} attribution={tile.attribution} maxZoom={20} />
        <MapInvalidator />
        {focusLat && focusLng && <FlyTo lat={focusLat} lng={focusLng} />}
        {flyToCoords && <FlyTo lat={flyToCoords.lat} lng={flyToCoords.lng} zoom={15} />}

        {/* Customer location with Radar Sweep */}
        {customerLat && customerLng && (
          <>
            <Marker position={[customerLat, customerLng]} icon={customerIcon} zIndexOffset={1000}>
              <Popup>
                <strong>📍 Your Location</strong>
                <br />
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  You are here
                </span>
              </Popup>
            </Marker>
            
            {/* Radar Overlay Div injected at center */}
            <Marker position={[customerLat, customerLng]} icon={L.divIcon({
              className: "",
              html: `<div class="radar-overlay" style="width: 250px; height: 250px; margin-left: -125px; margin-top: -125px;"></div>`,
              iconSize: [0, 0]
            })} interactive={false} zIndexOffset={1} />

            {/* 5km accuracy ring */}
            <Circle
              center={[customerLat, customerLng]}
              radius={5000}
              pathOptions={{ color: "#3b82f6", fillColor: "transparent", weight: 1.5, dashArray: "6 4" }}
            />
            {/* 10km ring */}
            <Circle
              center={[customerLat, customerLng]}
              radius={10000}
              pathOptions={{ color: "#3b82f6", fillColor: "transparent", weight: 1, dashArray: "4 6" }}
            />
          </>
        )}

        {/* Distance line to focused crop */}
        {osrmRoute ? (
          <Polyline
            positions={osrmRoute.positions}
            pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.8, className: "animated-path" }}
          />
        ) : routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ color: "#22c55e", weight: 4, opacity: 0.9, dashArray: "10 10", className: "animated-path" }}
          />
        )}
        
        {/* Render Moving Trucks (Live) using Memoized Component */}
        <LiveTrucksLayer />

        {/* Weather Radar Layer */}
        {showWeatherRadar && weatherRadarTime && (
          <TileLayer
            url={`https://tilecache.rainviewer.com/v2/radar/${weatherRadarTime}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.65}
            zIndex={10}
          />
        )}

        {/* Glowing Organic Polygon Zones */}
        {organicZonePositions.length >= 3 && !showFarmBoundaries && (
          <Polygon 
            positions={organicZonePositions} 
            pathOptions={{ 
              color: "#16a34a", 
              weight: 2, 
              fillColor: "#22c55e", 
              fillOpacity: 0.15,
              dashArray: "10 5"
            }} 
          >
            <Popup>
              <strong>🌿 Certified Organic Zone</strong>
              <p style={{fontSize:"0.8rem", color:"#64748b", margin:0}}>High density of organic farming.</p>
            </Popup>
          </Polygon>
        )}

        {/* Demand Heatmap Layer */}
        {showDemand && visibleCrops.map((c, index) => {
          const lat = c.latitude || c.farmer?.latitude;
          const lng = c.longitude || c.farmer?.longitude;
          if (!lat || !lng) return null;
          // Calculate a "demand score" to visualize deterministically
          const orders = c.totalOrders || c.soldCount || c.views || (c.quantity > 500 ? 55 : (c.quantity > 100 ? 30 : 10));
          if (orders < 5) return null;
          
          const radius = Math.min(25000, orders * 200 + 2000); // Larger radius for visibility
          const color = orders > 50 ? "#ef4444" : (orders > 20 ? "#f97316" : "#eab308");
          const opacity = Math.min(0.7, 0.3 + (orders * 0.005));

          return (
            <React.Fragment key={`demand-${c._id || index}`}>
              {/* Outer Glow Circle */}
              <Circle
                center={[lat, lng]}
                radius={radius * 1.5}
                pathOptions={{
                  color: "transparent",
                  fillColor: color,
                  fillOpacity: opacity * 0.3,
                  className: "heatmap-circle"
                }}
              />
              {/* Inner Core Circle */}
              <Circle
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color: color,
                  weight: 2,
                  fillColor: color,
                  fillOpacity: opacity,
                }}
              >
                <Popup>
                  <div style={{ textAlign: "center", padding: "4px" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: "4px" }}>🔥</div>
                    <strong style={{ fontSize: "1rem", color: color, display: "block" }}>High Demand Zone</strong>
                    <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "6px", fontWeight: 600 }}>
                      {c.name}
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.05)", padding: "4px 8px", borderRadius: "8px", marginTop: "6px", fontSize: "0.75rem", color: "#64748b" }}>
                      <strong>{orders}+</strong> active orders in this area
                    </div>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          );
        })}

        {/* Farm Boundaries (Geofencing Simulation) */}
        {showFarmBoundaries && visibleCrops.map((c, index) => {
          const lat = c.latitude || c.farmer?.latitude;
          const lng = c.longitude || c.farmer?.longitude;
          if (!lat || !lng) return null;
          
          const offset = 0.006 + (Math.random() * 0.004);
          const positions = [
            [lat - offset, lng - offset],
            [lat + offset, lng - (offset * 0.8)],
            [lat + (offset * 1.2), lng + offset],
            [lat - (offset * 0.5), lng + (offset * 1.1)]
          ];

          return (
            <Polygon 
              key={`zone-${c._id || index}`}
              positions={positions} 
              pathOptions={{ 
                color: c.isOrganic ? "#16a34a" : "#8b5cf6", 
                weight: 2, 
                fillColor: c.isOrganic ? "#22c55e" : "#a78bfa", 
                fillOpacity: 0.25,
              }} 
            >
              <Popup>
                <strong>{c.isOrganic ? "🌿 Organic Farm Boundary" : "🛑 Farm Boundary"}</strong>
                <p style={{fontSize:"0.8rem", color:"#64748b", margin:0}}>Estimated acreage for {c.farmer?.name || "Farmer"}'s {c.name}.</p>
              </Popup>
            </Polygon>
          );
        })}

        {/* Farmer / crop markers grouped by Farmer & exact coordinates */}
        <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={35}>
          {Object.values(visibleCrops.reduce((acc, c) => {
            const lat = c.latitude !== undefined && c.latitude !== null ? Number(c.latitude) : (c.farmer?.latitude ? Number(c.farmer.latitude) : null);
            const lng = c.longitude !== undefined && c.longitude !== null ? Number(c.longitude) : (c.farmer?.longitude ? Number(c.farmer.longitude) : null);
            if (!lat || !lng) return acc;
            const fid = (c.farmer?._id || c.farmer)?.toString?.() || "unknown";
            
            // Group by both farmer and exact location coordinates so multiple locations render distinct markers
            const groupKey = `${fid}_${lat.toFixed(5)}_${lng.toFixed(5)}`;
            
            if (!acc[groupKey]) {
               acc[groupKey] = { 
                 id: fid, 
                 groupKey: groupKey,
                 name: c.farmer?.name || "Farmer", 
                 phone: c.farmer?.phone || "",
                 farmLocation: c.farmLocation || c.location || c.farmer?.farmName || c.farmer?.location || "Registered Farm",
                 lat, 
                 lng, 
                 crops: [], 
                 isOrganic: false, 
                 image: c.farmer?.avatar || c.farmer?.profilePic || c.image || null 
               };
            }
            acc[groupKey].crops.push(c);
            if (c.isOrganic) acc[groupKey].isOrganic = true;
            return acc;
          }, {})).map((f) => {
            const trust = trustScores[f.id];
            const grade = trust?.grade || "New";
            const dist =
              customerLat && customerLng
                ? haversine(customerLat, customerLng, f.lat, f.lng)
                : null;

            return (
              <Marker
                key={f.groupKey}
                position={[f.lat, f.lng]}
                icon={createFarmerIcon(grade, f.isOrganic, f.image, f.crops.length)}
                eventHandlers={{
                  mouseover: () => setHoveredCrop(f.crops[0]),
                  mouseout: () => setHoveredCrop(null),
                }}
              >
                <Popup maxWidth={290} minWidth={260}>
                  <div style={{ fontFamily: "'Inter', sans-serif", padding: "4px" }}>
                    {/* Farmer Profile Header */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                      <img
                        src={f.image ? (f.image.startsWith("http") ? f.image : `${BASE_URL}${f.image}`) : "/default.png"}
                        alt={f.name}
                        style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #16a34a", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {f.name}
                          </strong>
                          {trust && (
                            <span title={`${trust.grade} (${trust.score}/100)`} style={{ fontSize: "0.85rem" }}>
                              {trust.emoji}
                            </span>
                          )}
                        </div>
                        <span style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>
                          🧑‍🌾 Verified Producer
                        </span>
                      </div>
                    </div>

                    {/* Exact Location & GPS Coordinates Badge */}
                    <div style={{
                      background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px",
                      padding: "6px 8px", marginBottom: "8px"
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "5px", color: "#166534", fontSize: "0.78rem", fontWeight: 700 }}>
                        <span style={{ fontSize: "0.9rem" }}>📍</span>
                        <span style={{ lineHeight: 1.25 }}>{f.farmLocation}</span>
                      </div>
                      <div style={{ marginTop: "4px", fontSize: "0.7rem", color: "#15803d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>GPS: {f.lat.toFixed(4)}°, {f.lng.toFixed(4)}°</span>
                        {dist !== null && <span style={{ fontWeight: 800, color: "#2563eb" }}>{dist.toFixed(1)} km away</span>}
                      </div>
                    </div>

                    {/* Available Produce List */}
                    <div style={{ marginBottom: "8px" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                        <span>Produce Available</span>
                        <span>({f.crops.length} items)</span>
                      </div>
                      <div style={{ maxHeight: "135px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {f.crops.map((crop) => (
                          <div
                            key={crop._id}
                            onClick={() => onCropClick && onCropClick(crop)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "5px 8px", background: "#f8fafc", borderRadius: "6px",
                              border: "1px solid #e2e8f0", cursor: "pointer", transition: "all 0.15s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#ecfdf5"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#f8fafc"}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                              <span style={{ fontSize: "1rem" }}>{crop.isOrganic ? "🌿" : "🌾"}</span>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: "0.82rem", color: "#1e293b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {crop.name}
                                </strong>
                                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                                  {crop.quantity} {crop.unit || "kg"} left
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <strong style={{ fontSize: "0.85rem", color: "#16a34a" }}>
                                ₹{crop.price}/{crop.unit || "kg"}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <button
                        onClick={() => {
                          setFlyToCoords({ lat: f.lat, lng: f.lng });
                          if (f.crops[0] && onCropClick) onCropClick(f.crops[0]);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                          color: "white", border: "none", padding: "7px 0",
                          borderRadius: "100px", fontWeight: 700, fontSize: "0.8rem",
                          cursor: "pointer", width: "100%", textAlign: "center",
                          boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)"
                        }}
                      >
                        🛒 View & Order Produce
                      </button>

                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => {
                            setHoveredCrop(f.crops[0]);
                            setFlyToCoords({ lat: f.lat, lng: f.lng });
                          }}
                          style={{
                            flex: 1, background: "#eff6ff", color: "#2563eb",
                            border: "1px solid #bfdbfe", padding: "5px 0",
                            borderRadius: "100px", fontWeight: 700, fontSize: "0.72rem",
                            cursor: "pointer"
                          }}
                        >
                          🛣️ Road Route
                        </button>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1, background: "#f8fafc", color: "#475569",
                            border: "1px solid #cbd5e1", padding: "5px 0",
                            borderRadius: "100px", fontWeight: 700, fontSize: "0.72rem",
                            textAlign: "center", textDecoration: "none", display: "inline-block"
                          }}
                        >
                          🧭 Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
