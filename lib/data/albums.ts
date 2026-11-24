import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { AlbumDetail, ShelfAlbum } from "@/types/app";
import { albumIdSchema } from "@/lib/albums/validation";
import { isBookDesign, isBookPattern } from "@/lib/book-design";

const BOOK_COLUMNS = "id, title, description, cover_color, cover_design, cover_pattern";

type BookRow = {
  id: string;
  title: string;
  description: string | null;
  cover_color: string;
  cover_design: string;
  cover_pattern: string;
  album_photos: { count: number }[] | null;
};

function toShelfAlbum(a: BookRow): ShelfAlbum {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    coverColor: a.cover_color,
    coverDesign: isBookDesign(a.cover_design) ? a.cover_design : "classic",
    coverPattern: isBookPattern(a.cover_pattern) ? a.cover_pattern : "none",
    photoCount: a.album_photos?.[0]?.count ?? 0,
  };
}

/** All of the signed-in user's albums, oldest first (shelf order). */
export async function getShelfAlbums(): Promise<ShelfAlbum[]> {
  const user = await requireUser("/library");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("albums")
    .select(`${BOOK_COLUMNS}, album_photos(count)`)
    .eq("user_id", user.id) // RLS enforces this too; explicit filter uses the index.
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[albums] list", error.message);
    throw new Error("We couldn’t load your albums. Please refresh the page.");
  }
  return data.map(toShelfAlbum);
}

/** One of the signed-in user's albums, or null if it doesn't exist or isn't theirs. */
export const getAlbum = cache(async function getAlbum(albumId: string): Promise<AlbumDetail | null> {
  if (!albumIdSchema.safeParse(albumId).success) return null;
  const user = await requireUser(`/albums/${albumId}`);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("albums")
    .select(`${BOOK_COLUMNS}, created_at, updated_at, album_photos(count)`)
    .eq("id", albumId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[albums] get", error.message);
    throw new Error("We couldn’t load this album. Please refresh the page.");
  }
  if (!data) return null;

  return { ...toShelfAlbum(data), createdAt: data.created_at, updatedAt: data.updated_at };
});
