"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { resendVerification, signUp } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/types";
import { registerSchema } from "@/lib/auth/validation";
import { useClientValidation } from "@/hooks/use-client-validation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { GoogleButton } from "./google-button";
import { OrDivider } from "./auth-shell";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUp, initialAuthState);
  const [resendState, resendAction, resending] = useActionState(resendVerification, initialAuthState);
  const { clientErrors, onSubmit } = useClientValidation(
    registerSchema,
    (fd) => ({
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      password: fd.get("password"),
      confirmPassword: fd.get("confirmPassword"),
      terms: fd.get("terms") === "on",
    }),
  );
  const errors = { ...state.fieldErrors, ...clientErrors };

  useEffect(() => {
    if (state.status === "success") toast.success("Account created — check your email to verify it.");
  }, [state]);


  if (state.status === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-aurora/12 text-aurora">
          <MailCheck className="size-7" aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-[26px] text-ivory">Check your inbox</h2>
          <p className="text-[15px] text-silver/75">{state.message}</p>
        </div>
        <form action={resendAction} className="space-y-3">
          <input type="hidden" name="email" value={state.values?.email ?? ""} />
          <Button type="submit" variant="secondary" className="w-full" loading={resending}>
            Resend verification email
          </Button>
          {resendState.message && (
            <FormAlert tone={resendState.status === "error" ? "error" : "success"}>{resendState.message}</FormAlert>
          )}
        </form>
        <Link href="/login" className="inline-block text-sm font-medium text-aurora underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <GoogleButton label="Sign up with Google" />
      <p className="mt-2 text-center text-xs text-silver/75">
        By continuing with Google you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>
        .
      </p>
      <OrDivider />

      <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-5">
        {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}

        <Field
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={120}
          defaultValue={state.values?.fullName}
          error={errors.fullName}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.values?.email}
          error={errors.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          error={errors.confirmPassword}
        />
        <Checkbox
          id="terms"
          name="terms"
          error={errors.terms}
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="text-aurora underline underline-offset-2" target="_blank">
                Terms &amp; Privacy Policy
              </Link>
              .
            </>
          }
        />

        <Button type="submit" className="w-full" size="lg" loading={pending}>
          {pending ? "Creating your library…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-silver/75">
        Already have a library?{" "}
        <Link href="/login" className="font-medium text-aurora underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
