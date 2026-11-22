"use client";

import { Check, Palette } from "lucide-react";
import { COVER_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CoverColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const isCustom = !COVER_COLORS.some((c) => c.value.toLowerCase() === value.toLowerCase());

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">Leather color</legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Leather color">
        {COVER_COLORS.map((c) => {
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
                "relative flex size-10 cursor-pointer items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25),0_2px_4px_rgb(0_0_0/0.2)] transition-transform hover:scale-105",
                selected && "ring-2 ring-gold ring-offset-2 ring-offset-ivory",
              )}
              style={{ backgroundColor: c.value }}
            >
              {selected && <Check className="size-4 text-gold-soft" aria-hidden />}
            </button>
          );
        })}
        <label
          className={cn(
            "relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-muted/50 bg-ivory text-muted transition-transform hover:scale-105",
            isCustom && "border-solid ring-2 ring-gold ring-offset-2 ring-offset-ivory",
          )}
          title="Custom color"
          style={isCustom ? { backgroundColor: value } : undefined}
        >
          <Palette className={cn("size-4", isCustom && "text-gold-soft")} aria-hidden />
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
