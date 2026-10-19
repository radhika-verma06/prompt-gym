---
doc: spec
status: approved
doc-status-note: Approved 2026-10-17 with five refinements — private fixtures kept out of the public repo, no forced JSON mode on the model under test, comparison compatibility gating, proportional redaction, and server-side API protection. Groq, Vercel, Next.js/TypeScript/Tailwind/Zod and sessionStorage all confirmed by the learner.
---

# Prompt Gym — Technical Spec

## How This Works, In Plain Language

Prompt Gym is a website with **two screens and one hidden worker**.

- The **landing page** shows three challenge packs. It's just a page — no accounts, nothing stored.
- The **workspace** is where the practice happens: your prompt on the left, the six case results on the right.
- The **worker** is a small piece of the app that runs on the server. It holds the six hidden test inputs and it's the only part that talks to the AI model. When you press **Run Tests**, the browser sends your prompt to the worker, the worker runs it against each hidden case, judges the result, and sends back only a description of what happened.

Three consequences of that shape matter more than anything else in this document:

1. **The hidden test inputs never reach your browser.** Not in the page, not in a network response, not in the developer tools. They physically can't be inspected, because they never leave the server. This is the structural answer to the leak question — it doesn't rely on us remembering to hide things.
2. **The production test fixtures aren't in the public repository either.** The repo ships the app, the challenge descriptions and a small set of *sample* fixtures so anyone can run it and reproduce results. The real fixtures are injected at deploy time from server-only configuration. A public repo must not be the place the answers live.
3. **No database and no accounts.** Your attempts live in the browser tab for the session and in the file you export. Close the tab and they're gone; that's the trade accepted for shipping in the time available.

The model is asked to do exactly two jobs: run your prompt against a case, and (only for the one criterion that can't be checked by rules) judge whether a response met it. Every other verdict is a deterministic check — parse the JSON, compare the field names, check the number — so the score doesn't wobble when the model has an off day.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. You open `/` → a static page renders three packs from public metadata in `lib/packs/`. Nothing dynamic, nothing fetched.
2. You pick Structured Extraction → `/workspace/structured-extraction` renders the objective, six criteria and example from that public metadata.
3. You write a prompt and press **Run Tests** → the browser `POST`s `{ packId, prompt }` to `/api/run`.
4. `/api/run` resolves the pack's **private fixture set** (deployment configuration, falling back to the shipped sample fixtures when it isn't configured), then for each of the six cases: builds the model input from your prompt plus that case's hidden input, calls the model with frozen settings — **no forced JSON mode** — and hands the raw response to the case's validator.
5. Tier A validators decide by rule. The single Tier B criterion sends the criterion, the input and the response to a judge model — never your prompt.
6. Before returning anything, the server runs the **echo-risk check**: if a response reproduces the hidden input or an acceptable answer, it's replaced with a withheld marker. Then each case returns `{ state, tier, observed, publicResponse }` — never the input, never the expected answer.
7. The browser streams cases into the list as they resolve (the route returns them progressively), updates the score, and compares this attempt against the stored previous attempt to flag a regression.
8. You edit, rerun, and the cycle repeats with the previous attempt still on screen. **Export** assembles Markdown or JSON from what the browser already has.

## Stack

Recommending this; happy to change any of it — see **Decisions and Open Issues** for what still needs your yes.

| Piece | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router), TypeScript** | One project for both screens *and* the server-side worker. A server route is not optional here — the API key and the hidden inputs must stay off the client — and this gets that for free with one `app/api/` file. |
| Styling | **Tailwind CSS** + a small set of shared components | Fast, and the PRD's restrained palette is easier to hold consistent with utility tokens than with hand-written CSS everywhere. |
| Validation schemas | **Zod** | The Tier A checks and the judge's JSON verdict both need shape validation. One small dependency used in two places. |
| Model client | **`openai` SDK, pointed at the provider's OpenAI-compatible base URL** | Works against Groq, OpenRouter and OpenAI unchanged, so switching provider later is an env var, not a rewrite. |
| Tests | **Vitest** (unit) + **Playwright** (one end-to-end pass) | Validators, scoring, regression and redaction need real assertions; a single browser test proves the loop actually runs. |
| Docs | [Next.js](https://nextjs.org/docs) · [Tailwind](https://tailwindcss.com/docs) · [Zod](https://zod.dev) · [openai-node](https://github.com/openai/openai-node) · [Vitest](https://vitest.dev) · [Playwright](https://playwright.dev/docs/intro) | |

**Deliberately not used on the model under test:** structured output / JSON mode. Forcing the API to return JSON would do the Structured Extraction challenge on the user's behalf — the whole point is whether *their prompt* produces valid JSON. Constraints belong in their prompt, not in the request. Structured output **is** used for the judge, where the goal is a reliably parseable verdict and nothing about the user's skill is being measured.

**Unverified, flagged to check first in the build:** exact current model IDs on the provider, whether structured-output/JSON mode is supported on the judge model, real latency, and the actual free-tier limits. The spec is written so a wrong guess costs one env var, not a re-architecture. The verification run happens before any model ID is committed to `settings.ts`.

## Where It Runs and How Someone Tries It

- **Runtime:** Node 20+. One server process; no background jobs, no cron, no queue.
- **Environment:** a single key, `GROQ_API_KEY`, in `.env.local` locally and in the host's env settings for the deployment. `.env.example` documents it with no value. The key is read **only** inside `app/api/run/route.ts` and `lib/model/client.ts` — never in a component.
- **Locally:** `npm install && npm run dev` → open `http://localhost:3000`. Set the key first or the run route returns a clear "no key configured" state rather than a crash.
- **For the demo recording:** the app runs entirely locally; record at desktop width, and keep one attempt's full trajectory on screen.
- **Deployment (Vercel):** push to GitHub, import the repo, set `GROQ_API_KEY`, and inject `PACK_FIXTURES_JSON` in the same dashboard so the production fixtures never enter the repository. The public URL lets a judge try it directly — welcome, but the submission still needs the demo video and the public repo.
- **Cost control:** per-IP limits and a shared daily budget protect the key (see **Public API Protection**). A browser-only cap is deliberately not relied on.

PRD ref: `prd.md > What We're Building` (deployment is in scope, not optional polish).

## Look and Feel

The interface is a learning game: a warm paper board, six physical-feeling cases, and a score that settles like a dial. It is not a dashboard, and it is not a chat window.

- **Palette:** canvas `#F6F0E4`, paper `#FFFDF8`, ink `#17233F`, navy `#23396B`, orange `#F49B42`, mint `#56C3A4`, coral `#EF6F62`, line `#E4DCCB`. Each pack owns one accent (navy/orange for extraction, mint for rules, coral for rewriting) so the three challenges are distinguishable before reading a word.
- **Typography:** Bricolage Grotesque for display and headlines, Nunito Sans for interface text, `ui-monospace` reserved for prompts, JSON and case identifiers. Body copy stays at 13px or above on mobile, with 16px for primary prose.
- **Density:** generous paper cards, one accent per surface, custom SVG scenes rather than stock illustration or emoji. Explanations are one sentence, with detail behind a disclosure.
- **Motion:** tiles flip in as each case resolves, the score ring re-settles when a run lands, and a regressed tile pulses once. Motion answers an action; it does not decorate idle pages. Everything collapses under `prefers-reduced-motion`.
- **Copy tone:** plain and precise. "The amount didn't match the refund in the message", never "your prompt could be clearer". No em dashes.
- **Explicitly not:** purple AI gradients, glow, glassmorphism, chatbot framing, dense tables, identical rounded-card grids, decorative controls.

See `DESIGN.md` for the interaction inventory and screenshot evidence.

## Components

### Public pack metadata — `lib/packs/`
Three packs, each with objective, difficulty, skill and six criteria (C1–C6). **No case inputs, no acceptable answers, no expected values.** This file is safe to publish and is what the landing page and workspace read.
PRD ref: `prd.md > Challenge packs`.

### Private fixtures — `lib/fixtures/` + deployment config
A fixture set is the six cases for one pack: hidden input, criterion IDs, validator spec and acceptable-answer definition. Fixture sets are **not committed**. They arrive as a JSON value in server-only configuration, are parsed and validated with Zod at startup, and are only ever read inside server code.

- `PACK_FIXTURES_JSON` — the production set, set in the Vercel dashboard (and in `.env.local` for local runs). Not prefixed `NEXT_PUBLIC_`, never read in a component. For local files, `PACK_FIXTURES_JSON_B64` is the safer form: Next expands `$NAME` in env values, which was measured corrupting a currency value such as `$12.34` into `.34`.
- `fixtures/sample/*.json` — a small, clearly labelled sample set committed for reproducibility, so a clone runs without secrets. The UI shows a **“sample fixtures”** badge whenever they're in use; it never pretends a sample set is the production one.
- Missing or invalid configuration → the app boots with sample fixtures and says so. It never silently ships an unlabelled placeholder.
PRD refs: `prd.md > Challenge packs`, `prd.md > Keeping the hidden tests hidden`.

### Run route — `app/api/run/route.ts`
The only server endpoint. Receives `{ packId, prompt }`, validates it, looks the pack up server-side, and executes the six cases with limited concurrency. Streams each case's result as it resolves. Never returns an input or an acceptable answer.
PRD refs: `prd.md > Test execution`, `prd.md > Keeping the hidden tests hidden`.

### Model client — `lib/model/client.ts` and `lib/model/settings.ts`
One function that talks to the provider, plus one frozen settings object: model IDs, `temperature: 0`, `max_tokens`, and a `wrapperVersion` bumped whenever the prompt template changes. Every attempt records these so a score change can be attributed to the prompt rather than to the plumbing.
PRD ref: `prd.md > Trustworthy Scoring`.

### Validators — `lib/validators/`
- `deterministic.ts` — Tier A: JSON parses, schema and types, required fields, no fabricated values (nothing in the output that appears nowhere in the input), amounts within the acceptable set, request counts.
- `judge.ts` — Tier B: one criterion only. Sends criterion + hidden input + response, never the user's prompt; expects `{verdict: "pass"|"fail"|"uncertain", reason}`, validated with Zod. A malformed or unparseable verdict becomes **uncertain**, never fail.
- `index.ts` — maps a case to its tier, so the UI can say which one decided it.
PRD ref: `prd.md > Trustworthy Scoring`.

### Redaction — proportional, not blanket (`lib/redact.ts`)
The goal is to protect the hidden *text*, not to hide correct answers from the person who earned them. So redaction fires only on a real disclosure:

- Always: length-cap the response and render it as inert text.
- Compare against the case's hidden input and acceptable answers after normalisation (case, whitespace, punctuation, number formatting).
- **Withhold only if** the response reproduces a distinctive span of the input (≥8 consecutive words, or the whole input) **or** states an acceptable answer the user couldn't have derived.
- **Do not withhold** merely because a short phrase overlaps, because the response quotes a field name, or because it happens to be correct. A correct response stays visible — that is the evidence the user is learning from.
- When withholding, show *“response withheld to protect this case”* plus the behavioural description and the validator that decided the verdict, so the feedback still teaches.
- **Rewrite cases are the documented exception.** Their output is derived from the input, so a case may set `redaction: "whole-input-only"`: withhold only a verbatim copy of the entire hidden message. Span redaction on a rewrite would hide every correct answer, which a live run confirmed before the policy was scoped.

This is a deliberate trade: meaningful feedback outranks absolute secrecy. The residual risk — a response paraphrasing an input closely enough to hint at it without hitting the threshold — is documented in the README rather than papered over.
PRD ref: `prd.md > Keeping the hidden tests hidden`.

### Scoring — `lib/scoring.ts`
`passed / scored`, with `uncertain` and `unresolved` counted separately and excluded from the denominator.


**Comparability gate.** Two attempts are comparable only when *all* of these match: model IDs, `settingsHash` (temperature, max tokens, wrapper version), `evaluationVersion` (bumped whenever a validator or criterion changes), `fixtureSetId` (hash of the fixture set actually used), and scored case count. If any differ, delta and best-attempt are suppressed and the UI says **not directly comparable** with the reason — it never implies a change it didn't measure.
PRD ref: `prd.md > Trustworthy Scoring`, `prd.md > Score, history and the lesson`.

### Regression — `lib/regression.ts`
Given the previous and current attempt: computes the **observed** set (cases that flipped, both verdicts, the difference in responses, the prompt lines added/removed) and, separately, an **inferred** explanation.

The two are never merged into one sentence. Observation is returned whenever a case flipped. The inference is returned only when the evidence meets a written threshold — comparable attempts (see the gate above), same criterion, same validator tier, and a prompt change localised to that behaviour — and it is typed as `{ kind: "inference", confidence: "low" | "moderate" }` so the UI cannot render it as fact. Below the threshold, observation only, and the UI says no cause is proposed.
PRD ref: `prd.md > Regression detection — the signature moment`.

### Attempt store — `lib/attempts.ts`
Attempts for the session in `sessionStorage` under one key, capped at the last 20. Reads on mount, writes after each run. No server persistence; the export is the durable copy.
PRD ref: `prd.md > States and Boundaries` (persistence).

### Workspace UI — `components/workspace/`
`MissionCard`, `PromptEditor`, `ScoreOrbit`, `Arena`, `CaseTile`, `RegressionMoment`, `PromptDiff`, `LearningSummary`, `ScoreHistory`, `ExportMenu`.

The arena is the centre of the screen: six tiles that flip from locked to resolved, each expanding to the deciding check and the model response. `PromptDiff` puts the edit beside the cases that changed hands, and `RegressionMoment` is the one loud moment in the product.
PRD refs: `prd.md > Scan, focus, and comparing attempts`, `> Export`.

## Criterion Pass/Fail Logic

One rule per criterion, written down so the build can't improvise. Only C5 involves a model judgement.

**Universal fabrication check** (used by C3 and C5): collect every string and number in the response; ignore the allowlist — the four field names, `null`, `unknown`, `true`, `false`, and anything that appears in the hidden input. Any remaining value presented as a fact about the message is fabricated.

| # | Criterion | Tier | Passes when | Fails when |
|---|---|---|---|---|
| C1 | Valid JSON | A | The trimmed response parses and is a plain object | Code fences, prose around it, an array, a scalar, a parse error |
| C2 | Exact fields and types | A | Key set is exactly `order_id`, `reason`, `amount_usd`, `wants_replacement`; types `string\|null`, `string`, `number\|null`, `boolean` | Any missing key, extra key, or wrong type |
| C3 | Missing values never invented | A | Every field the fixture marks absent is `null` or the string `unknown` (trimmed, case-insensitive) | Any other value in an absent field — one invention fails the case |
| C4 | Amounts exact | A | `amount_usd` strictly equals one of the fixture's acceptable numbers | Any other number. A delivery fee where a refund is expected fails — the intended edge |
| C5 | Ambiguity without fabrication | A → B | No fabricated value, and the judge says the response asserts nothing the message doesn't support | A fabricated value (Tier A decides, no judge call) or a judge `fail` |
| C6 | Two requests captured | A | Both requests represented and the count matches the fixture | One dropped, merged, or duplicated |

**Uncertain** is produced only by C5, when the message genuinely supports two readings. That is deliberate: a user shouldn't be penalised for a case the product itself can't resolve — and it keeps the judge from guessing to look decisive.

## Data Model

```ts
// PRIVATE — arrives from deployment config, validated at boot, never bundled
type FixtureSet = {
  packId: string;
  id: string;                      // hashed into fixtureSetId
  evaluationVersion: string;       // bumped when any validator or criterion changes
  cases: Case[];
};

type Case = {
  id: string;
  name: string;
  criterionIds: string[];
  input: string;                                                  // hidden
  acceptable: { amounts?: number[]; fields?: string[]; counts?: number };
  validator: { tier: "A" | "B"; kind: string; params?: unknown };
};

// What the client receives per case
type CaseResult = {
  caseId: string;
  state: "pass" | "fail" | "regressed" | "uncertain" | "unresolved";
  tier: "A" | "B";
  validatorName: string;           // "fabrication check", "constrained judge"
  observed: string;                // one plain sentence, no expected values
  publicResponse: string | null;   // redacted or null
  withheld: boolean;
  inference?: { kind: "inference"; confidence: "low" | "moderate"; text: string; basis: string };
};

type Attempt = {
  n: number;
  prompt: string;
  startedAt: string;
  modelIds: { underTest: string; judge: string };
  settingsHash: string;
  evaluationVersion: string;       // comparability
  fixtureSetId: string;            // comparability
  results: CaseResult[];
  scored: number; passed: number; uncertain: number; errors: number;
  complete: boolean;               // false when any case is unresolved
};
```

Where each thing lives: **public metadata** is bundled and safe to publish; **fixture inputs and acceptable answers exist only in server memory**, loaded from deployment configuration; attempts live in `sessionStorage`; the exported file is the only durable copy; nothing is written to a database because there isn't one.

## File Structure

```
prompt-gym/
├── app/
│   ├── layout.tsx                     # shell, fonts, providers
│   ├── page.tsx                       # landing: hero board, three challenges
│   ├── globals.css                    # Tailwind + design tokens + motion
│   ├── workspace/[packId]/page.tsx    # the arena workspace
│   └── api/run/route.ts               # the only server endpoint
├── components/
│   ├── brand/PackArt.tsx              # custom SVG scenes + wordmark
│   ├── ui/                            # icons, SpotlightCard, Tally, Reveal
│   ├── landing/                       # SiteHeader, HeroBoard, ChallengeCard,
│   │                                  # FirstRunIntro, HowItWorks
│   └── workspace/                     # MissionCard, PromptEditor, ScoreOrbit,
│                                      # Arena, CaseTile, RegressionMoment,
│                                      # PromptDiff, LearningSummary,
│                                      # ScoreHistory, ExportMenu
├── lib/
│   ├── packs/                         # PUBLIC — metadata only, safe to publish
│   │   ├── types.ts
│   │   ├── structured-extraction.ts   # flagship: objective, criteria C1–C6
│   │   ├── following-rules.ts
│   │   └── rewrite-meaning.ts
│   ├── fixtures/                      # PRIVATE — server-only
│   │   ├── schema.ts                  # Zod shape for a fixture set
│   │   └── load.ts                    # PACK_FIXTURES_JSON → validated set, sample fallback
│   ├── limits.ts                      # rate limit, input bounds, timeouts, shared budget
│   ├── model/
│   │   ├── client.ts                  # the only place the provider is called
│   │   └── settings.ts                # frozen model ids, temperature, wrapper version
│   ├── validators/
│   │   ├── deterministic.ts
│   │   ├── judge.ts
│   │   └── index.ts
│   ├── redact.ts                      # echo-risk check + withheld marker
│   ├── scoring.ts
│   ├── regression.ts
│   ├── prompt-diff.ts                 # line diff + case-change summary
│   ├── attempts.ts                    # sessionStorage store
│   └── export/
│       ├── markdown.ts
│       └── json.ts
├── tests/
│   ├── validators.test.ts
│   ├── fixtures.test.ts               # env parsing, fallback, sample labelling
│   ├── scoring.test.ts                # arithmetic + comparability gate
│   ├── regression.test.ts             # observation vs inference thresholds
│   ├── redact.test.ts                 # withholds real leaks, keeps correct answers
│   ├── limits.test.ts                 # bounds, timeout, budget exhaustion
│   ├── export.test.ts
│   └── flow.spec.ts                   # one end-to-end browser pass
├── fixtures/
│   └── sample/                        # committed, labelled samples for reproducibility
│       ├── structured-extraction.json
│       ├── following-rules.json
│       └── rewrite-meaning.json
├── devpost/                           # learning workspace (learner-profile is git-ignored)
├── .env.example                        # GROQ_API_KEY= (no value)
├── README.md
└── package.json
```

## External Services and Dependencies

**Model inference — one provider, two roles.**

- **Target:** Groq Cloud (OpenAI-compatible). Docs: <https://console.groq.com/docs> · limits: <https://console.groq.com/docs/rate-limits>
- **Call:** `POST https://api.groq.com/openai/v1/chat/completions`, `Authorization: Bearer $GROQ_API_KEY`, body `{ model, messages, temperature: 0, max_tokens, response_format?: { type: "json_object" } }`, response `choices[0].message.content`.
- **Roles:** a smaller/faster model runs the cases; a larger model judges. **Deliberately different models** so the judge isn't grading its own family's output. Exact IDs to be pinned at build time from `GET /openai/v1/models`.
- **Volume:** 6 subject calls plus one judge call per Tier B check — 7 for the flagship, up to 12 for Following Rules.
- **Rate limits (reported, verify with one live call):** roughly 30 requests/min, ~1,000 requests/day, ~8K tokens/min on the free tier. The tokens-per-minute figure is the binding constraint, which is why case inputs must stay short and concurrency limited.
- **Cost:** free tier. If it proves too tight, OpenRouter (~50 requests/day unfrozen) or a paid mini model are drop-in changes at the base URL.
- **Key custody:** server-side only, read in `lib/model/client.ts`; never `NEXT_PUBLIC_*`; `.env*` already git-ignored with `.env.example` allowed.

**Shared counters — Upstash Redis (optional but recommended).** Used only for rate-limit and daily-budget counters, through its REST API: `GET/POST $UPSTASH_REDIS_REST_URL` with `Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN` (commands `INCR`, `EXPIRE`, `GET`). Docs: <https://upstash.com/docs/redis/features/restapi>. Free tier is ample for ~900 calls/day. Without it, counters fall back to memory and the shared-budget guarantee weakens to per instance — stated in the README.

**Verification script — `scripts/probe-provider.ts`.** Run once before the UI is wired: lists models, sends one realistic case and one judge call, times them, checks whether `response_format: { type: "json_object" }` is accepted on the judge model, and prints the rate-limit headers. Its measured output is what justifies the IDs in `settings.ts`.

**No other external service.** No database, no auth provider, no analytics, no email.

## Public API Protection

The run route is public and spends money, so the limits live on the server. A browser-side cap is a courtesy, not a control.

- **Input bounds:** prompt trimmed; 40–4,000 characters; request body capped at 16 KB. Rejections return 422 with a readable message, not a stack trace.
- **Timeouts:** 20 s per model call, 45 s per run, 60 s route ceiling. A timed-out case is `unresolved`, never failed.
- **Concurrency:** 3 cases in flight per run; 2 concurrent runs per IP.
- **Per-IP rate limit:** token bucket — 6 runs/minute, 40 runs/hour.
- **Shared daily budget:** a global counter of model calls, default 900/day (≈75 runs at the 12-call maximum), checked before a run and decremented per call. Exhausted → 429 with a "daily practice budget reached, try tomorrow" state. The budget never downgrades evaluation to keep the demo alive.
- **Where counters live:** serverless instances don't share memory, so `lib/limits.ts` uses a small REST key-value store (Upstash Redis, available through the Vercel Marketplace) when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set. Without them it falls back to in-memory counters that are **per instance**, and the README says so plainly rather than claiming a shared budget that isn't shared.
- **Call arithmetic:** 6 subject calls plus one judge call per Tier B check — 7 for the flagship, up to 12 where every case is judged. A case that fails a Tier A check skips its judge call, so a run can cost as few as 6. The budget reserves the maximum (12) before a run starts and stops spending at the hard cap mid-run.

## Important Failure Modes

- **Provider rate-limits or times out mid-run** → the run is marked *incomplete*, affected cases show `unresolved`, the score is computed from the scored cases only, a Retry button appears and the prompt is untouched. Nothing is counted as a failure.
- **The judge returns something unparseable** → that case becomes `uncertain`, with the reason shown; it leaves the denominator instead of becoming a wrong answer.
- **The key is missing or invalid** → the run route returns a typed error the UI renders as "evaluation isn't configured" with setup instructions — not a 500, and not a failed case.
- **A response would disclose its case** → withheld marker plus the behavioural description; the case still resolves to pass or fail on the underlying verdict.
- **Two runs of the same prompt disagree** → both are kept, the attempt list shows the disagreement, and judge-based verdicts are labelled as the variable part. The app never rewrites history to look consistent.
- **Rate limit or daily budget exhausted** → 429 with a plain explanation and a retry time; the prompt stays in the editor and nothing is scored.
- **Fixture configuration is missing or invalid** → the app boots on the labelled sample set and shows a "sample fixtures" badge, rather than failing outright or pretending.

## What Was Simplified and Why

- **`sessionStorage`** instead of a database and accounts — the loop and the export are the product; persistence isn't. The fuller version needs auth, a schema and storage rules.
- **One judged criterion in the flagship**, not a general judge-per-case pipeline — the other five are deterministic, so this keeps both credibility and cost.
- **Static pack files** instead of an authoring system — three packs don't need a CMS, and content in code is reviewable.
- **A simple `{input}` template** instead of a prompt-wrapping DSL — the wrapper is versioned instead, which is what comparability actually needs.
- **Concurrency capped at 3 cases at a time** rather than all six at once — keeps the free tier's tokens-per-minute ceiling comfortable, and still feels progressive.
- **Flagship depth is uneven by design** — Structured Extraction gets six designed cases; the other two packs use the same schema at a simpler standard.

## Decisions and Open Issues

**Your decisions (confirmed 17 Oct):** Next.js + TypeScript + Tailwind + Zod · Groq as initial provider · Vercel for deployment · `sessionStorage` for attempt history · three packs with Structured Extraction as flagship · six cases per pack · no accounts, database or social features · observed-before-inferred regressions · deterministic-first scoring with uncertainty as a real state · deployment in scope · light Brilliant × Elevate identity.

**Your five refinements, incorporated as requirements:**
1. **Private fixtures out of the public repo** — public metadata in `lib/packs/`, private fixtures injected at deploy time, labelled sample sets for reproducibility.
2. **No forced JSON mode on the model under test** — constraints belong in the user's prompt; structured output only for the judge. Exact pass/fail logic per criterion is now written down above.
3. **Comparison compatibility gating** — model IDs, settings hash, `evaluationVersion`, `fixtureSetId` and scored count must all match before a delta or best-attempt claim.
4. **Proportional redaction** — withhold only a real disclosure; a correct response stays visible. Residual risk documented, not hidden.
5. **Server-side protection** — bounds, timeouts, concurrency, per-IP limits and a shared daily budget, with the serverless caveat stated.

**Implementation details derived from your decisions:** using different models on Groq for the subject and the judge (so the judge isn't grading its own family); concurrency 3; the shape of `CaseResult`. These follow from the choices above and are changeable during the build.

**One thing you raised and weren't sure about — can raw model responses leak the hidden tests?** Yes. A model will happily quote its input in its answer, and an expected value in a diff is just as bad. That's why the answer is structural rather than cosmetic: inputs stay server-side, and every response passes an echo-risk check before it's sent. The evidence will be `tests/redact.test.ts` plus the `withheld` state visible in the UI.

**Open issues**

1. **Exact model IDs — measured.** `openai/gpt-oss-20b` (subject) and `openai/gpt-oss-120b` (judge) both present on the account; subject 525 ms and judge 490 ms in the probe. Default reasoning effort consumed 698 of 700 output tokens and returned empty content, so the pinned settings are `reasoning_effort: low`, 1,200/800 tokens.
2. **Real free-tier limits — measured:** 1,000 requests and 8,000 tokens, with 993 requests / 7,783 tokens remaining after the probe. Recorded in the README.
3. **Judge calibration threshold** — still open. The judge passed a vague case-4 answer in every live run; agreement across repeated identical calls has not been measured.
4. **Genuine regression — observed.** P5 scored 6/6; changing one line to “merge the requests into a single object” scored 5/6 with only the two-request case flipping. The deployed UI showed the observation, a moderate hypothesis and a −1 delta.
5. **Upstash availability** — still open. Without it, the deployed limits fall back to per-instance memory; the README states the weaker guarantee.
