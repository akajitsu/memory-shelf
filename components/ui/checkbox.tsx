import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  error?: string;
};

export function Checkbox({ label, error, id, className, ...props }: CheckboxProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-ink", className)}>
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-parchment accent-walnut"
          {...props}
        />
        <span className="leading-snug">{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} className="pl-6.5 text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
