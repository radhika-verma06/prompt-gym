import { describe, expect, it } from "vitest";
import { runDeterministic } from "@/lib/validators/deterministic";
import type { Acceptable, Check } from "@/lib/fixtures/schema";

const check = (kind: Check["kind"], tier: Check["tier"] = "A"): Check => ({ tier, kind });
const empty: Acceptable = {};

const good = JSON.stringify({
  order_id: "ORD-1",
  reason: "damaged",
  amount_usd: 42.5,
  wants_replacement: false,
});

describe("json-object", () => {
  it("passes a bare object", () => {
    expect(runDeterministic(check("json-object"), good, empty).status).toBe("pass");
  });

  it("fails fenced or annotated output", () => {
    expect(runDeterministic(check("json-object"), "```json\n" + good + "\n```", empty).status).toBe("fail");
    expect(runDeterministic(check("json-object"), "Here you go: " + good, empty).status).toBe("fail");
  });

  it("fails arrays and scalars for an object criterion", () => {
    expect(runDeterministic(check("json-object"), "[]", empty).status).toBe("fail");
    expect(runDeterministic(check("json-object"), "42", empty).status).toBe("fail");
  });
});

describe("exact-keys", () => {
  it("passes the four required fields with correct types", () => {
    expect(runDeterministic(check("exact-keys"), good, empty).status).toBe("pass");
  });

  it("accepts an array of objects", () => {
    expect(runDeterministic(check("exact-keys"), `[${good},${good}]`, empty).status).toBe("pass");
  });

  it("fails a missing or extra key", () => {
    const missing = JSON.stringify({ order_id: "x", reason: "y", amount_usd: 1 });
    const extra = JSON.stringify({ ...JSON.parse(good), note: "hi" });
    expect(runDeterministic(check("exact-keys"), missing, empty).status).toBe("fail");
    expect(runDeterministic(check("exact-keys"), extra, empty).status).toBe("fail");
  });

  it("fails a wrong type", () => {
    const wrong = JSON.stringify({ ...JSON.parse(good), wants_replacement: "no" });
    expect(runDeterministic(check("exact-keys"), wrong, empty).status).toBe("fail");
  });

  it("fails when there is no JSON at all", () => {
    expect(runDeterministic(check("exact-keys"), "no json here", empty).status).toBe("fail");
  });
});

describe("absent-fields", () => {
  const acceptable: Acceptable = { absentFields: ["order_id", "amount_usd"] };

  it("passes null and unknown", () => {
    expect(runDeterministic(check("absent-fields"), JSON.stringify({ order_id: null, amount_usd: null }), acceptable).status).toBe("pass");
    expect(
      runDeterministic(check("absent-fields"), JSON.stringify({ order_id: "Unknown", amount_usd: null }), acceptable).status,
    ).toBe("pass");
  });

  it("fails an invented value", () => {
    expect(
      runDeterministic(check("absent-fields"), JSON.stringify({ order_id: "ORD-0000", amount_usd: null }), acceptable).status,
    ).toBe("fail");
  });

  it("never prints the invented value in the message", () => {
    const result = runDeterministic(check("absent-fields"), JSON.stringify({ order_id: "ORD-0000", amount_usd: null }), acceptable);
    expect(result.detail).not.toContain("ORD-0000");
  });
});

describe("amount-set", () => {
  const acceptable: Acceptable = { amounts: [34.99] };

  it("passes the refund amount", () => {
    expect(
      runDeterministic(check("amount-set"), JSON.stringify({ amount_usd: 34.99 }), acceptable).status,
    ).toBe("pass");
  });

  it("fails the competing number", () => {
    expect(runDeterministic(check("amount-set"), JSON.stringify({ amount_usd: 6.99 }), acceptable).status).toBe("fail");
  });

  it("fails a stringified amount", () => {
    expect(runDeterministic(check("amount-set"), JSON.stringify({ amount_usd: "34.99" }), acceptable).status).toBe("fail");
  });

  it("tolerates floating-point representation", () => {
    expect(runDeterministic(check("amount-set"), JSON.stringify({ amount_usd: 34.990000000000002 }), acceptable).status).toBe(
      "pass",
    );
  });
});

describe("request-count", () => {
  const acceptable: Acceptable = { requestCount: 2 };

  it("passes two objects", () => {
    expect(runDeterministic(check("request-count"), `[${good},${good}]`, acceptable).status).toBe("pass");
  });

  it("fails a single merged object", () => {
    expect(runDeterministic(check("request-count"), good, acceptable).status).toBe("fail");
  });
});

describe("text checks", () => {
  it("enforces the word limit", () => {
    const acceptable: Acceptable = { maxWords: 5 };
    expect(runDeterministic(check("word-limit"), "one two three four five", acceptable).status).toBe("pass");
    expect(runDeterministic(check("word-limit"), "one two three four five six", acceptable).status).toBe("fail");
  });

  it("catches a forbidden commitment", () => {
    const acceptable: Acceptable = { forbiddenPhrases: ["we will refund"] };
    expect(runDeterministic(check("forbidden-phrases"), "We will refund it today.", acceptable).status).toBe("fail");
    expect(runDeterministic(check("forbidden-phrases"), "That refund is outside policy.", acceptable).status).toBe("pass");
  });

  it("matches required phrases across typographic punctuation", () => {
    const acceptable: Acceptable = { requiredPhrases: ["don't offer", "escalat"] };
    expect(
      runDeterministic(check("required-phrases"), "We don’t offer price‑matching.", acceptable).status,
    ).toBe("pass");
  });

  it("requires the escalation statement", () => {
    const acceptable: Acceptable = { requiredPhrases: ["escalat"] };
    expect(runDeterministic(check("required-phrases"), "This has been escalated to a manager.", acceptable).status).toBe("pass");
    expect(runDeterministic(check("required-phrases"), "Sorry, no.", acceptable).status).toBe("fail");
  });

  it("detects a dropped fact", () => {
    const acceptable: Acceptable = { requiredFacts: ["Thursday 14 March", "redelivery"] };
    expect(
      runDeterministic(check("fact-retention"), "Arriving Thursday 14 March; a card allows redelivery.", acceptable).status,
    ).toBe("pass");
    expect(runDeterministic(check("fact-retention"), "Arriving Thursday 14 March.", acceptable).status).toBe("fail");
  });

  it("flags a figure the source never gave", () => {
    const source = "The chair costs $89.00 and delivery takes 3 days.";
    expect(runDeterministic(check("no-new-values"), "It costs $89 and takes 3 days.", empty, source).status).toBe("pass");
    expect(runDeterministic(check("no-new-values"), "It costs $89 and takes 5 days.", empty, source).status).toBe("fail");
    expect(runDeterministic(check("no-new-values"), "It costs $89,000.", empty, source).status).toBe("fail");
  });

  it("never prints the invented figure", () => {
    const result = runDeterministic(check("no-new-values"), "A $450 credit applies.", empty, "A $45 refund applies.");
    expect(result.status).toBe("fail");
    expect(result.detail).not.toContain("450");
  });

  it("detects a lost negation", () => {
    const acceptable: Acceptable = { negationMarkers: ["unable", "cannot", "not eligible"] };
    expect(runDeterministic(check("negation-preserved"), "We are unable to refund this.", acceptable).status).toBe("pass");
    expect(runDeterministic(check("negation-preserved"), "We can refund this.", acceptable).status).toBe("fail");
  });

  it("rejects lists and multiple blocks", () => {
    expect(runDeterministic(check("single-paragraph"), "One block of prose.", empty).status).toBe("pass");
    expect(runDeterministic(check("single-paragraph"), "- point one\n- point two", empty).status).toBe("fail");
    expect(runDeterministic(check("single-paragraph"), "First.\n\nSecond.", empty).status).toBe("fail");
  });
});

describe("tier routing", () => {
  it("never decides a judge check on its own", () => {
    const result = runDeterministic(check("fabrication-judge", "B"), "anything", empty);
    expect(result.status).toBe("uncertain");
    expect(result.tier).toBe("B");
  });
});
