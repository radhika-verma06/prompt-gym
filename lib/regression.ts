import { compareAttempts, type AttemptMeta } from "@/lib/scoring";
import type { Attempt, CaseResult } from "@/lib/types";

/**
 * Observed regressions are facts about two runs. Explanations are hypotheses.
 * They are returned as different fields and never merged into one sentence, so the
 * UI cannot present a guess as a finding.
 */

export type Observation = {
  caseId: string;
  caseName: string;
  from: { attempt: number; state: CaseResult["state"] };
  to: { attempt: number; state: CaseResult["state"] };
  /** What changed in the model's behaviour, in plain language. */
  observedDifference: string;
  /** The user's own prompt lines, so the edit is visible without revealing inputs. */
  promptChange: { added: string[]; removed: string[] };
};

export type Inference = {
  kind: "inference";
  confidence: "low" | "moderate";
  text: string;
  basis: string;
};

export type RegressionReport = {
  observations: Observation[];
  inference?: Inference;
};

function lineDiff(previous: string, current: string) {
  const before = previous.split("\n").map((line) => line.trim()).filter(Boolean);
  const after = current.split("\n").map((line) => line.trim()).filter(Boolean);
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  return {
    removed: before.filter((line) => !afterSet.has(line)),
    added: after.filter((line) => !beforeSet.has(line)),
  };
}

function describeChange(from: CaseResult, to: CaseResult): string {
  if (from.state === "pass" && to.state === "fail") {
    return `The "${to.decidedBy}" check passed earlier and fails now: ${to.observed}`;
  }
  return to.observed;
}

/**
 * Returns observations whenever a case flipped pass → fail. An inference is added
 * only when the two runs are comparable, exactly one case flipped, and the prompt
 * change was localised — otherwise the caller shows observation only.
 */
export function detectRegressions(previous: Attempt, current: Attempt): RegressionReport {
  const byCase = new Map(previous.results.map((result) => [result.caseId, result]));
  const observations: Observation[] = [];
  // Any changed case counts, including improvements: an inference is only honest when
  // the attempt pair isolates one changed behaviour.
  let changedCases = 0;

  for (const result of current.results) {
    const before = byCase.get(result.caseId);
    if (!before) continue;
    if (before.state !== result.state) changedCases += 1;
    if (before.state === "pass" && result.state === "fail") {
      observations.push({
        caseId: result.caseId,
        caseName: result.caseName,
        from: { attempt: previous.n, state: before.state },
        to: { attempt: current.n, state: result.state },
        observedDifference: describeChange(before, result),
        promptChange: lineDiff(previous.prompt, current.prompt),
      });
    }
  }

  if (observations.length !== 1 || changedCases !== 1) return { observations };

  const comparison = compareAttempts(previous as AttemptMeta, current as AttemptMeta);
  if (!comparison.comparable) return { observations };

  const { added, removed } = observations[0].promptChange;
  const editedLines = added.length + removed.length;
  if (editedLines === 0 || editedLines > 4) return { observations };

  const confidence: Inference["confidence"] = editedLines <= 2 ? "moderate" : "low";

  return {
    observations,
    inference: {
      kind: "inference",
      confidence,
      text:
        "The edit narrowed how one behaviour is described, and that is the case which flipped. A narrower rule can trade accuracy on the rest of the message for accuracy on the part you were fixing.",
      basis: `One of six cases changed while the other five held; the prompt edit was ${editedLines} line${
        editedLines === 1 ? "" : "s"
      }; both attempts used the same model, settings and cases.`,
    },
  };
}
