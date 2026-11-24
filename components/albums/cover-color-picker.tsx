"use client";

import { Check, Palette } from "lucide-react";
import { BOOK_COLORS, foilFor } from "@/lib/book-design";
import { cn } from "@/lib/utils";

/** Leather swatches plus a custom color. */
export function CoverColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const isCustom = !BOOK_COLORS.some((c) => c.value.toLowerCase() === value.toLowerCase());
  const ring = "ring-2 ring-moon ring-offset-2 ring-offset-cosmos";

  return (
    <fieldset className="space-y-2.5">
      <legend className="text-[13px] font-semibold tracking-wide text-silver">Leather</legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Leather color">
        {BOOK_COLORS.map((c) => {
          const selected = c.value.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c.name}
              title={c.name}
              onClick={() => onChange(c.value)}
              className={cn(
                "relative flex size-10 cursor-pointer items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.3),inset_0_2px_3px_rgb(255_255_255/0.12),0_2px_6px_rgb(0_0_0/0.35)] transition-transform hover:scale-105",
                selected && ring,
              )}
              style={{ backgroundColor: c.value }}
            >
              {selected && <Check className="size-4" style={{ color: foilFor(c.value).text }} aria-hidden />}
            </button>
          );
        })}
        <label
          className={cn(
            "relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-silver/40 bg-abyss/50 text-silver transition-transform hover:scale-105",
            isCustom && cn("border-solid", ring),
          )}
          title="Custom color"
          style={isCustom ? { backgroundColor: value } : undefined}
        >
          <Palette className="size-4" style={isCustom ? { color: foilFor(value).text } : undefined} aria-hidden />
          <span className="sr-only">Custom color</span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </fieldset>
  );
}
