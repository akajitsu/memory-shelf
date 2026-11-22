import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LibraryView } from "@/components/bookshelf/library-view";
import { AppHeader } from "@/components/layout/app-header";
import { UserMenu } from "@/components/layout/user-menu";
import type { ShelfAlbum } from "@/types/app";

// Development-only visual preview of the bookshelf with sample data.
// Returns 404 in production builds.

const sampleCover =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c98b"/><stop offset="1" stop-color="#c76b4a"/></linearGradient></defs><rect width="80" height="100" fill="url(#s)"/><circle cx="56" cy="34" r="10" fill="#fff3d6"/><path d="M0 72 L22 52 L40 66 L58 48 L80 66 V100 H0Z" fill="#5a3d2e"/></svg>`,
  );

const titles: [string, string, number, boolean][] = [
  ["Summer in Lisbon", "#7a4b2a", 48, true],
  ["Our Wedding", "#6b2a2a", 120, true],
  ["Kyoto, Spring 2025", "#2f4a3a", 36, false],
  ["Baby’s First Year", "#28344d", 210, true],
  ["Grandma’s Kitchen", "#8c6a2f", 14, false],
  ["Road Trip West", "#4d2f45", 64, false],
  ["College Days", "#3d4447", 22, true],
  ["Christmas 2024", "#6b2a2a", 30, false],
  ["Mountains", "#2f4a3a", 8, false],
  ["The Dog Years", "#5a4030", 90, true],
  ["Paris", "#28344d", 18, false],
  ["Family Reunion", "#7a4b2a", 55, false],
  ["Beach House", "#e8d8b0", 12, false],
];

const albums: ShelfAlbum[] = titles.map(([title, coverColor, photoCount, hasCover], i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  title,
  description: null,
  coverColor,
  coverUrl: hasCover ? sampleCover : null,
  photoCount,
}));

async function Preview({ searchParams }: { searchParams: PageProps<"/dev/bookshelf">["searchParams"] }) {
  const empty = (await searchParams).empty === "1";
  return <LibraryView albums={empty ? [] : albums} />;
}

export default function DevBookshelfPage({ searchParams }: PageProps<"/dev/bookshelf">) {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_PREVIEW !== "1") notFound();
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col bg-walnut-deep">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -5%, rgb(212 187 138 / 0.13), transparent 65%), radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.45))",
        }}
      />
      <AppHeader
        userSlot={
          <UserMenu user={{ id: "dev", email: "reader@example.com", fullName: "Avery Reader", avatarUrl: null }} />
        }
      />
      <div className="relative">
        <Suspense fallback={null}>
          <Preview searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
