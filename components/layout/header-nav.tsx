"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { NAV_BACK, NAV_FORWARD } from "@/components/layout/page-transition";
import { cn } from "@/lib/utils";

const linkBase =
  "relative hidden h-9 items-center rounded-full px-3.5 text-[13.5px] font-medium text-silver transition-colors hover:text-aurora sm:inline-flex";

function LibraryLinkInner({ active }: { active: boolean }) {
  return (
    <Link
      href="/library"
      transitionTypes={NAV_BACK}
      aria-current={active ? "page" : undefined}
      className={cn(linkBase, active && "text-ivory")}
    >
      My Library
      {active && (
        <span
          aria-hidden
          className="absolute -bottom-0.5 left-1/2 h-px w-5 -translate-x-1/2 bg-gradient-to-r from-transparent via-moon to-transparent"
        />
      )}
    </Link>
  );
}

function LibraryLinkActive() {
  return <LibraryLinkInner active={usePathname() === "/library"} />;
}

/** "My Library", with an active marker. The pathname isn't known while prerendering
 * dynamic album routes, so the unmarked link is the fallback. */
export function LibraryLink() {
  return (
    <Suspense fallback={<LibraryLinkInner active={false} />}>
      <LibraryLinkActive />
    </Suspense>
  );
}

export function CreateAlbumLink() {
  return (
    <Link
      href="/albums/new"
      transitionTypes={NAV_FORWARD}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-moon/35 bg-moon/[0.06] px-3 text-[13.5px] font-semibold text-moon shadow-[0_0_18px_-6px_rgb(232_215_139/0.5)] transition-[background-color,border-color,box-shadow] hover:border-moon/60 hover:bg-moon/[0.12] hover:shadow-[0_0_22px_-4px_rgb(232_215_139/0.6)] sm:px-3.5"
    >
      <Plus className="size-4" aria-hidden />
      <span className="max-sm:sr-only">Create album</span>
    </Link>
  );
}

/** Focuses the library search, or goes to the library and opens it there. */
export function SearchButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        const input = document.getElementById("album-search");
        if (input && input.offsetParent !== null) {
          input.scrollIntoView({ block: "center", behavior: "smooth" });
          input.focus({ preventScroll: true });
        } else {
          router.push("/library?search=1", { transitionTypes: NAV_BACK });
        }
      }}
      aria-label="Search albums"
      title="Search albums ( / )"
      className="flex size-9 cursor-pointer items-center justify-center rounded-full text-silver transition-colors hover:bg-white/[0.06] hover:text-aurora"
    >
      <Search className="size-[18px]" aria-hidden />
    </button>
  );
}
