/**
 * Astrological artwork: zodiac wheel, constellation figures, glyphs and moon phases.
 * Everything draws in currentColor and scales with its box. Coordinates are rounded
 * (r2) so server and browser render identical markup.
 */
import { CONSTELLATIONS, PLANETS, ZODIAC } from "@/lib/astro-glyphs.mjs";

const r2 = (n: number) => Math.round(n * 100) / 100;
const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [r2(cx + Math.cos(a) * r), r2(cy + Math.sin(a) * r)];
};

export type ZodiacKey = (typeof ZODIAC)[number]["key"];

/** One 24×24 glyph path placed centred at (x, y) with the given size. */
export function GlyphAt({ d, x, y, size, width = 1.6 }: { d: string; x: number; y: number; size: number; width?: number }) {
  const s = size / 24;
  return (
    <path
      d={d}
      transform={`translate(${r2(x - size / 2)} ${r2(y - size / 2)}) scale(${r2(s)})`}
      fill="none"
      stroke="currentColor"
      strokeWidth={r2(width / s)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** A standalone glyph in its own svg (e.g. a spine ornament). */
export function Glyph({ d, className, width = 1.6 }: { d: string; className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function zodiacGlyph(key: string) {
  return (ZODIAC.find((z) => z.key === key) ?? ZODIAC[0]).d;
}
export function planetGlyph(key: string) {
  return (PLANETS.find((p) => p.key === key) ?? PLANETS[0]).d;
}

// ---------------------------------------------------------------------------- wheel geometry

function ticks(r1: number, r2Long: number, r2Short: number, every: number) {
  let d = "";
  for (let deg = 0; deg < 360; deg += every) {
    const long = deg % 10 === 0;
    const mid = deg % 5 === 0;
    const [x1, y1] = polar(100, 100, r1, deg);
    const [x2, y2] = polar(100, 100, long ? r2Long : mid ? (r1 + r2Long) / 2 : r2Short, deg);
    d += `M${x1} ${y1}L${x2} ${y2}`;
  }
  return d;
}

function spokes(rIn: number, rOut: number, count: number, offset = 0) {
  let d = "";
  for (let i = 0; i < count; i++) {
    const deg = offset + (i * 360) / count;
    const [x1, y1] = polar(100, 100, rIn, deg);
    const [x2, y2] = polar(100, 100, rOut, deg);
    d += `M${x1} ${y1}L${x2} ${y2}`;
  }
  return d;
}

const WHEEL = {
  fineTicks: ticks(97, 91.5, 94.5, 1),
  coarseTicks: ticks(97, 92, 92, 5),
  signDividers: spokes(76, 91.5, 12),
  houseCusps: spokes(34, 70, 12, 15),
  signs: ZODIAC.map((z, i) => ({ d: z.d, at: polar(100, 100, 83.8, i * 30 + 15) })),
  // A fixed, pleasing "chart": planets at assorted longitudes, joined by aspect lines.
  planets: [
    [PLANETS[0], 18],
    [PLANETS[1], 104],
    [PLANETS[2], 41],
    [PLANETS[3], 158],
    [PLANETS[4], 226],
    [PLANETS[5], 287],
    [PLANETS[6], 330],
  ].map(([p, deg]) => ({ d: (p as (typeof PLANETS)[number]).d, deg: deg as number, at: polar(100, 100, 60, deg as number) })),
};
const aspectPoints = WHEEL.planets.map((p) => polar(100, 100, 34, p.deg));
const ASPECTS = [
  [0, 3],
  [0, 4],
  [1, 4],
  [1, 5],
  [2, 5],
  [2, 6],
  [3, 6],
  [0, 5],
  [3, 5],
]
  .map(([a, b]) => `M${aspectPoints[a][0]} ${aspectPoints[a][1]}L${aspectPoints[b][0]} ${aspectPoints[b][1]}`)
  .join("");

/**
 * A detailed natal-chart style zodiac wheel: degree scale, the twelve signs, house
 * cusps, the classical planets and aspect lines around a radiant centre.
 * `detail="simple"` drops the 1° ticks and planets for very small sizes.
 */
export function ZodiacWheel({ className, detail = "full" }: { className?: string; detail?: "full" | "simple" }) {
  const full = detail === "full";
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="98.5" strokeWidth="1.4" />
      <circle cx="100" cy="100" r="97" strokeWidth="0.5" />
      {full ? (
        <path d={WHEEL.fineTicks} strokeWidth="0.45" opacity="0.85" />
      ) : (
        <path d={WHEEL.coarseTicks} strokeWidth="0.7" opacity="0.85" />
      )}
      <circle cx="100" cy="100" r="91.5" strokeWidth="0.8" />
      <path d={WHEEL.signDividers} strokeWidth="0.7" />
      {WHEEL.signs.map((s, i) => (
        <GlyphAt key={i} d={s.d} x={s.at[0]} y={s.at[1]} size={11} width={1.1} />
      ))}
      <circle cx="100" cy="100" r="76" strokeWidth="0.9" />
      <circle cx="100" cy="100" r="72" strokeWidth="0.45" />
      {full && (
        <>
          <path d={WHEEL.houseCusps} strokeWidth="0.4" opacity="0.6" />
          {WHEEL.planets.map((p, i) => (
            <g key={i}>
              <circle cx={p.at[0]} cy={p.at[1]} r="6.4" fill="currentColor" fillOpacity="0.08" strokeWidth="0.4" />
              <GlyphAt d={p.d} x={p.at[0]} y={p.at[1]} size={8} width={0.9} />
            </g>
          ))}
          <circle cx="100" cy="100" r="34" strokeWidth="0.6" />
          <path d={ASPECTS} strokeWidth="0.45" opacity="0.75" />
          {aspectPoints.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.1" fill="currentColor" stroke="none" />
          ))}
        </>
      )}
      <circle cx="100" cy="100" r={full ? 12 : 18} strokeWidth="0.6" />
      <path
        d="M100 86Q101.6 98.4 114 100Q101.6 101.6 100 114Q98.4 101.6 86 100Q98.4 98.4 100 86Z"
        fill="currentColor"
        stroke="none"
        transform={full ? "translate(50 50) scale(.5)" : "translate(30 30) scale(.7)"}
      />
    </svg>
  );
}

/** A zodiac constellation: lines between its stars, brighter stars drawn larger. */
export function ConstellationFigure({
  sign,
  className,
  lineOpacity = 0.55,
}: {
  sign: string;
  className?: string;
  lineOpacity?: number;
}) {
  const c = CONSTELLATIONS.find((k) => k.key === sign) ?? CONSTELLATIONS[0];
  return (
    <svg viewBox="-4 -4 108 108" className={className} aria-hidden>
      <path
        d={c.lines.map(([a, b]) => `M${c.stars[a][0]} ${c.stars[a][1]}L${c.stars[b][0]} ${c.stars[b][1]}`).join("")}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeOpacity={lineOpacity}
        vectorEffect="non-scaling-stroke"
      />
      {c.stars.map(([x, y, m], i) => (
        <g key={i}>
          {m === 1 && <circle cx={x} cy={y} r="5" fill="currentColor" opacity="0.18" />}
          <circle cx={x} cy={y} r={m === 1 ? 2.6 : m === 2 ? 1.9 : 1.3} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/** The sign whose constellation a title "belongs" to — stable per title. */
export function signForTitle(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  return CONSTELLATIONS[(h >>> 0) % CONSTELLATIONS.length].key;
}

/** A row of moon phases, new → full → new. */
export function MoonPhases({ className, count = 7 }: { className?: string; count?: number }) {
  const r = 6;
  const gap = 18;
  const w = gap * (count - 1) + r * 2 + 4;
  return (
    <svg viewBox={`0 0 ${w} 16`} className={className} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const cx = r + 2 + i * gap;
        const cy = 8;
        const t = i / (count - 1); // 0 new … .5 full … 1 new
        const lit = 1 - Math.abs(t * 2 - 1); // 0 … 1 … 0
        const waxing = t < 0.5;
        const rx = r2(Math.abs(1 - lit * 2) * r);
        const bulge = lit > 0.5 ? 1 : 0;
        const side = waxing ? 1 : 0;
        // Lit limb (half circle) plus a terminator ellipse.
        const path =
          lit <= 0.001
            ? ""
            : lit >= 0.999
              ? `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}Z`
              : `M${cx} ${cy - r}A${r} ${r} 0 0 ${side} ${cx} ${cy + r}A${rx} ${r} 0 0 ${bulge === side ? 1 - side : side} ${cx} ${cy - r}Z`;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
            {path && <path d={path} fill="currentColor" />}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------- astrolabe

const ASTRO = (() => {
  const c = 120;
  // Hour scale on the rim: 24 major marks with smaller ones between.
  let rim = "";
  for (let i = 0; i < 96; i++) {
    const major = i % 4 === 0;
    const [x1, y1] = polar(100, c, 90, i * 3.75);
    const [x2, y2] = polar(100, c, major ? 82 : 86.5, i * 3.75);
    rim += `M${x1} ${y1}L${x2} ${y2}`;
  }
  // Almucantars: circles of equal altitude, crowding toward the zenith.
  const almucantars = [62, 50, 39, 29, 20, 12].map((r, i) => ({ cx: 100, cy: r2(c - 16 + i * 3.4), r }));
  // Azimuth arcs fanning out from the zenith.
  let azimuths = "";
  for (let k = -3; k <= 3; k++) {
    if (k === 0) continue;
    const [x, y] = polar(100, c - 6, 70, k * 24);
    azimuths += `M100 ${c - 6}Q${r2(100 + k * 6)} ${r2(c + 20)} ${x} ${y}`;
  }
  // Rete: the eccentric ecliptic ring carrying the signs, and star pointers.
  const ecl = { cx: 100, cy: c - 12, r: 46 };
  const signs = ZODIAC.map((z, i) => ({ d: z.d, at: polar(ecl.cx, ecl.cy, ecl.r + 8.5, i * 30 + 15) }));
  const pointers = [28, 82, 140, 205, 252, 318].map((deg, i) => {
    const [tx, ty] = polar(100, c, 70 + (i % 2) * 8, deg);
    const [bx1, by1] = polar(100, c, 52, deg - 7);
    const [bx2, by2] = polar(100, c, 52, deg + 7);
    return { flame: `M${bx1} ${by1}Q${r2((bx1 + tx) / 2 + 2)} ${r2((by1 + ty) / 2)} ${tx} ${ty}Q${r2((bx2 + tx) / 2 - 2)} ${r2((by2 + ty) / 2)} ${bx2} ${by2}Z`, tip: [tx, ty] };
  });
  const [ax1, ay1] = polar(100, c, 88, 35);
  const [ax2, ay2] = polar(100, c, 88, 215);
  return { c, rim, almucantars, azimuths, ecl, signs, pointers, alidade: `M${ax1} ${ay1}L${ax2} ${ay2}` };
})();

/** A brass astrolabe: throne, hour rim, almucantars, the rete with its zodiac ring and star pointers. */
export function AstrolabeArt({ className }: { className?: string }) {
  const { c } = ASTRO;
  return (
    <svg viewBox="0 0 200 216" className={className} aria-hidden fill="none" stroke="currentColor">
      {/* throne and suspension ring */}
      <circle cx="100" cy="12" r="7" strokeWidth="1.4" />
      <path d="M78 34C80 22 90 18 100 18S120 22 122 34C116 30 108 30 100 31S84 30 78 34Z" fill="currentColor" fillOpacity="0.16" strokeWidth="1.1" />
      <path d="M88 26Q100 21 112 26" strokeWidth="0.6" />
      {/* mater */}
      <circle cx="100" cy={c} r="94" strokeWidth="1.6" />
      <circle cx="100" cy={c} r="90" strokeWidth="0.6" />
      <path d={ASTRO.rim} strokeWidth="0.55" />
      <circle cx="100" cy={c} r="82" strokeWidth="0.8" />
      {/* plate */}
      {ASTRO.almucantars.map((a, i) => (
        <circle key={i} cx={a.cx} cy={a.cy} r={a.r} strokeWidth="0.35" opacity="0.6" />
      ))}
      <path d={ASTRO.azimuths} strokeWidth="0.35" opacity="0.55" />
      <path d={`M18 ${c}H182M100 ${c - 82}V${c + 82}`} strokeWidth="0.4" opacity="0.6" />
      {/* rete */}
      <circle cx={ASTRO.ecl.cx} cy={ASTRO.ecl.cy} r={ASTRO.ecl.r} strokeWidth="1.1" />
      <circle cx={ASTRO.ecl.cx} cy={ASTRO.ecl.cy} r={ASTRO.ecl.r + 15} strokeWidth="0.7" />
      {ASTRO.signs.map((s, i) => (
        <GlyphAt key={i} d={s.d} x={s.at[0]} y={s.at[1]} size={8.5} width={0.9} />
      ))}
      {ASTRO.pointers.map((p, i) => (
        <g key={i}>
          <path d={p.flame} fill="currentColor" fillOpacity="0.22" strokeWidth="0.6" />
          <circle cx={p.tip[0]} cy={p.tip[1]} r="1.6" fill="currentColor" stroke="none" />
        </g>
      ))}
      {/* alidade and pin */}
      <path d={ASTRO.alidade} strokeWidth="2.2" opacity="0.9" />
      <circle cx="100" cy={c} r="5" fill="currentColor" fillOpacity="0.3" strokeWidth="1" />
      <circle cx="100" cy={c} r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Armillary rings crossing behind a constellation (the Observatory binding). */
export function ArmillaryRings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle cx="100" cy="100" r="92" strokeWidth="1" />
      <circle cx="100" cy="100" r="88" strokeWidth="0.4" />
      <ellipse cx="100" cy="100" rx="92" ry="30" strokeWidth="0.8" transform="rotate(-23.5 100 100)" />
      <ellipse cx="100" cy="100" rx="92" ry="24" strokeWidth="0.5" opacity="0.8" />
      <ellipse cx="100" cy="100" rx="30" ry="92" strokeWidth="0.5" opacity="0.7" />
      <path d={ticks(92, 86, 89, 5)} strokeWidth="0.5" opacity="0.8" />
    </svg>
  );
}
