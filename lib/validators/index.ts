import { CHECK_LABELS } from "./deterministic";

/**
 * The one place that answers "what decides this criterion?". The UI reads it to say
 * which tier produced a verdict, and a fixture can only use a kind listed here.
 */
export { CHECK_LABELS };

export function tierExplanation(tier: "A" | "B"): string {
  return tier === "A"
    ? "Decided by a fixed rule. The same response always gets the same verdict."
    : "Decided by a constrained judge, which sees the criterion and the response but never your prompt.";
}
