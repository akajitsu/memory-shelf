/**
 * Gilt ornaments tooled into book covers and spines. All use currentColor
 * (the foil) and scale with their box.
 */
import type { BookDesign } from "@/lib/book-design";

type P = { className?: string };

/** Trig differs in the last digit between server and browser; round so hydration matches. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Four-pointed sparkle star. */
export function Sparkle({ className, cx = 12, cy = 12, s = 10 }: P & { cx?: number; cy?: number; s?: number }) {
  const q = s * 0.16;
  return (
    <path
      className={className}
      d={`M${cx} ${cy - s}Q${cx + q} ${cy - q} ${cx + s} ${cy}Q${cx + q} ${cy + q} ${cx} ${cy + s}Q${cx - q} ${cy + q} ${cx - s} ${cy}Q${cx - q} ${cy - q} ${cx} ${cy - s}Z`}
      fill="currentColor"
    />
  );
}

/** Corner fleuron for the classic binding (drawn for the top-left corner). */
export function Fleuron({ className }: P) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M4 4c10 0 16 4 18 12M4 4c0 10 4 16 12 18" />
      <path d="M4 4l9 9" />
      <path d="M13 13c3-6 9-7 12-4c-4 0-7 1-9 5M13 13c-6 3-7 9-4 12c0-4 1-7 5-9" />
      <circle cx="4" cy="4" r="2.2" fill="currentColor" stroke="none" />
      <circle cx="26" cy="9" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="9" cy="26" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Small horizontal divider: line · diamond · line. */
export function Divider({ className, star = false }: P & { star?: boolean }) {
  return (
    <svg viewBox="0 0 100 12" className={className} aria-hidden>
      <path d="M2 6h38M60 6h38" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      {star ? (
        <Sparkle cx={50} cy={6} s={5.5} />
      ) : (
        <path d="M50 1l5 5-5 5-5-5Z" fill="currentColor" />
      )}
      <circle cx="40" cy="6" r="1.2" fill="currentColor" />
      <circle cx="60" cy="6" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Crescent moon with stars — the celestial binding's emblem. */
export function MoonEmblem({ className }: P) {
  return (
    <svg viewBox="0 0 100 70" className={className} aria-hidden>
      <path d="M58 8a27 27 0 1 0 14 47A22 22 0 1 1 58 8Z" fill="currentColor" />
      <Sparkle cx={80} cy={16} s={7} />
      <Sparkle cx={22} cy={20} s={4.5} />
      <Sparkle cx={88} cy={44} s={3.5} />
      <circle cx="16" cy="48" r="1.6" fill="currentColor" />
      <circle cx="72" cy="66" r="1.3" fill="currentColor" />
    </svg>
  );
}

/** A short constellation line used beneath titles. */
export function Constellation({ className }: P) {
  return (
    <svg viewBox="0 0 120 24" className={className} aria-hidden>
      <path d="M6 16L30 6L54 14L78 4L102 12L114 20" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
      {[
        [6, 16, 2],
        [30, 6, 2.6],
        [54, 14, 2],
        [78, 4, 2.8],
        [102, 12, 2],
        [114, 20, 1.6],
      ].map(([x, y, r]) => (
        <circle key={x} cx={x} cy={y} r={r} fill="currentColor" />
      ))}
    </svg>
  );
}

/** Astrolabe rings with ticks and a central star. */
export function Astrolabe({ className }: P) {
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const long = i % 4 === 0;
    const r1 = 44;
    const rIn = long ? 38 : 41;
    return (
      <line
        key={i}
        x1={r2(50 + Math.cos(a) * r1)}
        y1={r2(50 + Math.sin(a) * r1)}
        x2={r2(50 + Math.cos(a) * rIn)}
        y2={r2(50 + Math.sin(a) * rIn)}
        stroke="currentColor"
        strokeWidth={long ? 1.1 : 0.7}
      />
    );
  });
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="47" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="44" strokeWidth="0.7" />
      {ticks}
      <circle cx="50" cy="50" r="30" strokeWidth="0.9" />
      <ellipse cx="50" cy="56" rx="30" ry="18" strokeWidth="0.8" opacity="0.8" />
      <path d="M20 50h60M50 20v60" strokeWidth="0.6" opacity="0.6" />
      <circle cx="50" cy="50" r="12" strokeWidth="0.8" />
      <Sparkle cx={50} cy={50} s={9} />
      <circle cx="66" cy="34" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="31" cy="62" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="72" cy="60" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Arched window frame (stretches to its box; strokes stay hairline). */
export function ArchFrame({ className }: P) {
  return (
    <svg viewBox="0 0 100 140" preserveAspectRatio="none" className={className} aria-hidden fill="none" stroke="currentColor">
      <path d="M4 138V50A46 46 0 0 1 96 50V138Z" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <path d="M10 132V52A40 40 0 0 1 90 52V132Z" strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.75" />
    </svg>
  );
}

/** Radiant keystone star for the top of the arch. */
export function Keystone({ className }: P) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI + (i / 8) * Math.PI;
        return (
          <line
            key={i}
            x1={r2(30 + Math.cos(a) * 9)}
            y1={r2(30 + Math.sin(a) * 9)}
            x2={r2(30 + Math.cos(a) * (i % 2 ? 16 : 22))}
            y2={r2(30 + Math.sin(a) * (i % 2 ? 16 : 22))}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.8"
          />
        );
      })}
      <Sparkle cx={30} cy={30} s={7} />
    </svg>
  );
}

/** Tiny emblem for a spine, one per binding. */
export function SpineGlyph({ design, className }: P & { design: BookDesign }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinecap="round">
      {design === "classic" && (
        <>
          <circle cx="12" cy="12" r="10" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="6" strokeWidth="1" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" strokeWidth="1" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </>
      )}
      {design === "celestial" && <path d="M14 3.5a9 9 0 1 0 6.5 14.6A7.4 7.4 0 1 1 14 3.5Z" fill="currentColor" stroke="none" />}
      {design === "arch" && (
        <>
          <path d="M5 21V11a7 7 0 0 1 14 0v10" strokeWidth="1.8" />
          <path d="M9 17l3-5l3 3" strokeWidth="1" />
          <circle cx="9" cy="17" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15" cy="15" r="1" fill="currentColor" stroke="none" />
        </>
      )}
      {design === "astrolabe" && (
        <>
          <circle cx="12" cy="13" r="9" strokeWidth="1.6" />
          <circle cx="12" cy="11.5" r="4.6" strokeWidth="0.9" />
          <path d="M5.5 19.5L18.5 6.5" strokeWidth="1.4" />
          <circle cx="12" cy="2.4" r="1.6" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}
