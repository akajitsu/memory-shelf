"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/dal";
import { fieldErrors } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import {
  buildObjectPath,
  createUploadTarget,
  isPathInAlbum,
  removeAlbumFolder,
  removeObjects,
  verifyUploadedImage,
} from "@/lib/data/uploads";
import type { ActionResult } from "./types";
import { albumFieldsSchema, albumIdSchema, uploadRequestSchema, type AlbumFields } from "./validation";

const COVER_PREFIX = "cover-";

/** Every action re-establishes identity on the server; nothing from the client is trusted. */
async function authed() {
  const user = await getSessionUser();
  if (!user) return null;
  return { user, supabase: await createClient() };
}

const SIGNED_OUT: ActionResult<never> = { ok: false, error: "Your session has ended. Please sign in again." };

/** Load an album only if it belongs to the current user. */
async function ownAlbum(ctx: NonNullable<Awaited<ReturnType<typeof authed>>>, albumId: string) {
  const { data } = await ctx.supabase
    .from("albums")
    .select("id, cover_image_path")
    .eq("id", albumId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  return data;
}

function revalidateAlbum(albumId: string) {
  revalidatePath("/library");
  revalidatePath(`/albums/${albumId}`);
}

// ----------------------------------------------------------------------------- create / update

export async function createAlbum(input: AlbumFields): Promise<ActionResult<{ id: string }>> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;

  const parsed = albumFieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const { title, description, coverColor } = parsed.data;
  // user_id is not sent: the database fills it from the session (auth.uid()).
  const { data, error } = await ctx.supabase
    .from("albums")
    .insert({ title, description, cover_color: coverColor })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[albums] create", error?.message);
    return { ok: false, error: "We couldn’t create the album. Please try again." };
  }
  revalidateAlbum(data.id);
  return { ok: true, data: { id: data.id } };
}

export async function updateAlbum(albumId: string, input: AlbumFields): Promise<ActionResult<{ id: string }>> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;
  if (!albumIdSchema.safeParse(albumId).success) return { ok: false, error: "Album not found." };

  const parsed = albumFieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const { title, description, coverColor } = parsed.data;
  const { data, error } = await ctx.supabase
    .from("albums")
    .update({ title, description, cover_color: coverColor })
    .eq("id", albumId)
    .eq("user_id", ctx.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[albums] update", error.message);
    return { ok: false, error: "We couldn’t save your changes. Please try again." };
  }
  if (!data) return { ok: false, error: "Album not found." };
  revalidateAlbum(albumId);
  return { ok: true, data: { id: albumId } };
}

// ----------------------------------------------------------------------------- cover image

export async function requestCoverUpload(input: {
  albumId: string;
  contentType: string;
  size: number;
}): Promise<ActionResult<{ signedUrl: string; path: string }>> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid upload." };
  const { albumId, contentType } = parsed.data;

  if (!(await ownAlbum(ctx, albumId))) return { ok: false, error: "Album not found." };

  const path = buildObjectPath(ctx.user.id, albumId, contentType, COVER_PREFIX);
  const target = await createUploadTarget(ctx.supabase, path);
  if (!target) return { ok: false, error: "We couldn’t prepare the upload. Please try again." };
  return { ok: true, data: target };
}

export async function finalizeCoverUpload(input: { albumId: string; path: string }): Promise<ActionResult> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;
  const { albumId, path } = input;
  if (!albumIdSchema.safeParse(albumId).success || typeof path !== "string") {
    return { ok: false, error: "Invalid upload." };
  }
  if (!isPathInAlbum(path, ctx.user.id, albumId, COVER_PREFIX)) return { ok: false, error: "Invalid upload." };

  const album = await ownAlbum(ctx, albumId);
  if (!album) return { ok: false, error: "Album not found." };

  const check = await verifyUploadedImage(ctx.supabase, path);
  if (!check.ok) {
    await removeObjects(ctx.supabase, [path]);
    return { ok: false, error: check.reason };
  }

  const { error } = await ctx.supabase
    .from("albums")
    .update({ cover_image_path: path })
    .eq("id", albumId)
    .eq("user_id", ctx.user.id);
  if (error) {
    console.error("[albums] set cover", error.message);
    await removeObjects(ctx.supabase, [path]);
    return { ok: false, error: "We couldn’t save the cover. Please try again." };
  }

  if (album.cover_image_path && album.cover_image_path !== path) {
    await removeObjects(ctx.supabase, [album.cover_image_path]);
  }
  revalidateAlbum(albumId);
  return { ok: true, data: undefined };
}

export async function removeCover(albumId: string): Promise<ActionResult> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;
  if (!albumIdSchema.safeParse(albumId).success) return { ok: false, error: "Album not found." };

  const album = await ownAlbum(ctx, albumId);
  if (!album) return { ok: false, error: "Album not found." };
  if (!album.cover_image_path) return { ok: true, data: undefined };

  const { error } = await ctx.supabase
    .from("albums")
    .update({ cover_image_path: null })
    .eq("id", albumId)
    .eq("user_id", ctx.user.id);
  if (error) return { ok: false, error: "We couldn’t remove the cover. Please try again." };

  await removeObjects(ctx.supabase, [album.cover_image_path]);
  revalidateAlbum(albumId);
  return { ok: true, data: undefined };
}

// ----------------------------------------------------------------------------- delete

export async function deleteAlbum(albumId: string): Promise<ActionResult> {
  const ctx = await authed();
  if (!ctx) return SIGNED_OUT;
  if (!albumIdSchema.safeParse(albumId).success) return { ok: false, error: "Album not found." };
  if (!(await ownAlbum(ctx, albumId))) return { ok: false, error: "Album not found." };

  // Delete the row first (photo rows cascade), so the album disappears even if
  // file cleanup is interrupted. Storage policies still allow removing the files.
  const { error } = await ctx.supabase.from("albums").delete().eq("id", albumId).eq("user_id", ctx.user.id);
  if (error) {
    console.error("[albums] delete", error.message);
    return { ok: false, error: "We couldn’t delete the album. Please try again." };
  }

  await removeAlbumFolder(ctx.supabase, ctx.user.id, albumId);
  // Drop cached copies of the album's own pages too, so the browser Back button
  // can't resurface a deleted album.
  revalidateAlbum(albumId);
  revalidatePath(`/albums/${albumId}/photos`);
  revalidatePath(`/albums/${albumId}/edit`);
  redirect("/library?deleted=1");
}
