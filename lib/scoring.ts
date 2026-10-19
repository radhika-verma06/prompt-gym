import type { AttemptSummary, BaseState } from "@/lib/types";

/**
 * Score arithmetic. Uncertain and unresolved cases deliberately leave the
 * denominator: a technical failure or an honest "I can't tell" must never look
 * like a worse prompt.
 */

export function summarise(results: { state: BaseState }[]): AttemptSummary {
  const passed = results.filter((result) => result.state === "pass").length;
  const uncertain = results.filter((result) => result.state === "uncertain").length;
  const errors = results.filter((result) => result.state === "unresolved").length;
  const scored = results.filter((result) => result.state === "pass" || result.state === "fail").length;
  return { passed, scored, uncertain, errors, complete: errors === 0 };
}

export function ratio(summary: AttemptSummary): number {
  return summary.scored === 0 ? 0 : summary.passed / summary.scored;
}

export type AttemptMeta = {
  modelIds: { underTest: string; judge: string };
  settingsHash: string;
  evaluationVersion: string;
  fixtureSetId: string;
  summary: AttemptSummary;
};

export type Comparison =
  | { comparable: true; delta: number; reason?: undefined }
  | { comparable: false; reason: string; delta?: undefined };

/**
 * Attempts are only comparable when everything that could explain a change is held
 * constant. Otherwise the UI says so instead of implying a change it didn't measure.
 */
export function compareAttempts(previous: AttemptMeta, current: AttemptMeta): Comparison {
  if (previous.modelIds.underTest !== current.modelIds.underTest || previous.modelIds.judge !== current.modelIds.judge) {
    return { comparable: false, reason: "a different model was used" };
  }
  if (previous.settingsHash !== current.settingsHash) {
    return { comparable: false, reason: "the evaluation settings changed" };
  }
  if (previous.evaluationVersion !== current.evaluationVersion) {
    return { comparable: false, reason: "the evaluation rules changed" };
  }
  if (previous.fixtureSetId !== current.fixtureSetId) {
    return { comparable: false, reason: "a different set of test cases was used" };
  }
  if (previous.summary.scored !== current.summary.scored) {
    return {
      comparable: false,
      reason: `a different number of cases could be scored (${previous.summary.scored} vs ${current.summary.scored})`,
    };
  }
  return { comparable: true, delta: current.summary.passed - previous.summary.passed };
}

/** Best attempt is the highest ratio, never including an incomplete run. */
export function bestAttempt<T extends { summary: AttemptSummary; complete: boolean }>(attempts: T[]): T | undefined {
  const eligible = attempts.filter((attempt) => attempt.complete);
  return eligible.reduce<T | undefined>((best, attempt) => {
    if (!best) return attempt;
    if (ratio(attempt.summary) > ratio(best.summary)) return attempt;
    if (ratio(attempt.summary) === ratio(best.summary) && attempt.summary.passed > best.summary.passed) return attempt;
    return best;
  }, undefined);
}
