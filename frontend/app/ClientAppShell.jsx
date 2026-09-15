"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { LangProvider, useLang } from "../src/context/LangContext";
import { CartProvider } from "../src/context/CartContext";
import { LayoutProvider } from "../src/context/LayoutContext";
import { SocketProvider } from "../src/context/SocketContext";
import Navbar from "../src/components/Navbar";
import BottomNav from "../src/components/BottomNav";
import { MessageSquareText, BellRing, X } from "lucide-react";
import { io } from "socket.io-client";
import { BASE_URL } from "../src/api/api";
import AudioManager from "../src/components/AudioManager";
import AIAssistant from "../src/components/AIAssistant";
import PWAInstallPrompt from "../src/components/PWAInstallPrompt";
import GlobalSystemTermsModal from "../src/components/GlobalSystemTermsModal";
import VirtualKeyboard from "../src/components/VirtualKeyboard";
import MaintenanceAlertBanner from "../src/components/MaintenanceAlertBanner";
import Link from "next/link";

// Ensure Google Translate re-translates when Next.js Router changes pages
function RouteChangeListener() {
  const pathname = usePathname();
  const { lang } = useLang();
  
  useEffect(() => {
    if (lang !== "en" && typeof window !== "undefined" && typeof window._triggerGoogleTranslate === "function") {
      const GT_LANG_MAP = {
        en: "en", hi: "hi", te: "te", ta: "ta", kn: "kn",
        ml: "ml", mr: "mr", gu: "gu", bn: "bn", pa: "pa",
        or: "or", as: "as", ur: "ur"
      };
      const gtLang = GT_LANG_MAP[lang] || "en";
      setTimeout(() => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo && combo.value === gtLang) {
          // Force reset then apply to overcome React DOM overwrites
          combo.value = "en";
          combo.dispatchEvent(new Event("change"));
          setTimeout(() => {
            combo.value = gtLang;
            combo.dispatchEvent(new Event("change"));
          }, 150);
        } else if (combo) {
          combo.value = gtLang;
          combo.dispatchEvent(new Event("change"));
        }
      }, 500);
    }
  }, [pathname, lang]);
  return null;
}

function AppShell({ children }) {
  const [broadcast, setBroadcast] = useState(null);
  
  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("admin_broadcast_received", (data) => {
      setBroadcast(data);
    });
    return () => socket.disconnect();
  }, []);

  return (
    <>
      <MaintenanceAlertBanner />
      <AudioManager />
      <RouteChangeListener />
      {broadcast && (
        <div style={{
          background: "linear-gradient(135deg, #e11d48, #be123c)",
          color: "white", padding: "0.75rem 1rem", textAlign: "center",
          fontWeight: 600, fontSize: "0.95rem", position: "relative",
          display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem",
          zIndex: 999999, boxShadow: "0 4px 12px rgba(225, 29, 72, 0.4)"
        }}>
          <BellRing size={18} className="spin-anim" /> 
          <span style={{ flex: 1 }}>
            <strong style={{ color: "#ffe4e6", textTransform: "uppercase", letterSpacing: "1px", marginRight: "0.5rem" }}>Admin Broadcast:</strong> 
            {broadcast.message}
          </span>
          <button onClick={() => setBroadcast(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", cursor: "pointer", borderRadius: "50%", padding: "4px", display: "flex" }}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="nature-bg-overlay">
        <div className="sunbeam" style={{ left: "10%", animationDuration: "12s" }}></div>
        <div className="sunbeam" style={{ left: "40%", animationDuration: "15s", animationDelay: "2s" }}></div>
        <div className="sunbeam" style={{ left: "70%", animationDuration: "10s", animationDelay: "1s" }}></div>
        
        <div className="cloud" style={{ top: "10%", width: "200px", height: "100px", animationDuration: "40s" }}></div>
        <div className="cloud" style={{ top: "30%", width: "300px", height: "150px", animationDuration: "60s", animationDelay: "15s" }}></div>
        <div className="cloud" style={{ top: "15%", width: "150px", height: "80px", animationDuration: "50s", animationDelay: "5s" }}></div>

        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="leaf-petal"></div>
        <div className="leaf-petal"></div>
        <div className="leaf-petal"></div>
        <div className="leaf-petal"></div>
      </div>
      <Navbar />
      <AIAssistant />
      
      {children}

      {/* Google Translate hidden widget container */}
      <div
        id="google_translate_element"
        style={{ position: "fixed", bottom: "-9999px", left: "-9999px", zIndex: -1, opacity: 0, pointerEvents: "none" }}
      />

      {/* Floating Contact Us Button */}
      <Link href="/support" className="floating-contact-btn" title="Contact Support">
        <MessageSquareText size={24} />
      </Link>

      <PWAInstallPrompt />
      <GlobalSystemTermsModal />
      <VirtualKeyboard />
      <BottomNav />
    </>
  );
}

export default function Providers({ children }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SocketProvider>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            <LayoutProvider>
              {mounted ? (
                <AppShell>
                  {children}
                </AppShell>
              ) : (
                <div id="root" style={{ minHeight: "100vh" }}>
                  {children}
                </div>
              )}
            </LayoutProvider>
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </SocketProvider>
  );
}
