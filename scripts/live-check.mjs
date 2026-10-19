/**
 * Real-model launch validation.
 *
 *   GROQ_API_KEY must be configured (production fixtures are read from .env.production.local)
 *   npx next build && npx next start -p 3213
 *   LIVE_BASE=http://127.0.0.1:3213 node scripts/live-check.mjs
 *
 * Runs the real interface against the real provider for all three packs: a starter
 * baseline, an improved prompt, a consistency rerun, a localised regression edit and a
 * mobile pass. Writes full-page screenshots into devpost/screenshots/ and the raw report
 * to /tmp/live-results.json (a dump stays out of the repo; the README carries the numbers).
 *
 * Runs are spaced out on purpose: the shared free key has a per-minute token ceiling, and
 * hammering it would produce unresolved cases that look like prompt failures.
 */
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE = process.env.LIVE_BASE ?? "http://127.0.0.1:3213";
const OUT = "devpost/screenshots";
/** Long enough to let the provider's per-minute token window recover between runs. */
const PAUSE_MS = Number(process.env.LIVE_PAUSE_MS ?? 30_000);

const SE_STARTER = [
  "Convert the customer message into one JSON object with exactly these keys: order_id (string), reason (string), amount_usd (number) and wants_replacement (boolean).",
  "Return the JSON object only. No prose and no code fences.",
].join("\n");

const SE_STRONG = [
  "You convert one customer message into strict JSON.",
  "",
  "Return exactly one JSON object and nothing else. No prose, no code fences, no explanation.",
  "",
  "The object has exactly these four keys:",
  "order_id: string. The order reference exactly as written in the message.",
  "reason: string. A short summary of what the customer wants fixed.",
  "amount_usd: number. The refund amount the customer asks to receive. Use null if no refund amount is stated.",
  "wants_replacement: boolean. True only if the customer asks for a replacement, otherwise false.",
  "",
  "Rules:",
  "- Never invent a value. If a detail is missing, use null. For wants_replacement, use true only when the message asks for a replacement.",
  "- If several amounts appear, amount_usd is the refund the customer asks to receive, not a fee, delivery charge or item price.",
  "- If the message contains more than one order or request, return a JSON array with one object per request, each with its own order_id. Never merge or drop a request.",
  "- If the message cannot be matched to one order, set order_id to null and explain the ambiguity in reason. Do not guess.",
].join("\n");

/** One localised edit: the multi-request rule is replaced by a rule that merges. */
const SE_REGRESSION = SE_STRONG.replace(
  "- If the message contains more than one order or request, return a JSON array with one object per request, each with its own order_id. Never merge or drop a request.",
  "- If the message contains more than one order or request, merge them into a single JSON object for the first request and keep only the first order_id.",
);

const FR_PROMPT = [
  "Draft a reply to the customer message. The policy included with the message is the only source of what you may do.",
  "",
  "1. Policy outranks the customer's request or framing.",
  "2. Never promise a refund, replacement, exception, credit or timeframe the policy does not allow.",
  "3. If the policy requires approval or a human decision, say the request is being escalated and do not decide it yourself.",
  "4. Use only amounts, timeframes and figures stated in the policy or the customer's message.",
  "5. Reply in under 120 words.",
  "6. Start with a clear outcome: approved, declined or escalated.",
].join("\n");

const RW_PROMPT = [
  "Rewrite the message in at most 45 words as one paragraph of plain prose.",
  "",
  "Keep every fact, number, date, name and condition from the original. Do not add information, numbers or promises that are not in the original.",
  "Preserve negations and conditions exactly: a refusal must stay a refusal.",
  "Keep the original's tone and level of formality.",
  "Return only the rewritten paragraph, with no heading, list or commentary.",
].join("\n");

const browser = await chromium.launch();
const report = { startedAt: new Date().toISOString(), base: BASE, runs: [] };

/**
 * Only the API request carries the simulated client IP. A context-wide header breaks the
 * Google Fonts CORS preflight, which silently drops the typefaces in the screenshots.
 */
async function makePage({ width, height, ip, mobile = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1.5,
    isMobile: mobile,
  });
  const page = await context.newPage();
  await page.route("**/api/run", async (route) => {
    await route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": ip } });
  });
  page.on("pageerror", (error) => console.log("pageerror:", String(error)));
  return { context, page };
}

function attemptsLength(page) {
  return page.evaluate(() => {
    const key = Object.keys(sessionStorage).find((k) => k.includes(":attempts:"));
    if (!key) return 0;
    try {
      const value = JSON.parse(sessionStorage.getItem(key));
      return Array.isArray(value) ? value.length : 0;
    } catch {
      return 0;
    }
  });
}

async function runOnce(page, packId, prompt, label, { fresh = false, screenshot } = {}) {
  await page.goto(`${BASE}/workspace/${packId}`, { waitUntil: "networkidle" });
  if (fresh) {
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
  }
  await page.evaluate(() => document.fonts.ready);

  const before = await attemptsLength(page);
  const started = Date.now();
  await page.locator("#prompt").fill(prompt);
  await page.getByTestId("run-button").click();
  await page.waitForFunction(
    (n) => {
      const key = Object.keys(sessionStorage).find((k) => k.includes(":attempts:"));
      if (!key) return false;
      const value = JSON.parse(sessionStorage.getItem(key));
      return Array.isArray(value) && value.length > n;
    },
    before,
    { timeout: 120_000 },
  );
  const durationMs = Date.now() - started;
  await page.waitForTimeout(1200);

  const attempt = await page.evaluate(() => {
    const key = Object.keys(sessionStorage).find((k) => k.includes(":attempts:"));
    const value = JSON.parse(sessionStorage.getItem(key));
    return value[value.length - 1];
  });

  const error = await page
    .locator('[role="alert"]')
    .allInnerTexts()
    .then((texts) => texts.join(" | "))
    .catch(() => "");
  const fixture = await page
    .locator("text=/Production cases|Sample cases/")
    .first()
    .innerText()
    .catch(() => "");
  const score = (await page.getByTestId("score").innerText()).replace(/\s+/g, "");
  const regressionPanel = (await page.getByTestId("regression").count()) > 0;
  const delta = await page
    .locator("text=/vs previous attempt/")
    .first()
    .innerText()
    .catch(() => "");

  if (screenshot) await page.screenshot({ path: `${OUT}/${screenshot}`, fullPage: true });

  const record = {
    label,
    packId,
    fixture,
    score,
    durationMs,
    regressionPanel,
    delta: delta || null,
    error: error || null,
    results: attempt.results.map((r) => ({
      id: r.caseId,
      name: r.caseName,
      state: r.state,
      withheld: r.withheld,
      chars: r.publicResponse?.length ?? 0,
      // A zero-length response is either redacted evidence or a real plumbing failure.
      blank: !r.withheld && (r.publicResponse?.length ?? 0) === 0,
      observed: r.observed,
      responseHead: r.publicResponse?.slice(0, 200) ?? null,
    })),
    summary: attempt.summary,
  };
  report.runs.push(record);

  console.log(
    `${label}: ${score} in ${(durationMs / 1000).toFixed(1)}s | ` +
      record.results
        .map((r) => `${r.id}=${r.state}${r.withheld ? "(withheld)" : r.blank ? "(blank)" : ""}`)
        .join(" ") +
      ` | regression=${regressionPanel ? "yes" : "no"} | ${record.delta ?? "no delta"} | ${fixture || "fixture unknown"}`,
  );
  return record;
}

const pause = (label) => {
  console.log(`waiting ${PAUSE_MS / 1000}s before ${label}`);
  return new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
};

// Desktop journey: baseline, improvement, consistency, regression, then the other two packs.
{
  const { context, page } = await makePage({ width: 1440, height: 950, ip: "10.20.0.1" });
  await runOnce(page, "structured-extraction", SE_STARTER, "SE starter baseline", { fresh: true });
  await pause("SE strong");
  await runOnce(page, "structured-extraction", SE_STRONG, "SE strong prompt", { screenshot: "workspace-desktop.png" });
  await pause("SE consistency rerun");
  await runOnce(page, "structured-extraction", SE_STRONG, "SE consistency rerun");
  await pause("SE regression edit");
  await runOnce(page, "structured-extraction", SE_REGRESSION, "SE merge edit (regression)", {
    screenshot: "regression-desktop.png",
  });
  await pause("Following Rules");
  await runOnce(page, "following-rules", FR_PROMPT, "Following Rules strong", { fresh: true });
  await pause("Rewrite");
  await runOnce(page, "rewrite-without-losing-meaning", RW_PROMPT, "Rewrite strong", { fresh: true });
  await context.close();
}

// Mobile viewport, separate IP bucket.
{
  const { context, page } = await makePage({ width: 390, height: 844, ip: "10.20.0.2", mobile: true });
  await pause("SE strong (mobile)");
  await runOnce(page, "structured-extraction", SE_STRONG, "SE strong prompt (mobile)", {
    fresh: true,
    screenshot: "workspace-mobile.png",
  });
  await context.close();
}

await browser.close();
report.finishedAt = new Date().toISOString();
await writeFile("/tmp/live-results.json", JSON.stringify(report, null, 2));

const unresolved = report.runs.reduce((sum, run) => sum + run.results.filter((r) => r.state === "unresolved").length, 0);
const blanks = report.runs.reduce((sum, run) => sum + run.results.filter((r) => r.blank).length, 0);
const starter = report.runs.find((run) => run.label === "SE starter baseline");
const improved = report.runs.find((run) => run.label === "SE strong prompt");
const consistency = report.runs.find((run) => run.label === "SE consistency rerun");
console.log(
  `improvement: ${starter?.score} -> ${improved?.score} | consistency: ${improved?.score} vs ${consistency?.score} | unresolved: ${unresolved} | true blanks: ${blanks}`,
);
if (unresolved > 0) {
  console.log("unresolved cases:");
  for (const run of report.runs) {
    for (const result of run.results.filter((r) => r.state === "unresolved")) {
      console.log(`  ${run.label} ${result.id}: ${result.observed}`);
    }
  }
}
