const GHOSTS = [46, 58, 40, 64, 50, 44, 54];

/** Loading state that suits every library style: faint books waiting in the dark. */
export function LibrarySkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 pt-6 pb-24 sm:px-6 sm:pt-10" aria-busy="true">
      <div className="mb-10 space-y-3 px-1">
        <div className="h-3 w-32 animate-pulse rounded-full bg-aurora/10" />
        <div className="h-12 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-52 animate-pulse rounded-full bg-white/[0.04]" />
      </div>
      <div className="flex min-h-[420px] flex-wrap items-end justify-center gap-3 pt-16 sm:gap-4">
        {GHOSTS.map((w, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[3px] bg-aurora/[0.06] shadow-[0_0_30px_-10px_rgb(131_217_212/0.25)]"
            style={{ width: `${w * 0.85}px`, height: `${(210 + (i % 3) * 14) * 0.85}px`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Opening your library…</span>
    </div>
  );
}
