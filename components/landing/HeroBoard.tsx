"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, CrossIcon, LoopIcon } from "@/components/ui/icons";
import { Tally } from "@/components/ui/Tally";

/**
 * A deliberately labelled illustration of the arena. The states are fixed demo data,
 * not evaluation output: the note under the board says so, and the real workspace
 * never shows a result the model didn't produce.
 */
const DEMO = [
  { id: "json", name: "Clean JSON", state: "pass", note: "Parsed as one object with nothing wrapped around it." },
  { id: "fields", name: "Exact fields", state: "pass", note: "All four keys were present, and none were extra." },
  { id: "missing", name: "Missing value", state: "pass", note: "The absent amount came back unknown instead of invented." },
  { id: "amount", name: "Amount kept", state: "fail", note: "The reply picked the delivery fee instead of the refund amount." },
  { id: "ambiguous", name: "Two orders", state: "pass", note: "It said which order it could not resolve rather than guessing." },
  { id: "two-asks", name: "Two requests", state: "pass", note: "Both requests were captured in separate objects." },
] as const;

export function HeroBoard() {
  const [selected, setSelected] = useState(3);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSelected((current) => (current + 1) % DEMO.length), 2400);
    return () => window.clearInterval(timer);
  }, [paused]);

  const current = DEMO[selected];
  const passed = useMemo(() => DEMO.filter((item) => item.state === "pass").length, []);
  const ratio = passed / DEMO.length;
  const circumference = 2 * Math.PI * 26;

  return (
    <div className="relative">
      <div className="absolute -left-3 -top-4 z-10 hidden rotate-[-7deg] rounded-full bg-orange px-3 py-1 text-[12px] font-extrabold text-[#3A2406] shadow-tile sm:block">
        Six cases, one prompt
      </div>

      <div className="paper-card grain overflow-hidden p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center">
            <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#EDE6D8" strokeWidth="7" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#56C3A4"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - ratio)}
                className="score-ring"
              />
            </svg>
            <span className="metric absolute text-[15px] font-extrabold">
              <Tally value={passed} />/{DEMO.length}
            </span>
          </div>
          <div>
            <p className="font-display text-[17px] font-extrabold leading-tight">The arena</p>
            <p className="text-[13px] text-subtle">Tap a case to see what it caught.</p>
          </div>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="ml-auto rounded-full border border-line px-3 py-1.5 text-[12px] font-extrabold text-subtle transition hover:border-navy hover:text-navy"
            aria-pressed={paused}
          >
            {paused ? "Play" : "Pause"}
          </button>
        </div>

        <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Demo case results">
          {DEMO.map((item, index) => {
            const active = index === selected;
            const pass = item.state === "pass";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(index);
                    setPaused(true);
                  }}
                  aria-pressed={active}
                  className={`group flex w-full flex-col items-start gap-1.5 rounded-2xl border p-2.5 text-left transition duration-200 ${
                    active
                      ? pass
                        ? "border-mint-deep/40 bg-mint-soft shadow-tile"
                        : "border-coral-deep/40 bg-coral-soft shadow-tile"
                      : "border-line bg-white/70 hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-tile"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-6 w-6 place-items-center rounded-full ${
                      pass ? "bg-mint text-[#0E3A2F]" : "bg-coral text-[#4A100B]"
                    }`}
                  >
                    {pass ? <CheckIcon size={14} /> : <CrossIcon size={14} />}
                  </span>
                  <span className="text-[11.5px] font-extrabold leading-tight text-ink">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex min-h-[52px] items-start gap-2 rounded-2xl bg-canvas/80 px-3 py-2.5" aria-live="polite">
          <span
            aria-hidden="true"
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
              current.state === "pass" ? "bg-mint text-[#0E3A2F]" : "bg-coral text-[#4A100B]"
            }`}
          >
            {current.state === "pass" ? <CheckIcon size={12} /> : <CrossIcon size={12} />}
          </span>
          <p className="text-[12.5px] leading-snug text-ink">
            <span className="font-extrabold">{current.name}: </span>
            {current.note}
          </p>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-subtle">
          <LoopIcon size={13} />
          Demo board. Real runs use hidden cases and a live model.
        </p>
      </div>
    </div>
  );
}
