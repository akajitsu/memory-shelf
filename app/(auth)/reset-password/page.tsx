import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton, AuthHeading } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Choose a new password" };

/** Reached from the recovery email link, which signs the user in first. */
async function GuardedForm() {
  await requireUser();
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="Choose a new password" subtitle="Pick something memorable — and hard to guess." />
      <Suspense fallback={<AuthFormSkeleton />}>
        <GuardedForm />
      </Suspense>
    </>
  );
}
