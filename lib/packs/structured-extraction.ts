import { assertSixCriteria, type Pack } from "./types";

export const structuredExtraction: Pack = assertSixCriteria({
  id: "structured-extraction",
  name: "Structured Extraction",
  tagline: "Turn a messy customer message into strict JSON without inventing a value you weren't given.",
  objective:
    "Convert each incoming customer message into strict JSON with exactly four fields: order_id, reason, amount_usd and wants_replacement. If a value isn't present in the message, mark it unknown rather than guessing it.",
  skill: "output discipline",
  difficulty: 2,
  flagship: true,
  caseCount: 6,
  criteria: [
    {
      id: "C1",
      label: "Output always parses as valid JSON",
      detail: "The whole response parses as JSON and is a single object, with no prose and no code fences.",
      tier: "A",
    },
    {
      id: "C2",
      label: "Exactly the four required fields, correct types",
      detail:
        "Keys are exactly order_id, reason, amount_usd and wants_replacement, with string, string, number and boolean types (null allowed where a value is absent).",
      tier: "A",
    },
    {
      id: "C3",
      label: "Missing values marked unknown, never invented",
      detail: "When the message doesn't contain a value, the field is null or the word unknown, not a plausible-looking guess.",
      tier: "A",
    },
    {
      id: "C4",
      label: "Amounts preserved exactly, as numbers",
      detail: "The amount matches the figure that means the refund in that message, as a number, with no rounding or currency conversion.",
      tier: "A",
    },
    {
      id: "C5",
      label: "Ambiguous references handled without fabrication",
      detail: "When a message can't be resolved to one order, the response says so instead of inventing a resolution.",
      tier: "B",
    },
    {
      id: "C6",
      label: "Two requests in one message both captured",
      detail: "When a message contains two requests, both appear in the response; neither is dropped or merged.",
      tier: "A",
    },
  ],
  guidance:
    "A strong prompt defines the output shape, names the exact field names, and covers the part most people miss: what to do when a value is missing or when two numbers compete. It doesn't get longer than it needs to be; it covers the cases you can't see.",
  starterPrompt: [
    "Convert the customer message into one JSON object with exactly these keys: order_id (string), reason (string), amount_usd (number) and wants_replacement (boolean).",
    "Return the JSON object only. No prose and no code fences.",
  ].join("\n"),
});
