# Prompt Gym — demo script (target 2:45, hard limit under 3:00)

**Live URL:** https://prompt-gym-three.vercel.app

**Runtime target:** 2:45. The official rules require a video under three minutes; do not let the recording reach 3:00.

**Setup before recording**
- Browser at 1440×900, 100% zoom, clean profile, one tab.
- Copy the P5 prompt below to the clipboard. Paste it on camera; do not pretend to type it.
- Keep a second attempt ready: the only change is the last line (P7).
- Close DevTools and any tab that shows the repository or `.env` files.
- If the provider fails, show the real error and Retry. Do not switch to a recorded result.
- Wait about 30 seconds after any recent run. The shared free key has an 8,000-token-per-minute window; a burst can leave a case unresolved even though the prompt is fine.

---

## 0:00–0:20 — What this is

Open the landing page.

> "Most people write a prompt, get one answer, and assume it works. Prompt Gym makes that assumption testable. You write a prompt once, and it runs against six hidden cases. You get a score, a reason for every case, and — the part that matters — a warning when fixing one thing breaks another."

Point at the three packs; say Structured Extraction is the flagship.

## 0:20–0:40 — The task is legible before you start

Click **Structured Extraction**.

> "The objective, six criteria and guidance are on screen before the first run. No prompt-engineering knowledge required. The cases are hidden; the rules are not."

Point at C1–C6 and the split: criteria that are rule-based, one that needs a constrained judge. Mention the **Production cases** badge.

## 0:40–1:20 — First real run

Paste P5 into the editor and press **Run tests**.

> "Each case is a real model call. Results stream in as they resolve — no fake progress bar."

Let one or two cases land, then the score appears: **6/6**.

> "Six of six. C1–C4 and C6 were decided by rules, not a model's opinion. C5 used a constrained judge that sees the criterion and the answer, but never my prompt."

Open one **Raw model response**. Point out the pass line and the decision trail.

## 1:20–2:05 — The signature moment

Change **one line**: replace

> “If a message contains more than one request, return a JSON array with one object per request.”

with

> “If a message contains more than one request, merge the requests into a single object.”

Press **Run tests**.

> "Same model. Same settings. Same cases. One line changed."

Score returns **5/6**. The regressed case is highlighted differently from an ordinary failure.

> "This is observed, not inferred: the request-count check passed before and fails now, and here is the response that merged two customers' requests into one object."

Point at the two regions:

> "The observation is the fact. The explanation is labelled a hypothesis, with its confidence and the evidence behind it. If more than one case changed, the app refuses to name a cause — it won't turn a guess into a finding."

Show **−1 vs previous attempt** and **Best: attempt 1**.

## 2:05–2:30 — It teaches, and it leaves with you

Scroll to **What this attempt shows** (derived from criteria actually tested) and **Attempt history**.

Click **Download Markdown**, open the file.

> "The report contains my final prompt, every case result, the attempt history and the lesson. It does not contain the hidden inputs — the browser never received them. Hidden fixtures and the API key live only on the server."

## 2:30–2:45 — Close

> "Prompt Gym is a practice loop, not a chatbot: real evaluations, deterministic verdicts where they're possible, uncertainty treated as its own state, and a regression you can explain. Try it at prompt-gym-three.vercel.app."

---

## Prompts used

### P5 — 6/6

```text
Return a single JSON object with exactly these four fields: order_id (string or null), reason (string), amount_usd (number or null), wants_replacement (boolean).
Use null for any value the message does not state. Never guess an order number or amount.
Output only the JSON object: no prose, no code fences.
If a message contains more than one request, return a JSON array with one object per request.
When a message mentions more than one amount, amount_usd must be the refund the customer asks for, not a fee.
```

### P7 — 5/6, one genuine regression

Same as P5, except the fourth line becomes:

```text
If a message contains more than one request, merge the requests into a single object.
```

**Reverified on 2026-10-19 against production fixtures:** P5 = 6/6; P7 = 5/6; the only changed case was `prod-5` ("Two separate requests"), pass → fail; the panel showed the observation, a moderate-confidence hypothesis and a −1 delta. The same pair was measured on 2026-10-18 against the deployed build.

## Do not do

- Do not present the Playwright stub run as a live result.
- Do not claim the production set is in the public repository; it is injected as a sensitive environment variable.
- Do not hide a provider failure; the error state and Retry are part of the product.
