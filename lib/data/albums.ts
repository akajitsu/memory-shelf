import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { AlbumDetail, ShelfAlbum } from "@/types/app";
import { albumIdSchema } from "@/lib/albums/validation";
import { signStoragePaths } from "./storage";

/** All of the signed-in user's albums, oldest first (shelf order), with cover URLs. */
export async function getShelfAlbums(): Promise<ShelfAlbum[]> {
  const user = await requireUser("/library");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("albums")
    .select("id, title, description, cover_color, cover_image_path, album_photos(count)")
    .eq("user_id", user.id) // RLS enforces this too; explicit filter uses the index.
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[albums] list", error.message);
    throw new Error("We couldn’t load your albums. Please refresh the page.");
  }

  const covers = await signStoragePaths(
    supabase,
    data.map((a) => a.cover_image_path).filter((p): p is string => !!p),
  );

  return data.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    coverColor: a.cover_color,
    coverUrl: a.cover_image_path ? (covers.get(a.cover_image_path) ?? null) : null,
    photoCount: a.album_photos?.[0]?.count ?? 0,
  }));
}

/** One of the signed-in user's albums, or null if it doesn't exist or isn't theirs. */
export const getAlbum = cache(async function getAlbum(albumId: string): Promise<AlbumDetail | null> {
  if (!albumIdSchema.safeParse(albumId).success) return null;
  const user = await requireUser(`/albums/${albumId}`);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("albums")
    .select("id, title, description, cover_color, cover_image_path, created_at, updated_at, album_photos(count)")
    .eq("id", albumId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[albums] get", error.message);
    throw new Error("We couldn’t load this album. Please refresh the page.");
  }
  if (!data) return null;

  const covers = data.cover_image_path ? await signStoragePaths(supabase, [data.cover_image_path]) : new Map();
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    coverColor: data.cover_color,
    coverUrl: data.cover_image_path ? (covers.get(data.cover_image_path) ?? null) : null,
    photoCount: data.album_photos?.[0]?.count ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
});
