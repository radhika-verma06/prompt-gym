"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon, CheckIcon, CloseIcon, CrossIcon, LoopIcon } from "@/components/ui/icons";

const KEY = "prompt-gym:intro-seen";
const MINI = ["JSON", "Fields", "Missing", "Amount", "Two orders", "Two asks"];

export function FirstRunIntro() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [flipped, setFlipped] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "1") return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Storage unavailable: the tour simply appears again next visit.
    }
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previousFocus?.focus?.();
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-deep/35 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        tabIndex={-1}
        className="paper-card relative w-full max-w-[560px] animate-rise-in overflow-hidden outline-none"
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="text-[12.5px] font-extrabold text-subtle">First time? Try it in three taps.</span>
          <div className="ml-auto flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${index === step ? "w-5 bg-navy" : "w-1.5 bg-line"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close introduction"
            className="ml-1 grid h-8 w-8 place-items-center rounded-full text-subtle transition hover:bg-canvas hover:text-ink"
          >
            <CloseIcon size={17} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          {step === 0 ? (
            <div>
              <h2 id="intro-title" className="font-display text-[26px] font-extrabold leading-tight tracking-tight">
                One prompt goes in.
              </h2>
              <p className="mt-1.5 text-[14px] text-subtle">You write the instruction. Nothing else to set up.</p>
              <div className="mt-4 rounded-2xl border border-line bg-canvas/70 p-3 font-mono text-[12px] leading-relaxed text-ink">
                <p className="text-subtle">your prompt</p>
                <p>Turn each message into JSON.</p>
                <p>Name the four fields.</p>
                <p className="text-orange-deep">Say what to do when a value is missing.</p>
              </div>
            </div>
          ) : step === 1 ? (
            <div>
              <h2 id="intro-title" className="font-display text-[26px] font-extrabold leading-tight tracking-tight">
                Six cases push back.
              </h2>
              <p className="mt-1.5 text-[14px] text-subtle">Tap a case to see what it checked.</p>
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {MINI.map((name, index) => {
                  const pass = index !== 3;
                  const revealed = flipped === index;
                  return (
                    <li key={name}>
                      <button
                        type="button"
                        onClick={() => setFlipped(revealed ? null : index)}
                        aria-pressed={revealed}
                        className={`flex w-full flex-col items-start gap-1 rounded-2xl border p-2 text-left transition ${
                          revealed
                            ? pass
                              ? "border-mint-deep/50 bg-mint-soft"
                              : "border-coral-deep/50 bg-coral-soft"
                            : "border-line bg-white hover:-translate-y-0.5 hover:shadow-tile"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`grid h-5 w-5 place-items-center rounded-full ${
                            pass ? "bg-mint text-[#0E3A2F]" : "bg-coral text-[#4A100B]"
                          }`}
                        >
                          {pass ? <CheckIcon size={12} /> : <CrossIcon size={12} />}
                        </span>
                        <span className="text-[11px] font-extrabold leading-tight">{name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2.5 min-h-[20px] text-[12.5px] text-subtle" aria-live="polite">
                {flipped === null
                  ? "Six tiles, six behaviours. Pass and fail are both useful."
                  : flipped === 3
                    ? "It grabbed the delivery fee. The refund amount was the one that mattered."
                    : "This case held. The prompt still has to hold under an edit."}
              </p>
            </div>
          ) : (
            <div>
              <h2 id="intro-title" className="font-display text-[26px] font-extrabold leading-tight tracking-tight">
                Every fix has a price.
              </h2>
              <p className="mt-1.5 text-[14px] text-subtle">
                Change one rule, and another case can flip. That is the lesson.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 rounded-2xl border border-line bg-white p-3 text-center">
                  <p className="text-[11.5px] font-extrabold text-subtle">Before</p>
                  <p className="metric font-display text-[26px] font-extrabold text-mint-deep">6/6</p>
                </div>
                <ArrowIcon size={18} className="text-subtle" />
                <div className="flex-1 rounded-2xl border border-[#EBC58C] bg-orange-soft p-3 text-center">
                  <p className="text-[11.5px] font-extrabold text-subtle">After</p>
                  <p className="metric font-display text-[26px] font-extrabold text-[#8A5212]">5/6</p>
                </div>
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] text-[#7A4A10]">
                <LoopIcon size={15} className="mt-0.5 shrink-0" />
                Two requests regressed. The app will show you the edit behind it.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-canvas/40 px-5 py-3">
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-2 text-[12.5px] font-bold text-subtle underline-offset-4 hover:underline"
          >
            Skip
          </button>
          <div className="ml-auto flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((value) => value - 1)}
                className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-extrabold text-navy transition hover:border-navy"
              >
                Back
              </button>
            ) : null}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((value) => value + 1)}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-navy-deep"
              >
                Next
                <ArrowIcon size={15} />
              </button>
            ) : (
              <Link
                href="/workspace/structured-extraction"
                onClick={close}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-navy-deep"
              >
                Start with Structured Extraction
                <ArrowIcon size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
