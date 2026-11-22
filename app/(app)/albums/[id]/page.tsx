import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ImagePlus, Pencil } from "lucide-react";
import { AlbumBook } from "@/components/albums/album-book";
import { DeleteAlbumButton } from "@/components/albums/delete-album-button";
import { AlbumBookPlaceholder } from "@/components/albums/album-book-placeholder";
import { NAV_FORWARD, PageTransition } from "@/components/layout/page-transition";
import { FlashToast } from "@/components/ui/flash-toast";
import { getAlbum } from "@/lib/data/albums";
import { getAlbumPhotos } from "@/lib/data/photos";
import { NotFoundView } from "@/components/layout/not-found-view";

export async function generateMetadata({ params }: PageProps<"/albums/[id]">): Promise<Metadata> {
  const album = await getAlbum((await params).id);
  return { title: album?.title ?? "Album" };
}

async function AlbumContent({ params, searchParams }: PageProps<"/albums/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [album, photos] = await Promise.all([getAlbum(id), getAlbumPhotos(id)]);
  // Rendered (not thrown): this runs inside a streaming Suspense boundary.
  if (!album) return <NotFoundView />;

  const notice = sp.created === "1" ? "Album created." : sp.saved === "1" ? "Changes saved." : undefined;

  const actions = (
    <>
      <Link
        href={`/albums/${album.id}/photos`}
        transitionTypes={NAV_FORWARD}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-3.5 text-sm font-medium text-walnut-deep transition-colors hover:bg-gold-soft"
      >
        <ImagePlus className="size-4" aria-hidden />
        {album.photoCount ? (
          <>
            <span className="sm:hidden">Photos</span>
            <span className="hidden sm:inline">Add &amp; arrange photos</span>
          </>
        ) : (
          "Add photos"
        )}
      </Link>
      <Link
        href={`/albums/${album.id}/edit`}
        transitionTypes={NAV_FORWARD}
        aria-label="Edit album"
        className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-ivory/80 transition-colors hover:bg-white/5 hover:text-ivory sm:px-3.5"
      >
        <Pencil className="size-4" aria-hidden /> <span className="hidden sm:inline">Edit</span>
      </Link>
      <DeleteAlbumButton albumId={album.id} title={album.title} photoCount={album.photoCount} />
    </>
  );

  return (
    <>
      <FlashToast message={notice} />
      <h1 className="sr-only">{album.title}</h1>
      <AlbumBook
        coverColor={album.coverColor}
        coverUrl={album.coverUrl}
        photos={photos}
        actions={actions}
        meta={{
          id: album.id,
          title: album.title,
          description: album.description,
          createdAt: album.createdAt,
          photoCount: album.photoCount,
        }}
      />
    </>
  );
}

export default function AlbumPage(props: PageProps<"/albums/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-clip px-3 pt-6 pb-12 sm:px-6">
      <PageTransition>
        {/* The loading state is the same closed book, so the swap is seamless and the
            book itself animates open (no extra fade/rise on top of it). */}
        <Suspense fallback={<AlbumBookPlaceholder />}>
          <AlbumContent {...props} />
        </Suspense>
      </PageTransition>
    </main>
  );
}
