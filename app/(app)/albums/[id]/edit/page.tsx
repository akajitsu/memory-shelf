import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { AlbumForm } from "@/components/albums/album-form";
import { getAlbum } from "@/lib/data/albums";
import { NAV_BACK, PageTransition } from "@/components/layout/page-transition";
import { NotFoundView } from "@/components/layout/not-found-view";

export const metadata: Metadata = { title: "Edit album" };

async function EditContent({ params }: { params: PageProps<"/albums/[id]/edit">["params"] }) {
  const { id } = await params;
  const album = await getAlbum(id);
  // Rendered (not thrown): this runs inside a streaming Suspense boundary.
  if (!album) return <NotFoundView />;

  return (
    <>
      <Link
        href={`/albums/${album.id}`}
        transitionTypes={NAV_BACK}
        className="inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-sm font-medium text-silver transition-colors hover:text-aurora"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to album
      </Link>
      <h1 className="mt-4 mb-8 title-gilt font-ornate text-[32px] leading-[1.12] font-normal text-ivory sm:text-[42px]">Edit album</h1>
      <AlbumForm
        initial={{
          id: album.id,
          title: album.title,
          description: album.description,
          coverColor: album.coverColor,
          coverDesign: album.coverDesign,
          coverPattern: album.coverPattern,
        }}
      />
    </>
  );
}

export default function EditAlbumPage({ params }: PageProps<"/albums/[id]/edit">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <PageTransition>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-cosmos/60" />}>
          <EditContent params={params} />
        </Suspense>
      </PageTransition>
    </main>
  );
}
