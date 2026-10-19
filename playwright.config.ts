import { defineConfig, devices } from "@playwright/test";

/**
 * One browser pass over the real product, against a local OpenAI-compatible stub so the
 * suite needs no provider key. The stub's outputs are fixed test data: this verifies the
 * interface and the streaming loop, and is never presented as a real evaluation.
 */
const PORT = Number(process.env.PROMPT_GYM_PORT ?? 3211);
const baseURL = process.env.PROMPT_GYM_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const isLocal = !process.env.PROMPT_GYM_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "flow.spec.ts",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  ...(isLocal
    ? {
        webServer: [
          {
            command: "node tests/support/fake-provider.mjs 4111",
            url: "http://127.0.0.1:4111/v1/models",
            reuseExistingServer: true,
            timeout: 20_000,
          },
          {
            // Empty fixture vars keep a local .env.production.local out of the stub run,
            // so the suite always exercises the labelled sample set.
            command: `GROQ_API_KEY=stub MODEL_BASE_URL=http://127.0.0.1:4111/v1 PACK_FIXTURES_JSON= PACK_FIXTURES_JSON_B64= npm run build && GROQ_API_KEY=stub MODEL_BASE_URL=http://127.0.0.1:4111/v1 PACK_FIXTURES_JSON= PACK_FIXTURES_JSON_B64= npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
            url: baseURL,
            reuseExistingServer: false,
            timeout: 180_000,
          },
        ],
      }
    : {}),
});
