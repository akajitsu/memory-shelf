"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/types";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { useClientValidation } from "@/hooks/use-client-validation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialAuthState);
  const { clientErrors, onSubmit } = useClientValidation(
    resetPasswordSchema,
    (fd) => ({ password: fd.get("password"), confirmPassword: fd.get("confirmPassword") }),
  );
  const errors = { ...state.fieldErrors, ...clientErrors };


  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="space-y-5">
      {state.status === "error" && state.message && (
        <FormAlert tone="error">
          {state.message}
          {state.code === "session_missing" && (
            <Link href="/forgot-password" className="mt-1 block font-medium underline underline-offset-2">
              Request a new link
            </Link>
          )}
        </FormAlert>
      )}
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        error={errors.password}
        hint="At least 8 characters, with a letter and a number."
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        error={errors.confirmPassword}
      />
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
