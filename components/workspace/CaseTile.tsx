"use client";

import { STATE_PRESENTATION, hintFor, type DisplayStateKey } from "@/lib/feedback";
import { tierExplanation } from "@/lib/validators";
import type { CaseResult } from "@/lib/types";
import { BulbIcon, CheckIcon, ChevronIcon, CrossIcon, InfoIcon, LoopIcon, QuestionIcon } from "@/components/ui/icons";

const BADGE: Record<DisplayStateKey, string> = {
  pass: "bg-mint-soft text-mint-deep",
  fail: "bg-coral-soft text-coral-deep",
  regressed: "bg-orange-soft text-[#8A5212]",
  uncertain: "bg-navy-soft text-navy",
  unresolved: "bg-canvas text-subtle",
};

const FRAME: Record<DisplayStateKey, string> = {
  pass: "border-[#CFE7DC] hover:border-mint-deep/50",
  fail: "border-[#F2D3CD] hover:border-coral-deep/50",
  regressed: "border-[#EBC58C] animate-warm-pulse",
  uncertain: "border-[#CFD8EC] hover:border-navy/40",
  unresolved: "border-dashed border-line",
};

function StateIcon({ state }: { state: DisplayStateKey }) {
  if (state === "pass") return <CheckIcon size={13} />;
  if (state === "fail") return <CrossIcon size={13} />;
  if (state === "regressed") return <LoopIcon size={13} />;
  if (state === "uncertain") return <QuestionIcon size={13} />;
  return <span aria-hidden="true" className="block h-[2px] w-2.5 rounded bg-current" />;
}

export function CaseTile({
  result,
  displayState,
  index = 0,
}: {
  result: CaseResult;
  /** Derived by comparing attempts; falls back to the case's own state. */
  displayState?: DisplayStateKey;
  index?: number;
}) {
  const state = displayState ?? (result.state as DisplayStateKey);
  const presentation = STATE_PRESENTATION[state] ?? STATE_PRESENTATION.unresolved;
  const hint = hintFor(result);

  return (
    <article
      id={`case-${result.caseId}`}
      data-testid="case-result"
      data-state={state}
      style={{ animationDelay: `${index * 55}ms` }}
      className={`tile-flip flex h-full scroll-mt-24 flex-col rounded-tile border bg-paper p-3 shadow-tile transition duration-200 ${FRAME[state]}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${BADGE[state]}`}>
          <StateIcon state={state} />
          {presentation.label}
        </span>
        <span className="ml-auto font-mono text-[10px] font-bold text-subtle">{result.criterionIds.join(" ")}</span>
      </div>

      <h3 className="mt-2 text-[13.5px] font-extrabold leading-snug">{result.caseName}</h3>
      <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-subtle">{result.observed}</p>

      {state === "regressed" ? (
        <p className="mt-2 rounded-lg bg-orange-soft px-2 py-1 text-[11px] font-bold leading-snug text-[#8A5212]">
          Held last attempt. Failed now.
        </p>
      ) : null}

      {state === "uncertain" ? (
        <p className="mt-2 rounded-lg bg-navy-soft px-2 py-1 text-[11px] leading-snug text-navy">
          Left out of the score, not counted against you.
        </p>
      ) : null}

      <div className="mt-auto pt-2">
        <details className="group border-t border-line/80 pt-1.5">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-[11.5px] font-extrabold text-navy [&::-webkit-details-marker]:hidden">
            <InfoIcon size={13} />
            Details
            <ChevronIcon size={13} className="ml-auto transition group-open:rotate-180" />
          </summary>
          <div className="mt-1.5 space-y-1.5">
            <p className="text-[11.5px] leading-snug text-ink">{result.observed}</p>
            <p className="text-[11.5px] leading-snug text-subtle">
              <span className="font-bold text-ink">Checked by: </span>
              {result.decidedBy}
            </p>
            <p className="text-[11px] leading-snug text-subtle">{tierExplanation(result.tier)}</p>
            {hint ? (
              <p className="flex gap-1.5 rounded-lg bg-orange-soft/70 px-2 py-1.5 text-[11.5px] leading-snug text-[#6E4410]">
                <BulbIcon size={13} className="mt-0.5 shrink-0" />
                <span>{hint}</span>
              </p>
            ) : null}
          </div>
        </details>

        <details className="group mt-1 border-t border-line/80 pt-1.5">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-[11.5px] font-extrabold text-navy [&::-webkit-details-marker]:hidden">
            {result.withheld ? "Model response (withheld)" : "Raw model response"}
            <ChevronIcon size={13} className="ml-auto transition group-open:rotate-180" />
          </summary>
          {result.withheld ? (
            <p className="mt-1.5 rounded-lg bg-canvas px-2 py-1.5 text-[11.5px] leading-snug text-subtle">
              Hidden because it repeated this case&apos;s message. The verdict still stands.
            </p>
          ) : result.publicResponse ? (
            <pre className="prompt-scroll mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-canvas px-2 py-1.5 font-mono text-[11px] leading-relaxed text-ink">
              {result.publicResponse}
            </pre>
          ) : (
            <p className="mt-1.5 rounded-lg bg-canvas px-2 py-1.5 text-[11.5px] text-subtle">
              No text came back for this case.
            </p>
          )}
        </details>
      </div>
    </article>
  );
}
