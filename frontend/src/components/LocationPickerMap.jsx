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
  const markerRef = React.useRef(null);

  const eventHandlers = React.useMemo(
    () => ({
      async dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          const lat = latLng.lat;
          const lng = latLng.lng;
          setPosition([lat, lng]);
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const d = await r.json();
            setAddress(d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          } catch (err) {
            setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        }
      },
    }),
    [setPosition, setAddress]
  );

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const d = await r.json();
        setAddress(d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      } catch (err) {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    },
  });

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};

// Component to programmatically fly to a location
const FlyToLocation = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true });
    }
  }, [map, position]);
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
    <div style={{ height: "420px", width: "100%", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #cbd5e1", position: "relative" }}>
      {/* Top Controls Bar */}
      <div style={{ padding: "8px 12px", background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
        <span>📍 <strong>Click map or drag pin</strong> to adjust position accurately</span>
        <button
          type="button"
          onClick={locateMe}
          disabled={loadingLoc}
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white",
            border: "none", padding: "4px 10px", borderRadius: "6px", cursor: loadingLoc ? "not-allowed" : "pointer",
            fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem"
          }}
        >
          {loadingLoc ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <LocateFixed size={14} />}
          <span>🎯 Use Current GPS</span>
        </button>
      </div>

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
