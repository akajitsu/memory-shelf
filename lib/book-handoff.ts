"use client";

/**
 * Hand-off between the bookshelf and the album page. When a book is taken off
 * the shelf, its look is stored here so the album's loading state can show the
 * very same closed book (color, title, cover) — the real album then replaces it
 * pixel-for-pixel and the cover opens without any visual jump.
 */
export type BookHandoff = { id: string; title: string; coverColor: string; coverUrl: string | null };

let current: BookHandoff | null = null;

export function setBookHandoff(h: BookHandoff | null) {
  current = h;
}

export function peekBookHandoff(): BookHandoff | null {
  return current;
}
