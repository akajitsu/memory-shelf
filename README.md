# Memory Shelf

A private digital photo-album library. Each album is a leather-bound book on an interactive 3D bookshelf;
open one and its cover swings open onto scrapbook pages you can turn. Photos are stored privately per account.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion ·
Supabase (Auth, Postgres with Row Level Security, private Storage) · deployed on Vercel.

## Features

- Email/password registration with verification, Google sign-in, password reset, “keep me signed in”
- 3D CSS bookshelf; book pull-out, cover opening/closing and 3D page-turn animations, with sound effects
- Albums: title, description, leather colour, cover photo; create / edit / delete
- Photos: multi-file drag-and-drop upload with previews and progress, automatic thumbnails, captions,
  drag-to-reorder, delete, full-size viewer
- Privacy: every row and file is owned by one user, enforced by Postgres RLS and Storage policies

---

## 1. Local setup

Requirements: Node.js 20.9+ and a free [Supabase](https://supabase.com) project.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Where to find it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (or **Connect**) | e.g. `https://abcd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys → publishable (or legacy anon) key | Public by design; RLS protects data |
| `NEXT_PUBLIC_SITE_URL` | Your app's origin, no trailing slash | `http://localhost:3000` locally, your Vercel URL in production |

The app **never** uses the Supabase `service_role`/secret key. Don't add it anywhere.

### Database & storage

In Supabase → **SQL Editor**, run these files in order:

1. `supabase/migrations/20261122000001_initial_schema.sql`: tables, triggers, RLS, `album-photos` bucket + policies
2. `supabase/migrations/20261122000002_explicit_grants.sql`: column-level privileges

Then run `supabase/tests/rls_test.sql`. It deliberately ends with an error whose message should read
`RLS TEST RESULT: 23 passed, 0 failed.` (raising the error rolls back the test data).

### Authentication settings (Supabase → Authentication)

- **URL Configuration:** Site URL = your app URL; Redirect URLs include `http://localhost:3000/**`
- **Sign In / Providers → Google:** enable and paste the Google OAuth Client ID/Secret
  (Google Cloud → APIs & Services → Credentials → OAuth client, type *Web application*, authorized
  redirect URI `https://<your-project-ref>.supabase.co/auth/v1/callback`)
- **Emails:** for real users configure custom SMTP (Authentication → Emails → SMTP Settings). Recommended
  templates (work in any browser):
  - Confirm signup link: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
  - Reset password link: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`

---

## 2. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run test:e2e -- <baseUrl> [outDir]` | End-to-end test against a running app (see below) |

### End-to-end test

`scripts/e2e.mjs` signs in as two test users and exercises the whole app, including cross-account
isolation attempts against the real Supabase API, then deletes everything it created.

1. Supabase → Authentication → Users → **Add user** twice (tick *Auto Confirm User*).
2. Create `.env.test.local` (git-ignored):
   ```
   E2E_USER_A_EMAIL=...
   E2E_USER_A_PASSWORD=...
   E2E_USER_B_EMAIL=...
   E2E_USER_B_PASSWORD=...
   ```
3. With the app running: `npm run test:e2e -- http://localhost:3000`

---

## 3. Deploying to Vercel

1. Push this repository to GitHub (private is fine).
2. On [vercel.com](https://vercel.com) → **Add New… → Project** → import the repository.
   Framework preset *Next.js* is detected automatically; keep the default build settings.
3. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `NEXT_PUBLIC_SITE_URL` (= the production URL, e.g. `https://memory-shelf.vercel.app`). Deploy.
4. After the first deploy, update the external services with the production URL:
   - **Supabase → Authentication → URL Configuration:** Site URL = production URL; add
     `https://<production-domain>/**` (and, for preview deployments, `https://*-<team>.vercel.app/**`)
     to Redirect URLs.
   - **Google Cloud → OAuth client:** add the production URL to *Authorized JavaScript origins*
     (the redirect URI stays the Supabase callback).
   - If `NEXT_PUBLIC_SITE_URL` changed, redeploy so the new value is built in.
5. Verify with the end-to-end test: `npm run test:e2e -- https://<production-domain>`.

Notes: never set `ENABLE_DEV_PREVIEW` in production (it exposes the `/dev/*` preview pages used for
local visual testing). Security headers are configured in `next.config.ts`.

---

## Project structure

```
app/                 routes: (auth) sign-in pages, (app) signed-in area, auth/* callbacks
components/          bookshelf/, albums/, photos/, auth/, layout/, settings/, ui/
lib/                 auth/ (DAL, actions), albums/, photos/, data/ (server reads), images/, supabase/
supabase/            migrations/ and tests/
scripts/             e2e.mjs, screenshot.mjs
proxy.ts             session refresh + route protection (Next 16 "proxy", formerly middleware)
```
