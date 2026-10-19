import { createHash } from "node:crypto";

/**
 * Server-side protection for a public endpoint that spends money.
 *
 * Counters live in Upstash Redis when it's configured, because serverless instances
 * don't share memory. Without it they live in process memory — which means the limits
 * are per instance, and the README says exactly that instead of claiming a shared cap
 * that isn't shared.
 */

export const LIMITS = {
  promptMin: 40,
  promptMax: 4_000,
  bodyMaxBytes: 16 * 1024,
  perIpPerMinute: 6,
  perIpPerHour: 40,
  dailyCalls: 900,
  /** 6 subject calls + one judge call per Tier B check (the maximum is 12). */
  callsPerRun: 12,
  concurrentCases: 3,
  perCallTimeoutMs: 20_000,
  perRunTimeoutMs: 45_000,
} as const;

type Entry = { count: number; expiresAt: number };

/** Single-instance fallback, also used by tests. */
export class MemoryStore {
  private readonly entries = new Map<string, Entry>();

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const now = Date.now();
    const existing = this.entries.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.entries.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }

  async get(key: string): Promise<number> {
    const existing = this.entries.get(key);
    if (!existing || existing.expiresAt <= Date.now()) return 0;
    return existing.count;
  }

  async reset(): Promise<void> {
    this.entries.clear();
  }
}

export type CounterStore = {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<number>;
};

/** Minimal Upstash REST client — two commands, no SDK. */
class RedisStore implements CounterStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async command(args: (string | number)[]): Promise<unknown> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Redis ${args[0]} failed with ${response.status}`);
    const payload = (await response.json()) as { result?: unknown };
    return payload.result;
  }

  async incr(key: string, ttlSeconds: number): Promise<number> {
    const count = Number(await this.command(["INCR", key]));
    // Only the first increment of a fresh window needs a TTL.
    if (count === 1) await this.command(["EXPIRE", key, ttlSeconds]);
    return count;
  }

  async get(key: string): Promise<number> {
    return Number((await this.command(["GET", key])) ?? 0);
  }
}

let redisWarned = false;
let store: CounterStore = new MemoryStore();

export function configureStore(next: CounterStore): void {
  store = next;
}

/** Picks Redis when configured, otherwise memory. Safe to call repeatedly. */
export function resolveStore(env: NodeJS.ProcessEnv = process.env): CounterStore {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return new RedisStore(url.replace(/\/$/, ""), token);
  return new MemoryStore();
}

function activeStore(env: NodeJS.ProcessEnv = process.env): CounterStore {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token && !(store instanceof RedisStore)) {
    store = new RedisStore(url.replace(/\/$/, ""), token);
  }
  return store;
}

export function hasSharedStore(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

function hourBucket(now: Date): string {
  return `${now.toISOString().slice(0, 13)}`;
}

function dayBucket(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Hashed so raw IPs are never written to a counter store. */
function clientKey(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex").slice(0, 24);
}

export type Identifier = string | null;

export function identify(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "local";
}

export type Rejection = {
  ok: false;
  status: 429 | 422 | 503;
  code: "rate_limited" | "invalid_prompt" | "budget_exhausted" | "busy";
  message: string;
  retryAfterSeconds?: number;
};

export type Admission =
  | {
      ok: true;
      fingerprint: string;
      /** Increments once per model call, so the budget tracks real spend. */
      spend: () => Promise<boolean>;
    }
  | Rejection;

/** Prompt bounds are checked before anything is counted or spent. */
export function validatePrompt(raw: unknown): { ok: true; prompt: string } | Rejection {
  if (typeof raw !== "string") {
    return { ok: false, status: 422, code: "invalid_prompt", message: "Send a prompt as text." };
  }
  const prompt = raw.trim();
  if (prompt.length < LIMITS.promptMin) {
    return {
      ok: false,
      status: 422,
      code: "invalid_prompt",
      message: `A prompt needs at least ${LIMITS.promptMin} characters to be worth testing.`,
    };
  }
  if (prompt.length > LIMITS.promptMax) {
    return {
      ok: false,
      status: 422,
      code: "invalid_prompt",
      message: `A prompt can be at most ${LIMITS.promptMax.toLocaleString("en-US")} characters.`,
    };
  }
  return { ok: true, prompt };
}

/**
 * Per-IP token bucket plus the shared daily budget. The budget is checked before a
 * run as well as per call, so an exhausted budget costs nothing.
 */
export async function admit(identifier: Identifier, now = new Date(), env = process.env): Promise<Admission> {
  const counts = activeStore(env);
  const client = clientKey(identifier ?? "unknown");
  const minuteKey = `pg:rl:m:${client}:${hourBucket(now)}:${now.getUTCMinutes()}`;
  const hourKey = `pg:rl:h:${client}:${hourBucket(now)}`;
  const dayKey = `pg:budget:${dayBucket(now)}`;

  try {
    const perMinute = await counts.incr(minuteKey, 60);
    if (perMinute > LIMITS.perIpPerMinute) {
      return {
        ok: false,
        status: 429,
        code: "rate_limited",
        message: "That's a lot of runs in a minute. Wait a moment, then try again.",
        retryAfterSeconds: 60 - now.getUTCSeconds(),
      };
    }

    const perHour = await counts.incr(hourKey, 3600);
    if (perHour > LIMITS.perIpPerHour) {
      return {
        ok: false,
        status: 429,
        code: "rate_limited",
        message: "You've used this hour's runs. The cap keeps the shared key usable for everyone.",
        retryAfterSeconds: 3600 - (now.getUTCMinutes() * 60 + now.getUTCSeconds()),
      };
    }

    const spent = await counts.get(dayKey);
    if (spent + LIMITS.callsPerRun > LIMITS.dailyCalls) {
      return {
        ok: false,
        status: 429,
        code: "budget_exhausted",
        message: "The daily practice budget is used up. It resets at midnight UTC. Nothing was scored.",
        retryAfterSeconds: secondsUntilTomorrow(now),
      };
    }

    let exhausted = false;
    return {
      ok: true,
      fingerprint: client,
      spend: async () => {
        if (exhausted) return false;
        const total = await counts.incr(dayKey, 86_400);
        if (total > LIMITS.dailyCalls) {
          exhausted = true;
          return false;
        }
        return true;
      },
    };
  } catch (error) {
    // A counter outage must not take the product down. It does weaken the shared
    // guarantee, which is why startup logs it once and the README says so.
    if (!redisWarned) {
      console.error("[limits] counter store unavailable, falling back to per-instance memory:", error);
      redisWarned = true;
    }
    store = new MemoryStore();
    return admit(identifier, now, { ...env, UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined });
  }
}

function secondsUntilTomorrow(now: Date): number {
  const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.round((tomorrow - now.getTime()) / 1000));
}

/** Request bodies are rejected on size before JSON.parse. */
export function bodyTooLarge(headers: Headers): boolean {
  const length = headers.get("content-length");
  if (!length) return false;
  const bytes = Number(length);
  return Number.isFinite(bytes) && bytes > LIMITS.bodyMaxBytes;
}

/** Test-only reset for the module-level store. */
export function __resetStoreForTests(): void {
  store = new MemoryStore();
  redisWarned = false;
}
