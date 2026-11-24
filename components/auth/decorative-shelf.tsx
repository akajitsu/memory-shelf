import type { CSSProperties } from "react";
import { MoonMark } from "@/components/layout/brand";

/** A small floating shelf of books for the welcome screens — decorative only. */
const SPINES = [
  { h: 86, w: 34, c: "#6b3249", t: "Summer" },
  { h: 96, w: 40, c: "#1b555b", t: "Our Wedding" },
  { h: 78, w: 30, c: "#393b71", t: "Kyoto" },
  { h: 92, w: 36, c: "#1f2b57", t: "First Year" },
  { h: 72, w: 28, c: "#7a4b2a", t: "Grandma" },
  { h: 98, w: 42, c: "#4e2f5e", t: "Family" },
  { h: 84, w: 32, c: "#176d78", t: "Road Trip" },
];

export function DecorativeShelf() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm select-none">
      <div className="pointer-events-none absolute inset-x-[-20%] -top-16 bottom-[-40%] bg-[radial-gradient(ellipse_at_50%_60%,rgb(232_215_139/0.14),transparent_65%)]" />
      <MoonMark className="absolute -top-12 left-1/2 size-10 -translate-x-1/2 animate-[float-soft_6s_var(--ease-float)_infinite_alternate] drop-shadow-[0_0_12px_rgb(232_215_139/0.6)]" />
      <div className="relative flex items-end justify-center gap-[4px] px-6">
        {SPINES.map((s, i) => (
          <div
            key={s.t}
            className="relative flex items-center justify-center overflow-hidden rounded-[3px]"
            style={
              {
                height: `${s.h * 2}px`,
                width: `${s.w}px`,
                backgroundColor: s.c,
                transform: i === 4 ? "rotate(-6deg) translateX(-4px)" : undefined,
                transformOrigin: "bottom left",
                boxShadow:
                  "inset 3px 0 4px rgb(255 255 255 / 0.1), inset -4px 0 6px rgb(0 0 0 / 0.4), 0 6px 14px -4px rgb(2 6 18 / 0.7)",
                animation: i === 4 ? undefined : `float-soft ${5 + (i % 3)}s var(--ease-float) ${-i * 0.7}s infinite alternate`,
              } as CSSProperties
            }
          >
            <span className="absolute inset-x-0 top-3 h-[2px] bg-moon/70" />
            <span className="absolute inset-x-0 top-[16px] h-px bg-moon/50" />
            <span className="absolute inset-x-0 bottom-4 h-[2px] bg-moon/70" />
            <span
              className="font-display text-[10px] tracking-wider whitespace-nowrap text-moon/90"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {s.t}
            </span>
          </div>
        ))}
      </div>
      {/* Floating plank with a lit edge */}
      <div className="relative mt-1.5 h-3.5 rounded-[3px] bg-gradient-to-b from-[#245b64] to-[#0e2a33] shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_18px_30px_-8px_rgb(23_109_120/0.55)]">
        <div className="absolute inset-x-0 top-0 h-px rounded-t-[2px] bg-aurora/70" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-moon/40" />
      </div>
      <div className="mx-auto mt-2 h-6 w-3/4 rounded-full bg-[radial-gradient(ellipse,rgb(131_217_212/0.18),transparent_70%)]" />
    </div>
  );
}
