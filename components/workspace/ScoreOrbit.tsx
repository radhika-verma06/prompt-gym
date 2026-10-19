"use client";

import { bestAttempt, compareAttempts, ratio } from "@/lib/scoring";
import type { Attempt } from "@/lib/types";
import { Tally } from "@/components/ui/Tally";
import { CheckIcon, GaugeIcon, TrophyIcon } from "@/components/ui/icons";

type Props = {
  attempts: Attempt[];
  /** Live results while a run is streaming. */
  live: { passed: number; scored: number; uncertain: number; errors: number } | null;
  running: boolean;
};

const R = 46;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function ScoreOrbit({ attempts, live, running }: Props) {
  const latest = attempts[attempts.length - 1];
  const previous = attempts[attempts.length - 2];
  const summary = live ?? latest?.summary ?? null;
  const best = bestAttempt(attempts);
  const comparison = latest && previous ? compareAttempts(previous, latest) : null;
  const delta = comparison?.comparable ? latest!.summary.passed - previous!.summary.passed : null;
  // Identical prompts can still differ run to run. Calling that "progress" would be
  // a claim the evidence doesn't support.
  const samePrompt = Boolean(latest && previous && latest.prompt.trim() === previous.prompt.trim());
  const share = summary && summary.scored > 0 ? summary.passed / summary.scored : 0;
  const stroke = !summary || summary.scored === 0 ? "#E4DCCB" : share >= 0.8 ? "#2E9C7C" : share >= 0.5 ? "#E08A2B" : "#D9564B";

  const label = summary
    ? `${summary.passed} of ${summary.scored} scored cases passed`
    : running
      ? "Evaluation in progress"
      : "No runs yet";

  return (
    <section aria-labelledby="score-heading" className="paper-card grain p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <div className="relative grid h-[116px] w-[116px] shrink-0 place-items-center">
          <svg viewBox="0 0 108 108" className="h-[116px] w-[116px] -rotate-90" aria-hidden="true">
            <circle cx="54" cy="54" r={R} fill="none" stroke="#F0E9DC" strokeWidth="11" />
            <circle
              cx="54"
              cy="54"
              r={R}
              fill="none"
              stroke={stroke}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - share)}
              className="score-ring"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            {summary ? (
              <span data-testid="score" className="metric font-display text-[30px] font-extrabold leading-none">
                {/* While results stream, show the real numbers. Animating them here could
                    briefly render an impossible fraction such as 5/3. */}
                {live ? (
                  summary.passed
                ) : (
                  <Tally value={summary.passed} from={previous?.summary.passed ?? 0} />
                )}
                <span className="text-[18px] text-subtle">/</span>
                <span className="text-[22px]">{summary.scored}</span>
              </span>
            ) : (
              <span data-testid="score" className="metric font-display text-[24px] font-extrabold leading-none text-subtle">
                {running ? "…" : "0/0"}
              </span>
            )}
          </div>
          <span className="sr-only" aria-live="polite">
            {label}
          </span>
        </div>

        <div className="min-w-[190px] flex-1">
          <div className="flex items-center gap-2">
            <h2 id="score-heading" className="font-display text-[19px] font-extrabold leading-tight">
              {running ? "Reading the arena" : latest ? `Attempt ${latest.n}` : "Ready when you are"}
            </h2>
            {best && latest && best.n === latest.n && attempts.length > 1 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[11px] font-extrabold text-mint-deep">
                <TrophyIcon size={12} />
                Best so far
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 text-[12.5px] text-subtle">
            {running
              ? `${live?.scored ?? 0} of 6 cases have a verdict so far.`
              : summary && summary.scored > 0
                ? `${Math.round(share * 100)}% of scored cases passed.`
                : "Write a prompt, then send it into the arena."}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {delta !== null ? (
              samePrompt ? (
                <span className="rounded-full bg-navy-soft px-2.5 py-1 text-[12px] font-extrabold text-navy">
                  {delta === 0
                    ? "Same prompt as previous attempt. Scored the same."
                    : "Same prompt as previous attempt. Run-to-run variation, not progress."}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-extrabold ${
                    delta > 0
                      ? "bg-mint-soft text-mint-deep"
                      : delta < 0
                        ? "bg-coral-soft text-coral-deep"
                        : "bg-navy-soft text-navy"
                  }`}
                >
                  <span aria-hidden="true">{delta > 0 ? "↑" : delta < 0 ? "↓" : "="}</span>
                  {delta > 0 ? `+${delta}` : delta} vs previous attempt
                </span>
              )
            ) : null}

            {summary && summary.uncertain > 0 ? (
              <span className="rounded-full bg-navy-soft px-2.5 py-1 text-[12px] font-bold text-navy">
                {summary.uncertain} uncertain, not counted
              </span>
            ) : null}
            {summary && summary.errors > 0 ? (
              <span className="rounded-full bg-canvas px-2.5 py-1 text-[12px] font-bold text-subtle">
                {summary.errors} not evaluated
              </span>
            ) : null}
            {summary && summary.scored > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft/70 px-2.5 py-1 text-[12px] font-bold text-mint-deep">
                <CheckIcon size={12} />
                {summary.passed} held
              </span>
            ) : null}
          </div>

          {comparison && !comparison.comparable ? (
            <p className="mt-2 text-[12px] font-bold text-coral-deep">
              Not directly comparable: {comparison.reason}. No delta shown.
            </p>
          ) : null}

          {best ? (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-subtle">
              <TrophyIcon size={13} className="text-orange-deep" />
              Best: attempt {best.n}
              <span className="metric font-normal">
                ({best.summary.passed}/{best.summary.scored}, {Math.round(ratio(best.summary) * 100)}%)
              </span>
            </p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-subtle">
              <GaugeIcon size={13} />
              A pace to beat appears after your first completed run.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
