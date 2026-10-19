"use client";

import { useState } from "react";
import { ArrowIcon, RefreshIcon, SparkIcon } from "@/components/ui/icons";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  running: boolean;
  /** Why Run is unavailable, shown next to the button. */
  disabledReason: string | null;
  maxLength: number;
  attemptNumber: number;
  starterPrompt: string;
  /** True once this pack has at least one recorded attempt. */
  hasRun: boolean;
  /** The prompt used by the most recent attempt, to label a repeat run honestly. */
  lastPrompt?: string;
};

export function PromptEditor({
  value,
  onChange,
  onRun,
  running,
  disabledReason,
  maxLength,
  attemptNumber,
  starterPrompt,
  hasRun,
  lastPrompt,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const disabled = running || disabledReason !== null;
  const trimmedLength = value.trim().length;
  const isRepeat = hasRun && lastPrompt !== undefined && value.trim() === lastPrompt.trim();
  const label = running ? "Running six cases…" : isRepeat ? "Run again" : "Run tests";

  const loadStarter = () => {
    if (value.trim().length > 0) {
      setConfirming(true);
      return;
    }
    onChange(starterPrompt);
  };

  return (
    <section className="paper-card p-4 sm:p-5" aria-labelledby="editor-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="editor-heading" className="font-display text-[18px] font-extrabold leading-tight">
          Your prompt
        </h2>
        <span className="text-[11.5px] font-bold text-subtle">
          Attempt {attemptNumber}, {trimmedLength.toLocaleString("en-US")} of {maxLength.toLocaleString("en-US")} characters
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={loadStarter}
          className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-extrabold text-navy transition hover:border-navy"
        >
          <SparkIcon size={13} className="text-orange-deep" />
          Starter prompt
        </button>
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full px-2 py-1 text-[11.5px] font-bold text-subtle transition hover:bg-canvas hover:text-ink"
          >
            Clear
          </button>
        ) : null}
        <span className="ml-auto hidden items-center gap-1 text-[11px] text-subtle sm:flex">
          <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-bold">⌘</kbd>
          <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-bold">↵</kbd>
          to run
        </span>
      </div>

      {confirming ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-[#EBC58C] bg-orange-soft px-2.5 py-2 text-[12px]">
          <span className="font-bold text-[#7A4A10]">Replace what you have written?</span>
          <button
            type="button"
            onClick={() => {
              onChange(starterPrompt);
              setConfirming(false);
            }}
            className="rounded-full bg-navy px-2.5 py-1 text-[11.5px] font-extrabold text-white"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-extrabold text-navy"
          >
            Keep mine
          </button>
        </div>
      ) : null}

      <label htmlFor="prompt" className="sr-only">
        Prompt to test
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && !disabled) {
            event.preventDefault();
            onRun();
          }
        }}
        maxLength={maxLength}
        spellCheck={false}
        aria-describedby="run-disabled-reason"
        placeholder={"Write the instruction you want to test. It will be scored on all six cases at once."}
        className="prompt-scroll mt-2 min-h-[230px] w-full resize-y rounded-2xl border border-line bg-[#FFFCF6] p-3.5 font-mono text-[13px] leading-relaxed shadow-inner outline-none transition focus:border-navy"
      />

      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-canvas" aria-hidden="true">
        <span
          className={`block h-full rounded-full transition-all duration-300 ${
            trimmedLength >= 40 ? "bg-mint" : "bg-orange"
          }`}
          style={{ width: `${Math.min(100, (trimmedLength / 40) * 100)}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          data-testid="run-button"
          onClick={onRun}
          disabled={disabled}
          aria-disabled={disabled}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-extrabold transition ${
            disabled
              ? "cursor-not-allowed bg-line text-subtle"
              : "bg-navy text-white shadow-lift hover:bg-navy-deep active:translate-y-px"
          }`}
        >
          {running ? (
            <>
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              {label}
            </>
          ) : (
            <>
              {isRepeat ? <RefreshIcon size={16} /> : <ArrowIcon size={16} />}
              {label}
            </>
          )}
        </button>

        <p id="run-disabled-reason" className="max-w-[34ch] text-[11.5px] leading-snug text-subtle">
          {running
            ? "Tiles flip as each case resolves. This run cannot be started twice."
            : (disabledReason ?? (isRepeat ? "Same instruction, fresh run. Variation is labelled, not counted as progress." : "Six hidden cases see this exact prompt."))}
        </p>
      </div>
    </section>
  );
}
