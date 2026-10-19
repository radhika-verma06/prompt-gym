import { loadFixtures, fixtureSetId } from "@/lib/fixtures/load";
import { evaluateCase, type CompletionFn, type JudgeFn } from "@/lib/evaluate";
import { complete } from "@/lib/model/client";
import { models, settingsHash } from "@/lib/model/settings";
import { getPack } from "@/lib/packs";
import { LIMITS } from "@/lib/limits";
import { summarise } from "@/lib/scoring";
import type { CaseResult } from "@/lib/types";
import { judgeCheck } from "@/lib/validators/judge";

/**
 * SERVER ONLY. One run = one pack's six cases, executed with limited concurrency and
 * emitted case by case. The generator shape is what lets the route stream: the browser
 * sees a result the moment it exists instead of waiting for the slowest case.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/run.ts is server-only.");
}

export type RunMeta = {
  packId: string;
  modelIds: { underTest: string; judge: string };
  settingsHash: string;
  evaluationVersion: string;
  fixtureSetId: string;
  fixtureSource: "production" | "sample";
  fixtureNote?: string;
  caseCount: number;
};

export type RunEvent =
  | { type: "meta"; meta: RunMeta }
  | { type: "case"; result: CaseResult }
  | {
      type: "done";
      summary: { passed: number; scored: number; uncertain: number; errors: number };
      complete: boolean;
      durationMs: number;
    }
  | { type: "error"; code: string; message: string; retryAfterSeconds?: number };

export type ExecuteArgs = {
  packId: string;
  prompt: string;
  spend: () => Promise<boolean>;
  now?: () => number;
  /** Injected by tests; production uses the real provider client. */
  completion?: CompletionFn;
  judge?: JudgeFn;
};

export async function* executeRun(args: ExecuteArgs): AsyncGenerator<RunEvent> {
  const { packId, prompt } = args;
  const now = args.now ?? Date.now;
  const startedAt = now();
  const deadline = startedAt + LIMITS.perRunTimeoutMs;

  const pack = getPack(packId);
  if (!pack) {
    yield { type: "error", code: "unknown_pack", message: "That challenge pack doesn't exist." };
    return;
  }

  const fixtures = loadFixtures(packId);

  yield {
    type: "meta",
    meta: {
      packId,
      modelIds: { underTest: models.underTest, judge: models.judge },
      settingsHash: settingsHash(),
      evaluationVersion: fixtures.set.evaluationVersion,
      fixtureSetId: fixtureSetId(fixtures.set),
      fixtureSource: fixtures.source,
      fixtureNote: fixtures.reason,
      caseCount: fixtures.set.cases.length,
    },
  };

  // Every model call is gated on the shared budget, including the judge's.
  const callProvider = args.completion ?? complete;
  const guardedCompletion: CompletionFn = async (request) => {
    if (!(await args.spend())) {
      return { text: "", failed: true, failure: "daily budget exhausted" };
    }
    return callProvider(request);
  };

  const guardedJudge: JudgeFn = args.judge ?? ((input) => judgeCheck({ ...input, completion: guardedCompletion }));

  const cases = fixtures.set.cases;
  const results: CaseResult[] = [];
  const inFlight = new Map<number, Promise<{ index: number; result: CaseResult }>>();
  let next = 0;

  const start = (index: number) => {
    const fixtureCase = cases[index]!;
    const promise = evaluateCase({
      pack,
      fixtureCase,
      prompt,
      completion: guardedCompletion,
      judge: guardedJudge,
    }).then((result) => ({ index, result }));
    inFlight.set(index, promise);
  };

  while (next < cases.length || inFlight.size > 0) {
    while (inFlight.size < LIMITS.concurrentCases && next < cases.length) {
      if (now() > deadline) break;
      start(next);
      next += 1;
    }

    // The run ceiling is honest about time rather than faking a verdict.
    if (now() > deadline && inFlight.size === 0) {
      while (next < cases.length) {
        const fixtureCase = cases[next]!;
        const result: CaseResult = {
          caseId: fixtureCase.id,
          caseName: fixtureCase.name,
          criterionIds: fixtureCase.criterionIds,
          tier: fixtureCase.checks.some((check) => check.tier === "B") ? "B" : "A",
          decidedBy: "run time limit",
          state: "unresolved",
          observed: "The run hit its time limit before this case could be evaluated.",
          publicResponse: null,
          withheld: false,
          checks: [],
        };
        results.push(result);
        yield { type: "case", result };
        next += 1;
      }
      break;
    }

    if (inFlight.size === 0) break;

    const settled = await Promise.race(inFlight.values());
    inFlight.delete(settled.index);
    results.push(settled.result);
    yield { type: "case", result: settled.result };
  }

  const summary = summarise(results);
  yield {
    type: "done",
    summary: { passed: summary.passed, scored: summary.scored, uncertain: summary.uncertain, errors: summary.errors },
    complete: summary.complete && results.length === cases.length,
    durationMs: now() - startedAt,
  };
}
