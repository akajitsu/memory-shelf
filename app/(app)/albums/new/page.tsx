import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { AlbumForm } from "@/components/albums/album-form";
import { requireUser } from "@/lib/auth/dal";
import { NAV_BACK, PageTransition } from "@/components/layout/page-transition";

export const metadata: Metadata = { title: "New album" };

async function Guarded() {
  await requireUser("/albums/new");
  return <AlbumForm />;
}

export default function NewAlbumPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <PageTransition>
        <Link
          href="/library"
          transitionTypes={NAV_BACK}
          className="inline-flex items-center gap-1.5 text-sm text-gold-soft/80 transition-colors hover:text-ivory"
        >
          <ArrowLeft className="size-4" aria-hidden /> Bookshelf
        </Link>
        <h1 className="mt-4 mb-8 font-serif text-4xl font-medium tracking-tight text-ivory sm:text-5xl">
          Bind a new album
        </h1>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" />}>
          <Guarded />
        </Suspense>
      </PageTransition>
    </main>
  );
}
