/**
 * playTTS — Text-to-Speech utility for Rythu Sethu
 * Handles the Chrome bug where getVoices() returns empty on first call.
 */

import { LANG_MAP } from "./useVoiceInput";

function speakWithVoice(text, langCode, resolve) {
  const synth = window.speechSynthesis;
  synth.cancel(); // stop any ongoing speech first

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = LANG_MAP[langCode] || "en-IN";
  utterance.rate  = 1.0;
  utterance.pitch = 1.0;

  const voices = synth.getVoices();
  if (voices.length > 0) {
    const matchLang    = utterance.lang.split("-")[0];
    const langVoices   = voices.filter(v => v.lang.startsWith(matchLang) || v.lang.startsWith(utterance.lang));
    const premiumVoice = langVoices.find(v =>
      v.name.includes("Google") ||
      v.name.includes("Online") ||
      v.name.includes("Premium") ||
      v.name.includes("Enhanced")
    );
    if (premiumVoice || langVoices.length > 0) {
      utterance.voice = premiumVoice || langVoices[0];
    }
  }

  synth.speak(utterance);

  const heartbeat = setInterval(() => {
    if (!synth.speaking) {
      clearInterval(heartbeat);
    } else {
      synth.pause();
      synth.resume();
    }
  }, 10000);

  utterance.onend = () => {
    clearInterval(heartbeat);
    resolve();
  };
  utterance.onerror = () => {
    clearInterval(heartbeat);
    resolve();
  };
}

export function playTTS(text, langCode = "en") {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Text-to-Speech not supported in this browser.");
      return resolve();
    }
    if (!text) return resolve();

    const synth = window.speechSynthesis;

    const voices = synth.getVoices();
    if (voices.length === 0) {
      const onVoicesChanged = () => {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        speakWithVoice(text, langCode, resolve);
      };
      synth.addEventListener("voiceschanged", onVoicesChanged);
      setTimeout(() => {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        speakWithVoice(text, langCode, resolve);
      }, 1000);
    } else {
      speakWithVoice(text, langCode, resolve);
    }
  });
}

