import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/types/database";
import { REMEMBER_COOKIE, shouldRemember, withRememberPreference } from "@/lib/auth/remember";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create a new one per request — never share across requests.
 * Reads request cookies, so callers in Server Components must render inside <Suspense>.
 *
 * @param opts.remember Override the "remember me" preference (used at sign-in,
 *                      before the preference cookie is visible to this request).
 */
export async function createClient(opts: { remember?: boolean } = {}) {
  const cookieStore = await cookies();
  // Per-user data must render at request time. Supabase Auth reads the clock
  // (Date.now) to check token expiry, which Cache Components forbids during prerender.
  await connection();
  const { url, key } = getSupabaseEnv();
  const remember = opts.remember ?? shouldRemember(cookieStore.get(REMEMBER_COOKIE)?.value);

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, withRememberPreference(options, remember)),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
