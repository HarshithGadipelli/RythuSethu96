import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { BASE_URL } from "../api/api";
import { AlertTriangle, Clock, Wrench, X, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

export default function MaintenanceAlertBanner() {
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Fetch initial active alert on mount
  useEffect(() => {
    let isMounted = true;
    const fetchActiveAlert = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/notifications/system-alert/active`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.active) {
            setAlert(data);
          }
        }
      } catch (err) {
        // Silently handle if backend is unreachable on initial load
      }
    };
    fetchActiveAlert();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleMaintenanceAlert = (data) => {
      setAlert(data);
      setDismissed(false); // Re-open on new incoming alert
    };

    const handleMaintenanceCleared = () => {
      setAlert(null);
      setDismissed(false);
    };

    socket.on("system_maintenance_alert", handleMaintenanceAlert);
    socket.on("system_maintenance_cleared", handleMaintenanceCleared);

    return () => {
      socket.off("system_maintenance_alert", handleMaintenanceAlert);
      socket.off("system_maintenance_cleared", handleMaintenanceCleared);
    };
  }, [socket]);

  if (!alert || !alert.active) return null;

  // Render minimized floating pill if dismissed
  if (dismissed) {
    return (
      <div
        onClick={() => setDismissed(false)}
        style={{
          position: "fixed",
          top: "14px",
          right: "20px",
          zIndex: 999998,
          background: "rgba(220, 38, 38, 0.92)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          padding: "6px 14px",
          borderRadius: "30px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          border: "1px solid rgba(255,255,255,0.3)",
          animation: "pulse 2s infinite"
        }}
        title="Click to view maintenance details"
      >
        <Wrench size={14} />
        <span>Maintenance Notice</span>
      </div>
    );
  }

  const severityColors = {
    emergency: {
      bg: "linear-gradient(135deg, #7f1d1d, #b91c1c)",
      border: "#ef4444",
      badgeBg: "rgba(254, 202, 202, 0.2)",
      text: "#fee2e2"
    },
    critical: {
      bg: "linear-gradient(135deg, #9a3412, #ea580c)",
      border: "#f97316",
      badgeBg: "rgba(255, 237, 213, 0.2)",
      text: "#ffedd5"
    },
    warning: {
      bg: "linear-gradient(135deg, #854d0e, #ca8a04)",
      border: "#eab308",
      badgeBg: "rgba(254, 240, 138, 0.2)",
      text: "#fef9c3"
    },
    info: {
      bg: "linear-gradient(135deg, #1e3a8a, #2563eb)",
      border: "#3b82f6",
      badgeBg: "rgba(219, 234, 254, 0.2)",
      text: "#dbeafe"
    }
  };

  const currentTheme = severityColors[alert.severity] || severityColors.warning;

  return (
    <div
      style={{
        background: currentTheme.bg,
        borderBottom: `2px solid ${currentTheme.border}`,
        color: "#ffffff",
        position: "relative",
        zIndex: 999999,
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        fontSize: "0.92rem",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        {/* Main Banner Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {alert.severity === "emergency" || alert.severity === "critical" ? (
                <ShieldAlert size={20} color="#ffedd5" />
              ) : (
                <Wrench size={20} color="#fef9c3" />
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    textTransform: "uppercase",
                    fontSize: "0.72rem",
                    letterSpacing: "1px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: currentTheme.badgeBg,
                    border: `1px solid rgba(255,255,255,0.3)`
                  }}
                >
                  {alert.severity || "MAINTENANCE"}
                </span>
                <strong style={{ fontSize: "0.98rem", letterSpacing: "0.2px" }}>
                  {alert.title || "Scheduled System Maintenance"}
                </strong>
              </div>
              <p style={{ margin: "2px 0 0 0", color: currentTheme.text, fontSize: "0.86rem", lineHeight: 1.4 }}>
                {alert.message}
              </p>
            </div>
          </div>

          {/* Quick Schedule info & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {(alert.scheduledAt || alert.estimatedDuration) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0,0,0,0.25)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  color: "#f8fafc"
                }}
              >
                <Clock size={14} />
                <span>
                  {alert.scheduledAt ? new Date(alert.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Immediate"}
                  {alert.estimatedDuration ? ` (~${alert.estimatedDuration})` : ""}
                </span>
              </div>
            )}

            {alert.affectedServices && alert.affectedServices.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.78rem"
                }}
              >
                {expanded ? "Less Info" : "Affected Areas"}
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              title="Dismiss banner"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                borderRadius: "50%",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease"
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Expanded Affected Services Drawer */}
        {expanded && alert.affectedServices && alert.affectedServices.length > 0 && (
          <div
            style={{
              marginTop: "4px",
              paddingTop: "8px",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              fontSize: "0.8rem"
            }}
          >
            <span style={{ fontWeight: 600, opacity: 0.9 }}>Affected Services:</span>
            {alert.affectedServices.map((srv, idx) => (
              <span
                key={idx}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}
              >
                ⚙️ {srv}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
