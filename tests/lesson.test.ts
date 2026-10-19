import { describe, expect, it } from "vitest";
import { buildLesson } from "@/lib/lesson";
import { flagship } from "@/lib/packs";
import type { CaseResult } from "@/lib/types";

function result(caseId: string, criterionIds: string[], state: CaseResult["state"], caseName = caseId): CaseResult {
  return {
    caseId,
    caseName,
    criterionIds,
    tier: "A",
    decidedBy: "JSON parse check",
    state,
    observed: "Something observable happened.",
    publicResponse: null,
    withheld: false,
    checks: [],
  };
}

describe("buildLesson", () => {
  it("names the criterion that actually failed", () => {
    const lesson = buildLesson(flagship, [
      result("case-1", ["C1", "C2"], "pass"),
      result("case-2", ["C3"], "fail", "No order identifier"),
      result("case-3", ["C4"], "pass"),
    ]);

    expect(lesson.headline).toContain("C3");
    expect(lesson.detail).toContain("No order identifier");
    expect(lesson.detail).toContain("3 other criteria held");
    const c3 = lesson.criteria.find((criterion) => criterion.id === "C3");
    expect(c3?.status).toBe("missed");
    expect(c3?.failedCases).toEqual(["No order identifier"]);
  });

  it("does not claim anything about criteria no case tested", () => {
    const lesson = buildLesson(flagship, [result("case-1", ["C1"], "pass")]);
    const c4 = lesson.criteria.find((criterion) => criterion.id === "C4");
    expect(c4?.status).toBe("untested");
    expect(lesson.detail).toContain("1 of 1 criteria");
  });

  it("says so when every scored criterion held", () => {
    const lesson = buildLesson(flagship, [
      result("case-1", ["C1"], "pass"),
      result("case-2", ["C2"], "pass"),
    ]);
    expect(lesson.headline).toBe("Every scored criterion held.");
    expect(lesson.metCount).toBe(2);
  });

  it("keeps uncertain criteria out of both columns", () => {
    const lesson = buildLesson(flagship, [
      result("case-1", ["C1"], "pass"),
      result("case-2", ["C5"], "uncertain"),
    ]);
    expect(lesson.criteria.find((criterion) => criterion.id === "C5")?.status).toBe("uncertain");
    expect(lesson.testedCount).toBe(1);
    expect(lesson.detail).toContain("stayed undecided");
  });

  it("marks a criterion that changed between attempts", () => {
    const before = [result("case-1", ["C1"], "fail"), result("case-2", ["C2"], "pass")];
    const after = [result("case-1", ["C1"], "pass"), result("case-2", ["C2"], "fail")];
    const lesson = buildLesson(flagship, after, before);
    expect(lesson.criteria.find((criterion) => criterion.id === "C1")?.changed).toBe("newly-met");
    expect(lesson.criteria.find((criterion) => criterion.id === "C2")?.changed).toBe("newly-missed");
    expect(lesson.detail).toContain("Newly met");
    expect(lesson.detail).toContain("Newly missed");
  });

  it("produces no percentage it cannot compute", () => {
    const lesson = buildLesson(flagship, [result("case-1", ["C1"], "unresolved")]);
    expect(lesson.testedCount).toBe(0);
    expect(lesson.headline).toContain("No criterion could be scored");
  });
});
