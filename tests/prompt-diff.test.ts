import { describe, expect, it } from "vitest";
import { caseChanges, diffLines } from "@/lib/prompt-diff";
import type { CaseResult } from "@/lib/types";

function result(caseId: string, state: CaseResult["state"]): CaseResult {
  return {
    caseId,
    caseName: `Case ${caseId}`,
    criterionIds: ["C1"],
    tier: "A",
    decidedBy: "a rule",
    state,
    observed: "Observed behaviour.",
    publicResponse: "{}",
    withheld: false,
    checks: [],
  };
}

describe("diffLines", () => {
  it("returns only unchanged lines for an identical prompt", () => {
    const diff = diffLines("one\ntwo", "one\ntwo");
    expect(diff).toEqual([
      { type: "same", text: "one" },
      { type: "same", text: "two" },
    ]);
  });

  it("marks an added instruction", () => {
    const diff = diffLines("keep the id\nmark missing values unknown", "keep the id\nuse the refund amount\nmark missing values unknown");
    expect(diff).toEqual([
      { type: "same", text: "keep the id" },
      { type: "add", text: "use the refund amount" },
      { type: "same", text: "mark missing values unknown" },
    ]);
  });

  it("marks a replaced instruction as both removed and added", () => {
    const diff = diffLines("keep the id\nuse any amount\nbe brief", "keep the id\nuse the refund amount\nbe brief");
    expect(diff.map((line) => line.type)).toEqual(["same", "remove", "add", "same"]);
    expect(diff[1].text).toBe("use any amount");
    expect(diff[2].text).toBe("use the refund amount");
  });

  it("ignores a trailing blank line and normalises line endings", () => {
    expect(diffLines("one\r\ntwo\r\n", "one\ntwo")).toEqual([
      { type: "same", text: "one" },
      { type: "same", text: "two" },
    ]);
  });
});

describe("caseChanges", () => {
  it("separates fixed cases from broken ones", () => {
    const changes = caseChanges(
      [result("a", "fail"), result("b", "pass"), result("c", "pass")],
      [result("a", "pass"), result("b", "fail"), result("c", "pass")],
    );
    expect(changes).toMatchObject({ comparable: true });
    expect(changes.fixed.map((move) => move.caseId)).toEqual(["a"]);
    expect(changes.broken.map((move) => move.caseId)).toEqual(["b"]);
  });

  it("does not count an uncertain case as a fix or a regression", () => {
    const changes = caseChanges([result("a", "uncertain")], [result("a", "fail")]);
    expect(changes.fixed).toHaveLength(0);
    expect(changes.broken).toHaveLength(0);
  });

  it("reports incomparable when a case id is missing from one attempt", () => {
    const changes = caseChanges([result("a", "pass")], [result("a", "pass"), result("b", "fail")]);
    expect(changes.comparable).toBe(false);
  });
});
