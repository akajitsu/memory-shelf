/** Where signed-in users land by default. */
export const DEFAULT_AUTHED_PATH = "/library";

/**
 * Accept only same-site relative paths for post-auth redirects.
 * Blocks open redirects such as "https://evil.com", "//evil.com" and "/\evil.com".
 */
export function safeNextPath(next: unknown, fallback: string = DEFAULT_AUTHED_PATH): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 512) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}

/**
 * Public origin used in auth emails and OAuth redirects.
 * Prefers NEXT_PUBLIC_SITE_URL; falls back to the request origin (useful on Vercel
 * preview deployments). Supabase additionally checks redirect URLs against the
 * project's allow-list, so a spoofed origin cannot receive auth codes.
 */
export function getSiteUrl(requestOrigin?: string | null): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (requestOrigin) return requestOrigin.replace(/\/+$/, "");
  return "http://localhost:3000";
}
