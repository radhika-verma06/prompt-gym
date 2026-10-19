"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadAttempts, saveAttempts, MAX_ATTEMPTS } from "@/lib/attempts";
import { buildLesson } from "@/lib/lesson";
import type { Pack } from "@/lib/packs/types";
import { detectRegressions } from "@/lib/regression";
import { bestAttempt, summarise } from "@/lib/scoring";
import type { Attempt, CaseResult } from "@/lib/types";
import type { RunMeta } from "@/lib/run";
import { Arena } from "./Arena";
import { ExportMenu } from "./ExportMenu";
import { LearningSummary } from "./LearningSummary";
import { MissionCard } from "./MissionCard";
import { PromptDiff } from "./PromptDiff";
import { PromptEditor } from "./PromptEditor";
import { RegressionMoment } from "./RegressionMoment";
import { ScoreHistory } from "./ScoreHistory";
import { ScoreOrbit } from "./ScoreOrbit";
import { RefreshIcon } from "@/components/ui/icons";

type RunError = { message: string; code?: string; retryAfterSeconds?: number };

function sortResults(results: CaseResult[]): CaseResult[] {
  return [...results].sort((a, b) => a.caseId.localeCompare(b.caseId, "en", { numeric: true }));
}

export function Workspace({
  pack,
  promptMin,
  promptMax,
  fixtureSource,
  fixtureNote,
  configured,
}: {
  pack: Pack;
  promptMin: number;
  promptMax: number;
  fixtureSource: "production" | "sample";
  fixtureNote?: string;
  configured: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [running, setRunning] = useState(false);
  const [liveResults, setLiveResults] = useState<CaseResult[]>([]);
  const [error, setError] = useState<RunError | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const resultsRef = useRef<CaseResult[]>([]);
  const metaRef = useRef<RunMeta | null>(null);
  const startedAtRef = useRef<string>("");
  /** Captured at run start so an edit mid-run can't be recorded as the prompt that was tested. */
  const promptRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setAttempts(loadAttempts(pack.id));
    setHydrated(true);
  }, [pack.id]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const nextNumber = useMemo(() => (attempts.length === 0 ? 1 : Math.max(...attempts.map((a) => a.n)) + 1), [attempts]);

  const latest = attempts[attempts.length - 1];
  const previous = attempts[attempts.length - 2];

  const regression = useMemo(() => (latest && previous ? detectRegressions(previous, latest) : null), [latest, previous]);

  const regressedIds = useMemo(() => new Set(regression?.observations.map((o) => o.caseId) ?? []), [regression]);

  const lesson = useMemo(
    () => (latest ? buildLesson(pack, latest.results, previous?.results) : null),
    [pack, latest, previous],
  );

  const liveSummary = running ? summarise(liveResults) : null;

  const finish = useCallback(
    (results: CaseResult[], meta: RunMeta, complete: boolean) => {
      const summary = summarise(results);
      const attempt: Attempt = {
        n: nextNumber,
        prompt: promptRef.current,
        startedAt: startedAtRef.current || new Date().toISOString(),
        modelIds: meta.modelIds,
        settingsHash: meta.settingsHash,
        evaluationVersion: meta.evaluationVersion,
        fixtureSetId: meta.fixtureSetId,
        fixtureSource: meta.fixtureSource,
        results: sortResults(results),
        summary,
        complete: complete && summary.complete && results.length === meta.caseCount,
      };
      setAttempts((current) => {
        const next = [...current, attempt].slice(-MAX_ATTEMPTS);
        saveAttempts(pack.id, next);
        return next;
      });
    },
    [nextNumber, pack.id],
  );

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setLiveResults([]);
    resultsRef.current = [];
    metaRef.current = null;
    startedAtRef.current = new Date().toISOString();
    promptRef.current = prompt;

    const controller = new AbortController();
    abortRef.current = controller;

    const handle = (event: unknown) => {
      if (!event || typeof event !== "object") return;
      const typed = event as { type?: string; meta?: RunMeta; result?: CaseResult; complete?: boolean };
      if (typed.type === "meta" && typed.meta) {
        metaRef.current = typed.meta;
      } else if (typed.type === "case" && typed.result) {
        resultsRef.current = [...resultsRef.current, typed.result];
        setLiveResults(resultsRef.current);
      }
    };

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id, prompt }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string; code?: string; retryAfterSeconds?: number };
        } | null;
        setError({
          message: payload?.error?.message ?? "The run couldn't start. Your prompt is still here.",
          code: payload?.error?.code,
          retryAfterSeconds: payload?.error?.retryAfterSeconds,
        });
        return;
      }

      if (!response.body) {
        setError({ message: "This browser couldn't read the streamed results. Your prompt is still here." });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(line);
          } catch {
            continue;
          }
          handle(parsed);
        }
      }

      const meta = metaRef.current;
      if (meta) finish(resultsRef.current, meta, true);
      else setError({ message: "The run returned no evaluation metadata, so nothing was scored." });
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      // A local network failure after some cases resolved still keeps the evidence.
      if (metaRef.current && resultsRef.current.length > 0) {
        finish(resultsRef.current, metaRef.current, false);
      }
      setError({ message: "The connection dropped mid-run. Cases that didn't resolve weren't scored." });
    } finally {
      abortRef.current = null;
      setRunning(false);
    }
  }, [finish, pack.id, prompt, running]);

  const trimmed = prompt.trim();
  const disabledReason = !configured
    ? "Evaluation isn't configured on this deployment: no model API key is set."
    : trimmed.length === 0
      ? "Write a prompt before running. The editor is empty."
      : trimmed.length < promptMin
        ? `Write at least ${promptMin} characters so there's enough instruction to test.`
        : null;

  const displayed = latest ? latest.results : [];
  const bestNumber = bestAttempt(attempts)?.n;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start">
      {/* The editor comes first on a phone, so the run button is above the fold. */}
      <div className="space-y-3.5 lg:col-start-1 lg:row-start-1">
        <PromptEditor
          value={prompt}
          onChange={setPrompt}
          onRun={run}
          running={running}
          disabledReason={disabledReason}
          maxLength={promptMax}
          attemptNumber={nextNumber}
          starterPrompt={pack.starterPrompt}
          hasRun={Boolean(latest)}
          lastPrompt={latest?.prompt}
        />

        {error ? (
          <div role="alert" className="rounded-2xl border border-[#F2D3CD] bg-coral-soft p-3">
            <p className="text-[12.5px] font-extrabold text-coral-deep">This run didn&apos;t complete</p>
            <p className="mt-0.5 text-[12px] leading-snug text-[#7A3B3B]">{error.message}</p>
            <button
              type="button"
              onClick={run}
              disabled={running || disabledReason !== null}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-[12px] font-extrabold text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-subtle"
            >
              <RefreshIcon size={13} />
              Retry the run
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-extrabold">
          <span
            className={`rounded-full px-2 py-1 ${
              fixtureSource === "production" ? "bg-navy-soft text-navy" : "bg-orange-soft text-[#8A5212]"
            }`}
            title={fixtureNote}
          >
            {fixtureSource === "production" ? "Production cases" : "Sample cases"}
          </span>
          <span className="rounded-full bg-mint-soft px-2 py-1 text-mint-deep">
            {pack.criteria.filter((criterion) => criterion.tier === "A").length} rule checks
          </span>
          <span className="rounded-full bg-navy-soft px-2 py-1 text-navy">
            {pack.criteria.filter((criterion) => criterion.tier === "B").length} judged
          </span>
          {hydrated ? null : <span className="w-full text-subtle">Loading this session…</span>}
        </div>
      </div>

      <div className="space-y-3.5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <ScoreOrbit attempts={attempts} live={liveSummary} running={running} />

        <Arena
          results={running ? liveResults : displayed}
          running={running}
          liveCount={liveResults.length}
          regressedIds={running ? new Set() : regressedIds}
          attemptNumber={latest?.n}
        />

        {!running && regression && latest && previous ? (
          <RegressionMoment report={regression} previous={previous} current={latest} />
        ) : null}

        {!running && latest && previous ? <PromptDiff previous={previous} current={latest} /> : null}

        {latest && !running && lesson ? <LearningSummary lesson={lesson} /> : null}

        <ScoreHistory attempts={attempts} bestNumber={bestNumber} />
      </div>

      <div className="space-y-3.5 lg:col-start-1 lg:row-start-2">
        <MissionCard pack={pack} />
        <ExportMenu pack={pack} attempts={attempts} lesson={lesson ?? buildLesson(pack, [])} />
      </div>
    </div>
  );
}
