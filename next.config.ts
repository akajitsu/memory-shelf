import { existsSync } from "node:fs";
import type { NextConfig } from "next";

/**
 * Background music: drop a licensed track at public/audio/starlight.mp3 and it is
 * picked up at build time (restart `npm run dev` after adding it). Without the
 * file, the music controls show it as unavailable and nothing is requested.
 */
const MUSIC_FILE = "audio/starlight.mp3";
const musicSrc = existsSync(`public/${MUSIC_FILE}`) ? `/${MUSIC_FILE}` : "";

const securityHeaders = [
  // Never render inside another site's frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Don't let browsers guess content types (e.g. treat an upload as HTML).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (album ids) to other origins.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app needs no camera, microphone, location, etc.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // HTTPS only once deployed (ignored by browsers on http://localhost).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_MUSIC_SRC: musicSrc },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      // Tailwind processes global stylesheets. CSS Modules are excluded so they keep
      // their scoped class-name exports (the `as: "*.css"` rename would otherwise
      // turn *.module.css into plain global CSS).
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
