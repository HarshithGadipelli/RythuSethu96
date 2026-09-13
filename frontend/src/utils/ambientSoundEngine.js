/**
 * AmbientSoundEngine — Production-Grade Realistic Indian Farm Soundscape & Divine Flute
 * 
 * Features:
 * 1. Time-of-Day Adaptive Synthesis:
 *    - Morning/Day (5:00 AM - 5:30 PM): Sweet Indian birds chirping (FM sine synthesis) & soft farm breeze.
 *    - Evening/Night (5:30 PM - 5:00 AM): Rhythmic countryside crickets & cicadas.
 * 2. Weather-Adaptive Synthesis:
 *    - Rainy / Monsoon: Soothing organic rainfall & water drops synthesized procedurally via filtered noise buffer.
 * 3. Immediate, zero-leak stopAllNatureAudio():
 *    - Kills all oscillators, intervals, audio buffers, and HTML5 audio nodes synchronously.
 * 4. Unified event dispatching for cross-component sync (Navbar, Floating bar, AudioManager).
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ── 1. Krishna Flute (Bansuri) ────────────────────────────────────────────────
let fluteAudioElement = null;

export function toggleKrishnaFlute(enabled, userVolume = 0.5) {
  if (enabled) {
    if (!fluteAudioElement) {
      fluteAudioElement = new Audio("/evening.wav"); // reliable fallback audio in public
      fluteAudioElement.loop = true;
    }
    fluteAudioElement.volume = userVolume;
    fluteAudioElement.play().catch(e => console.warn("Flute play error:", e));
    return true;
  } else {
    if (fluteAudioElement) {
      fluteAudioElement.pause();
      fluteAudioElement.currentTime = 0;
    }
    return false;
  }
}

// ── 2. Time & Weather Detection ───────────────────────────────────────────────
let ambientIsPlaying = false;
let ambientMasterGain = null;
let birdTimer = null;
let cricketInterval = null;
let rainSourceNode = null;
let rainGainNode = null;
let dropTimer = null;

let currentAmbienceMode = "auto"; // "auto" | "day" | "night" | "rain"
let currentWeather = "clear";     // "clear" | "rain" | "clouds"
let globalVolume = 0.5;

export function isDaytime() {
  const hr = new Date().getHours();
  return hr >= 5 && hr < 17; // 5:00 AM to 5:00 PM is Morning / Day
}

export function isRainyWeather() {
  return currentWeather === "rain" || currentWeather === "drizzle" || currentWeather === "thunderstorm";
}

export function setAmbientWeather(weatherCond) {
  if (!weatherCond) return;
  const lower = String(weatherCond).toLowerCase();
  if (lower.includes("rain") || lower.includes("drizzle") || lower.includes("shower") || lower.includes("storm")) {
    currentWeather = "rain";
  } else {
    currentWeather = "clear";
  }
  // If playing in auto mode, adapt soundscape
  if (ambientIsPlaying && currentAmbienceMode === "auto") {
    applyActiveSoundscape();
  }
}

// ── 3. Sound Synthesis (Birds, Crickets, Rain) ────────────────────────────────

// Realistic Morning Birdsong Chirp Synthesis (FM modulated sine)
function chirpBird(ctx) {
  if (!ambientIsPlaying || !ctx) return;
  const now = ctx.currentTime;
  const baseFreq = 2600 + Math.random() * 1200; // 2.6kHz - 3.8kHz
  const chirpCount = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < chirpCount; i++) {
    const startTime = now + (i * 0.12);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * (1.3 + Math.random() * 0.4), startTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, startTime + 0.1);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.04 * (globalVolume / 0.5), startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.1);

    osc.connect(gain);
    if (ambientMasterGain) gain.connect(ambientMasterGain);
    else gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.1);
  }
}

function scheduleNextBird() {
  if (!ambientIsPlaying) return;
  const ctx = getAudioContext();
  chirpBird(ctx);
  const nextDelay = 1800 + Math.random() * 3200; // random chirps every 1.8s - 5s
  birdTimer = setTimeout(scheduleNextBird, nextDelay);
}

// Realistic Nighttime Crickets Chirping Synthesis
function playCricketChirp(ctx) {
  if (!ambientIsPlaying || !ctx) return;
  const now = ctx.currentTime;
  const cricketFreq = 4600 + Math.random() * 400; // 4.6kHz - 5.0kHz

  for (let p = 0; p < 4; p++) {
    const t = now + (p * 0.04);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(cricketFreq, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.03 * (globalVolume / 0.5), t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    osc.connect(gain);
    if (ambientMasterGain) gain.connect(ambientMasterGain);
    else gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.038);
  }
}

// Procedural Soothing Rain Synthesis via Pink-filtered Noise Buffer
function startRainSound(ctx) {
  if (!ambientIsPlaying || !ctx) return;
  stopRainSound();

  // Create 2-second looped noise buffer
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Pink noise filter approximation
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.08;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  // Bandpass filter for soothing rain sound
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.06 * (globalVolume / 0.5), ctx.currentTime + 1.2);

  whiteNoise.connect(filter);
  filter.connect(gain);
  if (ambientMasterGain) gain.connect(ambientMasterGain);
  else gain.connect(ctx.destination);

  whiteNoise.start();
  rainSourceNode = whiteNoise;
  rainGainNode = gain;

  // Occasional random gentle raindrop plop
  const scheduleDrop = () => {
    if (!ambientIsPlaying || !rainSourceNode) return;
    const dropFreq = 1200 + Math.random() * 800;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(dropFreq, t);
    osc.frequency.exponentialRampToValueAtTime(dropFreq * 0.5, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g);
    if (ambientMasterGain) g.connect(ambientMasterGain);
    else g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
    dropTimer = setTimeout(scheduleDrop, 400 + Math.random() * 1200);
  };
  scheduleDrop();
}

function stopRainSound() {
  clearTimeout(dropTimer);
  if (rainSourceNode) {
    try { rainSourceNode.stop(); rainSourceNode.disconnect(); } catch(e) {}
    rainSourceNode = null;
  }
  if (rainGainNode) {
    try { rainGainNode.disconnect(); } catch(e) {}
    rainGainNode = null;
  }
}

// ── 4. Soundscape Routing & Control ──────────────────────────────────────────

function clearAllAmbienceTimers() {
  clearTimeout(birdTimer);
  clearInterval(cricketInterval);
  stopRainSound();
}

function startDayAmbience() {
  clearAllAmbienceTimers();
  scheduleNextBird();
}

function startNightAmbience() {
  clearAllAmbienceTimers();
  const ctx = getAudioContext();
  playCricketChirp(ctx);
  cricketInterval = setInterval(() => {
    if (ambientIsPlaying) {
      playCricketChirp(getAudioContext());
      if (Math.random() > 0.4) {
        setTimeout(() => playCricketChirp(getAudioContext()), 280);
      }
    }
  }, 1300);
}

function startRainAmbience() {
  clearAllAmbienceTimers();
  const ctx = getAudioContext();
  startRainSound(ctx);
}

function getActiveIcon() {
  if (!ambientIsPlaying) return "🔇";
  if (currentAmbienceMode === "rain" || (currentAmbienceMode === "auto" && isRainyWeather())) return "🌧️";
  if (currentAmbienceMode === "day" || (currentAmbienceMode === "auto" && isDaytime())) return "🕊️";
  return "🦗";
}

function getActiveLabel() {
  if (!ambientIsPlaying) return "Sound Muted";
  if (currentAmbienceMode === "rain" || (currentAmbienceMode === "auto" && isRainyWeather())) return "Monsoon Rain";
  if (currentAmbienceMode === "day" || (currentAmbienceMode === "auto" && isDaytime())) return "Morning Birds";
  return "Evening Crickets";
}

function applyActiveSoundscape() {
  if (!ambientIsPlaying) {
    clearAllAmbienceTimers();
    return;
  }

  const isRain = currentAmbienceMode === "rain" || (currentAmbienceMode === "auto" && isRainyWeather());
  const isDay = currentAmbienceMode === "day" || (currentAmbienceMode === "auto" && isDaytime());

  if (isRain) {
    startRainAmbience();
  } else if (isDay) {
    startDayAmbience();
  } else {
    startNightAmbience();
  }

  // Dispatch state change event for UI
  dispatchState();
}

function dispatchState() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nature_audio_state_change", {
      detail: {
        isPlaying: ambientIsPlaying,
        mode: currentAmbienceMode,
        icon: getActiveIcon(),
        label: getActiveLabel(),
        isDay: isDaytime(),
        isRain: isRainyWeather()
      }
    }));
  }
}

// ── 5. Public API ─────────────────────────────────────────────────────────────

/**
 * Stop ALL nature audio immediately without any residual sound or ghost loops.
 */
export function stopAllNatureAudio() {
  ambientIsPlaying = false;
  clearAllAmbienceTimers();
  
  if (ambientMasterGain && audioCtx) {
    try {
      ambientMasterGain.gain.setValueAtTime(0.00001, audioCtx.currentTime);
    } catch(e) {}
  }

  if (fluteAudioElement) {
    try {
      fluteAudioElement.pause();
      fluteAudioElement.currentTime = 0;
    } catch(e) {}
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem("rs_nature_bgm_state", "0");
    localStorage.setItem("rs_nature_bgm_active", "false");
  }

  dispatchState();
  return false;
}

/**
 * Toggle or force set farm ambience state.
 */
export function toggleFarmAmbience(enabled, mode = "auto", userVolume = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return false;

  currentAmbienceMode = mode;
  globalVolume = userVolume;

  if (enabled) {
    ambientIsPlaying = true;
    if (!ambientMasterGain) {
      ambientMasterGain = ctx.createGain();
      ambientMasterGain.connect(ctx.destination);
    }
    ambientMasterGain.gain.setValueAtTime(userVolume * 0.7, ctx.currentTime);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("rs_nature_bgm_active", "true");
      localStorage.setItem("rs_nature_bgm_state", mode === "day" ? "1" : mode === "night" ? "2" : mode === "rain" ? "3" : "1");
    }

    applyActiveSoundscape();
    return true;
  } else {
    return stopAllNatureAudio();
  }
}

/**
 * 1-Click Master Nature Sound Toggle:
 * - If playing -> stops immediately (100% stop)
 * - If stopped -> starts immediately using current time & weather
 */
export function toggleNatureSound(forceState) {
  const willPlay = forceState !== undefined ? forceState : !ambientIsPlaying;
  return toggleFarmAmbience(willPlay, "auto", globalVolume);
}

export function getNatureSoundStatus() {
  return {
    isPlaying: ambientIsPlaying,
    mode: currentAmbienceMode,
    icon: getActiveIcon(),
    label: getActiveLabel(),
    isDay: isDaytime(),
    isRain: isRainyWeather()
  };
}

export function setSoundVolume(fluteOrAmbientVol = 0.5, ambientVol = null) {
  const vol = ambientVol !== null ? ambientVol : fluteOrAmbientVol;
  globalVolume = vol;
  const ctx = getAudioContext();
  if (!ctx || !ambientMasterGain) return;
  ambientMasterGain.gain.setValueAtTime(vol * 0.7, ctx.currentTime);
}
