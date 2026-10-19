import { beforeEach, describe, expect, it } from "vitest";
import {
  LIMITS,
  MemoryStore,
  __resetStoreForTests,
  admit,
  bodyTooLarge,
  configureStore,
  validatePrompt,
} from "@/lib/limits";

const env = {} as NodeJS.ProcessEnv;

beforeEach(() => {
  __resetStoreForTests();
  configureStore(new MemoryStore());
});

describe("prompt bounds", () => {
  it("rejects an empty or non-string prompt", () => {
    expect(validatePrompt("").ok).toBe(false);
    expect(validatePrompt(undefined).ok).toBe(false);
  });

  it("rejects a prompt below the minimum after trimming", () => {
    const result = validatePrompt("   too short   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(422);
  });

  it("rejects a prompt above the maximum", () => {
    expect(validatePrompt("a".repeat(LIMITS.promptMax + 1)).ok).toBe(false);
  });

  it("accepts a prompt at the lower bound", () => {
    const prompt = "x".repeat(LIMITS.promptMin);
    expect(validatePrompt(prompt)).toEqual({ ok: true, prompt });
  });
});

describe("rate limiting", () => {
  it("allows the per-minute allowance and rejects the next", async () => {
    for (let i = 0; i < LIMITS.perIpPerMinute; i += 1) {
      expect((await admit("1.2.3.4", new Date("2026-10-18T10:00:05Z"), env)).ok).toBe(true);
    }
    const rejected = await admit("1.2.3.4", new Date("2026-10-18T10:00:05Z"), env);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.status).toBe(429);
      expect(rejected.code).toBe("rate_limited");
      expect(rejected.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("keeps buckets separate per client", async () => {
    for (let i = 0; i < LIMITS.perIpPerMinute; i += 1) {
      await admit("1.1.1.1", new Date("2026-10-18T10:00:00Z"), env);
    }
    expect((await admit("2.2.2.2", new Date("2026-10-18T10:00:00Z"), env)).ok).toBe(true);
  });

  it("enforces the hourly cap", async () => {
    let minute = 0;
    for (let i = 0; i < LIMITS.perIpPerHour; i += 1) {
      if (i > 0 && i % LIMITS.perIpPerMinute === 0) minute += 1;
      const now = new Date(Date.UTC(2026, 9, 18, 10, minute, 1));
      const result = await admit("3.3.3.3", now, env);
      expect(result.ok).toBe(true);
    }
    const rejected = await admit("3.3.3.3", new Date(Date.UTC(2026, 9, 18, 10, 10, 1)), env);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.code).toBe("rate_limited");
  });

  it("refuses a run when the shared daily budget can't cover it", async () => {
    const store = new MemoryStore();
    configureStore(store);
    await store.incr("pg:budget:2026-10-18", 86_400);
    for (let i = 1; i < LIMITS.dailyCalls; i += 1) {
      await store.incr("pg:budget:2026-10-18", 86_400);
    }

    const rejected = await admit("4.4.4.4", new Date("2026-10-18T10:00:00Z"), env);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.code).toBe("budget_exhausted");
  });

  it("stops spending once the budget is crossed mid-run", async () => {
    const store = new MemoryStore();
    configureStore(store);
    for (let i = 0; i < LIMITS.dailyCalls; i += 1) {
      await store.incr("pg:budget:2026-10-18", 86_400);
    }

    // Admission itself would already refuse, so drive spend() directly with headroom.
    __resetStoreForTests();
    const fresh = new MemoryStore();
    configureStore(fresh);
    for (let i = 0; i < LIMITS.dailyCalls - LIMITS.callsPerRun; i += 1) {
      await fresh.incr("pg:budget:2026-10-18", 86_400);
    }
    const admission = await admit("5.5.5.5", new Date("2026-10-18T10:00:00Z"), env);
    expect(admission.ok).toBe(true);
    if (!admission.ok) return;

    for (let i = 0; i < LIMITS.callsPerRun; i += 1) {
      expect(await admission.spend()).toBe(true);
    }
    expect(await admission.spend()).toBe(false);
    expect(await admission.spend()).toBe(false);
  });
});

describe("request size", () => {
  it("rejects a body over the cap when the length is known", () => {
    const headers = new Headers({ "content-length": String(LIMITS.bodyMaxBytes + 1) });
    expect(bodyTooLarge(headers)).toBe(true);
  });

  it("allows an unknown or small length", () => {
    expect(bodyTooLarge(new Headers())).toBe(false);
    expect(bodyTooLarge(new Headers({ "content-length": "512" }))).toBe(false);
  });
});
