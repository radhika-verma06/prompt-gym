import { describe, expect, it } from "vitest";
import { disclosesHiddenInput, reviewResponse } from "@/lib/redact";
import type { FixtureCase } from "@/lib/fixtures/schema";

const hidden =
  "Order ORD-4410: you charged me twice. The $6.99 delivery fee was taken again, and I still haven't had the $34.99 refund you promised on the phone.";

const fixtureCase: FixtureCase = {
  id: "case-3",
  name: "Delivery fee and refund in one message",
  criterionIds: ["C4"],
  input: hidden,
  acceptable: { amounts: [34.99] },
  checks: [{ tier: "A", kind: "amount-set" }],
};

describe("disclosesHiddenInput", () => {
  it("catches a verbatim copy", () => {
    expect(disclosesHiddenInput(hidden, hidden)).toBe(true);
  });

  it("catches an eight-word span even when surrounded by other text", () => {
    // Shares nine consecutive words with the hidden message: "the $6.99 delivery fee
    // was taken again, and I still".
    expect(
      disclosesHiddenInput(
        "Sure — the message says: the $6.99 delivery fee was taken again, and I still owe you an answer.",
        hidden,
      ),
    ).toBe(true);
  });

  it("does not fire on a seven-word overlap", () => {
    expect(disclosesHiddenInput("the $6.99 delivery fee was taken again, so here you go.", hidden)).toBe(false);
  });

  it("does not fire on short incidental overlap", () => {
    expect(disclosesHiddenInput('{"order_id":"ORD-4410","amount_usd":34.99}', hidden)).toBe(false);
  });

  it("ignores case and whitespace differences", () => {
    expect(disclosesHiddenInput(hidden.toUpperCase(), hidden)).toBe(true);
  });

  it("does not treat a close paraphrase as a leak when the task is a rewrite", () => {
    const rewrite = "You charged me twice: the $6.99 delivery fee was taken again, and the promised $34.99 refund is still missing.";
    expect(disclosesHiddenInput(rewrite, hidden, "whole-input-only")).toBe(false);
    expect(disclosesHiddenInput(hidden, hidden, "whole-input-only")).toBe(true);
  });
});

describe("reviewResponse", () => {
  it("keeps a correct, non-copying response visible", () => {
    const review = reviewResponse('{"order_id":"ORD-4410","reason":"duplicate charge","amount_usd":34.99}', fixtureCase);
    expect(review.withheld).toBe(false);
    expect(review.publicResponse).toContain("34.99");
  });

  it("withholds a response that reproduces the input, with a reason", () => {
    const review = reviewResponse(`Here is the message again: ${hidden}`, fixtureCase);
    expect(review.withheld).toBe(true);
    expect(review.publicResponse).toBeNull();
    expect(review.reason).toMatch(/withheld/i);
  });

  it("caps an over-long response instead of withholding it", () => {
    const long = "a ".repeat(1500);
    const review = reviewResponse(long, fixtureCase);
    expect(review.withheld).toBe(false);
    expect(review.publicResponse?.length).toBeLessThanOrEqual(2100);
    expect(review.publicResponse).toContain("truncated");
  });

  it("keeps a rewrite visible when the case opts out of span redaction", () => {
    const rewriteCase: FixtureCase = { ...fixtureCase, redaction: "whole-input-only" };
    const rewrite =
      "You charged me twice: the $6.99 delivery fee was taken again, and the promised $34.99 refund is still missing.";
    const review = reviewResponse(rewrite, rewriteCase);
    expect(review.withheld).toBe(false);
    expect(review.publicResponse).toBe(rewrite);
  });

  it("returns null for an empty response without calling it withheld", () => {
    const review = reviewResponse("   ", fixtureCase);
    expect(review.publicResponse).toBeNull();
    expect(review.withheld).toBe(false);
  });
});
