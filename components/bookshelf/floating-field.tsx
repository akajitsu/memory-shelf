import type { CSSProperties, ReactNode } from "react";
import { seeded } from "@/lib/random";
import { PLANETS, ZODIAC } from "@/lib/astro-glyphs.mjs";
import { GlyphAt } from "@/components/astro/astro";
import shelf from "./bookshelf.module.css";
import styles from "./floating.module.css";

/** Trig differs in the last digit between server and browser; round so hydration matches. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A slowly turning ring of runes and constellations, seen low under the books. */
function MagicCircle() {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const long = i % 6 === 0;
    return (
      <line
        key={i}
        x1={r2(200 + Math.cos(a) * 186)}
        y1={r2(200 + Math.sin(a) * 186)}
        x2={r2(200 + Math.cos(a) * (long ? 172 : 179))}
        y2={r2(200 + Math.sin(a) * (long ? 172 : 179))}
        strokeWidth={long ? 1.6 : 0.8}
      />
    );
  });
  const star = Array.from({ length: 7 }, (_, i) => {
    const a = (i * 3 * Math.PI * 2) / 7 - Math.PI / 2;
    return `${r2(200 + Math.cos(a) * 120)},${r2(200 + Math.sin(a) * 120)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 400 400" className={styles.circle} aria-hidden fill="none" stroke="#e8d78b">
      <defs>
        <radialGradient id="mc-glow">
          <stop offset="0" stopColor="#83d9d4" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#83d9d4" stopOpacity="0.06" />
          <stop offset="1" stopColor="#83d9d4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="196" fill="url(#mc-glow)" stroke="none" />
      <circle cx="200" cy="200" r="192" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="200" cy="200" r="186" strokeOpacity="0.3" />
      <g strokeOpacity="0.45">{ticks}</g>
      <circle cx="200" cy="200" r="160" stroke="#83d9d4" strokeOpacity="0.4" strokeWidth="1.2" />
      {ZODIAC.map((z, i) => {
        const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
        return (
          <g key={z.key} color="#e8d78b" opacity="0.8">
            <GlyphAt d={z.d} x={r2(200 + Math.cos(a) * 146)} y={r2(200 + Math.sin(a) * 146)} size={17} width={1.2} />
          </g>
        );
      })}
      {PLANETS.map((p, i) => {
        const a = (i / PLANETS.length) * Math.PI * 2;
        return (
          <g key={p.key} color="#83d9d4" opacity="0.7">
            <GlyphAt d={p.d} x={r2(200 + Math.cos(a) * 96)} y={r2(200 + Math.sin(a) * 96)} size={12} width={1} />
          </g>
        );
      })}
      <g className={styles.circleInner}>
        <circle cx="200" cy="200" r="128" strokeOpacity="0.35" />
        <polygon points={star} stroke="#83d9d4" strokeOpacity="0.45" strokeWidth="1.2" />
        <circle cx="200" cy="200" r="64" strokeOpacity="0.4" />
        <circle cx="200" cy="200" r="24" strokeOpacity="0.5" />
      </g>
    </svg>
  );
}

const RISING = (() => {
  const r = seeded(43);
  return Array.from({ length: 10 }, (_, i) => ({
    d: ZODIAC[(i * 5) % 12].d,
    v: {
      "--x": `${(14 + r() * 72).toFixed(1)}%`,
      "--s": `${(14 + r() * 10).toFixed(0)}px`,
      "--c": r() < 0.6 ? "#e8d78b" : "#83d9d4",
      "--d": `${(7 + r() * 6).toFixed(1)}s`,
      "--delay": `${(-r() * 12).toFixed(1)}s`,
      "--sway": `${((r() - 0.5) * 80).toFixed(0)}px`,
    } as CSSProperties,
  }));
})();

const TWINKLES = (() => {
  const r = seeded(77);
  return Array.from({ length: 12 }, () => ({
    "--x": `${(4 + r() * 92).toFixed(1)}%`,
    "--y": `${(4 + r() * 80).toFixed(1)}%`,
    "--s": `${(8 + r() * 10).toFixed(0)}px`,
    "--c": r() < 0.6 ? "#e8d78b" : "#83d9d4",
    "--d": `${(3 + r() * 4).toFixed(1)}s`,
    "--delay": `${(-r() * 6).toFixed(1)}s`,
  })) as CSSProperties[];
})();

/**
 * The Floating library: no shelves, every book drifting on its own above a magic
 * circle. Children are book slots (a list).
 */
export function FloatingField({
  children,
  label,
  dimmed = false,
  perch,
}: {
  children?: ReactNode;
  label: string;
  dimmed?: boolean;
  perch?: ReactNode;
}) {
  return (
    <section className={shelf.field} aria-label={label}>
      <span className={styles.glow} aria-hidden />
      <div className={styles.circleWrap} aria-hidden>
        <MagicCircle />
      </div>
      {TWINKLES.map((v, i) => (
        <svg key={i} viewBox="0 0 24 24" className={styles.twinkle} style={v} aria-hidden>
          <path d="M12 2Q13.8 10.2 22 12Q13.8 13.8 12 22Q10.2 13.8 2 12Q10.2 10.2 12 2Z" fill="currentColor" />
        </svg>
      ))}
      {RISING.map((g, i) => (
        <svg key={`g${i}`} viewBox="0 0 24 24" className={styles.rising} style={g.v} aria-hidden>
          <path d={g.d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ))}
      <div className={`${shelf.fieldList} ${dimmed ? shelf.dimmed : ""}`} role="list">
        {children}
      </div>
      {perch && <div className={styles.perch}>{perch}</div>}
    </section>
  );
}
