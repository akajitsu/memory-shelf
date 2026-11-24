"use client";

import { Check } from "lucide-react";
import {
  BOOK_DESIGNS,
  BOOK_PATTERNS,
  DESIGN_INFO,
  PATTERN_INFO,
  type BookDesign,
  type BookPattern,
} from "@/lib/book-design";
import { BookCover, bookVars, PatternLayer } from "@/components/books/book-cover";
import { cn } from "@/lib/utils";

/** Four binding styles, each shown as a small cover in the chosen leather. */
export function DesignPicker({
  value,
  color,
  pattern,
  onChange,
}: {
  value: BookDesign;
  color: string;
  pattern: BookPattern;
  onChange: (d: BookDesign) => void;
}) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-[13px] font-semibold tracking-wide text-silver">Binding</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Binding">
        {BOOK_DESIGNS.map((d) => {
          const selected = d === value;
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${DESIGN_INFO[d].name}: ${DESIGN_INFO[d].description}`}
              onClick={() => onChange(d)}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-2.5 pb-2 text-center transition-[border-color,background-color,box-shadow]",
                selected
                  ? "border-moon/60 bg-moon/[0.07] shadow-[0_0_24px_-10px_rgb(232_215_139/0.7)]"
                  : "border-ivory/10 bg-abyss/40 hover:border-aurora/40 hover:bg-aurora/[0.05]",
              )}
            >
              <div className="w-full max-w-[96px] transition-transform duration-300 group-hover:-translate-y-0.5">
                <BookCover look={{ title: "", color, design: d, pattern }} patternScale={0.5} showTitle={false} />
              </div>
              <span className={cn("text-[12.5px] font-semibold", selected ? "text-moon" : "text-silver")}>{DESIGN_INFO[d].name}</span>
              {selected && (
                <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-moon text-abyss">
                  <Check className="size-3" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Tooled patterns, each previewed on a swatch of the chosen leather. */
export function PatternPicker({
  value,
  color,
  onChange,
}: {
  value: BookPattern;
  color: string;
  onChange: (p: BookPattern) => void;
}) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="text-[13px] font-semibold tracking-wide text-silver">Tooling</legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Tooled pattern">
        {BOOK_PATTERNS.map((p) => {
          const selected = p === value;
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={PATTERN_INFO[p].name}
              title={PATTERN_INFO[p].name}
              onClick={() => onChange(p)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-1 transition-colors",
                selected ? "text-moon" : "text-silver/80 hover:text-ivory",
              )}
            >
              <span
                className={cn(
                  "relative block size-14 overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.35)]",
                  selected && "ring-2 ring-moon ring-offset-2 ring-offset-cosmos",
                )}
                style={{ ...bookVars(color), backgroundColor: color }}
              >
                <PatternLayer pattern={p} scale={0.55} className="!opacity-45" />
                {p === "none" && (
                  <span className="absolute inset-0 bg-[linear-gradient(155deg,rgb(255_255_255/0.14),transparent_45%,rgb(0_0_0/0.25))]" />
                )}
              </span>
              <span className="text-[11px] font-medium">{PATTERN_INFO[p].name}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
