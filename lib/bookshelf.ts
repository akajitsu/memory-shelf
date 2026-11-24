import { hash01 } from "@/lib/random";

/** Book size in unscaled px: thicker with more photos, height varies a little per album. */
export function bookDimensions(id: string, photoCount: number) {
  const thickness = Math.round(Math.min(74, 40 + Math.sqrt(photoCount) * 4.5));
  const height = Math.round(208 + hash01(id) * 36);
  return { thickness, height, depth: 150 };
}

/** Gentle levitation for a book on the shelf: its own period, delay and height. */
export function floatFor(id: string) {
  const a = hash01(id + "a");
  const b = hash01(id + "b");
  return { period: 5.5 + a * 3.5, delay: -b * 8, lift: 3 + a * 3 };
}

/** Pose for a book drifting in the Floating library: tilt, turn toward its cover, height offset. */
export function driftFor(id: string) {
  const a = hash01(id + "t");
  const b = hash01(id + "u");
  const c = hash01(id + "o");
  return { tilt: (a - 0.5) * 16, turn: -22 - b * 20, offset: Math.round(c * 72), sway: 1.2 + a * 2.4 };
}
