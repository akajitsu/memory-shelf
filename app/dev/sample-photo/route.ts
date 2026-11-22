// Development-only: a sample photo served with an artificial delay, to test that the
// album waits for its pictures before opening. 404 in production.
import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_DEV_PREVIEW !== "1") notFound();
  const i = Number(request.nextUrl.searchParams.get("i") ?? 0);
  const delay = Math.min(5000, Number(request.nextUrl.searchParams.get("delay") ?? 900));
  await new Promise((r) => setTimeout(r, delay));
  const hues = [28, 205, 335, 95, 40, 220, 45];
  const h = hues[i % hues.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 75%)"/><stop offset="1" stop-color="hsl(${h} 45% 45%)"/></linearGradient></defs><rect width="80" height="60" fill="url(#g)"/><circle cx="56" cy="19" r="8" fill="#fff8e4"/><path d="M0 45 L24 31 L40 40 L60 27 L80 38 V60 H0Z" fill="hsl(${h} 35% 22%)"/></svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "no-store" } });
}
