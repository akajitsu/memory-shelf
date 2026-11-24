"use client";

import { UPLOAD_CONCURRENCY } from "@/lib/constants";
import { prepareImage, type PreparedImage } from "@/lib/images/prepare";
import { uploadWithProgress } from "@/lib/images/upload";
import { finalizePhotoUploads, requestPhotoUploads } from "./actions";

export type UploadStage = "preparing" | "uploading" | "saving" | "done" | "error";
export type UploadUpdate = { status: UploadStage; progress?: number; error?: string };

/** Run async tasks with a concurrency limit. */
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) await worker(queue.shift()!);
    }),
  );
}

/**
 * Upload photographs into an album through the verified pipeline:
 *   1. resize/re-encode in the browser (plus a ~900px display thumbnail),
 *   2. the server issues signed URLs for paths it chooses (after checking ownership),
 *   3. upload directly to private storage with real progress,
 *   4. the server verifies each file's bytes and records them in order.
 * `update` reports per-file progress. `error` is set when a whole step failed.
 */
export async function uploadPhotoFiles(
  albumId: string,
  items: { key: string; file: File }[],
  update: (key: string, u: UploadUpdate) => void,
): Promise<{ added: number; error: string | null }> {
  // 1. Resize/re-encode in the browser.
  const prepared = new Map<string, PreparedImage>();
  for (const it of items) {
    update(it.key, { status: "preparing", progress: 0 });
    try {
      prepared.set(it.key, await prepareImage(it.file, { thumbnail: true }));
    } catch (e) {
      update(it.key, { status: "error", error: e instanceof Error ? e.message : "Couldn’t read this image." });
    }
  }
  const ready = items.filter((it) => prepared.has(it.key));
  if (!ready.length) return { added: 0, error: null };

  // 2. Ask the server for upload URLs (it chooses the storage paths).
  const req = await requestPhotoUploads({
    albumId,
    files: ready.map((it) => {
      const p = prepared.get(it.key)!;
      return { contentType: p.type, size: p.blob.size, thumbSize: p.thumb?.size };
    }),
  });
  if (!req.ok) {
    ready.forEach((it) => update(it.key, { status: "error", error: req.error }));
    return { added: 0, error: req.error };
  }

  // 3. Upload directly to private storage, a few at a time, with progress.
  const uploaded: { key: string; path: string; name: string; hasThumb: boolean }[] = [];
  await pool(
    ready.map((it, i) => ({ it, target: req.data.targets[i] })),
    UPLOAD_CONCURRENCY,
    async ({ it, target }) => {
      const p = prepared.get(it.key)!;
      update(it.key, { status: "uploading", progress: 0 });
      try {
        // Small display thumbnail first (best effort), then the full image with progress.
        let hasThumb = false;
        if (p.thumb && target.thumb) {
          hasThumb = await uploadWithProgress(target.thumb.signedUrl, p.thumb, "image/jpeg").then(
            () => true,
            () => false,
          );
        }
        await uploadWithProgress(target.signedUrl, p.blob, p.type, (progress) =>
          update(it.key, { status: "uploading", progress }),
        );
        update(it.key, { status: "saving", progress: 1 });
        uploaded.push({ key: it.key, path: target.path, name: it.file.name, hasThumb });
      } catch (e) {
        update(it.key, { status: "error", error: e instanceof Error ? e.message : "Upload failed." });
      }
    },
  );
  if (!uploaded.length) return { added: 0, error: null };

  // 4. Server verifies each file and records them in the chosen order.
  const order = new Map(ready.map((it, i) => [it.key, i]));
  uploaded.sort((a, b) => order.get(a.key)! - order.get(b.key)!);
  const fin = await finalizePhotoUploads({
    albumId,
    items: uploaded.map(({ path, name, hasThumb }) => ({ path, name, hasThumb })),
  });
  if (!fin.ok) {
    uploaded.forEach((u) => update(u.key, { status: "error", error: fin.error }));
    return { added: 0, error: fin.error };
  }
  const failed = new Map(fin.data.failed.map((f) => [f.path, f.reason]));
  uploaded.forEach((u) =>
    failed.has(u.path)
      ? update(u.key, { status: "error", error: failed.get(u.path) })
      : update(u.key, { status: "done", progress: 1 }),
  );
  return { added: fin.data.added, error: null };
}
