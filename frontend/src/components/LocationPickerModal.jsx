import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { X, MapPin, LocateFixed, Check, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icons for Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapCentrator({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { animate: true });
  }, [center, map]);
  
  // Fix map sizing issues inside modals
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);
  return null;
}

export default function LocationPickerModal({ isOpen, onClose, onConfirm, initialLat, initialLng }) {
  const [position, setPosition] = useState([initialLat || 17.385, initialLng || 78.4867]); // Default Hyderabad
  const [address, setAddress] = useState("");
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const markerRef = useRef(null);

  // Reverse geocode whenever position changes significantly or is manually set
  const reverseGeocode = async (lat, lng) => {
    setLoadingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      const a = data.address || {};
      const parts = [
        a.house_number,
        a.road || a.neighbourhood,
        a.suburb || a.village || a.town,
        a.city || a.county,
        a.state,
        a.postcode
      ].filter(Boolean);
      
      const humanAddr = parts.length > 0 ? parts.join(", ") : data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(humanAddr);
    } catch (e) {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoadingAddr(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reverseGeocode(position[0], position[1]);
    }
  }, [isOpen]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setPosition([latLng.lat, latLng.lng]);
          reverseGeocode(latLng.lat, latLng.lng);
        }
      },
    }),
    [],
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        reverseGeocode(latitude, longitude);
        setLoadingGeo(false);
      },
      (err) => {
        console.error(err);
        setLoadingGeo(false);
        alert("Failed to get location. Please check your permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 100005,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          style={{
            background: "white", width: "100%", height: "100%", maxWidth: "none",
            borderRadius: "0px", overflow: "hidden",
            display: "flex", flexDirection: "column"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem 1.5rem", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", color: "#1e293b" }}>
              <MapPin size={20} color="#3b82f6" />
              Select Delivery Location
            </h3>
            <button 
              onClick={onClose}
              style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Map Area */}
          <div style={{ position: "relative", flex: 1, minHeight: 0, width: "100%", background: "#f8fafc" }}>
            <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%", zIndex: 1 }} zoomControl={false}>
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                attribution="© Google Maps"
              />
              <MapCentrator center={position} />
              <Marker
                draggable={true}
                eventHandlers={eventHandlers}
                position={position}
                ref={markerRef}
              />
            </MapContainer>

            {/* Current Location Overlay Button */}
            <button
              onClick={handleGetCurrentLocation}
              disabled={loadingGeo}
              style={{
                position: "absolute", bottom: 20, right: 20, zIndex: 1000,
                background: "white", border: "1px solid #cbd5e1", borderRadius: "50%",
                width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                color: loadingGeo ? "#94a3b8" : "#3b82f6", transition: "all 0.2s"
              }}
              title="Jump to current location"
            >
              {loadingGeo ? <Loader2 size={20} className="spin" /> : <LocateFixed size={22} />}
            </button>

            {/* Helper tooltip */}
            <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", padding: "6px 12px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, color: "#334155", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", pointerEvents: "none" }}>
              📍 Drag the marker to pinpoint
            </div>
          </div>

          {/* Footer Area */}
          <div style={{ padding: "1.2rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem" }}>
                Delivery Address
              </label>
              <div style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.8rem", fontSize: "0.95rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {loadingAddr ? <Loader2 size={16} color="#64748b" className="spin" /> : <MapPin size={16} color="#16a34a" />}
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {loadingAddr ? "Fetching address..." : address}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onConfirm({ address, lat: position[0], lng: position[1] });
                onClose();
              }}
              disabled={loadingAddr}
              style={{
                width: "100%", padding: "0.8rem", background: "#16a34a", color: "white",
                border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                cursor: loadingAddr ? "not-allowed" : "pointer", opacity: loadingAddr ? 0.7 : 1,
                boxShadow: "0 4px 6px rgba(22,163,74,0.3)"
              }}
            >
              <Check size={18} /> Confirm Location
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
