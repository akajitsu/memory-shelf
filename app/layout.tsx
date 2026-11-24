import type { Metadata, Viewport } from "next";
import { Cinzel, Cinzel_Decorative, Manrope, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import { ViewTransitionGuard } from "@/components/layout/view-transition-guard";
import "./globals.css";

/** Headings, titles and editorial text. Variable font with optical sizing. */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

/** Engraved capitals of old star charts: headings, book titles, spines. */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

/** Cinzel with ornamental swash capitals: the wordmark and page titles. */
const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-deco",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/** Interface text: navigation, buttons, forms, captions. */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Memory Shelf",
    template: "%s · Memory Shelf",
  },
  description:
    "A private celestial library of photo albums. Bind your memories into books and revisit them among the stars.",
};

export const viewport: Viewport = {
  themeColor: "#080f23",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${newsreader.variable} ${manrope.variable} ${cinzel.variable} ${cinzelDecorative.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <ViewTransitionGuard />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!bg-cosmos !text-ivory !border-ivory/12 !font-sans !shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)]",
              description: "!text-silver",
              success: "[&_[data-icon]]:!text-aurora",
              error: "[&_[data-icon]]:!text-danger",
            },
          }}
        />
      </body>
    </html>
  );
}
