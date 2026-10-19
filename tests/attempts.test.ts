import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MAX_ATTEMPTS, clearAttempts, loadAttempts, saveAttempts } from "@/lib/attempts";
import type { Attempt } from "@/lib/types";

class FakeStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

function attempt(n: number): Attempt {
  return {
    n,
    prompt: `prompt ${n}`,
    startedAt: new Date(Date.UTC(2026, 9, 18, 10, n)).toISOString(),
    modelIds: { underTest: "a", judge: "b" },
    settingsHash: "hash",
    evaluationVersion: "eval",
    fixtureSetId: "fixture",
    fixtureSource: "sample",
    results: [],
    summary: { passed: 0, scored: 0, uncertain: 0, errors: 6, complete: false },
    complete: false,
  };
}

beforeEach(() => {
  (globalThis as unknown as { window: unknown }).window = { sessionStorage: new FakeStorage() };
});

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe("attempt store", () => {
  it("round-trips attempts per pack", () => {
    saveAttempts("structured-extraction", [attempt(1)]);
    saveAttempts("following-rules", [attempt(2)]);
    expect(loadAttempts("structured-extraction").map((a) => a.n)).toEqual([1]);
    expect(loadAttempts("following-rules").map((a) => a.n)).toEqual([2]);
  });

  it("keeps only the most recent attempts", () => {
    saveAttempts("structured-extraction", Array.from({ length: MAX_ATTEMPTS + 5 }, (_, index) => attempt(index + 1)));
    const loaded = loadAttempts("structured-extraction");
    expect(loaded).toHaveLength(MAX_ATTEMPTS);
    expect(loaded.at(-1)?.n).toBe(MAX_ATTEMPTS + 5);
    expect(loaded[0]?.n).toBe(6);
  });

  it("survives corrupted storage without claiming history", () => {
    (globalThis as unknown as { window: { sessionStorage: FakeStorage } }).window.sessionStorage.setItem(
      "prompt-gym:v1:attempts:structured-extraction",
      "{not json",
    );
    expect(loadAttempts("structured-extraction")).toEqual([]);
  });

  it("clears a pack's history", () => {
    saveAttempts("structured-extraction", [attempt(1)]);
    clearAttempts("structured-extraction");
    expect(loadAttempts("structured-extraction")).toEqual([]);
  });
});
