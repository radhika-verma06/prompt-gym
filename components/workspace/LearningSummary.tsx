"use client";

import type { Lesson } from "@/lib/lesson";
import { CheckIcon, ChevronIcon, CrossIcon, InfoIcon, QuestionIcon, SparkIcon } from "@/components/ui/icons";

const STATUS = {
  met: { label: "Held", tone: "bg-mint-soft text-mint-deep", icon: CheckIcon },
  missed: { label: "Missed", tone: "bg-coral-soft text-coral-deep", icon: CrossIcon },
  uncertain: { label: "Undecided", tone: "bg-navy-soft text-navy", icon: QuestionIcon },
  untested: { label: "Not tested", tone: "bg-canvas text-subtle", icon: InfoIcon },
} as const;

export function LearningSummary({ lesson }: { lesson: Lesson }) {
  return (
    <details className="group paper-card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-start gap-2.5 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-soft text-orange-deep">
          <SparkIcon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-extrabold text-subtle">What this attempt shows</p>
          <p className="text-[13.5px] font-extrabold leading-snug">{lesson.headline}</p>
        </div>
        <ChevronIcon size={16} className="mt-1 shrink-0 text-subtle transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-line px-4 pb-4 pt-3">
        <p className="text-[12.5px] leading-relaxed text-subtle">{lesson.detail}</p>

        <ul className="mt-3 grid grid-cols-2 gap-1.5">
          {lesson.criteria.map((criterion) => {
            const status = STATUS[criterion.status];
            const Icon = status.icon;
            return (
              <li
                key={criterion.id}
                className={`flex items-start gap-1.5 rounded-xl px-2 py-1.5 ${status.tone}`}
                title={criterion.label}
              >
                <Icon size={13} className="mt-0.5 shrink-0" />
                <span className="text-[11.5px] font-bold leading-snug">
                  <span className="font-mono">{criterion.id}</span> {status.label}
                  {criterion.changed === "newly-met" ? <span className="ml-1">↑</span> : null}
                  {criterion.changed === "newly-missed" ? <span className="ml-1">↓</span> : null}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-2 text-[11px] leading-snug text-subtle">
          Built only from criteria these results actually tested. Undecided criteria stay out of both columns.
        </p>
      </div>
    </details>
  );
}
