"use client";

import type { RegressionReport } from "@/lib/regression";
import type { Attempt } from "@/lib/types";
import { CheckIcon, CrossIcon, LoopIcon } from "@/components/ui/icons";

/**
 * Observation and inference are rendered in separate blocks with different framing.
 * A guess never sits in the same sentence as a measurement.
 */
export function RegressionMoment({ report, previous, current }: { report: RegressionReport; previous: Attempt; current: Attempt }) {
  if (report.observations.length === 0) return null;

  const before = new Map(previous.results.map((result) => [result.caseId, result.state]));
  const slipped = new Set(report.observations.map((observation) => observation.caseId));

  return (
    <section
      data-testid="regression"
      className="relative overflow-hidden rounded-card border border-[#EBC58C] bg-[#FFF8EA] p-4 shadow-card"
      aria-labelledby="regression-heading"
      role="status"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-orange" />

      <div className="flex flex-wrap items-center gap-2 pl-1">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-orange text-[#3A2406] shadow-tile"
        >
          <LoopIcon size={17} />
        </span>
        <div>
          <h2 id="regression-heading" className="font-display text-[16px] font-extrabold leading-tight text-[#6E4410]">
            A previously passing case is now failing
          </h2>
          <p className="text-[12px] text-[#8A5212]">
            {report.observations.length === 1 ? "One case slipped" : `${report.observations.length} cases slipped`} between
            attempt {previous.n} and attempt {current.n}.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-white/70 px-3 py-1">
          <span className="metric text-[13px] font-extrabold text-subtle">
            {previous.summary.passed}/{previous.summary.scored}
          </span>
          <span aria-hidden="true" className="text-subtle">
            →
          </span>
          <span className="metric text-[13px] font-extrabold text-coral-deep">
            {current.summary.passed}/{current.summary.scored}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 pl-1" aria-hidden="true">
        {current.results.map((result) => {
          const was = before.get(result.caseId);
          const dropped = slipped.has(result.caseId);
          const pass = result.state === "pass";
          return (
            <span
              key={result.caseId}
              className={`grid h-6 w-6 place-items-center rounded-full border ${
                dropped
                  ? "border-[#D98324] bg-orange text-[#3A2406]"
                  : pass
                    ? "border-mint-deep/30 bg-mint-soft text-mint-deep"
                    : "border-[#F2D3CD] bg-coral-soft text-coral-deep"
              }`}
            >
              {dropped ? <LoopIcon size={12} /> : pass ? <CheckIcon size={12} /> : <CrossIcon size={12} />}
              <span className="sr-only">
                {result.caseName}: {was ?? "unknown"} before, {result.state} now
              </span>
            </span>
          );
        })}
      </div>

      <ul className="mt-3 space-y-2">
        {report.observations.map((observation) => (
          <li key={observation.caseId} className="rounded-2xl border border-[#F0DCB9] bg-white/80 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-extrabold">{observation.caseName}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[10.5px] font-extrabold text-mint-deep">
                <CheckIcon size={10} />
                Passed
              </span>
              <span aria-hidden="true" className="text-[11px] text-subtle">
                then
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-2 py-0.5 text-[10.5px] font-extrabold text-coral-deep">
                <CrossIcon size={10} />
                Failed
              </span>
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-ink">{observation.observedDifference}</p>

            {observation.promptChange.added.length > 0 || observation.promptChange.removed.length > 0 ? (
              <div className="mt-2 rounded-xl bg-canvas/80 p-2">
                <p className="text-[10.5px] font-extrabold text-subtle">Your edit</p>
                {observation.promptChange.removed.map((line, index) => (
                  <p key={`r-${index}`} className="mt-0.5 flex gap-1.5 font-mono text-[11px] leading-snug text-coral-deep">
                    <span aria-hidden="true" className="select-none font-bold">
                      -
                    </span>
                    <span>{line}</span>
                  </p>
                ))}
                {observation.promptChange.added.map((line, index) => (
                  <p key={`a-${index}`} className="mt-0.5 flex gap-1.5 font-mono text-[11px] leading-snug text-mint-deep">
                    <span aria-hidden="true" className="select-none font-bold">
                      +
                    </span>
                    <span>{line}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {report.inference ? (
        <div className="mt-2 rounded-2xl border border-dashed border-[#D9B276] bg-[#FFFCF5] p-3">
          <p className="text-[10.5px] font-extrabold text-[#8A5212]">
            Possible explanation: a hypothesis, not a measurement
            <span className="ml-1 rounded-full bg-orange-soft px-1.5 py-0.5 font-bold">
              {report.inference.confidence} confidence
            </span>
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-[#5A4A34]">{report.inference.text}</p>
          <p className="mt-1 text-[11px] text-subtle">Based on: {report.inference.basis}</p>
        </div>
      ) : (
        <p className="mt-2 pl-1 text-[12px] text-[#8A5212]">
          No cause is proposed here. This edit was too broad for the evidence to support one, so only the observation is
          shown.
        </p>
      )}
    </section>
  );
}
