/**
 * PUBLIC pack metadata. Everything in this file and the pack modules beside it is
 * safe to publish: objectives, criteria and guidance. Case inputs and acceptable
 * answers live in a private fixture set loaded at runtime (see lib/fixtures/load.ts).
 */

export type Tier = "A" | "B";

export type Criterion = {
  /** Stable ID the UI, validators and fixtures all reference: "C1".."C6". */
  id: string;
  /** Short label shown in the workspace checklist. */
  label: string;
  /** What the check actually looks at, in one sentence. */
  detail: string;
  /**
   * "A" = decided by a rule (deterministic).
   * "B" = decided by a constrained model judge, because the criterion is interpretive.
   */
  tier: Tier;
};

export type Pack = {
  id: string;
  name: string;
  /** One line, used on the landing card. */
  tagline: string;
  /** The objective shown above the editor. */
  objective: string;
  /** The skill being practised, e.g. "output discipline". */
  skill: string;
  difficulty: 1 | 2 | 3;
  flagship: boolean;
  criteria: Criterion[];
  /**
   * Guidance shown behind a disclosure. Deliberately describes *what a strong prompt
   * does* rather than supplying a copy-ready prompt: the point is to practise, not paste.
   */
  guidance: string;
  /**
   * A deliberately incomplete scaffold offered by the starter-prompt button. It covers
   * the obvious parts of the task and leaves the hard behaviours undefined, so the first
   * run produces something to fix instead of a finished answer.
   */
  starterPrompt: string;
  caseCount: 6;
};

export const CASE_COUNT = 6;

export function assertSixCriteria(pack: Pack): Pack {
  if (pack.criteria.length !== CASE_COUNT) {
    throw new Error(`Pack "${pack.id}" must define exactly ${CASE_COUNT} criteria, found ${pack.criteria.length}.`);
  }
  return pack;
}
