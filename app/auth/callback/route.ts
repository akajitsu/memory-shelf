import type { NextRequest } from "next/server";
import { completeAuthRedirect } from "@/lib/auth/callback";

/** OAuth providers (Google) redirect here after sign-in. */
export async function GET(request: NextRequest) {
  return completeAuthRedirect(request);
}
