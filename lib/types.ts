import type { CheckResult } from "@/lib/validators/deterministic";

/** States a run can produce before comparison marks a regression. */
export type BaseState = "pass" | "fail" | "uncertain" | "unresolved";

/** What the list shows; `regressed` is derived by comparing attempts, never by a run. */
export type DisplayState = BaseState | "regressed";

export type CaseResult = {
  caseId: string;
  caseName: string;
  criterionIds: string[];
  /** The highest tier that decided this case. */
  tier: "A" | "B";
  /** Human-readable name of the check that decided it. */
  decidedBy: string;
  state: BaseState;
  /** One plain sentence describing behaviour. Never contains hidden input or expected values. */
  observed: string;
  /** The model's response, or null when withheld or unavailable. */
  publicResponse: string | null;
  withheld: boolean;
  checks: CheckResult[];
};

export type AttemptSummary = {
  passed: number;
  scored: number;
  uncertain: number;
  errors: number;
  complete: boolean;
};

export type Attempt = {
  n: number;
  prompt: string;
  startedAt: string;
  modelIds: { underTest: string; judge: string };
  settingsHash: string;
  evaluationVersion: string;
  fixtureSetId: string;
  fixtureSource: "production" | "sample";
  results: CaseResult[];
  summary: AttemptSummary;
  /** False when any case is unresolved, so it can't silently become the best attempt. */
  complete: boolean;
};
