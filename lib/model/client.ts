import OpenAI from "openai";

/**
 * The only place the provider is called. Server-only: the API key lives here and
 * nowhere near the browser.
 *
 * Deliberate asymmetry: the model under test is never asked for structured output.
 * Forcing JSON at the API level would answer the Structured Extraction challenge on
 * the user's behalf, so the constraint has to come from their prompt. The judge *is*
 * asked for JSON, because parsing its verdict reliably matters and nothing about the
 * user's skill is being measured there.
 */

const baseURL = process.env.MODEL_BASE_URL ?? "https://api.groq.com/openai/v1";

export class MissingKeyError extends Error {
  constructor() {
    super("Evaluation isn't configured: no provider API key is set.");
    this.name = "MissingKeyError";
  }
}

export function hasProviderKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
}

let cached: OpenAI | null = null;

function client(): OpenAI {
  if (!hasProviderKey()) throw new MissingKeyError();
  cached ??= new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL, timeout: 20_000, maxRetries: 1 });
  return cached;
}

export type FailureKind = "rate_limited" | "unavailable" | "timeout" | "provider";

export type Completion = {
  text: string;
  /** Provider stop reason, so truncation can be told apart from a bad answer. */
  finishReason?: string | null;
  /** True when the call timed out or the provider refused it. */
  failed: boolean;
  failure?: string;
  /** Why the call failed, so the UI can say something true instead of "something broke". */
  failureKind?: FailureKind;
};

export type ClassifiedFailure = {
  kind: FailureKind;
  message: string;
  /** Provider's own backoff hint, in milliseconds, when it sent one. */
  retryAfterMs?: number;
};

/** Shared free keys get rate-limited in bursts; the learner shouldn't read that as a wrong prompt. */
export function classifyFailure(error: unknown): ClassifiedFailure {
  const status = (error as { status?: unknown } | null)?.status;
  const message = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, " ").trim().slice(0, 300);
  const retryAfterMs = parseRetryAfter(error);

  if (status === 429) return { kind: "rate_limited", message, retryAfterMs };
  if (typeof status === "number" && status >= 500) return { kind: "unavailable", message, retryAfterMs };
  if (error instanceof Error && (error.name === "AbortError" || /abort/i.test(error.message))) {
    return { kind: "timeout", message };
  }
  if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|fetch failed|socket hang up/i.test(message)) {
    return { kind: "unavailable", message, retryAfterMs };
  }
  return { kind: "provider", message, retryAfterMs };
}

function parseRetryAfter(error: unknown): number | undefined {
  const headers = (error as { headers?: unknown } | null)?.headers;
  const read = (name: string): string | null => {
    if (headers instanceof Headers) return headers.get(name);
    if (headers && typeof headers === "object") {
      const value = (headers as Record<string, unknown>)[name];
      if (typeof value === "string" || typeof value === "number") return String(value);
      // Undici and the OpenAI SDK expose plain objects keyed as sent by the provider.
      const cased = (headers as Record<string, unknown>)[name.replace(/^\w/, (c) => c.toUpperCase())];
      if (typeof cased === "string" || typeof cased === "number") return String(cased);
    }
    return null;
  };

  const millis = read("retry-after-ms");
  if (millis && Number.isFinite(Number(millis))) return Math.max(0, Number(millis));
  const seconds = read("retry-after");
  if (seconds && Number.isFinite(Number(seconds))) return Math.max(0, Number(seconds) * 1000);
  return undefined;
}

/** Longer waits can't finish inside a run, so backoff is capped and kept small. */
export function retryDelayMs(failure: ClassifiedFailure, attempt: number): number {
  const suggested = failure.retryAfterMs;
  if (typeof suggested === "number") return Math.min(suggested, 3_000);
  const base = failure.kind === "rate_limited" ? 700 : 400;
  return Math.min(base * 2 ** attempt, 3_000);
}

/** Timeouts are not retried: a second 20s attempt would blow the run's own deadline. */
export function isRetryable(kind: FailureKind): boolean {
  return kind === "rate_limited" || kind === "unavailable";
}

const MAX_ATTEMPTS = 2;

export type CompletionRequest = {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  /** Only the judge sets this. */
  jsonMode?: boolean;
  timeoutMs?: number;
  temperature?: number;
  /** Reasoning models can spend the whole output budget before answering. */
  reasoningEffort?: "low" | "medium" | "high";
};

async function attempt(request: CompletionRequest): Promise<Completion> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs ?? 20_000);

  try {
    const response = await client().chat.completions.create(
      {
        model: request.model,
        temperature: request.temperature ?? 0,
        max_completion_tokens: request.maxTokens,
        ...(request.reasoningEffort ? { reasoning_effort: request.reasoningEffort } : {}),
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        ...(request.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
      },
      { signal: controller.signal },
    );

    const choice = response.choices?.[0];
    const text = choice?.message?.content ?? "";
    return {
      text: typeof text === "string" ? text : JSON.stringify(text),
      finishReason: choice?.finish_reason ?? null,
      failed: false,
    };
  } catch (error) {
    const classified = classifyFailure(error);
    return { text: "", failed: true, failure: classified.message, failureKind: classified.kind };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One transport call, plus a single extra attempt for failures that time alone can fix.
 * The SDK already retries internally; this second attempt exists because a per-minute
 * token limit can clear in under a second, and losing a case to it costs the learner a
 * real signal. Everything else fails once and reports why.
 */
export async function complete(request: CompletionRequest): Promise<Completion> {
  let result = await attempt(request);
  for (let attemptNumber = 1; attemptNumber < MAX_ATTEMPTS && result.failed; attemptNumber += 1) {
    const kind = result.failureKind ?? "provider";
    if (!isRetryable(kind)) break;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs({ kind, message: result.failure ?? "" }, attemptNumber - 1)));
    result = await attempt(request);
  }
  return result;
}

/** Used by the probe script to list what the account can actually reach. */
export async function listModels(): Promise<string[]> {
  const list = await client().models.list();
  return (list.data ?? []).map((model) => model.id).sort();
}
