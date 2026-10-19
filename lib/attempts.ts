import type { Attempt } from "@/lib/types";

/**
 * Attempts live in sessionStorage for the tab's lifetime — no accounts, no database,
 * no prompts leaving the machine beyond the model call. The export is the durable copy.
 */

const PREFIX = "prompt-gym:v1:attempts:";
export const MAX_ATTEMPTS = 20;

function key(packId: string): string {
  return `${PREFIX}${packId}`;
}

/** Storage can be unavailable (private mode, SSR); callers get an empty list. */
export function loadAttempts(packId: string): Attempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(key(packId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAttempt).sort((a, b) => a.n - b.n);
  } catch {
    return [];
  }
}

export function saveAttempts(packId: string, attempts: Attempt[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = [...attempts].sort((a, b) => a.n - b.n).slice(-MAX_ATTEMPTS);
    window.sessionStorage.setItem(key(packId), JSON.stringify(trimmed));
  } catch {
    // Quota or disabled storage: the run still counts on screen, it just won't survive
    // a reload. The UI doesn't claim otherwise.
  }
}

export function clearAttempts(packId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key(packId));
  } catch {
    // Nothing to do.
  }
}

function isAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Attempt>;
  return (
    typeof candidate.n === "number" &&
    typeof candidate.prompt === "string" &&
    typeof candidate.startedAt === "string" &&
    Array.isArray(candidate.results) &&
    typeof candidate.summary === "object" &&
    candidate.summary !== null
  );
}
