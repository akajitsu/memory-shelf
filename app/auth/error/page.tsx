import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthHeading, AuthShell } from "@/components/auth/auth-shell";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata: Metadata = { title: "Link problem" };

const REASONS: Record<string, string> = {
  expired: "This link has expired or was already used. Links are valid for a limited time and work once.",
  exchange:
    "We couldn’t finish signing you in. If you opened the link in a different browser or device than the one you started from, try again from the original browser.",
  provider: "The sign-in provider reported a problem. Please try again.",
  invalid: "This link is invalid or incomplete.",
};

async function Reason({ searchParams }: { searchParams: PageProps<"/auth/error">["searchParams"] }) {
  const reason = (await searchParams).reason;
  const key = typeof reason === "string" && reason in REASONS ? reason : "invalid";
  return <FormAlert tone="error">{REASONS[key]}</FormAlert>;
}

export default function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  return (
    <AuthShell>
      <AuthHeading title="That link didn’t work" />
      <Suspense fallback={null}>
        <Reason searchParams={searchParams} />
      </Suspense>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        <Link href="/login" className="text-aurora underline-offset-4 hover:underline">
          Sign in
        </Link>
        <Link href="/forgot-password" className="text-aurora underline-offset-4 hover:underline">
          Request a new reset link
        </Link>
      </div>
    </AuthShell>
  );
}
