import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Terms & Privacy" };

// Plain-language starter terms. Replace with reviewed legal text before a public launch.
export default function TermsPage() {
  return (
    <div className="flex-1 bg-cream">
      <header className="border-b border-parchment px-4 py-5 sm:px-8">
        <Brand tone="dark" />
      </header>
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-12 text-[15px] leading-relaxed text-ink">
        <h1 className="font-serif text-4xl text-walnut">Terms &amp; Privacy</h1>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl text-walnut">Your content</h2>
          <p>
            You own the photographs and text you upload. You give Memory Shelf permission to store and display them to
            you, and only to you, so the service can work. Please upload only content you have the right to use.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl text-walnut">Privacy</h2>
          <p>
            Your albums are private to your account. Photographs are kept in private storage and are shown through
            short-lived, signed links. We store your name, email address and the files you upload, and we don’t sell
            your data.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl text-walnut">Your account</h2>
          <p>
            Keep your password safe. You can edit your profile at any time, and deleting an album permanently removes
            its photographs.
          </p>
        </section>
        <Link href="/register" className="inline-block font-medium text-leather underline-offset-4 hover:underline">
          ← Back to registration
        </Link>
      </main>
    </div>
  );
}
