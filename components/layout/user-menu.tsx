"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Library, LogOut, Plus, Settings, UserRound } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import type { SessionUser } from "@/lib/auth/dal";
import { NAV_BACK, NAV_FORWARD } from "@/components/layout/page-transition";

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2)).toUpperCase();
}

export function Avatar({ user, size = 36 }: { user: Pick<SessionUser, "fullName" | "email" | "avatarUrl">; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (user.avatarUrl && !broken) {
    return (
      // External provider avatar (e.g. Google); no optimization needed for a tiny image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-turquoise to-dusk font-semibold text-ivory shadow-[inset_0_0_0_1px_rgb(240_235_221/0.15)]"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(user.fullName, user.email)}
    </span>
  );
}

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    rootRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-silver transition-colors hover:bg-aurora/[0.08] hover:text-ivory focus:bg-aurora/[0.08] focus:text-ivory focus:outline-none";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex cursor-pointer items-center rounded-full ring-2 ring-transparent transition hover:ring-aurora/40 focus-visible:ring-aurora"
      >
        <span className="sr-only">Account menu</span>
        <Avatar user={user} />
      </button>

      <AnimatePresence>
        {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -4 }}
          transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
          id={menuId}
          role="menu"
          aria-label="Account"
          className="night-panel absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl p-1.5"
        >
          <div className="flex items-center gap-3 px-3 pt-2.5 pb-3">
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              <p className="truncate font-display text-[16px] leading-tight text-ivory">{user.fullName || "Your account"}</p>
              <p className="truncate text-xs text-silver/70">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-ivory/8" />
          <div className="py-1">
            <Link href="/library" transitionTypes={NAV_BACK} role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <Library className="size-4 text-aurora/70" aria-hidden /> My library
            </Link>
            <Link href="/albums/new" transitionTypes={NAV_FORWARD} role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <Plus className="size-4 text-aurora/70" aria-hidden /> Create album
            </Link>
            <Link href="/settings#profile" transitionTypes={NAV_FORWARD} role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <UserRound className="size-4 text-aurora/70" aria-hidden /> Profile
            </Link>
            <Link href="/settings" transitionTypes={NAV_FORWARD} role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <Settings className="size-4 text-aurora/70" aria-hidden /> Settings
            </Link>
          </div>
          <div className="h-px bg-ivory/8" />
          <form action={signOut} className="pt-1">
            <button type="submit" role="menuitem" className={itemClass}>
              <LogOut className="size-4 text-aurora/70" aria-hidden /> Sign out
            </button>
          </form>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
