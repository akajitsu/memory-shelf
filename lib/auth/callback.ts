import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "./redirects";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

function errorRedirect(request: NextRequest, reason: string) {
  return NextResponse.redirect(new URL(`/auth/error?reason=${encodeURIComponent(reason)}`, request.url));
}

/**
 * Completes an auth flow that returns to the app:
 *  - ?token_hash=…&type=…  (email links using the recommended token-hash templates)
 *  - ?code=…               (OAuth, or email links using Supabase's default templates)
 *  - ?error=…              (provider or Supabase reported a failure)
 */
export async function completeAuthRedirect(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  let next = safeNextPath(params.get("next"));

  if (params.get("error")) {
    const desc = params.get("error_code") ?? params.get("error") ?? "unknown";
    return errorRedirect(request, desc === "otp_expired" ? "expired" : "provider");
  }

  const supabase = await createClient();

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return errorRedirect(request, error.code === "otp_expired" ? "expired" : "invalid");
    if (type === "recovery") next = "/reset-password";
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Most often: the link was opened in a different browser than the one that started the flow.
      console.error("[auth] code exchange", error.code, error.message);
      return errorRedirect(request, "exchange");
    }
    return NextResponse.redirect(new URL(next, request.url));
  }

  return errorRedirect(request, "invalid");
}
