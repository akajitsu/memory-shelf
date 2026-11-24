// End-to-end test against a running app with two real test accounts.
//
//   1. Create two users in Supabase (Authentication → Users → Add user → "Auto Confirm User").
//   2. Put their credentials in .env.test.local (git-ignored):
//        E2E_USER_A_EMAIL=...   E2E_USER_A_PASSWORD=...
//        E2E_USER_B_EMAIL=...   E2E_USER_B_PASSWORD=...
//   3. Start the app (npm run dev, or npm run build && npm start), then:
//        node scripts/e2e.mjs [baseUrl=http://localhost:3000] [outDir=./e2e-output]
//
// The test creates its own album, uploads generated photos, and deletes everything it made.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "e2e-output";
mkdirSync(OUT, { recursive: true });

function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => /^\s*[A-Z0-9_]+\s*=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}
// Only E2E_* keys come from .env.test.local, so stray copies of other settings can't
// override the real Supabase configuration in .env.local.
const testEnv = Object.fromEntries(Object.entries(loadEnv(".env.test.local")).filter(([k]) => k.startsWith("E2E_")));
const env = { ...loadEnv(".env.local"), ...testEnv, ...process.env };
for (const k of ["E2E_USER_A_EMAIL", "E2E_USER_A_PASSWORD", "E2E_USER_B_EMAIL", "E2E_USER_B_PASSWORD"]) {
  if (!env[k]) {
    console.error(`Missing ${k}. See the instructions at the top of scripts/e2e.mjs.`);
    process.exit(2);
  }
}
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split(".")[0];

const executablePath = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find((p) => existsSync(p));
const browser = await chromium.launch({ executablePath, headless: process.env.HEADED !== "1" });

const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  if (!ok) failures++;
  const line = `${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`;
  results.push(line);
  console.log(line);
}
async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    check(name, false, String(e?.message ?? e).split("\n")[0].slice(0, 200));
  }
}

// ---------------------------------------------------------------- helpers
async function makeJpegs(n) {
  const p = await browser.newPage();
  const data = await p.evaluate(async (count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const c = document.createElement("canvas");
      c.width = 1600;
      c.height = 1200;
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 1600, 1200);
      grad.addColorStop(0, `hsl(${i * 70} 70% 70%)`);
      grad.addColorStop(1, `hsl(${i * 70 + 50} 50% 30%)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 1600, 1200);
      g.fillStyle = "rgba(255,255,255,.85)";
      g.font = "bold 160px sans-serif";
      g.fillText(`E2E ${i + 1}`, 120, 300);
      out.push(c.toDataURL("image/jpeg", 0.9).split(",")[1]);
    }
    return out;
  }, n);
  await p.close();
  return data.map((b64, i) => {
    const file = `${OUT}/photo-${i + 1}.jpg`;
    writeFileSync(file, Buffer.from(b64, "base64"));
    return file;
  });
}

async function login(page, email, password, remember = true) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", password);
  if (!remember) await page.uncheck("#remember");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/library/, { timeout: 20000 });
}

/** Read the Supabase access token from the session cookie (possibly chunked, base64-encoded). */
async function accessToken(context) {
  const cookies = await context.cookies();
  const name = `sb-${PROJECT_REF}-auth-token`;
  const parts = cookies
    .filter((c) => c.name === name || c.name.startsWith(name + "."))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((c) => c.value);
  let raw = decodeURIComponent(parts.join(""));
  if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64url").toString("utf8");
  return JSON.parse(raw).access_token;
}

const rest = (token, path, init = {}) =>
  fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: ANON, authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });

// ================================================================= USER A
const photos = await makeJpegs(4);
const fakeExe = `${OUT}/not-really.jpg`;
writeFileSync(fakeExe, Buffer.concat([Buffer.from("MZ\x90\x00\x03\x00"), Buffer.alloc(4096)]));

const ctxA = await browser.newContext({ viewport: { width: 1366, height: 860 } });
const a = await ctxA.newPage();
const pageErrors = [];
a.on("pageerror", (e) => pageErrors.push(`A: ${e.message}`));

const title = `E2E Album ${Date.now().toString(36)}`;
let albumId = "";
let tokenA = "";

await step("wrong password is rejected", async () => {
  await a.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await a.fill("input[name=email]", env.E2E_USER_A_EMAIL);
  await a.fill("input[name=password]", "definitely-wrong-1");
  await a.getByRole("button", { name: "Sign in", exact: true }).click();
  await a.getByText("That email and password don").waitFor({ timeout: 15000 });
  check("wrong password is rejected", true);
});

await step("user A signs in", async () => {
  await login(a, env.E2E_USER_A_EMAIL, env.E2E_USER_A_PASSWORD);
  check("user A signs in and lands on the bookshelf", a.url().includes("/library"));
  tokenA = await accessToken(ctxA);
  check("session cookie holds a valid access token", typeof tokenA === "string" && tokenA.split(".").length === 3);
});

await step("create album with a designed book and a first photo", async () => {
  await a.goto(`${BASE}/albums/new`, { waitUntil: "networkidle" });
  await a.fill("input[name=title]", title);
  await a.fill("#album-description", "Created by the end-to-end test.");
  await a.click("button[role=radio][aria-label^='Astrolabe']");
  await a.click("button[aria-label=Moss]");
  await a.click("button[aria-label=Constellations]");
  check("no cover-photo upload is offered", (await a.locator("input[aria-label='Cover photo file']").count()) === 0);
  await a.setInputFiles("input[aria-label='Photographs for the album pages']", photos[0]);
  await a.locator("ul[aria-label='Photographs to add'] img").first().waitFor();
  await a.getByRole("button", { name: "Create album" }).click();
  await a.waitForURL(/\/albums\/[0-9a-f-]{36}/, { timeout: 60000 });
  albumId = a.url().match(/albums\/([0-9a-f-]{36})/)[1];
  await a.waitForSelector("[role=region][aria-busy=false]", { timeout: 15000 });
  check("album created and opened", !!albumId, albumId);
  const { status, json } = await rest(
    tokenA,
    `/rest/v1/albums?id=eq.${albumId}&select=cover_image_path,cover_color,cover_design,cover_pattern,album_photos(count)`,
  ).then(async (r) => ({ status: r.status, json: await r.json() }));
  const row = json[0];
  check(
    "album row saved with book design, pattern and color (no cover photo)",
    status === 200 && row?.cover_color === "#2f4a3a" && row?.cover_design === "astrolabe" && row?.cover_pattern === "constellations" && !row?.cover_image_path,
    JSON.stringify(row),
  );
  check("photo chosen in the create form was added inside the album", row?.album_photos?.[0]?.count === 1);
  await shot(a, "a-album-new");
});

await step("upload photos", async () => {
  await a.goto(`${BASE}/albums/${albumId}/photos`, { waitUntil: "networkidle" });
  await a.setInputFiles("input[aria-label='Choose photos to upload']", [...photos.slice(1, 3), fakeExe]);
  await a.waitForTimeout(800);
  check("disguised executable flagged before upload", (await a.getByText("isn’t a supported image").count()) > 0);
  await a.getByRole("button", { name: /^Upload 2 photos/ }).click();
  await a.getByText("2 photos added").waitFor({ timeout: 60000 });
  await a.reload({ waitUntil: "networkidle" });
  check("3 photos listed after upload", (await a.locator("ul li textarea").count()) === 3);
  const srcs = await a.locator("ul li img").evaluateAll((els) => els.map((e) => e.getAttribute("src")));
  check("grid uses generated thumbnails", srcs.length === 3 && srcs.every((s) => s && s.includes(".thumb.jpg")));
  await shot(a, "a-photos");
});

await step("caption persists", async () => {
  const box = a.locator("ul li textarea").first();
  await box.fill("A caption from the e2e test");
  await box.press("Enter");
  await a.waitForTimeout(1500);
  await a.reload({ waitUntil: "networkidle" });
  check("caption saved and persisted", (await a.locator("ul li textarea").first().inputValue()) === "A caption from the e2e test");
});

await step("reorder persists", async () => {
  const names = async () => a.locator("ul li p.truncate").allInnerTexts();
  const before = await names();
  await a.getByRole("button", { name: /^Reorder photo 1\./ }).focus();
  await a.keyboard.press("Space");
  await a.waitForTimeout(200);
  await a.keyboard.press("ArrowRight");
  await a.waitForTimeout(200);
  await a.keyboard.press("Space");
  await a.getByText("Order saved").waitFor({ timeout: 15000 });
  await a.reload({ waitUntil: "networkidle" });
  const after = await names();
  check("new photo order saved and persisted", before[0] === after[1] && before[1] === after[0], `${before.join(",")} → ${after.join(",")}`);
});

await step("album viewer", async () => {
  await a.goto(`${BASE}/albums/${albumId}`, { waitUntil: "networkidle" });
  await a.waitForSelector("[role=region][aria-busy=false]", { timeout: 15000 });
  check("book opens (cover gone)", (await a.locator("[data-cover]").count()) === 0);
  const imgsOk = await a.evaluate(() => [...document.querySelectorAll("img[data-book-img]")].every((i) => i.complete && i.naturalWidth > 0));
  check("photos on the first spread are loaded", imgsOk);
  await shot(a, "a-book");
  await a.getByRole("button", { name: /^View photo:/ }).first().click();
  check("lightbox opens", await a.getByRole("dialog", { name: "Photo viewer" }).isVisible());
  await a.keyboard.press("Escape");
});

await step("edit album", async () => {
  await a.goto(`${BASE}/albums/${albumId}/edit`, { waitUntil: "networkidle" });
  await a.fill("input[name=title]", `${title} (edited)`);
  await a.getByRole("button", { name: "Save changes" }).click();
  await a.waitForURL(new RegExp(`/albums/${albumId}`), { timeout: 20000 });
  await a.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  check("edited title shown on the shelf", (await a.getByText(`${title} (edited)`).count()) > 0);
  await a.fill("#album-search", "edited");
  await a.waitForTimeout(300);
  check("search finds the album", (await a.locator(`a[aria-label^='Open album: ${title} (edited)']`).count()) === 1);
  await shot(a, "a-library");
});

await step("library styles", async () => {
  await a.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  for (const [name, key] of [
    ["Floating Library", "floating"],
    ["Great Tree", "tree"],
  ]) {
    await a.getByRole("radio", { name }).click();
    await a.waitForTimeout(700);
    const books = await a
      .locator(`[data-library-style=${key}] [role=list] a[aria-label^='Open album: ${title}']`)
      .filter({ visible: true })
      .count();
    check(`${name} style shows the album as an openable book`, books === 1);
  }
  await shot(a, "a-library-tree");
  await a.reload({ waitUntil: "networkidle" });
  check("chosen library style is remembered after reload", (await a.locator("[data-library-style=tree]").filter({ visible: true }).count()) === 1);
  await a.getByRole("radio", { name: "Moonlit Shelves" }).click();
  await a.waitForTimeout(400);
});

await step("mobile layouts", async () => {
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await m.addCookies(await ctxA.cookies());
  const mp = await m.newPage();
  for (const [path, name] of [["/library", "m-library"], [`/albums/${albumId}`, "m-book"], [`/albums/${albumId}/photos`, "m-photos"]]) {
    await mp.goto(BASE + path, { waitUntil: "networkidle" });
    await mp.waitForTimeout(1800);
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    check(`mobile ${path.replace(albumId, ":id")} fits the screen`, !overflow);
    await mp.screenshot({ path: `${OUT}/${name}.png` });
  }
  await m.close();
});

// ================================================================= USER B (isolation)
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const b = await ctxB.newPage();
b.on("pageerror", (e) => pageErrors.push(`B: ${e.message}`));
let tokenB = "";

await step("user B isolation (UI)", async () => {
  await login(b, env.E2E_USER_B_EMAIL, env.E2E_USER_B_PASSWORD);
  tokenB = await accessToken(ctxB);
  check("user B does not see A's album on their shelf", (await b.getByText(title).count()) === 0);
  for (const path of [`/albums/${albumId}`, `/albums/${albumId}/photos`, `/albums/${albumId}/edit`]) {
    await b.goto(BASE + path, { waitUntil: "networkidle" });
    check(`user B gets "not found" for A's ${path.replace(albumId, ":id")}`, (await b.getByText("This page isn’t on the shelf").count()) > 0);
  }
});

await step("user B isolation (direct API)", async () => {
  const albums = await rest(tokenB, `/rest/v1/albums?id=eq.${albumId}&select=id`).then((r) => r.json());
  check("API: B cannot read A's album row", Array.isArray(albums) && albums.length === 0);
  const ph = await rest(tokenB, `/rest/v1/album_photos?album_id=eq.${albumId}&select=id`).then((r) => r.json());
  check("API: B cannot read A's photo rows", Array.isArray(ph) && ph.length === 0);
  const upd = await rest(tokenB, `/rest/v1/albums?id=eq.${albumId}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({ title: "hacked" }),
  }).then((r) => r.json());
  check("API: B cannot rename A's album", Array.isArray(upd) && upd.length === 0);
  const del = await rest(tokenB, `/rest/v1/albums?id=eq.${albumId}`, { method: "DELETE", headers: { prefer: "return=representation" } }).then((r) => r.json());
  check("API: B cannot delete A's album", Array.isArray(del) && del.length === 0);

  const { data: aRow } = { data: await rest(tokenA, `/rest/v1/albums?id=eq.${albumId}&select=user_id`).then((r) => r.json()) };
  const photoRows = await rest(tokenA, `/rest/v1/album_photos?album_id=eq.${albumId}&select=image_path&limit=1`).then((r) => r.json());
  const photoPath = photoRows[0].image_path;
  const sign = await rest(tokenB, `/storage/v1/object/sign/album-photos/${photoPath}`, { method: "POST", body: JSON.stringify({ expiresIn: 60 }) });
  check("Storage: B cannot create a link to A's photo", sign.status >= 400, `HTTP ${sign.status}`);
  const list = await rest(tokenB, `/storage/v1/object/list/album-photos`, {
    method: "POST",
    body: JSON.stringify({ prefix: `${aRow[0].user_id}/${albumId}/`, limit: 100 }),
  }).then((r) => r.json());
  check("Storage: B cannot list A's album folder", Array.isArray(list) && list.length === 0);
  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/album-photos/${aRow[0].user_id}/${albumId}/evil.jpg`, {
    method: "POST",
    headers: { apikey: ANON, authorization: `Bearer ${tokenB}`, "content-type": "image/jpeg" },
    body: readFileSync(photos[0]),
  });
  check("Storage: B cannot upload into A's album folder", up.status >= 400, `HTTP ${up.status}`);
  const spoof = await rest(tokenB, `/rest/v1/albums`, {
    method: "POST",
    body: JSON.stringify({ title: "spoofed", user_id: aRow[0].user_id }),
  });
  check("API: B cannot create an album owned by A", spoof.status >= 400, `HTTP ${spoof.status}`);
  const anon = await fetch(`${SUPABASE_URL}/rest/v1/albums?select=id`, { headers: { apikey: ANON } });
  check("API: logged-out requests are refused", anon.status === 401 || anon.status === 403, `HTTP ${anon.status}`);
});
await ctxB.close();

// ================================================================= cleanup + sign out (A)
await step("delete photo and album", async () => {
  await a.goto(`${BASE}/albums/${albumId}/photos`, { waitUntil: "networkidle" });
  await a.locator("ul li").first().getByRole("button", { name: "Delete" }).click();
  await a.getByRole("button", { name: "Delete photo" }).click();
  await a.getByText("Photo deleted.").waitFor({ timeout: 20000 });
  check("photo deleted", (await a.locator("ul li textarea").count()) === 2);

  const owner = (await rest(tokenA, `/rest/v1/albums?id=eq.${albumId}&select=user_id`).then((r) => r.json()))[0].user_id;
  await a.goto(`${BASE}/albums/${albumId}`, { waitUntil: "networkidle" });
  await a.waitForSelector("[role=region][aria-busy=false]", { timeout: 15000 });
  await a.getByRole("button", { name: "Delete this album" }).click();
  await a.getByRole("button", { name: "Delete album" }).click();
  await a.waitForURL(/\/library/, { timeout: 30000 });
  // Count visible books only: Next keeps recently visited pages mounted but hidden.
  await a.getByText("The album was deleted.").waitFor({ timeout: 15000 });
  check(
    "album deleted and gone from the shelf",
    (await a.locator(`[role=list] a[aria-label^='Open album: ${title}']`).filter({ visible: true }).count()) === 0,
  );
  await a.goBack();
  await a.waitForTimeout(1500);
  check(
    "browser Back doesn't resurface the deleted album",
    (await a.locator("[role=region][aria-roledescription='photo album']").filter({ visible: true }).count()) === 0,
  );
  await a.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  const rows = await rest(tokenA, `/rest/v1/album_photos?album_id=eq.${albumId}&select=id`).then((r) => r.json());
  check("photo rows removed with the album", Array.isArray(rows) && rows.length === 0);
  const files = await rest(tokenA, `/storage/v1/object/list/album-photos`, {
    method: "POST",
    body: JSON.stringify({ prefix: `${owner}/${albumId}/`, limit: 100 }),
  }).then((r) => r.json());
  check("all files (photos and thumbnails) removed from storage", Array.isArray(files) && files.length === 0, `${files.length ?? "?"} left`);
});

await step("sign out", async () => {
  await a.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await a.getByRole("button", { name: "Sign out" }).last().click();
  await a.waitForURL(/\/login/, { timeout: 15000 });
  await a.goto(`${BASE}/library`, { waitUntil: "networkidle" });
  check("after sign-out, the shelf requires login again", a.url().includes("/login"));
});

await step("remember me off", async () => {
  const c = await browser.newContext();
  const p = await c.newPage();
  await login(p, env.E2E_USER_A_EMAIL, env.E2E_USER_A_PASSWORD, false);
  const auth = (await c.cookies()).filter((k) => k.name.startsWith(`sb-${PROJECT_REF}-auth-token`));
  check("unchecked 'Keep me signed in' gives browser-session cookies", auth.length > 0 && auth.every((k) => k.expires === -1));
  await c.close();
});

await ctxA.close();
check("no browser errors during the run", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 400));
await browser.close();

console.log(`\n${results.length - failures}/${results.length} checks passed. Screenshots in ${OUT}/`);
process.exit(failures ? 1 : 0);
