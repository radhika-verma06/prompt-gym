import { complete, type Completion, type FailureKind } from "@/lib/model/client";
import { generation, models } from "@/lib/model/settings";
import type { FixtureCase } from "@/lib/fixtures/schema";
import { reviewResponse } from "@/lib/redact";
import type { Pack } from "@/lib/packs/types";
import type { CaseResult, BaseState } from "@/lib/types";
import { judgeCheck } from "@/lib/validators/judge";
import { CHECK_LABELS, runDeterministic, type CheckResult } from "@/lib/validators/deterministic";

/**
 * Server-only case execution.
 *
 * The model under test is called with the user's prompt as the system message and the
 * hidden message as the user turn. Nothing else is added: no output schema, no
 * "respond in JSON" instruction, no examples. If the challenge is output discipline,
 * the output discipline has to come from the prompt being tested.
 */

export type CompletionFn = (request: Parameters<typeof complete>[0]) => Promise<Completion>;
export type JudgeFn = typeof judgeCheck;

export type EvaluateCaseArgs = {
  pack: Pack;
  fixtureCase: FixtureCase;
  prompt: string;
  /** Injected in tests so the suite never touches the network. */
  completion?: CompletionFn;
  judge?: JudgeFn;
};

/**
 * A technical failure must never read like a verdict on the prompt. When the cause is
 * known, the learner is told the true one — a shared free key running out of tokens for
 * a minute is not evidence about their writing.
 */
function failureSentence(kind: FailureKind | undefined): string {
  switch (kind) {
    case "rate_limited":
      return "The shared practice key hit the provider's per-minute limit, so this case wasn't scored. Nothing about the prompt caused it — wait a moment and run again.";
    case "unavailable":
      return "The provider was temporarily unreachable, so this case wasn't scored either way.";
    case "timeout":
      return "The model didn't answer within the time limit, so this case wasn't scored either way.";
    default:
      return "The model call didn't complete, so this case wasn't scored either way.";
  }
}

function labelsFor(checks: { kind: string }[]): string {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const check of checks) {
    const label = CHECK_LABELS[check.kind] ?? check.kind;
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels.join(" · ");
}

function result(
  fixtureCase: FixtureCase,
  state: BaseState,
  decidedBy: string,
  observed: string,
  checks: CheckResult[],
  response: string | null,
): CaseResult {
  const review = response === null ? { publicResponse: null, withheld: false } : reviewResponse(response, fixtureCase);
  return {
    caseId: fixtureCase.id,
    caseName: fixtureCase.name,
    criterionIds: fixtureCase.criterionIds,
    tier: checks.some((check) => check.tier === "B") ? "B" : "A",
    decidedBy,
    state,
    observed,
    publicResponse: review.publicResponse,
    withheld: review.withheld,
    checks,
  };
}

export async function evaluateCase(args: EvaluateCaseArgs): Promise<CaseResult> {
  const { pack, fixtureCase, prompt } = args;
  const call = args.completion ?? complete;
  const judged = args.judge ?? judgeCheck;

  const completion = await call({
    model: models.underTest,
    // Not even a version marker is appended: the prompt under test has to be exactly
    // what the user wrote. The wrapper's shape is recorded in settings instead.
    system: prompt,
    user: fixtureCase.input,
    maxTokens: generation.maxTokensUnderTest,
    temperature: generation.temperature,
    reasoningEffort: generation.reasoningEffort,
    timeoutMs: 20_000,
  });

  if (completion.failed) {
    return result(fixtureCase, "unresolved", "model call", failureSentence(completion.failureKind), [], null);
  }

  // An empty or truncated response is a plumbing failure, not a wrong answer. Counting
  // it as a fail would blame the prompt for our own output budget.
  if (completion.text.trim().length === 0 || completion.finishReason === "length") {
    return result(
      fixtureCase,
      "unresolved",
      "model output",
      completion.finishReason === "length"
        ? "The response hit the output limit before it finished, so this case wasn't scored."
        : "The model returned no text for this case, so it wasn't scored.",
      [],
      null,
    );
  }

  const response = completion.text;
  const ruleChecks = fixtureCase.checks.filter((check) => check.tier === "A");
  const judgedChecks = fixtureCase.checks.filter((check) => check.tier === "B");

  const decidedRules = ruleChecks.map((check) =>
    runDeterministic(check, response, fixtureCase.acceptable, fixtureCase.input),
  );
  const failedRule = decidedRules.find((check) => check.status === "fail");
  if (failedRule) {
    return result(
      fixtureCase,
      "fail",
      CHECK_LABELS[failedRule.kind] ?? failedRule.kind,
      failedRule.detail,
      decidedRules,
      response,
    );
  }

  const criterionText = fixtureCase.criterionIds
    .map((id) => pack.criteria.find((criterion) => criterion.id === id)?.label ?? id)
    .join("; ");

  const verdicts: CheckResult[] = [];
  for (const check of judgedChecks) {
    verdicts.push(
      await judged({
        kind: check.kind,
        packName: pack.name,
        criterion: criterionText,
        message: fixtureCase.input,
        response,
      }),
    );
  }

  const allChecks = [...decidedRules, ...verdicts];
  const failedJudge = verdicts.find((check) => check.status === "fail");
  if (failedJudge) {
    return result(fixtureCase, "fail", CHECK_LABELS[failedJudge.kind] ?? failedJudge.kind, failedJudge.detail, allChecks, response);
  }

  const uncertainJudge = verdicts.find((check) => check.status === "uncertain");
  if (uncertainJudge) {
    return result(
      fixtureCase,
      "uncertain",
      CHECK_LABELS[uncertainJudge.kind] ?? uncertainJudge.kind,
      uncertainJudge.detail,
      allChecks,
      response,
    );
  }

  const observed = decidedRules[0]?.detail ?? verdicts[0]?.detail ?? "Every check passed.";
  return result(fixtureCase, "pass", labelsFor([...ruleChecks, ...judgedChecks]), observed, allChecks, response);
}
