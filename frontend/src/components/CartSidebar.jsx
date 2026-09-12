import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { X, Trash2, ShoppingCart, Plus, Minus, CreditCard, CheckCircle2, Smartphone, Wallet, Banknote } from "lucide-react";
import { useLang } from "../context/LangContext";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PaymentModal from "./PaymentModal";
import OrderInvoiceModal from "./OrderInvoiceModal";
import { getImgSrc } from "../pages/Marketplace/Marketplace";

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getCartTotal, getCartCount, clearCart } = useCart();
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedPayMode, setSelectedPayMode] = useState("cod"); // "cod" | "online" | "wallet"
  const [showOnlinePaymentModal, setShowOnlinePaymentModal] = useState(false);
  const [isMultiLocation, setIsMultiLocation] = useState(false);
  const [itemAddresses, setItemAddresses] = useState({});
  const [viewportHeight, setViewportHeight] = React.useState(window.innerHeight);

  React.useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper to calculate simple distance if coordinates exist
  const calcDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 5; // Default 5km if no location
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const executeOrderPlacement = async (payMethod = "cod") => {
    if (!user) {
      setIsCartOpen(false);
      navigate("/login");
      return;
    }
    
    if (!cart || cart.length === 0) return;
    
    setCheckingOut(true);
    setError("");
    setSuccessMsg("");

    try {
      const orderItems = cart.map(item => {
        const price = Number(item.crop?.price) || 0;
        const qty = Number(item.quantity) || 1;
        const subtotal = price * qty;
        
        const distKm = calcDist(user.latitude, user.longitude, item.crop?.latitude, item.crop?.longitude);
        const effectiveDist = Math.max(3, Math.min(50, distKm));
        const deliveryCharges = Math.round(20 + (effectiveDist * 5) + (qty * 2));

        const customAddr = itemAddresses[item.crop._id];
        return {
          cropId: item.crop._id,
          quantity: qty,
          isPrebooked: !!item.isPrebooked,
          deliveryType: "standard",
          deliveryCharges: deliveryCharges,
          subtotal: subtotal,
          totalAmount: subtotal + deliveryCharges,
          deliveryAddress: (isMultiLocation && customAddr) ? customAddr : (user?.address || user?.location || "Customer Delivery Address"),
          deliveryDistance: effectiveDist,
        };
      });

      const res = await API.post("/orders/checkout-multi", { 
        items: orderItems,
        customer: user._id,
        paymentMode: payMethod
      });
      
      setPlacedOrderDetails({
        count: orderItems.length,
        total: getCartTotal(),
        orders: res.data?.orders || []
      });
      clearCart();
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.error || "Checkout failed. Please try again.");
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
            position: "fixed", bottom: "24px", right: "24px", zIndex: 99990,
            background: "linear-gradient(135deg, #15803d, #166534)", color: "white",
            borderRadius: "50px", padding: "12px 20px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 10px 25px -3px rgba(21,128,61,0.5)", cursor: "pointer",
            border: "2px solid #86efac", transition: "transform 0.2s ease",
          }}
          className="hover-scale"
          title="Click to view cart & checkout"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "0.95rem" }}>
            <ShoppingCart size={20} />
            <span>{getCartCount()} {getCartCount() === 1 ? "Item" : "Items"}</span>
          </div>
          <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.4)" }}></div>
          <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#fef08a" }}>
            ₹{getCartTotal()}
          </div>
          <div style={{
            background: "white", color: "#166534", padding: "5px 12px",
            borderRadius: "20px", fontWeight: "700", fontSize: "0.8rem"
          }}>
            View Cart 🛒
          </div>
        </div>
      )}

      {isCartOpen && (
        <>
          <div 
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.5)", zIndex: 999998,
              backdropFilter: "blur(2px)"
            }}
            onClick={() => setIsCartOpen(false)}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "440px",
            height: `${viewportHeight}px`, /* Perfect DOM viewport height */
            background: "white", zIndex: 999999, boxShadow: "-5px 0 25px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column",
            transform: isCartOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s ease-in-out"
          }}>
            {/* Ultra-Compact Header & Multi-Location Toggle */}
            <div style={{ padding: "0.75rem 1rem", background: "var(--green-main)", color: "white", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.4rem", margin: 0, fontSize: "1.05rem" }}>
                  <ShoppingCart size={18} /> Cart {cart.length > 0 && `(${cart.length})`}
                </h2>
                <button onClick={() => setIsCartOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "0" }}>
                  <X size={20} />
                </button>
              </div>
              
              {cart.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600 }}>🚚 Multi-Address Delivery?</div>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer", background: "white", padding: "1px 6px", borderRadius: "10px" }}>
                    <input type="checkbox" checked={isMultiLocation} onChange={(e) => setIsMultiLocation(e.target.checked)} style={{ transform: "scale(0.9)", margin: "0 4px 0 0" }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--green-deep)", fontWeight: 800 }}>{isMultiLocation ? "ON" : "OFF"}</span>
                  </label>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.6rem", background: "#f8fafc", minHeight: 0 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", color: "#888", marginTop: "3rem" }}>
                  <ShoppingCart size={40} style={{ opacity: 0.2, margin: "0 auto 0.5rem" }} />
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: "0.2rem" }}>Your cart is empty</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {cart.map((item, idx) => {
                    const crop = item.crop || {};
                    const price = Number(crop.price) || 0;
                    const qty = Number(item.quantity) || 1;
                    const itemTotal = price * qty;
                    const imgSrc = getImgSrc(crop.image, crop.name, crop.category);

                    return (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", padding: "0.5rem", borderRadius: "8px", background: "white", border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <div style={{ width: "45px", height: "45px", borderRadius: "6px", overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                            {imgSrc ? (
                              <img src={imgSrc} alt={crop.name || "Crop"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🌾</div>
                            )}
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                              <div style={{ fontWeight: "700", color: "var(--text-dark)", fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {crop.name || "Crop"}
                              </div>
                              <button 
                                onClick={() => removeFromCart(crop._id, item.isPrebooked)}
                                style={{ background: "none", color: "#cbd5e1", border: "none", padding: "0", cursor: "pointer", display: "flex" }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ color: "var(--green-mid)", fontSize: "0.75rem", fontWeight: "600" }}>
                                ₹{price}/{crop.unit || "kg"}
                                {item.isPrebooked && <span style={{ background: "#fef08a", color: "#854d0e", fontSize: "0.55rem", padding: "1px 4px", borderRadius: "4px", marginLeft: "4px" }}>Pre</span>}
                              </div>
                              
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#f8fafc" }}>
                                  <button onClick={() => updateQuantity(crop._id, item.isPrebooked, qty - 1)} style={{ padding: "1px 6px", background: "transparent", border: "none", cursor: "pointer" }}><Minus size={10}/></button>
                                  <span style={{ fontSize: "0.75rem", fontWeight: "700", minWidth: "14px", textAlign: "center" }}>{qty}</span>
                                  <button onClick={() => updateQuantity(crop._id, item.isPrebooked, qty + 1)} style={{ padding: "1px 6px", background: "transparent", border: "none", cursor: "pointer" }}><Plus size={10}/></button>
                                </div>
                                <div style={{ fontWeight: "800", color: "var(--green-deep)", fontSize: "0.85rem", width: "40px", textAlign: "right" }}>
                                  ₹{itemTotal}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Ultra-Compact Address Input */}
                        {isMultiLocation && (
                          <div style={{ marginTop: "0.3rem" }}>
                            <input 
                              type="text" 
                              placeholder={`Address for ${crop.name}...`}
                              value={itemAddresses[crop._id] || ""}
                              onChange={(e) => setItemAddresses(prev => ({ ...prev, [crop._id]: e.target.value }))}
                              style={{ width: "100%", padding: "0.25rem 0.4rem", fontSize: "0.7rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ultra-Compact Footer */}
            {cart.length > 0 && (
              <div style={{ padding: "0.75rem 1rem", background: "white", borderTop: "1px solid #e2e8f0", boxShadow: "0 -4px 15px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--green-deep)" }}>
                      ₹{getCartTotal()}
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>+ delivery</span>
                  </div>
                  
                  {/* Micro Payment Toggle */}
                  <div style={{ display: "flex", background: "#f1f5f9", padding: "2px", borderRadius: "6px" }}>
                    <button
                      onClick={() => setSelectedPayMode("cod")}
                      style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, border: "none", cursor: "pointer", background: selectedPayMode === "cod" ? "var(--green-main)" : "transparent", color: selectedPayMode === "cod" ? "white" : "var(--text-mid)" }}
                    >COD</button>
                    <button
                      onClick={() => setSelectedPayMode("online")}
                      style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, border: "none", cursor: "pointer", background: selectedPayMode === "online" ? "#2563eb" : "transparent", color: selectedPayMode === "online" ? "white" : "var(--text-mid)" }}
                    >UPI</button>
                  </div>
                </div>

                {error && <div style={{ color: "#ef4444", fontSize: "0.75rem", marginBottom: "0.4rem", textAlign: "center" }}>⚠️ {error}</div>}
                
                <button 
                  onClick={handleCheckoutClick}
                  disabled={checkingOut || !!successMsg}
                  className="btn-primary"
                  style={{ 
                    width: "100%", padding: "0.6rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.4rem", 
                    fontSize: "0.9rem", borderRadius: "8px", fontWeight: "700",
                    background: selectedPayMode === "online" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "var(--green-main)"
                  }}
                >
                  {checkingOut ? "..." : (
                    <>
                      {selectedPayMode === "online" ? <Smartphone size={14} /> : <Banknote size={14} />} 
                      {selectedPayMode === "online" ? "Pay via UPI" : "Place COD Order"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ONLINE PAYMENT MODAL (Merchant UPI & Razorpay Gateway) ── */}
      {showOnlinePaymentModal && (
        <PaymentModal
          amount={getCartTotal()}
          walletBalance={user?.walletBalance || 0}
          customerId={user?._id}
          onClose={() => setShowOnlinePaymentModal(false)}
          onSuccess={(payMethod) => {
            setShowOnlinePaymentModal(false);
            executeOrderPlacement(payMethod);
          }}
        />
      )}

      {/* ── IMMERSIVE FULL-PAGE THANK YOU CELEBRATION ── */}
      {placedOrderDetails && (
        <div style={{
          position: "fixed", inset: 0, background: "white", zIndex: 1000000,
          display: "flex", flexDirection: "column", height: `${viewportHeight}px`,
          overflowY: "auto", overflowX: "hidden"
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
            
            {/* Massive Hero Image Section */}
            <div style={{ position: "relative", width: "100%", height: "45vh", minHeight: "350px", background: "#064e3b" }}>
              <img 
                src="/assets/order_thank_you.jpg" 
                alt="Thank You for Ordering from Local Farmers"
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
                display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "4rem 2rem", color: "white"
              }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
                  <div style={{ display: "inline-block", background: "var(--green-main)", color: "white", padding: "8px 20px", borderRadius: "30px", fontSize: "0.95rem", fontWeight: 800, width: "fit-content", marginBottom: "1.2rem", letterSpacing: "1px", textTransform: "uppercase", boxShadow: "0 4px 15px rgba(22,163,74,0.4)" }}>
                    🎉 Order Confirmed Successfully
                  </div>
                  <h1 style={{ margin: "0 0 0.8rem 0", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, lineHeight: 1.1, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>Thank You for Your Order!</h1>
                  <p style={{ margin: 0, fontSize: "clamp(1.1rem, 2vw, 1.4rem)", opacity: 0.95, maxWidth: "700px", lineHeight: 1.5 }}>
                    Your purchase directly empowers rural Indian farmers and guarantees 100% fresh, authentic harvest for your family.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: "4rem 2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", background: "#f8fafc" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", width: "100%", maxWidth: "900px", background: "white", padding: "2.5rem", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "3rem", boxShadow: "0 20px 40px rgba(0,0,0,0.04)" }}>
                
                <div style={{ flex: "1 1 200px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "70px", height: "70px", background: "#dcfce7", borderRadius: "50%", margin: "0 auto 1.2rem", color: "var(--green-deep)", boxShadow: "0 4px 10px rgba(220,252,231,0.5)" }}>
                    <CheckCircle2 size={36} />
                  </div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.95rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Harvest Source</span>
                  <strong style={{ color: "var(--text-dark)", fontSize: "1.3rem", display: "block", marginTop: "0.4rem" }}>Direct Farm</strong>
                </div>
                
                <div style={{ width: "1px", background: "#e2e8f0", display: "flex" }}></div>
                
                <div style={{ flex: "1 1 200px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "70px", height: "70px", background: "#eff6ff", borderRadius: "50%", margin: "0 auto 1.2rem", color: "#2563eb", boxShadow: "0 4px 10px rgba(239,246,255,0.5)" }}>
                    <ShoppingCart size={36} />
                  </div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.95rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Items Ordered</span>
                  <strong style={{ color: "var(--text-dark)", fontSize: "1.3rem", display: "block", marginTop: "0.4rem" }}>{placedOrderDetails.count} Items</strong>
                </div>

                <div style={{ width: "1px", background: "#e2e8f0", display: "flex" }}></div>
                
                <div style={{ flex: "1 1 200px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "70px", height: "70px", background: "#fef3c7", borderRadius: "50%", margin: "0 auto 1.2rem", color: "#d97706", boxShadow: "0 4px 10px rgba(254,243,199,0.5)" }}>
                    <Wallet size={36} />
                  </div>
                  <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.95rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Total Paid</span>
                  <strong style={{ color: "var(--green-deep)", fontSize: "1.4rem", fontWeight: 900, display: "block", marginTop: "0.4rem" }}>₹{placedOrderDetails.total}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", width: "100%", maxWidth: "650px" }}>
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
                  style={{ flex: "1 1 100%", padding: "1rem", fontSize: "1.05rem", borderRadius: "14px", background: "#f0fdf4", color: "#166534", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", cursor: "pointer", fontWeight: 800, boxShadow: "0 4px 12px rgba(22,163,74,0.15)" }}
                >
                  📄 View & Print Official Tax Invoice / Bill
                </button>

                <button 
                  onClick={() => {
                    setPlacedOrderDetails(null);
                    setIsCartOpen(false);
                    navigate("/marketplace?tab=orders");
                  }}
                  className="btn-primary hover-scale"
                  style={{ flex: "1 1 250px", padding: "1.1rem", fontSize: "1rem", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", boxShadow: "0 10px 25px rgba(22,163,74,0.3)" }}
                >
                  🚚 Track My Orders
                </button>
                
                <button 
                  onClick={() => {
                    setPlacedOrderDetails(null);
                    setIsCartOpen(false);
                  }}
                  className="hover-scale"
                  style={{ flex: "1 1 250px", padding: "1.1rem", fontSize: "1rem", borderRadius: "14px", background: "white", color: "var(--text-dark)", border: "2px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", cursor: "pointer", fontWeight: 700 }}
                >
                  🛍️ Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAX INVOICE & BILL MODAL ── */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </>
  );
}
