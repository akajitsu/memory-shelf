"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

/**
 * Accessible confirmation dialog on the native <dialog> element
 * (built-in focus trapping, Esc to close, inert background).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  pending = false,
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  tone?: "danger" | "primary";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget && !pending) onClose();
      }}
      className="night-panel m-auto w-[min(92vw,440px)] rounded-2xl p-0 text-ivory backdrop:bg-abyss/75 opacity-0 scale-95 transition-[opacity,scale,overlay,display] transition-discrete duration-200 ease-out open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-95 backdrop:opacity-0 backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0"
    >
      <div className="p-6">
        <div className="flex gap-4">
          {tone === "danger" && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/12 text-danger">
              <AlertTriangle className="size-5" aria-hidden />
            </span>
          )}
          <div className="space-y-2">
            <h2 id={titleId} className="font-display text-[21px] leading-tight text-ivory">
              {title}
            </h2>
            <div id={descId} className="text-sm leading-relaxed text-silver">
              {children}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending} autoFocus>
            Cancel
          </Button>
          <Button type="button" variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
