// Generates the static artwork for the celestial sky into public/sky/.
//   node scripts/generate-sky.mjs
// Deterministic (seeded), so re-running produces identical files.
import { mkdirSync, writeFileSync } from "node:fs";
import { CONSTELLATIONS, PLANETS, ZODIAC } from "../lib/astro-glyphs.mjs";

const OUT = "public/sky";
mkdirSync(OUT, { recursive: true });

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;

const STAR_COLORS = [
  ["#f0ebdd", 52],
  ["#d6def0", 22],
  ["#e8d78b", 12],
  ["#a89acb", 8],
  ["#83d9d4", 6],
];
function pickColor(r) {
  let x = r() * 100;
  for (const [c, w] of STAR_COLORS) if ((x -= w) <= 0) return c;
  return STAR_COLORS[0][0];
}

/** A seamless tile of stars. Stars near an edge are drawn again on the opposite side. */
function starTile({ size, count, rMin, rMax, oMin, oMax, glow = 0, sparkles = 0, seed }) {
  const r = rng(seed);
  const defs = new Set();
  const body = [];
  const place = (x, y, draw) => {
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size]) {
        const px = x + dx;
        const py = y + dy;
        if (px > -20 && px < size + 20 && py > -20 && py < size + 20) body.push(draw(px, py));
      }
  };
  for (let i = 0; i < count; i++) {
    const x = r() * size;
    const y = r() * size;
    const rad = rMin + r() ** 2 * (rMax - rMin);
    const o = oMin + r() * (oMax - oMin);
    const c = pickColor(r);
    const isGlow = i < glow;
    if (isGlow) defs.add(c);
    place(x, y, (px, py) =>
      isGlow
        ? `<circle cx="${f(px)}" cy="${f(py)}" r="${f(rad * 4.5)}" fill="url(#g${c.slice(1)})" opacity="${f(o)}"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(rad)}" fill="${c}"/>`
        : `<circle cx="${f(px)}" cy="${f(py)}" r="${f(rad)}" fill="${c}" opacity="${f(o)}"/>`,
    );
  }
  for (let i = 0; i < sparkles; i++) {
    const x = 40 + r() * (size - 80);
    const y = 40 + r() * (size - 80);
    const s = 5 + r() * 5;
    const c = r() < 0.6 ? "#f0ebdd" : "#e8d78b";
    defs.add(c);
    body.push(
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 1.6)}" fill="url(#g${c.slice(1)})" opacity="0.8"/>` +
        `<path d="M${f(x)} ${f(y - s)}Q${f(x + s * 0.12)} ${f(y - s * 0.12)} ${f(x + s)} ${f(y)}Q${f(x + s * 0.12)} ${f(y + s * 0.12)} ${f(x)} ${f(y + s)}Q${f(x - s * 0.12)} ${f(y + s * 0.12)} ${f(x - s)} ${f(y)}Q${f(x - s * 0.12)} ${f(y - s * 0.12)} ${f(x)} ${f(y - s)}Z" fill="${c}"/>`,
    );
  }
  const grads = [...defs]
    .map(
      (c) =>
        `<radialGradient id="g${c.slice(1)}"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset=".35" stop-color="${c}" stop-opacity=".16"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${grads ? `<defs>${grads}</defs>` : ""}${body.join("")}</svg>`;
}

const tiles = {
  "stars-far": { size: 509, count: 170, rMin: 0.35, rMax: 0.8, oMin: 0.18, oMax: 0.55, seed: 11 },
  "stars-mid-a": { size: 733, count: 64, rMin: 0.6, rMax: 1.15, oMin: 0.45, oMax: 0.85, glow: 6, seed: 23 },
  "stars-mid-b": { size: 811, count: 60, rMin: 0.6, rMax: 1.15, oMin: 0.45, oMax: 0.85, glow: 6, seed: 37 },
  "stars-near-a": { size: 1201, count: 20, rMin: 1, rMax: 1.6, oMin: 0.7, oMax: 1, glow: 12, sparkles: 2, seed: 41 },
  "stars-near-b": { size: 1399, count: 18, rMin: 1, rMax: 1.6, oMin: 0.7, oMax: 1, glow: 10, sparkles: 2, seed: 53 },
};
for (const [name, opts] of Object.entries(tiles)) writeFileSync(`${OUT}/${name}.svg`, starTile(opts));

// ----------------------------------------------------------------------------------------------
// The distant archive: a rotunda of floating, curved shelf tiers seen from inside.
// Tiers above eye level curve up toward the sides; tiers below curve down.
// ----------------------------------------------------------------------------------------------
function archive() {
  const W = 1600;
  const H = 900;
  const cx = W / 2;
  const r = rng(97);
  const out = [];
  const spineColors = ["#18394a", "#1d3352", "#272b55", "#33294f", "#1a4446", "#3a3140", "#213d3a", "#2a3b5e", "#1f2f4f"];

  const tiers = [
    { y0: 120, a: -170, t: 9, h: 46 },
    { y0: 250, a: -120, t: 10, h: 52 },
    { y0: 378, a: -70, t: 11, h: 58 },
    { y0: 640, a: 80, t: 13, h: 64 },
    { y0: 790, a: 150, t: 16, h: 74 },
  ];
  const yAt = (tier, x) => tier.y0 + tier.a * ((x - cx) / cx) ** 2;
  const grow = (x) => 1 + 0.75 * ((x - cx) / cx) ** 2; // nearer (larger) toward the sides

  for (const tier of tiers) {
    // Books along the tier.
    let x = -20;
    while (x < W + 20) {
      const g = grow(x);
      const w = (4 + r() * 6) * g;
      if (r() < 0.06) {
        x += w * 2.5; // a gap on the shelf
        continue;
      }
      const h = tier.h * g * (0.72 + r() * 0.32);
      const base = yAt(tier, x + w / 2);
      const fill = spineColors[Math.floor(r() * spineColors.length)];
      const lean = r() < 0.04 ? ` transform="rotate(${f((r() < 0.5 ? -1 : 1) * (8 + r() * 10))} ${f(x + w / 2)} ${f(base)})"` : "";
      out.push(`<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" fill="${fill}"${lean}/>`);
      if (r() < 0.22) {
        const by = base - h * (0.12 + r() * 0.1);
        out.push(`<rect x="${f(x)}" y="${f(by)}" width="${f(w)}" height="${f(1.1 * g)}" fill="#e8d78b" opacity="${f(0.25 + r() * 0.3)}"/>`);
      }
      x += w + 0.8 * g;
    }
    // The floating plank: a curved band with a softly lit front edge.
    const pts = [];
    for (let px = -40; px <= W + 40; px += 20) pts.push([px, yAt(tier, px)]);
    const top = pts.map(([px, py], i) => `${i ? "L" : "M"}${f(px)} ${f(py)}`).join("");
    const bottom = [...pts]
      .reverse()
      .map(([px, py]) => `L${f(px)} ${f(py + tier.t * grow(px))}`)
      .join("");
    out.push(`<path d="${top}${bottom}Z" fill="url(#plank)"/>`);
    out.push(`<path d="${top}" fill="none" stroke="#83d9d4" stroke-opacity=".38" stroke-width="1.1"/>`);
    const under = pts.map(([px, py], i) => `${i ? "L" : "M"}${f(px)} ${f(py + tier.t * grow(px))}`).join("");
    out.push(`<path d="${under}" fill="none" stroke="#e8d78b" stroke-opacity=".22" stroke-width="1"/>`);
  }

  // Slender columns joining the tiers, wider (nearer) toward the sides.
  for (const u of [-0.94, -0.62, -0.3, 0.3, 0.62, 0.94]) {
    const x = cx + u * cx;
    const g = grow(x);
    const w = 7 * g;
    const y1 = yAt(tiers[0], x) - 60;
    const y2 = yAt(tiers[4], x) + 30;
    out.push(`<rect x="${f(x - w / 2)}" y="${f(y1)}" width="${f(w)}" height="${f(y2 - y1)}" fill="url(#column)"/>`);
    out.push(`<rect x="${f(x - w / 2)}" y="${f(y1)}" width="${f(0.9)}" height="${f(y2 - y1)}" fill="#e8d78b" opacity=".2"/>`);
    // A small lantern hanging from each column.
    const ly = yAt(tiers[2], x) + 70 * g;
    out.push(`<circle cx="${f(x)}" cy="${f(ly)}" r="${f(16 * g)}" fill="url(#lantern)"/>`);
    out.push(`<circle cx="${f(x)}" cy="${f(ly)}" r="${f(1.8 * g)}" fill="#f4e6a8"/>`);
  }

  const defs = `<defs>
<linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f4b55"/><stop offset="1" stop-color="#0f2833"/></linearGradient>
<linearGradient id="column" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#173540"/><stop offset=".45" stop-color="#21505a"/><stop offset="1" stop-color="#10262f"/></linearGradient>
<radialGradient id="lantern"><stop offset="0" stop-color="#f4e6a8" stop-opacity=".55"/><stop offset=".4" stop-color="#e8d78b" stop-opacity=".14"/><stop offset="1" stop-color="#e8d78b" stop-opacity="0"/></radialGradient>
<radialGradient id="fog" cx=".5" cy=".55" r=".62"><stop offset="0" stop-color="#080f23" stop-opacity=".78"/><stop offset=".55" stop-color="#080f23" stop-opacity=".35"/><stop offset="1" stop-color="#080f23" stop-opacity="0"/></radialGradient>
</defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">${defs}${out.join("")}<rect width="${W}" height="${H}" fill="url(#fog)"/></svg>`;
}
writeFileSync(`${OUT}/archive.svg`, archive());

// ----------------------------------------------------------------------------------------------
// The Great Tree: canopy (above the trunk), roots (below it) and the hollow you stand inside.
// ----------------------------------------------------------------------------------------------
function bez(p, t) {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]);
}
function bezTan(p, t) {
  const u = 1 - t;
  return [0, 1].map((k) => 3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k]));
}
const curve = (p) => `M${f(p[0][0])} ${f(p[0][1])}C${p.slice(1).map(([x, y]) => `${f(x)} ${f(y)}`).join(" ")}`;

/** A tapered limb along a cubic Bézier, from width w0 to w1. */
function limb(p, w0, w1, steps = 28) {
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = bez(p, t);
    const [dx, dy] = bezTan(p, t);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  }
  return [...left, ...right.reverse()].map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("") + "Z";
}

const LEAF = ["#173f38", "#1d4d42", "#24594a", "#2c6553", "#3a7a62"];
function leafCluster(r, cx, cy, rad, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * rad;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.7;
    const rx = 7 + r() * 10;
    const glow = r() < 0.035;
    out.push(
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.55)}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})" fill="${glow ? "#83d9d4" : LEAF[Math.floor(r() * LEAF.length)]}" opacity="${glow ? 0.4 : 0.92}"/>`,
    );
  }
  for (let i = 0; i < n / 10; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * rad;
    out.push(`<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d * 0.7)}" r="${f(1 + r() * 1.4)}" fill="#cdeee0" opacity="${f(0.35 + r() * 0.4)}"/>`);
  }
  return out.join("");
}

function lantern(x, y, len, s = 7) {
  return `<path d="M${x} ${y}V${y + len}" stroke="#8a7a5a" stroke-width="1" opacity=".7"/><circle cx="${x}" cy="${y + len + s}" r="${s * 4}" fill="url(#lanternGlow)"/><rect x="${f(x - s * 0.7)}" y="${y + len}" width="${f(s * 1.4)}" height="${f(s * 1.9)}" rx="2" fill="#f4e6a8"/><rect x="${f(x - s * 0.9)}" y="${y + len - 2}" width="${f(s * 1.8)}" height="3" rx="1" fill="#5a4636"/>`;
}

function restingBook(x, y, angle, w, h, color) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})"><rect x="0" y="${-h}" width="${w}" height="${h}" rx="1.5" fill="${color}"/><rect x="0" y="${-h + 4}" width="${w}" height="1.6" fill="#e8d78b" opacity=".75"/><rect x="0" y="-6" width="${w}" height="1.6" fill="#e8d78b" opacity=".75"/><rect x="${w - 2}" y="${-h}" width="2" height="${h}" fill="#000" opacity=".25"/></g>`;
}

function crystalPendant(x, y, len, color) {
  const cy = y + len;
  return `<path d="M${x} ${y}V${cy - 4}" stroke="#8a7a5a" stroke-width=".8" opacity=".6"/><circle cx="${x}" cy="${cy + 9}" r="26" fill="${color}" opacity=".12"/><path d="M${x} ${cy - 4}L${x + 5} ${cy + 4}L${x + 3} ${cy + 18}L${x} ${cy + 24}L${x - 3} ${cy + 18}L${x - 5} ${cy + 4}Z" fill="${color}" opacity=".9"/><path d="M${x} ${cy - 4}L${x + 1.5} ${cy + 10}L${x} ${cy + 24}" stroke="#fff" stroke-width=".7" opacity=".55" fill="none"/>`;
}

function mushroom(x, y, s, color) {
  return `<circle cx="${x}" cy="${f(y - 6 * s)}" r="${f(22 * s)}" fill="url(#mushGlow)"/><rect x="${f(x - 1.6 * s)}" y="${f(y - 9 * s)}" width="${f(3.2 * s)}" height="${f(9 * s)}" rx="1" fill="#e9e1cc"/><path d="M${f(x - 8 * s)} ${f(y - 8 * s)}Q${x} ${f(y - 20 * s)} ${f(x + 8 * s)} ${f(y - 8 * s)}Z" fill="${color}"/><circle cx="${f(x - 2.5 * s)}" cy="${f(y - 12 * s)}" r="${f(1.1 * s)}" fill="#fff" opacity=".7"/>`;
}

const WOOD_DEFS =
  `<linearGradient id="bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#21180f"/><stop offset=".45" stop-color="#3d2d22"/><stop offset=".7" stop-color="#4a372a"/><stop offset="1" stop-color="#1e160f"/></linearGradient>` +
  `<radialGradient id="lanternGlow"><stop offset="0" stop-color="#f4e6a8" stop-opacity=".55"/><stop offset=".35" stop-color="#e8b86a" stop-opacity=".16"/><stop offset="1" stop-color="#e8b86a" stop-opacity="0"/></radialGradient>` +
  `<radialGradient id="mushGlow"><stop offset="0" stop-color="#83d9d4" stop-opacity=".55"/><stop offset="1" stop-color="#83d9d4" stop-opacity="0"/></radialGradient>`;

/** Canopy above the trunk. The trunk's top spans x 145..1055 at the bottom edge (y 300). */
function treeCrown() {
  const r = rng(211);
  const W = 1200;
  const H = 300;
  const limbs = [
    [[[210, 302], [190, 220], [120, 150], [16, 108]], 70, 10],
    [[[330, 302], [330, 220], [300, 120], [250, 40]], 50, 8],
    [[[560, 302], [550, 200], [520, 110], [470, 20]], 46, 7],
    [[[640, 302], [660, 200], [700, 110], [760, 24]], 46, 7],
    [[[870, 302], [880, 220], [920, 130], [960, 50]], 50, 8],
    [[[990, 302], [1010, 220], [1080, 150], [1186, 104]], 70, 10],
    [[[150, 190], [100, 170], [60, 190], [8, 196]], 18, 4],
    [[[1050, 196], [1100, 176], [1140, 194], [1192, 200]], 18, 4],
    [[[300, 150], [360, 110], [400, 100], [430, 70]], 14, 3],
    [[[905, 150], [850, 110], [800, 96], [770, 66]], 14, 3],
  ];
  const clusters = [
    [60, 110, 80, 70], [210, 70, 90, 80], [380, 40, 100, 90], [600, 30, 120, 110], [820, 40, 100, 90],
    [990, 70, 90, 80], [1140, 110, 80, 70], [480, 110, 70, 50], [720, 110, 70, 50], [120, 180, 50, 30], [1080, 184, 50, 30],
  ];
  const out = [`<ellipse cx="600" cy="120" rx="640" ry="150" fill="url(#canopyShade)"/>`];
  // back foliage, the limbs with their grain, then front foliage
  for (const [cx, cy, rad, n] of clusters.slice(0, 7)) out.push(leafCluster(r, cx, cy + 14, rad * 1.05, Math.round(n * 0.4)));
  for (const [p, w0, w1] of limbs) {
    out.push(`<path d="${limb(p, w0, w1)}" fill="url(#bark)"/>`);
    if (w0 >= 40) {
      for (const k of [-0.2, 0.18]) {
        const off = p.map(([x, y], i) => [x + k * w0 * (1 - i / 3.4), y]);
        out.push(`<path d="${curve(off)}" fill="none" stroke="#5a4433" stroke-width="1.2" opacity=".45"/>`);
      }
    }
  }
  for (const [cx, cy, rad, n] of clusters) out.push(leafCluster(r, cx, cy, rad, Math.round(n * 0.75)));
  // books resting on the boughs, lanterns hanging from them, fireflies
  out.push(restingBook(92, 152, -24, 11, 34, "#6b3249"), restingBook(106, 146, -26, 9, 30, "#1b555b"));
  out.push(restingBook(1080, 150, 22, 11, 34, "#393b71"), restingBook(1094, 156, 24, 9, 28, "#7a4b2a"));
  out.push(restingBook(318, 116, -40, 9, 28, "#176d78"));
  out.push(lantern(190, 196, 30), lantern(1010, 200, 36), lantern(452, 120, 24, 6), lantern(760, 112, 30, 6));
  for (const [x, y, len, c] of [[280, 150, 40, "#a89acb"], [600, 120, 56, "#83d9d4"], [930, 156, 38, "#a89acb"], [70, 150, 30, "#83d9d4"], [1140, 160, 28, "#d89ccb"]]) {
    out.push(crystalPendant(x, y, len, c));
  }
  for (let i = 0; i < 26; i++) {
    out.push(`<circle cx="${f(r() * W)}" cy="${f(r() * H * 0.85)}" r="${f(0.8 + r() * 1.6)}" fill="#f4e6a8" opacity="${f(0.4 + r() * 0.5)}"/>`);
  }
  const defs = `<defs>${WOOD_DEFS}<radialGradient id="canopyShade" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#0c1f22" stop-opacity=".9"/><stop offset="1" stop-color="#0c1f22" stop-opacity="0"/></radialGradient></defs>`;
  // Headroom above y=0 so the top leaf clusters keep their round edge.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -60 ${W} ${H + 60}" preserveAspectRatio="xMidYMax meet">${defs}${out.join("")}</svg>`;
}

/** Roots below the trunk. The trunk's bottom spans x 145..1055 at the top edge (y 0). */
function treeRoots() {
  const r = rng(307);
  const W = 1200;
  const H = 170;
  const out = [`<ellipse cx="600" cy="120" rx="620" ry="55" fill="url(#mist)"/>`];
  const roots = [
    [[[160, -4], [120, 60], [60, 90], [0, 120]], 70, 8],
    [[[240, -4], [220, 70], [170, 120], [110, 165]], 54, 6],
    [[[380, -4], [380, 60], [350, 110], [300, 160]], 40, 5],
    [[[560, -4], [560, 50], [540, 100], [520, 150]], 30, 4],
    [[[650, -4], [660, 50], [690, 100], [720, 152]], 30, 4],
    [[[830, -4], [830, 60], [860, 110], [910, 160]], 40, 5],
    [[[960, -4], [980, 70], [1030, 120], [1090, 165]], 54, 6],
    [[[1040, -4], [1080, 60], [1140, 90], [1200, 118]], 70, 8],
  ];
  for (const [p, w0, w1] of roots) out.push(`<path d="${limb(p, w0, w1)}" fill="url(#bark)"/>`);
  out.push(`<path d="M145 -2C150 30 110 40 70 60L1130 60C1090 40 1050 30 1055 -2Z" fill="url(#bark)" opacity=".9"/>`);
  out.push(`<path d="M70 60C300 74 900 74 1130 60" fill="none" stroke="#4f8a6a" stroke-width="2" opacity=".55"/>`);
  for (const [x, y, s] of [[90, 112, 1], [128, 118, 0.7], [330, 150, 0.9], [470, 140, 0.6], [760, 142, 0.7], [900, 150, 1], [1060, 132, 0.8], [1110, 120, 0.6]]) {
    out.push(mushroom(x, y, s, r() < 0.5 ? "#83d9d4" : "#d89ccb"));
  }
  for (let i = 0; i < 16; i++) {
    out.push(`<circle cx="${f(r() * W)}" cy="${f(60 + r() * 100)}" r="${f(0.8 + r() * 1.4)}" fill="#f4e6a8" opacity="${f(0.35 + r() * 0.5)}"/>`);
  }
  const defs = `<defs>${WOOD_DEFS}<radialGradient id="mist" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#83d9d4" stop-opacity=".14"/><stop offset="1" stop-color="#83d9d4" stop-opacity="0"/></radialGradient></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin meet">${defs}${out.join("")}</svg>`;
}

/** The inside of the hollow tree: curved wooden walls, an opening to the sky above, roots below. */
function treeHollow() {
  const r = rng(419);
  const W = 1600;
  const H = 900;
  const out = [];
  const wall = (side) => {
    const m = (x) => (side < 0 ? x : W - x);
    const edge = (g) =>
      `M${f(g(360))} 0C${f(g(300))} 90 ${f(g(258))} 230 ${f(g(255))} 330C${f(g(252))} 430 ${f(g(285))} 470 ${f(g(270))} 560C${f(g(255))} 660 ${f(g(220))} 780 ${f(g(190))} 900`;
    out.push(`<path d="${edge(m)}L${m(0)} 900L${m(0)} 0Z" fill="url(#wall${side < 0 ? "L" : "R"})"/>`);
    for (let i = 1; i <= 9; i++) {
      const k = i / 10;
      out.push(`<path d="${edge((x) => m(x * (1 - k * 0.92)))}" fill="none" stroke="#5a4433" stroke-width="${f(1 + r() * 1.6)}" opacity="${f(0.25 + r() * 0.3)}"/>`);
    }
    out.push(`<path d="${edge(m)}" fill="none" stroke="#e8d78b" stroke-width="1.4" opacity=".25"/>`);
    // small niches carved into the wall, each with a row of books
    for (const [x, y, w, h] of [[150, 250, 70, 80], [120, 470, 80, 90], [140, 680, 70, 76]]) {
      const nx = side < 0 ? x : W - x - w;
      out.push(`<path d="M${nx} ${y + h}V${f(y + h * 0.4)}A${w / 2} ${f(h * 0.4)} 0 0 1 ${nx + w} ${f(y + h * 0.4)}V${y + h}Z" fill="#120d0a"/>`);
      out.push(`<ellipse cx="${nx + w / 2}" cy="${y + h - 8}" rx="${f(w * 0.45)}" ry="${f(h * 0.35)}" fill="url(#lanternGlow)" opacity=".7"/>`);
      let bx = nx + 6;
      while (bx < nx + w - 10) {
        const bw = 5 + r() * 5;
        const bh = h * (0.4 + r() * 0.25);
        const c = ["#6b3249", "#1b555b", "#393b71", "#7a4b2a", "#176d78", "#4e2f5e"][Math.floor(r() * 6)];
        out.push(`<rect x="${f(bx)}" y="${f(y + h - 4 - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${c}"/><rect x="${f(bx)}" y="${f(y + h - 1 - bh)}" width="${f(bw)}" height="1" fill="#e8d78b" opacity=".6"/>`);
        bx += bw + 1;
      }
      out.push(`<rect x="${nx - 3}" y="${y + h - 4}" width="${w + 6}" height="5" rx="2" fill="#4a372a"/><rect x="${nx - 3}" y="${y + h - 4}" width="${w + 6}" height="1.2" fill="#6fae8a" opacity=".6"/>`);
    }
    for (const [x, y] of [[60, 160], [200, 600], [80, 820]]) {
      out.push(`<ellipse cx="${m(x)}" cy="${y}" rx="16" ry="24" fill="#1a120d" opacity=".7"/><ellipse cx="${m(x)}" cy="${y}" rx="24" ry="34" fill="none" stroke="#5a4433" stroke-width="1.4" opacity=".5"/>`);
    }
  };
  wall(-1);
  wall(1);
  // the rim of the opening above, with hanging vines
  out.push(`<path d="M0 0H${W}V70C1350 120 1150 50 800 90C450 50 250 120 0 70Z" fill="#20170f"/>`);
  out.push(`<path d="M0 70C250 120 450 50 800 90C1150 50 1350 120 1600 70" fill="none" stroke="#e8d78b" stroke-width="1.4" opacity=".28"/>`);
  for (const [x, len] of [[150, 240], [235, 170], [320, 110], [1280, 110], [1365, 170], [1450, 250]]) {
    const y0 = 70 + Math.abs(800 - x) / 20;
    const sway = (r() - 0.5) * 40;
    const p = [[x, y0], [x + sway, y0 + len * 0.4], [x - sway, y0 + len * 0.7], [x + sway / 2, y0 + len]];
    out.push(`<path d="${curve(p)}" fill="none" stroke="#2c6553" stroke-width="2.2" opacity=".85"/>`);
    for (let j = 0.15, n = 0; j < 1; j += 0.14, n++) {
      const [lx, ly] = bez(p, j);
      out.push(
        `<ellipse cx="${f(lx + (n % 2 ? 5 : -5))}" cy="${f(ly)}" rx="6" ry="3.2" transform="rotate(${f(r() * 60 - 30)} ${f(lx)} ${f(ly)})" fill="${r() < 0.15 ? "#83d9d4" : "#3a7a62"}" opacity=".9"/>`,
      );
    }
  }
  // No floor here: the tree is planted in ground that scrolls with it. Just let the
  // walls sink into darkness at the bottom.
  out.push(`<rect y="${H - 260}" width="${W}" height="260" fill="url(#deep)"/>`);
  const defs =
    `<defs>${WOOD_DEFS}` +
    `<linearGradient id="wallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140e0a"/><stop offset=".7" stop-color="#2a1f17"/><stop offset="1" stop-color="#3a2b20"/></linearGradient>` +
    `<linearGradient id="wallR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#140e0a"/><stop offset=".7" stop-color="#2a1f17"/><stop offset="1" stop-color="#3a2b20"/></linearGradient>` +
    `<linearGradient id="deep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0806" stop-opacity="0"/><stop offset="1" stop-color="#0b0806" stop-opacity=".85"/></linearGradient></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${defs}${out.join("")}</svg>`;
}

writeFileSync(`${OUT}/tree-crown.svg`, treeCrown());
writeFileSync(`${OUT}/tree-roots.svg`, treeRoots());
writeFileSync(`${OUT}/tree-hollow.svg`, treeHollow());

/** The mossy ground the Great Tree is planted in (scrolls with the tree, full width). */
function treeGround() {
  const r = rng(523);
  const W = 1600;
  const H = 420;
  const out = [];
  const surface = (x) => 150 - Math.sin((x / W) * Math.PI) * 104;
  const top = "M0 150C220 120 420 70 640 52C720 46 760 44 800 44C840 44 880 46 960 52C1180 70 1380 120 1600 150";
  out.push(`<path d="${top}V${H}H0Z" fill="url(#soil)"/>`);
  // strata and root tendrils in the soil
  for (let i = 0; i < 6; i++) {
    const y = 150 + i * 40 + r() * 10;
    out.push(`<path d="M0 ${f(y + 30)}C400 ${f(y - 10)} 1200 ${f(y - 10)} 1600 ${f(y + 30)}" fill="none" stroke="#3a2a1d" stroke-width="${f(1 + r() * 2)}" opacity="${f(0.25 + r() * 0.2)}"/>`);
  }
  for (let i = 0; i < 16; i++) {
    const x = 560 + r() * 480;
    const p = [[x, 60], [x + (r() - 0.5) * 140, 140], [x + (r() - 0.5) * 220, 220], [x + (r() - 0.5) * 300, 300 + r() * 80]];
    out.push(`<path d="${curve(p)}" fill="none" stroke="#2e2117" stroke-width="${f(1.5 + r() * 4)}" stroke-linecap="round" opacity=".8"/>`);
  }
  // the zodiac ring inscribed around the tree's base
  const ring = { cx: 800, cy: 92, rx: 360, ry: 46 };
  out.push(`<ellipse cx="${ring.cx}" cy="${ring.cy}" rx="${ring.rx + 40}" ry="${ring.ry + 18}" fill="url(#ringGlow)"/>`);
  out.push(`<ellipse cx="${ring.cx}" cy="${ring.cy}" rx="${ring.rx}" ry="${ring.ry}" fill="none" stroke="#83d9d4" stroke-width="1.6" opacity=".7"/>`);
  out.push(`<ellipse cx="${ring.cx}" cy="${ring.cy}" rx="${ring.rx - 26}" ry="${ring.ry - 9}" fill="none" stroke="#83d9d4" stroke-width=".8" opacity=".5"/>`);
  ZODIAC.forEach((z, i) => {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const x = ring.cx + Math.cos(a) * (ring.rx - 13);
    const y = ring.cy + Math.sin(a) * (ring.ry - 4.5);
    out.push(`<g color="#83d9d4" opacity="${f(Math.sin(a) > 0 ? 0.95 : 0.55)}" transform="translate(${f(x)} ${f(y)}) scale(1 .5) translate(${f(-x)} ${f(-y)})">${glyph(z.d, x, y, 20, 1.6)}</g>`);
  });
  // moss along the top edge
  out.push(`<path d="${top}" fill="none" stroke="#2f5e4f" stroke-width="14" stroke-linecap="round" opacity=".9"/>`);
  out.push(`<path d="${top}" fill="none" stroke="#5f9f7e" stroke-width="2.5" opacity=".7" transform="translate(0 -6)"/>`);
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = surface(x) - 6 + r() * 10;
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + r() * 2.6)}" fill="${r() < 0.1 ? "#83d9d4" : "#4f8a6a"}" opacity="${f(0.5 + r() * 0.5)}"/>`);
  }
  // runestones carved with glowing glyphs
  for (const [x, h, w, gi] of [[250, 96, 44, 0], [410, 70, 36, 4], [1190, 76, 38, 8], [1350, 100, 46, 10]]) {
    const base = surface(x) + 14;
    out.push(`<ellipse cx="${x}" cy="${f(base)}" rx="${f(w * 0.8)}" ry="8" fill="#000" opacity=".4"/>`);
    out.push(`<path d="M${x - w / 2} ${f(base)}C${f(x - w / 2 - 3)} ${f(base - h * 0.6)} ${f(x - w * 0.3)} ${f(base - h)} ${x} ${f(base - h)}C${f(x + w * 0.32)} ${f(base - h)} ${f(x + w / 2 + 3)} ${f(base - h * 0.6)} ${x + w / 2} ${f(base)}Z" fill="url(#stone)"/>`);
    out.push(`<circle cx="${x}" cy="${f(base - h * 0.5)}" r="${f(w * 0.55)}" fill="url(#runeGlow)"/>`);
    out.push(`<g color="#a8f0ea">${glyph(ZODIAC[gi].d, x, base - h * 0.5, w * 0.5, 2)}</g>`);
    out.push(`<path d="M${f(x - w / 2 + 3)} ${f(base - 6)}Q${x} ${f(base - 14)} ${f(x + w / 2 - 3)} ${f(base - 6)}" fill="none" stroke="#4f8a6a" stroke-width="4" opacity=".8"/>`);
  }
  // crystal clusters
  for (const [x, sc, c] of [[110, 1.2, "#a89acb"], [585, 0.8, "#83d9d4"], [1030, 0.9, "#a89acb"], [1490, 1.1, "#83d9d4"]]) {
    const base = surface(x) + 10;
    out.push(`<circle cx="${x}" cy="${f(base - 22 * sc)}" r="${f(52 * sc)}" fill="${c}" opacity=".12"/>`);
    for (const [dx, hh, ww, rot] of [[0, 46, 12, 0], [-14, 30, 10, -22], [13, 34, 10, 18], [-24, 18, 8, -38], [24, 20, 8, 34]]) {
      const bx = x + dx * sc;
      const ht = hh * sc;
      const wd = ww * sc;
      out.push(`<g transform="rotate(${rot} ${f(bx)} ${f(base)})"><path d="M${f(bx - wd / 2)} ${f(base)}L${f(bx - wd / 2)} ${f(base - ht * 0.7)}L${f(bx)} ${f(base - ht)}L${f(bx + wd / 2)} ${f(base - ht * 0.7)}L${f(bx + wd / 2)} ${f(base)}Z" fill="${c}" opacity=".88"/><path d="M${f(bx)} ${f(base - ht)}L${f(bx)} ${f(base)}" stroke="#fff" stroke-width=".8" opacity=".45"/></g>`);
    }
  }
  for (const [x, sc] of [[180, 1], [340, 0.8], [520, 1.1], [690, 0.7], [910, 0.8], [1100, 1], [1270, 0.75], [1430, 1]]) {
    out.push(mushroom(x, surface(x) + 2, sc * 1.3, r() < 0.5 ? "#83d9d4" : "#d89ccb"));
  }
  for (let i = 0; i < 40; i++) {
    out.push(`<ellipse cx="${f(r() * W)}" cy="${f(190 + r() * 220)}" rx="${f(2 + r() * 5)}" ry="${f(1.5 + r() * 3)}" fill="#3a2b20" opacity="${f(0.4 + r() * 0.4)}"/>`);
  }
  const defs =
    `<defs>${WOOD_DEFS}` +
    `<linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f16"/><stop offset=".45" stop-color="#17110c"/><stop offset="1" stop-color="#0b0806"/></linearGradient>` +
    `<linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a5f66"/><stop offset=".6" stop-color="#3a3e45"/><stop offset="1" stop-color="#23262b"/></linearGradient>` +
    `<radialGradient id="runeGlow"><stop offset="0" stop-color="#83d9d4" stop-opacity=".55"/><stop offset="1" stop-color="#83d9d4" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ringGlow"><stop offset=".7" stop-color="#83d9d4" stop-opacity="0"/><stop offset=".9" stop-color="#83d9d4" stop-opacity=".16"/><stop offset="1" stop-color="#83d9d4" stop-opacity="0"/></radialGradient></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMin slice">${defs}${out.join("")}</svg>`;
}

// ----------------------------------------------------------------------------------------------
// Astrology in the sky: a great natal-chart wheel and the zodiac constellations.
// ----------------------------------------------------------------------------------------------
const pol = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [f(cx + Math.cos(a) * r), f(cy + Math.sin(a) * r)];
};
/** A 24×24 glyph path centred at (x, y), size s, optionally rotated. */
function glyph(d, x, y, s, sw = 1.4, rot = 0) {
  const k = s / 24;
  return `<path d="${d}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(k * 100) / 100}) translate(-12 -12)" fill="none" stroke="currentColor" stroke-width="${f(sw / k)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function constellationAt(c, x, y, size, rot = 0, lineOp = 0.6) {
  const s = size / 100;
  const pts = c.stars.map(([sx, sy]) => [sx - 50, sy - 50]);
  const lines = c.lines.map(([a, b]) => `M${f(pts[a][0] * s)} ${f(pts[a][1] * s)}L${f(pts[b][0] * s)} ${f(pts[b][1] * s)}`).join("");
  const stars = c.stars
    .map(([, , m], i) => {
      const [px, py] = [f(pts[i][0] * s), f(pts[i][1] * s)];
      const r = m === 1 ? 2.6 : m === 2 ? 1.9 : 1.3;
      return (m === 1 ? `<circle cx="${px}" cy="${py}" r="${r * 3}" fill="currentColor" opacity=".18"/>` : "") + `<circle cx="${px}" cy="${py}" r="${r}" fill="currentColor"/>`;
    })
    .join("");
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="${lines}" fill="none" stroke="currentColor" stroke-width="1" opacity="${lineOp}"/>${stars}</g>`;
}

function zodiacSky() {
  const C = 500;
  const out = [];
  out.push(`<circle cx="${C}" cy="${C}" r="496" stroke-width="2.4"/><circle cx="${C}" cy="${C}" r="489" stroke-width="0.8"/>`);
  let tk = "";
  for (let deg = 0; deg < 360; deg += 1) {
    const len = deg % 10 === 0 ? 18 : deg % 5 === 0 ? 11 : 6;
    const [x1, y1] = pol(C, C, 489, deg);
    const [x2, y2] = pol(C, C, 489 - len, deg);
    tk += `M${x1} ${y1}L${x2} ${y2}`;
  }
  out.push(`<path d="${tk}" stroke-width="0.9"/>`);
  out.push(`<circle cx="${C}" cy="${C}" r="466" stroke-width="1.2"/><circle cx="${C}" cy="${C}" r="392" stroke-width="1.4"/><circle cx="${C}" cy="${C}" r="386" stroke-width="0.6"/>`);
  ZODIAC.forEach((z, i) => {
    const start = i * 30;
    const [x1, y1] = pol(C, C, 466, start);
    const [x2, y2] = pol(C, C, 392, start);
    out.push(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke-width="1.2"/>`);
    // glyph and name in the sign band, upright relative to the wheel
    const [gx, gy] = pol(C, C, 440, start + 15);
    out.push(glyph(z.d, gx, gy, 34, 1.8, start + 15));
    const [nx, ny] = pol(C, C, 410, start + 15);
    out.push(`<text x="${nx}" y="${ny}" transform="rotate(${start + 15} ${nx} ${ny})" fill="currentColor" stroke="none" font-family="Georgia, serif" font-size="13" letter-spacing="4" text-anchor="middle" dominant-baseline="central">${z.name.toUpperCase()}</text>`);
    // the sign's constellation drawn in its sector
    const c = CONSTELLATIONS.find((k) => k.key === z.key);
    if (c) {
      const [cx, cy] = pol(C, C, 318, start + 15);
      out.push(constellationAt(c, cx, cy, 92, start + 15, 0.55));
    } else {
      const [sx, sy] = pol(C, C, 318, start + 15);
      out.push(`<path d="M${sx} ${f(Number(sy) - 9)}Q${f(Number(sx) + 1.6)} ${f(Number(sy) - 1.6)} ${f(Number(sx) + 9)} ${sy}Q${f(Number(sx) + 1.6)} ${f(Number(sy) + 1.6)} ${sx} ${f(Number(sy) + 9)}Q${f(Number(sx) - 1.6)} ${f(Number(sy) + 1.6)} ${f(Number(sx) - 9)} ${sy}Q${f(Number(sx) - 1.6)} ${f(Number(sy) - 1.6)} ${sx} ${f(Number(sy) - 9)}Z" fill="currentColor" stroke="none" opacity=".7"/>`);
    }
  });
  // houses with roman numerals
  out.push(`<circle cx="${C}" cy="${C}" r="250" stroke-width="1.2"/><circle cx="${C}" cy="${C}" r="226" stroke-width="0.5"/>`);
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  for (let h = 0; h < 12; h++) {
    const deg = h * 30 + 8;
    const [x1, y1] = pol(C, C, 250, deg);
    const [x2, y2] = pol(C, C, 120, deg);
    out.push(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke-width="0.7" stroke-dasharray="${h % 3 === 0 ? "none" : "4 6"}"/>`);
    const [tx, ty] = pol(C, C, 238, deg + 15);
    out.push(`<text x="${tx}" y="${ty}" fill="currentColor" stroke="none" font-family="Georgia, serif" font-size="11" text-anchor="middle" dominant-baseline="central">${roman[h]}</text>`);
  }
  // planets and the aspects between them
  const placed = [[0, 18], [1, 104], [2, 41], [3, 158], [4, 226], [5, 287], [6, 330]];
  const ap = placed.map(([, deg]) => pol(C, C, 120, deg));
  for (const [i, deg] of placed) {
    const [px, py] = pol(C, C, 190, deg);
    out.push(`<circle cx="${px}" cy="${py}" r="17" stroke-width="0.8"/>`);
    out.push(glyph(PLANETS[i].d, px, py, 20, 1.5));
    const [lx, ly] = pol(C, C, 172, deg);
    const [mx, my] = pol(C, C, 126, deg);
    out.push(`<path d="M${lx} ${ly}L${mx} ${my}" stroke-width="0.5" stroke-dasharray="2 4"/>`);
  }
  out.push(`<circle cx="${C}" cy="${C}" r="120" stroke-width="1"/>`);
  const asp = [[0, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [0, 5], [3, 5]];
  out.push(`<path d="${asp.map(([a, b]) => `M${ap[a][0]} ${ap[a][1]}L${ap[b][0]} ${ap[b][1]}`).join("")}" stroke-width="0.8"/>`);
  ap.forEach(([x, y]) => out.push(`<circle cx="${x}" cy="${y}" r="2.4" fill="currentColor" stroke="none"/>`));
  // radiant centre
  let rays = "";
  for (let i = 0; i < 24; i++) {
    const [x1, y1] = pol(C, C, 26, i * 15);
    const [x2, y2] = pol(C, C, i % 2 ? 40 : 56, i * 15);
    rays += `M${x1} ${y1}L${x2} ${y2}`;
  }
  out.push(`<path d="${rays}" stroke-width="0.9"/><circle cx="${C}" cy="${C}" r="22" stroke-width="1.2"/>`);
  out.push(glyph(PLANETS[0].d, C, C, 30, 1.8));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" color="#e8d78b" fill="none" stroke="currentColor">${out.join("")}</svg>`;
}

/** The zodiac constellations across the sky, with a dotted ecliptic carrying the planets. */
function constellationSky() {
  const W = 1600;
  const H = 900;
  const out = [];
  // ecliptic: a gentle arc across the sky
  const ecl = [[-40, 330], [420, 150], [1180, 150], [1640, 330]];
  out.push(`<path d="M${ecl[0]}C${ecl[1]} ${ecl[2]} ${ecl[3]}" stroke="#83d9d4" stroke-width="1.2" stroke-dasharray="2 9" opacity=".55" fill="none"/>`);
  PLANETS.slice(2).forEach((p, i) => {
    const t = 0.12 + i * 0.19;
    const [x, y] = bez(ecl, t);
    out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="11" fill="#080f23" stroke="#83d9d4" stroke-width=".8" opacity=".9"/>`);
    out.push(`<g color="#83d9d4">${glyph(p.d, x, y, 13, 1.3)}</g>`);
  });
  const spots = [
    ["aries", 70, 470, 120, -8],
    ["taurus", 170, 690, 150, 6],
    ["gemini", 1430, 470, 140, -4],
    ["cancer", 1520, 690, 110, 10],
    ["leo", 300, 80, 150, 0],
    ["libra", 1290, 60, 110, 6],
    ["scorpio", 60, 230, 140, 12],
    ["sagittarius", 1470, 250, 140, -10],
    ["capricorn", 800, 820, 150, 0],
    ["pisces", 520, 760, 130, -6],
  ];
  for (const [key, x, y, size, rot] of spots) {
    const c = CONSTELLATIONS.find((k) => k.key === key);
    const z = ZODIAC.find((k) => k.key === key);
    out.push(`<g color="#f0ebdd">${constellationAt(c, x, y, size, rot, 0.45)}</g>`);
    out.push(`<g color="#e8d78b" opacity=".75">${glyph(z.d, x, y + size * 0.62, 16, 1.4)}</g>`);
    out.push(`<text x="${x}" y="${f(y + size * 0.62 + 18)}" fill="#e8d78b" opacity=".55" font-family="Georgia, serif" font-size="10" letter-spacing="3" text-anchor="middle">${z.name.toUpperCase()}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${out.join("")}</svg>`;
}

writeFileSync(`${OUT}/zodiac-wheel.svg`, zodiacSky());
writeFileSync(`${OUT}/tree-ground.svg`, treeGround());
writeFileSync(`${OUT}/constellations.svg`, constellationSky());

console.log("Wrote", Object.keys(tiles).length + 7, "files to", OUT);
