import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, User, Bot, Package, Sparkles, X, ChevronRight, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./BottomNav.css";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showServicesSheet, setShowServicesSheet] = useState(false);

  // Determine role-based links
  const getLinks = () => {
    const baseLinks = [
      { path: "/", icon: <Home size={22} />, label: "Home" },
      { path: "/marketplace", icon: <ShoppingBag size={22} />, label: "Market" },
      { isAction: true, action: "services", icon: <Sparkles size={22} />, label: "Services" }
    ];

    if (user?.role === "farmer") {
      baseLinks.push({ path: "/farmer", icon: <Package size={22} />, label: "Farm Hub" });
    } else if (user?.role === "agent") {
      baseLinks.push({ path: "/agent", icon: <Package size={22} />, label: "Fleet" });
    } else if (user?.role === "admin") {
      baseLinks.push({ path: "/admin", icon: <Package size={22} />, label: "Admin" });
    } else if (user) {
      baseLinks.push({ path: "/my-orders", icon: <Package size={22} />, label: "Orders" });
    } else {
      baseLinks.push({ path: "/login", icon: <LogIn size={22} />, label: "Login" });
    }

    baseLinks.push({ 
      isAction: true, 
      action: "settings", 
      icon: <User size={22} />, 
      label: user ? "Account" : "Account" 
    });

    return baseLinks;
  };

  const links = getLinks();

  const handleAction = (action) => {
    if (action === "settings") {
      window.dispatchEvent(new CustomEvent("open_user_settings"));
    } else if (action === "services") {
      setShowServicesSheet(prev => !prev);
    }
  };

  const mobileServices = [
    ...(!user ? [
      { title: "Register / Create Account", path: "/register", icon: "🌾", badge: "JOIN FREE", badgeBg: "#dcfce7", badgeColor: "#166534", desc: "Sign up as Consumer, Farmer or Delivery Agent" }
    ] : []),
    { title: "Marketplace", path: "/marketplace", icon: "🛒", badge: "LIVE", badgeBg: "#dcfce7", badgeColor: "#166534", desc: "Fresh organic veggies, fruits & grains" },
    { title: "Curated Boxes", path: "/curated-boxes", icon: "📦", badge: "WEEKLY", badgeBg: "#fef3c7", badgeColor: "#b45309", desc: "Farm fresh family subscription baskets" },
    { title: "Group Buying", path: "/customer-groups", icon: "👥", badge: "SAVE 25%", badgeBg: "#ffedd5", badgeColor: "#c2410c", desc: "Apartment bulk orders from local farms" },
    { title: "Farm Agro-Tours", path: "/farm-tours", icon: "🚜", badge: "WEEKEND", badgeBg: "#ede9fe", badgeColor: "#6d28d9", desc: "Tractor rides, fruit picking & countryside" },
    { title: "Village Stays", path: "/offline-tours", icon: "🏕️", badge: "EXPERIENCE", badgeBg: "#e0f2fe", badgeColor: "#0369a1", desc: "Overnight countryside escapes & organic feasts" },
    { title: "Order Tracker", path: "/my-orders", icon: "📍", badge: "GPS", badgeBg: "#f1f5f9", badgeColor: "#334155", desc: "Live delivery partner tracking & history" },
    { title: "Farmer Portal", path: "/farmer", icon: "🌱", badge: "SELL DIRECT", badgeBg: "#dcfce7", badgeColor: "#166534", desc: "Add crops, check mandi rates & fair MSP" },
    { title: "Delivery Fleet", path: "/agent", icon: "🚚", badge: "EARN", badgeBg: "#fef3c7", badgeColor: "#b45309", desc: "Electric bike delivery partner assignments" },
    { title: "Admin Panel", path: "/admin", icon: "🛡️", badge: "GOVERN", badgeBg: "#ede9fe", badgeColor: "#6d28d9", desc: "Platform audit, KYC & verification" },
    { title: "24/7 Helpline", path: "/support", icon: "🎧", badge: "SUPPORT", badgeBg: "#fee2e2", badgeColor: "#991b1b", desc: "Instant help, refund desk & WhatsApp" }
  ];

  return (
    <>
      {showServicesSheet && (
        <>
          <div className="mobile-sheet-overlay" onClick={() => setShowServicesSheet(false)} />
          <div className="mobile-services-sheet">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", paddingBottom: "0.6rem", borderBottom: "1px solid rgba(92,53,27,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🌾</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--green-deep)", fontWeight: 800 }}>Explore All Services</h4>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Quick 1-tap navigation</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowServicesSheet(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem" }}>
              {mobileServices.map((svc) => (
                <Link
                  key={svc.path}
                  href={svc.path}
                  onClick={() => setShowServicesSheet(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.7rem 0.85rem",
                    borderRadius: "12px",
                    background: "#fbf9f5",
                    textDecoration: "none",
                    border: "1px solid rgba(92,53,27,0.08)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "10px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                      {svc.icon}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-dark)" }}>{svc.title}</span>
                        <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "1px 6px", borderRadius: "100px", background: svc.badgeBg, color: svc.badgeColor }}>
                          {svc.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{svc.desc}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#94a3b8" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="bottom-nav">
        {links.map((link, idx) => {
          if (link.isAction) {
            const isServicesActive = link.action === "services" && showServicesSheet;
            return (
              <button 
                key={idx} 
                type="button"
                onClick={() => handleAction(link.action)}
                className={`bottom-nav-item ${isServicesActive ? "active" : ""}`}
              >
                <div className="bottom-nav-icon">{link.icon}</div>
                <span className="bottom-nav-label">{link.label}</span>
              </button>
            );
          }

          const isActive = pathname === link.path || (link.path !== "/" && pathname.startsWith(link.path));
          return (
            <Link key={link.path} href={link.path} className={`bottom-nav-item ${isActive ? "active" : ""}`}>
              <div className="bottom-nav-icon">{link.icon}</div>
              <span className="bottom-nav-label">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
