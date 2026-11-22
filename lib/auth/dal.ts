import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

/**
 * Data Access Layer: the single place that establishes who the user is.
 *
 * Uses getClaims(), which verifies the session JWT's signature and expiry
 * (locally against the project's published signing keys, falling back to the
 * Auth server for legacy secrets). This avoids a network round-trip on every
 * page render. Deduplicated per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: claims.sub,
    email: str(claims.email),
    fullName: str(meta.full_name) ?? str(meta.name),
    avatarUrl: str(meta.avatar_url) ?? str(meta.picture),
  };
});

/**
 * The user plus their stored profile (fresh name/avatar after edits). Used by the
 * header and settings; data pages only need getSessionUser().
 */
export const getSessionProfile = cache(async (): Promise<SessionUser | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: profile?.email ?? user.email,
    fullName: profile?.full_name ?? user.fullName,
    avatarUrl: profile?.avatar_url ?? user.avatarUrl,
  };
});

/** Require a signed-in user, otherwise redirect to login. */
export async function requireUser(nextPath?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return user;
}
