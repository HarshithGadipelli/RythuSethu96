import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { LocateFixed, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationMarker = ({ position, setPosition, setAddress }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const d = await r.json();
        setAddress(d.display_name || `${lat}, ${lng}`);
      } catch (err) {
        setAddress(`${lat}, ${lng}`);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

// Component to programmatically fly to a location
const FlyToLocation = ({ position }) => {
  const map = useMap();
  if (position) {
    map.flyTo(position, 15, { animate: true });
  }
  return null;
};

export default function LocationPickerMap({ onSelect, initialLat = 20.5937, initialLng = 78.9629 }) {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleConfirm = () => {
    if (position) {
      onSelect({ lat: position[0], lng: position[1], address });
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setPosition([lat, lng]);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
          const data = await res.json();
          const a = data.address || {};
          const parts = [a.house_number, a.road || a.neighbourhood, a.suburb || a.village || a.town, a.city || a.county, a.state, a.postcode].filter(Boolean);
          setAddress(parts.length > 0 ? parts.join(", ") : data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setLoadingLoc(false);
      },
      (err) => {
        setLoadingLoc(false);
        alert(err.code === 1 ? "Location permission denied." : "Could not detect location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #e2e8f0", position: "relative" }}>
      <button
        onClick={locateMe}
        disabled={loadingLoc}
        style={{
          position: "absolute", top: "10px", right: "10px", zIndex: 1000,
          background: "white", border: "1px solid #ccc", padding: "8px",
          borderRadius: "50%", cursor: loadingLoc ? "not-allowed" : "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center"
        }}
        title="Find My Location"
      >
        {loadingLoc ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "#3b82f6" }} /> : <LocateFixed size={20} color="#3b82f6" />}
      </button>

      <div style={{ flex: 1, position: "relative", zIndex: 0 }}>
        <MapContainer center={[initialLat, initialLng]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <LocationMarker position={position} setPosition={setPosition} setAddress={setAddress} />
          <FlyToLocation position={position} />
        </MapContainer>
      </div>
      <div style={{ padding: "10px", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-dark)", flex: 1, paddingRight: "10px" }}>
          <strong>Selected:</strong> {address || "Click on the map to drop a pin"}
        </div>
        <button 
          onClick={handleConfirm}
          disabled={!position}
          style={{
            padding: "8px 16px", background: position ? "var(--green-mid)" : "#cbd5e1",
            color: "white", border: "none", borderRadius: "4px", cursor: position ? "pointer" : "not-allowed",
            fontWeight: "bold"
          }}
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}
