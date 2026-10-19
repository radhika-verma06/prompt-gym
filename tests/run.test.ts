import { describe, expect, it } from "vitest";
import { executeRun, type RunEvent } from "@/lib/run";
import type { CompletionRequest } from "@/lib/model/client";
import type { CheckResult } from "@/lib/validators/deterministic";

const PROMPT = "Return strict JSON with order_id, reason, amount_usd and wants_replacement.";

const completion = async (_request: CompletionRequest) => ({
  text: '{"order_id":null,"reason":"unclear","amount_usd":null,"wants_replacement":false}',
  failed: false,
});

const judge = async (): Promise<CheckResult> => ({
  kind: "fabrication-judge",
  tier: "B",
  status: "pass",
  detail: "Nothing invented.",
});

async function collect(overrides: Partial<Parameters<typeof executeRun>[0]> = {}) {
  const events: RunEvent[] = [];
  for await (const event of executeRun({
    packId: "structured-extraction",
    prompt: PROMPT,
    spend: async () => true,
    completion,
    judge,
    ...overrides,
  })) {
    events.push(event);
  }
  return events;
}

describe("executeRun", () => {
  it("emits metadata, six case events and a final summary", async () => {
    const events = await collect();
    expect(events[0]?.type).toBe("meta");
    expect(events.filter((event) => event.type === "case")).toHaveLength(6);
    expect(events.at(-1)?.type).toBe("done");

    const meta = events[0];
    if (meta?.type !== "meta") throw new Error("missing meta");
    expect(meta.meta.caseCount).toBe(6);
    expect(meta.meta.fixtureSource).toBe("sample");
    expect(meta.meta.settingsHash).toHaveLength(16);

    const done = events.at(-1);
    if (done?.type !== "done") throw new Error("missing done");
    expect(done.summary.scored + done.summary.uncertain + done.summary.errors).toBe(6);
  });

  it("never sends a hidden input or acceptable answer to the client", async () => {
    const events = await collect();
    const payload = JSON.stringify(events);
    // Sample fixtures legitimately ship in the repo, but their text must still not be
    // echoed in results: the client sees verdicts, not cases.
    expect(payload).not.toContain("ORD-2291");
    expect(payload).not.toContain("cracked screen");
  });

  it("marks cases unresolved when the budget stops the run, and never passes them", async () => {
    let calls = 0;
    const events = await collect({
      spend: async () => {
        calls += 1;
        return calls <= 2;
      },
    });
    const results = events.filter((event) => event.type === "case");
    expect(results).toHaveLength(6);
    const unresolved = results.filter((event) => event.type === "case" && event.result.state === "unresolved");
    expect(unresolved).toHaveLength(4);

    const done = events.at(-1);
    if (done?.type !== "done") throw new Error("missing done");
    expect(done.complete).toBe(false);
    // Only cases that got a real response can pass; the cut-off ones must not.
    expect(done.summary.passed).toBeLessThanOrEqual(2);
    expect(done.summary.scored).toBe(done.summary.passed);
  });

  it("stops starting new cases at the run deadline and says so", async () => {
    let clock = 0;
    const events = await collect({
      now: () => {
        clock += 30_000;
        return clock;
      },
    });
    const results = events.filter((event) => event.type === "case");
    expect(results).toHaveLength(6);
    const unresolved = results.filter((event) => event.type === "case" && event.result.state === "unresolved");
    expect(unresolved.length).toBeGreaterThan(0);
    const firstUnresolved = unresolved[0];
    if (firstUnresolved?.type === "case") {
      expect(firstUnresolved.result.decidedBy).toBe("run time limit");
    }
  });

  it("reports an unknown pack as a typed error", async () => {
    const events = await collect({ packId: "nope" });
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("error");
  });
});
