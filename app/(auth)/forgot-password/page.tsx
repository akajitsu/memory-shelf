import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Forgot your password?"
        subtitle="Enter your email and we’ll send you a link to choose a new one."
      />
      <ForgotPasswordForm />
    </>
  );
}
