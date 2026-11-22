import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, requireUser, type SessionUser } from "@/lib/auth/dal";

export type AccountInfo = SessionUser & {
  providers: string[];
  createdAt: string | null;
  albumCount: number;
};

export async function getAccountInfo(): Promise<AccountInfo> {
  await requireUser("/settings");
  const user = (await getSessionProfile())!;
  const supabase = await createClient();
  const [{ data: auth }, { count }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("albums").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const providers = (auth.user?.app_metadata?.providers as string[] | undefined) ??
    (auth.user?.app_metadata?.provider ? [auth.user.app_metadata.provider as string] : []);
  return { ...user, providers, createdAt: auth.user?.created_at ?? null, albumCount: count ?? 0 };
}
