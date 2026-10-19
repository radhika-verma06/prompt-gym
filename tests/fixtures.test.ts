import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureSetId, loadFixtures, parseFixtureBundle, resetFixtureCache } from "@/lib/fixtures/load";
import { fixtureSetSchema } from "@/lib/fixtures/schema";
import seSample from "@/fixtures/sample/structured-extraction.json";

const originalEnv = process.env.PACK_FIXTURES_JSON;
const originalB64 = process.env.PACK_FIXTURES_JSON_B64;

function bundleWith(mutator: (set: any) => void) {
  const copy = JSON.parse(JSON.stringify(seSample));
  mutator(copy);
  return JSON.stringify({ "structured-extraction": copy });
}

beforeEach(() => {
  resetFixtureCache();
  delete process.env.PACK_FIXTURES_JSON;
  delete process.env.PACK_FIXTURES_JSON_B64;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env.PACK_FIXTURES_JSON = originalEnv;
  if (originalEnv === undefined) delete process.env.PACK_FIXTURES_JSON;
  process.env.PACK_FIXTURES_JSON_B64 = originalB64;
  if (originalB64 === undefined) delete process.env.PACK_FIXTURES_JSON_B64;
  vi.restoreAllMocks();
  resetFixtureCache();
});

describe("sample fixtures", () => {
  it("are valid, complete and clearly labelled as samples", () => {
    const loaded = loadFixtures("structured-extraction");
    expect(loaded.source).toBe("sample");
    expect(loaded.reason).toContain("sample");
    expect(loaded.set.cases).toHaveLength(6);
  });

  it("cover all three packs", () => {
    for (const packId of ["structured-extraction", "following-rules", "rewrite-without-losing-meaning"]) {
      const loaded = loadFixtures(packId);
      expect(loaded.set.packId).toBe(packId);
      expect(loaded.set.cases).toHaveLength(6);
    }
  });

  it("reference only criteria that exist in the public pack", () => {
    const loaded = loadFixtures("structured-extraction");
    const ids = new Set(loaded.set.cases.flatMap((c) => c.criterionIds));
    for (const id of ids) expect(["C1", "C2", "C3", "C4", "C5", "C6"]).toContain(id);
  });

  it("give every case hidden input and at least one check", () => {
    const loaded = loadFixtures("structured-extraction");
    for (const fixtureCase of loaded.set.cases) {
      expect(fixtureCase.input.length).toBeGreaterThan(20);
      expect(fixtureCase.checks.length).toBeGreaterThan(0);
    }
  });
});

describe("production fixture loading", () => {
  it("uses a valid configured bundle and marks it production", () => {
    process.env.PACK_FIXTURES_JSON = bundleWith(() => {});
    const loaded = loadFixtures("structured-extraction");
    expect(loaded.source).toBe("production");
    expect(loaded.reason).toBeUndefined();
  });

  it("decodes a base64 bundle, preserving characters .env files expand away", () => {
    const copy = JSON.parse(JSON.stringify(seSample));
    copy.cases[0].input = "A refund of $12.34 for ORD-TEST-1.";
    process.env.PACK_FIXTURES_JSON_B64 = Buffer.from(JSON.stringify(copy)).toString("base64");
    const loaded = loadFixtures("structured-extraction");
    expect(loaded.source).toBe("production");
    expect(loaded.set.cases[0]!.input).toContain("$12.34");
  });

  it("accepts a single set rather than a map", () => {
    const parsed = parseFixtureBundle(JSON.stringify(seSample));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.bundle["structured-extraction"].cases).toHaveLength(6);
  });

  it("rejects invalid JSON and falls back to samples with a reason", () => {
    process.env.PACK_FIXTURES_JSON = "{ not json";
    const loaded = loadFixtures("structured-extraction");
    expect(loaded.source).toBe("sample");
    expect(loaded.reason).toMatch(/sample/i);
  });

  it("rejects a set with the wrong number of cases", () => {
    process.env.PACK_FIXTURES_JSON = bundleWith((set) => set.cases.pop());
    expect(fixtureSetSchema.safeParse(JSON.parse(process.env.PACK_FIXTURES_JSON)["structured-extraction"]).success).toBe(false);
    expect(loadFixtures("structured-extraction").source).toBe("sample");
  });

  it("rejects a set referencing an unknown criterion", () => {
    process.env.PACK_FIXTURES_JSON = bundleWith((set) => {
      set.cases[0].criterionIds = ["C99"];
    });
    expect(loadFixtures("structured-extraction").source).toBe("sample");
  });

  it("rejects a set that smuggles in extra fields", () => {
    process.env.PACK_FIXTURES_JSON = bundleWith((set) => {
      set.cases[0].leakedAnswer = "42";
    });
    expect(loadFixtures("structured-extraction").source).toBe("sample");
  });
});

describe("fixture set identity", () => {
  it("is stable for identical content and changes when content changes", () => {
    const base = fixtureSetSchema.parse(seSample);
    const a = fixtureSetId(base);
    const b = fixtureSetId(fixtureSetSchema.parse(JSON.parse(JSON.stringify(seSample))));
    expect(a).toBe(b);

    const changed = JSON.parse(JSON.stringify(seSample));
    changed.cases[0].input = changed.cases[0].input + " ";
    expect(fixtureSetId(fixtureSetSchema.parse(changed))).not.toBe(a);
  });
});
