import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <>
      <LoaderCircle className={cn("animate-spin", className)} aria-hidden />
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}
