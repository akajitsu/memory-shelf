"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BOOK_OPEN, NAV_FORWARD } from "@/components/layout/page-transition";
import { Plus, Search, X } from "lucide-react";
import type { ShelfAlbum } from "@/types/app";
import { FlashToast } from "@/components/ui/flash-toast";
import { setBookHandoff } from "@/lib/book-handoff";
import { playSound } from "@/lib/sound";
import { LIBRARY_STYLE_INFO, saveLibraryStyle, type LibraryStyle } from "@/lib/library-style";
import { LibraryScene } from "@/components/library/library-scene";
import { LibraryStylePicker } from "@/components/library/library-style-picker";
import { PerchedCat, SleepingTomeCat } from "@/components/cats/wizard-cats";
import { Bookcase } from "./bookcase";
import { Book } from "./book";
import { FloatingField } from "./floating-field";
import { NewAlbumBook } from "./new-album-book";
import { TreeCase } from "./tree-case";

export function LibraryView({
  albums,
  notice,
  greetingName,
  focusSearch = false,
  initialStyle = "moonlit",
  catChance,
}: {
  albums: ShelfAlbum[];
  notice?: string;
  greetingName?: string | null;
  focusSearch?: boolean;
  /** From the reader's cookie, so the server renders the right style. */
  initialStyle?: LibraryStyle;
  /** Override how often the resident cats appear (dev preview). */
  catChance?: number;
}) {
  const router = useRouter();
  const [style, setStyle] = useState<LibraryStyle>(initialStyle);

  function chooseStyle(next: LibraryStyle) {
    if (next === style) return;
    setStyle(next);
    saveLibraryStyle(next);
  }
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
    setBookHandoff({
      id: album.id,
      title: album.title,
      coverColor: album.coverColor,
      coverDesign: album.coverDesign,
      coverPattern: album.coverPattern,
    });
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

  // Arrived from the header's search button.
  useEffect(() => {
    if (!focusSearch) return;
    searchRef.current?.focus();
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [focusSearch]);

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
  const firstName = greetingName?.trim().split(/\s+/)[0];

  const Case = style === "floating" ? FloatingField : style === "tree" ? TreeCase : Bookcase;

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-3 pt-6 sm:px-6 sm:pt-10",
        // The tree is planted in ground that runs to the bottom of the page.
        style === "tree" ? "flex flex-1 flex-col" : "pb-24",
      )}
      data-library-style={style}
    >
      <LibraryScene key={`scene-${style}`} variant={style} sleeper={<SleepingTomeCat chance={catChance} />} />
      <FlashToast message={notice} />
      <div className="mb-10 flex flex-col gap-5 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-[fade-up_900ms_var(--ease-out-soft)_both]">
          <p className="eyebrow text-aurora/80">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</p>
          <h1 className="mt-2 title-gilt font-ornate text-[34px] leading-[1.1] font-normal text-ivory sm:text-[48px]">
            My Library
          </h1>
          <p className="mt-2 text-sm text-silver/80">
            {isEmpty
              ? "An empty shelf among the stars, waiting for its first book."
              : `${count} ${count === 1 ? "volume" : "volumes"} of memories, kept among the stars`}
          </p>
        </div>

        <div className="flex w-full animate-[fade-up_900ms_var(--ease-out-soft)_150ms_both] flex-col items-start gap-3 sm:w-auto sm:items-end">
          <LibraryStylePicker value={style} onChange={chooseStyle} />
          {!isEmpty && (
            <div className="relative w-full sm:w-72">
              <label htmlFor="album-search" className="sr-only">
                Search albums
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-aurora/60" aria-hidden />
              <input
                ref={searchRef}
                id="album-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your library…"
                autoComplete="off"
                className="h-11 w-full rounded-full border border-ivory/12 bg-abyss/55 pr-10 pl-10 text-sm text-ivory shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)] placeholder:text-silver/50 hover:border-ivory/20 focus:border-aurora/55 focus:ring-2 focus:ring-aurora/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-silver/70 hover:text-ivory"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {LIBRARY_STYLE_INFO[style].name}: {LIBRARY_STYLE_INFO[style].description}.
      </p>

      {isEmpty && (
        <div className="night-panel mb-10 animate-[fade-up_900ms_var(--ease-out-soft)_200ms_both] rounded-3xl px-6 py-8 text-center sm:px-10">
          <h2 className="font-display text-[24px] text-ivory">Your first book is waiting to be bound</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-silver">
            Create an album — a trip, a year, a person you love — and it will float onto this shelf as a book of its own.
          </p>
          <Link
            href="/albums/new"
            transitionTypes={NAV_FORWARD}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-moon px-6 text-sm font-semibold text-abyss shadow-[0_8px_24px_-10px_rgb(232_215_139/0.6)] transition-colors hover:bg-[#f0e3a6]"
          >
            <Plus className="size-4" aria-hidden /> Create your first album
          </Link>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {deferred && `${filtered.length} ${filtered.length === 1 ? "album matches" : "albums match"} your search.`}
      </p>

      {noMatches && (
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-sm text-silver">
          <span>No albums match “{deferred.trim()}”.</span>
          <button type="button" onClick={() => setQuery("")} className="cursor-pointer text-aurora underline-offset-4 hover:underline">
            Clear search
          </button>
        </div>
      )}

      <Case
        key={`case-${style}`}
        label="Bookshelf of your albums"
        dimmed={openingId !== null}
        perch={<PerchedCat chance={catChance} inline={style !== "moonlit"} />}
      >
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
        {!deferred.trim() && <NewAlbumBook index={filtered.length} />}
      </Case>
    </div>
  );
}
