import Link from "next/link";
import { Brand } from "@/components/auth/auth-shell";
import { DecorativeShelf } from "@/components/auth/decorative-shelf";

// Public landing page. Signed-in visitors are sent to /library by proxy.ts.
export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-walnut-deep text-ivory">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 38%, rgb(212 187 138 / 0.14), transparent 70%)" }}
      />
      <header className="relative flex items-center justify-between px-4 py-5 sm:px-8">
        <Brand />
        <Link
          href="/login"
          className="rounded-lg px-4 py-2 text-sm font-medium text-gold-soft transition-colors hover:bg-white/5 hover:text-ivory"
        >
          Sign in
        </Link>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center gap-12 px-4 pb-16 text-center">
        <div className="max-w-2xl space-y-5">
          <h1 className="font-serif text-5xl leading-[1.05] font-medium tracking-tight sm:text-7xl">
            Your memories,
            <br />
            <span className="text-gold-soft italic">bound like books.</span>
          </h1>
          <p className="mx-auto max-w-md text-base text-ivory/70">
            Gather your photographs into albums, line them up on a shelf of your own, and turn the pages whenever you
            want to remember.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-gold px-7 font-medium text-walnut-deep shadow-sm transition-colors hover:bg-gold-soft"
          >
            Start your library
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-gold/40 px-7 font-medium text-ivory transition-colors hover:bg-white/5"
          >
            I already have one
          </Link>
        </div>
        <div className="w-full max-w-md">
          <DecorativeShelf />
        </div>
      </main>
    </div>
  );
}
