"use client";

import type { CSSProperties, ReactNode } from "react";
import { useParallax } from "@/lib/parallax";
import type { LibraryStyle } from "@/lib/library-style";
import { seeded } from "@/lib/random";
import { OpenTome, Tome } from "./tomes";
import styles from "./library-scene.module.css";

type V = CSSProperties & Record<`--${string}`, string | number>;

const TOMES: { v: V; color: string; emblem?: "star" | "moon"; spin?: boolean; glow?: boolean; small?: boolean }[] = [
  { v: { "--x": "2.5vw", "--y": "34vh", "--w": "74px", "--r": "-12deg", "--period": "8.5s", "--in": "300ms" }, color: "#1b555b", glow: true },
  { v: { "--x": "9vw", "--y": "70vh", "--w": "46px", "--r": "14deg", "--period": "7s", "--delay": "-3s", "--in": "500ms", "--o": 0.75 }, color: "#393b71", emblem: "moon", spin: true, small: true },
  { v: { "--x": "47vw", "--y": "7vh", "--w": "26px", "--r": "-20deg", "--period": "10s", "--delay": "-5s", "--in": "700ms", "--o": 0.45 }, color: "#4e2f5e", small: true },
  { v: { "--x": "calc(100vw - 92px)", "--y": "66vh", "--w": "62px", "--r": "9deg", "--period": "9.5s", "--delay": "-2s", "--in": "600ms" }, color: "#6b3249", emblem: "moon", glow: true, small: true },
  { v: { "--x": "calc(100vw - 64px)", "--y": "16vh", "--w": "34px", "--r": "-16deg", "--period": "7.5s", "--delay": "-4s", "--in": "800ms", "--o": 0.7 }, color: "#176d78", spin: true, small: true },
];

const SYMBOLS = ["✦", "☾", "✧", "⋆", "☽", "✶"];
const symbols = (() => {
  const r = seeded(31);
  return Array.from({ length: 7 }, (_, i) => ({
    ch: SYMBOLS[i % SYMBOLS.length],
    v: {
      "--x": `${i % 2 ? 90 + r() * 7 : 1 + r() * 8}vw`,
      "--y": `${8 + r() * 80}vh`,
      "--size": `${12 + r() * 14}px`,
      "--c": r() < 0.5 ? "#e8d78b" : "#83d9d4",
      "--o": (0.2 + r() * 0.25).toFixed(2),
      "--period": `${9 + r() * 7}s`,
      "--delay": `${-r() * 10}s`,
      "--in": `${800 + i * 250}ms`,
    } as V,
  }));
})();

const lanterns: V[] = [
  { "--x": "22vw", "--y": "26vh", "--s": "38px", "--period": "4.5s", "--delay": "-1s" },
  { "--x": "78vw", "--y": "14vh", "--s": "30px", "--period": "5.5s", "--delay": "-3s" },
  { "--x": "88vw", "--y": "42vh", "--s": "44px", "--period": "6s", "--delay": "-2s" },
];

const sparks = (() => {
  const r = seeded(5);
  return Array.from({ length: 7 }, () => ({
    "--sx": `${38 + r() * 24}%`,
    "--ss": `${3 + r() * 4}px`,
    "--sd": `${3.5 + r() * 3}s`,
    "--sdelay": `${-r() * 6}s`,
    "--sdx": `${(r() - 0.5) * 50}px`,
  })) as V[];
})();

function Depth({ depth, children, className }: { depth: number; children: ReactNode; className?: string }) {
  return (
    <div ref={useParallax(depth)} className={`${styles.layer} ${className ?? ""}`}>
      {children}
    </div>
  );
}

const FIREFLIES = (() => {
  const r = seeded(13);
  return Array.from({ length: 16 }, () => ({
    "--x": `${(r() * 100).toFixed(1)}vw`,
    "--y": `${(18 + r() * 74).toFixed(1)}vh`,
    "--dx": `${((r() - 0.5) * 120).toFixed(0)}px`,
    "--dy": `${((r() - 0.5) * 90).toFixed(0)}px`,
    "--d": `${(7 + r() * 8).toFixed(1)}s`,
    "--delay": `${(-r() * 12).toFixed(1)}s`,
    "--s": `${(3 + r() * 3).toFixed(1)}px`,
  })) as V[];
})();

const LEAVES = (() => {
  const r = seeded(61);
  const colors = ["#3a7a62", "#2c6553", "#83d9d4", "#5f9f7e", "#a89acb"];
  return Array.from({ length: 12 }, () => ({
    "--x": `${(r() * 100).toFixed(1)}vw`,
    "--s": `${(9 + r() * 9).toFixed(0)}px`,
    "--c": colors[Math.floor(r() * colors.length)],
    "--d": `${(14 + r() * 12).toFixed(1)}s`,
    "--delay": `${(-r() * 26).toFixed(1)}s`,
    "--sway": `${((r() - 0.5) * 140).toFixed(0)}px`,
  })) as V[];
})();

/** Inside the hollow of the Great Tree: wooden walls, vines, falling leaves, fireflies. */
function TreeHollow({ sleeper }: { sleeper?: ReactNode }) {
  return (
    <>
      <Depth depth={0.12}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sky/tree-hollow.svg" alt="" className={styles.hollow} decoding="async" fetchPriority="low" />
      </Depth>
      {/* Shafts of moonlight falling through the opening above. */}
      <div className={styles.shafts}>
        <span className={styles.shaft} style={{ "--l": "30vw", "--w": "170px", "--r": "16deg", "--d": "9s" } as V} />
        <span className={styles.shaft} style={{ "--l": "48vw", "--w": "120px", "--r": "11deg", "--d": "12s", "--delay": "-4s" } as V} />
        <span className={styles.shaft} style={{ "--l": "63vw", "--w": "210px", "--r": "20deg", "--d": "15s", "--delay": "-8s" } as V} />
      </div>
      <Depth depth={0.4}>
        {FIREFLIES.map((v, i) => (
          <span key={i} className={styles.firefly} style={v} />
        ))}
        {LEAVES.map((v, i) => (
          <span key={`l${i}`} className={styles.leaf} style={v} />
        ))}
      </Depth>
      {sleeper && (
        <Depth depth={0.6} className={styles.hideSmall}>
          <div className={styles.rootSleeper}>{sleeper}</div>
        </Depth>
      )}
    </>
  );
}

/**
 * The world around the books, per library style:
 * - moonlit: a distant rotunda of floating shelves, drifting tomes, an open book
 *   spilling light, faint symbols and lanterns;
 * - floating: the same open sky without architecture — only books in the air;
 * - tree: the inside of a great hollow tree.
 * `sleeper` is a resting cat; `children` join the nearest layer.
 */
export function LibraryScene({
  children,
  sleeper,
  variant = "moonlit",
}: {
  children?: ReactNode;
  sleeper?: ReactNode;
  variant?: LibraryStyle;
}) {
  if (variant === "tree") {
    return (
      <div className={styles.scene} aria-hidden data-variant={variant}>
        <TreeHollow sleeper={sleeper} />
        {children}
      </div>
    );
  }
  return (
    <div className={styles.scene} aria-hidden data-variant={variant}>
      {variant === "moonlit" && (
        <Depth depth={0.18}>
          {/* Static artwork generated by scripts/generate-sky.mjs */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sky/archive.svg" alt="" className={styles.archive} decoding="async" fetchPriority="low" />
        </Depth>
      )}

      <Depth depth={0.3} className={styles.hideSmall}>
        {lanterns.map((v, i) => (
          <span key={i} className={styles.lantern} style={v} />
        ))}
        {symbols.map((s, i) => (
          <span key={i} className={styles.symbol} style={s.v}>
            {s.ch}
          </span>
        ))}
        <div className={styles.wanderer}>
          <Tome color="#2a3b5e" />
        </div>
      </Depth>

      {/* In the right margin beside the shelf, clear of the heading and search. */}
      <Depth depth={0.55} className={styles.wideOnly}>
        <div className={styles.openBook} style={{ "--x": "calc(100vw - 176px)", "--y": "38vh", "--w": "156px" } as V}>
          <span className={styles.light} />
          {sparks.map((v, i) => (
            <span key={i} className={styles.spark} style={v} />
          ))}
          <OpenTome />
        </div>
      </Depth>

      <Depth depth={0.8} className={styles.hideSmall}>
        {TOMES.map((t, i) => (
          <div
            key={i}
            className={`${styles.tome} ${t.spin ? styles.spin : ""} ${t.glow ? styles.glowTome : ""} ${t.small ? styles.hideSmall : ""}`}
            style={t.v}
          >
            <Tome color={t.color} emblem={t.emblem} />
            {i === 0 && sleeper}
          </div>
        ))}
        {children}
      </Depth>
    </div>
  );
}
