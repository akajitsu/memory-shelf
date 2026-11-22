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
        className="inline-flex items-center gap-1.5 text-sm text-gold-soft/80 transition-colors hover:text-ivory"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to album
      </Link>
      <h1 className="mt-4 mb-8 font-serif text-4xl font-medium tracking-tight text-ivory sm:text-5xl">Edit album</h1>
      <AlbumForm
        initial={{
          id: album.id,
          title: album.title,
          description: album.description,
          coverColor: album.coverColor,
          coverUrl: album.coverUrl,
        }}
      />
    </>
  );
}

export default function EditAlbumPage({ params }: PageProps<"/albums/[id]/edit">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <PageTransition>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" />}>
          <EditContent params={params} />
        </Suspense>
      </PageTransition>
    </main>
  );
}
