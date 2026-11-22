/** Storage path of a photo's display thumbnail, derived from the photo's own path. */
export function thumbPathFor(imagePath: string): string {
  return imagePath.replace(/\.(jpg|png|webp|gif)$/, ".thumb.jpg");
}

/** Largest thumbnail we accept (they're ~900px JPEGs, typically 80–250 KB). */
export const MAX_THUMB_BYTES = 2 * 1024 * 1024;
