"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resendVerification, signIn } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/types";
import { loginSchema } from "@/lib/auth/validation";
import { useClientValidation } from "@/hooks/use-client-validation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { GoogleButton } from "./google-button";
import { OrDivider } from "./auth-shell";

export function LoginForm({ next, notice }: { next?: string; notice?: { tone: "error" | "info"; text: string } }) {
  const [state, formAction, pending] = useActionState(signIn, initialAuthState);
  const [resendState, resendAction, resending] = useActionState(resendVerification, initialAuthState);
  const { clientErrors, onSubmit } = useClientValidation(
    loginSchema,
    (fd) => ({
      email: fd.get("email"),
      password: fd.get("password"),
      remember: fd.get("remember") === "on",
    }),
  );

  const errors = { ...state.fieldErrors, ...clientErrors };
  const email = state.values?.email ?? "";


  return (
    <div>
      {notice && state.status === "idle" && (
        <FormAlert tone={notice.tone} className="mb-6">
          {notice.text}
        </FormAlert>
      )}

      <GoogleButton next={next} />
      <OrDivider />

      <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-5">
        {next && <input type="hidden" name="next" value={next} />}

        {state.status === "error" && state.message && (
          <FormAlert tone="error">
            {state.message}
            {state.code === "email_not_confirmed" && (
              <span className="mt-1 block text-ivory">
                Didn’t get it? Use “Resend verification email” below.
              </span>
            )}
          </FormAlert>
        )}

        <Field
          key={`email-${email}`}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={email}
          error={errors.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password}
          labelAside={
            <Link href="/forgot-password" className="text-[13px] text-aurora underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          }
        />
        <Checkbox id="remember" name="remember" defaultChecked label="Keep me signed in on this device" />

        <Button type="submit" className="w-full" size="lg" loading={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {state.code === "email_not_confirmed" && (
        <form action={resendAction} className="mt-4 space-y-3">
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="ghost" size="sm" className="w-full" loading={resending}>
            Resend verification email
          </Button>
          {resendState.message && (
            <FormAlert tone={resendState.status === "error" ? "error" : "success"}>{resendState.message}</FormAlert>
          )}
        </form>
      )}

      <p className="mt-8 text-center text-sm text-silver/75">
        New here?{" "}
        <Link href="/register" className="font-medium text-aurora underline-offset-4 hover:underline">
          Create your library
        </Link>
      </p>
    </div>
  );
}
