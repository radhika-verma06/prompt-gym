import type { Pack } from "@/lib/packs/types";
import type { CaseResult } from "@/lib/types";

/**
 * The lesson is assembled from criteria that were actually tested — never a canned
 * sentence. If a criterion had no scored case, the lesson says so rather than implying
 * anything about it.
 */

export type CriterionStatus = "met" | "missed" | "uncertain" | "untested";

export type CriterionState = {
  id: string;
  label: string;
  status: CriterionStatus;
  /** Cases that tested it and failed. */
  failedCases: string[];
  /** True when this criterion changed status since the previous attempt. */
  changed: "newly-met" | "newly-missed" | null;
};

export type Lesson = {
  criteria: CriterionState[];
  headline: string;
  detail: string;
  /** Only criteria with a verdict count as "tested". */
  testedCount: number;
  metCount: number;
};

export function criterionStates(results: CaseResult[], previous?: CaseResult[]): CriterionState[] {
  const before = previous ? new Map(statusMap(previous).map((state) => [state.id, state])) : null;
  return statusMap(results).map((state) => ({
    ...state,
    changed: before
      ? state.status === "met" && before.get(state.id)?.status === "missed"
        ? "newly-met"
        : state.status === "missed" && before.get(state.id)?.status === "met"
          ? "newly-missed"
          : null
      : null,
  }));
}

function statusMap(results: CaseResult[]): CriterionState[] {
  const byId = new Map<string, CriterionState>();

  for (const result of results) {
    for (const id of result.criterionIds) {
      const existing = byId.get(id) ?? { id, label: id, status: "untested", failedCases: [], changed: null };
      if (result.state === "fail") {
        existing.status = "missed";
        existing.failedCases.push(result.caseName);
      } else if (result.state === "uncertain") {
        if (existing.status !== "missed") existing.status = "uncertain";
      } else if (result.state === "pass") {
        if (existing.status === "untested") existing.status = "met";
      }
      byId.set(id, existing);
    }
  }

  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}

export function buildLesson(pack: Pack, results: CaseResult[], previous?: CaseResult[]): Lesson {
  const raw = new Map(criterionStates(results, previous).map((state) => [state.id, state]));
  // Every public criterion is listed, so "not tested" is visible rather than implied.
  const criteria = pack.criteria.map((criterion) => {
    const state = raw.get(criterion.id);
    return {
      id: criterion.id,
      label: criterion.label,
      status: state?.status ?? ("untested" as CriterionStatus),
      failedCases: state?.failedCases ?? [],
      changed: state?.changed ?? null,
    };
  });

  const tested = criteria.filter((state) => state.status === "met" || state.status === "missed");
  const met = tested.filter((state) => state.status === "met");
  const missed = tested.filter((state) => state.status === "missed");
  const uncertain = criteria.filter((state) => state.status === "uncertain");
  const newlyMet = criteria.filter((state) => state.changed === "newly-met");
  const newlyMissed = criteria.filter((state) => state.changed === "newly-missed");

  if (tested.length === 0) {
    return {
      criteria,
      headline: "No criterion could be scored in this attempt.",
      detail:
        uncertain.length > 0
          ? "The judged criterion couldn't be resolved, so there's no evidence to draw a lesson from yet."
          : "Every case failed to produce a verdict, so this attempt can't teach anything until a run completes.",
      testedCount: 0,
      metCount: 0,
    };
  }

  if (missed.length === 0) {
    const uncertainNote =
      uncertain.length > 0
        ? ` ${uncertain.map((state) => state.id).join(", ")} stayed undecided, so ${uncertain.length === 1 ? "it isn't" : "they aren't"} counted either way.`
        : "";
    return {
      criteria,
      headline: "Every scored criterion held.",
      detail: `${met.length} of ${tested.length} criteria passed in every case that tested them.${uncertainNote}`,
      testedCount: tested.length,
      metCount: met.length,
    };
  }

  const worst = [...missed].sort((a, b) => b.failedCases.length - a.failedCases.length)[0]!;
  const spread =
    worst.failedCases.length === 1
      ? `failed in one case (${worst.failedCases[0]})`
      : `failed in ${worst.failedCases.length} cases`;

  const others = met.length === 0 ? "no other criterion passed" : `${met.length} other criteria held wherever they were tested`;
  const uncertainNote = uncertain.length > 0 ? ` ${uncertain.map((state) => state.id).join(", ")} remained undecided.` : "";
  const improvement = newlyMet.length > 0 ? ` Newly met since the previous attempt: ${newlyMet.map((state) => state.id).join(", ")}.` : "";
  const regression = newlyMissed.length > 0 ? ` Newly missed since the previous attempt: ${newlyMissed.map((state) => state.id).join(", ")}.` : "";

  return {
    criteria,
    headline: `${worst.id} “${worst.label}” is the criterion to work on.`,
    detail: `It ${spread}, while ${others}.${uncertainNote}${improvement}${regression}`,
    testedCount: tested.length,
    metCount: met.length,
  };
}
