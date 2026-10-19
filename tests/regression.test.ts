import { describe, expect, it } from "vitest";
import { detectRegressions } from "@/lib/regression";
import type { Attempt, CaseResult } from "@/lib/types";
import { summarise } from "@/lib/scoring";

function caseResult(caseId: string, state: CaseResult["state"], name = `Case ${caseId}`): CaseResult {
  return {
    caseId,
    caseName: name,
    criterionIds: ["C4"],
    tier: "A",
    decidedBy: "amount check",
    state,
    observed: "The amount reported isn't the refund this message is asking for.",
    publicResponse: "{}",
    withheld: false,
    checks: [],
  };
}

function attempt(n: number, prompt: string, states: CaseResult["state"][]): Attempt {
  const results = states.map((state, index) => caseResult(`case-${index + 1}`, state));
  return {
    n,
    prompt,
    startedAt: "2026-10-17T10:00:00.000Z",
    modelIds: { underTest: "small", judge: "large" },
    settingsHash: "settings-1",
    evaluationVersion: "eval-1",
    fixtureSetId: "fixture-1",
    fixtureSource: "production",
    results,
    summary: summarise(results),
    complete: results.every((result) => result.state !== "unresolved"),
  };
}

describe("detectRegressions", () => {
  it("observes a flip even when no explanation is warranted", () => {
    const previous = attempt(1, "a\nb", ["pass", "pass", "fail", "pass", "pass", "pass"]);
    // Two cases flipped: too much changed to attribute a cause.
    const current = attempt(2, "a\nb", ["fail", "pass", "fail", "pass", "pass", "fail"]);
    const report = detectRegressions(previous, current);
    expect(report.observations.length).toBeGreaterThan(1);
    expect(report.inference).toBeUndefined();
  });

  it("explains a single flip when the edit was localised", () => {
    const previous = attempt(1, "Keep the identifier.\nUse the refund amount.\nMark missing values unknown.", [
      "pass",
      "pass",
      "pass",
      "pass",
      "pass",
      "pass",
    ]);
    const current = attempt(2, "Keep the identifier.\nAlways use the first amount you see.\nMark missing values unknown.", [
      "pass",
      "pass",
      "fail",
      "pass",
      "pass",
      "pass",
    ]);
    const report = detectRegressions(previous, current);
    expect(report.observations).toHaveLength(1);
    expect(report.observations[0].caseId).toBe("case-3");
    expect(report.observations[0].promptChange.added).toEqual(["Always use the first amount you see."]);
    expect(report.observations[0].promptChange.removed).toEqual(["Use the refund amount."]);
    expect(report.inference?.kind).toBe("inference");
    expect(report.inference?.confidence).toBe("moderate");
  });

  it("does not explain when another case changed at the same time, even if it improved", () => {
    const previous = attempt(1, "Keep the identifier.\nUse the refund amount.\nMark missing values unknown.", [
      "pass",
      "pass",
      "fail",
      "pass",
      "pass",
      "pass",
    ]);
    // One case improved and one regressed: two behaviours changed, so a single cause
    // would be a claim the evidence can't support.
    const current = attempt(2, "Keep the identifier.\nMerge multiple requests into one object.", [
      "pass",
      "pass",
      "pass",
      "pass",
      "fail",
      "pass",
    ]);
    const report = detectRegressions(previous, current);
    expect(report.observations).toHaveLength(1);
    expect(report.inference).toBeUndefined();
  });

  it("never explains when the attempts are not comparable", () => {
    const previous = attempt(1, "a", ["pass", "pass", "pass", "pass", "pass", "pass"]);
    const current = { ...attempt(2, "a\nb", ["pass", "pass", "fail", "pass", "pass", "pass"]), fixtureSetId: "fixture-2" };
    const report = detectRegressions(previous, current);
    expect(report.observations).toHaveLength(1);
    expect(report.inference).toBeUndefined();
  });

  it("does not explain a very large rewrite", () => {
    const previous = attempt(1, "one", ["pass", "pass", "pass", "pass", "pass", "pass"]);
    const current = attempt(
      2,
      "one\ntwo\nthree\nfour\nfive\nsix",
      ["pass", "pass", "fail", "pass", "pass", "pass"],
    );
    expect(detectRegressions(previous, current).inference).toBeUndefined();
  });

  it("reports nothing when no case regressed", () => {
    const previous = attempt(1, "a", ["pass", "fail", "pass", "pass", "pass", "pass"]);
    const current = attempt(2, "a\nb", ["pass", "pass", "pass", "pass", "pass", "pass"]);
    const report = detectRegressions(previous, current);
    expect(report.observations).toHaveLength(0);
    expect(report.inference).toBeUndefined();
  });

  it("does not call an uncertain case a regression", () => {
    const previous = attempt(1, "a", ["pass", "uncertain", "pass", "pass", "pass", "pass"]);
    const current = attempt(2, "a\nb", ["pass", "fail", "pass", "pass", "pass", "pass"]);
    expect(detectRegressions(previous, current).observations).toHaveLength(0);
  });

  it("types inference separately from observation", () => {
    const previous = attempt(1, "Use the refund amount.", ["pass", "pass", "pass", "pass", "pass", "pass"]);
    const current = attempt(2, "Always use the first amount.", ["pass", "pass", "fail", "pass", "pass", "pass"]);
    const report = detectRegressions(previous, current);
    expect(report.inference).toMatchObject({ kind: "inference" });
    expect(report.observations[0]).not.toHaveProperty("inference");
  });
});
