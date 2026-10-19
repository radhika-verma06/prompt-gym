import type { CaseResult } from "@/lib/types";

/**
 * Line-level diff of two prompts. This describes what the user changed; it never
 * claims the change caused a result to move.
 */

export type DiffLine = {
  type: "same" | "add" | "remove";
  text: string;
};

function lines(prompt: string): string[] {
  const split = prompt.replace(/\r\n/g, "\n").split("\n");
  while (split.length > 0 && split[split.length - 1].trim() === "") split.pop();
  return split;
}

/** Longest common subsequence over lines, returned as an ordered diff. */
export function diffLines(previous: string, current: string): DiffLine[] {
  const a = lines(previous);
  const b = lines(current);
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ type: "same", text: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      result.push({ type: "remove", text: a[i] });
      i += 1;
    } else {
      result.push({ type: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) result.push({ type: "remove", text: a[i++] });
  while (j < b.length) result.push({ type: "add", text: b[j++] });

  return result;
}

export type CaseMove = { caseId: string; caseName: string };

export type CaseChanges = {
  /** Failed before, passes now. */
  fixed: CaseMove[];
  /** Passed before, fails now. */
  broken: CaseMove[];
  /** No comparable state for one of the attempts. */
  comparable: boolean;
};

export function caseChanges(previous: CaseResult[], current: CaseResult[]): CaseChanges {
  const before = new Map(previous.map((result) => [result.caseId, result]));
  const fixed: CaseMove[] = [];
  const broken: CaseMove[] = [];
  let comparable = previous.length > 0 && current.length > 0;

  for (const result of current) {
    const prior = before.get(result.caseId);
    if (!prior) {
      comparable = false;
      continue;
    }
    if (prior.state === "fail" && result.state === "pass") {
      fixed.push({ caseId: result.caseId, caseName: result.caseName });
    }
    if (prior.state === "pass" && result.state === "fail") {
      broken.push({ caseId: result.caseId, caseName: result.caseName });
    }
  }

  return { fixed, broken, comparable };
}
