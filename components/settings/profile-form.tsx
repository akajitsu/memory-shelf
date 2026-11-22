"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/profile/actions";
import { initialAuthState } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, initialAuthState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      {state.status === "error" && state.message && <FormAlert tone="error">{state.message}</FormAlert>}
      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        maxLength={120}
        required
        defaultValue={state.values?.fullName ?? fullName}
        error={state.fieldErrors?.fullName}
      />
      <Field label="Email" name="email" type="email" value={email} readOnly disabled hint="Your sign-in email can’t be changed here." />
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
