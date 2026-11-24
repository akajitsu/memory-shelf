"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full rounded-xl border border-ivory/12 bg-abyss/60 px-3.5 text-[15px] text-ivory shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)] " +
  "placeholder:text-silver/45 transition-colors hover:border-ivory/20 focus:border-aurora/60 focus:outline-none focus:ring-2 focus:ring-aurora/20 " +
  "aria-[invalid=true]:border-danger/60 aria-[invalid=true]:focus:ring-danger/20 disabled:opacity-60";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Right-aligned element next to the label, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
};

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, hint, labelAside, id, type = "text", className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-[13px] font-semibold tracking-wide text-silver">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputClass, isPassword && "pr-11", className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-silver/70 hover:text-ivory"
            aria-label={reveal ? "Hide password" : "Show password"}
            aria-pressed={reveal}
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[13px] text-silver/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
