import { PHOTOS_PER_PAGE } from "@/lib/constants";
import type { AlbumPhotoView } from "@/types/app";

export type PageLayout = "single" | "stack" | "offset";

export type AlbumPage =
  | { kind: "title" }
  | { kind: "photos"; photos: AlbumPhotoView[]; layout: PageLayout; number: number }
  | { kind: "empty" }
  | { kind: "end" };

/**
 * Lay photos out into pages: a title page first, then PHOTOS_PER_PAGE photos per
 * page with a layout chosen deterministically by page number, so the album looks
 * composed rather than gridded and stays identical between sessions.
 */
export function buildPages(photos: AlbumPhotoView[]): AlbumPage[] {
  const pages: AlbumPage[] = [{ kind: "title" }];
  if (photos.length === 0) {
    pages.push({ kind: "empty" });
    return pages;
  }
  for (let i = 0, n = 1; i < photos.length; i += PHOTOS_PER_PAGE, n++) {
    const chunk = photos.slice(i, i + PHOTOS_PER_PAGE);
    const layout: PageLayout = chunk.length === 1 ? "single" : n % 2 === 1 ? "stack" : "offset";
    pages.push({ kind: "photos", photos: chunk, layout, number: n });
  }
  pages.push({ kind: "end" });
  return pages;
}

/** Group pages into facing spreads (left, right). A trailing odd page gets a blank partner. */
export function toSpreads(pages: AlbumPage[]): [AlbumPage, AlbumPage | null][] {
  const spreads: [AlbumPage, AlbumPage | null][] = [];
  for (let i = 0; i < pages.length; i += 2) spreads.push([pages[i], pages[i + 1] ?? null]);
  return spreads;
}

/** Small, stable tilt per photo for a hand-placed look (degrees). */
export function tiltFor(id: string, strength = 1.6): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 2 * strength;
}
