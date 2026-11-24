import type { CSSProperties } from "react";
import { CONSTELLATIONS, ZODIAC } from "@/lib/astro-glyphs.mjs";
import styles from "./constellation-tracer.module.css";

/** Where each constellation is drawn (percent of the viewport), clear of the page's centre column. */
const SPOTS: { sign: string; x: string; y: string; size: number; small?: boolean }[] = [
  { sign: "leo", x: "3%", y: "16%", size: 150, small: true },
  { sign: "gemini", x: "86%", y: "20%", size: 130 },
  { sign: "scorpio", x: "4%", y: "62%", size: 160 },
  { sign: "sagittarius", x: "84%", y: "64%", size: 150, small: true },
  { sign: "taurus", x: "44%", y: "84%", size: 150 },
];
const CYCLE = 30; // seconds for the whole sequence; one constellation every CYCLE / SPOTS.length

/**
 * Constellations drawing themselves one after another: the lines trace in, the stars
 * light up in turn, the sign's glyph appears, then the figure fades. Pure CSS.
 */
export function ConstellationTracer() {
  return (
    <div className={styles.tracer} aria-hidden>
      {SPOTS.map((spot, k) => {
        const c = CONSTELLATIONS.find((x) => x.key === spot.sign)!;
        const z = ZODIAC.find((x) => x.key === spot.sign)!;
        const delay = (k * CYCLE) / SPOTS.length;
        return (
          <svg
            key={spot.sign}
            viewBox="-6 -6 112 132"
            className={`${styles.figure} ${spot.small ? "" : styles.wideOnly}`}
            style={{ left: spot.x, top: spot.y, width: spot.size, "--delay": `${delay}s`, "--cycle": `${CYCLE}s` } as CSSProperties}
          >
            <path
              className={styles.lines}
              pathLength={1}
              d={c.lines.map(([a, b]) => `M${c.stars[a][0]} ${c.stars[a][1]}L${c.stars[b][0]} ${c.stars[b][1]}`).join("")}
            />
            {c.stars.map(([x, y, m], i) => (
              <g key={i} className={styles.star} style={{ "--i": i } as CSSProperties}>
                {m === 1 && <circle cx={x} cy={y} r="6" className={styles.halo} />}
                <circle cx={x} cy={y} r={m === 1 ? 2.6 : m === 2 ? 1.9 : 1.3} />
              </g>
            ))}
            <g className={styles.label}>
              <path d={z.d} transform="translate(41 104) scale(.75)" />
              <text x="50" y="128">
                {z.name.toUpperCase()}
              </text>
            </g>
          </svg>
        );
      })}
    </div>
  );
}
