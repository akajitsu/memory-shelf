"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePhoto, reorderPhotos, updatePhotoCaption } from "@/lib/photos/actions";
import type { AlbumPhotoView } from "@/types/app";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { PhotoUploader } from "./photo-uploader";

type SaveState = "idle" | "saving" | "saved" | "error";

function CaptionEditor({ photo }: { photo: AlbumPhotoView }) {
  const [value, setValue] = useState(photo.caption ?? "");
  const [saved, setSaved] = useState(photo.caption ?? "");
  const [state, setState] = useState<SaveState>("idle");

  async function save() {
    const next = value.trim();
    if (next === saved.trim()) return;
    setState("saving");
    const res = await updatePhotoCaption({ photoId: photo.id, caption: next });
    if (res.ok) {
      setSaved(res.data.caption ?? "");
      setState("saved");
    } else {
      setState("error");
      toast.error(res.error);
    }
  }

  return (
    <div className="relative">
      <label htmlFor={`cap-${photo.id}`} className="sr-only">
        Caption for {photo.name ?? "photo"}
      </label>
      <textarea
        id={`cap-${photo.id}`}
        value={value}
        rows={2}
        maxLength={500}
        placeholder="Add a caption…"
        onChange={(e) => {
          setValue(e.target.value);
          if (state !== "idle") setState("idle");
        }}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        className={cn(inputClass, "h-auto resize-none py-2 pr-8 font-serif text-[15px] leading-snug italic")}
      />
      <span className="pointer-events-none absolute top-2.5 right-2.5" aria-live="polite">
        {state === "saving" && <LoaderCircle className="size-4 animate-spin text-muted" aria-label="Saving caption" />}
        {state === "saved" && <Check className="size-4 text-success" aria-label="Caption saved" />}
      </span>
    </div>
  );
}

function SortablePhoto({
  photo,
  index,
  onDelete,
}: {
  photo: AlbumPhotoView;
  index: number;
  onDelete: (photo: AlbumPhotoView) => void;
}) {
  const thumb = photo.thumbUrl ?? photo.url;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-parchment bg-ivory p-2.5 shadow-[var(--shadow-paper)]",
        isDragging && "z-20 scale-[1.03] shadow-2xl ring-2 ring-gold",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-parchment">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={photo.caption ?? ""} loading="lazy" className="size-full object-cover" draggable={false} />
        )}
        <span className="absolute top-1.5 left-1.5 rounded-md bg-walnut-deep/75 px-1.5 py-0.5 text-[11px] text-ivory tabular-nums">
          {index + 1}
        </span>
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1.5 right-1.5 flex size-9 cursor-grab touch-none items-center justify-center rounded-md bg-ivory/90 text-ink shadow active:cursor-grabbing"
          aria-label={`Reorder photo ${index + 1}. Press space to pick up, arrow keys to move.`}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
      <CaptionEditor photo={photo} />
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-muted" title={photo.name ?? undefined}>
          {photo.name}
        </p>
        <button
          type="button"
          onClick={() => onDelete(photo)}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-3.5" aria-hidden /> Delete
        </button>
      </div>
    </li>
  );
}

export function PhotoManager({ albumId, photos: initial }: { albumId: string; photos: AlbumPhotoView[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [orderState, setOrderState] = useState<SaveState>("idle");
  const [toDelete, setToDelete] = useState<AlbumPhotoView | null>(null);
  const [deleting, startDelete] = useTransition();
  // Adopt fresh server data (after uploads/deletes) when the prop changes.
  const [serverPhotos, setServerPhotos] = useState(initial);
  if (serverPhotos !== initial) {
    setServerPhotos(initial);
    setPhotos(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const before = photos;
    const next = arrayMove(photos, before.findIndex((p) => p.id === active.id), before.findIndex((p) => p.id === over.id));
    setPhotos(next);
    setOrderState("saving");
    const res = await reorderPhotos({ albumId, photoIds: next.map((p) => p.id) });
    if (res.ok) {
      setOrderState("saved");
    } else {
      setPhotos(before);
      setOrderState("error");
      toast.error(res.error);
    }
  }

  function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    startDelete(async () => {
      const res = await deletePhoto(target.id);
      if (res.ok) {
        setPhotos((list) => list.filter((p) => p.id !== target.id));
        toast.success("Photo deleted.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
      setToDelete(null);
    });
  }

  return (
    <div className="space-y-8">
      <PhotoUploader albumId={albumId} onUploaded={() => router.refresh()} />

      <section aria-labelledby="arrange-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="arrange-heading" className="font-serif text-2xl text-ivory">
            Arrange &amp; caption
          </h2>
          <p className="text-sm text-gold-soft/75" aria-live="polite">
            {orderState === "saving" && "Saving order…"}
            {orderState === "saved" && "Order saved"}
            {orderState === "error" && "Couldn’t save the order"}
            {orderState === "idle" &&
              (photos.length ? "Drag photos to reorder. Captions save automatically." : "")}
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gold/20 bg-white/[0.025] px-6 py-12 text-center text-sm text-ivory/60">
            No photographs in this album yet. Add some above.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {photos.map((p, i) => (
                  <SortablePhoto key={p.id} photo={p} index={i} onDelete={setToDelete} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        pending={deleting}
        title="Delete this photo?"
        confirmLabel={deleting ? "Deleting…" : "Delete photo"}
      >
        <p>
          {toDelete?.caption ? (
            <>
              “<span className="text-ink">{toDelete.caption}</span>” will be permanently removed from this album.
            </>
          ) : (
            "This photograph will be permanently removed from the album."
          )}{" "}
          This can’t be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
