import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { 
  X, Trash2, ShoppingCart, Plus, Minus, CreditCard, CheckCircle2, 
  Smartphone, Wallet, Banknote, MapPin, Navigation, Phone, User, 
  Calendar, ShieldCheck, ArrowRight, Sparkles, Tag, ChevronDown, 
  Check, Clock, AlertCircle, RefreshCw, Layers, Send, ExternalLink,
  FileText, Home, Truck
} from "lucide-react";
import { useLang } from "../context/LangContext";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import PaymentModal from "./PaymentModal";
import OrderInvoiceModal from "./OrderInvoiceModal";
import OrderTracking from "./OrderTracking";
import { getImgSrc } from "../views/Marketplace/Marketplace";

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart, addToCart } = useCart();
  const { t } = useLang();
  const { user } = useAuth();
  const router = useRouter();

  // Checkout & UI State
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);
  const [selectedPayMode, setSelectedPayMode] = useState("cod"); // "cod" | "online" | "wallet"
  const [showOnlinePaymentModal, setShowOnlinePaymentModal] = useState(false);
  
  // Delivery Configuration
  const [isMultiLocation, setIsMultiLocation] = useState(false);
  const [deliveryType, setDeliveryType] = useState("standard"); // "standard" | "farm_pickup"
  const [deliveryName, setDeliveryName] = useState(user?.name || "");
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || "");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || user?.location || "");
  const [customerLat, setCustomerLat] = useState(user?.latitude || null);
  const [customerLng, setCustomerLng] = useState(user?.longitude || null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Multi-Drop Destination Details: { [cropId]: { name: "", phone: "", address: "", lat: null, lng: null } }
  const [itemDropDetails, setItemDropDetails] = useState({});

  // Circular Economy & Rewards
  const [hasWetWasteDonation, setHasWetWasteDonation] = useState(false);
  const [wetWasteEstKg, setWetWasteEstKg] = useState(2);
  const [useRewardPoints, setUseRewardPoints] = useState(false);

  // SSR Safe Viewport Height
  const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 800);
  
  // AI Suggestions
  const [aprioriSuggestions, setAprioriSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Sync user profile when available
  useEffect(() => {
    if (user) {
      if (!deliveryName && user.name) setDeliveryName(user.name);
      if (!deliveryPhone && user.phone) setDeliveryPhone(user.phone);
      if (!deliveryAddress && (user.address || user.location)) setDeliveryAddress(user.address || user.location);
      if (!customerLat && user.latitude) setCustomerLat(user.latitude);
      if (!customerLng && user.longitude) setCustomerLng(user.longitude);
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setViewportHeight(window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch ML Market Basket Suggestions
  useEffect(() => {
    if (isCartOpen && cart.length > 0) {
      const primaryItem = cart[0]?.crop?.name;
      if (!primaryItem) return;

      const fetchSuggestions = async () => {
        setIsFetchingSuggestions(true);
        try {
          const mlRes = await API.post("/ml/market-basket", { crop: primaryItem, customerId: user?._id });
          const categoryNames = (mlRes.data?.suggestions || []).map(s => s.crop);
          
          if (categoryNames.length === 0) return;

          const marketRes = await API.get("/crops");
          const allCrops = marketRes.data || [];
          
          const matchedCrops = [];
          for (const category of categoryNames) {
            const found = allCrops.find(c => c.name.toLowerCase().includes(category.toLowerCase()) && c.quantity > 0);
            if (found && !cart.some(cartItem => cartItem.crop._id === found._id)) {
              matchedCrops.push({ ...found, matchReason: category });
            }
          }
          setAprioriSuggestions(matchedCrops);
        } catch (err) {
          console.error("Failed to fetch market basket suggestions", err);
        } finally {
          setIsFetchingSuggestions(false);
        }
      };
      fetchSuggestions();
    } else {
      setAprioriSuggestions([]);
    }
  }, [cart, isCartOpen, user]);

  // Calculate Geodesic Distance
  const calcDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 5;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // GPS Auto-detect handler
  const handleDetectLocation = (targetCropId = null) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingLocation(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detected = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.display_name) {
            detected = data.display_name;
          }
        } catch (e) {
          // Fallback to coordinates
        }

        if (targetCropId) {
          setItemDropDetails(prev => ({
            ...prev,
            [targetCropId]: {
              ...(prev[targetCropId] || {}),
              address: detected,
              lat: latitude,
              lng: longitude
            }
          }));
        } else {
          setDeliveryAddress(detected);
          setCustomerLat(latitude);
          setCustomerLng(longitude);
        }
        setIsDetectingLocation(false);
      },
      (err) => {
        setIsDetectingLocation(false);
        setError("Could not detect location. Please type your delivery address manually.");
      },
      { timeout: 8000 }
    );
  };

  // Financial Calculations
  const produceSubtotal = getCartTotal();

  // Delivery Charges Computation
  const computeDeliveryCharges = () => {
    if (deliveryType === "farm_pickup") return 0;

    if (isMultiLocation) {
      let totalFee = 0;
      cart.forEach(item => {
        const drop = itemDropDetails[item.crop._id] || {};
        const dropLat = drop.lat || customerLat;
        const dropLng = drop.lng || customerLng;
        const distKm = calcDist(dropLat, dropLng, item.crop?.latitude, item.crop?.longitude);
        const effectiveDist = Math.max(3, Math.min(50, distKm));
        const itemFee = Math.round(25 + (effectiveDist * 3.5) + (Number(item.quantity) * 1));
        totalFee += itemFee;
      });
      return totalFee;
    } else {
      // Single address consolidated charge
      const firstCrop = cart[0]?.crop;
      const distKm = calcDist(customerLat, customerLng, firstCrop?.latitude, firstCrop?.longitude);
      const effectiveDist = Math.max(3, Math.min(50, distKm));
      const totalQty = cart.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
      return Math.round(25 + (effectiveDist * 3) + (totalQty * 1.5));
    }
  };

  const deliveryCharges = computeDeliveryCharges();

  // Rewards discount calculation (1 point = ₹1, up to 50% of produce subtotal)
  const maxRedeemablePoints = user?.rewardPoints ? Math.min(user.rewardPoints, Math.floor(produceSubtotal * 0.5)) : 0;
  const pointsDiscount = (useRewardPoints && maxRedeemablePoints > 0) ? maxRedeemablePoints : 0;
  const grandTotal = Math.max(0, produceSubtotal + deliveryCharges - pointsDiscount);

  // Check if cart contains pre-booking items
  const hasPrebookingItems = cart.some(item => !!item.isPrebooked);

  // Execute Order Placement
  const executeOrderPlacement = async (payMethod = "cod") => {
    if (!user) {
      setIsCartOpen(false);
      router.push("/login");
      return;
    }
    
    if (!cart || cart.length === 0) return;

    // Delivery Address Validation
    if (deliveryType === "standard") {
      if (!isMultiLocation && (!deliveryAddress || deliveryAddress.trim().length < 5)) {
        setError("Please provide a complete delivery street address.");
        return;
      }

      if (isMultiLocation) {
        for (let i = 0; i < cart.length; i++) {
          const item = cart[i];
          const drop = itemDropDetails[item.crop._id];
          const itemAddr = drop?.address || deliveryAddress;
          if (!itemAddr || itemAddr.trim().length < 5) {
            setError(`Please provide a delivery address for "${item.crop.name}".`);
            return;
          }
        }
      }
    }
    
    setCheckingOut(true);
    setError("");
    setSuccessMsg("");

    try {
      const orderItems = cart.map(item => {
        const price = Number(item.crop?.price) || 0;
        const qty = Number(item.quantity) || 1;
        const subtotal = price * qty;
        
        let destName = deliveryName || user?.name || "Customer";
        let destPhone = deliveryPhone || user?.phone || "";
        let destAddr = deliveryAddress || user?.address || "Customer Doorstep Delivery";
        let destLat = customerLat || user?.latitude || 17.385;
        let destLng = customerLng || user?.longitude || 78.486;

        if (isMultiLocation && itemDropDetails[item.crop._id]) {
          const drop = itemDropDetails[item.crop._id];
          if (drop.name) destName = drop.name;
          if (drop.phone) destPhone = drop.phone;
          if (drop.address) destAddr = drop.address;
          if (drop.lat) destLat = drop.lat;
          if (drop.lng) destLng = drop.lng;
        }

        const distKm = calcDist(destLat, destLng, item.crop?.latitude, item.crop?.longitude);
        const effectiveDist = Math.max(3, Math.min(50, distKm));
        const itemDeliveryFee = deliveryType === "farm_pickup" ? 0 : Math.round(25 + (effectiveDist * 3.5) + (qty * 1));

        const formattedAddressLine = deliveryType === "farm_pickup" 
          ? `🏡 Farm Gate Pickup: ${item.crop?.location || "Farmer's Direct Orchard"}`
          : `${destName ? destName + ' ' : ''}${destPhone ? '(Ph: ' + destPhone + ') ' : ''}• ${destAddr}`;

        return {
          cropId: item.crop._id,
          quantity: qty,
          isPrebooked: !!item.isPrebooked,
          deliveryType: deliveryType,
          deliveryCharges: itemDeliveryFee,
          subtotal: subtotal,
          totalAmount: subtotal + itemDeliveryFee,
          deliveryAddress: formattedAddressLine,
          deliveryDistance: effectiveDist,
          deliveryLatitude: destLat,
          deliveryLongitude: destLng
        };
      });

      const res = await API.post("/orders/checkout-multi", { 
        items: orderItems,
        customer: user._id,
        paymentMode: payMethod,
        pointsUsed: pointsDiscount,
        hasWetWasteDonation,
        wetWasteEstKg: hasWetWasteDonation ? Number(wetWasteEstKg) : 0,
        wetWasteNotes: hasWetWasteDonation ? `Customer prepared ~${wetWasteEstKg}kg raw organic peels for return to Cold Storage Hub.` : ""
      });
      
      setPlacedOrderDetails({
        count: orderItems.length,
        total: grandTotal,
        orders: res.data?.orders || [],
        paymentMode: payMethod,
        hasWetWasteDonation,
        wetWasteEstKg: Number(wetWasteEstKg)
      });

      clearCart();
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.error || "Checkout failed. Please check details and try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCheckoutClick = () => {
    if (selectedPayMode === "online") {
      setShowOnlinePaymentModal(true);
    } else {
      executeOrderPlacement(selectedPayMode);
    }
  };

  return (
    <>
      {/* ── STICKY FLOATING CART BAR (Always visible when items in cart) ── */}
      {cart.length > 0 && !isCartOpen && !placedOrderDetails && (
        <div 
          onClick={() => setIsCartOpen(true)}
          style={{
            position: "fixed", bottom: "30px", right: "30px", zIndex: 9990,
            background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white",
            borderRadius: "50px", padding: "14px 24px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 12px 30px rgba(21,128,61,0.4)", cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.2)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: "blur(8px)"
          }}
          className="hover-scale"
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
          title="Click to view cart & checkout"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "0.95rem" }}>
            <ShoppingCart size={20} />
            <span>{getCartCount()} {getCartCount() === 1 ? "Item" : "Items"}</span>
          </div>
          <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.4)" }}></div>
          <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#fef08a" }}>
            ₹{grandTotal || produceSubtotal}
          </div>
          <div style={{
            background: "white", color: "#166534", padding: "5px 12px",
            borderRadius: "20px", fontWeight: "700", fontSize: "0.8rem"
          }}>
            View Cart 🛒
          </div>
        </div>
      )}

      {/* ── CART SIDEBAR DRAWER ── */}
      {isCartOpen && (
        <>
          <div 
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(15, 23, 42, 0.5)", zIndex: 99998,
              backdropFilter: "blur(5px)",
              animation: "fadeIn 0.2s ease-out"
            }}
            onClick={() => setIsCartOpen(false)}
          />

          <div style={{
            position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "480px",
            height: `${viewportHeight}px`,
            background: "#ffffff", zIndex: 99999, 
            boxShadow: "-12px 0 40px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column",
            transform: isCartOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
            fontFamily: "'Inter', sans-serif"
          }}>
            {/* Header */}
            <div style={{
              padding: "1.1rem 1.25rem",
              background: "linear-gradient(135deg, #064e3b, #047857)",
              color: "white",
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              borderBottomLeftRadius: "16px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShoppingCart size={20} color="#86efac" />
                  <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
                    Your Fresh Harvest Cart {cart.length > 0 && `(${cart.length})`}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", cursor: "pointer", padding: "6px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Delivery Type & Multi-Location Toggle */}
              {cart.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {/* Standard vs Pickup */}
                  <div style={{ display: "flex", background: "rgba(255,255,255,0.15)", padding: "3px", borderRadius: "10px", flex: "1 1 200px" }}>
                    <button
                      onClick={() => setDeliveryType("standard")}
                      style={{
                        flex: 1, padding: "5px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                        fontSize: "0.75rem", fontWeight: 700, transition: "all 0.2s",
                        background: deliveryType === "standard" ? "white" : "transparent",
                        color: deliveryType === "standard" ? "#065f46" : "rgba(255,255,255,0.85)"
                      }}
                    >
                      🚚 Doorstep Delivery
                    </button>
                    <button
                      onClick={() => setDeliveryType("farm_pickup")}
                      style={{
                        flex: 1, padding: "5px 10px", borderRadius: "8px", border: "none", cursor: "pointer",
                        fontSize: "0.75rem", fontWeight: 700, transition: "all 0.2s",
                        background: deliveryType === "farm_pickup" ? "#fef08a" : "transparent",
                        color: deliveryType === "farm_pickup" ? "#854d0e" : "rgba(255,255,255,0.85)"
                      }}
                    >
                      🏡 Farm Pickup (Free)
                    </button>
                  </div>

                  {/* Multi-Drop Toggle (Only when Doorstep Delivery) */}
                  {deliveryType === "standard" && (
                    <button
                      onClick={() => setIsMultiLocation(!isMultiLocation)}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px",
                        borderRadius: "10px", border: isMultiLocation ? "1.5px solid #86efac" : "1px solid rgba(255,255,255,0.25)",
                        background: isMultiLocation ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)",
                        color: "white", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700
                      }}
                    >
                      <Layers size={14} color={isMultiLocation ? "#86efac" : "white"} />
                      <span>Multi-Drop Delivery {isMultiLocation ? "✓ ON" : "+ Add"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Notification Banner for Pre-Booking */}
            {hasPrebookingItems && (
              <div style={{ background: "#fef9c3", borderBottom: "1px solid #fde047", padding: "0.6rem 1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={16} color="#854d0e" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: "0.73rem", color: "#713f12", lineHeight: 1.35 }}>
                  <strong>🌾 Advance Pre-Booking Items Included:</strong> The farmer will harvest directly for you when field reaches full maturity.
                </div>
              </div>
            )}

            {/* Scrollable Cart Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", background: "#f8fafc" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#64748b" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "#94a3b8" }}>
                    <ShoppingCart size={40} />
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", margin: "0 0 0.4rem 0" }}>Your Cart is Empty</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", maxWidth: "260px", margin: "0 auto 1.5rem" }}>
                    Explore fresh harvest directly from local verified farmers at mandi transparent rates.
                  </p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="btn-primary"
                    style={{ padding: "0.6rem 1.4rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                  
                  {/* Cart Items List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {cart.map((item, idx) => {
                      const crop = item.crop || {};
                      const price = Number(crop.price) || 0;
                      const qty = Number(item.quantity) || 1;
                      const itemTotal = price * qty;
                      const imgSrc = getImgSrc(crop.image, crop.name, crop.category);
                      const isPrebooked = !!item.isPrebooked;
                      const drop = itemDropDetails[crop._id] || {};

                      return (
                        <div key={`${crop._id}-${isPrebooked ? 'pre' : 'ready'}-${idx}`} style={{
                          background: "white", borderRadius: "14px", padding: "0.85rem",
                          border: isPrebooked ? "1.5px solid #fde047" : "1px solid #e2e8f0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)", transition: "all 0.2s"
                        }}>
                          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "10px", overflow: "hidden", background: "#f1f5f9", flexShrink: 0, position: "relative" }}>
                              {imgSrc ? (
                                <img src={imgSrc} alt={crop.name || "Crop"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>🌾</div>
                              )}
                              {isPrebooked && (
                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#eab308", color: "#000", fontSize: "0.55rem", fontWeight: 800, textAlign: "center", padding: "1px 0" }}>
                                  PRE-BOOK
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.2rem" }}>
                                <div>
                                  <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {crop.name || "Produce"}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                    <span style={{ fontSize: "0.72rem", color: isPrebooked ? "#b45309" : "#166534", fontWeight: 700, background: isPrebooked ? "#fef3c7" : "#dcfce7", padding: "1px 5px", borderRadius: "4px" }}>
                                      {isPrebooked ? "⏳ Pre-Harvest Advance" : "⚡ Ready Harvest"}
                                    </span>
                                    {crop.unit && (
                                      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>₹{price}/{crop.unit}</span>
                                    )}
                                  </div>
                                </div>

                                <button 
                                  onClick={() => removeFromCart(crop._id, isPrebooked)}
                                  style={{ background: "none", color: "#94a3b8", border: "none", padding: "2px", cursor: "pointer" }}
                                  title="Remove item"
                                >
                                  <Trash2 size={14} className="hover-text-red" />
                                </button>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                                <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "6px", background: "#f8fafc" }}>
                                  <button 
                                    onClick={() => updateQuantity(crop._id, isPrebooked, qty - 1)} 
                                    style={{ padding: "2px 7px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                                  >
                                    <Minus size={11}/>
                                  </button>
                                  <span style={{ fontSize: "0.8rem", fontWeight: "800", minWidth: "18px", textAlign: "center", color: "#0f172a" }}>{qty}</span>
                                  <button 
                                    onClick={() => updateQuantity(crop._id, isPrebooked, qty + 1)} 
                                    style={{ padding: "2px 7px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                                  >
                                    <Plus size={11}/>
                                  </button>
                                </div>

                                <div style={{ fontWeight: 900, color: "#166534", fontSize: "0.95rem" }}>
                                  ₹{itemTotal}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Multi-Drop Destination Config Box per item */}
                          {isMultiLocation && deliveryType === "standard" && (
                            <div style={{ marginTop: "0.6rem", padding: "0.6rem", background: "#f1f5f9", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <MapPin size={12} color="#047857" /> Destination for {crop.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDetectLocation(crop._id)}
                                  disabled={isDetectingLocation}
                                  style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, color: "#047857", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                                >
                                  <Navigation size={10} /> {isDetectingLocation ? "Detecting..." : "Use GPS"}
                                </button>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", marginBottom: "0.4rem" }}>
                                <input 
                                  type="text"
                                  placeholder="Recipient Name (e.g. Mom)"
                                  value={drop.name || ""}
                                  onChange={(e) => setItemDropDetails(prev => ({
                                    ...prev,
                                    [crop._id]: { ...(prev[crop._id] || {}), name: e.target.value }
                                  }))}
                                  style={{ padding: "0.35rem 0.5rem", fontSize: "0.73rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                                <input 
                                  type="tel"
                                  placeholder="Recipient Mobile Phone"
                                  value={drop.phone || ""}
                                  onChange={(e) => setItemDropDetails(prev => ({
                                    ...prev,
                                    [crop._id]: { ...(prev[crop._id] || {}), phone: e.target.value }
                                  }))}
                                  style={{ padding: "0.35rem 0.5rem", fontSize: "0.73rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                              </div>

                              <textarea 
                                rows={2}
                                placeholder={`Street address, landmark, town & pincode for ${crop.name}...`}
                                value={drop.address || ""}
                                onChange={(e) => setItemDropDetails(prev => ({
                                  ...prev,
                                  [crop._id]: { ...(prev[crop._id] || {}), address: e.target.value }
                                }))}
                                style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.73rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none" }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Primary Delivery Address Section (When Single Address Delivery) */}
                  {deliveryType === "standard" && !isMultiLocation && (
                    <div style={{ background: "white", borderRadius: "14px", padding: "1rem", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "5px" }}>
                          <MapPin size={15} color="#16a34a" /> Primary Delivery Destination
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDetectLocation()}
                          disabled={isDetectingLocation}
                          style={{
                            background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px",
                            padding: "3px 8px", fontSize: "0.7rem", fontWeight: 700, color: "#166534",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                          }}
                        >
                          <Navigation size={12} /> {isDetectingLocation ? "Detecting GPS..." : "📍 Auto-Detect GPS"}
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <div>
                          <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "2px" }}>Recipient Full Name</label>
                          <input 
                            type="text"
                            placeholder="Your Name"
                            value={deliveryName}
                            onChange={(e) => setDeliveryName(e.target.value)}
                            style={{ width: "100%", padding: "0.4rem 0.6rem", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "2px" }}>Contact Phone (For Doorstep OTP)</label>
                          <input 
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={deliveryPhone}
                            onChange={(e) => setDeliveryPhone(e.target.value)}
                            style={{ width: "100%", padding: "0.4rem 0.6rem", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "2px" }}>Full Street Address, Landmark, Town &amp; Pincode</label>
                        <textarea 
                          rows={2}
                          placeholder="House/Flat No., Apartment/Street name, Landmark, City, Pincode"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          style={{ width: "100%", padding: "0.45rem 0.6rem", fontSize: "0.78rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Farm Pickup Notice */}
                  {deliveryType === "farm_pickup" && (
                    <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: "12px", padding: "0.8rem 1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#854d0e", fontWeight: 800, fontSize: "0.82rem" }}>
                        <Home size={15} /> Direct Farm Pickup Confirmed
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.73rem", color: "#713f12", lineHeight: 1.4 }}>
                        Zero delivery fee! Collect freshly harvested crops directly from the farmer's orchard/gate. We'll share farmer contact and direct farm coordinates upon order confirmation.
                      </p>
                    </div>
                  )}

                  {/* Circular Economy Wet Waste Handover Card */}
                  <div style={{
                    background: hasWetWasteDonation ? "#f0fdf4" : "white",
                    borderRadius: "14px", padding: "0.85rem",
                    border: hasWetWasteDonation ? "1.5px solid #22c55e" : "1px dashed #cbd5e1",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 800, color: "#166534" }}>
                        <input
                          type="checkbox"
                          checked={hasWetWasteDonation}
                          onChange={(e) => setHasWetWasteDonation(e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: "#16a34a" }}
                        />
                        <span>🌱 Hand Over Kitchen Wet Waste (+15 Eco-Pts)</span>
                      </label>
                      {hasWetWasteDonation && (
                        <select 
                          value={wetWasteEstKg} 
                          onChange={(e) => setWetWasteEstKg(e.target.value)}
                          style={{ padding: "2px 6px", fontSize: "0.75rem", borderRadius: "6px", border: "1px solid #86efac", fontWeight: 700, color: "#166534", background: "white" }}
                        >
                          <option value={1}>~1 kg</option>
                          <option value={2}>~2 kg</option>
                          <option value={3}>~3 kg</option>
                          <option value={5}>~5 kg</option>
                        </select>
                      )}
                    </div>
                    {hasWetWasteDonation ? (
                      <div style={{ marginTop: "6px", fontSize: "0.7rem", color: "#475569", lineHeight: 1.4 }}>
                        <span style={{ color: "#b45309", fontWeight: 700 }}>⚠️ Raw fruit &amp; veggie peels only:</span> Delivery agent carries a specialized sealed kit, scans the scraps at your doorstep, and returns it to the hub for community vermicomposting/biogas.
                      </div>
                    ) : (
                      <div style={{ marginTop: "4px", fontSize: "0.68rem", color: "#94a3b8" }}>
                        Hand over your organic kitchen scraps to the delivery agent to earn bonus reward points!
                      </div>
                    )}
                  </div>

                  {/* Reward Points Redemption Option */}
                  {user && user.rewardPoints > 0 && maxRedeemablePoints > 0 && (
                    <div style={{ background: "white", borderRadius: "12px", padding: "0.75rem 1rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>
                        <input 
                          type="checkbox" 
                          checked={useRewardPoints} 
                          onChange={(e) => setUseRewardPoints(e.target.checked)} 
                          style={{ width: 15, height: 15, accentColor: "#16a34a" }}
                        />
                        <span>Redeem Rythu Points ({user.rewardPoints} pts available)</span>
                      </label>
                      {useRewardPoints && (
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#16a34a" }}>-₹{pointsDiscount}</span>
                      )}
                    </div>
                  )}

                  {/* Apriori Suggestions Section */}
                  {aprioriSuggestions.length > 0 && (
                    <div style={{ marginTop: "0.8rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.6rem" }}>
                        <Sparkles size={14} color="#d97706" />
                        <h4 style={{ fontSize: "0.82rem", fontWeight: 800, margin: 0, color: "#1e293b" }}>Frequently Bought Together</h4>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {aprioriSuggestions.slice(0, 3).map((crop, idx) => {
                          const imgSrc = getImgSrc(crop.image, crop.name, crop.category);
                          return (
                            <div key={idx} style={{ 
                              display: "flex", padding: "0.6rem 0.8rem", borderRadius: "10px", 
                              background: "white", border: "1px dashed #cbd5e1",
                              alignItems: "center", gap: "0.6rem"
                            }}>
                              <div style={{ width: "38px", height: "38px", borderRadius: "6px", overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                                {imgSrc ? (
                                  <img src={imgSrc} alt={crop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>🌾</div>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.78rem", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{crop.name}</div>
                                <div style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700 }}>₹{crop.price}/{crop.unit || "kg"}</div>
                              </div>
                              <button 
                                onClick={() => addToCart(crop, 1, false, false)}
                                style={{ 
                                  background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", 
                                  padding: "4px 10px", borderRadius: "6px", fontSize: "0.72rem", 
                                  fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px"
                                }}
                              >
                                <Plus size={11} /> Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Footer Summary & Payment Selection */}
            {cart.length > 0 && (
              <div style={{
                padding: "1rem 1.25rem",
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0",
                boxShadow: "0 -8px 25px rgba(0,0,0,0.06)"
              }}>
                {/* Price Breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.8rem", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                    <span>Produce Subtotal ({getCartCount()} items)</span>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{produceSubtotal}</span>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                    <span>Delivery Charges {deliveryType === "farm_pickup" ? "(Self Pickup)" : isMultiLocation ? "(Multi-Drop)" : ""}</span>
                    <span style={{ fontWeight: 700, color: deliveryCharges === 0 ? "#16a34a" : "#1e293b" }}>
                      {deliveryCharges === 0 ? "FREE" : `₹${deliveryCharges}`}
                    </span>
                  </div>

                  {pointsDiscount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                      <span>Green Rewards Discount</span>
                      <span style={{ fontWeight: 800 }}>-₹{pointsDiscount}</span>
                    </div>
                  )}

                  <div style={{ height: "1px", background: "#e2e8f0", margin: "2px 0" }}></div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>Grand Total:</span>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Inclusive of GST &amp; APMC cess</div>
                    </div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#166534" }}>
                      ₹{grandTotal}
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginBottom: "0.8rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Select Payment Mode:</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPayMode("cod")}
                      style={{
                        padding: "6px 8px", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700,
                        border: selectedPayMode === "cod" ? "2px solid #16a34a" : "1px solid #cbd5e1",
                        background: selectedPayMode === "cod" ? "#f0fdf4" : "white",
                        color: selectedPayMode === "cod" ? "#166534" : "#475569",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
                      }}
                    >
                      <Banknote size={13} /> COD
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayMode("online")}
                      style={{
                        padding: "6px 8px", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700,
                        border: selectedPayMode === "online" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        background: selectedPayMode === "online" ? "#eff6ff" : "white",
                        color: selectedPayMode === "online" ? "#1d4ed8" : "#475569",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
                      }}
                    >
                      <Smartphone size={13} /> UPI / Cards
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayMode("wallet")}
                      disabled={!user || (user?.walletBalance || 0) < grandTotal}
                      style={{
                        padding: "6px 8px", borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700,
                        border: selectedPayMode === "wallet" ? "2px solid #d97706" : "1px solid #cbd5e1",
                        background: selectedPayMode === "wallet" ? "#fef3c7" : "white",
                        color: selectedPayMode === "wallet" ? "#b45309" : "#475569",
                        cursor: (!user || (user?.walletBalance || 0) < grandTotal) ? "not-allowed" : "pointer",
                        opacity: (!user || (user?.walletBalance || 0) < grandTotal) ? 0.6 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
                      }}
                      title={`Wallet Balance: ₹${user?.walletBalance || 0}`}
                    >
                      <Wallet size={13} /> Wallet (₹{user?.walletBalance || 0})
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "6px 10px", fontSize: "0.75rem", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Primary Checkout Button */}
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={checkingOut}
                  className="btn-primary"
                  style={{
                    width: "100%", padding: "0.8rem", borderRadius: "10px",
                    fontWeight: 800, fontSize: "0.95rem",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    background: selectedPayMode === "online" 
                      ? "linear-gradient(135deg, #2563eb, #1d4ed8)" 
                      : selectedPayMode === "wallet"
                      ? "linear-gradient(135deg, #d97706, #b45309)"
                      : "linear-gradient(135deg, #16a34a, #15803d)",
                    boxShadow: "0 4px 14px rgba(22, 163, 74, 0.25)"
                  }}
                >
                  {checkingOut ? (
                    <>
                      <span className="loader" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      {selectedPayMode === "online" ? <Smartphone size={16} /> : selectedPayMode === "wallet" ? <Wallet size={16} /> : <Banknote size={16} />}
                      <span>
                        {selectedPayMode === "online" ? `Pay via UPI / Card • ₹${grandTotal}` : selectedPayMode === "wallet" ? `Pay from Wallet • ₹${grandTotal}` : `Place COD Order • ₹${grandTotal}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ONLINE PAYMENT MODAL (Elevated zIndex: 200000) ── */}
      {showOnlinePaymentModal && (
        <PaymentModal
          amount={grandTotal}
          walletBalance={user?.walletBalance || 0}
          customerId={user?._id}
          onClose={() => setShowOnlinePaymentModal(false)}
          onSuccess={(payMethod) => {
            setShowOnlinePaymentModal(false);
            executeOrderPlacement(payMethod);
          }}
        />
      )}

      {/* ── HIGH-AESTHETIC ORDER CONFIRMATION & OTP CELEBRATION ── */}
      {placedOrderDetails && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100005,
          background: "#ffffff",
          display: "flex", flexDirection: "column",
          height: `${viewportHeight}px`,
          overflowY: "auto", overflowX: "hidden",
          fontFamily: "'Inter', sans-serif"
        }}>
          {/* Celebratory Banner */}
          <div style={{
            background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
            padding: "3.5rem 2rem 2.5rem",
            color: "white",
            textAlign: "center",
            position: "relative",
            boxShadow: "0 10px 30px rgba(6, 78, 59, 0.3)"
          }}>
            <button 
              onClick={() => {
                setPlacedOrderDetails(null);
                setIsCartOpen(false);
              }}
              style={{
                position: "absolute", top: "1.5rem", right: "1.5rem",
                background: "rgba(255,255,255,0.15)", border: "none", color: "white",
                borderRadius: "50%", width: 36, height: 36, display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}
            >
              <X size={20} />
            </button>

            <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem", boxShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
              <CheckCircle2 size={42} color="#86efac" />
            </div>

            <span style={{
              background: "rgba(255,255,255,0.2)", padding: "4px 16px", borderRadius: "100px",
              fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px",
              display: "inline-block", marginBottom: "0.8rem"
            }}>
              🎉 Order Successfully Placed &amp; Dispatched
            </span>

            <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 900 }}>
              Thank You for Supporting Indian Farmers!
            </h1>
            <p style={{ margin: "0 auto", fontSize: "0.95rem", opacity: 0.9, maxWidth: "600px", lineHeight: 1.5 }}>
              Your order has been recorded directly on the transparent agricultural ledger. Fresh morning harvest is being prepared for immediate transit.
            </p>
          </div>

          {/* Body Content */}
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.25rem", width: "100%", flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Quick Metrics Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Items</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1e293b", marginTop: "4px" }}>{placedOrderDetails.count} Products</div>
              </div>

              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Amount</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#166534", marginTop: "4px" }}>₹{placedOrderDetails.total}</div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#0369a1", textTransform: "uppercase" }}>
                  {placedOrderDetails.paymentMode?.toUpperCase()} • {placedOrderDetails.paymentMode === "online" ? "PAID" : "PAY ON DELIVERY"}
                </span>
              </div>

              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Estimated Arrival</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#2563eb", marginTop: "4px" }}>
                  ~{placedOrderDetails.orders?.[0]?.estimatedDeliveryMinutes || 35} mins
                </div>
                <span style={{ fontSize: "0.68rem", color: "#2563eb", fontWeight: 700 }}>Live GPS Synchronized</span>
              </div>
            </div>

            {/* 🔐 PROMINENT DOORSTEP VERIFICATION CODES (OTP) */}
            <div style={{ background: "#f0fdf4", borderRadius: "18px", padding: "1.5rem", border: "2px dashed #86efac", boxShadow: "0 4px 15px rgba(22, 163, 74, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.8rem" }}>
                <ShieldCheck size={22} color="#16a34a" />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#166534" }}>
                    🔐 Doorstep Delivery Verification Codes (OTP)
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#15803d" }}>
                    Please share each 6-digit code with the delivery rider only upon inspecting and receiving your fresh harvest.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
                {(placedOrderDetails.orders || []).map((ord, idx) => (
                  <div key={ord._id || idx} style={{
                    background: "white", padding: "1rem", borderRadius: "12px",
                    border: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: "0.8rem"
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1e293b" }}>
                        {ord.productSnapshot?.name || "Farm Fresh Produce"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                        Qty: {ord.quantity} {ord.productSnapshot?.unit || "kg"} • Destination: {ord.deliveryAddress}
                      </div>
                      {ord.isPrebooked && (
                        <span style={{ display: "inline-block", marginTop: "4px", fontSize: "0.68rem", background: "#fef08a", color: "#854d0e", padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>
                          🌱 Pre-Harvest Advance Booking
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: "right", background: "#f8fafc", padding: "0.5rem 1.2rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Doorstep OTP
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#166534", letterSpacing: "3px" }}>
                        {ord.verificationCode || "------"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Circular Economy Wet Waste Handover Reminder */}
            {placedOrderDetails.hasWetWasteDonation && (
              <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: "14px", padding: "1rem", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ fontSize: "1.6rem" }}>🌱</div>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 800, color: "#065f46" }}>
                    Wet Waste Handover Active (~{placedOrderDetails.wetWasteEstKg || 2} kg)
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#047857", lineHeight: 1.45 }}>
                    Your delivery rider is carrying a sanitized collection kit. Please keep raw fruit &amp; vegetable scraps ready. Once scanned and verified by the rider, <strong>+15 Green Eco-Reward Points</strong> will be credited to your account!
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "0.5rem" }}>
              <button 
                onClick={() => {
                  const firstOrder = placedOrderDetails.orders?.[0];
                  if (firstOrder) {
                    setActiveTrackingOrder(firstOrder);
                  }
                }}
                className="btn-primary hover-scale"
                style={{
                  padding: "1.1rem", fontSize: "1.05rem", borderRadius: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  fontWeight: 800, boxShadow: "0 8px 25px rgba(22, 163, 74, 0.3)", cursor: "pointer"
                }}
              >
                <Truck size={20} /> 🗺️ Track Live Delivery on Map (GPS &amp; Agent Chat)
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <button 
                  onClick={() => {
                    const firstOrder = placedOrderDetails.orders?.[0] || {
                      totalAmount: placedOrderDetails.total,
                      quantity: placedOrderDetails.count,
                      customer: user,
                      billNumber: `RS-INV-${Date.now().toString(36).toUpperCase()}`
                    };
                    setSelectedInvoiceOrder(firstOrder);
                  }}
                  className="hover-scale"
                  style={{
                    padding: "0.9rem", fontSize: "0.9rem", borderRadius: "12px",
                    background: "#f0fdf4", color: "#166534", border: "1.5px solid #86efac",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    cursor: "pointer", fontWeight: 800
                  }}
                >
                  <FileText size={16} /> View &amp; Print Tax Invoice
                </button>

                <button 
                  onClick={() => {
                    setPlacedOrderDetails(null);
                    setIsCartOpen(false);
                    router.push("/my-orders");
                  }}
                  className="hover-scale"
                  style={{
                    padding: "0.9rem", fontSize: "0.9rem", borderRadius: "12px",
                    background: "white", color: "#1e293b", border: "1.5px solid #cbd5e1",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    cursor: "pointer", fontWeight: 700
                  }}
                >
                  <ExternalLink size={16} /> View All My Orders
                </button>
              </div>

              <button 
                onClick={() => {
                  setPlacedOrderDetails(null);
                  setIsCartOpen(false);
                }}
                style={{
                  padding: "0.8rem", fontSize: "0.9rem", background: "transparent",
                  color: "#64748b", border: "none", cursor: "pointer", fontWeight: 700
                }}
              >
                ← Return to Marketplace
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── LIVE ORDER TRACKING MODAL (Elevated zIndex: 200010) ── */}
      {activeTrackingOrder && (
        <OrderTracking
          orderId={activeTrackingOrder}
          onClose={() => setActiveTrackingOrder(null)}
        />
      )}

      {/* ── TAX INVOICE & BILL MODAL (Elevated zIndex: 1000000) ── */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </>
  );
}
