import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton, AuthHeading } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/auth/redirects";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, { tone: "error" | "info"; text: string }> = {
  oauth: { tone: "error", text: "Google sign-in couldn’t be completed. Please try again." },
  reset_expired: { tone: "error", text: "That password reset link has expired. Request a new one below." },
  signedOut: { tone: "info", text: "You’ve been signed out. See you soon." },
};

async function LoginFormWithParams({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const rawNext = one(sp.next);
  const next = rawNext ? safeNextPath(rawNext) : undefined;
  const error = one(sp.error);
  const notice = (error && NOTICES[error]) || (one(sp.signedOut) ? NOTICES.signedOut : undefined);
  return <LoginForm next={next} notice={notice} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to return to your bookshelf." />
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </>
  );
}
