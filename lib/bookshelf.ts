/** Deterministic 0..1 value from a string, so a book keeps its look across renders. */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Book size in unscaled px: thicker with more photos, height varies a little per album. */
export function bookDimensions(id: string, photoCount: number) {
  const thickness = Math.round(Math.min(74, 40 + Math.sqrt(photoCount) * 4.5));
  const height = Math.round(208 + hash01(id) * 36);
  return { thickness, height, depth: 150 };
}

/** Pick a readable foil color for text on a given leather color. */
export function foilFor(hex: string): { text: string; band: string } {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.32
    ? { text: "#2a1d14", band: "rgb(42 29 20 / 0.55)" }
    : { text: "#ecd9ae", band: "rgb(212 187 138 / 0.75)" };
}
