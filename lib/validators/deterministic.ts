import type { Acceptable, Check } from "@/lib/fixtures/schema";

/**
 * Tier A — decisions made by rules. No model is consulted, so these verdicts are
 * stable run to run. Every failure message describes behaviour, never an expected
 * value: the user has to reason about the fix.
 */

export type CheckStatus = "pass" | "fail" | "uncertain";

export type CheckResult = {
  kind: string;
  tier: "A" | "B";
  status: CheckStatus;
  /** One plain sentence for the UI. Never contains hidden input or expected values. */
  detail: string;
};

export const REQUIRED_KEYS = ["order_id", "reason", "amount_usd", "wants_replacement"] as const;

const FIELD_TYPES: Record<string, (value: unknown) => boolean> = {
  order_id: (value) => value === null || typeof value === "string",
  reason: (value) => typeof value === "string",
  amount_usd: (value) => value === null || typeof value === "number",
  wants_replacement: (value) => typeof value === "boolean",
};

export function parseJson(response: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(response.trim()) };
  } catch {
    return { ok: false };
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Accepts a single object or an array of objects (one per request). */
function asObjects(value: unknown): Record<string, unknown>[] | null {
  if (isPlainObject(value)) return [value];
  if (Array.isArray(value) && value.every(isPlainObject)) return value as Record<string, unknown>[];
  return null;
}

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    // Model output uses typographic punctuation; a phrase check must not fail on it.
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const pass = (kind: string, detail: string): CheckResult => ({ kind, tier: "A", status: "pass", detail });
const fail = (kind: string, detail: string): CheckResult => ({ kind, tier: "A", status: "fail", detail });

export function runDeterministic(check: Check, response: string, acceptable: Acceptable, input = ""): CheckResult {
  const kind = check.kind;
  const parsed = parseJson(response);
  const objects = parsed.ok ? asObjects(parsed.value) : null;

  switch (kind) {
    case "json-object": {
      if (!parsed.ok) return fail(kind, "The response isn't valid JSON on its own: extra text or a code fence breaks it.");
      if (!isPlainObject(parsed.value)) return fail(kind, "The response parses, but it isn't a single JSON object.");
      return pass(kind, "Valid JSON, and a single object.");
    }

    case "exact-keys": {
      if (!parsed.ok) return fail(kind, "There's no JSON to inspect, so the fields can't be checked.");
      if (!objects) return fail(kind, "The response isn't an object (or a list of them).");
      for (const object of objects) {
        const keys = Object.keys(object).sort();
        const expected = [...REQUIRED_KEYS].sort();
        if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
          return fail(kind, "The set of fields doesn't match the four the task asks for: something is missing or extra.");
        }
        for (const key of REQUIRED_KEYS) {
          if (!FIELD_TYPES[key](object[key])) {
            return fail(kind, `One field has the wrong type for ${key}.`);
          }
        }
      }
      return pass(kind, "All four fields present, with the right types.");
    }

    case "absent-fields": {
      if (!parsed.ok) return fail(kind, "There's no JSON to inspect, so the missing-value rule can't be checked.");
      if (!objects) return fail(kind, "The response isn't an object (or a list of them).");
      const absent = acceptable.absentFields ?? [];
      const object = objects[0];
      for (const field of absent) {
        if (!(field in object)) return fail(kind, "A field the task requires is missing from the response.");
        const value = object[field];
        const markedUnknown = value === null || (typeof value === "string" && value.trim().toLowerCase() === "unknown");
        if (!markedUnknown) {
          return fail(kind, "A value was supplied for something the message doesn't contain. It was guessed rather than marked unknown.");
        }
      }
      return pass(kind, "Absent values were marked unknown instead of invented.");
    }

    case "amount-set": {
      if (!parsed.ok) return fail(kind, "There's no JSON to inspect, so the amount can't be checked.");
      if (!objects) return fail(kind, "The response isn't an object (or a list of them).");
      const amount = objects[0].amount_usd;
      if (typeof amount !== "number") return fail(kind, "The amount isn't a number in the response.");
      const rounded = Number(amount.toFixed(2));
      const acceptableAmounts = (acceptable.amounts ?? []).map((value) => Number(value.toFixed(2)));
      if (!acceptableAmounts.includes(rounded)) {
        return fail(kind, "The amount reported isn't the refund this message is asking for.");
      }
      return pass(kind, "The amount matches the refund the message describes.");
    }

    case "request-count": {
      if (!parsed.ok) return fail(kind, "There's no JSON to inspect, so the requests can't be counted.");
      if (!objects) return fail(kind, "The response isn't an object (or a list of them).");
      if (objects.length !== (acceptable.requestCount ?? 1)) {
        return fail(kind, "The response doesn't capture every request in the message: something was dropped or merged.");
      }
      return pass(kind, "Both requests are represented separately.");
    }

    case "word-limit": {
      const limit = acceptable.maxWords ?? 45;
      const count = words(response).length;
      if (count === 0) return fail(kind, "The response is empty.");
      if (count > limit) return fail(kind, `The response runs past the ${limit}-word limit.`);
      return pass(kind, `Within the ${limit}-word limit.`);
    }

    case "forbidden-phrases": {
      const text = normalise(response);
      const hit = (acceptable.forbiddenPhrases ?? []).find((phrase) => text.includes(normalise(phrase)));
      if (hit) return fail(kind, "The reply commits to something the policy doesn't allow.");
      return pass(kind, "No commitment beyond what the policy permits.");
    }

    case "required-phrases": {
      const text = normalise(response);
      const phrases = acceptable.requiredPhrases ?? [];
      if (phrases.length === 0) return pass(kind, "Nothing required for this case.");
      if (!phrases.some((phrase) => text.includes(normalise(phrase)))) {
        return fail(kind, "The reply is missing something the policy requires it to state.");
      }
      return pass(kind, "The required outcome is stated.");
    }

    case "fact-retention": {
      const text = normalise(response);
      const missing = (acceptable.requiredFacts ?? []).filter((fact) => !text.includes(normalise(fact)));
      if (missing.length > 0) {
        return fail(kind, "At least one detail from the original doesn't appear in the rewrite.");
      }
      return pass(kind, "Every essential detail survived the rewrite.");
    }

    case "no-new-values": {
      // Every number in the reply must exist in the source text. Spelled numbers are
      // outside this check, so it only claims what it can actually see.
      const numbers = (text: string) =>
        (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((raw) => {
          const value = Number(raw.replace(/,/g, ""));
          return Number.isFinite(value) ? String(value) : raw;
        });
      const allowed = new Set(numbers(input));
      const invented = numbers(response).find((value) => !allowed.has(value));
      if (invented) {
        return fail(kind, "The reply introduces a figure that isn't in the original text.");
      }
      return pass(kind, "No figure appears that wasn't in the original.");
    }

    case "negation-preserved": {
      const text = normalise(response);
      const markers = acceptable.negationMarkers ?? [];
      if (markers.length === 0) return pass(kind, "No condition to preserve in this case.");
      if (!markers.some((marker) => text.includes(normalise(marker)))) {
        return fail(kind, "The rewrite loses a refusal or condition, so it now says something different.");
      }
      return pass(kind, "The refusal or condition still reads as one.");
    }

    case "single-paragraph": {
      const trimmed = response.trim();
      if (trimmed.length === 0) return fail(kind, "The response is empty.");
      if (/\n\s*\n/.test(trimmed)) return fail(kind, "The rewrite is split into several blocks instead of one paragraph.");
      if (/^(\s*[-*•]|\s*\d+\.|\s*#)/m.test(trimmed)) {
        return fail(kind, "The rewrite uses list or heading markers instead of plain prose.");
      }
      return pass(kind, "Reads as a single paragraph.");
    }

    // Tier B kinds never reach this function; the caller routes them to the judge.
    case "fabrication-judge":
    case "relevance-judge":
    case "tone-judge":
      return { kind, tier: "B", status: "uncertain", detail: "This check needs a judgement, not a rule." };

    default: {
      const exhaustive: never = kind;
      throw new Error(`Unhandled check kind: ${String(exhaustive)}`);
    }
  }
}

/** Human-readable name for the UI, so a case can say what decided it. */
export const CHECK_LABELS: Record<string, string> = {
  "json-object": "JSON parse check",
  "exact-keys": "field and type check",
  "absent-fields": "missing-value check",
  "amount-set": "amount check",
  "request-count": "request count",
  "word-limit": "word limit",
  "forbidden-phrases": "forbidden commitment check",
  "required-phrases": "required statement check",
  "fact-retention": "fact retention check",
  "no-new-values": "new-figure check",
  "negation-preserved": "negation check",
  "single-paragraph": "format check",
  "fabrication-judge": "constrained judge",
  "relevance-judge": "constrained judge",
  "tone-judge": "constrained judge",
};
