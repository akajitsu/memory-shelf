"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePassword } from "@/lib/profile/actions";
import { initialAuthState } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialAuthState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  const e = state.fieldErrors ?? {};
  return (
    <form ref={formRef} action={action} className="space-y-5">
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}
      <Field
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={e.currentPassword}
      />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        error={e.password}
        hint="At least 8 characters, with a letter and a number."
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        error={e.confirmPassword}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? "Updating…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
