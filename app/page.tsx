import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { DecorativeShelf } from "@/components/auth/decorative-shelf";
import { CelestialSky } from "@/components/sky/celestial-sky";
import { LibraryScene } from "@/components/library/library-scene";
import { HeroOrbit } from "@/components/sky/hero-orbit";

// Public landing page. Signed-in visitors are sent to /library by proxy.ts.
export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-x-clip text-ivory">
      <CelestialSky />
      <div className="relative z-[1] flex flex-1 flex-col">
        <LibraryScene />
        <header className="flex items-center justify-between px-4 py-5 sm:px-8">
          <Brand />
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-silver transition-colors hover:bg-white/[0.06] hover:text-aurora"
          >
            Sign in
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 pb-16 text-center">
          <div className="relative isolate max-w-2xl animate-[fade-up_1000ms_var(--ease-out-soft)_both] space-y-5 py-10">
            <HeroOrbit />
            <p className="eyebrow text-aurora/85">A library of little moments</p>
            <h1 className="font-ornate text-[38px] leading-[1.1] font-normal sm:text-[62px]">
              <span className="title-gilt">Your memories,</span>
              <br />
              <span className="font-serif text-[0.92em] tracking-normal text-moon italic">bound among the stars.</span>
            </h1>
            <p className="mx-auto max-w-md text-[15px] text-silver/85">
              Gather your photographs into books, keep them on a shelf that floats in a quiet night sky, and turn the
              pages whenever you want to remember.
            </p>
          </div>
          <div className="flex animate-[fade-up_1000ms_var(--ease-out-soft)_200ms_both] flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-moon px-8 font-semibold text-abyss shadow-[0_0_0_1px_rgb(232_215_139/0.4),0_10px_30px_-10px_rgb(232_215_139/0.6)] transition-colors hover:bg-[#f0e3a6]"
            >
              Start your library
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-ivory/20 px-8 font-semibold text-ivory transition-colors hover:border-aurora/50 hover:bg-aurora/[0.07] hover:text-aurora"
            >
              I already have one
            </Link>
          </div>
          <div className="mt-6 w-full max-w-md animate-[fade-up_1200ms_var(--ease-out-soft)_400ms_both]">
            <DecorativeShelf />
          </div>
        </main>
      </div>
    </div>
  );
}
