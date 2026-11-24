@AGENTS.md

# Memory Shelf — project notes

Private digital photo-album app: Next.js 16 (App Router, Cache Components on), React 19, TypeScript, Tailwind 4,
Supabase (Auth, Postgres + RLS, private Storage), Framer Motion, lucide-react, zod, sonner. Deploy target: Vercel.

## Build plan (phases, each verified before moving on)
1. Init ✅ 2. Backend (migrations, RLS, storage) ✅ 3. Auth ✅ (user-tested) 4. 3D bookshelf ✅
5. Album CRUD + settings ✅ 6. Photos ✅ (book viewer, uploader, reorder, captions, delete; UI-tested
via /dev/album?view=…) 7. Animations ✅ 8. Testing ✅ 9. Deploy
Celestial Library redesign (2026-11-23) ✅ — e2e 41/41 against real Supabase (prod build).

## Key decisions
- Next 16: `proxy.ts` replaces middleware. Cache Components is on, so anything reading cookies/searchParams must be
  inside `<Suspense>`. Read `node_modules/next/dist/docs/` before using Next APIs.
- Auth is server-only: server actions in `lib/auth/actions.ts`, route handlers `/auth/confirm` (email links,
  token_hash or code) and `/auth/callback` (OAuth). No browser Supabase client.
- Identity: `lib/auth/dal.ts` (`getSessionUser`/`requireUser`, uses `getUser()`); proxy uses `getClaims()` for
  optimistic redirects only. Re-verify the user in every server action.
- "Remember me" = `ms-remember` cookie + `withRememberPreference()` strips max-age from auth cookies.
- Redirect targets go through `safeNextPath()` (open-redirect guard).
- Database: this Supabase project does NOT auto-grant tables to `authenticated`; every table needs explicit,
  column-level grants (see migration 0002). `user_id`/`id` are never client-insertable — DB defaults set them.
- Storage: private bucket `album-photos`, path `{user_id}/{album_id}/{file}`; JPEG/PNG/WebP/GIF only, 10 MB.
  SQL cannot delete storage objects — use the Storage API (delete files when deleting albums/photos).
- Upload pipeline (reuse for photos): client `prepareImage()` (sniff bytes, downscale → WebP/JPEG, GIF kept) →
  server action issues signed upload URL for a SERVER-CHOSEN path (`buildObjectPath`) after checking album
  ownership → client `uploadWithProgress()` (XHR PUT, real progress) → server action `verifyUploadedImage()`
  (Range-fetch first bytes, magic number + stored content-type + size) before writing the DB row; bad files are
  deleted. Album delete removes the row first (photos cascade), then `removeAlbumFolder()`.
- Server actions return `ActionResult<T>` (`lib/albums/types.ts`); every action calls `getSessionUser()` and
  filters by `user_id` in addition to RLS.
- `lib/supabase/server.ts#createClient` calls `await connection()`: Supabase Auth reads `Date.now()`, which Cache
  Components rejects during prerender ("unstable value Date.now()" dev errors). Keep it there.
- Album book: `lib/album-pages.ts` (title page + 2 photos/page, layout by page number), `components/albums/album-book.tsx`
  (spreads ≥768px, single pages below; arrows/keys/swipe; lightbox). Manage page `/albums/[id]/photos`
  (`PhotoUploader` + dnd-kit `PhotoManager`). Reorder uses the `reorder_album_photos` RPC.
- Animations: route changes use React `<ViewTransition>` via `components/layout/page-transition.tsx`
  (wrap page content, NOT layouts; tag links with `transitionTypes={NAV_FORWARD|NAV_BACK}`; CSS in globals.css;
  header has `viewTransitionName: site-header`). Shelf click → `.opening` CSS pull-out → `router.push(..., BOOK_OPEN)`.
  `AlbumBook` owns the cover open/close (framer `useAnimate`, phases closed/open/closing) and 3D page-turn `Leaf`.
  NEVER animate opacity on a `preserve-3d` element — it flattens 3D and breaks backface-visibility; fade a face.
  Visual QA of motion: capture frame sequences with playwright (screenshots in a loop → contact sheet).
- Smoothness rules (measured; don't regress):
  - Album loading state = `AlbumBookPlaceholder` (same closed book, colors from `lib/book-handoff.ts` set by the
    shelf). No ContentIn/SkeletonOut on the album page. Cover opens only after `whenImagesReady()`.
  - Book pages use ~900px `<id>.thumb.jpg` thumbnails (path derived server-side via `thumbPathFor`, signed in a
    separate request); full image only in the lightbox.
  - Left half is revealed with opacity on `[data-left]` (never clip-path — repaints every frame).
  - GPU warm-up: a 1%-opacity leaf is drawn for 3 frames after opening (first 3D composite compiles Skia shaders,
    ~150 ms). Page-turn motion starts 2 rAFs after the leaf mounts. Phone turn rotates to -90° with no opacity.
  - Audio: `prepareAudio()` in idle time (AudioContext creation ~100 ms on Windows); gesture only resumes.
  - `components/layout/view-transition-guard.tsx` patches `document.startViewTransition` for hidden tabs
    (Edge's "…Document hidden" message isn't in React's ignore list).
- DAL uses `getClaims()` (local JWT verification, no network). Header/settings use `getSessionProfile()`.
- Perf testing: `ENABLE_DEV_PREVIEW=1 npm run build && ENABLE_DEV_PREVIEW=1 next start` exposes /dev pages in a
  prod build (`/dev/album?remote=ms` slow photos, `?delay=ms` slow server). Rebuild without the flag after.
- Dev server errors: POST `/_next/mcp` JSON-RPC `tools/call` `get_errors` (reads errors from open browser sessions).
- Migrations are applied manually by pasting into the Supabase SQL Editor (no CLI link). Verify RLS with
  `supabase/tests/rls_test.sql` (expects "N passed, 0 failed", raised as an intentional error).

- Styling: Tailwind tokens live in `app/globals.css` (celestial palette: abyss/cosmos/deep backgrounds, lagoon/
  turquoise/dusk architecture, moon/aurora/lavender/blush accents, ivory/silver text, paper/ink/gilt for album
  pages). `@theme inline` vars (`--color-*`, `--font-serif`) are NOT available as CSS variables — in CSS Modules
  use base tokens (`--moon`, `--aurora`, `--font-heading` = Newsreader, `--font-body` = Manrope).
  `night-panel` and `eyebrow` are `@utility` classes. No backdrop-filter over the sky (it animates → re-blur).
  `next.config.ts` excludes `*.module.css` from the Tailwind Turbopack loader (otherwise modules export nothing).
- Bookshelf is pure CSS 3D (`components/bookshelf/bookshelf.module.css`); shelves are a repeating background so rows
  wrap without JS measurement. Hover effects only under `@media (hover: hover)`. Books levitate (`.float` bob):
  Playwright `hover()`/`click()` on shelf books fails "element is not stable" — use `mouse.move`/`force: true`.
  `perspective` sits on `.link` (the book's direct parent), not `.slot`.
- Book exteriors never show photos: `cover_design` (classic|celestial|arch|astrolabe) + `cover_pattern`
  (none|stars|constellations|filigree|moons) + `cover_color` (migration 0003; keep `lib/book-design.ts` lists in
  sync with its check constraints). One renderer: `components/books/book-cover.tsx` (container-query units; shelf,
  closed album, form preview). `cover_image_path` is legacy: kept, never displayed/set; files go with the album.
- Sky (`components/sky/`): static SVG star tiles + rotunda in `public/sky/` from `node scripts/generate-sky.mjs`
  (seeded; rerun after editing). Compositor-only animations; `SkyMood calm` (album page) quiets it;
  `data-hidden` on <html> pauses it. Pointer parallax: `useParallax(depth)` (`lib/parallax.ts`, sets `translate`).
- Library scene (`components/library/`) is `fixed` at z-index -1 inside the content layer (behind content, above sky).
- Library styles (`lib/library-style.ts`): moonlit (default, `Bookcase`), floating (`FloatingField`, magic circle),
  tree (`TreeCase`: canopy/roots art + trunk hollows). Choice lives in the `ms-library` cookie (set client-side),
  read in the library page's Suspense'd component so SSR matches; `LibraryView` owns the state and renders the
  matching `LibraryScene` variant. Every style keeps `[role=list]` + `a[aria-label^='Open album: …']` (e2e relies
  on it). Book poses for floating come from `driftFor(id)` CSS vars (`--turn/--tilt/--offset`), rules in
  bookshelf.module.css under `.field`. Tree art: `public/sky/tree-*.svg` from generate-sky.mjs.
- Astrology art: glyph paths + zodiac constellations live in `lib/astro-glyphs.mjs` (shared by React and
  generate-sky.mjs; glyphs are paths because ♈–♓ render as emoji). Components in `components/astro/astro.tsx`
  (ZodiacWheel, AstrolabeArt, ArmillaryRings, ConstellationFigure, MoonPhases, signForTitle). Book design keys are
  stored in the DB and kept; only names/art changed: classic=Zodiac Wheel, celestial=Lunar Phases,
  arch=Observatory, astrolabe=Astrolabe; pattern "filigree" = Zodiac glyphs. Sky adds `zodiac-wheel.svg`
  (slow rotation) + `constellations.svg`. Each album's sign = signForTitle(title) (spine, title page, Observatory).
- Great Tree is grounded: `tree-ground.svg` + mist/spores in a full-bleed `.ground` that runs to the page bottom
  (tree style drops the page's bottom padding and flexes to fill); the fixed hollow scene has no floor.
- Type: Cinzel Decorative (`font-ornate`, + `title-gilt` utility) for the wordmark and page titles, Cinzel
  (`font-display`; `--font-title` in CSS Modules) for headings, book titles and spines, Newsreader italic for
  descriptions/captions/quotes, Manrope for UI. `eyebrow` utility draws a sparkle before the label.
- Ambient motion: `ConstellationTracer` (CSS-only, constellations draw in turn), aurora ribbons, star flares,
  zodiac wheel turning (300s) in CelestialSky; `HeroOrbit` on the start page and auth screens; theme extras
  (moonbeam, crown wheel, rising glyphs on the magic circle, falling leaves in the tree). All transform/opacity
  (tracer animates stroke-dashoffset on small SVGs); reduced-motion collapses them via the global rule.
- SSR'd SVG built with Math.sin/cos must round coordinates (`r2`): the last digit differs between Node and the
  browser and causes hydration attribute mismatches.
- Logo = wizard-cat badge (`BrandMark` in `components/layout/brand.tsx`; `useId` for gradient ids). Same art in
  `app/icon.svg`; `app/apple-icon.png` rendered from it (180px, full-bleed). `MoonMark` is the crescent ornament.
- Background music (`lib/music.ts`): local file `public/audio/starlight.mp3`, detected in next.config.ts at
  build/dev start → `NEXT_PUBLIC_MUSIC_SRC` ("" = unavailable, nothing requested). Starts on first gesture
  (`SoundUnlocker`), fades in, gain max 0.4 × volume (default 0.12) via a GainNode on the shared AudioContext
  (`getAudioContext()` in lib/sound.ts; element.volume is fixed on iOS). Pauses when hidden, stops when the
  signed-in layout unmounts. Never play YouTube audio hidden/extracted (YouTube ToS).
- Wizard cats (`components/cats/`): SVG, random only after mount (`useMountRandom`) to avoid hydration mismatch.
  PerchedCat (bookcase crown), SleepingTomeCat (first tome), CatWalker (app layout; skips calm/hidden/reduced
  motion), AlbumCompanion (beside open book, wide only). All aria-hidden, pointer-events none.
- Album pages cycle stack → scrapbook(3) → single → offset (`lib/album-pages.ts`). Dates print in UTC
  (`lib/dates.ts`) so SSR and client match. Photo `addedAt` = upload time (labelled "Added").
- Upload pipeline client half is shared: `lib/photos/upload-client.ts#uploadPhotoFiles` (PhotoUploader and the
  create form's "Photographs for the pages").
- Book-open extras: `[data-glow]` (moonlight, opacity anim), `[data-sparks]` burst (attribute toggled directly),
  two `[data-riffle]` flat pages (-90°→-180°, only on first open — guard selectors: framer throws on no match in dev).
  The glow overflows sideways; `overflow-x-clip` lives on the (app) layout wrapper, not on `main`.
- Visual checks: `/dev/bookshelf` (dev-only sample data, 404 in prod) +
  `MSYS_NO_PATHCONV=1 node scripts/screenshot.mjs <outDir> http://localhost:3100 "name=/path@WxH#hover=sel#click=sel"`
  (uses system Edge/Chrome via playwright-core).

- E2E: `npm run test:e2e -- <baseUrl> <outDir>` against a running app; needs `.env.test.local` with
  E2E_USER_A/B_EMAIL/PASSWORD (auto-confirmed Supabase users e2e-a/e2e-b@example.com). Covers CRUD, uploads,
  thumbnails, reorder/captions, mobile fit, cross-user isolation via the real REST/Storage API, cleanup.
- Inside streamed Suspense content render `<NotFoundView />` instead of throwing `notFound()` (avoids React #419).
- Security headers (frame-ancestors, nosniff, referrer, permissions, HSTS) are set in `next.config.ts`.

## Commands
`npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm run test:e2e`
