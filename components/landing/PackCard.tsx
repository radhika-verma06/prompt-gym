import Link from "next/link";
import type { Pack } from "@/lib/packs/types";

function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${step <= level ? "bg-navy" : "bg-line"}`}
        />
      ))}
    </span>
  );
}

export function PackCard({ pack }: { pack: Pack }) {
  return (
    <article
      className={`relative flex flex-col gap-3 rounded-card border bg-surface p-6 transition duration-180 hover:-translate-y-0.5 hover:shadow-lift ${
        pack.flagship ? "border-navy" : "border-line"
      }`}
    >
      {pack.flagship ? (
        <>
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 rounded-t-card bg-accent" />
          <span className="self-start rounded-full bg-accent-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#8A5A12]">
            Start here · flagship
          </span>
        </>
      ) : null}

      <h3 className="text-xl font-extrabold tracking-tight">{pack.name}</h3>
      <p className="text-[14.5px] leading-relaxed text-subtle">{pack.tagline}</p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-[12.5px] text-subtle">
        <span>Skill: {pack.skill}</span>
        <Difficulty level={pack.difficulty} />
      </div>

      <Link
        href={`/workspace/${pack.id}`}
        className={`mt-1 rounded-xl px-4 py-3 text-center text-[14.5px] font-extrabold transition ${
          pack.flagship
            ? "bg-navy text-white hover:brightness-110"
            : "border-[1.5px] border-navy bg-surface text-navy hover:bg-navy-soft"
        }`}
      >
        Practise this pack
      </Link>
    </article>
  );
}
