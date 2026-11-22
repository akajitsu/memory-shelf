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

/** Photos laid out on one album page (a desktop spread shows two pages). */
export const PHOTOS_PER_PAGE = 2;

/** Upper bound on photos in a single album. */
export const MAX_PHOTOS_PER_ALBUM = 500;

/** Upload concurrency for photo batches. */
export const UPLOAD_CONCURRENCY = 3;

/** Leather cover colors offered when creating an album. */
export const COVER_COLORS = [
  { name: "Saddle", value: "#7a4b2a" },
  { name: "Oxblood", value: "#6b2a2a" },
  { name: "Forest", value: "#2f4a3a" },
  { name: "Navy", value: "#28344d" },
  { name: "Plum", value: "#4d2f45" },
  { name: "Tobacco", value: "#5a4030" },
  { name: "Slate", value: "#3d4447" },
  { name: "Ochre", value: "#8c6a2f" },
] as const;

export const DEFAULT_COVER_COLOR = COVER_COLORS[0].value;
