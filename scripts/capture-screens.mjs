/**
 * Visual check for the redesigned interface.
 *
 *   node scripts/capture-screens.mjs
 *
 * Expects a running app with a key configured (the Playwright suite's stub works):
 *   PROMPT_GYM_BASE_URL=http://127.0.0.1:3212 node scripts/capture-screens.mjs
 *
 * Writes full-page desktop and mobile screenshots into devpost/screenshots/. Runs the
 * real interface once per viewport so the arena, score ring and regression moment are
 * captured from actual (stub) evaluation output, never mocked markup.
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE = process.env.PROMPT_GYM_BASE_URL ?? "http://127.0.0.1:3212";
const OUT = "devpost/screenshots";

const BASE_PROMPT = [
  "Return strict JSON with exactly order_id, reason, amount_usd and wants_replacement.",
  "Use null when the message does not state a value.",
  "Give each request in the message its own object.",
].join("\n");

const LOCALISED_EDIT = `${BASE_PROMPT}\nIf a message contains two requests, merge them into one object.`;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}

async function noHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(`${label}: horizontal overflow ${overflow.scrollWidth} > ${overflow.clientWidth}`);
  }
}

// Landing, desktop.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1.5 });
  await page.addInitScript(() => window.localStorage.setItem("prompt-gym:intro-seen", "1"));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await settle(page);
  await noHorizontalScroll(page, "landing desktop");
  await page.screenshot({ path: `${OUT}/landing-desktop.png`, fullPage: true });
  await page.close();
}

// The first-visit tour.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1.5 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: "Next" }).click();
  await settle(page);
  await page.screenshot({ path: `${OUT}/intro-desktop.png` });
  await page.close();
}

// Landing, mobile.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await page.addInitScript(() => window.localStorage.setItem("prompt-gym:intro-seen", "1"));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await settle(page);
  await noHorizontalScroll(page, "landing mobile");
  await page.screenshot({ path: `${OUT}/landing-mobile.png`, fullPage: true });
  await page.close();
}

async function runWorkspace(page) {
  await page.goto(`${BASE}/workspace/structured-extraction`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.sessionStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await settle(page);

  const editor = page.locator("#prompt");
  await editor.fill(BASE_PROMPT);
  await page.getByTestId("run-button").click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="score"]')?.textContent?.trim() === "5/6",
    null,
    { timeout: 60_000 },
  );
  await settle(page);
  await noHorizontalScroll(page, "workspace base");
  await page.screenshot({ path: `${OUT}/workspace-desktop.png`, fullPage: true });

  await editor.fill(LOCALISED_EDIT);
  await page.getByTestId("run-button").click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="score"]')?.textContent?.trim() === "4/6",
    null,
    { timeout: 60_000 },
  );
  await settle(page);
  await page.getByTestId("regression").scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: `${OUT}/regression-desktop.png`, fullPage: true });
}

// Workspace, desktop.
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1.5 });
  await runWorkspace(page);
  await page.close();
}

// Workspace, mobile.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await page.goto(`${BASE}/workspace/structured-extraction`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.sessionStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await settle(page);

  const editor = page.locator("#prompt");
  await editor.fill(BASE_PROMPT);
  await page.getByTestId("run-button").click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="score"]')?.textContent?.trim() === "5/6",
    null,
    { timeout: 60_000 },
  );
  await settle(page);
  await noHorizontalScroll(page, "workspace mobile");
  await page.screenshot({ path: `${OUT}/workspace-mobile.png`, fullPage: true });
  await page.close();
}

await browser.close();
console.log(`Screenshots written to ${OUT}`);
