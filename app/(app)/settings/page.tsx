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

function Card({ id, title, description, children }: { id?: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="night-panel scroll-mt-24 rounded-3xl p-5 text-ivory sm:p-7">
      <div className="mb-5">
        <h2 className="font-display text-[21px] text-ivory">{title}</h2>
        {description && <p className="mt-1 text-sm text-silver/75">{description}</p>}
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
      <div className="flex items-center gap-4 rounded-3xl border border-aurora/15 bg-gradient-to-r from-lagoon/30 to-dusk/20 p-5">
        <Avatar user={account} size={56} />
        <div className="min-w-0">
          <p className="truncate font-display text-[22px] text-ivory">{account.fullName || "Your account"}</p>
          <p className="truncate text-sm text-silver/80">
            {account.albumCount} {account.albumCount === 1 ? "album" : "albums"}
            {account.createdAt && ` · Member since ${dateFmt.format(new Date(account.createdAt))}`}
          </p>
        </div>
      </div>

      <Card id="profile" title="Profile" description="How your name appears in your library.">
        <ProfileForm fullName={account.fullName ?? ""} email={account.email ?? ""} />
      </Card>

      <Card
        title="Password"
        description={hasPassword ? "Change the password you use to sign in." : undefined}
      >
        {hasPassword ? (
          <PasswordForm />
        ) : (
          <p className="text-sm text-silver/80">
            You sign in with {hasGoogle ? "Google" : "an external provider"}, so there’s no password to change here.
            {hasGoogle && " Manage your password in your Google account."}
          </p>
        )}
      </Card>

      <Card title="Session">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-silver/80">
            Signed in as <span className="text-ivory">{account.email}</span>
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
          className="inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-sm font-medium text-silver transition-colors hover:text-aurora"
        >
          <ArrowLeft className="size-4" aria-hidden /> My library
        </Link>
        <h1 className="mt-4 mb-8 title-gilt font-ornate text-[32px] leading-[1.12] font-normal text-ivory sm:text-[42px]">
          Account settings
        </h1>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-cosmos/60" />}>
          <SettingsContent />
        </Suspense>
      </PageTransition>
    </main>
  );
}
