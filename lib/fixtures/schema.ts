import { z } from "zod";

/**
 * PRIVATE fixture shape. These objects contain the hidden inputs and acceptable
 * answers, so they are never imported by a component and never committed for
 * production. They arrive from PACK_FIXTURES_JSON at runtime.
 */

export const VALIDATOR_KINDS = [
  // Tier A — decided by a rule
  "json-object",
  "exact-keys",
  "absent-fields",
  "amount-set",
  "request-count",
  "word-limit",
  "forbidden-phrases",
  "required-phrases",
  "fact-retention",
  "no-new-values",
  "negation-preserved",
  "single-paragraph",
  // Tier B — constrained judgement
  "fabrication-judge",
  "relevance-judge",
  "tone-judge",
] as const;

export type ValidatorKind = (typeof VALIDATOR_KINDS)[number];

export const acceptableSchema = z
  .object({
    amounts: z.array(z.number()).optional(),
    absentFields: z.array(z.string()).optional(),
    orderId: z.string().nullable().optional(),
    requestCount: z.number().int().positive().optional(),
    maxWords: z.number().int().positive().optional(),
    requiredFacts: z.array(z.string()).optional(),
    forbiddenPhrases: z.array(z.string()).optional(),
    requiredPhrases: z.array(z.string()).optional(),
    negationMarkers: z.array(z.string()).optional(),
    outcome: z.enum(["approved", "declined", "escalated"]).optional(),
  })
  .strict();

export const checkSchema = z
  .object({
    tier: z.enum(["A", "B"]),
    kind: z.enum(VALIDATOR_KINDS),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type Check = z.infer<typeof checkSchema>;

export const caseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    criterionIds: z.array(z.string().min(1)).min(1),
    /** Hidden from the user. */
    input: z.string().min(1),
    /** Hidden from the user. */
    acceptable: acceptableSchema,
    /**
     * How aggressively the response is withheld. "span" (default) hides a response that
     * reproduces 8+ consecutive words of the input. "whole-input-only" is for rewrite
     * tasks, where the output is derived from the input by design and hiding every
     * close paraphrase would remove the only evidence the learner can use.
     */
    redaction: z.enum(["span", "whole-input-only"]).optional(),
    /**
     * A case can test more than one criterion (C1 + C2, say), so it carries a list
     * of checks rather than one. It passes only when every check passes; any Tier A
     * failure decides the case immediately, and a Tier B `uncertain` is reported as
     * uncertain rather than as a failure.
     */
    checks: z.array(checkSchema).min(1),
  })
  .strict();

export const fixtureSetSchema = z
  .object({
    packId: z.string().min(1),
    id: z.string().min(1),
    evaluationVersion: z.string().min(1),
    cases: z.array(caseSchema).length(6),
  })
  .strict();

export type Acceptable = z.infer<typeof acceptableSchema>;
export type FixtureCase = z.infer<typeof caseSchema>;
export type FixtureSet = z.infer<typeof fixtureSetSchema>;

export type FixtureBundle = Record<string, FixtureSet>;

export type FixtureSource = "production" | "sample";

export type LoadedFixtures = {
  set: FixtureSet;
  source: FixtureSource;
  /** Why sample fixtures are in use, when they are. Shown in the UI, never hidden. */
  reason?: string;
};
