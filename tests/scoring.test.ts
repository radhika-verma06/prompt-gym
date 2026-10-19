import { describe, expect, it } from "vitest";
import { bestAttempt, compareAttempts, ratio, summarise, type AttemptMeta } from "@/lib/scoring";
import type { BaseState } from "@/lib/types";

const states = (...values: BaseState[]) => values.map((state) => ({ state }));

describe("summarise", () => {
  it("counts passes, scored cases, uncertainty and errors separately", () => {
    const summary = summarise(states("pass", "pass", "fail", "uncertain", "unresolved", "pass"));
    expect(summary).toEqual({ passed: 3, scored: 4, uncertain: 1, errors: 1, complete: false });
  });

  it("keeps errors and uncertainty out of the denominator", () => {
    const withError = summarise(states("pass", "fail", "unresolved", "uncertain"));
    expect(withError.scored).toBe(2);
    expect(ratio(withError)).toBe(0.5);
  });

  it("treats an error-free run as complete", () => {
    expect(summarise(states("pass", "uncertain")).complete).toBe(true);
  });

  it("does not divide by zero", () => {
    expect(ratio(summarise(states("uncertain", "unresolved")))).toBe(0);
  });
});

const base: AttemptMeta = {
  modelIds: { underTest: "small", judge: "large" },
  settingsHash: "settings-1",
  evaluationVersion: "eval-1",
  fixtureSetId: "fixture-1",
  summary: { passed: 3, scored: 5, uncertain: 1, errors: 0, complete: true },
};

describe("compareAttempts", () => {
  it("computes a delta when everything that matters matches", () => {
    const result = compareAttempts(base, { ...base, summary: { ...base.summary, passed: 2 } });
    expect(result).toEqual({ comparable: true, delta: -1 });
  });

  it("refuses to compare across different models", () => {
    const result = compareAttempts(base, { ...base, modelIds: { underTest: "other", judge: "large" } });
    expect(result.comparable).toBe(false);
    if (!result.comparable) expect(result.reason).toMatch(/model/);
  });

  it("refuses to compare when settings changed", () => {
    expect(compareAttempts(base, { ...base, settingsHash: "settings-2" }).comparable).toBe(false);
  });

  it("refuses to compare when the evaluation rules changed", () => {
    expect(compareAttempts(base, { ...base, evaluationVersion: "eval-2" }).comparable).toBe(false);
  });

  it("refuses to compare across different fixture sets", () => {
    expect(compareAttempts(base, { ...base, fixtureSetId: "fixture-2" }).comparable).toBe(false);
  });

  it("refuses to compare when a different number of cases could be scored", () => {
    const result = compareAttempts(base, { ...base, summary: { ...base.summary, scored: 6, passed: 4 } });
    expect(result.comparable).toBe(false);
    if (!result.comparable) expect(result.reason).toMatch(/number of cases/);
  });
});

describe("bestAttempt", () => {
  it("picks the highest ratio and ignores incomplete runs", () => {
    const best = bestAttempt([
      { id: "a", complete: true, summary: { passed: 2, scored: 6, uncertain: 0, errors: 0, complete: true } },
      { id: "b", complete: true, summary: { passed: 4, scored: 5, uncertain: 1, errors: 0, complete: true } },
      { id: "c", complete: false, summary: { passed: 6, scored: 6, uncertain: 0, errors: 1, complete: false } },
    ]);
    expect(best?.id).toBe("b");
  });

  it("returns undefined when every run is incomplete", () => {
    expect(
      bestAttempt([{ id: "c", complete: false, summary: { passed: 6, scored: 6, uncertain: 0, errors: 1, complete: false } }]),
    ).toBeUndefined();
  });
});
