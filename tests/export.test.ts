import { describe, expect, it } from "vitest";
import { buildLesson } from "@/lib/lesson";
import { buildMarkdown } from "@/lib/export/markdown";
import { buildJson, exportFilename } from "@/lib/export/json";
import { flagship } from "@/lib/packs";
import type { Attempt, CaseResult } from "@/lib/types";

const result: CaseResult = {
  caseId: "case-1",
  caseName: "Straightforward refund",
  criterionIds: ["C1", "C2"],
  tier: "A",
  decidedBy: "JSON parse check",
  state: "pass",
  observed: "Valid JSON, and a single object.",
  publicResponse: '{"order_id":"ORD-2291"}',
  withheld: false,
  checks: [],
};

const attempt: Attempt = {
  n: 1,
  prompt: "Return strict JSON with the four fields.",
  startedAt: "2026-10-18T10:00:00.000Z",
  modelIds: { underTest: "model-a", judge: "model-b" },
  settingsHash: "abc123",
  evaluationVersion: "eval-1",
  fixtureSetId: "fixture-1",
  fixtureSource: "production",
  results: [result],
  summary: { passed: 1, scored: 1, uncertain: 0, errors: 0, complete: true },
  complete: true,
};

const lesson = buildLesson(flagship, [result]);
const exportedAt = new Date("2026-10-18T12:00:00.000Z");

describe("Markdown export", () => {
  const markdown = buildMarkdown(flagship, [attempt], lesson, exportedAt);

  it("names the pack, the time and the real-evaluation note", () => {
    expect(markdown).toContain("# Prompt Gym — Structured Extraction");
    expect(markdown).toContain("2026-10-18 12:00:00 UTC");
    expect(markdown).toContain("came from real model evaluations");
  });

  it("includes the final prompt, results and history", () => {
    expect(markdown).toContain("Return strict JSON with the four fields.");
    expect(markdown).toContain("Straightforward refund");
    expect(markdown).toContain("## Attempt history");
    expect(markdown).toContain("## What this attempt shows");
  });

  it("states that hidden inputs are absent", () => {
    expect(markdown).toContain("Hidden test inputs and acceptable answers are not part of this report.");
  });

  it("handles an empty session without inventing an attempt", () => {
    const empty = buildMarkdown(flagship, [], buildLesson(flagship, []), exportedAt);
    expect(empty).toContain("No attempts were recorded");
    expect(empty).not.toContain("## Attempt history");
  });
});

describe("JSON export", () => {
  const payload = buildJson(flagship, [attempt], lesson, exportedAt);

  it("carries the same facts in a structured shape", () => {
    expect(payload.pack.id).toBe("structured-extraction");
    expect(payload.exportedAt).toBe("2026-10-18T12:00:00.000Z");
    expect(payload.latestAttempt).toBe(1);
    expect(payload.attempts[0]?.prompt).toBe(attempt.prompt);
    expect(payload.lesson.headline).toBe(lesson.headline);
  });

  it("labels the format and states the exclusion", () => {
    expect(payload.format).toBe("prompt-gym/report");
    expect(payload.excludes).toContain("never sent to the browser");
  });

  it("produces a predictable filename", () => {
    expect(exportFilename(flagship, "md", exportedAt)).toBe("prompt-gym-structured-extraction-2026-10-18T12-00-00.md");
  });
});
