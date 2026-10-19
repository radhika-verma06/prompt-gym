"use client";

import { useState } from "react";
import type { Pack } from "@/lib/packs/types";
import type { Attempt } from "@/lib/types";
import type { Lesson } from "@/lib/lesson";
import { buildMarkdown } from "@/lib/export/markdown";
import { buildJson, exportFilename } from "@/lib/export/json";
import { CopyIcon, DownloadIcon } from "@/components/ui/icons";

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ExportMenu({ pack, attempts, lesson }: { pack: Pack; attempts: Attempt[]; lesson: Lesson }) {
  const [copied, setCopied] = useState<"markdown" | "json" | null>(null);
  const disabled = attempts.length === 0;

  const markdown = () => buildMarkdown(pack, attempts, lesson);
  const json = () => JSON.stringify(buildJson(pack, attempts, lesson), null, 2);

  const copy = async (kind: "markdown" | "json") => {
    try {
      await navigator.clipboard.writeText(kind === "markdown" ? markdown() : json());
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className="paper-card p-4" aria-labelledby="export-heading">
      <div className="flex items-center gap-2">
        <h2 id="export-heading" className="font-display text-[16px] font-extrabold">
          Take it with you
        </h2>
        <span className="ml-auto text-[10.5px] font-bold text-subtle">No hidden inputs</span>
      </div>
      <p className="mt-1 text-[11.5px] leading-snug text-subtle">
        {disabled
          ? "Run once to export a report."
          : "Prompt, every case result, the history and the lesson."}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => download(exportFilename(pack, "md"), markdown(), "text/markdown;charset=utf-8")}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-2 text-[12px] font-extrabold text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-subtle"
        >
          <DownloadIcon size={14} />
          Download Markdown
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => download(exportFilename(pack, "json"), json(), "application/json")}
          className="inline-flex items-center gap-1.5 rounded-full border border-navy px-3 py-2 text-[12px] font-extrabold text-navy transition hover:bg-navy-soft disabled:cursor-not-allowed disabled:border-line disabled:text-subtle"
        >
          <DownloadIcon size={14} />
          Download JSON
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => copy("markdown")}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-[12px] font-extrabold text-subtle transition hover:border-navy hover:text-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CopyIcon size={14} />
          {copied === "markdown" ? "Copied" : "Copy Markdown"}
        </button>
      </div>
    </section>
  );
}
