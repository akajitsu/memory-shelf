import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlbumBook } from "@/components/albums/album-book";
import { AlbumBookPlaceholder } from "@/components/albums/album-book-placeholder";
import { AlbumForm } from "@/components/albums/album-form";
import { AppHeader } from "@/components/layout/app-header";
import { UserMenu } from "@/components/layout/user-menu";
import { PhotoManager } from "@/components/photos/photo-manager";
import { CelestialSky } from "@/components/sky/celestial-sky";
import type { AlbumPhotoView } from "@/types/app";

// Development-only visual preview of album screens with sample data. 404 in production.
//   /dev/album             -> open book with photos
//   /dev/album?view=empty  -> open book, no photos
//   /dev/album?view=manage -> upload + arrange
//   /dev/album?view=new | edit -> album form

function svgPhoto(a: string, b: string, sun: string, hill: string, portrait = false) {
  const [w, h] = portrait ? [60, 80] : [80, 60];
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.32}" r="${w * 0.1}" fill="${sun}"/><path d="M0 ${h * 0.75} L${w * 0.3} ${h * 0.52} L${w * 0.5} ${h * 0.66} L${w * 0.75} ${h * 0.45} L${w} ${h * 0.64} V${h} H0Z" fill="${hill}"/></svg>`,
    )
  );
}

const palette: [string, string, string, string][] = [
  ["#f6c98b", "#c76b4a", "#fff3d6", "#5a3d2e"],
  ["#9ccbe6", "#4b7fa6", "#fffbe8", "#2f4a3a"],
  ["#f3b6b0", "#9b5b78", "#fff0e0", "#4d2f45"],
  ["#d9e6c3", "#7f9a5e", "#fffde8", "#3d5130"],
  ["#ffd9a0", "#e08a3c", "#fff7d6", "#6b3a1e"],
  ["#c9d6ea", "#6d7fa6", "#f6f2ff", "#28344d"],
  ["#efe0c0", "#b89a62", "#ffffff", "#5a4030"],
  ["#b9e0dc", "#3f8c8a", "#fffbe8", "#1b555b"],
  ["#e6c6e0", "#8a5a8f", "#fff4fb", "#393b71"],
  ["#f2d7a6", "#a8723f", "#fff8e6", "#4e2f5e"],
];
const captions = [
  "The first morning, coffee by the river",
  "Tiles everywhere",
  null,
  "Sunset from the castle walls",
  "Grandpa’s favourite bench",
  null,
  "Last night of the trip",
  "Harbour lights",
  null,
  "Pastéis de nata, again",
];

const photos: AlbumPhotoView[] = palette.map(([a, b, s, h], i) => ({
  id: `00000000-0000-4000-9000-${String(i).padStart(12, "0")}`,
  url: svgPhoto(a, b, s, h, i % 3 === 2),
  thumbUrl: null,
  name: `IMG_${2040 + i}.jpg`,
  caption: captions[i],
  order: i,
  addedAt: `2026-07-${String(14 + i).padStart(2, "0")}T10:00:00Z`,
}));

const meta = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Summer in Lisbon",
  description: "Two weeks of tiled streets, late dinners and the 28 tram.\nJuly 2025.",
  createdAt: "2026-07-14T10:00:00Z",
  photoCount: photos.length,
};

async function View({ searchParams }: { searchParams: PageProps<"/dev/album">["searchParams"] }) {
  const sp = await searchParams;
  const view = sp.view;
  // ?delay=ms simulates a slow server; ?remote=ms serves photos with a network delay.
  const delay = Number(sp.delay ?? 0);
  if (delay > 0) await new Promise((r) => setTimeout(r, Math.min(delay, 5000)));
  const remote = sp.remote ? Number(sp.remote) : 0;
  const shown = remote
    ? photos.map((p, i) => ({ ...p, url: `/dev/sample-photo?i=${i}&delay=${remote}`, thumbUrl: null }))
    : photos;
  const book = { coverColor: "#1b555b", coverDesign: "celestial", coverPattern: "stars" } as const;
  if (view === "new") return <AlbumForm />;
  if (view === "edit")
    return <AlbumForm initial={{ ...meta, coverColor: "#6b3249", coverDesign: "arch", coverPattern: "filigree" }} />;
  if (view === "manage") return <PhotoManager albumId={meta.id} photos={photos} />;
  if (view === "empty") return <AlbumBook meta={{ ...meta, photoCount: 0 }} photos={[]} {...book} coverColor="#2f4a3a" />;
  return <AlbumBook meta={meta} photos={shown} {...book} />;
}

export default function DevAlbumPage({ searchParams }: PageProps<"/dev/album">) {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_PREVIEW !== "1") notFound();
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-clip">
      <CelestialSky />
      <AppHeader userSlot={<UserMenu user={{ id: "dev", email: "reader@example.com", fullName: "Avery Reader", avatarUrl: null }} />} />
      <main className="relative z-[1] mx-auto w-full max-w-6xl px-3 pt-6 pb-12 sm:px-6">
        <Suspense fallback={<AlbumBookPlaceholder />}>
          <View searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
