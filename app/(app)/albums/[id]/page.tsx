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
import { SkyMood } from "@/components/sky/celestial-sky";

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
        className="inline-flex h-10 items-center gap-2 rounded-full border border-moon/40 bg-moon/[0.08] px-4 text-sm font-semibold text-moon transition-[background-color,border-color] hover:border-moon/70 hover:bg-moon/[0.14]"
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
        className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-silver transition-colors hover:bg-white/[0.06] hover:text-aurora sm:px-3.5"
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
        coverDesign={album.coverDesign}
        coverPattern={album.coverPattern}
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
    <main className="mx-auto w-full max-w-6xl px-3 pt-6 pb-12 sm:px-6">
      {/* The sky settles while a book is open, so the photographs hold the attention. */}
      <SkyMood mood="calm" />
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
