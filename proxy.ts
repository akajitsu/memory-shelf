import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { DEFAULT_AUTHED_PATH } from "@/lib/auth/redirects";

/** Pages that require a signed-in user. */
const PROTECTED_PREFIXES = ["/library", "/albums", "/settings", "/reset-password"];
/** Pages a signed-in user has no reason to see. */
const GUEST_ONLY = ["/", "/login", "/register", "/forgot-password"];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Refreshes the Supabase session cookie and performs optimistic redirects.
 * This is NOT the only protection: every protected page and server action
 * re-verifies the user on the server (lib/auth/dal.ts), and RLS guards the data.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const redirectWithCookies = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    // Carry over any refreshed session cookies and their no-cache headers.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    for (const h of ["cache-control", "expires", "pragma"]) {
      const v = response.headers.get(h);
      if (v) redirect.headers.set(h, v);
    }
    return redirect;
  };

  if (!userId && PROTECTED_PREFIXES.some((p) => matches(pathname, p))) {
    const url = new URL("/login", request.url);
    if (pathname !== "/reset-password") url.searchParams.set("next", `${pathname}${search}`);
    else url.searchParams.set("error", "reset_expired");
    return redirectWithCookies(url);
  }

  if (userId && GUEST_ONLY.includes(pathname)) {
    return redirectWithCookies(new URL(DEFAULT_AUTHED_PATH, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, image optimization, and files with extensions.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
