"use client";

/**
 * Procedural sound effects (Web Audio API). Nothing is downloaded: paper, leather
 * and wood sounds are shaped from filtered noise and low sine "thumps".
 *
 * Browsers only allow audio after a user gesture, so the context is created and
 * resumed on the first pointer/key interaction (see SoundProvider). Sounds that
 * fire before that (e.g. a cold page load) are silently skipped.
 */

export type SoundName = "shelfSlide" | "coverOpen" | "pageTurn" | "coverClose";

const STORAGE_KEY = "ms-sound";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;
const listeners = new Set<(on: boolean) => void>();

try {
  if (typeof window !== "undefined") enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
} catch {
  /* storage unavailable: keep default */
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(on));
}

export function subscribeSound(listener: (on: boolean) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCtor() {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null;
}

/**
 * Build the audio engine ahead of time (during idle). Creating an AudioContext
 * opens the audio device, which can take ~100 ms on Windows — doing it inside a
 * click would stall that click's animation. Browsers allow creating it suspended
 * without a gesture; the gesture then only needs a cheap resume().
 */
export function prepareAudio() {
  const Ctor = getCtor();
  if (!Ctor || ctx) return;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);
  // 2 s of white noise, reused by every sound.
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

/** Resume audio inside a user gesture (creating the engine first if it isn't ready). */
export function unlockAudio() {
  if (!ctx) prepareAudio();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function ready() {
  // A context that is still resuming (first click) queues the sound; it plays as soon as audio starts.
  return enabled && ctx && master && noise && ctx.state !== "closed" ? { ctx, master, noise } : null;
}

/** A burst of filtered noise with a gain envelope [time, level][] (times relative to start). */
function noiseBurst(
  a: NonNullable<ReturnType<typeof ready>>,
  start: number,
  envelope: [number, number][],
  filters: { type: BiquadFilterType; freq: number; to?: number; q?: number }[],
) {
  const { ctx, master, noise } = a;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  let node: AudioNode = src;
  const end = start + envelope[envelope.length - 1][0];
  for (const f of filters) {
    const bq = ctx.createBiquadFilter();
    bq.type = f.type;
    bq.frequency.setValueAtTime(f.freq, start);
    if (f.to) bq.frequency.exponentialRampToValueAtTime(f.to, end);
    bq.Q.value = f.q ?? 0.7;
    node.connect(bq);
    node = bq;
  }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  for (const [t, v] of envelope) g.gain.linearRampToValueAtTime(Math.max(0.0001, v), start + t);
  node.connect(g).connect(master);
  src.start(start, Math.random() * 1.2);
  src.stop(end + 0.05);
}

/** A soft low "thump" (pitch-dropping sine). */
function thump(a: NonNullable<ReturnType<typeof ready>>, start: number, level: number, from = 95, to = 48) {
  const { ctx, master } = a;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(level, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
  osc.connect(g).connect(master);
  osc.start(start);
  osc.stop(start + 0.3);
}

/** A faint leather creak: a resonant, slightly wobbling saw tone. */
function creak(a: NonNullable<ReturnType<typeof ready>>, start: number, duration: number) {
  const { ctx, master } = a;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(70, start);
  osc.frequency.linearRampToValueAtTime(52, start + duration);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 23;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 9;
  lfo.connect(lfoGain).connect(osc.frequency);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 820;
  bp.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(0.05, start + 0.06);
  g.gain.linearRampToValueAtTime(0.0001, start + duration);
  osc.connect(bp).connect(g).connect(master);
  osc.start(start);
  lfo.start(start);
  osc.stop(start + duration + 0.05);
  lfo.stop(start + duration + 0.05);
}

/**
 * Play a sound. `durationMs` lets an effect line up with its animation
 * (e.g. the thud lands when the cover lands).
 */
export function playSound(name: SoundName, durationMs?: number) {
  const a = ready();
  if (!a) return;
  const t = a.ctx.currentTime + 0.01;

  switch (name) {
    case "shelfSlide": {
      // Felt-on-wood friction as the book is drawn out.
      noiseBurst(a, t, [[0.05, 0.22], [0.28, 0.16], [0.46, 0.0001]], [
        { type: "lowpass", freq: 700, to: 1500 },
        { type: "highpass", freq: 180 },
      ]);
      thump(a, t + 0.02, 0.08, 140, 90);
      break;
    }
    case "coverOpen": {
      const d = (durationMs ?? 1050) / 1000;
      creak(a, t, 0.32);
      // Air moving as the board swings.
      noiseBurst(a, t + 0.08, [[0.1, 0.06], [d * 0.55, 0.11], [d - 0.02, 0.0001]], [
        { type: "lowpass", freq: 380, to: 1400 },
      ]);
      // The cover settles flat.
      thump(a, t + d - 0.04, 0.32);
      noiseBurst(a, t + d - 0.04, [[0.01, 0.12], [0.12, 0.0001]], [{ type: "lowpass", freq: 900 }]);
      break;
    }
    case "pageTurn": {
      const d = (durationMs ?? 850) / 1000;
      // Crisp paper rustle with a little crinkle, then a soft flap as it lands.
      noiseBurst(
        a,
        t,
        [[0.03, 0.16], [0.09, 0.07], [0.16, 0.19], [d * 0.55, 0.1], [d * 0.85, 0.05], [d, 0.0001]],
        [
          { type: "highpass", freq: 900 },
          { type: "bandpass", freq: 2600, to: 4200, q: 0.6 },
        ],
      );
      noiseBurst(a, t + d - 0.06, [[0.015, 0.14], [0.11, 0.0001]], [{ type: "lowpass", freq: 600 }]);
      break;
    }
    case "coverClose": {
      const d = (durationMs ?? 900) / 1000;
      noiseBurst(a, t, [[0.12, 0.08], [d * 0.7, 0.13], [d, 0.0001]], [{ type: "lowpass", freq: 1500, to: 420 }]);
      thump(a, t + d - 0.03, 0.42, 110, 45);
      noiseBurst(a, t + d - 0.03, [[0.01, 0.16], [0.14, 0.0001]], [{ type: "lowpass", freq: 700 }]);
      break;
    }
  }
}
