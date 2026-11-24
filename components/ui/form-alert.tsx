import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormAlert({
  tone,
  children,
  className,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed",
        tone === "error" && "border-danger/30 bg-danger/[0.08] text-danger",
        tone === "success" && "border-success/30 bg-success/[0.08] text-success",
        tone === "info" && "border-aurora/25 bg-aurora/[0.07] text-ivory",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
