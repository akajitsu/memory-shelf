import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { LibraryView } from "@/components/bookshelf/library-view";
import { ContentIn, PageTransition, SkeletonOut } from "@/components/layout/page-transition";
import { LibrarySkeleton } from "@/components/bookshelf/library-skeleton";
import { getShelfAlbums } from "@/lib/data/albums";
import { getSessionProfile } from "@/lib/auth/dal";
import { LIBRARY_STYLE_COOKIE, parseLibraryStyle } from "@/lib/library-style";

export const metadata: Metadata = { title: "My library" };

async function Library({ searchParams }: { searchParams: PageProps<"/library">["searchParams"] }) {
  const [albums, profile, sp, jar] = await Promise.all([getShelfAlbums(), getSessionProfile(), searchParams, cookies()]);
  const notice =
    sp.password === "updated"
      ? "Your password has been updated."
      : sp.deleted === "1"
        ? "The album was deleted."
        : undefined;
  return (
    <LibraryView
      albums={albums}
      notice={notice}
      greetingName={profile?.fullName}
      focusSearch={sp.search === "1"}
      initialStyle={parseLibraryStyle(jar.get(LIBRARY_STYLE_COOKIE)?.value)}
    />
  );
}

export default function LibraryPage({ searchParams }: PageProps<"/library">) {
  return (
    <PageTransition>
      <Suspense
        fallback={
          <SkeletonOut>
            <LibrarySkeleton />
          </SkeletonOut>
        }
      >
        <ContentIn>
          <Library searchParams={searchParams} />
        </ContentIn>
      </Suspense>
    </PageTransition>
  );
}
