"use client";

import { useCallback } from "react";

/**
 * Pointer parallax for decorative layers. One shared listener and one rAF loop
 * (running only while the pointer moves) shift every registered layer through the
 * CSS `translate` property, so it composes with any `transform` animation the
 * layer already has. Disabled for touch screens and reduced motion.
 */
type Layer = { el: HTMLElement; depth: number };

const layers = new Set<Layer>();
const target = { x: 0, y: 0 };
const current = { x: 0, y: 0 };
let raf = 0;
let listening = false;

function apply() {
  for (const { el, depth } of layers) {
    el.style.translate = `${(current.x * depth * 28).toFixed(2)}px ${(current.y * depth * 18).toFixed(2)}px`;
  }
}

function tick() {
  current.x += (target.x - current.x) * 0.055;
  current.y += (target.y - current.y) * 0.055;
  apply();
  if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.0015) raf = requestAnimationFrame(tick);
  else raf = 0;
}

function onMove(e: PointerEvent) {
  if (e.pointerType !== "mouse") return;
  target.x = (e.clientX / window.innerWidth) * 2 - 1;
  target.y = (e.clientY / window.innerHeight) * 2 - 1;
  if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
}

function enabled() {
  return (
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Register an element to drift with the pointer. Larger depth = nearer = moves more. */
export function registerParallax(el: HTMLElement, depth: number): () => void {
  const layer = { el, depth };
  layers.add(layer);
  if (!listening && enabled()) {
    listening = true;
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  apply();
  return () => {
    layers.delete(layer);
    el.style.translate = "";
    if (layers.size === 0 && listening) {
      listening = false;
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/** Stable ref callback for a parallax layer: `<div ref={useParallax(0.4)} />`. */
export function useParallax(depth: number) {
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      return registerParallax(el, depth);
    },
    [depth],
  );
}
