import type { NextRequest } from "next/server";
import { completeAuthRedirect } from "@/lib/auth/callback";

/** Email verification and password-recovery links land here. */
export async function GET(request: NextRequest) {
  return completeAuthRedirect(request);
}
