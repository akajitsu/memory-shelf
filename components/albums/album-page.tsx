import Link from "next/link";
import { memo, type CSSProperties } from "react";
import { ImagePlus } from "lucide-react";
import { tiltFor, type AlbumPage as Page } from "@/lib/album-pages";
import type { AlbumPhotoView } from "@/types/app";
import { cn } from "@/lib/utils";
import styles from "./album-book.module.css";

export type BookMeta = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  photoCount: number;
};

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "long" });

function Mount({
  photo,
  aspect,
  onOpen,
  style,
  className,
}: {
  photo: AlbumPhotoView;
  aspect: string;
  onOpen: (photo: AlbumPhotoView) => void;
  style?: CSSProperties;
  className?: string;
}) {
  const label = photo.caption || photo.name || "Photograph";
  const src = photo.thumbUrl ?? photo.url;
  return (
    <figure className={cn("flex flex-col items-center gap-[2.2cqh]", className)} style={style}>
      <div className={cn(styles.mount, "w-full")}>
        <button type="button" className={styles.photoButton} onClick={() => onOpen(photo)} aria-label={`View photo: ${label}`}>
          <div style={{ aspectRatio: aspect }} className="w-full overflow-hidden">
            {src ? (
              // Signed, expiring URL from private storage. Only the visible spread is
              // rendered, so load eagerly; the book waits for these before opening.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={photo.caption ?? ""}
                decoding="async"
                draggable={false}
                data-book-img
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-[#e9e1cf] text-xs text-muted">Unavailable</div>
            )}
          </div>
        </button>
        <span className={cn(styles.corner, styles.tl)} aria-hidden />
        <span className={cn(styles.corner, styles.tr)} aria-hidden />
        <span className={cn(styles.corner, styles.bl)} aria-hidden />
        <span className={cn(styles.corner, styles.br)} aria-hidden />
      </div>
      {photo.caption && <figcaption className={cn(styles.caption, "max-w-full px-[2cqw] text-center")}>{photo.caption}</figcaption>}
    </figure>
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

  return (
    <div className={cn(styles.paper, sideClass, "size-full")}>
      {page?.kind === "title" && (
        <div className="flex size-full flex-col items-center justify-center gap-[3cqh] px-[12cqw] text-center">
          <span className="h-px w-[28cqw] bg-[#b8955a]/70" aria-hidden />
          <h2 className="font-serif leading-[1.05] font-medium break-words text-walnut" style={{ fontSize: "clamp(22px, 10cqw, 58px)" }}>
            {meta.title}
          </h2>
          {meta.description && (
            <p
              className="line-clamp-6 font-serif whitespace-pre-line text-[#5a4c40] italic"
              style={{ fontSize: "clamp(12px, 3.9cqw, 20px)" }}
            >
              {meta.description}
            </p>
          )}
          <span className="h-px w-[28cqw] bg-[#b8955a]/70" aria-hidden />
          <p className="text-[#8a7a68] uppercase" style={{ fontSize: "clamp(9px, 2.4cqw, 12px)", letterSpacing: "0.2em" }}>
            Bound {dateFmt.format(new Date(meta.createdAt))} · {meta.photoCount}{" "}
            {meta.photoCount === 1 ? "photograph" : "photographs"}
          </p>
        </div>
      )}

      {page?.kind === "empty" && (
        <div className="flex size-full items-center justify-center p-[9cqw]">
          <div className="flex size-full flex-col items-center justify-center gap-[3cqh] rounded-sm border-2 border-dashed border-[#c9b896] px-[8cqw] text-center">
            <ImagePlus className="size-[9cqw] max-h-10 max-w-10 text-[#b8955a]" aria-hidden />
            <p className="font-serif text-walnut" style={{ fontSize: "clamp(16px, 6cqw, 30px)" }}>
              No photographs yet
            </p>
            <p className="text-[#7c7064]" style={{ fontSize: "clamp(11px, 3.2cqw, 15px)" }}>
              Add your first photos and they’ll be arranged on these pages.
            </p>
            <Link
              href={`/albums/${meta.id}/photos`}
              className="mt-[1cqh] inline-flex h-10 items-center gap-2 rounded-lg bg-walnut px-4 text-sm font-medium text-ivory hover:bg-walnut-light"
            >
              <ImagePlus className="size-4" aria-hidden /> Add photos
            </Link>
          </div>
        </div>
      )}

      {page?.kind === "end" && (
        <div className="flex size-full flex-col items-center justify-center gap-[3cqh] text-center">
          <span className="font-serif text-[#b8955a]" style={{ fontSize: "clamp(18px, 7cqw, 36px)" }} aria-hidden>
            ❦
          </span>
          <p className="font-serif text-[#5a4c40] italic" style={{ fontSize: "clamp(13px, 4.2cqw, 22px)" }}>
            To be continued…
          </p>
          <Link
            href={`/albums/${meta.id}/photos`}
            className="text-sm font-medium text-leather underline-offset-4 hover:underline"
          >
            Add more photos
          </Link>
        </div>
      )}

      {page?.kind === "photos" && (
        <>
          {page.layout === "single" && (
            <div className="flex size-full items-center justify-center px-[13cqw] pt-[9cqh] pb-[13cqh]">
              <Mount
                photo={page.photos[0]}
                aspect="4 / 5"
                onOpen={onOpenPhoto}
                className="w-full"
                style={{ rotate: `${tiltFor(page.photos[0].id, 1)}deg` }}
              />
            </div>
          )}

          {page.layout === "stack" && (
            <div className="flex size-full flex-col justify-center gap-[5cqh] px-[10cqw] pt-[6cqh] pb-[11cqh]">
              {page.photos.map((p, i) => (
                <Mount
                  key={p.id}
                  photo={p}
                  aspect="4 / 3"
                  onOpen={onOpenPhoto}
                  className={cn("w-[78%]", i === 0 ? "self-start" : "self-end")}
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
                className="absolute top-[7%] left-[9%] w-[56%]"
                style={{ rotate: `${tiltFor(page.photos[0].id, 2)}deg` }}
              />
              <Mount
                photo={page.photos[1]}
                aspect="4 / 3"
                onOpen={onOpenPhoto}
                className="absolute right-[8%] bottom-[11%] w-[60%]"
                style={{ rotate: `${tiltFor(page.photos[1].id, 2)}deg` }}
              />
            </div>
          )}

          <span className={styles.pageNumber} aria-hidden>
            {page.number}
          </span>
        </>
      )}
    </div>
  );
});
