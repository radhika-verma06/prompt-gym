"use client";

import type { Pack } from "@/lib/packs/types";
import { BulbIcon, TargetIcon } from "@/components/ui/icons";

export function MissionCard({ pack }: { pack: Pack }) {
  return (
    <section className="paper-card p-4" aria-labelledby="mission-heading">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-soft text-navy">
          <TargetIcon size={15} />
        </span>
        <h2 id="mission-heading" className="font-display text-[16px] font-extrabold leading-tight">
          Mission
        </h2>
        <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 text-[10.5px] font-extrabold text-subtle">
          {pack.skill}
        </span>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{pack.objective}</p>

      <ul className="mt-2.5 grid grid-cols-2 gap-1.5">
        {pack.criteria.map((criterion) => (
          <li
            key={criterion.id}
            title={`${criterion.label}. ${criterion.detail}`}
            className="flex items-center gap-1.5 rounded-lg border border-line/80 bg-white/70 px-1.5 py-1"
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${criterion.tier === "A" ? "bg-mint" : "bg-navy"}`}
            />
            <span className="truncate text-[10.5px] font-bold text-subtle">
              <span className="font-mono text-ink">{criterion.id}</span> {criterion.label}
            </span>
          </li>
        ))}
      </ul>

      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-[11.5px] font-extrabold text-navy [&::-webkit-details-marker]:hidden">
          <BulbIcon size={13} className="text-orange-deep" />
          What a strong prompt does here
        </summary>
        <p className="mt-1.5 rounded-xl bg-orange-soft/60 px-2.5 py-2 text-[11.5px] leading-relaxed text-[#6E4410]">
          {pack.guidance}
        </p>
      </details>

      <p className="mt-2 flex items-center gap-2 text-[10.5px] font-bold text-subtle">
        <span className="flex items-center gap-1">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-mint" />
          rule checked
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-navy" />
          judged
        </span>
      </p>
    </section>
  );
}
