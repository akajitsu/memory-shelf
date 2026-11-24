import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/dal";
import { albumIdSchema } from "@/lib/albums/validation";
import { createClient } from "@/lib/supabase/server";
import type { AlbumPhotoView } from "@/types/app";
import { thumbPathFor } from "@/lib/photos/thumbs";
import { signStoragePaths } from "./storage";

/** An album's photos in display order, with signed URLs. Empty if the album isn't the user's. */
export const getAlbumPhotos = cache(async function getAlbumPhotos(albumId: string): Promise<AlbumPhotoView[]> {
  if (!albumIdSchema.safeParse(albumId).success) return [];
  const user = await requireUser(`/albums/${albumId}`);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("album_photos")
    .select("id, image_path, image_name, caption, display_order, created_at")
    .eq("album_id", albumId)
    .eq("user_id", user.id)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[photos] list", error.message);
    throw new Error("We couldn’t load the photographs. Please refresh the page.");
  }

  // Thumbnails are signed separately so a missing one (older photos) can never
  // affect the full-size URLs. Both requests run in parallel.
  const [urls, thumbs] = await Promise.all([
    signStoragePaths(supabase, data.map((p) => p.image_path)),
    signStoragePaths(supabase, data.map((p) => thumbPathFor(p.image_path))),
  ]);
  return data.map((p) => ({
    id: p.id,
    url: urls.get(p.image_path) ?? null,
    thumbUrl: thumbs.get(thumbPathFor(p.image_path)) ?? urls.get(p.image_path) ?? null,
    name: p.image_name,
    caption: p.caption,
    order: p.display_order,
    addedAt: p.created_at,
  }));
});
