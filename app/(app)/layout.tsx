import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";

/** Private, signed-in pages: never index them. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Signed-in area: atmospheric walnut room with the app header. */
export default function AppLayout({ children }: LayoutProps<"/">) {
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
      <AppHeader />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
