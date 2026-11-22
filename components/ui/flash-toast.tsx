"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Shows a one-time success toast, then removes the triggering query flag from the URL. */
export function FlashToast({ message }: { message?: string }) {
  useEffect(() => {
    if (!message) return;
    toast.success(message);
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [message]);
  return null;
}
