import Link from "next/link";
import { ChallengeCard } from "@/components/landing/ChallengeCard";
import { FirstRunIntro } from "@/components/landing/FirstRunIntro";
import { HeroBoard } from "@/components/landing/HeroBoard";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { packs } from "@/lib/packs";
import { ArrowIcon, CheckIcon, LockIcon, SparkIcon } from "@/components/ui/icons";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-7">
        <section className="grain relative grid items-center gap-8 py-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12 lg:py-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-[12.5px] font-extrabold text-navy">
              <SparkIcon size={15} className="text-orange-deep" />
              Practice ground for prompt writers
            </p>

            <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-[54px] lg:text-[60px]">
              Your prompt looks fine.{" "}
              <br />
              Six hidden cases{" "}
              <span className="relative inline-block text-navy">
                disagree
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 16"
                  className="absolute -bottom-1 left-0 w-full text-orange"
                  fill="none"
                >
                  <path
                    d="M4 11c38-7 84-9 212-5"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="underline-stroke"
                    pathLength="320"
                  />
                </svg>
              </span>
              .
            </h1>

            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-subtle">
              Write one instruction. Run it against cases you cannot see. Then find out what broke, and what your fix
              broke next.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/workspace/structured-extraction"
                className="group inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3.5 text-[15px] font-extrabold text-white shadow-lift transition hover:bg-navy-deep active:translate-y-px"
              >
                Play the flagship challenge
                <ArrowIcon size={18} className="transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3.5 text-[15px] font-extrabold text-navy transition hover:border-navy"
              >
                How it works
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-bold text-subtle">
              <li className="flex items-center gap-1.5">
                <CheckIcon size={15} className="text-mint-deep" />
                Real model runs
              </li>
              <li className="flex items-center gap-1.5">
                <LockIcon size={15} className="text-navy" />
                Inputs stay hidden
              </li>
              <li className="flex items-center gap-1.5">
                <SparkIcon size={15} className="text-orange-deep" />
                No sign-up
              </li>
            </ul>
          </div>

          <HeroBoard />
        </section>

        <section id="challenges" className="scroll-mt-24 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-[26px] font-extrabold tracking-tight sm:text-[30px]">
                Choose a challenge
              </h2>
              <p className="mt-1 text-[14px] text-subtle">Each one trains a different reflex. Start with the flagship.</p>
            </div>
            <span className="rounded-full bg-paper px-3 py-1.5 text-[12px] font-extrabold text-navy">
              3 challenges, 6 hidden cases each
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {packs.map((pack) => (
              <ChallengeCard key={pack.id} pack={pack} />
            ))}
          </div>
        </section>

        <div className="mt-12">
          <HowItWorks />
        </div>

        <section className="grain relative mt-12 overflow-hidden rounded-[28px] border border-navy/15 bg-navy px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="max-w-[22ch] font-display text-[28px] font-extrabold leading-tight tracking-tight sm:text-[34px]">
                Stop guessing. Find the case that breaks it.
              </h2>
              <p className="mt-2 max-w-[48ch] text-[14px] text-white/75">
                The first run takes about a minute. Your prompt stays in the tab, and every score comes from the model.
              </p>
            </div>
            <Link
              href="/workspace/structured-extraction"
              className="group inline-flex items-center gap-2 rounded-full bg-orange px-5 py-3.5 text-[15px] font-extrabold text-[#3A2406] transition hover:bg-[#FFB463] active:translate-y-px"
            >
              Open the arena
              <ArrowIcon size={18} className="transition group-hover:translate-x-0.5" />
            </Link>
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 400 200"
            className="pointer-events-none absolute -right-10 -top-10 hidden h-[110%] opacity-20 sm:block"
            fill="none"
          >
            <circle cx="200" cy="100" r="60" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="100" r="96" stroke="white" strokeWidth="2" strokeDasharray="6 8" />
            <circle cx="296" cy="100" r="7" fill="#F49B42" />
            <circle cx="104" cy="100" r="5" fill="#56C3A4" />
          </svg>
        </section>

        <footer className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5 text-[12.5px] text-subtle">
          <span className="font-extrabold text-ink">Prompt Gym</span>
          <span>Practice, not theory.</span>
          <span className="ml-auto">Every result comes from a real model run.</span>
        </footer>
      </main>

      <FirstRunIntro />
    </>
  );
}
