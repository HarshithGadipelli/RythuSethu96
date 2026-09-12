import React, { useState, useEffect } from "react";
import { Download, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this browser session
    if (sessionStorage.getItem("pwa_prompt_dismissed")) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: "85px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "480px",
          zIndex: 9998,
          backgroundColor: "#164e28",
          color: "#ffffff",
          borderRadius: "16px",
          padding: "12px 16px",
          boxShadow: "0 12px 36px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <img
            src="/logo.png"
            alt="Rythu Jana Sethu"
            style={{ width: "42px", height: "42px", borderRadius: "10px", flexShrink: 0, objectFit: "cover" }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: "700", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "6px" }}>
              Install Rythu Jana Sethu <Sparkles size={14} color="#facc15" />
            </div>
            <div style={{ fontSize: "0.78rem", color: "#bbf7d0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Add to Home Screen for fast, 1-tap access
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={handleInstall}
            style={{
              backgroundColor: "#22c55e",
              color: "#052e16",
              border: "none",
              borderRadius: "10px",
              padding: "8px 14px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 2px 8px rgba(34, 197, 94, 0.4)"
            }}
          >
            <Download size={15} /> Install
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Close"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
