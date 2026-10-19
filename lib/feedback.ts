import type { CaseResult } from "@/lib/types";

/**
 * A hint names the behaviour the prompt needs to define. It never quotes an expected
 * value and never supplies an instruction that could be pasted: the user has to write
 * the sentence themselves.
 */

const HINTS: Record<string, string> = {
  "json-object":
    "The response shape is what breaks here. Define where the JSON starts and ends, and what the model may put around it.",
  "exact-keys":
    "The field set is the thing to pin down. Name every field, say whether extra fields are allowed, and state the type each one holds.",
  "absent-fields":
    "The gap worth defining is what to write when a detail is missing. Say explicitly whether a missing value is omitted, null, or marked unknown.",
  "amount-set":
    "The prompt doesn't settle which number matters. Say which figure in a message is the refund, and what to do when a message contains more than one.",
  "request-count":
    "The prompt doesn't say how multiple requests are handled. Define whether each request gets its own object, and whether one may ever be merged into another.",
  "word-limit":
    "The length constraint isn't binding. State the limit and say how it is measured, so the rule can't be read loosely.",
  "forbidden-phrases":
    "There's room for commitments the policy doesn't allow. Name the kinds of statement the reply must avoid.",
  "required-phrases":
    "The reply isn't required to state its outcome. Say what a reply must contain when a request is declined or escalated.",
  "fact-retention":
    "Detail isn't protected. Say that every fact in the original must survive, and that nothing may be added.",
  "no-new-values":
    "The reply introduces a figure the source never gave. Say that every number must come from the original text.",
  "negation-preserved":
    "A negation is being lost. Say that refusals and conditions must stay refusals after the rewrite.",
  "single-paragraph":
    "The format isn't pinned down. Say the output is one paragraph of prose, with no lists or headings.",
  "fabrication-judge":
    "The prompt doesn't define behaviour under ambiguity. Say that an unclear reference must be stated as unclear rather than resolved.",
};

export function hintFor(result: CaseResult): string | null {
  if (result.state === "pass" || result.state === "uncertain" || result.state === "unresolved") return null;
  const failing = result.checks.find((check) => check.status === "fail");
  if (!failing) return null;
  return HINTS[failing.kind] ?? null;
}

/** Short label and glyph so state is never carried by colour alone. */
export const STATE_PRESENTATION = {
  pass: { label: "Passed", glyph: "✓" },
  fail: { label: "Failed", glyph: "✕" },
  regressed: { label: "Regressed", glyph: "↺" },
  uncertain: { label: "Evaluation uncertain", glyph: "?" },
  unresolved: { label: "Not evaluated", glyph: "–" },
} as const;

export type DisplayStateKey = keyof typeof STATE_PRESENTATION;
