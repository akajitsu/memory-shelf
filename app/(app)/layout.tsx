import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { CelestialSky } from "@/components/sky/celestial-sky";
import { CatWalker } from "@/components/cats/wizard-cats";

/** Private, signed-in pages: never index them. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Signed-in area: the library floating among the stars. The sky persists across pages. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <CelestialSky />
      <AppHeader />
      {/* Clips sideways overflow (the open book's glow) at the viewport edge, not mid-page. */}
      <div className="relative z-[1] flex flex-1 flex-col overflow-x-clip">{children}</div>
      <CatWalker />
    </div>
  );
}
