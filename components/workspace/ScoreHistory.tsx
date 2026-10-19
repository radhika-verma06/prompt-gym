"use client";

import { ratio } from "@/lib/scoring";
import type { Attempt } from "@/lib/types";
import { ChevronIcon } from "@/components/ui/icons";

/**
 * One bar per attempt. Height is the ratio of passed to scored cases, so an attempt
 * with an unresolved case isn't drawn as a drop it didn't measure. Every bar is also
 * labelled with its numbers.
 */
export function ScoreHistory({ attempts, bestNumber }: { attempts: Attempt[]; bestNumber?: number }) {
  if (attempts.length === 0) {
    return (
      <section aria-labelledby="history-heading" className="paper-card p-4">
        <h2 id="history-heading" className="font-display text-[18px] font-extrabold">
          Attempt history
        </h2>
        <p className="mt-1 text-[12.5px] text-subtle">The first run puts a bar here.</p>
      </section>
    );
  }

  const shown = attempts.slice(-10);

  return (
    <section aria-labelledby="history-heading" className="paper-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="history-heading" className="font-display text-[18px] font-extrabold">
          Attempt history
        </h2>
        <span className="text-[11.5px] font-bold text-subtle">
          {attempts.length} attempt{attempts.length === 1 ? "" : "s"} this session
        </span>
      </div>

      <ul className="mt-3 flex h-[76px] items-end gap-1.5" aria-hidden="true">
        {shown.map((attempt) => {
          const height = Math.max(8, Math.round(ratio(attempt.summary) * 62));
          const isBest = attempt.n === bestNumber;
          return (
            <li key={attempt.n} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="metric text-[10px] font-bold text-subtle">
                {attempt.summary.passed}/{attempt.summary.scored}
              </span>
              <span
                className={`w-full max-w-[30px] rounded-t-md transition-all duration-500 ${
                  isBest ? "bg-navy" : "bg-[#C3CDE1]"
                }`}
                style={{ height }}
              />
              <span className="text-[9.5px] text-subtle">#{attempt.n}</span>
            </li>
          );
        })}
      </ul>

      <ul className="sr-only">
        {attempts.map((attempt) => (
          <li key={attempt.n}>
            Attempt {attempt.n}: {attempt.summary.passed} of {attempt.summary.scored} scored cases passed,{" "}
            {attempt.summary.uncertain} uncertain, {attempt.summary.errors} not evaluated.
          </li>
        ))}
      </ul>

      <ul className="mt-2 space-y-1 border-t border-line pt-2">
        {[...attempts]
          .reverse()
          .slice(0, 4)
          .map((attempt, index, all) => {
            const prior = all[index + 1];
            const improved: string[] = [];
            const worsened: string[] = [];
            if (prior) {
              const before = new Map(prior.results.map((result) => [result.caseId, result.state]));
              for (const result of attempt.results) {
                const was = before.get(result.caseId);
                if (was === "fail" && result.state === "pass") improved.push(result.caseName);
                if (was === "pass" && result.state === "fail") worsened.push(result.caseName);
              }
            }
            return (
              <li key={attempt.n}>
                <details className="group rounded-lg px-1 py-0.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[12px] [&::-webkit-details-marker]:hidden">
                    <span className="font-extrabold">Attempt {attempt.n}</span>
                    <span className="metric text-subtle">
                      {attempt.summary.passed}/{attempt.summary.scored}
                    </span>
                    {!attempt.complete ? (
                      <span className="rounded-full bg-coral-soft px-1.5 text-[10px] font-bold text-coral-deep">partial</span>
                    ) : null}
                    {prior ? (
                      <span className="ml-auto flex items-center gap-1 text-[10.5px] font-bold">
                        {improved.length > 0 ? <span className="text-mint-deep">+{improved.length}</span> : null}
                        {worsened.length > 0 ? <span className="text-coral-deep">-{worsened.length}</span> : null}
                        {improved.length === 0 && worsened.length === 0 ? (
                          <span className="text-subtle">same cases</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="ml-auto text-[10.5px] text-subtle">first run</span>
                    )}
                    <ChevronIcon size={12} className="text-subtle transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-1 text-[11.5px] leading-snug text-subtle">
                    {improved.length > 0 ? `Fixed: ${improved.join(", ")}. ` : ""}
                    {worsened.length > 0 ? `Broke: ${worsened.join(", ")}. ` : ""}
                    {prior && improved.length === 0 && worsened.length === 0
                      ? "No case changed hands compared with the attempt before."
                      : ""}
                    {!prior ? "The first attempt in this session." : ""}
                  </p>
                </details>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
