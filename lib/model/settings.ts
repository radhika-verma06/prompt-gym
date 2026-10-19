import { createHash } from "node:crypto";

/**
 * Frozen evaluation settings. Every attempt records these, so a score change can be
 * attributed to the prompt rather than to the plumbing.
 *
 * The model IDs below are the provider's current free-tier replacements for the two
 * Llama models that were shut down on 2026-08-16 (per Groq's deprecation page). They
 * are still *defaults, not measurements*: scripts/probe-provider.ts is what confirms
 * availability, JSON mode, latency and limits for the account in use. Both are
 * env-overridable so a wrong default costs one variable, not a rewrite.
 */

export const WRAPPER_VERSION = "promptgym-wrapper-1";

export const models = {
  underTest: process.env.MODEL_UNDER_TEST ?? "openai/gpt-oss-20b",
  judge: process.env.MODEL_JUDGE ?? "openai/gpt-oss-120b",
} as const;

export const generation = {
  /** Fixed for both roles: a delta must mean the prompt changed. */
  temperature: 0,
  /**
   * gpt-oss models spend output tokens on hidden reasoning before the answer. At the
   * default effort the 20B model used 698 of 700 tokens reasoning and returned an
   * empty `content` with finish_reason "length" (measured 2026-10-18). Low effort
   * returned the answer after 67 reasoning tokens. Pinned, not tuned per attempt.
   */
  reasoningEffort: "low",
  maxTokensUnderTest: 1_200,
  maxTokensJudge: 800,
} as const;

export const timeouts = {
  perCallMs: 20_000,
  perRunMs: 45_000,
} as const;

/** Stable identity for the comparability gate. */
export function settingsHash(): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        models,
        generation,
        wrapperVersion: WRAPPER_VERSION,
      }),
    )
    .digest("hex")
    .slice(0, 16);
}
