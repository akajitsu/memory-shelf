import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { Avatar } from "@/components/layout/user-menu";
import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { getAccountInfo } from "@/lib/data/account";
import { NAV_BACK, PageTransition } from "@/components/layout/page-transition";

export const metadata: Metadata = { title: "Account settings" };

const dateFmt = new Intl.DateTimeFormat("en", { dateStyle: "long" });

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-parchment bg-ivory p-5 text-ink shadow-[var(--shadow-paper)] sm:p-7">
      <div className="mb-5">
        <h2 className="font-serif text-2xl text-walnut">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

async function SettingsContent() {
  const account = await getAccountInfo();
  const hasPassword = account.providers.includes("email");
  const hasGoogle = account.providers.includes("google");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-gold/15 bg-white/[0.03] p-5">
        <Avatar user={account} size={56} />
        <div className="min-w-0">
          <p className="truncate font-serif text-2xl text-ivory">{account.fullName || "Your account"}</p>
          <p className="truncate text-sm text-gold-soft/70">
            {account.albumCount} {account.albumCount === 1 ? "album" : "albums"}
            {account.createdAt && ` · Member since ${dateFmt.format(new Date(account.createdAt))}`}
          </p>
        </div>
      </div>

      <Card title="Profile" description="How your name appears in your library.">
        <ProfileForm fullName={account.fullName ?? ""} email={account.email ?? ""} />
      </Card>

      <Card
        title="Password"
        description={hasPassword ? "Change the password you use to sign in." : undefined}
      >
        {hasPassword ? (
          <PasswordForm />
        ) : (
          <p className="text-sm text-muted">
            You sign in with {hasGoogle ? "Google" : "an external provider"}, so there’s no password to change here.
            {hasGoogle && " Manage your password in your Google account."}
          </p>
        )}
      </Card>

      <Card title="Session">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Signed in as <span className="text-ink">{account.email}</span>
            {hasGoogle && " via Google"}.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="secondary">
              <LogOut className="size-4" aria-hidden /> Sign out
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <PageTransition>
        <Link
          href="/library"
          transitionTypes={NAV_BACK}
          className="inline-flex items-center gap-1.5 text-sm text-gold-soft/80 transition-colors hover:text-ivory"
        >
          <ArrowLeft className="size-4" aria-hidden /> Bookshelf
        </Link>
        <h1 className="mt-4 mb-8 font-serif text-4xl font-medium tracking-tight text-ivory sm:text-5xl">
          Account settings
        </h1>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" />}>
          <SettingsContent />
        </Suspense>
      </PageTransition>
    </main>
  );
}
