import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";
import "./styles/layout.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(reg => {
        console.log("✅ PWA Service Worker registered (scope:", reg.scope + ")");
        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60000);
      }).catch(err => {
        console.error("Service worker registration failed:", err);
      });
    });
  } else {
    // In local development, unregister any active service worker so it never serves stale or broken code
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
      }
    });
  }
}