"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useAnimate, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { buildPages, type AlbumPage } from "@/lib/album-pages";
import { setBookHandoff } from "@/lib/book-handoff";
import { playSound } from "@/lib/sound";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { AlbumPhotoView } from "@/types/app";
import { BOOK_CLOSE } from "@/components/layout/page-transition";
import { Lightbox } from "@/components/photos/lightbox";
import { cn } from "@/lib/utils";
import { AlbumCover } from "./album-cover";
import { AlbumPageView, type BookMeta } from "./album-page";
import styles from "./album-book.module.css";

const PAGE_ASPECT = 0.72; // width / height of one page
const EASE_TURN = [0.45, 0.05, 0.25, 1] as const;
const EASE_COVER = [0.55, 0.06, 0.28, 1] as const;
const COVER_OPEN_S = 1.05;
const COVER_CLOSE_S = 0.9;
const TURN_WIDE_S = 0.85;
const TURN_NARROW_S = 0.55;
const PAD = "var(--pad)";

type Phase = "closed" | "open" | "closing";

const noopSubscribe = () => () => {};
const NOOP = () => {};
type Turn = { dir: 1 | -1; from: number; to: number };

/** Resolve when the given images (and URLs) are decoded, or after `timeoutMs`. */
function whenImagesReady(root: HTMLElement | null, urls: (string | null | undefined)[], timeoutMs: number) {
  const decodes: Promise<unknown>[] = [];
  root?.querySelectorAll<HTMLImageElement>("img[data-book-img]").forEach((img) => {
    decodes.push(img.decode().catch(() => undefined));
  });
  for (const url of urls) {
    if (!url) continue;
    const img = new Image();
    img.src = url;
    decodes.push(img.decode().catch(() => undefined));
  }
  return Promise.race([Promise.all(decodes), new Promise((r) => setTimeout(r, timeoutMs))]);
}

/** Paper endpaper printed on the inside of the cover. */
function Endpaper({ color }: { color: string }) {
  return (
    <div
      className="size-full rounded-l-[6px]"
      style={{
        backgroundColor: color,
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgb(255 255 255 / 0.08) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgb(0 0 0 / 0.1) 0 2px, transparent 3px), linear-gradient(90deg, rgb(0 0 0 / 0.25), transparent 12%)",
        backgroundSize: "22px 22px, 26px 26px, 100% 100%",
        boxShadow: "inset 0 0 0 6px rgb(0 0 0 / 0.12)",
      }}
    />
  );
}

/** A turning leaf: one page on the front, the next on the back, shaded as it rotates. */
function Leaf({
  rot,
  dir,
  front,
  back,
  frontSide,
  backSide,
  meta,
  ghost = false,
}: {
  ghost?: boolean;
  rot: MotionValue<number>;
  dir: 1 | -1;
  front: AlbumPage | null;
  back: AlbumPage | null;
  frontSide: "left" | "right";
  backSide: "left" | "right";
  meta: BookMeta;
}) {
  const sign = dir === 1 ? -1 : 1;
  const frontShade = useTransform(rot, [0, sign * 90], [0, 0.45]);
  const backShade = useTransform(rot, [sign * 90, sign * 180], [0.45, 0]);

  return (
    <motion.div
      className={cn("absolute inset-y-0 w-1/2", ghost ? "pointer-events-none z-20" : "z-20")}
      style={{
        left: dir === 1 ? "50%" : 0,
        rotateY: rot,
        transformOrigin: dir === 1 ? "left center" : "right center",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      aria-hidden
    >
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", opacity: ghost ? 0.01 : 1 }}>
        <AlbumPageView page={front} meta={meta} side={frontSide} onOpenPhoto={NOOP} />
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: frontShade,
            background: `linear-gradient(${dir === 1 ? "to left" : "to right"}, rgb(30 20 10 / 0.55), rgb(30 20 10 / 0.05) 70%)`,
          }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", opacity: ghost ? 0.01 : 1 }}
      >
        <AlbumPageView page={back} meta={meta} side={backSide} onOpenPhoto={NOOP} />
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: backShade,
            background: `linear-gradient(${dir === 1 ? "to right" : "to left"}, rgb(30 20 10 / 0.5), rgb(30 20 10 / 0.05) 70%)`,
          }}
        />
      </div>
    </motion.div>
  );
}

/**
 * The open photo album: facing pages on wide screens, single pages on phones.
 * Arrives closed; once its first spread's photos are decoded the cover swings
 * open. Closes again on the way back to the shelf. Pages turn as 3D leaves.
 *
 * `pending` renders the identical closed book with blank pages (the loading
 * state), so the real album replaces it without any visual jump.
 */
export function AlbumBook({
  meta,
  photos,
  coverColor,
  coverUrl = null,
  actions,
  pending = false,
  showCoverTitle = true,
}: {
  meta: BookMeta;
  photos: AlbumPhotoView[];
  coverColor: string;
  coverUrl?: string | null;
  actions?: ReactNode;
  pending?: boolean;
  showCoverTitle?: boolean;
}) {
  const router = useRouter();
  const wide = useMediaQuery("(min-width: 768px)", true);
  // The server can't know the screen width; keep the book invisible until the
  // first client render so phones never see the desktop layout flash and jump.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const reduceMotion = useReducedMotion();
  const pages = useMemo(() => (pending ? [] : buildPages(photos)), [photos, pending]);
  const step = wide ? 2 : 1;

  const [scope, animate] = useAnimate();
  const [phase, setPhase] = useState<Phase>("closed");
  const navigatedAway = useRef(false);

  // First visible page; on wide screens always the left (even) page.
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const rot = useMotionValue(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // GPU warm-up: the first 3D page leaf costs a one-off ~150 ms of GPU setup. Render
  // a hidden leaf once, right after the cover opens (while nothing is moving), so the
  // reader's first real page turn is smooth.
  const [warmup, setWarmup] = useState(false);
  const warmed = useRef(false);
  const warmRot = useMotionValue(-0.5);

  // Latest values for async animation code (avoids restarting effects mid-animation).
  const live = useRef({ wide, reduceMotion });
  useEffect(() => {
    live.current = { wide, reduceMotion };
  }, [wide, reduceMotion]);

  const first = Math.min(wide ? pageIndex - (pageIndex % 2) : pageIndex, Math.max(0, pages.length - 1));
  const lastFirst = wide ? pages.length - 1 - ((pages.length - 1) % 2) : pages.length - 1;
  const canPrev = first > 0;
  const canNext = first < lastFirst;
  const interactive = !pending && phase === "open" && turn === null;

  // ------------------------------------------------------------------ cover choreography
  const openCover = useCallback(async () => {
    const { wide: w, reduceMotion: quick } = live.current;
    const d = (s: number) => (quick ? 0 : s);
    playSound("coverOpen", d(COVER_OPEN_S) * 1000);
    if (w) {
      await Promise.all([
        animate("[data-binding]", { x: "0%" }, { duration: d(COVER_OPEN_S), ease: EASE_COVER }),
        animate("[data-left]", { opacity: 1 }, { duration: d(0.3), delay: d(0.4), ease: "easeOut" }),
        animate("[data-cover]", { rotateY: -180 }, { duration: d(COVER_OPEN_S), ease: EASE_COVER }),
      ]);
      // Fade a face, never the rotating container: opacity on a preserve-3d element
      // flattens it and breaks backface-visibility (the mirrored cover would show through).
      await animate("[data-cover-back]", { opacity: 0 }, { duration: d(0.35), ease: "easeOut" });
    } else {
      await Promise.all([
        animate("[data-cover]", { rotateY: -110 }, { duration: d(0.8), ease: EASE_COVER }),
        animate("[data-cover-front]", { opacity: 0 }, { duration: d(0.3), delay: d(0.5) }),
      ]);
    }
  }, [animate]);

  const closeCover = useCallback(async () => {
    const { wide: w, reduceMotion: quick } = live.current;
    const d = (s: number) => (quick ? 0 : s);
    if (w) {
      await animate("[data-cover-back]", { opacity: 1 }, { duration: d(0.2) });
      playSound("coverClose", d(COVER_CLOSE_S) * 1000);
      await Promise.all([
        animate("[data-cover]", { rotateY: 0 }, { duration: d(COVER_CLOSE_S), ease: EASE_COVER }),
        animate("[data-binding]", { x: "-25%" }, { duration: d(COVER_CLOSE_S), ease: EASE_COVER }),
        animate("[data-left]", { opacity: 0 }, { duration: d(0.22), delay: d(0.32), ease: "easeIn" }),
      ]);
    } else {
      playSound("coverClose", d(0.6) * 1000);
      await Promise.all([
        animate("[data-cover]", { rotateY: 0 }, { duration: d(0.6), ease: EASE_COVER }),
        animate("[data-cover-front]", { opacity: 1 }, { duration: d(0.25) }),
      ]);
    }
  }, [animate]);

  const handlers = useRef({ openCover, closeCover });
  useEffect(() => {
    handlers.current = { openCover, closeCover };
  }, [openCover, closeCover]);

  // This album is now on screen; clear the shelf hand-off.
  useEffect(() => {
    if (!pending) setBookHandoff(null);
  }, [pending]);

  useEffect(() => {
    if (pending) return;
    let active = true;

    async function run() {
      if (phase === "closed" || (phase === "closing" && navigatedAway.current)) {
        // Arrived (or came back with the browser's back button): wait until the
        // first spread's photos and the cover are decoded, then open — so nothing
        // pops in mid-animation.
        navigatedAway.current = false;
        await Promise.all([
          whenImagesReady(scope.current, [coverUrl], 2500),
          new Promise((r) => setTimeout(r, live.current.reduceMotion ? 0 : 260)),
        ]);
        if (!active) return;
        await handlers.current.openCover();
        if (active) setPhase("open");
      } else if (phase === "closing") {
        await handlers.current.closeCover();
        if (!active) return;
        navigatedAway.current = true;
        router.push("/library", { transitionTypes: BOOK_CLOSE });
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, [phase, pending, coverUrl, router, scope]);

  useEffect(() => {
    if (pending || phase !== "open" || warmed.current) return;
    warmed.current = true;
    let raf = 0;
    const start = window.setTimeout(() => {
      setWarmup(true);
      let frames = 0;
      const tick = () => {
        if (++frames >= 3) setWarmup(false);
        else raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 180);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [phase, pending]);

  function close() {
    if (phase !== "open" || turn) return;
    setLightbox(null);
    setPhase("closing");
  }

  // ------------------------------------------------------------------ page turning
  const go = useCallback(
    (delta: 1 | -1) => {
      if (!interactive) return;
      const to = Math.max(0, Math.min(lastFirst, first + delta * step));
      if (to === first) return;
      if (reduceMotion) {
        setPageIndex(to);
        return;
      }
      rot.set(wide ? 0 : delta === 1 ? 0 : -90);
      setTurn({ dir: delta, from: first, to });
    },
    [interactive, lastFirst, first, step, reduceMotion, rot, wide],
  );

  useEffect(() => {
    if (!turn) return;
    // On phones the page lifts to edge-on (90°), where it vanishes naturally — no fade
    // needed, which keeps it on the GPU's cheapest compositing path.
    const target = wide ? (turn.dir === 1 ? -180 : 180) : turn.dir === 1 ? -90 : 0;
    const duration = wide ? TURN_WIDE_S : TURN_NARROW_S;
    let controls: { stop: () => void } | null = null;
    let cancelled = false;
    // Let the new leaf mount and paint while it still lies flat (identical to the open
    // page), then start turning two frames later — the expensive first paint never
    // lands mid-motion.
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (cancelled) return;
        playSound("pageTurn", duration * 1000);
        const c = animate(rot, target, { duration, ease: EASE_TURN });
        controls = c;
        c.then(() => {
          if (cancelled) return;
          setPageIndex(turn.to);
          setTurn(null);
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      controls?.stop();
    };
  }, [turn, wide, rot, animate]);

  // Arrow keys turn pages (unless typing or the lightbox is open).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightbox !== null) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight" && canNext) go(1);
      if (e.key === "ArrowLeft" && canPrev) go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, canNext, canPrev, lightbox]);

  // Decode nearby pages ahead of time so turns never reveal a loading photo.
  useEffect(() => {
    const near = pages.slice(Math.max(0, first - step * 2), first + step * 3);
    for (const p of near)
      if (p.kind === "photos")
        for (const ph of p.photos) {
          const src = ph.thumbUrl ?? ph.url;
          if (!src) continue;
          const img = new Image();
          img.src = src;
          void img.decode().catch(() => undefined);
        }
  }, [first, pages, step]);

  const openPhoto = useCallback((p: AlbumPhotoView) => setLightbox(photos.findIndex((x) => x.id === p.id)), [photos]);

  // ------------------------------------------------------------------ what's on the pages
  let base: (AlbumPage | null)[];
  if (pending) {
    base = wide ? [null, null] : [null];
  } else if (!turn) {
    base = wide ? [pages[first], pages[first + 1] ?? null] : [pages[first]];
  } else if (wide) {
    base = turn.dir === 1 ? [pages[turn.from], pages[turn.to + 1] ?? null] : [pages[turn.to], pages[turn.from + 1] ?? null];
  } else {
    base = [turn.dir === 1 ? pages[turn.to] : pages[turn.from]];
  }

  const label = pending
    ? " "
    : wide
      ? `Pages ${first + 1}–${Math.min(first + 2, pages.length)} of ${pages.length}`
      : `Page ${first + 1} of ${pages.length}`;
  const photoPages = pages.filter((p) => p.kind === "photos").length;

  const bookWidth = wide
    ? `min(100%, calc((100dvh - 250px) * ${PAGE_ASPECT * 2}))`
    : `min(100%, calc((100dvh - 270px) * ${PAGE_ASPECT}))`;

  // Starting pose of the closed book (before the opening animation runs).
  const isClosed = phase === "closed" || pending;
  const closedShift: CSSProperties = isClosed && wide ? { transform: "translateX(-25%)" } : {};
  const leftHidden: CSSProperties = isClosed && wide ? { opacity: 0 } : {};

  const navBtn =
    "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gold/25 bg-white/[0.04] text-gold-soft transition hover:bg-white/10 hover:text-ivory disabled:pointer-events-none disabled:opacity-25";

  return (
    <div ref={scope} className="flex flex-col items-center" style={hydrated ? undefined : { visibility: "hidden" }}>
      <div className="mb-6 flex min-h-10 w-full flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={close}
          disabled={pending}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gold-soft/80 transition-colors hover:text-ivory disabled:cursor-default"
        >
          <ArrowLeft className="size-4" aria-hidden /> Bookshelf
        </button>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>

      <div className="flex w-full items-center justify-center gap-3 lg:gap-6">
        {wide && (
          <button type="button" className={navBtn} onClick={() => go(-1)} disabled={!canPrev || !interactive} aria-label="Previous pages">
            <ChevronLeft className="size-5" />
          </button>
        )}

        <div
          data-binding
          className={styles.binding}
          style={{ "--leather": coverColor, width: bookWidth, ...closedShift } as CSSProperties}
          role="region"
          aria-roledescription="photo album"
          aria-label={pending ? "Opening album" : `${meta.title}. ${label}.`}
          aria-busy={pending || phase !== "open"}
        >
          {/* Leather boards */}
          {wide ? (
            <>
              <div data-left aria-hidden className={cn(styles.leather, "left-0 w-1/2 rounded-l-[10px]")} style={leftHidden} />
              <div aria-hidden className={cn(styles.leather, "right-0 w-1/2 rounded-r-[10px]")} />
            </>
          ) : (
            <div aria-hidden className={cn(styles.leather, "inset-x-0 rounded-[10px]")} />
          )}

          <div className={styles.pagesArea}>
            <motion.div
              className="relative rounded-[3px]"
              style={{ aspectRatio: wide ? PAGE_ASPECT * 2 : PAGE_ASPECT, perspective: wide ? 2400 : 1600 }}
              drag={!wide && interactive ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.x < -60 && canNext) go(1);
                else if (info.offset.x > 60 && canPrev) go(-1);
              }}
            >
              {/* Warm-up leaf: the same page at ~0° and 1% opacity for 3 frames — invisible,
                  but the GPU really draws it, compiling its shaders before the first turn. */}
              {warmup && !turn && wide && (
                <Leaf
                  ghost
                  rot={warmRot}
                  dir={1}
                  meta={meta}
                  front={pages[first + 1] ?? null}
                  back={pages[first + 2] ?? null}
                  frontSide="right"
                  backSide="left"
                />
              )}
              {warmup && !turn && !wide && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-20"
                  style={{ rotateY: warmRot, opacity: 0.01, transformOrigin: "left center", willChange: "transform" }}
                >
                  <AlbumPageView page={pages[first + 1] ?? null} meta={meta} side="single" onOpenPhoto={NOOP} />
                </motion.div>
              )}

              {/* Pages lying flat */}
              <div
                className="absolute inset-0 grid touch-pan-y overflow-hidden rounded-[3px]"
                style={{ gridTemplateColumns: wide ? "1fr 1fr" : "1fr" }}
              >
                {base.map((page, i) => {
                  const view = (
                    <AlbumPageView
                      page={page}
                      meta={meta}
                      side={wide ? (i === 0 ? "left" : "right") : "single"}
                      onOpenPhoto={openPhoto}
                    />
                  );
                  const key = `${i}-${page?.kind}-${page?.kind === "photos" ? page.number : ""}`;
                  return wide && i === 0 ? (
                    <div key={key} data-left className="size-full" style={leftHidden}>
                      {view}
                    </div>
                  ) : (
                    <div key={key} className="size-full">
                      {view}
                    </div>
                  );
                })}
              </div>

              {/* The leaf being turned */}
              {turn && wide && (
                <Leaf
                  rot={rot}
                  dir={turn.dir}
                  meta={meta}
                  front={turn.dir === 1 ? (pages[turn.from + 1] ?? null) : pages[turn.from]}
                  back={turn.dir === 1 ? pages[turn.to] : (pages[turn.to + 1] ?? null)}
                  frontSide={turn.dir === 1 ? "right" : "left"}
                  backSide={turn.dir === 1 ? "left" : "right"}
                />
              )}
              {turn && !wide && (
                <motion.div
                  className="absolute inset-0 z-20"
                  style={{ rotateY: rot, transformOrigin: "left center", willChange: "transform" }}
                  aria-hidden
                >
                  <AlbumPageView
                    page={turn.dir === 1 ? pages[turn.from] : pages[turn.to]}
                    meta={meta}
                    side="single"
                    onOpenPhoto={NOOP}
                  />
                </motion.div>
              )}

              {wide && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[3px] -translate-x-1/2 bg-gradient-to-r from-black/15 via-black/30 to-black/15"
                />
              )}

              {/* The front cover (while closed, opening or closing) */}
              {(phase !== "open" || pending) && (
                <motion.div
                  data-cover
                  className="absolute z-30"
                  style={{
                    top: `calc(-1 * ${PAD})`,
                    bottom: `calc(-1 * ${PAD})`,
                    left: wide ? "50%" : `calc(-1 * ${PAD})`,
                    right: `calc(-1 * ${PAD})`,
                    transformOrigin: "left center",
                    transformStyle: "preserve-3d",
                    rotateY: phase === "closing" ? (wide ? -180 : -110) : 0,
                    willChange: "transform",
                  }}
                  aria-hidden
                >
                  <div
                    data-cover-front
                    className="absolute inset-0"
                    style={{ backfaceVisibility: "hidden", opacity: phase === "closing" && !wide ? 0 : 1 }}
                  >
                    <AlbumCover
                      fill
                      title={showCoverTitle ? meta.title : " "}
                      color={coverColor}
                      imageUrl={coverUrl}
                      className="rounded-l-none"
                    />
                  </div>
                  <div
                    data-cover-back
                    className="absolute inset-0"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      opacity: phase === "closing" && wide ? 0 : 1,
                    }}
                  >
                    <Endpaper color={coverColor} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {wide && (
          <button type="button" className={navBtn} onClick={() => go(1)} disabled={!canNext || !interactive} aria-label="Next pages">
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center gap-4">
        {!wide && (
          <button type="button" className={navBtn} onClick={() => go(-1)} disabled={!canPrev || !interactive} aria-label="Previous page">
            <ChevronLeft className="size-5" />
          </button>
        )}
        <p className="min-w-32 text-center text-sm text-gold-soft/75 tabular-nums" aria-live="polite">
          {label}
        </p>
        {!wide && (
          <button type="button" className={navBtn} onClick={() => go(1)} disabled={!canNext || !interactive} aria-label="Next page">
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>
      {photoPages > 0 && (
        <p className="mt-2 hidden text-xs text-ivory/35 md:block">Use ← → to turn pages · click a photo to enlarge</p>
      )}

      {!pending && <Lightbox photos={photos} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}
