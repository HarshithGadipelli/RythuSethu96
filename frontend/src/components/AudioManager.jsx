import React, { useEffect } from 'react';
import {
  toggleNatureSound,
  toggleKrishnaFlute,
  setSoundVolume,
  stopAllNatureAudio
} from '../utils/ambientSoundEngine';

/**
 * AudioManager — Unified Sound Coordinator for Rythu Jana Sethu
 * 
 * Synchronizes with ambientSoundEngine (procedural birds, crickets, rainfall)
 * and ensures the user can stop or start nature audio with zero audio leaks.
 */
export default function AudioManager() {
  useEffect(() => {
    // Global volume helper for accessibility
    window.setGlobalVolume = (volumeLevel) => {
      setSoundVolume(volumeLevel);
    };

    const handleNatureToggleEvent = () => {
      toggleNatureSound();
    };

    const handleFluteToggleEvent = () => {
      toggleKrishnaFlute(true);
    };

    const handleStopAll = () => {
      stopAllNatureAudio();
    };

    window.addEventListener("toggle_nature_audio", handleNatureToggleEvent);
    window.addEventListener("toggle_flute_audio", handleFluteToggleEvent);
    window.addEventListener("stop_all_nature_audio", handleStopAll);

    // Auto-resume on first interaction if user previously had it enabled
    const autoResume = () => {
      const savedActive = localStorage.getItem("rs_nature_bgm_active");
      if (savedActive === "true") {
        toggleNatureSound(true);
      }
      window.removeEventListener("click", autoResume);
      window.removeEventListener("keydown", autoResume);
    };

    window.addEventListener("click", autoResume);
    window.addEventListener("keydown", autoResume);

    return () => {
      window.removeEventListener("toggle_nature_audio", handleNatureToggleEvent);
      window.removeEventListener("toggle_flute_audio", handleFluteToggleEvent);
      window.removeEventListener("stop_all_nature_audio", handleStopAll);
      window.removeEventListener("click", autoResume);
      window.removeEventListener("keydown", autoResume);
      delete window.setGlobalVolume;
    };
  }, []);

  return null; // All audio is synthesized procedurally via Web Audio API without ghost tags
}
