"use client";

import type { CaseResult, DisplayState } from "@/lib/types";
import { CaseTile } from "./CaseTile";
import { LockIcon } from "@/components/ui/icons";

export function Arena({
  results,
  running,
  liveCount,
  regressedIds,
  attemptNumber,
}: {
  results: CaseResult[];
  running: boolean;
  liveCount: number;
  regressedIds: Set<string>;
  attemptNumber?: number;
}) {
  const hasRun = results.length > 0 || running;
  const pending = running ? Math.max(0, 6 - liveCount) : 0;

  return (
    <section aria-labelledby="arena-heading" className="paper-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="arena-heading" className="font-display text-[18px] font-extrabold leading-tight">
          The arena
        </h2>
        <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-extrabold text-subtle">6 hidden cases</span>
        <span className="ml-auto text-[12px] font-bold text-subtle" aria-live="polite">
          {running ? `${liveCount} of 6 resolved` : hasRun ? `Attempt ${attemptNumber}` : "Waiting for a prompt"}
        </span>
      </div>

      {!hasRun ? (
        <p className="mt-2 rounded-xl bg-canvas/70 px-3 py-2 text-[12.5px] font-bold text-ink">
          No runs yet. Write a prompt and press Run tests.
        </p>
      ) : null}

      <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {results.map((result, index) => (
          <li key={result.caseId} className="h-full">
            <CaseTile
              result={result}
              index={index}
              displayState={!running && regressedIds.has(result.caseId) ? ("regressed" as DisplayState) : undefined}
            />
          </li>
        ))}

        {Array.from({ length: pending }).map((_, index) => (
          <li key={`pending-${index}`} aria-hidden="true">
            <div
              className="h-full min-h-[150px] animate-pulse rounded-tile border border-dashed border-line bg-canvas/60 p-3"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span className="block h-5 w-16 rounded-full bg-line/80" />
              <span className="mt-3 block h-3 w-3/4 rounded bg-line/70" />
              <span className="mt-2 block h-3 w-1/2 rounded bg-line/60" />
            </div>
          </li>
        ))}

        {!hasRun
          ? Array.from({ length: 6 }).map((_, index) => (
              <li key={`locked-${index}`}>
                <div className="flex h-full min-h-[132px] flex-col items-center justify-center gap-1.5 rounded-tile border border-dashed border-line bg-canvas/40 p-3 text-center">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-paper text-subtle">
                    <LockIcon size={16} />
                  </span>
                  <span className="text-[11px] font-bold text-subtle">Hidden case</span>
                </div>
              </li>
            ))
          : null}
      </ul>

      <p className="mt-2.5 text-[11.5px] leading-snug text-subtle">
        Expand a tile for the check that decided it and the model response. Withheld text never leaks the hidden
        message.
      </p>
    </section>
  );
}
