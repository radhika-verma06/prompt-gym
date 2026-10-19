import { assertSixCriteria, type Pack } from "./types";

export const followingRules: Pack = assertSixCriteria({
  id: "following-rules",
  name: "Following Rules",
  tagline: "Handle real customer requests while obeying policy, including the ones you must refuse or escalate.",
  objective:
    "Draft a reply to each customer message while obeying the policy stated with the message. Refuse what policy forbids, escalate what needs approval, and never promise something the policy doesn't allow. Keep the reply under 120 words.",
  skill: "instruction boundaries",
  difficulty: 3,
  flagship: false,
  caseCount: 6,
  criteria: [
    {
      id: "R1",
      label: "Reply stays inside the length limit",
      detail: "At most 120 words. Longer replies fail regardless of how correct the policy handling is.",
      tier: "A",
    },
    {
      id: "R2",
      label: "Never promises something policy forbids",
      detail: "No commitment to a refund, exception, replacement or credit that the stated policy does not permit.",
      tier: "A",
    },
    {
      id: "R3",
      label: "Escalates what needs approval",
      detail: "When the policy requires a human decision, the reply says it is being escalated instead of deciding on the spot.",
      tier: "A",
    },
    {
      id: "R4",
      label: "No invented policy figures",
      detail: "Every amount, timeframe or number in the reply comes from the stated policy or the customer's message.",
      tier: "A",
    },
    {
      id: "R5",
      label: "Addresses the actual request",
      detail: "The reply responds to what the customer asked, rather than answering a different or easier question.",
      tier: "B",
    },
    {
      id: "R6",
      label: "States a clear outcome",
      detail: "The customer can tell what happens next: approved, declined, or escalated.",
      tier: "A",
    },
  ],
  guidance:
    "The hard part isn't politeness, it's precedence. Policy outranks the customer's framing, and a friendly promise you weren't allowed to make is still a failure. A strong prompt states the decision order explicitly: what you may decide, what you must escalate, and what you must never promise. Keep the reply short.",
  starterPrompt: [
    "Draft a reply to the customer message in under 120 words.",
    "Follow the policy included with the message. Do not promise anything the policy does not allow.",
    "State the outcome in the first sentence.",
  ].join("\n"),
});
