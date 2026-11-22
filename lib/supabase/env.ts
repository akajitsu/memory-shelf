/**
 * Public Supabase configuration. Both values are safe to ship to the browser;
 * Row Level Security and Storage policies protect all data.
 * Referenced as literal `process.env.NEXT_PUBLIC_*` so Next.js inlines them.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).",
    );
  }
  return { url, key };
}
