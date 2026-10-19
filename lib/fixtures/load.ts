import { createHash } from "node:crypto";
import seSample from "@/fixtures/sample/structured-extraction.json";
import frSample from "@/fixtures/sample/following-rules.json";
import rwSample from "@/fixtures/sample/rewrite-without-losing-meaning.json";
import { getPack } from "@/lib/packs";
import { fixtureSetSchema, type FixtureSet, type LoadedFixtures } from "./schema";

/**
 * SERVER ONLY. This module reads hidden inputs, so it must never be imported by a
 * client component. The guard below turns a mistake into a loud error instead of a
 * silent bundle leak.
 */
if (typeof window !== "undefined") {
  throw new Error("lib/fixtures/load.ts is server-only: private fixtures must never reach the browser.");
}

const SAMPLES: Record<string, unknown> = {
  "structured-extraction": seSample,
  "following-rules": frSample,
  "rewrite-without-losing-meaning": rwSample,
};

type ParseResult =
  | { ok: true; bundle: Record<string, FixtureSet> }
  | { ok: false; error: string };

/** Accepts either one set or a map of packId → set. */
export function parseFixtureBundle(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { ok: false, error: `PACK_FIXTURES_JSON is not valid JSON (${(error as Error).message}).` };
  }

  if (parsed && typeof parsed === "object" && "packId" in parsed) {
    const single = fixtureSetSchema.safeParse(parsed);
    if (!single.success) return { ok: false, error: describe(single.error.issues) };
    return { ok: true, bundle: { [single.data.packId]: single.data } };
  }

  if (parsed && typeof parsed === "object") {
    const bundle: Record<string, FixtureSet> = {};
    for (const [packId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const result = fixtureSetSchema.safeParse(value);
      if (!result.success) {
        return { ok: false, error: `Pack "${packId}": ${describe(result.error.issues)}` };
      }
      bundle[packId] = result.data;
    }
    return { ok: true, bundle };
  }

  return { ok: false, error: "PACK_FIXTURES_JSON must be a fixture set or a map of packId → fixture set." };
}

function describe(issues: { path: (string | number | symbol)[]; message: string }[]): string {
  return issues
    .slice(0, 3)
    .map((issue) => `${issue.path.map(String).join(".") || "(root)"} — ${issue.message}`)
    .join("; ");
}

/** Criteria a fixture references must exist in the public pack. */
function checkCriteria(packId: string, set: FixtureSet): string | null {
  const pack = getPack(packId);
  if (!pack) return `No public pack named "${packId}".`;
  const known = new Set(pack.criteria.map((criterion) => criterion.id));
  for (const fixtureCase of set.cases) {
    for (const id of fixtureCase.criterionIds) {
      if (!known.has(id)) return `Case "${fixtureCase.id}" references unknown criterion "${id}".`;
    }
  }
  return null;
}

const cache = new Map<string, LoadedFixtures>();

/**
 * Next's env loader expands `$NAME` inside .env values, which corrupts currency
 * symbols in fixture text (measured: a currency value such as "$12.34" arrived as ".34"). Base64 is the
 * recommended encoding for local env files; raw JSON stays supported for platforms
 * that inject values verbatim.
 */
function configuredValue(): string | undefined {
  const encoded = process.env.PACK_FIXTURES_JSON_B64;
  if (encoded && encoded.trim().length > 0) {
    try {
      return Buffer.from(encoded.trim(), "base64").toString("utf8");
    } catch (error) {
      console.error(`[fixtures] PACK_FIXTURES_JSON_B64 could not be decoded: ${(error as Error).message}`);
      return undefined;
    }
  }
  return process.env.PACK_FIXTURES_JSON;
}

export function loadFixtures(packId: string): LoadedFixtures {
  const cached = cache.get(packId);
  if (cached) return cached;

  const raw = configuredValue();
  if (raw && raw.trim().length > 0) {
    const parsed = parseFixtureBundle(raw);
    if (parsed.ok && parsed.bundle[packId]) {
      const set = parsed.bundle[packId];
      const problem = checkCriteria(packId, set);
      if (!problem) {
        const loaded: LoadedFixtures = { set, source: "production" };
        cache.set(packId, loaded);
        return loaded;
      }
      console.error(`[fixtures] production fixtures rejected for ${packId}: ${problem}`);
    } else if (!parsed.ok) {
      console.error(`[fixtures] ${parsed.error}`);
    } else {
      console.error(`[fixtures] PACK_FIXTURES_JSON has no set for "${packId}".`);
    }
  }

  const sample = fixtureSetSchema.safeParse(SAMPLES[packId]);
  if (!sample.success) {
    throw new Error(`Sample fixtures for "${packId}" are invalid: ${describe(sample.error.issues)}`);
  }
  const sampleProblem = checkCriteria(packId, sample.data);
  if (sampleProblem) throw new Error(`Sample fixtures for "${packId}" are invalid: ${sampleProblem}`);

  const loaded: LoadedFixtures = {
    set: sample.data,
    source: "sample",
    reason: raw && raw.trim().length > 0 ? "Production fixtures were unusable; using the shipped sample set." : "No production fixtures configured; using the shipped sample set.",
  };
  cache.set(packId, loaded);
  return loaded;
}

/** Stable identity for an attempt's comparisons. */
export function fixtureSetId(set: FixtureSet): string {
  const canonical = JSON.stringify({
    packId: set.packId,
    id: set.id,
    evaluationVersion: set.evaluationVersion,
    cases: set.cases.map((c) => ({ id: c.id, input: c.input, acceptable: c.acceptable, checks: c.checks })),
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

/** Diagnostic used by the workspace badge and the README instructions. */
export function fixtureStatus(): { productionConfigured: boolean; packs: string[] } {
  const raw = configuredValue();
  return {
    productionConfigured: Boolean(raw && raw.trim().length > 0),
    packs: Object.keys(SAMPLES),
  };
}

/** Test-only: drop the in-process cache. */
export function resetFixtureCache(): void {
  cache.clear();
}
