import { Bookcase } from "./bookcase";
import styles from "./bookshelf.module.css";

const GHOSTS = [46, 58, 40, 64, 50, 44];

/** Loading state: the empty bookcase with faint silhouettes of books. */
export function LibrarySkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 pt-8 pb-16 sm:px-6 sm:pt-12" aria-busy="true">
      <div className="mb-8 space-y-3 px-1">
        <div className="h-11 w-64 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-4 w-40 animate-pulse rounded bg-white/[0.04]" />
      </div>
      <Bookcase label="Loading your bookshelf">
        {GHOSTS.map((w, i) => (
          <div key={i} className={styles.slot} role="listitem">
            <div
              className="animate-pulse rounded-[2px] bg-white/[0.05]"
              style={{ width: `calc(${w}px * var(--scale))`, height: `calc(${210 + (i % 3) * 12}px * var(--scale))` }}
            />
          </div>
        ))}
      </Bookcase>
      <span className="sr-only">Opening your library…</span>
    </div>
  );
}
