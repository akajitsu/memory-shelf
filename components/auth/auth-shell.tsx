import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { DecorativeShelf } from "./decorative-shelf";

export function Brand({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight ${
        tone === "light" ? "text-ivory" : "text-walnut"
      }`}
    >
      <BookOpen className="size-6 text-gold" aria-hidden />
      Memory Shelf
    </Link>
  );
}

/** Two-panel layout for authentication screens. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Atmospheric panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-walnut-deep p-10 text-ivory lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 42%, rgb(212 187 138 / 0.16), transparent 70%)",
          }}
        />
        <Brand />
        <div className="relative space-y-10">
          <DecorativeShelf />
          <blockquote className="mx-auto max-w-sm text-center">
            <p className="font-serif text-2xl leading-snug italic text-ivory/90">
              “Every book on the shelf holds a season of your life.”
            </p>
          </blockquote>
        </div>
        <p className="relative text-xs text-gold-soft/60">Your albums are private to your account.</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-cream px-4 py-8 sm:px-8">
        <div className="lg:hidden">
          <Brand tone="dark" />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-8 space-y-2">
      <h1 className="font-serif text-4xl font-medium tracking-tight text-walnut">{title}</h1>
      {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs tracking-wide text-muted uppercase" aria-hidden>
      <span className="h-px flex-1 bg-parchment" />
      or
      <span className="h-px flex-1 bg-parchment" />
    </div>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading form">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-parchment" />
          <div className="h-11 animate-pulse rounded-lg bg-parchment/70" />
        </div>
      ))}
      <div className="h-11 animate-pulse rounded-lg bg-walnut/20" />
    </div>
  );
}
