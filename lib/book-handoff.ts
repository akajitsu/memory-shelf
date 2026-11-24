"use client";

import type { BookDesign, BookPattern } from "@/lib/book-design";

/**
 * Hand-off between the bookshelf and the album page. When a book is taken off
 * the shelf, its look is stored here so the album's loading state can show the
 * very same closed book (color, design, pattern, title) — the real album then
 * replaces it pixel-for-pixel and the cover opens without any visual jump.
 */
export type BookHandoff = {
  id: string;
  title: string;
  coverColor: string;
  coverDesign: BookDesign;
  coverPattern: BookPattern;
};

let current: BookHandoff | null = null;

export function setBookHandoff(h: BookHandoff | null) {
  current = h;
}

export function peekBookHandoff(): BookHandoff | null {
  return current;
}
