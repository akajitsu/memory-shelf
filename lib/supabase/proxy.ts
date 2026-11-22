import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { REMEMBER_COOKIE, shouldRemember, withRememberPreference } from "@/lib/auth/remember";
import { getSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase session on each request and writes any rotated auth
 * cookies to the response. Returns the response plus the verified user id
 * (or null), for use by route protection in proxy.ts.
 */
export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();
  const remember = shouldRemember(request.cookies.get(REMEMBER_COOKIE)?.value);
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, withRememberPreference(options, remember)),
        );
        // Prevent CDNs from caching a response that carries a session cookie.
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  // getClaims() verifies the JWT signature, so the user id can be trusted.
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;

  return { response, userId };
}
