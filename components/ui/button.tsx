import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  // Moonlight: the one bright action on a screen.
  primary:
    "bg-moon text-abyss shadow-[0_0_0_1px_rgb(232_215_139/0.4),0_8px_24px_-10px_rgb(232_215_139/0.55)] hover:bg-[#f0e3a6] hover:shadow-[0_0_0_1px_rgb(232_215_139/0.6),0_10px_30px_-8px_rgb(232_215_139/0.7)]",
  secondary:
    "border border-ivory/15 bg-white/[0.04] text-ivory hover:border-aurora/45 hover:bg-aurora/[0.07] hover:text-white",
  ghost: "text-silver hover:bg-white/[0.06] hover:text-ivory",
  danger: "bg-danger-strong text-ivory shadow-sm hover:bg-[#b44a5a]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-[15px] gap-2",
  icon: "size-10",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] duration-200",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
});
