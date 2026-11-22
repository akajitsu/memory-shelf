import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { PhotoManager } from "@/components/photos/photo-manager";
import { getAlbum } from "@/lib/data/albums";
import { getAlbumPhotos } from "@/lib/data/photos";
import { NAV_BACK, PageTransition } from "@/components/layout/page-transition";
import { NotFoundView } from "@/components/layout/not-found-view";

export async function generateMetadata({ params }: PageProps<"/albums/[id]/photos">): Promise<Metadata> {
  const album = await getAlbum((await params).id);
  return { title: album ? `Photos · ${album.title}` : "Photos" };
}

async function ManageContent({ params }: { params: PageProps<"/albums/[id]/photos">["params"] }) {
  const { id } = await params;
  const [album, photos] = await Promise.all([getAlbum(id), getAlbumPhotos(id)]);
  // Rendered (not thrown): this runs inside a streaming Suspense boundary.
  if (!album) return <NotFoundView />;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/albums/${album.id}`}
            transitionTypes={NAV_BACK}
            className="inline-flex items-center gap-1.5 text-sm text-gold-soft/80 transition-colors hover:text-ivory"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to album
          </Link>
          <h1 className="mt-3 truncate font-serif text-4xl font-medium tracking-tight text-ivory sm:text-5xl">
            {album.title}
          </h1>
          <p className="mt-1 text-sm text-gold-soft/70">
            {photos.length} {photos.length === 1 ? "photograph" : "photographs"}
          </p>
        </div>
        <Link
          href={`/albums/${album.id}`}
          transitionTypes={NAV_BACK}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gold/30 px-3.5 text-sm text-ivory transition-colors hover:bg-white/5"
        >
          <BookOpen className="size-4" aria-hidden /> View album
        </Link>
      </div>
      <PhotoManager albumId={album.id} photos={photos} />
    </>
  );
}

export default function ManagePhotosPage({ params }: PageProps<"/albums/[id]/photos">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6">
      <PageTransition>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" aria-busy="true" />}>
          <ManageContent params={params} />
        </Suspense>
      </PageTransition>
    </main>
  );
}
