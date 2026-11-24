"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { CAT_VARIANTS, SittingCat, SleepingCat, WalkingCat, type CatLook } from "./cat-art";
import styles from "./cats.module.css";

function pickLook(exclude?: CatLook): CatLook {
  const pool = CAT_VARIANTS.filter((v) => v.look !== exclude);
  return pool[Math.floor(Math.random() * pool.length)].look;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Chooses something random once, after mount. Server render and hydration see
 * `null`, so random choices never cause a hydration mismatch.
 */
function useMountRandom<T>(pick: () => T): T | null {
  const [value, setValue] = useState<T | null>(null);
  const pickRef = useRef(pick);
  useEffect(() => {
    // Deferred so it isn't a synchronous state update inside the effect body.
    const id = requestAnimationFrame(() => setValue(pickRef.current()));
    return () => cancelAnimationFrame(id);
  }, []);
  return value;
}

/**
 * A cat sitting on top of the bookcase — present on most visits, on either side.
 * `inline` drops the bookcase positioning, for containers that place it themselves.
 */
export function PerchedCat({ chance = 0.8, inline = false }: { chance?: number; inline?: boolean }) {
  const cat = useMountRandom(() => (Math.random() < chance ? { look: pickLook(), left: Math.random() < 0.5 } : null));
  if (!cat) return null;
  return (
    <div className={inline ? styles.perchInline : cn(styles.perch, cat.left ? styles.perchLeft : styles.perchRight)} aria-hidden>
      <SittingCat look={cat.look} />
    </div>
  );
}

/** A cat asleep on a floating book (rendered inside that book, so it drifts with it). */
export function SleepingTomeCat({ chance = 0.75 }: { chance?: number }) {
  const look = useMountRandom(() => (Math.random() < chance ? pickLook() : null));
  if (!look) return null;
  return (
    <div className={styles.sleeper} aria-hidden>
      <SleepingCat look={look} />
    </div>
  );
}

/** Sometimes a cat sits beside an open album. Positioned by the book's binding. */
export function AlbumCompanion({ chance = 0.65 }: { chance?: number }) {
  const look = useMountRandom(() => (Math.random() < chance ? pickLook() : null));
  if (!look) return null;
  return (
    <div className={styles.companion} aria-hidden>
      <SittingCat look={look} />
    </div>
  );
}

type Walk = { key: number; look: CatLook; dir: 1 | -1; pause: boolean };

/**
 * Every so often a cat strolls along the bottom of the screen, sometimes stopping
 * halfway to look around. Not while an album is open, the tab is hidden, or the
 * reader prefers reduced motion. Never takes pointer events.
 */
export function CatWalker({ firstDelay = [10, 18], every = [45, 90] }: { firstDelay?: [number, number]; every?: [number, number] }) {
  const [walk, setWalk] = useState<Walk | null>(null);
  const lastLook = useRef<CatLook | undefined>(undefined);
  const range = useRef({ firstDelay, every });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer = 0;
    let n = 0;
    const between = ([a, b]: [number, number]) => (a + Math.random() * (b - a)) * 1000;
    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        const calm = document.documentElement.dataset.skyMood === "calm";
        if (!document.hidden && !calm) {
          const look = pickLook(lastLook.current);
          lastLook.current = look;
          setWalk({ key: ++n, look, dir: Math.random() < 0.5 ? 1 : -1, pause: Math.random() < 0.6 });
        }
        schedule(between(range.current.every));
      }, delay);
    };
    schedule(between(range.current.firstDelay));
    return () => window.clearTimeout(timer);
  }, []);

  if (!walk) return null;
  return <Stroll key={walk.key} walk={walk} onDone={() => setWalk(null)} />;
}

const SPEED = 70; // px per second

function Stroll({ walk, onDone }: { walk: Walk; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);
  const done = useRef(onDone);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = window.innerWidth;
    const size = el.offsetWidth;
    const from = walk.dir === 1 ? -size - 20 : w + 20;
    const to = walk.dir === 1 ? w + 20 : -size - 20;
    const mid = from + (to - from) * (0.35 + Math.random() * 0.3);
    const timers: number[] = [];
    const moveTo = (x: number, fromX: number) => {
      const seconds = Math.abs(x - fromX) / SPEED;
      el.style.transition = `transform ${seconds}s linear`;
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      return seconds * 1000;
    };

    el.style.transition = "none";
    el.style.transform = `translate3d(${from}px, 0, 0)`;
    // Let the start position paint before walking off.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!walk.pause) {
          timers.push(window.setTimeout(() => done.current(), moveTo(to, from) + 200));
          return;
        }
        timers.push(
          window.setTimeout(() => {
            setStill(true);
            timers.push(
              window.setTimeout(() => {
                setStill(false);
                timers.push(window.setTimeout(() => done.current(), moveTo(to, mid) + 200));
              }, 2600),
            );
          }, moveTo(mid, from)),
        );
      }),
    );
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [walk]);

  return (
    <div ref={ref} className={styles.walker} data-dir={walk.dir} aria-hidden style={{ transform: "translate3d(-200px,0,0)" } as CSSProperties}>
      <div className={styles.flip}>
        <WalkingCat look={walk.look} still={still} />
      </div>
    </div>
  );
}
