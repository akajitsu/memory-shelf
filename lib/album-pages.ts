import type { AlbumPhotoView } from "@/types/app";

/**
 * single    — one photograph, given the whole page
 * stack     — two prints, one above the other
 * offset    — two prints, overlapping corners
 * scrapbook — three taped prints, loosely arranged
 */
export type PageLayout = "single" | "stack" | "offset" | "scrapbook";

export type AlbumPage =
  | { kind: "title" }
  | { kind: "photos"; photos: AlbumPhotoView[]; layout: PageLayout; number: number }
  | { kind: "empty" }
  | { kind: "end" };

/** The rhythm of the album: pages cycle through these, so spreads feel composed. */
const CYCLE: { count: number; layout: PageLayout }[] = [
  { count: 2, layout: "stack" },
  { count: 3, layout: "scrapbook" },
  { count: 1, layout: "single" },
  { count: 2, layout: "offset" },
];

function layoutFor(count: number, planned: PageLayout): PageLayout {
  if (count === 1) return "single";
  if (count === 2) return planned === "offset" ? "offset" : "stack";
  return "scrapbook";
}

/**
 * Lay photos out into pages: a title page first, then photo pages following the
 * cycle above (deterministic, so the album looks identical between sessions),
 * then a closing page.
 */
export function buildPages(photos: AlbumPhotoView[]): AlbumPage[] {
  const pages: AlbumPage[] = [{ kind: "title" }];
  if (photos.length === 0) {
    pages.push({ kind: "empty" });
    return pages;
  }
  for (let i = 0, n = 1; i < photos.length; n++) {
    const plan = CYCLE[(n - 1) % CYCLE.length];
    const chunk = photos.slice(i, i + plan.count);
    pages.push({ kind: "photos", photos: chunk, layout: layoutFor(chunk.length, plan.layout), number: n });
    i += chunk.length;
  }
  pages.push({ kind: "end" });
  return pages;
}

/** Small, stable tilt per photo for a hand-placed look (degrees). */
export function tiltFor(id: string, strength = 1.6): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 2 * strength;
}
