"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/types";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { useClientValidation } from "@/hooks/use-client-validation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialAuthState);
  const { clientErrors, onSubmit } = useClientValidation(
    forgotPasswordSchema,
    (fd) => ({ email: fd.get("email") }),
  );
  const errors = { ...state.fieldErrors, ...clientErrors };


  return (
    <div className="space-y-6">
      {state.status === "success" ? (
        <FormAlert tone="success">{state.message}</FormAlert>
      ) : (
        <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-5">
          {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}
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
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-leather underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
    </div>
  );
}
