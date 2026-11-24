import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { CelestialSky } from "@/components/sky/celestial-sky";

export const metadata: Metadata = { title: "Terms & Privacy" };

// Plain-language starter terms. Replace with reviewed legal text before a public launch.
export default function TermsPage() {
  return (
    <div className="relative flex-1">
      <CelestialSky motes={false} shooting={false} />
      <header className="relative z-[1] px-4 py-5 sm:px-8">
        <Brand />
      </header>
      <main className="night-panel relative z-[1] mx-auto mb-16 max-w-2xl space-y-8 rounded-3xl px-6 py-10 text-[15px] leading-relaxed text-silver sm:px-10">
        <h1 className="title-gilt font-ornate text-[34px] font-normal text-ivory">Terms &amp; Privacy</h1>
        <section className="space-y-2">
          <h2 className="font-display text-[21px] text-ivory">Your content</h2>
          <p>
            You own the photographs and text you upload. You give Memory Shelf permission to store and display them to
            you, and only to you, so the service can work. Please upload only content you have the right to use.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-[21px] text-ivory">Privacy</h2>
          <p>
            Your albums are private to your account. Photographs are kept in private storage and are shown through
            short-lived, signed links. We store your name, email address and the files you upload, and we don’t sell
            your data.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-display text-[21px] text-ivory">Your account</h2>
          <p>
            Keep your password safe. You can edit your profile at any time, and deleting an album permanently removes
            its photographs.
          </p>
        </section>
        <Link href="/register" className="inline-block font-semibold text-aurora underline-offset-4 hover:underline">
          ← Back to registration
        </Link>
      </main>
    </div>
  );
}
