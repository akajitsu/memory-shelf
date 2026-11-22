import type { Metadata } from "next";
import { Suspense } from "react";
import { LibraryView } from "@/components/bookshelf/library-view";
import { ContentIn, PageTransition, SkeletonOut } from "@/components/layout/page-transition";
import { LibrarySkeleton } from "@/components/bookshelf/library-skeleton";
import { getShelfAlbums } from "@/lib/data/albums";

export const metadata: Metadata = { title: "Your library" };

async function Library({ searchParams }: { searchParams: PageProps<"/library">["searchParams"] }) {
  const [albums, sp] = await Promise.all([getShelfAlbums(), searchParams]);
  const notice =
    sp.password === "updated"
      ? "Your password has been updated."
      : sp.deleted === "1"
        ? "The album was deleted."
        : undefined;
  return <LibraryView albums={albums} notice={notice} />;
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
