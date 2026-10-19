import { describe, expect, it, vi } from "vitest";
import { evaluateCase } from "@/lib/evaluate";
import type { FixtureCase } from "@/lib/fixtures/schema";
import { flagship } from "@/lib/packs";
import type { Completion, CompletionRequest } from "@/lib/model/client";
import type { CheckResult } from "@/lib/validators/deterministic";

const PROMPT = "Return JSON with order_id, reason, amount_usd and wants_replacement.";
const INPUT =
  "Hi — my order ORD-2291 arrived with a cracked screen. I'd like a refund of $42.50 please. I don't need a replacement, I've already ordered a new one.";

const validJson =
  '{"order_id":"ORD-2291","reason":"cracked screen","amount_usd":42.5,"wants_replacement":false}';

const baseCase: FixtureCase = {
  id: "case-1",
  name: "Straightforward refund",
  criterionIds: ["C1", "C2"],
  input: INPUT,
  acceptable: { amounts: [42.5], orderId: "ORD-2291" },
  checks: [
    { tier: "A", kind: "json-object" },
    { tier: "A", kind: "exact-keys" },
  ],
};

const ok = (text: string): Completion => ({ text, failed: false });

function double(text: string) {
  const calls: CompletionRequest[] = [];
  const completion = async (request: CompletionRequest) => {
    calls.push(request);
    return ok(text);
  };
  return { completion, calls };
}

const passJudge = vi.fn(
  async (): Promise<CheckResult> => ({ kind: "fabrication-judge", tier: "B", status: "pass", detail: "Nothing invented." }),
);

describe("evaluateCase", () => {
  it("asks the model under test with the prompt exactly as written and no JSON mode", async () => {
    const { completion, calls } = double(validJson);
    const result = await evaluateCase({ pack: flagship, fixtureCase: baseCase, prompt: PROMPT, completion });

    expect(result.state).toBe("pass");
    expect(calls).toHaveLength(1);
    const request = calls[0]!;
    expect(request.system).toBe(PROMPT);
    expect(request.user).toBe(INPUT);
    expect(request.jsonMode).toBeUndefined();
    expect(request.temperature).toBe(0);
    // Pinned so a reasoning model can't silently spend the whole answer budget.
    expect(request.reasoningEffort).toBe("low");
  });

  it("fails on invalid JSON without consulting the judge", async () => {
    const { completion } = double(`Here's the JSON: ${validJson}`);
    const judge = vi.fn(passJudge);
    const result = await evaluateCase({ pack: flagship, fixtureCase: baseCase, prompt: PROMPT, completion, judge });

    expect(result.state).toBe("fail");
    expect(result.decidedBy).toBe("JSON parse check");
    expect(judge).not.toHaveBeenCalled();
    expect(result.observed).not.toContain("ORD-2291");
  });

  it("routes a Tier B case to the judge only after the rules pass", async () => {
    const judge = vi.fn(passJudge);
    const { completion } = double(validJson);
    const result = await evaluateCase({
      pack: flagship,
      fixtureCase: { ...baseCase, checks: [{ tier: "B", kind: "fabrication-judge" }] },
      prompt: PROMPT,
      completion,
      judge,
    });

    expect(judge).toHaveBeenCalledTimes(1);
    expect(result.state).toBe("pass");
    expect(result.tier).toBe("B");
  });

  it("reports a judge failure as a case failure", async () => {
    const { completion } = double(validJson);
    const result = await evaluateCase({
      pack: flagship,
      fixtureCase: { ...baseCase, checks: [{ tier: "B", kind: "fabrication-judge" }] },
      prompt: PROMPT,
      completion,
      judge: async () => ({ kind: "fabrication-judge", tier: "B", status: "fail", detail: "It invented an order." }),
    });

    expect(result.state).toBe("fail");
    expect(result.observed).toBe("It invented an order.");
  });

  it("reports an undecided judge as uncertain, not failed", async () => {
    const { completion } = double(validJson);
    const result = await evaluateCase({
      pack: flagship,
      fixtureCase: { ...baseCase, checks: [{ tier: "B", kind: "fabrication-judge" }] },
      prompt: PROMPT,
      completion,
      judge: async () => ({ kind: "fabrication-judge", tier: "B", status: "uncertain", detail: "Two readings." }),
    });

    expect(result.state).toBe("uncertain");
  });

  it("marks a truncated response unresolved, even when text came back", async () => {
    const result = await evaluateCase({
      pack: flagship,
      fixtureCase: baseCase,
      prompt: PROMPT,
      completion: async () => ({ text: '{"order_id":"ORD-2291"', failed: false, finishReason: "length" }),
    });

    expect(result.state).toBe("unresolved");
    expect(result.observed).toContain("output limit");
  });

  it("marks an empty response unresolved, never as a pass or fail", async () => {
    const result = await evaluateCase({
      pack: flagship,
      fixtureCase: { ...baseCase, checks: [{ tier: "B", kind: "fabrication-judge" }] },
      prompt: PROMPT,
      completion: async () => ({ text: "", failed: false, finishReason: "stop" }),
      judge: async () => ({ kind: "fabrication-judge", tier: "B", status: "pass", detail: "nothing invented" }),
    });

    expect(result.state).toBe("unresolved");
    expect(result.observed).toContain("returned no text");
  });

  it("marks a failed provider call unresolved rather than failed", async () => {
    const result = await evaluateCase({
      pack: flagship,
      fixtureCase: baseCase,
      prompt: PROMPT,
      completion: async () => ({ text: "", failed: true, failure: "429" }),
    });

    expect(result.state).toBe("unresolved");
    expect(result.publicResponse).toBeNull();
  });

  it("names a rate limit instead of implying the prompt was at fault", async () => {
    const result = await evaluateCase({
      pack: flagship,
      fixtureCase: baseCase,
      prompt: PROMPT,
      completion: async () => ({ text: "", failed: true, failure: "429", failureKind: "rate_limited" }),
    });

    expect(result.state).toBe("unresolved");
    expect(result.observed).toContain("per-minute limit");
    expect(result.observed).toContain("Nothing about the prompt caused it");
  });

  it("withholds a response that repeats the hidden message", async () => {
    const { completion } = double(INPUT);
    const result = await evaluateCase({ pack: flagship, fixtureCase: baseCase, prompt: PROMPT, completion });

    expect(result.withheld).toBe(true);
    expect(result.publicResponse).toBeNull();
    // The verdict is still reported, so the withheld text doesn't remove the lesson.
    expect(result.state).toBe("fail");
  });

  it("keeps a correct response visible — redaction is not a blanket", async () => {
    const { completion } = double(validJson);
    const result = await evaluateCase({ pack: flagship, fixtureCase: baseCase, prompt: PROMPT, completion });

    expect(result.withheld).toBe(false);
    expect(result.publicResponse).toBe(validJson);
  });
});
