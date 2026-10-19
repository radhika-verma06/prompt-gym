import type { Pack } from "@/lib/packs/types";
import type { Attempt } from "@/lib/types";
import type { Lesson } from "@/lib/lesson";
import { ratio } from "@/lib/scoring";

/**
 * Export is built only from what the browser already has. Case inputs and acceptable
 * answers were never sent to the browser, so they cannot appear here — this is a
 * structural guarantee, not a filter that might miss something.
 */

const STATE_LABEL: Record<string, string> = {
  pass: "Passed",
  fail: "Failed",
  regressed: "Regressed",
  uncertain: "Evaluation uncertain",
  unresolved: "Not evaluated",
};

function scoreLine(attempt: Attempt): string {
  const { passed, scored, uncertain, errors } = attempt.summary;
  const parts = [`${passed}/${scored} scored cases passed`];
  if (uncertain > 0) parts.push(`${uncertain} uncertain (not counted)`);
  if (errors > 0) parts.push(`${errors} not evaluated`);
  return parts.join(" · ");
}

function time(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function buildMarkdown(pack: Pack, attempts: Attempt[], lesson: Lesson, exportedAt = new Date()): string {
  const latest = attempts[attempts.length - 1];
  const lines: string[] = [];

  lines.push(`# Prompt Gym — ${pack.name}`);
  lines.push("");
  lines.push(`Exported ${time(exportedAt.toISOString())}.`);
  lines.push("");
  lines.push(
    "Every result in this report came from real model evaluations run in the browser session that produced it. Nothing here is simulated, cached from another session, or estimated.",
  );
  lines.push("");
  lines.push(`**Objective:** ${pack.objective}`);
  lines.push("");

  if (!latest) {
    lines.push("No attempts were recorded in this session.");
    return `${lines.join("\n")}\n`;
  }

  const best = attempts.reduce((chosen, attempt) =>
    ratio(attempt.summary) > ratio(chosen.summary) ? attempt : chosen,
  );

  lines.push(`## Final prompt (attempt ${latest.n})`);
  lines.push("");
  lines.push("```text");
  lines.push(latest.prompt);
  lines.push("```");
  lines.push("");
  lines.push(`**Score:** ${scoreLine(latest)}${best.n === latest.n ? " — best attempt in this session" : ` · best was attempt ${best.n} (${scoreLine(best)})`}`);
  lines.push("");

  lines.push(`## Case results — attempt ${latest.n}`);
  lines.push("");
  for (const result of latest.results) {
    lines.push(`### ${STATE_LABEL[result.state] ?? result.state} — ${result.caseName}`);
    lines.push("");
    lines.push(`- Criteria: ${result.criterionIds.join(", ")}`);
    lines.push(`- Decided by: ${result.decidedBy} (Tier ${result.tier})`);
    lines.push(`- Observed: ${result.observed}`);
    if (result.withheld) {
      lines.push("- Model response: withheld to protect this case's hidden input.");
    } else if (result.publicResponse) {
      lines.push("- Model response:");
      lines.push("");
      lines.push("```text");
      lines.push(result.publicResponse);
      lines.push("```");
    } else {
      lines.push("- Model response: none returned.");
    }
    lines.push("");
  }

  lines.push("## Attempt history");
  lines.push("");
  lines.push("| # | Started | Score | Uncertain | Not evaluated |");
  lines.push("|---|---|---|---|---|");
  for (const attempt of attempts) {
    lines.push(
      `| ${attempt.n} | ${time(attempt.startedAt)} | ${attempt.summary.passed}/${attempt.summary.scored} | ${attempt.summary.uncertain} | ${attempt.summary.errors} |`,
    );
  }
  lines.push("");
  lines.push(
    `Model: \`${latest.modelIds.underTest}\` under test, \`${latest.modelIds.judge}\` judging · settings \`${latest.settingsHash}\` · evaluation \`${latest.evaluationVersion}\` · cases \`${latest.fixtureSetId}\` (${latest.fixtureSource}).`,
  );
  lines.push("");

  lines.push("## What this attempt shows");
  lines.push("");
  lines.push(`**${lesson.headline}**`);
  lines.push("");
  lines.push(lesson.detail);
  lines.push("");
  lines.push("| Criterion | Status |");
  lines.push("|---|---|");
  for (const criterion of lesson.criteria) {
    lines.push(`| ${criterion.id} — ${criterion.label} | ${criterion.status} |`);
  }
  lines.push("");

  lines.push("## Not included");
  lines.push("");
  lines.push(
    "Hidden test inputs and acceptable answers are not part of this report. The browser never received them, so they cannot be reconstructed from it.",
  );

  return `${lines.join("\n")}\n`;
}
