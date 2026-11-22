"use client";

/**
 * PUT a file to a Supabase signed upload URL with progress reporting.
 * (supabase-js uses fetch, which can't report upload progress.)
 * The bucket enforces allowed MIME types and size limits on this request.
 */
export function uploadWithProgress(
  signedUrl: string,
  blob: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", contentType);
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.setRequestHeader("x-upsert", "false");
    const apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (apikey) xhr.setRequestHeader("apikey", apikey);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        let message = "Upload failed.";
        try {
          const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
          if (body.message) message = body.message;
        } catch {
          /* non-JSON error body */
        }
        reject(new Error(xhr.status === 413 ? "This file is too large." : message));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection and try again."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(blob);
  });
}
