/**
 * Measured, not assumed.
 *
 *   npm run probe
 *
 * Loads `.env.local` the same way the app does (no key is ever printed), lists the
 * models this key can actually reach, then runs one realistic case call and one judge
 * call, timing both and printing the provider's rate-limit headers. Whatever this
 * prints is what belongs in README.md and in lib/model/settings.ts — not the model
 * names from a docs page.
 */

import { loadEnvConfig } from "@next/env";

// Must run before lib/model/settings is imported: that module reads the env at load.
loadEnvConfig(process.cwd());

const INPUT =
  "Order ORD-4410: you charged me twice. The $6.99 delivery fee was taken again, and I still haven't had the $34.99 refund you promised on the phone.";

const PROMPT =
  "Return a JSON object with exactly order_id, reason, amount_usd and wants_replacement. Mark a value unknown when the message doesn't state it.";

type Models = { underTest: string; judge: string };

async function timed<T>(label: string, run: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = performance.now();
  const value = await run();
  const ms = Math.round(performance.now() - start);
  console.log(`  ${label}: ${ms} ms`);
  return { value, ms };
}

async function headers(models: Models): Promise<void> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return;
  const response = await fetch(`${process.env.MODEL_BASE_URL ?? "https://api.groq.com/openai/v1"}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: models.underTest,
      messages: [{ role: "user", content: "Reply with the single word: ok" }],
      max_tokens: 5,
      temperature: 0,
    }),
  });
  console.log(`\nRate-limit headers (status ${response.status}):`);
  const wanted = [
    "retry-after",
    "x-ratelimit-limit-requests",
    "x-ratelimit-remaining-requests",
    "x-ratelimit-limit-tokens",
    "x-ratelimit-remaining-tokens",
    "x-ratelimit-reset-requests",
    "x-ratelimit-reset-tokens",
  ];
  for (const name of wanted) {
    const value = response.headers.get(name);
    if (value) console.log(`  ${name}: ${value}`);
  }
  await response.text();
}

async function main(): Promise<void> {
  if (!process.env.GROQ_API_KEY?.trim()) {
    console.error(
      "GROQ_API_KEY is not set. Add it to .env.local (git-ignored) and run this again — this probe needs a real key: its whole purpose is measurement.",
    );
    process.exit(1);
  }

  // Imported after .env.local is loaded so MODEL_* overrides apply.
  const { complete, listModels } = await import("../lib/model/client");
  const { models, generation } = await import("../lib/model/settings");

  console.log("Models reachable with this key:");
  const available = await listModels();
  console.log(available.map((id) => `  - ${id}`).join("\n"));

  for (const [role, id] of Object.entries(models)) {
    console.log(
      `\n${role === "underTest" ? "Model under test" : "Judge"}: ${id} — ${
        available.includes(id) ? "present" : "NOT in the advertised list"
      }`,
    );
  }

  console.log("\nSubject call (no JSON mode, exactly as the app sends it):");
  const subject = await timed("subject", () =>
    complete({
      model: models.underTest,
      system: PROMPT,
      user: INPUT,
      maxTokens: generation.maxTokensUnderTest,
      temperature: generation.temperature,
      reasoningEffort: generation.reasoningEffort,
    }),
  );
  if (subject.value.failed) console.error(`  failed: ${subject.value.failure}`);
  else {
    console.log(`  finish_reason: ${subject.value.finishReason ?? "(none)"}`);
    console.log(`  content length: ${subject.value.text.length}`);
    console.log(`  response: ${subject.value.text.slice(0, 240).replace(/\n/g, " ")}`);
  }
  try {
    JSON.parse(subject.value.text.trim());
    console.log("  parses as JSON: yes");
  } catch {
    console.log("  parses as JSON: no (that is a legitimate result, not a probe failure)");
  }

  console.log("\nJudge call (JSON mode required):");
  const judge = await timed("judge", () =>
    complete({
      model: models.judge,
      system: 'Return JSON only: {"verdict":"pass"|"fail"|"uncertain","reason":"one sentence"}',
      user: `Message:\n${INPUT}\n\nResponse to judge:\n${subject.value.text || "(empty)"}`,
      maxTokens: generation.maxTokensJudge,
      temperature: generation.temperature,
      reasoningEffort: generation.reasoningEffort,
      jsonMode: true,
    }),
  );
  if (judge.value.failed) {
    console.log(`  failed: ${judge.value.failure}`);
    console.log("  => JSON mode is not usable on this model. The judge must fall back or the model must change.");
  } else {
    try {
      const parsed = JSON.parse(judge.value.text.trim());
      console.log(`  JSON mode accepted, parsed verdict: ${JSON.stringify(parsed)}`);
    } catch {
      console.log(`  JSON mode returned unparseable text: ${judge.value.text.slice(0, 200)}`);
    }
  }

  await headers(models);

  console.log("\nCalls per run: 6 subject + one judge per judged check. Record these numbers in README.md before trusting a score.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
