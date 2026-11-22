"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { BOOK_OPEN, NAV_FORWARD } from "@/components/layout/page-transition";
import { Plus, Search, X } from "lucide-react";
import type { ShelfAlbum } from "@/types/app";
import { FlashToast } from "@/components/ui/flash-toast";
import { setBookHandoff } from "@/lib/book-handoff";
import { playSound } from "@/lib/sound";
import { Bookcase } from "./bookcase";
import { Book } from "./book";
import { NewAlbumBook } from "./new-album-book";

export function LibraryView({ albums, notice }: { albums: ShelfAlbum[]; notice?: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** Take the book off the shelf, then open it. Returns false to use a plain navigation. */
  function openBook(album: ShelfAlbum) {
    if (reduceMotion || openingId) return !!openingId;
    setOpeningId(album.id);
    playSound("shelfSlide");
    // The album page's loading state draws this exact book while its data loads.
    setBookHandoff({ id: album.id, title: album.title, coverColor: album.coverColor, coverUrl: album.coverUrl });
    const href = `/albums/${album.id}`;
    router.prefetch(href);
    timers.current.push(
      // Navigate as the book finishes lifting; data loads while the page fades over.
      window.setTimeout(() => router.push(href, { transitionTypes: BOOK_OPEN }), 420),
      // Reset once we've left, so the shelf is tidy if the reader comes back.
      window.setTimeout(() => setOpeningId(null), 1800),
    );
    return true;
  }

  const prefetched = useRef(new Set<string>());
  function prefetchAlbum(album: ShelfAlbum) {
    if (prefetched.current.has(album.id)) return;
    prefetched.current.add(album.id);
    router.prefetch(`/albums/${album.id}`);
  }

  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, like many reading apps.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (e.key === "/" && !(t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q),
    );
  }, [albums, deferred]);

  const isEmpty = albums.length === 0;
  const noMatches = !isEmpty && filtered.length === 0;
  const count = albums.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pt-8 pb-16 sm:px-6 sm:pt-12">
      <FlashToast message={notice} />
      <div className="mb-8 flex flex-col gap-5 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-ivory sm:text-5xl">Your Library</h1>
          <p className="mt-1.5 text-sm text-gold-soft/80">
            {isEmpty ? "An empty shelf, ready for its first book." : `${count} ${count === 1 ? "album" : "albums"} on your shelf`}
          </p>
        </div>

        {!isEmpty && (
          <div className="relative w-full sm:w-72">
            <label htmlFor="album-search" className="sr-only">
              Search albums
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gold-soft/60" aria-hidden />
            <input
              ref={searchRef}
              id="album-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search albums…"
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-gold/20 bg-white/[0.04] pr-9 pl-9 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold/60 focus:ring-2 focus:ring-gold/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-ivory/60 hover:text-ivory"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {isEmpty && (
        <div className="mb-8 rounded-xl border border-gold/15 bg-white/[0.03] px-6 py-6 text-center sm:px-10">
          <h2 className="font-serif text-2xl text-ivory">Your shelf is waiting</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ivory/65">
            Create your first album — a trip, a year, a person you love — and it will appear here as a book you can pull
            from the shelf.
          </p>
          <Link
            href="/albums/new"
            transitionTypes={NAV_FORWARD}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-medium text-walnut-deep transition-colors hover:bg-gold-soft"
          >
            <Plus className="size-4" aria-hidden /> Create your first album
          </Link>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {deferred && `${filtered.length} ${filtered.length === 1 ? "album matches" : "albums match"} your search.`}
      </p>

      {noMatches && (
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-ivory/70">
          <span>No albums match “{deferred.trim()}”.</span>
          <button type="button" onClick={() => setQuery("")} className="cursor-pointer text-gold underline-offset-4 hover:underline">
            Clear search
          </button>
        </div>
      )}

      <Bookcase label="Bookshelf of your albums" dimmed={openingId !== null}>
        {filtered.map((album, i) => (
          <Book
            key={album.id}
            album={album}
            index={i}
            opening={openingId === album.id}
            onOpen={openBook}
            onIntent={prefetchAlbum}
          />
        ))}
        {!deferred.trim() && <NewAlbumBook />}
      </Bookcase>
    </div>
  );
}
