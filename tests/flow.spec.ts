import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

/**
 * Against the stub provider (fixed test data), this proves the interface loop works:
 * prompt → streamed cases → score → export → edit → genuine pass-to-fail regression.
 * The scores are the stub's, not a claim about any real model.
 */

const BASE_PROMPT = [
  "Return strict JSON with exactly order_id, reason, amount_usd and wants_replacement.",
  "Use null when the message does not state a value.",
  "Give each request in the message its own object.",
].join("\n");

const LOCALISED_EDIT = `${BASE_PROMPT}\nIf a message contains two requests, merge them into one object.`;

const BROAD_REWRITE =
  "NARROW: Return strict JSON with exactly the four fields. If the message mentions more than one order, pick the first one and answer confidently.";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.clear());
});

test("runs six cases, scores them, exports a clean report, then shows a real regression", async ({ page }) => {
  await page.goto("/workspace/structured-extraction");

  await expect(page.getByRole("heading", { name: "Structured Extraction", level: 1 })).toBeVisible();
  await expect(page.getByText("Sample cases")).toBeVisible();
  await expect(page.getByText("No runs yet. Write a prompt and press Run tests.")).toBeVisible();
  await expect(page.getByTestId("run-button")).toBeDisabled();

  const editor = page.locator("#prompt");
  await editor.fill(BASE_PROMPT);
  await page.getByTestId("run-button").click();

  await expect(page.getByTestId("case-result")).toHaveCount(6);
  await expect(page.getByTestId("score")).toHaveText("5/6");
  await expect(page.getByTestId("run-button")).toBeEnabled();

  // The four states are labelled, not colour-only.
  await expect(page.getByTestId("case-result").filter({ hasText: "Passed" }).first()).toBeVisible();
  await expect(page.getByTestId("case-result").filter({ hasText: "Failed" }).first()).toBeVisible();

  // Raw response is available behind a disclosure.
  await page.getByText("Raw model response").first().click();
  await expect(page.locator("pre").first()).toContainText("order_id");

  // Export carries the prompt, the real-run note and no hidden case text.
  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download Markdown" }).click(),
  ]).then(([event]) => event);
  const path = await download.path();
  expect(path).toBeTruthy();
  const markdown = await readFile(path!, "utf8");
  expect(markdown).toContain(BASE_PROMPT);
  expect(markdown).toContain("came from real model evaluations");
  // The model's own output may legitimately contain an extracted order id — that is
  // the evidence the learner needs. The hidden *message* is what must not travel.
  expect(markdown).not.toContain("arrived with a cracked screen");
  expect(markdown).not.toContain("I don't need a replacement");

  // Re-running the identical prompt must not be framed as progress.
  await page.getByTestId("run-button").click();
  await expect(page.getByTestId("score")).toHaveText("5/6");
  await expect(page.getByText("Same prompt as previous attempt. Scored the same.")).toBeVisible();

  // A localised edit that fixes one behaviour and breaks exactly one case.
  await editor.fill(LOCALISED_EDIT);
  await page.getByTestId("run-button").click();

  await expect(page.getByTestId("score")).toHaveText("4/6");
  await expect(page.getByTestId("regression")).toBeVisible();
  await expect(page.getByText("A previously passing case is now failing")).toBeVisible();
  await expect(page.getByText("Possible explanation: a hypothesis, not a measurement")).toBeVisible();
  await expect(page.getByTestId("case-result").filter({ hasText: "Two products" })).toHaveAttribute(
    "data-state",
    "regressed",
  );

  // The delta is computed from a comparable attempt, and history keeps both.
  await expect(page.getByText("-1 vs previous attempt")).toBeVisible();
  await expect(page.getByText("Best: attempt 1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Attempt history" })).toBeVisible();

  // The edit is shown next to the case it broke, with a working link to that tile.
  await expect(page.getByText("Your last edit")).toBeVisible();
  await page.getByRole("link", { name: /broke/ }).first().click();
  await expect(page.getByTestId("case-result").filter({ hasText: "Two products" })).toBeInViewport();
});

test.describe("mobile layout", () => {
  test.use({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: { "x-forwarded-for": "10.10.10.10" } });

  test("loads a starter prompt, runs, and fits the viewport", async ({ page }) => {
    await page.goto("/workspace/structured-extraction");
    await expect(page.getByText("No runs yet. Write a prompt and press Run tests.")).toBeVisible();

    await page.getByRole("button", { name: "Starter prompt" }).click();
    const editor = page.locator("#prompt");
    await expect(editor).not.toHaveValue("");
    await expect(page.getByTestId("run-button")).toBeEnabled();

    await page.getByTestId("run-button").click();
    await expect(page.getByTestId("case-result")).toHaveCount(6);
    await expect(page.getByTestId("score")).toHaveText("5/6");

    // A tile expands in place instead of pushing the page sideways.
    await page.getByTestId("case-result").first().locator("summary", { hasText: "Details" }).click();
    await expect(page.getByText("Checked by:").first()).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});

test("shows observations without inventing a cause when the edit was broad", async ({ page }) => {
  await page.goto("/workspace/structured-extraction");
  const editor = page.locator("#prompt");

  await editor.fill(BASE_PROMPT);
  await page.getByTestId("run-button").click();
  await expect(page.getByTestId("score")).toHaveText("5/6");

  await editor.fill(BROAD_REWRITE);
  await page.getByTestId("run-button").click();

  await expect(page.getByTestId("score")).toHaveText("0/6");
  await expect(page.getByTestId("regression")).toBeVisible();
  // Four cases flipped at once: the panel reports the observation and declines to name
  // a single cause, because the evidence can't support one.
  await expect(page.getByText("No cause is proposed here")).toBeVisible();
  await expect(page.getByText("Possible explanation: a hypothesis, not a measurement")).toHaveCount(0);
  await expect(page.getByTestId("case-result")).toHaveCount(6);
});
