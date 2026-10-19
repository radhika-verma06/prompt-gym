import { BracesIcon, LoopIcon, TargetIcon } from "@/components/ui/icons";

const STEPS = [
  {
    icon: BracesIcon,
    title: "Write one prompt",
    line: "A short instruction is enough to start.",
    tone: "bg-navy-soft text-navy",
  },
  {
    icon: TargetIcon,
    title: "Six cases push back",
    line: "Hidden inputs, live model, no peeking.",
    tone: "bg-orange-soft text-orange-deep",
  },
  {
    icon: LoopIcon,
    title: "Fix one thing",
    line: "Watch what your edit fixes and breaks.",
    tone: "bg-mint-soft text-mint-deep",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-[26px] font-extrabold tracking-tight sm:text-[30px]">How a run works</h2>
        <p className="text-[13.5px] text-subtle">Three moves. About a minute per attempt.</p>
      </div>

      <ol className="relative mt-5 grid gap-3 sm:grid-cols-3">
        <span
          aria-hidden="true"
          className="absolute left-[12%] right-[12%] top-[38px] hidden border-t-2 border-dashed border-line sm:block"
        />
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative rounded-3xl border border-line bg-paper/80 px-5 py-4">
              <span className={`grid h-10 w-10 place-items-center rounded-2xl ${step.tone}`}>
                <Icon size={20} />
              </span>
              <h3 className="mt-2.5 font-display text-[17px] font-extrabold leading-tight">{step.title}</h3>
              <p className="mt-0.5 text-[13px] leading-snug text-subtle">{step.line}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
