/** Name of the private Supabase Storage bucket holding photos and covers. */
export const STORAGE_BUCKET = "album-photos";

/** Image types accepted for upload. Must match the bucket's allowed_mime_types. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Max size per image. Must match the bucket's file_size_limit (10 MB). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Max files accepted in one upload batch. */
export const MAX_FILES_PER_UPLOAD = 30;

/** Signed URL lifetime for private images, in seconds. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Upper bound on photos in a single album. */
export const MAX_PHOTOS_PER_ALBUM = 500;

/** Upload concurrency for photo batches. */
export const UPLOAD_CONCURRENCY = 3;
