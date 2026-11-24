import { Suspense, type ReactNode } from "react";
import { getSessionProfile } from "@/lib/auth/dal";
import { Brand } from "./brand";
import { CreateAlbumLink, LibraryLink, SearchButton } from "./header-nav";
import { UserMenu } from "./user-menu";
import { SoundToggle, SoundUnlocker } from "./sound-toggle";

async function HeaderUser() {
  const user = await getSessionProfile();
  if (!user) return null;
  return <UserMenu user={user} />;
}

/**
 * Minimal navigation that floats over the sky: a soft fade instead of a solid bar,
 * so the library stays the focus.
 * @param userSlot Optional override for the account area (used by the dev preview).
 */
export function AppHeader({ userSlot }: { userSlot?: ReactNode } = {}) {
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-40 bg-gradient-to-b from-abyss/95 via-abyss/70 to-transparent"
    >
      <SoundUnlocker />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Brand compact />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-1.5">
          <LibraryLink />
          <SearchButton />
          <CreateAlbumLink />
          <SoundToggle />
          <span aria-hidden className="mx-1 hidden h-5 w-px bg-ivory/10 sm:block" />
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
