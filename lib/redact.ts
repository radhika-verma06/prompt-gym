import type { FixtureCase } from "@/lib/fixtures/schema";

/**
 * Proportional redaction.
 *
 * The goal is to protect the hidden *text*, not to hide correct answers from the
 * person who produced them. A correct response is the evidence a learner reasons
 * from, so it stays visible. We withhold only when the response actually reproduces
 * the hidden message.
 */

const RESPONSE_CAP = 2000;
const SPAN_WORDS = 8;

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

function words(text: string): string[] {
  return normalise(text).split(" ").filter(Boolean);
}

/** True when a response reproduces the hidden input or a long span of it. */
export function disclosesHiddenInput(
  response: string,
  hiddenInput: string,
  policy: "span" | "whole-input-only" = "span",
): boolean {
  const reply = normalise(response);
  const input = normalise(hiddenInput);
  if (reply.length === 0 || input.length === 0) return false;
  if (reply.includes(input)) return true;
  if (policy === "whole-input-only") return false;

  const tokens = words(hiddenInput);
  if (tokens.length <= SPAN_WORDS) return false;

  for (let start = 0; start + SPAN_WORDS <= tokens.length; start += 1) {
    const span = tokens.slice(start, start + SPAN_WORDS).join(" ");
    if (reply.includes(span)) return true;
  }
  return false;
}

export type Review = {
  publicResponse: string | null;
  withheld: boolean;
  reason?: string;
};

export function reviewResponse(response: string, fixtureCase: FixtureCase): Review {
  const trimmed = response.trim();
  if (trimmed.length === 0) return { publicResponse: null, withheld: false };

  if (disclosesHiddenInput(trimmed, fixtureCase.input, fixtureCase.redaction ?? "span")) {
    return {
      publicResponse: null,
      withheld: true,
      reason: "The response reproduced the hidden message, so it is withheld to protect this case.",
    };
  }

  const capped =
    trimmed.length > RESPONSE_CAP
      ? `${trimmed.slice(0, RESPONSE_CAP).trimEnd()}\n… (response truncated at ${RESPONSE_CAP} characters)`
      : trimmed;

  return { publicResponse: capped, withheld: false };
}
