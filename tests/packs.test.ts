import { describe, expect, it } from "vitest";
import { packs, getPack, flagship } from "@/lib/packs";

describe("public pack metadata", () => {
  it("ships exactly three packs, each with six criteria", () => {
    expect(packs).toHaveLength(3);
    for (const pack of packs) {
      expect(pack.criteria).toHaveLength(6);
      expect(pack.caseCount).toBe(6);
    }
  });

  it("has one flagship and unique ids", () => {
    expect(packs.filter((pack) => pack.flagship)).toHaveLength(1);
    expect(flagship.id).toBe("structured-extraction");
    expect(new Set(packs.map((pack) => pack.id)).size).toBe(3);
  });

  it("resolves a pack by id and rejects unknown ids", () => {
    expect(getPack("structured-extraction")?.name).toBe("Structured Extraction");
    expect(getPack("nope")).toBeUndefined();
  });

  it("keeps private fixture fields out of public metadata", () => {
    const serialised = JSON.stringify(packs);
    for (const forbidden of ["\"input\"", "\"acceptable\"", "\"expected\"", "\"answer\""]) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it("uses stable criterion ids and a known tier for every criterion", () => {
    for (const pack of packs) {
      const ids = pack.criteria.map((criterion) => criterion.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const criterion of pack.criteria) {
        expect(["A", "B"]).toContain(criterion.tier);
        expect(criterion.label.length).toBeGreaterThan(0);
        expect(criterion.detail.length).toBeGreaterThan(0);
      }
    }
  });
});
