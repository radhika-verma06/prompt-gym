import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create } };
    models = { list: vi.fn(async () => ({ data: [] })) };
  },
}));

process.env.GROQ_API_KEY = "test-key";

const { complete, classifyFailure, isRetryable, retryDelayMs } = await import("@/lib/model/client");

/** Shaped like the SDK's APIError: an Error carrying a status and response headers. */
function apiError(status: number, message: string, headers?: Record<string, string>) {
  return Object.assign(new Error(message), { status, headers });
}

function request() {
  return {
    model: "openai/gpt-oss-20b",
    system: "prompt",
    user: "message",
    maxTokens: 100,
    temperature: 0,
    reasoningEffort: "low" as const,
  };
}

describe("classifyFailure", () => {
  it("reads a 429 as a rate limit and keeps the provider's retry hint", () => {
    const failure = classifyFailure({ status: 429, message: "Rate limit reached", headers: { "retry-after": "2" } });
    expect(failure.kind).toBe("rate_limited");
    expect(failure.retryAfterMs).toBe(2000);
  });

  it("reads a 5xx as temporarily unavailable", () => {
    expect(classifyFailure({ status: 503, message: "upstream down" }).kind).toBe("unavailable");
  });

  it("reads an abort as a timeout, not a provider refusal", () => {
    const error = new Error("The operation was aborted.");
    error.name = "AbortError";
    expect(classifyFailure(error).kind).toBe("timeout");
  });

  it("falls back to provider for anything else", () => {
    expect(classifyFailure({ status: 400, message: "bad request" }).kind).toBe("provider");
  });
});

describe("retry policy", () => {
  it("retries rate limits and outages, never timeouts", () => {
    expect(isRetryable("rate_limited")).toBe(true);
    expect(isRetryable("unavailable")).toBe(true);
    expect(isRetryable("timeout")).toBe(false);
    expect(isRetryable("provider")).toBe(false);
  });

  it("caps backoff so a wait can't outlive the run", () => {
    expect(retryDelayMs({ kind: "rate_limited", message: "", retryAfterMs: 60_000 }, 0)).toBe(3000);
    expect(retryDelayMs({ kind: "rate_limited", message: "" }, 0)).toBe(700);
    expect(retryDelayMs({ kind: "rate_limited", message: "" }, 3)).toBe(3000);
  });
});

describe("complete", () => {
  beforeEach(() => create.mockReset());

  it("returns text on the first successful call", async () => {
    create.mockResolvedValueOnce({
      choices: [{ message: { content: "answer" }, finish_reason: "stop" }],
    });

    const result = await complete(request());
    expect(result.failed).toBe(false);
    expect(result.text).toBe("answer");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("retries once when the provider rate-limits, then reports the recovered call", async () => {
    create
      .mockRejectedValueOnce(apiError(429, "Rate limit reached", { "retry-after": "0" }))
      .mockResolvedValueOnce({ choices: [{ message: { content: "recovered" }, finish_reason: "stop" }] });

    const result = await complete(request());
    expect(result.failed).toBe(false);
    expect(result.text).toBe("recovered");
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("does not retry a rejected request and reports why it failed", async () => {
    create.mockRejectedValueOnce(apiError(400, "invalid model"));

    const result = await complete(request());
    expect(result.failed).toBe(true);
    expect(result.failureKind).toBe("provider");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("gives up after one retry and keeps the rate-limit reason", async () => {
    create
      .mockRejectedValueOnce(apiError(429, "Rate limit reached", { "retry-after": "0" }))
      .mockRejectedValueOnce(apiError(429, "Rate limit reached", { "retry-after": "0" }));

    const result = await complete(request());
    expect(result.failed).toBe(true);
    expect(result.failureKind).toBe("rate_limited");
    expect(create).toHaveBeenCalledTimes(2);
  });
});
