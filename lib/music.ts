"use client";

import { getAudioContext } from "./sound";

/**
 * Quiet background music for the signed-in library.
 *
 * The track is a local file (see next.config.ts): add a licensed copy at
 * public/audio/starlight.mp3. Browsers only allow audio after a user gesture, so
 * music starts on the first click/key press, fades in softly and loops. It pauses
 * while the tab is hidden and fades out when the reader leaves the library.
 *
 * Volume goes through a Web Audio GainNode (HTMLMediaElement.volume is fixed on iOS).
 */

export const MUSIC = {
  src: process.env.NEXT_PUBLIC_MUSIC_SRC ?? "",
  title: "Starlight",
  artist: "Noonsol Music Studio",
};

/** Loudest the music can get (gain); the slider scales 0–100% of this. Kept low on purpose. */
const MAX_GAIN = 0.4;
const DEFAULT_VOLUME = 0.3; // → gain 0.12
const ENABLED_KEY = "ms-music";
const VOLUME_KEY = "ms-music-volume";

export type MusicStatus = "off" | "waiting" | "loading" | "playing" | "unavailable";
export type MusicState = { enabled: boolean; volume: number; status: MusicStatus };

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

let state: MusicState = { enabled: true, volume: DEFAULT_VOLUME, status: MUSIC.src ? "waiting" : "unavailable" };
if (typeof window !== "undefined") {
  const enabled = read(ENABLED_KEY) !== "off";
  const v = Number(read(VOLUME_KEY));
  state = {
    enabled,
    volume: Number.isFinite(v) && read(VOLUME_KEY) !== null ? Math.min(1, Math.max(0, v)) : DEFAULT_VOLUME,
    status: !MUSIC.src ? "unavailable" : enabled ? "waiting" : "off",
  };
}

const SERVER_STATE: MusicState = { enabled: true, volume: DEFAULT_VOLUME, status: "waiting" };
const listeners = new Set<() => void>();

function set(patch: Partial<MusicState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeMusic(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const getMusicState = () => state;
export const getServerMusicState = () => SERVER_STATE;

let audio: HTMLAudioElement | null = null;
let gain: GainNode | null = null;
let active = false; // a page with music controls is mounted
let pauseTimer = 0;
let loopDip = false;
const LOOP_FADE_S = 1.6;
let resumeWhenVisible = false;

function level() {
  return state.volume * MAX_GAIN;
}

function ensureAudio() {
  if (audio) return audio;
  const a = new Audio();
  a.loop = true;
  a.preload = "auto";
  a.src = MUSIC.src;
  a.addEventListener("error", () => set({ status: "unavailable" }));
  a.addEventListener("playing", () => set({ status: "playing" }));
  a.addEventListener("pause", () => {
    if (state.status === "playing") set({ status: state.enabled ? "waiting" : "off" });
  });
  // Soft loop: dip out over the last moments of the track and swell back in after it
  // wraps, so the restart is never abrupt.
  let last = 0;
  a.addEventListener("timeupdate", () => {
    const t = a.currentTime;
    const playingNow = !a.paused && state.enabled && active && !document.hidden;
    if (playingNow && Number.isFinite(a.duration)) {
      const left = a.duration - t;
      if (left < LOOP_FADE_S && left > 0 && !loopDip) {
        loopDip = true;
        fadeTo(0, left);
      } else if (t + 1 < last && loopDip) {
        loopDip = false;
        fadeTo(level(), 2.5);
      }
    }
    last = t;
  });
  audio = a;

  // Route through Web Audio so the volume works everywhere (including iOS).
  const ctx = getAudioContext();
  if (ctx) {
    try {
      const source = ctx.createMediaElementSource(a);
      gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(ctx.destination);
    } catch {
      gain = null;
    }
  }
  if (!gain) a.volume = 0;
  return a;
}

/** Ramp the music's loudness to `target` over `seconds`. */
function fadeTo(target: number, seconds: number) {
  if (gain) {
    const now = gain.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(target, now + Math.max(0.01, seconds));
  } else if (audio) {
    const from = audio.volume;
    const start = performance.now();
    const step = (t: number) => {
      if (!audio) return;
      const k = Math.min(1, (t - start) / (seconds * 1000 || 1));
      audio.volume = from + (target - from) * k;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

/** Start (or resume) the music. Call from a user gesture the first time. */
export function startMusic() {
  if (!MUSIC.src || !state.enabled || !active || state.status === "unavailable" || document.hidden) return;
  const a = ensureAudio();
  window.clearTimeout(pauseTimer);
  const ctx = gain?.context as AudioContext | undefined;
  if (ctx && ctx.state === "suspended") void ctx.resume();
  loopDip = false;
  if (!a.paused) {
    fadeTo(level(), 1.5);
    return;
  }
  if (state.status !== "playing") set({ status: "loading" });
  a.play().then(
    () => {
      // Switched off or left while it was starting: stay silent.
      if (state.enabled && active && !document.hidden) fadeTo(level(), 3.5);
    },
    () => {
      // Not allowed yet (no gesture): wait for the next interaction.
      if (state.status !== "unavailable") set({ status: "waiting" });
    },
  );
}

/** Fade out, then pause. */
export function stopMusic(seconds = 1.2) {
  if (!audio || audio.paused) return;
  fadeTo(0, seconds);
  window.clearTimeout(pauseTimer);
  pauseTimer = window.setTimeout(() => audio?.pause(), seconds * 1000 + 60);
}

export function setMusicEnabled(on: boolean) {
  write(ENABLED_KEY, on ? "on" : "off");
  if (state.status === "unavailable") {
    set({ enabled: on });
    return;
  }
  set({ enabled: on, status: on ? "waiting" : "off" });
  if (on) startMusic();
  else stopMusic(0.8);
}

export function setMusicVolume(volume: number) {
  const v = Math.min(1, Math.max(0, volume));
  write(VOLUME_KEY, String(v));
  set({ volume: v });
  if (audio && !audio.paused) fadeTo(level(), 0.15);
}

/** Called by the controller mounted in the signed-in layout. */
export function setMusicActive(on: boolean) {
  active = on;
  if (!on) {
    resumeWhenVisible = false;
    stopMusic(1);
    if (state.status === "playing" || state.status === "loading") set({ status: state.enabled ? "waiting" : "off" });
  }
}

/** Pause while the tab is hidden; pick up again when it is visible. */
export function onVisibilityChange() {
  if (document.hidden) {
    resumeWhenVisible = !!audio && !audio.paused;
    stopMusic(0.4);
  } else if (resumeWhenVisible) {
    resumeWhenVisible = false;
    startMusic();
  }
}
