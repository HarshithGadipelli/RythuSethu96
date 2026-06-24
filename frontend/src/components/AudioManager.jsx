import React, { useEffect, useState, useRef } from 'react';

// Realistic nature & flute audio URLs (local)
const AUDIO_URLS = {
  flute: "/flute.mp3",
  birds: "/birds.mp3",
  evening: "/evening.mp3",
  crickets: "/crickets.mp3"
};

export default function AudioManager() {
  const [isFlutePlaying, setIsFlutePlaying] = useState(false);
  const [isNaturePlaying, setIsNaturePlaying] = useState(false);
  const fluteRef = useRef(null);
  const natureRef = useRef(null);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    const flute = fluteRef.current;
    const nature = natureRef.current;
    if (!flute || !nature) return;

    flute.volume = 1.0;
    nature.volume = 1.0;

    window.setGlobalVolume = (volumeLevel) => {
      if (flute) flute.volume = volumeLevel;
      if (nature) nature.volume = volumeLevel;
    };

    const getNatureUrl = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 17) return AUDIO_URLS.birds;
      if (hour >= 17 && hour < 19) return AUDIO_URLS.evening;
      return AUDIO_URLS.crickets;
    };

    const handleFluteToggle = () => {
      hasAutoStarted.current = true; // prevent autoStart from interfering
      if (flute.paused) {
        if (!flute.src || !flute.src.includes(AUDIO_URLS.flute)) {
          flute.src = AUDIO_URLS.flute;
        }
        flute.loop = true;
        flute.play().then(() => {
          setIsFlutePlaying(true);
          localStorage.setItem("rs_flute_bgm", "true");
        }).catch(err => console.warn("Flute play error:", err));
      } else {
        flute.pause();
        setIsFlutePlaying(false);
        localStorage.setItem("rs_flute_bgm", "false");
      }
    };

    const handleNatureToggle = () => {
      hasAutoStarted.current = true; // prevent autoStart from interfering
      if (nature.paused) {
        const correctUrl = getNatureUrl();
        if (!nature.src || !nature.src.includes(correctUrl)) {
          nature.src = correctUrl;
        }
        nature.loop = true;
        nature.play().then(() => {
          setIsNaturePlaying(true);
          localStorage.setItem("rs_nature_bgm", "true");
        }).catch(err => console.warn("Nature play error:", err));
      } else {
        nature.pause();
        setIsNaturePlaying(false);
        localStorage.setItem("rs_nature_bgm", "false");
      }
    };

    window.addEventListener("toggle_flute_audio", handleFluteToggle);
    window.addEventListener("toggle_nature_audio", handleNatureToggle);

    // Auto-start on first user interaction (respecting saved preference)
    const autoStart = () => {
      if (hasAutoStarted.current) return;
      hasAutoStarted.current = true;

      const fluteOff = localStorage.getItem("rs_flute_bgm") === "false";
      const natureOff = localStorage.getItem("rs_nature_bgm") === "false";

      if (!fluteOff) {
        if (!flute.src || !flute.src.includes(AUDIO_URLS.flute)) flute.src = AUDIO_URLS.flute;
        flute.loop = true;
        flute.play().then(() => setIsFlutePlaying(true)).catch(() => {});
      }

      if (!natureOff) {
        const url = getNatureUrl();
        if (!nature.src || !nature.src.includes(url)) nature.src = url;
        nature.loop = true;
        nature.play().then(() => setIsNaturePlaying(true)).catch(() => {});
      }

      window.removeEventListener("click", autoStart);
      window.removeEventListener("keydown", autoStart);
    };

    window.addEventListener("click", autoStart);
    window.addEventListener("keydown", autoStart);

    // Time-based background nature sound logic
    const checkTimeInterval = setInterval(() => {
      if (!nature.paused) {
        const correctUrl = getNatureUrl();
        // If the URL has changed because the time of day changed, switch the track
        if (!nature.src.includes(correctUrl)) {
          nature.src = correctUrl;
          nature.play().catch(() => {});
        }
      }
    }, 60000); // check every minute

    return () => {
      window.removeEventListener("toggle_flute_audio", handleFluteToggle);
      window.removeEventListener("toggle_nature_audio", handleNatureToggle);
      window.removeEventListener("click", autoStart);
      window.removeEventListener("keydown", autoStart);
      clearInterval(checkTimeInterval);
      delete window.setGlobalVolume;
    };
  }, []);

  return (
    <>
      <audio id="ambient-flute-audio" ref={fluteRef} loop style={{ display: 'none' }} />
      <audio id="ambient-nature-audio" ref={natureRef} loop style={{ display: 'none' }} />
    </>
  );
}
