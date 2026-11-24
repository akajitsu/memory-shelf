"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, CircleAlert, ImagePlus, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { ALLOWED_IMAGE_TYPES, MAX_FILES_PER_UPLOAD } from "@/lib/constants";
import { checkImageFile, ImagePrepError } from "@/lib/images/prepare";
import { uploadPhotoFiles, type UploadStage } from "@/lib/photos/upload-client";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Status = "ready" | "invalid" | UploadStage;
type Item = {
  key: string;
  file: File;
  preview: string;
  status: Status;
  progress: number;
  error?: string;
};

let keySeq = 0;

export function PhotoUploader({ albumId, onUploaded }: { albumId: string; onUploaded: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Release preview object URLs on unmount.
  useEffect(() => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.preview)), []);

  function clearFinished() {
    setItems((list) => {
      list.filter((i) => i.status === "done" || i.status === "invalid").forEach((i) => URL.revokeObjectURL(i.preview));
      return list.filter((i) => i.status !== "done" && i.status !== "invalid");
    });
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    const room = MAX_FILES_PER_UPLOAD - itemsRef.current.filter((i) => i.status !== "done").length;
    if (files.length > room) toast.error(`You can add up to ${MAX_FILES_PER_UPLOAD} photos per upload.`);
    const accepted = files.slice(0, Math.max(0, room));

    const checked = await Promise.all(
      accepted.map(async (file): Promise<Item> => {
        const base = { key: `f${++keySeq}`, file, preview: URL.createObjectURL(file), progress: 0 };
        try {
          await checkImageFile(file);
          return { ...base, status: "ready" };
        } catch (e) {
          return { ...base, status: "invalid", error: e instanceof ImagePrepError ? e.message : "Not a supported image." };
        }
      }),
    );
    setItems((list) => [...list.filter((i) => i.status !== "done"), ...checked]);
  }

  function removeItem(key: string) {
    setItems((list) => {
      const it = list.find((i) => i.key === key);
      if (it) URL.revokeObjectURL(it.preview);
      return list.filter((i) => i.key !== key);
    });
  }

  async function upload() {
    const queue = itemsRef.current.filter((i) => i.status === "ready" || i.status === "error");
    if (!queue.length || busy) return;
    setBusy(true);
    const result = await uploadPhotoFiles(albumId, queue, (key, u) =>
      setItems((list) =>
        list.map((it) =>
          it.key === key ? { ...it, status: u.status, progress: u.progress ?? it.progress, error: u.error } : it,
        ),
      ),
    );
    if (result.error) toast.error(result.error);
    if (result.added > 0) {
      toast.success(`${result.added} ${result.added === 1 ? "photo" : "photos"} added to the album.`);
      onUploaded();
    }
    setBusy(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!busy && e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
  }

  const pending = items.filter((i) => i.status === "ready" || i.status === "error").length;
  const active = items.filter((i) => ["preparing", "uploading", "saving"].includes(i.status));
  const overall = active.length ? active.reduce((s, i) => s + i.progress, 0) / active.length : 0;

  return (
    <section aria-labelledby="upload-heading" className="night-panel rounded-3xl p-4 text-ivory sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="upload-heading" className="font-display text-[21px] text-ivory">
          Add photographs
        </h2>
        <span className="text-xs text-silver/70">Up to {MAX_FILES_PER_UPLOAD} at a time · JPEG, PNG, WebP, GIF</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-aurora bg-aurora/[0.08]" : "border-ivory/18 bg-abyss/40",
        )}
      >
        <UploadCloud className="size-8 text-aurora" aria-hidden />
        <p className="text-sm text-silver">Drag photos here to place them on the pages</p>
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <ImagePlus className="size-4" aria-hidden /> Choose photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose photos to upload"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <>
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6" aria-label="Photos to upload">
            {items.map((it) => (
              <li key={it.key} className="group relative">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-deep">
                  {it.status !== "invalid" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center p-2 text-center text-[11px] text-danger">Not an image</div>
                  )}
                  {(it.status === "uploading" || it.status === "preparing" || it.status === "saving") && (
                    <div className="absolute inset-x-1.5 bottom-1.5 h-1.5 overflow-hidden rounded-full bg-black/40">
                      <div className="h-full bg-aurora transition-[width]" style={{ width: `${Math.max(4, it.progress * 100)}%` }} />
                    </div>
                  )}
                  {it.status === "done" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-abyss/50">
                      <CheckCircle2 className="size-7 text-aurora" aria-label="Uploaded" />
                    </span>
                  )}
                  {(it.status === "error" || it.status === "invalid") && (
                    <span className="absolute top-1 left-1 rounded-full bg-abyss/85 p-0.5" title={it.error}>
                      <CircleAlert className="size-4 text-danger" aria-hidden />
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[11px] text-silver/70" title={it.file.name}>
                  {it.error ? <span className="text-danger">{it.error}</span> : `${it.file.name} · ${formatBytes(it.file.size)}`}
                </p>
                {!busy && it.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => removeItem(it.key)}
                    className="absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full border border-ivory/15 bg-cosmos text-silver shadow hover:bg-danger-strong hover:text-ivory"
                    aria-label={`Remove ${it.file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-silver" aria-live="polite">
              {busy
                ? `Uploading… ${Math.round(overall * 100)}%`
                : pending
                  ? `${pending} ${pending === 1 ? "photo" : "photos"} ready`
                  : "All done."}
            </p>
            <div className="flex gap-2">
              {!busy && (
                <Button type="button" variant="ghost" size="sm" onClick={clearFinished}>
                  Clear finished
                </Button>
              )}
              <Button type="button" onClick={upload} loading={busy} disabled={!pending}>
                <UploadCloud className="size-4" aria-hidden />
                {busy ? "Uploading…" : `Upload ${pending || ""} ${pending === 1 ? "photo" : "photos"}`.replace("  ", " ")}
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
