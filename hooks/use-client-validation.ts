"use client";

import { useState, type FormEvent } from "react";
import type { z } from "zod";
import { fieldErrors } from "@/lib/auth/validation";

/**
 * Instant client-side validation that runs in onSubmit and cancels submission
 * (without resetting the form) when invalid. The server action validates again.
 */
export function useClientValidation<T extends z.ZodType>(
  schema: T,
  toInput: (fd: FormData) => unknown,
) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = schema.safeParse(toInput(new FormData(event.currentTarget)));
    if (!parsed.success) {
      event.preventDefault();
      setErrors(fieldErrors(parsed.error));
      const firstInvalid = event.currentTarget.querySelector<HTMLInputElement>(
        `[name="${String(parsed.error.issues[0]?.path[0] ?? "")}"]`,
      );
      firstInvalid?.focus();
      return;
    }
    setErrors({});
  }

  return { clientErrors: errors, onSubmit };
}
