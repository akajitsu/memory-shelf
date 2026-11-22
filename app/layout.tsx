import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ViewTransitionGuard } from "@/components/layout/view-transition-guard";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Memory Shelf",
    template: "%s · Memory Shelf",
  },
  description:
    "A private digital library of photo albums. Create memory books, fill them with photographs, and revisit them on your own bookshelf.",
};

export const viewport: Viewport = {
  themeColor: "#22170f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <ViewTransitionGuard />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!bg-ivory !text-ink !border-parchment !font-sans",
              description: "!text-muted",
            },
          }}
        />
      </body>
    </html>
  );
}
