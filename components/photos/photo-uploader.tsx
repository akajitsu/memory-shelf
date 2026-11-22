"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, CircleAlert, ImagePlus, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { ALLOWED_IMAGE_TYPES, MAX_FILES_PER_UPLOAD, UPLOAD_CONCURRENCY } from "@/lib/constants";
import { checkImageFile, ImagePrepError, prepareImage, type PreparedImage } from "@/lib/images/prepare";
import { uploadWithProgress } from "@/lib/images/upload";
import { finalizePhotoUploads, requestPhotoUploads } from "@/lib/photos/actions";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Status = "ready" | "invalid" | "preparing" | "uploading" | "saving" | "done" | "error";
type Item = {
  key: string;
  file: File;
  preview: string;
  status: Status;
  progress: number;
  error?: string;
};

let keySeq = 0;

/** Run async tasks with a concurrency limit. */
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift()!);
    }),
  );
}

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

  const patch = (key: string, p: Partial<Item>) =>
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...p } : it)));

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

    // 1. Resize/re-encode in the browser.
    const prepared = new Map<string, PreparedImage>();
    for (const it of queue) {
      patch(it.key, { status: "preparing", error: undefined, progress: 0 });
      try {
        prepared.set(it.key, await prepareImage(it.file, { thumbnail: true }));
      } catch (e) {
        patch(it.key, { status: "error", error: e instanceof Error ? e.message : "Couldn’t read this image." });
      }
    }
    const ready = queue.filter((it) => prepared.has(it.key));
    if (!ready.length) {
      setBusy(false);
      return;
    }

    // 2. Ask the server for upload URLs (it chooses the storage paths).
    const req = await requestPhotoUploads({
      albumId,
      files: ready.map((it) => {
        const p = prepared.get(it.key)!;
        return { contentType: p.type, size: p.blob.size, thumbSize: p.thumb?.size };
      }),
    });
    if (!req.ok) {
      ready.forEach((it) => patch(it.key, { status: "error", error: req.error }));
      toast.error(req.error);
      setBusy(false);
      return;
    }

    // 3. Upload directly to private storage, a few at a time, with progress.
    const uploaded: { key: string; path: string; name: string; hasThumb: boolean }[] = [];
    await pool(
      ready.map((it, i) => ({ it, target: req.data.targets[i] })),
      UPLOAD_CONCURRENCY,
      async ({ it, target }) => {
        const p = prepared.get(it.key)!;
        patch(it.key, { status: "uploading", progress: 0 });
        try {
          // Small display thumbnail first (best effort), then the full image with progress.
          let hasThumb = false;
          if (p.thumb && target.thumb) {
            hasThumb = await uploadWithProgress(target.thumb.signedUrl, p.thumb, "image/jpeg").then(
              () => true,
              () => false,
            );
          }
          await uploadWithProgress(target.signedUrl, p.blob, p.type, (progress) => patch(it.key, { progress }));
          patch(it.key, { status: "saving", progress: 1 });
          uploaded.push({ key: it.key, path: target.path, name: it.file.name, hasThumb });
        } catch (e) {
          patch(it.key, { status: "error", error: e instanceof Error ? e.message : "Upload failed." });
        }
      },
    );

    // 4. Server verifies each file and records them in the chosen order.
    if (uploaded.length) {
      const order = new Map(ready.map((it, i) => [it.key, i]));
      uploaded.sort((a, b) => order.get(a.key)! - order.get(b.key)!);
      const fin = await finalizePhotoUploads({
        albumId,
        items: uploaded.map(({ path, name, hasThumb }) => ({ path, name, hasThumb })),
      });
      if (!fin.ok) {
        uploaded.forEach((u) => patch(u.key, { status: "error", error: fin.error }));
        toast.error(fin.error);
      } else {
        const failed = new Map(fin.data.failed.map((f) => [f.path, f.reason]));
        uploaded.forEach((u) =>
          failed.has(u.path) ? patch(u.key, { status: "error", error: failed.get(u.path) }) : patch(u.key, { status: "done" }),
        );
        if (fin.data.added > 0) {
          toast.success(`${fin.data.added} ${fin.data.added === 1 ? "photo" : "photos"} added to the album.`);
          onUploaded();
        }
      }
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
    <section aria-labelledby="upload-heading" className="rounded-2xl border border-parchment bg-ivory p-4 text-ink shadow-[var(--shadow-paper)] sm:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="upload-heading" className="font-serif text-2xl text-walnut">
          Add photographs
        </h2>
        <span className="text-xs text-muted">Up to {MAX_FILES_PER_UPLOAD} at a time · JPEG, PNG, WebP, GIF</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging ? "border-gold bg-gold/10" : "border-parchment bg-cream/40",
        )}
      >
        <UploadCloud className="size-8 text-gold" aria-hidden />
        <p className="text-sm text-ink">Drag photos here</p>
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
                <div className="relative aspect-square overflow-hidden rounded-lg bg-parchment">
                  {it.status !== "invalid" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center p-2 text-center text-[11px] text-danger">Not an image</div>
                  )}
                  {(it.status === "uploading" || it.status === "preparing" || it.status === "saving") && (
                    <div className="absolute inset-x-1.5 bottom-1.5 h-1.5 overflow-hidden rounded-full bg-black/30">
                      <div className="h-full bg-gold transition-[width]" style={{ width: `${Math.max(4, it.progress * 100)}%` }} />
                    </div>
                  )}
                  {it.status === "done" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <CheckCircle2 className="size-7 text-ivory" aria-label="Uploaded" />
                    </span>
                  )}
                  {(it.status === "error" || it.status === "invalid") && (
                    <span className="absolute top-1 left-1 rounded-full bg-ivory/90 p-0.5" title={it.error}>
                      <CircleAlert className="size-4 text-danger" aria-hidden />
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[11px] text-muted" title={it.file.name}>
                  {it.error ? <span className="text-danger">{it.error}</span> : `${it.file.name} · ${formatBytes(it.file.size)}`}
                </p>
                {!busy && it.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => removeItem(it.key)}
                    className="absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-walnut text-ivory shadow hover:bg-danger"
                    aria-label={`Remove ${it.file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted" aria-live="polite">
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
