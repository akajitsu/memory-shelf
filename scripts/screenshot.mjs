// Dev helper: capture screenshots of local pages with the system Edge/Chrome.
// Usage: node scripts/screenshot.mjs <outDir> <baseUrl> name=path[@WxH][#hover=selector] ...
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";

const [, , outDir, baseUrl, ...shots] = process.argv;
mkdirSync(outDir, { recursive: true });

const candidates = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];
const executablePath = candidates.find((p) => existsSync(p));
const browser = await chromium.launch({ executablePath, headless: true });

for (const spec of shots) {
  const eq = spec.indexOf("=");
  const [name, rest] = [spec.slice(0, eq), spec.slice(eq + 1)];
  const [pathAndAction, click] = rest.split("#click=");
  const [pathAndSize, hover] = pathAndAction.split("#hover=");
  const [path, size = "1440x900"] = pathAndSize.split("@");
  const [width, height] = size.split("x").map(Number);
  const isMobile = width < 640;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: isMobile ? 2 : 1,
    hasTouch: isMobile,
    isMobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(baseUrl + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (hover) {
    await page.hover(hover);
    await page.waitForTimeout(700);
  }
  if (click) {
    await page.click(click);
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: false });
  console.log(`${name}: ${path} @${size}${hover ? " hover" : ""}${errors.length ? "  ERRORS: " + errors.join(" | ") : ""}`);
  await context.close();
}
await browser.close();
