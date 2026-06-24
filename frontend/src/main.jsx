import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./styles/layout.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(reg => {
      console.log("✅ PWA Service Worker registered (scope:", reg.scope + ")");
      // Check for updates every 60 seconds
      setInterval(() => reg.update(), 60000);
    }).catch(err => {
      console.error("Service worker registration failed:", err);
    });
  });
}