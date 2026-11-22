import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create your library" };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading title="Begin your library" subtitle="Create a private shelf for your photo albums." />
      <RegisterForm />
    </>
  );
}
