import Link from "next/link";
import { memo, type CSSProperties } from "react";
import { ImagePlus } from "lucide-react";
import { tiltFor, type AlbumPage as Page } from "@/lib/album-pages";
import type { AlbumPhotoView } from "@/types/app";
import { Sparkle } from "@/components/books/ornaments";
import { ConstellationFigure, Glyph, MoonPhases, signForTitle, zodiacGlyph, ZodiacWheel } from "@/components/astro/astro";
import { cn } from "@/lib/utils";
import { formatDay, formatMonth } from "@/lib/dates";
import styles from "./album-book.module.css";

export type BookMeta = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  photoCount: number;
};


const TAPES = ["rgb(131 217 212 / 0.5)", "rgb(216 156 203 / 0.45)", "rgb(232 215 139 / 0.55)", "rgb(168 154 203 / 0.5)"];

function PhotoImage({ photo }: { photo: AlbumPhotoView }) {
  const src = photo.thumbUrl ?? photo.url;
  return src ? (
    // Signed, expiring URL from private storage. Only the visible spread is
    // rendered, so load eagerly; the book waits for these before opening.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={photo.caption ?? ""} decoding="async" draggable={false} data-book-img />
  ) : (
    <div className="flex size-full items-center justify-center bg-[#e8e0cc] text-xs text-ink-soft">Unavailable</div>
  );
}

function label(photo: AlbumPhotoView) {
  return photo.caption || photo.name || "Photograph";
}

/** A print in a cream mat with navy photo corners. */
function Mount({
  photo,
  aspect,
  onOpen,
  style,
  className,
  showDate = false,
  captionFirst = false,
}: {
  photo: AlbumPhotoView;
  aspect: string;
  onOpen: (photo: AlbumPhotoView) => void;
  style?: CSSProperties;
  className?: string;
  showDate?: boolean;
  /** Caption above the print (when another print overlaps its lower edge). */
  captionFirst?: boolean;
}) {
  return (
    <figure
      className={cn("flex items-center gap-[1.8cqh]", captionFirst ? "flex-col-reverse" : "flex-col", className)}
      style={style}
    >
      <div className={cn(styles.mount, "w-full")}>
        <button type="button" className={styles.photoButton} onClick={() => onOpen(photo)} aria-label={`View photo: ${label(photo)}`}>
          <div style={{ aspectRatio: aspect }} className="w-full overflow-hidden">
            <PhotoImage photo={photo} />
          </div>
        </button>
        <span className={cn(styles.corner, styles.tl)} aria-hidden />
        <span className={cn(styles.corner, styles.tr)} aria-hidden />
        <span className={cn(styles.corner, styles.bl)} aria-hidden />
        <span className={cn(styles.corner, styles.br)} aria-hidden />
      </div>
      {(photo.caption || showDate) && (
        <figcaption className="flex max-w-full flex-col items-center gap-[0.8cqh] px-[2cqw] text-center">
          {photo.caption && <span className={styles.caption}>{photo.caption}</span>}
          {showDate && (
            <time className={styles.date} dateTime={photo.addedAt} title="Added to the album on this day">
              <span className="sr-only">Added </span>
              {formatDay(photo.addedAt)}
            </time>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** A taped scrapbook print with its caption written on the border. */
function Polaroid({
  photo,
  aspect,
  onOpen,
  className,
  style,
  tape,
}: {
  photo: AlbumPhotoView;
  aspect: string;
  onOpen: (photo: AlbumPhotoView) => void;
  className?: string;
  style?: CSSProperties;
  tape: number;
}) {
  return (
    <figure className={cn(styles.polaroid, className)} style={style}>
      <button type="button" className={styles.photoButton} onClick={() => onOpen(photo)} aria-label={`View photo: ${label(photo)}`}>
        <div style={{ aspectRatio: aspect }} className="w-full overflow-hidden">
          <PhotoImage photo={photo} />
        </div>
      </button>
      <figcaption className={styles.polaroidLabel}>{photo.caption ?? " "}</figcaption>
      <span
        className={styles.tape}
        aria-hidden
        style={{ "--tape": TAPES[tape % TAPES.length], "--tape-r": `${tape % 2 ? 4 : -5}deg` } as CSSProperties}
      />
    </figure>
  );
}

function FrameStars() {
  return (
    <>
      {[
        [0, 0],
        [100, 0],
        [0, 100],
        [100, 100],
      ].map(([x, y]) => (
        <svg key={`${x}${y}`} viewBox="0 0 24 24" className={styles.frameStar} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden>
          <Sparkle s={9} />
        </svg>
      ))}
    </>
  );
}

/** One physical page of the album. Sized by its container (aspect set by the book). */
export const AlbumPageView = memo(function AlbumPageView({
  page,
  meta,
  side,
  onOpenPhoto,
}: {
  page: Page | null;
  meta: BookMeta;
  side: "left" | "right" | "single";
  onOpenPhoto: (photo: AlbumPhotoView) => void;
}) {
  const sideClass = side === "left" ? styles.left : side === "right" ? styles.right : styles.single;
  const head =
    page?.kind === "photos"
      ? side === "right"
        ? `Added ${formatMonth(page.photos[0].addedAt)}`
        : meta.title
      : null;

  return (
    <div className={cn(styles.paper, sideClass, "size-full")}>
      {page && (
        <div className={styles.frame} aria-hidden>
          <FrameStars />
        </div>
      )}

      {page?.kind === "title" && (
        <div className="flex size-full flex-col items-center justify-center gap-[3.2cqh] px-[13cqw] text-center">
          <ZodiacWheel className="w-[44cqw] text-gilt" />
          <h2
            className="font-ornate leading-[1.12] font-normal break-words text-ink"
            style={{ fontSize: "clamp(20px, 8.4cqw, 48px)" }}
          >
            {meta.title}
          </h2>
          {meta.description && (
            <p
              className="line-clamp-6 font-serif whitespace-pre-line text-ink-soft italic"
              style={{ fontSize: "clamp(12px, 3.9cqw, 20px)", lineHeight: 1.45 }}
            >
              {meta.description}
            </p>
          )}
          <div className="flex items-center gap-[3cqw] text-gilt">
            <span className="h-px w-[10cqw] bg-gilt/60" aria-hidden />
            <Glyph d={zodiacGlyph(signForTitle(meta.title))} className="size-[5cqw]" width={1.6} />
            <span className="h-px w-[10cqw] bg-gilt/60" aria-hidden />
          </div>
          <p className="font-semibold text-ink-soft uppercase" style={{ fontSize: "clamp(8px, 2.3cqw, 11px)", letterSpacing: "0.22em" }}>
            Bound {formatDay(meta.createdAt)} · {meta.photoCount} {meta.photoCount === 1 ? "photograph" : "photographs"}
          </p>
        </div>
      )}

      {page?.kind === "empty" && (
        <div className="flex size-full items-center justify-center p-[11cqw]">
          <div className="flex size-full flex-col items-center justify-center gap-[3cqh] rounded-sm border border-dashed border-gilt/50 px-[8cqw] text-center">
            <ImagePlus className="size-[9cqw] max-h-10 max-w-10 text-gilt" aria-hidden />
            <p className="font-display text-ink" style={{ fontSize: "clamp(14px, 5cqw, 26px)" }}>
              No photographs yet
            </p>
            <p className="text-ink-soft" style={{ fontSize: "clamp(11px, 3.2cqw, 15px)" }}>
              Add your first photos and they’ll be arranged on these pages.
            </p>
            <Link
              href={`/albums/${meta.id}/photos`}
              className="mt-[1cqh] inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-paper hover:bg-[#33406a]"
            >
              <ImagePlus className="size-4" aria-hidden /> Add photos
            </Link>
          </div>
        </div>
      )}

      {page?.kind === "end" && (
        <div className="flex size-full flex-col items-center justify-center gap-[3cqh] text-center">
          <ConstellationFigure sign={signForTitle(meta.title)} className="w-[34cqw] text-gilt" />
          <MoonPhases className="w-[40cqw] text-gilt" />
          <p className="font-serif text-ink-soft italic" style={{ fontSize: "clamp(13px, 4.4cqw, 23px)" }}>
            To be continued…
          </p>
          <Link
            href={`/albums/${meta.id}/photos`}
            className="text-sm font-semibold text-turquoise underline-offset-4 hover:underline"
          >
            Add more photos
          </Link>
        </div>
      )}

      {page?.kind === "photos" && (
        <>
          {head && (
            <p className={styles.runningHead} aria-hidden>
              {head}
            </p>
          )}

          {page.layout === "single" && (
            <div className="flex size-full items-center justify-center px-[14cqw] pt-[11cqh] pb-[12cqh]">
              <Mount
                photo={page.photos[0]}
                aspect="4 / 5"
                onOpen={onOpenPhoto}
                className="w-full"
                showDate
                style={{ rotate: `${tiltFor(page.photos[0].id, 1)}deg` }}
              />
            </div>
          )}

          {page.layout === "stack" && (
            <div className="flex size-full flex-col justify-center gap-[4.5cqh] px-[11cqw] pt-[9cqh] pb-[11cqh]">
              {page.photos.map((p, i) => (
                <Mount
                  key={p.id}
                  photo={p}
                  aspect="4 / 3"
                  onOpen={onOpenPhoto}
                  className={cn("w-[76%]", i === 0 ? "self-start" : "self-end")}
                  style={{ rotate: `${tiltFor(p.id)}deg` }}
                />
              ))}
            </div>
          )}

          {page.layout === "offset" && (
            <div className="relative size-full">
              <Mount
                photo={page.photos[0]}
                aspect="3 / 4"
                onOpen={onOpenPhoto}
                captionFirst
                className="absolute top-[8.5%] left-[10%] w-[50%]"
                style={{ rotate: `${tiltFor(page.photos[0].id, 2)}deg` }}
              />
              <Mount
                photo={page.photos[1]}
                aspect="4 / 3"
                onOpen={onOpenPhoto}
                className="absolute right-[9%] bottom-[12%] w-[56%]"
                style={{ rotate: `${tiltFor(page.photos[1].id, 2)}deg` }}
              />
            </div>
          )}

          {page.layout === "scrapbook" && (
            <div className="relative size-full">
              <Polaroid
                photo={page.photos[0]}
                aspect="1 / 1"
                onOpen={onOpenPhoto}
                tape={page.number}
                className="absolute top-[11%] left-[9%] w-[48%]"
                style={{ rotate: `${-3 + tiltFor(page.photos[0].id, 1.2)}deg` }}
              />
              <Polaroid
                photo={page.photos[1]}
                aspect="4 / 5"
                onOpen={onOpenPhoto}
                tape={page.number + 1}
                className="absolute top-[17%] right-[8%] w-[40%]"
                style={{ rotate: `${3.5 + tiltFor(page.photos[1].id, 1.2)}deg` }}
              />
              <Polaroid
                photo={page.photos[2]}
                aspect="4 / 3"
                onOpen={onOpenPhoto}
                tape={page.number + 2}
                className="absolute bottom-[14.5%] left-[19%] w-[50%]"
                style={{ rotate: `${-1.5 + tiltFor(page.photos[2].id, 1)}deg` }}
              />
              <svg viewBox="0 0 24 24" className={styles.doodle} style={{ right: "12%", bottom: "16%", width: "7cqw" }} aria-hidden>
                <Sparkle s={10} />
              </svg>
              <svg viewBox="0 0 24 24" className={styles.doodle} style={{ left: "7%", bottom: "38%", width: "4cqw" }} aria-hidden>
                <Sparkle s={10} />
              </svg>
            </div>
          )}

          <span className={styles.pageNumber} aria-hidden>
            <svg viewBox="0 0 24 24">
              <Sparkle s={10} />
            </svg>
            {page.number}
            <svg viewBox="0 0 24 24">
              <Sparkle s={10} />
            </svg>
          </span>
        </>
      )}
    </div>
  );
});
