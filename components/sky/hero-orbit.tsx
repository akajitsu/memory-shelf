import type { CSSProperties } from "react";
import { PLANETS } from "@/lib/astro-glyphs.mjs";
import { ZodiacWheel } from "@/components/astro/astro";
import styles from "./hero-orbit.module.css";

/**
 * The start page's centrepiece: a great zodiac wheel turning slowly behind the
 * title, the seven planets orbiting it on their own (counter-rotating) ring, and a
 * soft pulse of light at its heart. Decorative only.
 */
export function HeroOrbit({ size = "large" }: { size?: "large" | "small" }) {
  return (
    <div className={`${styles.orbit} ${size === "small" ? styles.small : ""}`} aria-hidden>
      <span className={styles.heart} />
      <ZodiacWheel className={styles.wheel} />
      <div className={styles.ring}>
        {PLANETS.map((p, i) => (
          <span key={p.key} className={styles.planet} style={{ "--a": `${(i / PLANETS.length) * 360}deg` } as CSSProperties}>
            <svg viewBox="0 0 24 24">
              <path d={p.d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
