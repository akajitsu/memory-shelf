"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE } from "./remember";
import { getSiteUrl, safeNextPath } from "./redirects";
import type { AuthFormState } from "./types";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendSchema,
  resetPasswordSchema,
} from "./validation";

async function siteUrl() {
  return getSiteUrl((await headers()).get("origin"));
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

/** Map Supabase auth errors to safe, friendly messages (no account enumeration). */
function friendlyAuthError(error: AuthError): { message: string; code?: string } {
  switch (error.code) {
    case "invalid_credentials":
      return { message: "That email and password don't match. Please try again." };
    case "email_not_confirmed":
      return {
        message: "Please confirm your email address first. Check your inbox for the verification link.",
        code: "email_not_confirmed",
      };
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return { message: "Too many attempts. Please wait a minute and try again." };
    case "weak_password":
      return { message: "That password is too weak. Try a longer, less common one." };
    case "same_password":
      return { message: "Your new password must be different from the current one." };
    case "signup_disabled":
      return { message: "New registrations are currently closed." };
    default:
      console.error("[auth]", error.code, error.message);
      return { message: "Something went wrong. Please try again." };
  }
}

async function setRememberCookie(remember: boolean) {
  const store = await cookies();
  if (remember) {
    store.delete(REMEMBER_COOKIE);
  } else {
    // No maxAge: a browser-session cookie, cleared when the browser closes.
    store.set(REMEMBER_COOKIE, "0", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
}

// ----------------------------------------------------------------------------- Sign in

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
    remember: formData.get("remember") === "on",
  });
  const values = { email: str(formData, "email") };
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const { email, password, remember } = parsed.data;
  await setRememberCookie(remember);
  const supabase = await createClient({ remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { status: "error", ...friendlyAuthError(error), values };
  }

  redirect(safeNextPath(str(formData, "next")));
}

// ----------------------------------------------------------------------------- Register

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    fullName: str(formData, "fullName"),
    email: str(formData, "email"),
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
    terms: formData.get("terms") === "on",
  });
  const values = { email: str(formData, "email"), fullName: str(formData, "fullName") };
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const { fullName, email, password } = parsed.data;
  await setRememberCookie(true);
  const supabase = await createClient({ remember: true });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/library`,
    },
  });
  if (error) {
    return { status: "error", ...friendlyAuthError(error), values };
  }

  // Email confirmation disabled in Supabase: the user is signed in immediately.
  if (data.session) redirect("/library");

  // Same response whether or not the email already had an account (prevents enumeration).
  return {
    status: "success",
    message: `We sent a verification link to ${email}. Open it to activate your library.`,
    values: { email },
  };
}

// ----------------------------------------------------------------------------- Resend verification

export async function resendVerification(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resendSchema.safeParse({ email: str(formData, "email") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/library` },
  });
  if (error && error.code !== "user_not_found") {
    return { status: "error", ...friendlyAuthError(error) };
  }
  return { status: "success", message: "If that account is awaiting verification, a new link is on its way." };
}

// ----------------------------------------------------------------------------- Google OAuth

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNextPath(str(formData, "next"));
  await setRememberCookie(true);
  const supabase = await createClient({ remember: true });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    console.error("[auth] google", error?.code, error?.message);
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

// ----------------------------------------------------------------------------- Password reset

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: str(formData, "email") });
  const values = { email: str(formData, "email") };
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/confirm?next=/reset-password`,
  });
  if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")) {
    return { status: "error", ...friendlyAuthError(error), values };
  }
  if (error) console.error("[auth] reset", error.code, error.message);

  // Always the same answer, so the form can't be used to probe for accounts.
  return {
    status: "success",
    message: "If an account exists for that address, a password reset link is on its way.",
    values,
  };
}

export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: str(formData, "password"),
    confirmPassword: str(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      status: "error",
      message: "Your reset link has expired. Please request a new one.",
      code: "session_missing",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", ...friendlyAuthError(error) };
  }
  redirect("/library?password=updated");
}

// ----------------------------------------------------------------------------- Sign out

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).delete(REMEMBER_COOKIE);
  redirect("/login?signedOut=1");
}
