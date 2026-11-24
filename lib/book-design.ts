import { ZODIAC } from "@/lib/astro-glyphs.mjs";

/**
 * The physical look of an album book: a binding design, a tooled pattern and a
 * leather color. Shared by the shelf, the album's closed cover and the form preview.
 * Keep DESIGNS/PATTERNS in sync with the check constraints in
 * supabase/migrations/20261123000001_book_designs.sql.
 */

export const BOOK_DESIGNS = ["classic", "celestial", "arch", "astrolabe"] as const;
export type BookDesign = (typeof BOOK_DESIGNS)[number];

export const BOOK_PATTERNS = ["none", "stars", "constellations", "filigree", "moons"] as const;
export type BookPattern = (typeof BOOK_PATTERNS)[number];

// Keys are stored in the database; names and artwork can change freely.
export const DESIGN_INFO: Record<BookDesign, { name: string; description: string }> = {
  classic: { name: "Zodiac Wheel", description: "A gilded natal chart: the twelve signs, the planets and their aspects" },
  celestial: { name: "Lunar Phases", description: "A great crescent between the moon's turning phases" },
  arch: { name: "Observatory", description: "An arched window framing the album's own constellation" },
  astrolabe: { name: "Astrolabe", description: "The brass star instrument, its rete ringed with the zodiac" },
};

export const PATTERN_INFO: Record<BookPattern, { name: string }> = {
  none: { name: "Plain leather" },
  stars: { name: "Scattered stars" },
  constellations: { name: "Constellations" },
  filigree: { name: "Zodiac glyphs" },
  moons: { name: "Moon phases" },
};

/** Leather colors offered for new books. Custom colors are allowed too. */
export const BOOK_COLORS = [
  { name: "Deep Teal", value: "#1b555b" },
  { name: "Midnight", value: "#1f2b57" },
  { name: "Dusky Indigo", value: "#393b71" },
  { name: "Lagoon", value: "#176d78" },
  { name: "Plum", value: "#4e2f5e" },
  { name: "Rosewood", value: "#6b3249" },
  { name: "Moss", value: "#2f4a3a" },
  { name: "Oxblood", value: "#6b2a2a" },
  { name: "Saddle", value: "#7a4b2a" },
  { name: "Vellum", value: "#d9cfb6" },
] as const;

export const DEFAULT_BOOK: { design: BookDesign; pattern: BookPattern; color: string } = {
  design: "celestial",
  pattern: "stars",
  color: BOOK_COLORS[0].value,
};

export function isBookDesign(v: unknown): v is BookDesign {
  return typeof v === "string" && (BOOK_DESIGNS as readonly string[]).includes(v);
}
export function isBookPattern(v: unknown): v is BookPattern {
  return typeof v === "string" && (BOOK_PATTERNS as readonly string[]).includes(v);
}

/** Everything needed to draw a book's exterior. */
export type BookLook = { title: string; color: string; design: BookDesign; pattern: BookPattern };

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Foil for a leather color: moonlight gilt on dark leathers, deep navy ink on light
 * ones. `band` is a dimmer version for rules and ornaments, `glow` a soft halo.
 */
export function foilFor(hex: string): { text: string; band: string; glow: string; light: boolean } {
  const light = luminance(hex) > 0.32;
  return light
    ? { text: "#1e2645", band: "rgb(30 38 69 / 0.6)", glow: "rgb(30 38 69 / 0)", light }
    : { text: "#ecdc98", band: "rgb(232 215 139 / 0.72)", glow: "rgb(232 215 139 / 0.35)", light };
}

// ------------------------------------------------------------------------- patterns

const svg = (body: string, w: number, h = w) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;

const star4 = (x: number, y: number, s: number) =>
  `<path d='M${x} ${y - s}Q${x + s * 0.15} ${y - s * 0.15} ${x + s} ${y}Q${x + s * 0.15} ${y + s * 0.15} ${x} ${y + s}Q${x - s * 0.15} ${y + s * 0.15} ${x - s} ${y}Q${x - s * 0.15} ${y - s * 0.15} ${x} ${y - s}Z'/>`;

/**
 * Pattern tiles used as CSS masks: the foil color shows through the black shapes,
 * so one tile works on any leather. Sized in px at the book's base scale.
 */
export const PATTERN_MASKS: Record<Exclude<BookPattern, "none">, { image: string; size: string }> = {
  stars: {
    image: svg(
      `<g fill='black'>${star4(9, 10, 3.2)}${star4(34, 26, 2.2)}${star4(18, 40, 1.6)}${star4(44, 6, 1.4)}<circle cx='27' cy='12' r='.9'/><circle cx='6' cy='29' r='.8'/><circle cx='40' cy='44' r='1'/></g>`,
      48,
    ),
    size: "48px 48px",
  },
  constellations: {
    image: svg(
      `<g fill='black' stroke='black' stroke-width='.7'><path fill='none' d='M8 12L22 8L33 19L52 15M33 19L28 36L44 46M10 52L28 36'/><circle cx='8' cy='12' r='1.7'/><circle cx='22' cy='8' r='1.3'/><circle cx='33' cy='19' r='2'/><circle cx='52' cy='15' r='1.3'/><circle cx='28' cy='36' r='1.6'/><circle cx='44' cy='46' r='1.4'/><circle cx='10' cy='52' r='1.2'/></g>`,
      60,
    ),
    size: "60px 60px",
  },
  // Stored as "filigree": a tile of zodiac glyphs.
  filigree: {
    image: svg(
      `<g fill='none' stroke='black' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'>${[
        [2, 4, 0],
        [30, 2, 4],
        [16, 20, 8],
        [44, 22, 2],
        [4, 38, 6],
        [32, 40, 10],
      ]
        .map(([x, y, i]) => `<path transform='translate(${x} ${y}) scale(.52)' d='${ZODIAC[i].d}'/>`)
        .join("")}<circle cx='26' cy='14' r='.9' fill='black'/><circle cx='52' cy='8' r='.7' fill='black'/><circle cx='22' cy='50' r='.8' fill='black'/></g>`,
      56,
    ),
    size: "56px 56px",
  },
  moons: {
    image: svg(
      `<g fill='black'><circle cx='9' cy='9' r='4.2'/><path d='M27 4.8a4.2 4.2 0 1 0 0 8.4a3 4.2 0 0 1 0-8.4Z'/><path d='M45 4.8a4.2 4.2 0 1 1 0 8.4a3 4.2 0 0 0 0-8.4Z'/><path d='M18 28.8a4.2 4.2 0 0 0 0 8.4Z'/><path d='M36 28.8a4.2 4.2 0 0 1 0 8.4Z'/><circle cx='9' cy='42' r='.9'/><circle cx='27' cy='22' r='.7'/><circle cx='47' cy='40' r='.8'/></g><g fill='none' stroke='black' stroke-width='.7'><circle cx='18' cy='33' r='4.2'/><circle cx='36' cy='33' r='4.2'/></g>`,
      54,
    ),
    size: "54px 54px",
  },
};
