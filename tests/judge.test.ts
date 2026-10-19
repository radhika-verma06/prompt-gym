import { describe, expect, it, vi } from "vitest";
import { judgeCheck, readableReason, stripFence } from "@/lib/validators/judge";
import type { Completion, CompletionRequest } from "@/lib/model/client";

const base = {
  kind: "fabrication-judge",
  packName: "Structured Extraction",
  criterion: "Ambiguous references handled without fabrication",
  message: "Just refund me for the usual one, you know the order I mean. Same as last time.",
  response: '{"order_id": null, "reason": "The order is unclear", "amount_usd": null, "wants_replacement": false}',
};

const reply = (text: string): Completion => ({ text, failed: false });

describe("constrained judge", () => {
  it("uses JSON mode because only the verdict needs to be parseable", async () => {
    const completion = vi.fn(async (_request: CompletionRequest) =>
      reply('{"verdict":"pass","reason":"Nothing was invented."}'),
    );
    const result = await judgeCheck({ ...base, completion });

    expect(result.status).toBe("pass");
    expect(result.tier).toBe("B");
    expect(completion).toHaveBeenCalledTimes(1);
    expect(completion.mock.calls[0]![0].jsonMode).toBe(true);
    // The judge sees the criterion, message and response — never the user's prompt.
    expect(completion.mock.calls[0]![0].user).not.toContain("You are a helpful assistant");
  });

  it("accepts a fenced verdict from a provider that ignores JSON mode", async () => {
    const result = await judgeCheck({
      ...base,
      completion: async () => reply('```json\n{"verdict":"fail","reason":"It picked one reading."}\n```'),
    });
    expect(result.status).toBe("fail");
    expect(result.detail).toBe("It picked one reading.");
  });

  it("turns an unparseable verdict into uncertain, never fail", async () => {
    const result = await judgeCheck({ ...base, completion: async () => reply("Looks fine to me!") });
    expect(result.status).toBe("uncertain");
  });

  it("turns a malformed verdict shape into uncertain", async () => {
    const result = await judgeCheck({ ...base, completion: async () => reply('{"verdict":"maybe"}') });
    expect(result.status).toBe("uncertain");
  });

  it("turns a provider failure into uncertain with a readable reason", async () => {
    const result = await judgeCheck({
      ...base,
      completion: async () => ({ text: "", failed: true, failure: "429" }),
    });
    expect(result.status).toBe("uncertain");
    expect(result.detail).toContain("couldn't be reached");
  });

  it("reports an explicit uncertain verdict as uncertain", async () => {
    const result = await judgeCheck({
      ...base,
      completion: async () => reply('{"verdict":"uncertain","reason":"Two readings are genuinely possible."}'),
    });
    expect(result.status).toBe("uncertain");
    expect(result.detail).toContain("more than one reading");
  });

  it("replaces a reason that quotes the hidden message", async () => {
    const result = await judgeCheck({
      ...base,
      completion: async () =>
        reply('{"verdict":"pass","reason":"It correctly said just refund me for the usual one you know the order I mean."}'),
    });
    expect(result.status).toBe("pass");
    expect(result.detail).not.toContain("usual one");
  });
});

describe("judge helpers", () => {
  it("strips one code fence", () => {
    expect(stripFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripFence('{"a":1}')).toBe('{"a":1}');
  });

  it("keeps short reasons and rewrites long quotes", () => {
    expect(readableReason("It marked the amount unknown.", base.message)).toBe("It marked the amount unknown.");
    expect(readableReason("It repeated just refund me for the usual one, you know the order I mean.", base.message)).toContain(
      "without quoting",
    );
  });
});
