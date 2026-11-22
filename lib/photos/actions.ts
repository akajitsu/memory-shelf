"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { MAX_PHOTOS_PER_ALBUM } from "@/lib/constants";
import type { ActionResult } from "@/lib/albums/types";
import {
  buildObjectPath,
  createUploadTarget,
  isPathInAlbum,
  removeObjects,
  verifyUploadedImage,
} from "@/lib/data/uploads";
import {
  PHOTO_OBJECT_NAME,
  captionSchema,
  cleanFileName,
  finalizeUploadsSchema,
  photoIdSchema,
  reorderSchema,
  requestUploadsSchema,
} from "./validation";
import { thumbPathFor } from "./thumbs";

const SIGNED_OUT: ActionResult<never> = { ok: false, error: "Your session has ended. Please sign in again." };

async function authed() {
  const user = await getSessionUser();
  if (!user) return null;
  return { user, supabase: await createClient() };
}
type Ctx = NonNullable<Awaited<ReturnType<typeof authed>>>;

async function ownsAlbum(ctx: Ctx, albumId: string) {
  const { data } = await ctx.supabase
    .from("albums")
    .select("id")
    .eq("id", albumId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  return !!data;
}

async function photoCount(ctx: Ctx, albumId: string) {
  const { count } = await ctx.supabase
    .from("album_photos")
    .select("id", { count: "exact", head: true })
    .eq("album_id", albumId)
    .eq("user_id", ctx.user.id);
  return count ?? 0;
}

function revalidateAlbum(albumId: string) {
  revalidatePath("/library");
  revalidatePath(`/albums/${albumId}`);
  revalidatePath(`/albums/${albumId}/photos`);
}

// ----------------------------------------------------------------------------- upload

/** Issue signed upload URLs for server-chosen paths in an album the user owns. */
export async function requestPhotoUploads(input: {
  albumId: string;
  files: { contentType: string; size: number; thumbSize?: number }[];
}): Promise<
  ActionResult<{ targets: { signedUrl: string; path: string; thumb: { signedUrl: string; path: string } | null }[] }>
> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;

  const parsed = requestUploadsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid upload." };
  const { albumId, files } = parsed.data;

  if (!(await ownsAlbum(ctx, albumId))) return { ok: false, error: "Album not found." };
  const existing = await photoCount(ctx, albumId);
  if (existing + files.length > MAX_PHOTOS_PER_ALBUM) {
    const room = Math.max(0, MAX_PHOTOS_PER_ALBUM - existing);
    return {
      ok: false,
      error: `Albums hold up to ${MAX_PHOTOS_PER_ALBUM} photos. There’s room for ${room} more.`,
    };
  }

  const targets = await Promise.all(
    files.map(async (f) => {
      const main = await createUploadTarget(ctx.supabase, buildObjectPath(ctx.user.id, albumId, f.contentType));
      if (!main) return null;
      const thumb = f.thumbSize ? await createUploadTarget(ctx.supabase, thumbPathFor(main.path)) : null;
      return { ...main, thumb };
    }),
  );
  if (targets.some((t) => !t)) return { ok: false, error: "We couldn’t prepare the upload. Please try again." };
  return { ok: true, data: { targets: targets as NonNullable<(typeof targets)[number]>[] } };
}

/**
 * Verify uploaded files server-side (real image bytes, type, size) and record them,
 * in the given order, after the album's existing photos. Invalid files are deleted.
 */
export async function finalizePhotoUploads(input: {
  albumId: string;
  items: { path: string; name?: string; hasThumb?: boolean }[];
}): Promise<ActionResult<{ added: number; failed: { path: string; reason: string }[] }>> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;

  const parsed = finalizeUploadsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid upload." };
  const { albumId, items } = parsed.data;
  if (!(await ownsAlbum(ctx, albumId))) return { ok: false, error: "Album not found." };

  const failed: { path: string; reason: string }[] = [];
  const folder = `${ctx.user.id}/${albumId}/`;

  // Only server-shaped photo paths inside this user's album folder are accepted.
  const candidates = items.filter((it) => {
    const ok = isPathInAlbum(it.path, ctx.user.id, albumId) && PHOTO_OBJECT_NAME.test(it.path.slice(folder.length));
    if (!ok) failed.push({ path: it.path, reason: "Invalid upload." });
    return ok;
  });

  // Skip anything already recorded (e.g. a retried request).
  const { data: already } = await ctx.supabase
    .from("album_photos")
    .select("image_path")
    .in("image_path", candidates.length ? candidates.map((c) => c.path) : ["-"]);
  const recorded = new Set((already ?? []).map((r) => r.image_path));
  const fresh = candidates.filter((c) => !recorded.has(c.path));

  const checks = await Promise.all(fresh.map((it) => verifyUploadedImage(ctx.supabase, it.path)));
  const valid = fresh.filter((it, i) => {
    const c = checks[i];
    if (!c.ok) failed.push({ path: it.path, reason: c.reason });
    return c.ok;
  });
  const invalidPaths = fresh.filter((_, i) => !checks[i].ok).map((it) => it.path);
  // Thumbnails live at a path derived from the (verified) photo path; never one the client chose.
  const thumbChecks = await Promise.all(
    fresh.map((it, i) =>
      checks[i].ok && it.hasThumb ? verifyUploadedImage(ctx.supabase, thumbPathFor(it.path)) : null,
    ),
  );
  const badThumbs = fresh
    .filter((it, i) => it.hasThumb && (!checks[i].ok || (thumbChecks[i] && (!thumbChecks[i]!.ok || thumbChecks[i]!.type !== "image/jpeg"))))
    .map((it) => thumbPathFor(it.path));
  if (invalidPaths.length || badThumbs.length) await removeObjects(ctx.supabase, [...invalidPaths, ...badThumbs]);

  if (valid.length === 0) return { ok: true, data: { added: 0, failed } };

  const existing = await photoCount(ctx, albumId);
  if (existing + valid.length > MAX_PHOTOS_PER_ALBUM) {
    await removeObjects(ctx.supabase, valid.flatMap((v) => [v.path, thumbPathFor(v.path)]));
    return { ok: false, error: `Albums hold up to ${MAX_PHOTOS_PER_ALBUM} photos.` };
  }

  const { data: last } = await ctx.supabase
    .from("album_photos")
    .select("display_order")
    .eq("album_id", albumId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.display_order ?? -1) + 1;

  const { error } = await ctx.supabase.from("album_photos").insert(
    valid.map((it, i) => ({
      album_id: albumId,
      image_path: it.path,
      image_name: cleanFileName(it.name),
      display_order: start + i,
    })),
  );
  if (error) {
    console.error("[photos] insert", error.message);
    await removeObjects(ctx.supabase, valid.flatMap((v) => [v.path, thumbPathFor(v.path)]));
    return { ok: false, error: "We couldn’t save your photos. Please try again." };
  }

  revalidateAlbum(albumId);
  return { ok: true, data: { added: valid.length, failed } };
}

// ----------------------------------------------------------------------------- edit

export async function updatePhotoCaption(input: { photoId: string; caption: string }): Promise<ActionResult<{ caption: string | null }>> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;
  const parsed = captionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid caption." };

  const { data, error } = await ctx.supabase
    .from("album_photos")
    .update({ caption: parsed.data.caption })
    .eq("id", parsed.data.photoId)
    .eq("user_id", ctx.user.id)
    .select("album_id, caption")
    .maybeSingle();
  if (error) {
    console.error("[photos] caption", error.message);
    return { ok: false, error: "We couldn’t save the caption." };
  }
  if (!data) return { ok: false, error: "Photo not found." };
  revalidatePath(`/albums/${data.album_id}`);
  return { ok: true, data: { caption: data.caption } };
}

export async function reorderPhotos(input: { albumId: string; photoIds: string[] }): Promise<ActionResult> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid order." };
  const { albumId, photoIds } = parsed.data;
  if (new Set(photoIds).size !== photoIds.length) return { ok: false, error: "Invalid order." };
  if (!(await ownsAlbum(ctx, albumId))) return { ok: false, error: "Album not found." };

  // Runs as the caller: RLS limits it to the user's own photos in this album.
  const { error } = await ctx.supabase.rpc("reorder_album_photos", { p_album_id: albumId, p_photo_ids: photoIds });
  if (error) {
    console.error("[photos] reorder", error.message);
    return { ok: false, error: "We couldn’t save the new order." };
  }
  revalidatePath(`/albums/${albumId}`);
  return { ok: true, data: undefined };
}

export async function deletePhoto(photoId: string): Promise<ActionResult> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;
  if (!photoIdSchema.safeParse(photoId).success) return { ok: false, error: "Photo not found." };

  const { data, error } = await ctx.supabase
    .from("album_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", ctx.user.id)
    .select("album_id, image_path")
    .maybeSingle();
  if (error) {
    console.error("[photos] delete", error.message);
    return { ok: false, error: "We couldn’t delete the photo." };
  }
  if (!data) return { ok: false, error: "Photo not found." };

  await removeObjects(ctx.supabase, [data.image_path, thumbPathFor(data.image_path)]);
  revalidateAlbum(data.album_id);
  return { ok: true, data: undefined };
}
