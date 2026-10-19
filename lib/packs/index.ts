import { structuredExtraction } from "./structured-extraction";
import { followingRules } from "./following-rules";
import { rewriteMeaning } from "./rewrite-meaning";
import type { Pack } from "./types";

/** Public metadata only — safe to bundle and publish. */
export const packs: readonly Pack[] = [structuredExtraction, followingRules, rewriteMeaning];

export const flagship = structuredExtraction;

export function getPack(id: string): Pack | undefined {
  return packs.find((pack) => pack.id === id);
}

export function getCriterion(pack: Pack, id: string) {
  return pack.criteria.find((criterion) => criterion.id === id);
}

export type { Pack, Criterion } from "./types";
