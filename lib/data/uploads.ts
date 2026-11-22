import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, STORAGE_BUCKET, type AllowedImageType } from "@/lib/constants";
import { EXTENSION_FOR, sniffImageType } from "@/lib/images/sniff";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export function isAllowedType(t: string): t is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(t);
}

/** Server-chosen path inside the owner's album folder. Clients never choose paths. */
export function buildObjectPath(userId: string, albumId: string, type: AllowedImageType, prefix = "") {
  return `${userId}/${albumId}/${prefix}${randomUUID()}.${EXTENSION_FOR[type]}`;
}

/** True if `path` is directly inside this user's album folder (optionally with a filename prefix). */
export function isPathInAlbum(path: string, userId: string, albumId: string, prefix = "") {
  const folder = `${userId}/${albumId}/`;
  if (!path.startsWith(folder + prefix)) return false;
  const name = path.slice(folder.length);
  return /^[A-Za-z0-9._-]+$/.test(name) && !name.includes("..");
}

/** Signed one-time upload URL for a server-chosen path. Storage RLS re-checks album ownership. */
export async function createUploadTarget(supabase: Client, path: string) {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[uploads] sign upload", error?.message);
    return null;
  }
  return { signedUrl: data.signedUrl, path: data.path };
}

/**
 * Verify an uploaded object really is an allowed image: fetch only its first bytes,
 * check the magic number, the stored content type, and the size.
 */
export async function verifyUploadedImage(
  supabase: Client,
  path: string,
): Promise<{ ok: true; type: AllowedImageType; size: number } | { ok: false; reason: string }> {
  const { data: signed, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60);
  if (error || !signed) return { ok: false, reason: "The uploaded file could not be found." };

  const res = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-31" }, cache: "no-store" });
  if (!res.ok) return { ok: false, reason: "The uploaded file could not be found." };

  const head = new Uint8Array(await res.arrayBuffer()).slice(0, 32);
  const sniffed = sniffImageType(head);
  const declared = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const total = Number(res.headers.get("content-range")?.split("/")[1] ?? res.headers.get("content-length") ?? NaN);

  if (!sniffed) return { ok: false, reason: "That file isn’t a valid image." };
  if (declared && declared !== sniffed) return { ok: false, reason: "The file’s type doesn’t match its contents." };
  if (!Number.isFinite(total) || total <= 0 || total > MAX_IMAGE_BYTES) {
    return { ok: false, reason: "The file is empty or larger than 10 MB." };
  }
  return { ok: true, type: sniffed, size: total };
}

export async function removeObjects(supabase: Client, paths: string[]) {
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(batch);
    if (error) console.error("[uploads] remove", error.message);
  }
}

/** Delete every file in an album's storage folder. */
export async function removeAlbumFolder(supabase: Client, userId: string, albumId: string) {
  const folder = `${userId}/${albumId}`;
  const all: string[] = [];
  // Collect every path first, then delete, so pagination offsets stay valid.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(folder, { limit: 1000, offset });
    if (error) {
      console.error("[uploads] list", error.message);
      break;
    }
    all.push(...data.filter((f) => f.id).map((f) => `${folder}/${f.name}`));
    if (data.length < 1000) break;
  }
  await removeObjects(supabase, all);
  return all.length;
}
