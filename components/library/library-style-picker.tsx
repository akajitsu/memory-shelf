"use client";

import { useRef, type KeyboardEvent } from "react";
import { Moon, Sparkles, TreeDeciduous } from "lucide-react";
import { LIBRARY_STYLES, LIBRARY_STYLE_INFO, type LibraryStyle } from "@/lib/library-style";
import { cn } from "@/lib/utils";

const ICONS = { moonlit: Moon, floating: Sparkles, tree: TreeDeciduous } as const;

/** Choose how the library looks. A radio group: arrow keys move between styles. */
export function LibraryStylePicker({ value, onChange }: { value: LibraryStyle; onChange: (s: LibraryStyle) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + LIBRARY_STYLES.length) % LIBRARY_STYLES.length;
    onChange(LIBRARY_STYLES[next]);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Library style"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-ivory/12 bg-abyss/55 p-1 shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)]"
    >
      {LIBRARY_STYLES.map((s, i) => {
        const Icon = ICONS[s];
        const selected = s === value;
        return (
          <button
            key={s}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={LIBRARY_STYLE_INFO[s].name}
            title={`${LIBRARY_STYLE_INFO[s].name} — ${LIBRARY_STYLE_INFO[s].description}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(s)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-300",
              selected
                ? "bg-moon/[0.14] text-moon shadow-[inset_0_0_0_1px_rgb(232_215_139/0.45),0_0_16px_-6px_rgb(232_215_139/0.6)]"
                : "text-silver/80 hover:bg-white/[0.05] hover:text-aurora",
            )}
          >
            <Icon className="size-4" aria-hidden />
            <span className="max-sm:sr-only">{LIBRARY_STYLE_INFO[s].short}</span>
          </button>
        );
      })}
    </div>
  );
}
