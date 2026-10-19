import Link from "next/link";
import { Wordmark } from "@/components/brand/PackArt";
import { ArrowIcon } from "@/components/ui/icons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5 sm:px-7">
        <Link href="/" className="flex items-center gap-2.5 rounded-xl py-1 pr-2 font-display text-[19px] font-extrabold tracking-tight">
          <Wordmark size={34} />
          Prompt Gym
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-[14px] font-bold text-subtle" aria-label="Main">
          <a href="#challenges" className="hidden rounded-lg px-3 py-2 hover:bg-paper hover:text-ink sm:block">
            Challenges
          </a>
          <a href="#how" className="hidden rounded-lg px-3 py-2 hover:bg-paper hover:text-ink sm:block">
            How it works
          </a>
          <Link
            href="/workspace/structured-extraction"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-[14px] font-extrabold text-white transition hover:bg-navy-deep active:translate-y-px"
          >
            Start playing
            <ArrowIcon size={17} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
