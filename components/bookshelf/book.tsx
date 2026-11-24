"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import type { ShelfAlbum } from "@/types/app";
import { bookDimensions, driftFor, floatFor } from "@/lib/bookshelf";
import { BookCover, bookVars, PatternLayer } from "@/components/books/book-cover";
import { SpineGlyph } from "@/components/books/ornaments";
import { Glyph, signForTitle, zodiacGlyph } from "@/components/astro/astro";
import { cn } from "@/lib/utils";
import styles from "./bookshelf.module.css";

export function Book({
  album,
  index = 0,
  opening = false,
  onOpen,
  onIntent,
}: {
  album: ShelfAlbum;
  index?: number;
  opening?: boolean;
  /** Called on a plain click; return true if the click was handled (animated open). */
  onOpen?: (album: ShelfAlbum) => boolean;
  /** Hover/focus intent, used to prefetch the album. */
  onIntent?: (album: ShelfAlbum) => void;
}) {
  const { thickness, height, depth } = bookDimensions(album.id, album.photoCount);
  const float = floatFor(album.id);
  const drift = driftFor(album.id);
  const label = `${album.title}, ${album.photoCount} ${album.photoCount === 1 ? "photo" : "photos"}`;

  const vars = {
    "--t": thickness,
    "--h": height,
    "--d": depth,
    ...bookVars(album.coverColor),
  } as CSSProperties;

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (new tab, etc.) behave normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (onOpen?.(album)) e.preventDefault();
  }

  return (
    <div
      className={cn(styles.slot, opening && styles.opening)}
      role="listitem"
      style={
        {
          "--i": index,
          "--period": `${float.period.toFixed(2)}s`,
          "--delay": `${float.delay.toFixed(2)}s`,
          "--lift": float.lift.toFixed(1),
          // Used only by the Floating library style.
          "--tilt": `${drift.tilt.toFixed(1)}deg`,
          "--turn": `${drift.turn.toFixed(1)}deg`,
          "--offset": drift.offset,
          "--sway": `${drift.sway.toFixed(1)}deg`,
        } as CSSProperties
      }
    >
      <div className={styles.float}>
        <span className={styles.halo} aria-hidden />
        <Link
          href={`/albums/${album.id}`}
          className={styles.link}
          aria-label={`Open album: ${label}`}
          title={album.title}
          onClick={onClick}
          onPointerEnter={() => onIntent?.(album)}
          onFocus={() => onIntent?.(album)}
        >
          <div className={styles.book} style={vars}>
            {/* Spine — faces the viewer */}
            <div className={`${styles.face} ${styles.spine}`}>
              <PatternLayer pattern={album.coverPattern} className={styles.spinePattern} scale={0.6} />
              <span className={styles.band} style={{ top: "5%" }} />
              <span className={styles.band} style={{ top: "7.5%" }} />
              <SpineGlyph design={album.coverDesign} className={styles.glyph} />
              <span className={styles.title}>
                <span>{album.title}</span>
              </span>
              <Glyph d={zodiacGlyph(signForTitle(album.title))} className={styles.signGlyph} width={1.8} />
              <span className={styles.band} style={{ bottom: "13%" }} />
              <span className={styles.count} aria-hidden>
                {album.photoCount}
              </span>
              <span className={styles.band} style={{ bottom: "4.5%" }} />
              <span className={styles.band} style={{ bottom: "2%" }} />
            </div>

            {/* Front cover — revealed when the book is pulled out. Designed, never a photo. */}
            <div className={`${styles.face} ${styles.cover}`} aria-hidden>
              <BookCover
                fill
                patternScale={0.6}
                look={{ title: album.title, color: album.coverColor, design: album.coverDesign, pattern: album.coverPattern }}
              />
            </div>

            {/* Page block */}
            <div className={`${styles.face} ${styles.top}`} aria-hidden />
          </div>
        </Link>
      </div>
      <span className={styles.shadow} aria-hidden />
    </div>
  );
}
