/** Static illustrative shelf for the auth screens — pure CSS, no interactivity. */
const SPINES = [
  { h: 86, w: 34, c: "#6b2a2a", t: "Summer" },
  { h: 94, w: 40, c: "#7a4b2a", t: "Our Wedding" },
  { h: 78, w: 30, c: "#2f4a3a", t: "Kyoto" },
  { h: 90, w: 36, c: "#28344d", t: "First Year" },
  { h: 70, w: 28, c: "#8c6a2f", t: "Grandma" },
  { h: 96, w: 42, c: "#4d2f45", t: "Family" },
  { h: 82, w: 32, c: "#5a4030", t: "Road Trip" },
];

export function DecorativeShelf() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm select-none">
      <div className="flex items-end justify-center gap-[3px] px-6">
        {SPINES.map((s, i) => (
          <div
            key={s.t}
            className="relative flex items-center justify-center overflow-hidden rounded-[3px]"
            style={{
              height: `${s.h * 2}px`,
              width: `${s.w}px`,
              backgroundColor: s.c,
              transform: i === 4 ? "rotate(-6deg) translateX(-4px)" : undefined,
              transformOrigin: "bottom left",
              boxShadow:
                "inset 3px 0 4px rgb(255 255 255 / 0.08), inset -4px 0 6px rgb(0 0 0 / 0.35), 0 6px 10px -4px rgb(0 0 0 / 0.6)",
            }}
          >
            <span className="absolute inset-x-0 top-3 h-[3px] bg-gold/70" />
            <span className="absolute inset-x-0 top-[18px] h-px bg-gold/50" />
            <span className="absolute inset-x-0 bottom-4 h-[3px] bg-gold/70" />
            <span
              className="font-serif text-[11px] tracking-wider whitespace-nowrap text-gold-soft/90"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {s.t}
            </span>
          </div>
        ))}
      </div>
      {/* Plank */}
      <div className="relative h-4 rounded-[2px] bg-[#4a3222] shadow-[0_10px_18px_-6px_rgb(0_0_0/0.7)]">
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[2px] bg-[#6a4a33]" />
      </div>
    </div>
  );
}
