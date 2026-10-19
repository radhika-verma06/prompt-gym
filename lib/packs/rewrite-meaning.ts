import { assertSixCriteria, type Pack } from "./types";

export const rewriteMeaning: Pack = assertSixCriteria({
  id: "rewrite-without-losing-meaning",
  name: "Rewrite Without Losing Meaning",
  tagline: "Make text shorter or simpler without dropping a single fact that matters.",
  objective:
    "Rewrite each message so it is at most 45 words and easier to read while keeping every fact, number and condition, and without adding anything that wasn't there.",
  skill: "constraint control",
  difficulty: 2,
  flagship: false,
  caseCount: 6,
  criteria: [
    {
      id: "W1",
      label: "At most 45 words",
      detail: "The rewrite is within the word limit. Over the limit fails.",
      tier: "A",
    },
    {
      id: "W2",
      label: "Every essential fact retained",
      detail: "All the details the message depends on, including numbers, dates, conditions and named items, still appear.",
      tier: "A",
    },
    {
      id: "W3",
      label: "No new figures introduced",
      detail: "Every number in the rewrite appears in the original. A figure the source never gave is a fail.",
      tier: "A",
    },
    {
      id: "W4",
      label: "Meaning isn't reversed",
      detail: "Negations and conditions keep their direction: a 'not eligible' doesn't become 'eligible'.",
      tier: "A",
    },
    {
      id: "W5",
      label: "Stays one readable paragraph",
      detail: "One paragraph of plain prose. No bullet lists, headings or tables standing in for the rewrite.",
      tier: "A",
    },
    {
      id: "W6",
      label: "Tone still fits the original",
      detail: "The rewrite keeps the original's register: a formal notice doesn't become casual, or the reverse.",
      tier: "B",
    },
  ],
  guidance:
    "Shortening is easy; shortening without loss is the skill. A strong prompt separates what must survive (facts, numbers, conditions) from what may change (wording, order), and sets the limit as a hard constraint rather than a preference.",
  starterPrompt: [
    "Rewrite the message in at most 45 words as one paragraph of plain prose.",
    "Keep every fact, number and condition from the original.",
    "Do not add any information that is not in the original text.",
  ].join("\n"),
});
