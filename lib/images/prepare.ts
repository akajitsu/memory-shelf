"use client";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, type AllowedImageType } from "@/lib/constants";
import { sniffImageType } from "./sniff";

/** Originals can be larger than the upload limit because we downscale first. */
export const MAX_SOURCE_BYTES = 40 * 1024 * 1024;

export type PreparedImage = {
  blob: Blob;
  type: AllowedImageType;
  width: number;
  height: number;
  /** Small JPEG for album pages and grids (absent for GIFs). */
  thumb?: Blob;
};

/** Longest side of the display thumbnail used on album pages. */
export const THUMB_MAX_DIM = 900;

export class ImagePrepError extends Error {}

/** Client-side check before any work: real type (by bytes) and size. */
export async function checkImageFile(file: File): Promise<AllowedImageType> {
  if (file.size === 0) throw new ImagePrepError(`“${file.name}” is empty.`);
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImagePrepError(`“${file.name}” is larger than 40 MB.`);
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const type = sniffImageType(head);
  if (!type || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) {
    throw new ImagePrepError(`“${file.name}” isn’t a supported image. Use JPEG, PNG, WebP or GIF.`);
  }
  return type;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscale an image so its longest side is at most `maxDim`, re-encoding as
 * WebP (JPEG fallback). Honors EXIF orientation. GIFs are kept as-is to
 * preserve animation. Small, already-compact images are uploaded unchanged.
 */
function drawScaled(bitmap: ImageBitmap, maxDim: number) {
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImagePrepError("Your browser couldn’t process this image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height, scale };
}

export async function prepareImage(
  file: File,
  {
    maxDim = 2400,
    quality = 0.86,
    thumbnail = false,
  }: { maxDim?: number; quality?: number; thumbnail?: boolean } = {},
): Promise<PreparedImage> {
  const sourceType = await checkImageFile(file);

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new ImagePrepError(`“${file.name}” couldn’t be read. The file may be damaged.`);
  });

  try {
    const { width: w0, height: h0 } = bitmap;

    if (sourceType === "image/gif") {
      if (file.size > MAX_IMAGE_BYTES) throw new ImagePrepError(`“${file.name}” is a GIF larger than 10 MB.`);
      return { blob: file, type: "image/gif", width: w0, height: h0 };
    }

    // Display thumbnail: always JPEG so its storage path is predictable (<id>.thumb.jpg).
    let thumb: Blob | undefined;
    if (thumbnail) {
      const t = drawScaled(bitmap, THUMB_MAX_DIM);
      thumb = (await canvasToBlob(t.canvas, "image/jpeg", 0.82)) ?? undefined;
    }

    const main = drawScaled(bitmap, maxDim);
    if (main.scale === 1 && file.size <= 1.5 * 1024 * 1024 && sourceType !== "image/png") {
      return { blob: file, type: sourceType, width: w0, height: h0, thumb };
    }

    let blob = await canvasToBlob(main.canvas, "image/webp", quality);
    let type: AllowedImageType = "image/webp";
    if (!blob || blob.type !== "image/webp") {
      blob = await canvasToBlob(main.canvas, "image/jpeg", quality);
      type = "image/jpeg";
    }
    if (!blob) throw new ImagePrepError("Your browser couldn’t process this image.");
    if (blob.size > MAX_IMAGE_BYTES) throw new ImagePrepError(`“${file.name}” is still larger than 10 MB after resizing.`);
    return { blob, type, width: main.width, height: main.height, thumb };
  } finally {
    bitmap.close();
  }
}
