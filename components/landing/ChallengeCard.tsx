import Link from "next/link";
import type { Pack } from "@/lib/packs/types";
import { PackArt } from "@/components/brand/PackArt";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ArrowIcon, BracesIcon, ScissorsIcon, ShieldIcon } from "@/components/ui/icons";

const TONE: Record<
  string,
  { cover: string; accent: string; ink: string; skillIcon: typeof BracesIcon; play: string; hover: string }
> = {
  "structured-extraction": {
    cover: "bg-[#E7EDF9]",
    accent: "bg-orange",
    ink: "text-navy",
    skillIcon: BracesIcon,
    play: "bg-navy text-white hover:bg-navy-deep",
    hover: "hover:border-navy/40",
  },
  "following-rules": {
    cover: "bg-[#E4F5EE]",
    accent: "bg-mint",
    ink: "text-mint-deep",
    skillIcon: ShieldIcon,
    play: "bg-mint-deep text-white hover:bg-[#175244]",
    hover: "hover:border-mint-deep/40",
  },
  "rewrite-without-losing-meaning": {
    cover: "bg-[#FCE9E6]",
    accent: "bg-coral",
    ink: "text-coral-deep",
    skillIcon: ScissorsIcon,
    play: "bg-coral-deep text-white hover:bg-[#8A302C]",
    hover: "hover:border-coral-deep/40",
  },
};

function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  const label = level === 1 ? "Gentle" : level === 2 ? "Steady" : "Tricky";
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Difficulty: ${label}, ${level} of 3`}>
      <span aria-hidden="true" className="flex items-end gap-1">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`w-[5px] rounded-full ${step <= level ? "bg-ink/70" : "bg-ink/15"}`}
            style={{ height: 5 + step * 3 }}
          />
        ))}
      </span>
      <span className="text-[12px] font-bold text-subtle">{label}</span>
    </span>
  );
}

export function ChallengeCard({ pack }: { pack: Pack }) {
  const tone = TONE[pack.id] ?? TONE["structured-extraction"];
  const SkillIcon = tone.skillIcon;

  return (
    <SpotlightCard
      role="article"
      aria-labelledby={`pack-${pack.id}`}
      className={`paper-card flex flex-col border transition duration-300 hover:-translate-y-1 hover:shadow-lift ${tone.hover}`}
    >
      <div className={`relative overflow-hidden rounded-t-card ${tone.cover} px-4 pt-4`}>
        <span aria-hidden="true" className={`absolute left-0 top-0 h-full w-1.5 ${tone.accent}`} />
        {pack.flagship ? (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-extrabold text-navy shadow-sm">
            Start here
          </span>
        ) : null}
        <PackArt
          id={pack.id}
          className="h-[132px] w-full transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1.5deg] group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col rounded-b-card bg-paper px-5 pb-5 pt-4">
        <div className="flex items-center gap-2.5">
          <span className={`grid h-7 w-7 place-items-center rounded-lg bg-white/80 ${tone.ink}`}>
            <SkillIcon size={16} />
          </span>
          <span className="text-[12.5px] font-extrabold text-subtle">{pack.skill}</span>
          <span aria-hidden="true" className="text-line">
            /
          </span>
          <Difficulty level={pack.difficulty} />
        </div>

        <h3 id={`pack-${pack.id}`} className="mt-2.5 font-display text-[21px] font-extrabold leading-[1.15] tracking-tight">
          {pack.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-snug text-subtle">{pack.tagline}</p>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href={`/workspace/${pack.id}`}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-extrabold transition active:translate-y-px ${tone.play}`}
          >
            Play
            <ArrowIcon size={16} />
          </Link>
          <span className="text-[12px] font-bold text-subtle">{pack.caseCount} hidden cases</span>
        </div>
      </div>
    </SpotlightCard>
  );
}
