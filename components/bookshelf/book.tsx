"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import type { ShelfAlbum } from "@/types/app";
import { bookDimensions, foilFor } from "@/lib/bookshelf";
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
  const foil = foilFor(album.coverColor);
  const label = `${album.title}, ${album.photoCount} ${album.photoCount === 1 ? "photo" : "photos"}`;

  const vars = {
    "--t": thickness,
    "--h": height,
    "--d": depth,
    "--leather": album.coverColor,
    "--foil": foil.text,
    "--band": foil.band,
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
      style={{ "--i": index } as CSSProperties}
    >
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
            <span className={styles.band} style={{ top: "6%" }} />
            <span className={styles.band} style={{ top: "9%" }} />
            <span className={styles.title}>{album.title}</span>
            <span className={styles.band} style={{ bottom: "12%" }} />
            <span className={styles.count} aria-hidden>
              {album.photoCount}
            </span>
            <span className={styles.band} style={{ bottom: "4%" }} />
          </div>

          {/* Front cover — revealed when the book is pulled out */}
          <div className={`${styles.face} ${styles.cover}`} aria-hidden>
            {album.coverUrl ? (
              <div className={styles.coverFrame}>
                {/* Signed, expiring URL from private storage — not routed through next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={album.coverUrl} alt="" loading="lazy" decoding="async" draggable={false} />
              </div>
            ) : (
              <div className={styles.coverFrame} style={{ aspectRatio: "auto", flex: "0 0 30%" }} />
            )}
            <span className={styles.coverTitle}>{album.title}</span>
          </div>

          {/* Page block */}
          <div className={`${styles.face} ${styles.top}`} aria-hidden />
        </div>
      </Link>
      <span className={styles.shadow} aria-hidden />
    </div>
  );
}
