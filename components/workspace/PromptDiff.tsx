"use client";

import { useMemo } from "react";
import { caseChanges, diffLines } from "@/lib/prompt-diff";
import type { Attempt } from "@/lib/types";
import { ArrowIcon, CheckIcon, ChevronIcon, CrossIcon } from "@/components/ui/icons";

/**
 * A unified diff of the two prompts plus the cases that moved. The two are placed
 * together because that is what the user needs to reason about; the wording never
 * claims one line caused one flip.
 */
export function PromptDiff({ previous, current }: { previous: Attempt; current: Attempt }) {
  const diff = useMemo(() => diffLines(previous.prompt, current.prompt), [previous.prompt, current.prompt]);
  const changes = useMemo(() => caseChanges(previous.results, current.results), [previous.results, current.results]);

  const added = diff.filter((line) => line.type === "add").length;
  const removed = diff.filter((line) => line.type === "remove").length;
  const unchanged = added === 0 && removed === 0;
  const moved = changes.fixed.length + changes.broken.length;

  return (
    <details open className="group paper-card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="font-display text-[18px] font-extrabold leading-tight">Your last edit</span>
        {unchanged ? (
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-extrabold text-subtle">No change</span>
        ) : (
          <span className="flex items-center gap-1 text-[11.5px] font-extrabold">
            <span className="rounded-full bg-mint-soft px-2 py-0.5 text-mint-deep">+{added}</span>
            <span className="rounded-full bg-coral-soft px-2 py-0.5 text-coral-deep">-{removed}</span>
          </span>
        )}
        <span className="ml-auto text-[11.5px] font-bold text-subtle">
          Attempt {previous.n} → {current.n}
        </span>
        <ChevronIcon size={16} className="text-subtle transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-line px-4 pb-4 pt-3">
        {unchanged ? (
          <p className="rounded-xl bg-canvas px-3 py-2 text-[12.5px] leading-snug text-subtle">
            The instruction is identical to the previous attempt. Any difference in results is run-to-run variation, not
            progress.
          </p>
        ) : (
          <div className="prompt-scroll max-h-56 overflow-auto rounded-xl border border-line bg-canvas/50 py-1.5">
            {diff.map((line, index) => (
              <p
                key={index}
                className={`flex gap-2 px-2.5 py-0.5 font-mono text-[11.5px] leading-relaxed ${
                  line.type === "add"
                    ? "bg-mint-soft/70 text-[#14513F]"
                    : line.type === "remove"
                      ? "bg-coral-soft/70 text-[#7E2B26]"
                      : "text-subtle"
                }`}
              >
                <span aria-hidden="true" className="w-2 shrink-0 select-none font-bold">
                  {line.type === "add" ? "+" : line.type === "remove" ? "-" : ""}
                </span>
                <span className={line.text.trim() === "" ? "opacity-40" : ""}>{line.text || " "}</span>
                <span className="sr-only">
                  {line.type === "add" ? "added line" : line.type === "remove" ? "removed line" : "unchanged line"}
                </span>
              </p>
            ))}
          </div>
        )}

        <div className="mt-3">
          <p className="text-[11.5px] font-extrabold text-subtle">
            Cases that changed with this edit{moved > 0 ? `: ${moved}` : ""}
          </p>
          {!changes.comparable ? (
            <p className="mt-1 text-[12px] text-subtle">These attempts don&apos;t line up case for case, so no comparison is drawn.</p>
          ) : moved === 0 ? (
            <p className="mt-1 text-[12px] text-subtle">No case changed hands. The edit moved the wording, not the score.</p>
          ) : (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {changes.fixed.map((move) => (
                <li key={`fixed-${move.caseId}`}>
                  <a
                    href={`#case-${move.caseId}`}
                    className="inline-flex items-center gap-1 rounded-full border border-mint-deep/30 bg-mint-soft px-2 py-1 text-[11.5px] font-bold text-mint-deep transition hover:border-mint-deep"
                  >
                    <CheckIcon size={11} />
                    {move.caseName} fixed
                    <ArrowIcon size={11} className="rotate-90" />
                  </a>
                </li>
              ))}
              {changes.broken.map((move) => (
                <li key={`broken-${move.caseId}`}>
                  <a
                    href={`#case-${move.caseId}`}
                    className="inline-flex items-center gap-1 rounded-full border border-coral-deep/30 bg-coral-soft px-2 py-1 text-[11.5px] font-bold text-coral-deep transition hover:border-coral-deep"
                  >
                    <CrossIcon size={11} />
                    {move.caseName} broke
                    <ArrowIcon size={11} className="rotate-90" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] leading-snug text-subtle">
            Shown side by side because that is how a trade reads. A changed line is not proof of a cause.
          </p>
        </div>
      </div>
    </details>
  );
}
