import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LibraryView } from "@/components/bookshelf/library-view";
import { AppHeader } from "@/components/layout/app-header";
import { UserMenu } from "@/components/layout/user-menu";
import { CelestialSky } from "@/components/sky/celestial-sky";
import { CatWalker } from "@/components/cats/wizard-cats";
import { parseLibraryStyle } from "@/lib/library-style";
import type { BookDesign, BookPattern } from "@/lib/book-design";
import type { ShelfAlbum } from "@/types/app";

// Development-only visual preview of the library with sample data.
// Returns 404 in production builds (unless ENABLE_DEV_PREVIEW=1).
//   ?style=moonlit|floating|tree   ?empty=1   ?cat=0

const titles: [string, string, number, BookDesign, BookPattern][] = [
  ["Summer in Lisbon", "#7a4b2a", 48, "classic", "filigree"],
  ["Our Wedding", "#6b3249", 120, "arch", "stars"],
  ["Kyoto, Spring 2025", "#1b555b", 36, "celestial", "stars"],
  ["Baby’s First Year", "#1f2b57", 210, "astrolabe", "constellations"],
  ["Grandma’s Kitchen", "#8c6a2f", 14, "classic", "none"],
  ["Road Trip West", "#4e2f5e", 64, "celestial", "moons"],
  ["College Days", "#393b71", 22, "astrolabe", "none"],
  ["Christmas 2024", "#6b2a2a", 30, "arch", "filigree"],
  ["Mountains", "#2f4a3a", 8, "celestial", "constellations"],
  ["The Dog Years", "#176d78", 90, "classic", "stars"],
  ["Paris", "#1f2b57", 18, "arch", "moons"],
  ["Family Reunion", "#7a4b2a", 55, "astrolabe", "filigree"],
  ["Beach House", "#d9cfb6", 12, "celestial", "stars"],
];

const albums: ShelfAlbum[] = titles.map(([title, coverColor, photoCount, coverDesign, coverPattern], i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  title,
  description: null,
  coverColor,
  coverDesign,
  coverPattern,
  photoCount,
}));

async function Preview({ searchParams }: { searchParams: PageProps<"/dev/bookshelf">["searchParams"] }) {
  const sp = await searchParams;
  const empty = sp.empty === "1";
  return (
    <LibraryView
      albums={empty ? [] : albums}
      greetingName="Avery Reader"
      focusSearch={sp.search === "1"}
      initialStyle={parseLibraryStyle(typeof sp.style === "string" ? sp.style : undefined)}
      catChance={sp.cat === "0" ? 0 : 1}
    />
  );
}

export default function DevBookshelfPage({ searchParams }: PageProps<"/dev/bookshelf">) {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_PREVIEW !== "1") notFound();
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <CelestialSky />
      <AppHeader
        userSlot={
          <UserMenu user={{ id: "dev", email: "reader@example.com", fullName: "Avery Reader", avatarUrl: null }} />
        }
      />
      <div className="relative z-[1] flex flex-1 flex-col">
        <Suspense fallback={null}>
          <Preview searchParams={searchParams} />
        </Suspense>
      </div>
      <CatWalker firstDelay={[1.5, 2]} every={[20, 30]} />
    </div>
  );
}
