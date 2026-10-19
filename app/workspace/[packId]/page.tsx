import Link from "next/link";
import { notFound } from "next/navigation";
import { Workspace } from "@/components/workspace/Workspace";
import { Wordmark } from "@/components/brand/PackArt";
import { ArrowIcon } from "@/components/ui/icons";
import { loadFixtures } from "@/lib/fixtures/load";
import { LIMITS } from "@/lib/limits";
import { hasProviderKey } from "@/lib/model/client";
import { getPack } from "@/lib/packs";

/**
 * Server component. It resolves the pack and the fixture set, then hands the client
 * only what is safe: public metadata, the fixture *source*, and whether a key exists.
 * Case inputs never cross this boundary.
 */

export default async function WorkspacePage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = await params;
  const pack = getPack(packId);
  if (!pack) notFound();

  const fixtures = loadFixtures(packId);

  return (
    <main className="mx-auto max-w-[1240px] px-4 pb-14 pt-3 sm:px-6">
      <nav className="flex flex-wrap items-center gap-2.5" aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[12px] font-extrabold text-navy transition hover:border-navy"
        >
          <ArrowIcon size={14} className="rotate-180" />
          Challenges
        </Link>
        <span aria-hidden="true" className="text-line">
          /
        </span>
        <span className="text-[12.5px] font-bold text-subtle">{pack.skill}</span>
        <Link href="/" className="ml-auto hidden items-center gap-2 sm:flex" aria-label="Prompt Gym home">
          <Wordmark size={26} />
          <span className="font-display text-[14px] font-extrabold">Prompt Gym</span>
        </Link>
      </nav>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[28px] font-extrabold leading-none tracking-tight sm:text-[34px]">
              {pack.name}
            </h1>
            {pack.flagship ? (
              <span className="rounded-full bg-orange px-2.5 py-1 text-[10.5px] font-extrabold text-[#3A2406]">
                Flagship
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 max-w-[64ch] text-[13px] leading-snug text-subtle">{pack.tagline}</p>
        </div>
        <p className="text-[11.5px] font-bold text-subtle">6 hidden cases, live model</p>
      </header>

      <div className="mt-4">
        <Workspace
          pack={pack}
          promptMin={LIMITS.promptMin}
          promptMax={LIMITS.promptMax}
          fixtureSource={fixtures.source}
          fixtureNote={fixtures.reason}
          configured={hasProviderKey()}
        />
      </div>

      <footer className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-[11.5px] text-subtle">
        <span>Results come from real model runs with frozen settings.</span>
        <span className="text-line" aria-hidden="true">
          /
        </span>
        <span>The model never sees the other cases, and your prompt is not stored on the server.</span>
      </footer>
    </main>
  );
}
