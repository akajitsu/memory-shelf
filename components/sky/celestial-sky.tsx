"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useParallax } from "@/lib/parallax";
import { seeded } from "@/lib/random";
import { ConstellationTracer } from "./constellation-tracer";
import styles from "./celestial-sky.module.css";

const MOTE_COLORS = ["#e8d78b", "#83d9d4", "#f0ebdd", "#a89acb"];

/** Rising motes of light. Seeded, so server and client render the same markup. */
const MOTES = (() => {
  const r = seeded(7);
  return Array.from({ length: 16 }, () => ({
    "--x": `${(r() * 100).toFixed(2)}%`,
    "--s": `${(6 + r() * 9).toFixed(1)}px`,
    "--c": MOTE_COLORS[Math.floor(r() * MOTE_COLORS.length)],
    "--o": (0.35 + r() * 0.45).toFixed(2),
    "--d": `${(26 + r() * 30).toFixed(1)}s`,
    "--delay": `${(-r() * 50).toFixed(1)}s`,
    "--sway": `${((r() - 0.5) * 70).toFixed(0)}px`,
  })) as CSSProperties[];
})();

/** Larger stars that flare and turn now and then. Seeded positions. */
const FLARES = (() => {
  const r = seeded(29);
  return Array.from({ length: 7 }, () => ({
    "--x": `${(3 + r() * 94).toFixed(1)}%`,
    "--y": `${(6 + r() * 84).toFixed(1)}%`,
    "--s": `${(14 + r() * 14).toFixed(0)}px`,
    "--d": `${(7 + r() * 7).toFixed(1)}s`,
    "--delay": `${(-r() * 14).toFixed(1)}s`,
  })) as CSSProperties[];
})();

/** An occasional shooting star, every 5–12 s while the tab is visible. */
function ShootingStars() {
  const [star, setStar] = useState<{ key: number; style: CSSProperties } | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer = 0;
    let n = 0;
    const schedule = (first = false) => {
      timer = window.setTimeout(
        () => {
          if (!document.hidden) {
            setStar({
              key: ++n,
              style: {
                "--sx": `${8 + Math.random() * 70}%`,
                "--sy": `${4 + Math.random() * 38}%`,
                "--angle": `${18 + Math.random() * 22}deg`,
              } as CSSProperties,
            });
          }
          schedule();
        },
        (first ? 2.5 : 5 + Math.random() * 7) * 1000,
      );
    };
    schedule(true);
    return () => window.clearTimeout(timer);
  }, []);

  return star ? <span key={star.key} className={styles.shooting} style={star.style} /> : null;
}

/** Marks the document while hidden so CSS can pause the sky. */
function useHiddenFlag() {
  useEffect(() => {
    const sync = () => {
      if (document.hidden) document.documentElement.dataset.hidden = "";
      else delete document.documentElement.dataset.hidden;
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
}

/**
 * The night sky: gradient base, drifting nebulae, four layers of stars at different
 * depths (two pairs twinkling out of phase), rising motes and shooting stars.
 * Decorative only (aria-hidden, no pointer events).
 */
export function CelestialSky({ motes = true, shooting = true }: { motes?: boolean; shooting?: boolean }) {
  useHiddenFlag();
  const far = useParallax(0.12);
  const mid = useParallax(0.28);
  const near = useParallax(0.5);
  const neb = useParallax(0.08);
  const chart = useParallax(0.05);
  const figures = useParallax(0.2);

  return (
    <div className={styles.sky} aria-hidden>
      <div className={styles.base} />
      <div ref={neb} className="absolute inset-0">
        <span className={`${styles.nebula} ${styles.n1}`} />
        <span className={`${styles.nebula} ${styles.n2}`} />
        <span className={`${styles.nebula} ${styles.n3}`} />
        <span className={`${styles.nebula} ${styles.n4}`} />
      </div>
      {/* A great natal chart turning slowly behind everything. Art: scripts/generate-sky.mjs */}
      <div ref={chart} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sky/zodiac-wheel.svg" alt="" className={styles.zodiac} decoding="async" fetchPriority="low" />
      </div>
      <div ref={far} className="absolute inset-0">
        <div className={`${styles.stars} ${styles.far}`} />
      </div>
      <div ref={mid} className="absolute inset-0">
        <div className={`${styles.stars} ${styles.midA}`} />
        <div className={`${styles.stars} ${styles.midB}`} />
      </div>
      {/* The zodiac constellations and the ecliptic with its wandering planets. */}
      <div ref={figures} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sky/constellations.svg" alt="" className={styles.constellations} decoding="async" fetchPriority="low" />
      </div>
      <div ref={near} className="absolute inset-0">
        <div className={`${styles.stars} ${styles.nearA}`} />
        <div className={`${styles.stars} ${styles.nearB}`} />
        {FLARES.map((v, i) => (
          <span key={i} className={styles.flare} style={v} />
        ))}
      </div>
      {/* Ribbons of aurora rippling along the top of the sky. */}
      <div className={styles.aurora}>
        <span className={styles.ribbonA} />
        <span className={styles.ribbonB} />
      </div>
      <ConstellationTracer />
      {motes && (
        <div className={styles.motes}>
          {MOTES.map((style, i) => (
            <span key={i} className={styles.mote} style={style} />
          ))}
        </div>
      )}
      {shooting && <ShootingStars />}
    </div>
  );
}

/** Rendered by a page to quiet the sky while it is shown (e.g. an open album). */
export function SkyMood({ mood }: { mood: "calm" }) {
  useEffect(() => {
    document.documentElement.dataset.skyMood = mood;
    return () => {
      delete document.documentElement.dataset.skyMood;
    };
  }, [mood]);
  return null;
}
