import type { CookieOptions } from "@supabase/ssr";

/**
 * "Remember me" preference. When the user signs in with it unchecked we set this
 * cookie to "0" (as a browser-session cookie) and every place that writes Supabase
 * auth cookies strips their max-age, so the session ends when the browser closes.
 */
export const REMEMBER_COOKIE = "ms-remember";

export function shouldRemember(value: string | undefined): boolean {
  return value !== "0";
}

/** Adjust Supabase auth cookie options according to the remember preference. */
export function withRememberPreference(options: CookieOptions, remember: boolean): CookieOptions {
  // maxAge 0 means "delete this cookie" — always honor deletions.
  if (remember || options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
