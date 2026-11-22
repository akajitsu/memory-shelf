"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { AlbumPhotoView } from "@/types/app";

/** Full-size photo viewer on a native <dialog>. Arrow keys move, Esc closes. */
export function Lightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: AlbumPhotoView[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index !== null;
  const photo = open ? photos[index] : null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "ArrowRight" && index < photos.length - 1) onIndexChange(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, photos.length, onIndexChange]);

  const navBtn =
    "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-ivory backdrop-blur transition hover:bg-black/60 disabled:pointer-events-none disabled:opacity-0";

  return (
    <dialog
      ref={ref}
      aria-label="Photo viewer"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-[#0d0905]/92 opacity-0 scale-95 transition-[opacity,scale,overlay,display] transition-discrete duration-200 ease-out open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-95 backdrop:opacity-0 backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0"
    >
      {photo && index !== null && (
        <div className="relative flex size-full flex-col items-center justify-center gap-4 p-4 sm:p-10" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/40 text-ivory hover:bg-black/60"
            aria-label="Close photo viewer"
          >
            <X className="size-5" />
          </button>
          <button type="button" className={`${navBtn} left-3 sm:left-6`} onClick={() => onIndexChange(index - 1)} disabled={index === 0} aria-label="Previous photo">
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            className={`${navBtn} right-3 sm:right-6`}
            onClick={() => onIndexChange(index + 1)}
            disabled={index === photos.length - 1}
            aria-label="Next photo"
          >
            <ChevronRight className="size-6" />
          </button>

          {photo.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.url}
              alt={photo.caption ?? photo.name ?? "Photograph"}
              className="max-h-[78dvh] max-w-full rounded-sm object-contain shadow-2xl"
            />
          )}
          <div className="max-w-2xl text-center">
            {photo.caption && <p className="font-serif text-xl text-ivory italic">{photo.caption}</p>}
            <p className="mt-1 text-xs text-ivory/50">
              {index + 1} of {photos.length}
              {photo.name && ` · ${photo.name}`}
            </p>
          </div>
        </div>
      )}
    </dialog>
  );
}
