import type { ReactNode } from "react";
import { Brand } from "@/components/layout/brand";
import { CelestialSky } from "@/components/sky/celestial-sky";
import { DecorativeShelf } from "./decorative-shelf";
import { HeroOrbit } from "@/components/sky/hero-orbit";

export { Brand };

/** Authentication screens: the library's doorway among the stars, with the form on a night panel. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-dvh flex-1 overflow-x-clip lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <CelestialSky shooting={false} />

      {/* Atmospheric side */}
      <aside className="relative z-[1] hidden flex-col justify-between p-10 text-ivory lg:flex">
        <Brand />
        <div className="relative isolate space-y-12">
          <HeroOrbit size="small" />
          <DecorativeShelf />
          <blockquote className="mx-auto max-w-sm text-center">
            <p className="font-serif text-[26px] leading-snug text-ivory/90 italic">
              “Every book on the shelf holds a season of your life.”
            </p>
          </blockquote>
        </div>
        <p className="text-xs text-silver/60">Your albums are private to your account.</p>
      </aside>

      {/* Form side */}
      <main className="relative z-[1] flex flex-col px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="night-panel w-full max-w-[460px] animate-[fade-up_800ms_var(--ease-out-soft)_both] rounded-3xl px-6 py-8 sm:px-9 sm:py-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-8 space-y-2">
      <h1 className="title-gilt font-ornate text-[30px] leading-[1.15] font-normal text-ivory">{title}</h1>
      {subtitle && <p className="text-[15px] text-silver/80">{subtitle}</p>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] text-silver/50 uppercase" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-ivory/15" />
      or
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-ivory/15" />
    </div>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading form">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-white/[0.07]" />
          <div className="h-11 animate-pulse rounded-xl bg-white/[0.05]" />
        </div>
      ))}
      <div className="h-12 animate-pulse rounded-full bg-moon/20" />
    </div>
  );
}
