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
    <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <PageTransition>
        <Link
          href="/library"
          transitionTypes={NAV_BACK}
          className="inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-sm font-medium text-silver transition-colors hover:text-aurora"
        >
          <ArrowLeft className="size-4" aria-hidden /> My library
        </Link>
        <div className="mt-4 mb-9">
          <p className="eyebrow text-aurora/80">A new volume</p>
          <h1 className="mt-2 title-gilt font-ornate text-[32px] leading-[1.12] font-normal text-ivory sm:text-[42px]">
            Bind a new album
          </h1>
          <p className="mt-2 max-w-lg text-sm text-silver/80">
            Give your memories a name and a binding. The book will float onto your shelf; the photographs go inside.
          </p>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-cosmos/60" />}>
          <Guarded />
        </Suspense>
      </PageTransition>
    </main>
  );
}
