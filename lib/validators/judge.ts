import { z } from "zod";
import { complete, type Completion } from "@/lib/model/client";
import { generation, models } from "@/lib/model/settings";
import type { CheckResult } from "@/lib/validators/deterministic";

/**
 * Tier B — the constrained judge.
 *
 * The judge sees the criterion, the hidden input and the model's response. It does
 * not see the user's prompt: a judge that knows what the user was trying to do grades
 * the intention rather than the output, and would let a plausible explanation rescue a
 * wrong answer.
 *
 * Structured output is used here and only here: a parseable verdict is a plumbing
 * requirement, and nothing about the user's skill is being measured.
 */

const verdictSchema = z.object({
  verdict: z.enum(["pass", "fail", "uncertain"]),
  reason: z.string().min(1).max(400),
});

const CRITERIA_INSTRUCTIONS: Record<string, string> = {
  "fabrication-judge":
    "Decide whether the response asserts any fact about the customer message that the message does not support. Acceptable: marking a value unknown, null, or explaining that the message is ambiguous. Failing: naming an order, amount, product or outcome that the message never states, or silently resolving an ambiguous reference to one specific order.",
  "relevance-judge":
    "Decide whether the response addresses the request in the message. Failing: ignoring a request, answering a different question, or padding with content the request didn't ask for.",
  "tone-judge":
    "Decide whether the response follows the tone the message's task requires, staying professional and free of promises the message doesn't authorise. Failing: rudeness, or committing to an outcome that isn't supported.",
};

export type JudgeInput = {
  kind: string;
  packName: string;
  criterion: string;
  message: string;
  response: string;
  completion?: (request: Parameters<typeof complete>[0]) => Promise<Completion>;
};

const SYSTEM = `You are a careful evaluator for a prompt-writing exercise. You decide one narrow question and return JSON only.

Rules:
- Judge only what the response says, not what a good response could have said.
- Do not reward length, confidence or fluency.
- If the answer is genuinely ambiguous, return "uncertain" rather than guessing. "uncertain" is a legitimate verdict.
- Never quote the customer message in your reason. Describe the behaviour instead.

Return exactly: {"verdict":"pass"|"fail"|"uncertain","reason":"one sentence"}`;

export async function judgeCheck(input: JudgeInput): Promise<CheckResult> {
  const call = input.completion ?? complete;
  const instruction = CRITERIA_INSTRUCTIONS[input.kind] ?? CRITERIA_INSTRUCTIONS["fabrication-judge"];

  const result = await call({
    model: models.judge,
    system: SYSTEM,
    user: [
      `Challenge: ${input.packName}`,
      `Criterion under test: ${input.criterion}`,
      `Question: ${instruction}`,
      "",
      "Customer message:",
      '"""',
      input.message,
      '"""',
      "",
      "Response to judge:",
      '"""',
      input.response.trim().length > 0 ? input.response : "(empty response)",
      '"""',
    ].join("\n"),
    maxTokens: generation.maxTokensJudge,
    temperature: 0,
    reasoningEffort: generation.reasoningEffort,
    jsonMode: true,
    timeoutMs: 20_000,
  });

  if (result.failed) {
    return {
      kind: input.kind,
      tier: "B",
      status: "uncertain",
      detail: "The judge couldn't be reached, so this case can't be decided either way.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(result.text));
  } catch {
    return uncertain(input.kind, "The judge's verdict wasn't readable, so this case stays undecided.");
  }

  const verdict = verdictSchema.safeParse(parsed);
  if (!verdict.success) {
    return uncertain(input.kind, "The judge's verdict wasn't readable, so this case stays undecided.");
  }

  const reason = readableReason(verdict.data.reason, input.message);

  if (verdict.data.verdict === "uncertain") {
    return uncertain(input.kind, `The judge found this message genuinely supports more than one reading: ${reason}`);
  }

  return {
    kind: input.kind,
    tier: "B",
    status: verdict.data.verdict,
    detail: reason,
  };
}

function uncertain(kind: string, detail: string): CheckResult {
  return { kind, tier: "B", status: "uncertain", detail };
}

/** Some providers wrap JSON in a fence even in JSON mode. */
export function stripFence(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i.exec(trimmed);
  return fenced ? fenced[1]!.trim() : trimmed;
}

/**
 * A judge can paraphrase the hidden message even when it was told not to. If its
 * sentence reproduces a long span, the sentence is replaced: the verdict still counts,
 * the leak doesn't ship.
 */
export function readableReason(reason: string, message: string): string {
  const cleaned = reason.replace(/\s+/g, " ").trim().slice(0, 300);
  // Punctuation is stripped before tokenising: a comma shouldn't let a quote through.
  const normalise = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  const words = normalise(message).split(" ").filter(Boolean);
  const candidate = normalise(cleaned);

  for (let start = 0; start + 8 <= words.length; start += 1) {
    if (candidate.includes(words.slice(start, start + 8).join(" "))) {
      return "The judge decided on the basis of what the response asserts, without quoting the message.";
    }
  }
  return cleaned;
}
