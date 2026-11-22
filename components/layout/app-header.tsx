import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Brand } from "@/components/auth/auth-shell";
import { getSessionProfile } from "@/lib/auth/dal";
import { UserMenu } from "./user-menu";
import { SoundToggle, SoundUnlocker } from "./sound-toggle";
import { NAV_BACK, NAV_FORWARD } from "@/components/layout/page-transition";

async function HeaderUser() {
  const user = await getSessionProfile();
  if (!user) return null;
  return <UserMenu user={user} />;
}

/** @param userSlot Optional override for the account area (used by the dev preview). */
export function AppHeader({ userSlot }: { userSlot?: ReactNode } = {}) {
  return (
    <header style={{ viewTransitionName: "site-header" }} className="sticky top-0 z-40 border-b border-gold/10 bg-walnut-deep/85 backdrop-blur-md">
      <SoundUnlocker />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/library"
            transitionTypes={NAV_BACK}
            className="hidden rounded-lg px-3 py-2 text-sm text-gold-soft transition-colors hover:bg-white/5 hover:text-ivory sm:inline-flex"
          >
            Bookshelf
          </Link>
          <Link
            href="/albums/new"
            transitionTypes={NAV_FORWARD}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gold px-3 text-sm font-medium text-walnut-deep transition-colors hover:bg-gold-soft"
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">New album</span>
            <span className="sr-only sm:hidden">New album</span>
          </Link>
          <SoundToggle />
          {userSlot ?? (
            <Suspense fallback={<span className="size-9 animate-pulse rounded-full bg-white/10" />}>
              <HeaderUser />
            </Suspense>
          )}
        </nav>
      </div>
    </header>
  );
}
