/**
 * VoiceMicButton — Reusable mic button for any input field
 * Props:
 *   fieldId       string — unique ID for this field
 *   onResult      (transcript: string) => void
 *   startListening fn from useVoiceInput
 *   listening     bool
 *   activeField   string
 *   lang          string
 *   style         optional extra styles
 *   size          "sm" | "md" | "lg"  (default "md")
 */
import React from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceMicButton({
  fieldId,
  onResult,
  startListening,
  stopListening,
  listening,
  activeField,
  lang,
  style = {},
  size = "md",
}) {
  const isActive = listening && activeField === fieldId;
  const dim = size === "sm" ? 36 : size === "lg" ? 56 : 48;
  const iconSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  return (
    <button
      type="button"
      title={isActive ? "Listening… speak now" : "Click to speak"}
      onClick={() => {
        if (isActive && stopListening) stopListening();
        else startListening(onResult, { fieldId });
      }}
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        flexShrink: 0,
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s",
        background: isActive
          ? "linear-gradient(135deg, #ef4444, #dc2626)"
          : "linear-gradient(135deg, var(--green-mid), var(--green-deep))",
        color: "white",
        boxShadow: isActive
          ? "0 0 0 4px rgba(239,68,68,0.25)"
          : "0 3px 10px rgba(19,136,8,0.3)",
        animation: isActive ? "micPulse 1s ease infinite" : "none",
        ...style,
      }}
    >
      {isActive ? <MicOff size={iconSize} /> : <Mic size={iconSize} />}
    </button>
  );
}
