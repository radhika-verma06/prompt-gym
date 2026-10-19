import type { Pack } from "@/lib/packs/types";
import type { Attempt } from "@/lib/types";
import type { Lesson } from "@/lib/lesson";

/** The same content as the Markdown report, in a shape a tool can read. */

export type ExportPayload = {
  format: "prompt-gym/report";
  version: 1;
  exportedAt: string;
  pack: { id: string; name: string; objective: string };
  note: string;
  latestAttempt: number | null;
  attempts: Attempt[];
  lesson: Lesson;
  excludes: string;
};

export function buildJson(pack: Pack, attempts: Attempt[], lesson: Lesson, exportedAt = new Date()): ExportPayload {
  return {
    format: "prompt-gym/report",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    pack: { id: pack.id, name: pack.name, objective: pack.objective },
    note: "Every result came from real model evaluations in the session that produced this report. Hidden test inputs and acceptable answers are not included.",
    latestAttempt: attempts.length > 0 ? attempts[attempts.length - 1]!.n : null,
    attempts,
    lesson,
    excludes:
      "Case inputs and acceptable answers are never sent to the browser, so they cannot be present in this file.",
  };
}

/** Shared by both export formats so the filename is predictable. */
export function exportFilename(pack: Pack, extension: "md" | "json", at = new Date()): string {
  const stamp = at.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `prompt-gym-${pack.id}-${stamp}.${extension}`;
}
