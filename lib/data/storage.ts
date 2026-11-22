import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SIGNED_URL_TTL_SECONDS, STORAGE_BUCKET } from "@/lib/constants";
import type { Database } from "@/types/database";

/**
 * Create short-lived signed URLs for private storage objects in one request.
 * Storage policies ensure only the owner's paths can be signed.
 * Returns a map of path -> URL (paths that fail are omitted).
 */
export async function signStoragePaths(
  supabase: SupabaseClient<Database>,
  paths: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const out = new Map<string, string>();
  if (unique.length === 0) return out;

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error("[storage] sign", error.message);
    return out;
  }
  for (const item of data) {
    if (item.signedUrl && item.path) out.set(item.path, item.signedUrl);
  }
  return out;
}
