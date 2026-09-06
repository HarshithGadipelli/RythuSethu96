/**
 * AmbientSoundEngine — Realistic Indian Farm Soundscape & Divine Krishna Flute
 * 
 * Features:
 * 1. Divine Krishna Bansuri (Flute) synthesizer playing Raag Bhupali peaceful melodies + Tanpura drone.
 * 2. Daytime Farm Ambience: Realistic birds chirping & morning farm breeze.
 * 3. Nighttime Farm Ambience: Night crickets rhythmic chirping & cicada chorus.
 * 4. Auto day/night detection based on local time + manual override.
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

let fluteAudioElement = null;

export function toggleKrishnaFlute(enabled, userVolume = 0.5) {
  if (enabled) {
    if (!fluteAudioElement) {
      fluteAudioElement = new Audio("/flute.mp3");
      fluteAudioElement.loop = true;
    }
    fluteAudioElement.volume = userVolume;
    fluteAudioElement.play().catch(e => console.error("Flute play blocked:", e));
    return true;
  } else {
    if (fluteAudioElement) {
      fluteAudioElement.pause();
      fluteAudioElement.currentTime = 0;
    }
    return false;
  }
}

// ── 2. Day & Night Farm Ambience (Birds & Crickets) ───────────────────────────
let ambientIsPlaying = false;
let ambientMasterGain = null;
let birdTimer = null;
let cricketInterval = null;
let currentAmbienceMode = "auto"; // "auto" | "day" | "night"

export function isDaytime() {
  const hr = new Date().getHours();
  return hr >= 6 && hr < 18; // 6:00 AM to 6:00 PM is Day
}

// Realistic Morning Birdsong Chirp Synthesis
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
    // Rapid FM pitch bend for sweet birdsong
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * (1.3 + Math.random() * 0.4), startTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, startTime + 0.1);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.045, startTime + 0.02);
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

  // 3 rapid pulses
  for (let p = 0; p < 4; p++) {
    const t = now + (p * 0.04);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(cricketFreq, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.032, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    osc.connect(gain);
    if (ambientMasterGain) gain.connect(ambientMasterGain);
    else gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.038);
  }
}

function startDayAmbience() {
  clearTimeout(birdTimer);
  clearInterval(cricketInterval);
  scheduleNextBird();
}

function startNightAmbience() {
  clearTimeout(birdTimer);
  clearInterval(cricketInterval);
  const ctx = getAudioContext();
  playCricketChirp(ctx);
  cricketInterval = setInterval(() => {
    if (ambientIsPlaying) {
      playCricketChirp(getAudioContext());
      // Occasional double cricket echo
      if (Math.random() > 0.4) {
        setTimeout(() => playCricketChirp(getAudioContext()), 280);
      }
    }
  }, 1200);
}

export function toggleFarmAmbience(enabled, mode = "auto", userVolume = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return false;

  currentAmbienceMode = mode;

  if (enabled) {
    ambientIsPlaying = true;
    if (!ambientMasterGain) {
      ambientMasterGain = ctx.createGain();
      ambientMasterGain.connect(ctx.destination);
    }
    ambientMasterGain.gain.setValueAtTime(userVolume * 0.6, ctx.currentTime);

    const shouldPlayDay = mode === "day" || (mode === "auto" && isDaytime());
    if (shouldPlayDay) {
      startDayAmbience();
    } else {
      startNightAmbience();
    }
    return true;
  } else {
    ambientIsPlaying = false;
    clearTimeout(birdTimer);
    clearInterval(cricketInterval);
    return false;
  }
}

export function setSoundVolume(fluteVol = 0.5, ambientVol = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (fluteMasterGain) fluteMasterGain.gain.setValueAtTime(fluteVol * 0.55, ctx.currentTime);
  if (ambientMasterGain) ambientMasterGain.gain.setValueAtTime(ambientVol * 0.6, ctx.currentTime);
}
