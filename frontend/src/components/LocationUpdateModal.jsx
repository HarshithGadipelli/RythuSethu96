import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { X, MapPin, LocateFixed, Check, Loader2, Search, Compass, Layers } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

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
    if (center && center[0] && center[1]) {
      map.flyTo(center, 15, { duration: 0.8 });
    }
  }, [center, map]);

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [map]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationUpdateModal({ isOpen, onClose, onLocationSaved }) {
  const { user, updateUser } = useAuth();

  const role = user?.role || "customer";
  const defaultLat = user?.latitude || 17.385;
  const defaultLng = user?.longitude || 78.4867;
  const defaultAddr = user?.location || "";

  const [position, setPosition] = useState([defaultLat, defaultLng]);
  const [address, setAddress] = useState(defaultAddr);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mapLayer, setMapLayer] = useState("street"); // street | satellite

  const markerRef = useRef(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const lat = user?.latitude || 17.385;
      const lng = user?.longitude || 78.4867;
      setPosition([lat, lng]);
      setAddress(user?.location || "");
      setSaveSuccess(false);
      setSearchQuery("");
      setSearchResults([]);
      if (!user?.location) {
        reverseGeocode(lat, lng);
      }
    }
  }, [isOpen, user]);

  const reverseGeocode = async (lat, lng) => {
    setLoadingAddr(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "User-Agent": "RythuSethuApp/2.0" } }
      );
      const data = await res.json();
      const a = data.address || {};
      const parts = [
        a.road || a.neighbourhood || a.suburb,
        a.village || a.town || a.city || a.county,
        a.state_district,
        a.state,
        a.postcode
      ].filter(Boolean);

      const humanAddr = parts.length > 0 ? parts.join(", ") : data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddress(humanAddr);
    } catch (e) {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setLoadingAddr(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`,
        { headers: { "User-Agent": "RythuSethuApp/2.0" } }
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setPosition([lat, lng]);
    setAddress(item.display_name);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        await reverseGeocode(latitude, longitude);
        setLoadingGeo(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setLoadingGeo(false);
        alert("Failed to get live location. Please ensure location permissions are granted.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

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
    []
  );

  const handleMapClick = (lat, lng) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSaveLocation = async () => {
    setSaving(true);
    try {
      const payload = {
        location: address || `${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
        latitude: position[0],
        longitude: position[1]
      };

      if (user) {
        // Save to backend API
        const res = await API.put("/auth/update-location", payload);
        if (res.data?.user) {
          updateUser(res.data.user);
        } else {
          updateUser(payload);
        }
      } else {
        // Guest mode fallback
        localStorage.setItem("guest_location", JSON.stringify(payload));
      }

      // Notify global listeners
      window.dispatchEvent(new CustomEvent("user_location_updated", { detail: payload }));
      if (onLocationSaved) onLocationSaved(payload);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed to update location:", err);
      alert("Failed to save location. Please try again.");
      setSaving(false);
    }
  };

  const roleTitle = role === "farmer" 
    ? "🌾 Update Farm / Produce Location" 
    : role === "agent" 
    ? "🚚 Update Delivery Dispatch Hub" 
    : "📍 Update Delivery Location";

  const roleSubtitle = role === "farmer"
    ? "Accurate farm GPS coordinates ensure customers and agents can find your harvest on the map."
    : role === "agent"
    ? "Keep your live dispatch hub up-to-date for optimized pickup routing and accurate customer ETAs."
    : "Set your exact delivery address to calculate live distance, delivery fees, and quick farmer dispatch.";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 100000,
          background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem"
        }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 24, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            background: "white", width: "100%", maxWidth: "800px", height: "90vh", maxHeight: "780px",
            borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: "1px solid rgba(226, 232, 240, 0.8)"
          }}
        >
          {/* Header */}
          <div style={{
            padding: "1.25rem 1.75rem",
            background: "linear-gradient(135deg, #064e3b 0%, #166534 100%)",
            color: "white",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {roleTitle}
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.82rem", color: "#bbf7d0", opacity: 0.95 }}>
                {roleSubtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", width: 34, height: 34,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "white", transition: "all 0.2s"
              }}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search & GPS Quick Actions Bar */}
          <div style={{ padding: "0.85rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
            <form onSubmit={handleSearch} style={{ flex: 1, minWidth: "240px", display: "flex", position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village, city, district, or pin code..."
                style={{
                  width: "100%", padding: "0.6rem 2.4rem 0.6rem 0.85rem",
                  borderRadius: "100px", border: "1.5px solid #cbd5e1",
                  fontSize: "0.85rem", outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                  background: "#16a34a", color: "white", border: "none", borderRadius: "50%",
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                {isSearching ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loadingGeo}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.6rem 1.1rem", borderRadius: "100px",
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "white",
                border: "none", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
              }}
            >
              {loadingGeo ? <Loader2 size={15} className="spin" /> : <LocateFixed size={15} />}
              Use Live GPS
            </button>

            {/* Map Layer Switch */}
            <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "100px", padding: 2 }}>
              <button
                type="button"
                onClick={() => setMapLayer("street")}
                style={{
                  padding: "4px 10px", borderRadius: "100px", border: "none",
                  fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                  background: mapLayer === "street" ? "white" : "transparent",
                  color: mapLayer === "street" ? "#0f172a" : "#64748b"
                }}
              >
                🗺️ Street
              </button>
              <button
                type="button"
                onClick={() => setMapLayer("satellite")}
                style={{
                  padding: "4px 10px", borderRadius: "100px", border: "none",
                  fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                  background: mapLayer === "satellite" ? "white" : "transparent",
                  color: mapLayer === "satellite" ? "#0f172a" : "#64748b"
                }}
              >
                🛰️ Satellite
              </button>
            </div>
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div style={{
              background: "white", borderBottom: "1px solid #cbd5e1",
              maxHeight: "150px", overflowY: "auto", padding: "0.5rem 1.5rem",
              zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
            }}>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => selectSearchResult(item)}
                  style={{
                    padding: "0.45rem 0.6rem", borderRadius: "6px", cursor: "pointer",
                    fontSize: "0.82rem", color: "#1e293b", display: "flex", alignItems: "center",
                    gap: "0.5rem", borderBottom: idx < searchResults.length - 1 ? "1px solid #f1f5f9" : "none"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <MapPin size={14} color="#16a34a" />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.display_name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Map View */}
          <div style={{ position: "relative", flex: 1, minHeight: 0, width: "100%", background: "#f8fafc" }}>
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
              zoomControl={false}
            >
              {mapLayer === "satellite" ? (
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  attribution="© Google Maps"
                />
              ) : (
                <TileLayer
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap"
                />
              )}
              <MapCentrator center={position} />
              <MapClickHandler onMapClick={handleMapClick} />
              <Marker
                draggable={true}
                eventHandlers={eventHandlers}
                position={position}
                ref={markerRef}
              />
            </MapContainer>

            {/* Coordinates Floating Badge */}
            <div style={{
              position: "absolute", top: 12, left: 12, zIndex: 1000,
              background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(4px)",
              padding: "6px 12px", borderRadius: "100px", border: "1px solid #cbd5e1",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: "6px"
            }}>
              <Compass size={14} color="#16a34a" />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
                Lat: {position[0].toFixed(5)}°, Lng: {position[1].toFixed(5)}°
              </span>
            </div>

            {/* Hint Badge */}
            <div style={{
              position: "absolute", bottom: 14, left: 12, zIndex: 1000,
              background: "rgba(15, 23, 42, 0.8)", color: "white",
              padding: "4px 10px", borderRadius: "100px", fontSize: "0.72rem",
              fontWeight: 600, pointerEvents: "none"
            }}>
              💡 Drag the marker or tap anywhere on the map to pinpoint
            </div>
          </div>

          {/* Footer & Save Controls */}
          <div style={{
            padding: "1.2rem 1.75rem", background: "#f8fafc",
            borderTop: "1px solid #e2e8f0", flexShrink: 0
          }}>
            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase",
                letterSpacing: "0.5px", marginBottom: "0.35rem"
              }}>
                <span>Exact Location / Address Name</span>
                {loadingAddr && <span style={{ color: "#16a34a", textTransform: "none", fontSize: "0.72rem" }}>Resolving GPS...</span>}
              </label>
              <div style={{
                background: "white", border: "1.5px solid #cbd5e1", borderRadius: "10px",
                padding: "0.6rem 0.85rem", display: "flex", alignItems: "center", gap: "0.6rem"
              }}>
                <MapPin size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter or confirm your location name..."
                  style={{
                    border: "none", outline: "none", width: "100%",
                    fontSize: "0.9rem", color: "#1e293b", fontWeight: 600
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "0.75rem", borderRadius: "12px",
                  background: "white", border: "1.5px solid #cbd5e1",
                  color: "#475569", fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={saving || saveSuccess}
                style={{
                  flex: 2, padding: "0.75rem", borderRadius: "12px",
                  background: saveSuccess ? "#16a34a" : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  color: "white", border: "none", fontWeight: 800, fontSize: "0.95rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  cursor: saving || saveSuccess ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(22, 163, 74, 0.35)",
                  transition: "all 0.2s"
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    Saving Location...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={18} />
                    Location Updated!
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Save & Update My Location
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
