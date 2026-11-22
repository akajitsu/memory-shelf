import { z } from "zod";
import { ALLOWED_IMAGE_TYPES, MAX_FILES_PER_UPLOAD, MAX_IMAGE_BYTES, MAX_PHOTOS_PER_ALBUM } from "@/lib/constants";
import { albumIdSchema } from "@/lib/albums/validation";
import { MAX_THUMB_BYTES } from "./thumbs";

export const photoIdSchema = z.uuid("Invalid photo.");

export const requestUploadsSchema = z.object({
  albumId: albumIdSchema,
  files: z
    .array(
      z.object({
        contentType: z.enum(ALLOWED_IMAGE_TYPES),
        size: z.number().int().positive().max(MAX_IMAGE_BYTES, "Files must be 10 MB or smaller."),
        thumbSize: z.number().int().positive().max(MAX_THUMB_BYTES).optional(),
      }),
    )
    .min(1, "Choose at least one photo.")
    .max(MAX_FILES_PER_UPLOAD, `Upload up to ${MAX_FILES_PER_UPLOAD} photos at a time.`),
});

export const finalizeUploadsSchema = z.object({
  albumId: albumIdSchema,
  items: z
    .array(
      z.object({
        path: z.string().min(1).max(300),
        name: z.string().max(1000).optional(),
        hasThumb: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(MAX_FILES_PER_UPLOAD),
});

export const captionSchema = z.object({
  photoId: photoIdSchema,
  caption: z
    .string()
    .trim()
    .max(500, "Captions can be up to 500 characters.")
    .transform((v) => (v === "" ? null : v)),
});

export const reorderSchema = z.object({
  albumId: albumIdSchema,
  photoIds: z.array(photoIdSchema).min(1).max(MAX_PHOTOS_PER_ALBUM),
});

/** Photo object names are server-generated: `<uuid>.<ext>` (covers use a `cover-` prefix). */
export const PHOTO_OBJECT_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/;

/** Keep a readable original filename for display; strip control chars and paths. */
export function cleanFileName(name: string | undefined): string | null {
  if (!name) return null;
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255);
  return cleaned || null;
}
