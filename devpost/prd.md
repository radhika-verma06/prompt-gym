---
doc: prd
status: approved
doc-status-note: Core concept approved 2026-10-17; revised the same day against eight refinements (preview polish, observed-vs-inferred regressions, a defined scoring model, hidden-test protection, scannable cases and attempt diffs, accessibility and responsiveness, scope discipline, and deployment as a first-class deliverable).
---

# Prompt Gym — Product Requirements

An interactive practice gym where anyone can get measurably better at writing AI prompts — pick a challenge, write a prompt, run it against hidden test cases, and see exactly why it worked or failed.
Source: `scope.md > The Unique Kernel`, `> The Core Loop`, `> The POC Boundary`.

## The Core Journey

1. Someone lands on a light, generous page. Headline: **"Think your prompt is good? Let's test it."** One short paragraph explains the product. Below it, three challenge cards — each showing its objective, difficulty and the skill it practises. No sign-in, no onboarding carousel.
2. They pick a pack. Structured Extraction is the flagship; the page marks it as the recommended start.
3. The workspace opens: challenge objective and success criteria on the left, the editor underneath, and the test area on the right, empty, reading *No runs yet — write a prompt and hit Run Tests*.
4. They read the objective, the criteria each case is judged against, and a short example of a good prompt. A first-timer with no prompt-engineering vocabulary knows what "good" means here before writing a word.
5. They write a prompt and press **Run Tests**.
6. Six cases execute against the real model — fixed settings, same for every attempt. Results land progressively, case by case, with a restrained animation. Nothing is revealed until it is actually computed.
7. Each case resolves to one of four states: **Passed · Failed · Regressed · Evaluation uncertain**. They see the observed behaviour and the model's real response; the hidden inputs stay hidden.
8. The run ends on a score — *4 / 6* — next to the attempt history and progress chart.
9. They read a failed case: the criterion it violated, what the model actually did, and a constructive hint about the behaviour to define. Then they edit and rerun.
10. If a case that passed before now fails, the app shows the **regression**: which case flipped, what changed between attempts, and why an over-specific instruction lost generality. That is the memorable moment.
11. When they're satisfied, they export a clean report — final prompt, results, attempt history, and a one-paragraph summary of the lesson learned.

Success is not 6/6. Success is a user who can explain *why* their first prompt failed, and who reaches a generalising prompt in fewer attempts than they did at the start.

## Screens and Layout

Two surfaces and one export. Desktop is the primary target; mobile must degrade gracefully, not be a second design.

**1. Landing / challenge selection**
- Full-width light page, generous whitespace, one accent used sparingly.
- Headline, one-paragraph explanation, three challenge cards in a row (stacking on narrow screens).
- Card contents: pack name, one-line objective, difficulty, skill practised, and for the flagship a small "start here" marker.
- The whole page must communicate what the product does within ten seconds.

**2. Workspace — one focused screen, split**
- **Left panel, ~42%**: challenge objective, success criteria list, the prompt editor, and the prominent **Run Tests** button. Below the button, the good-prompt example, collapsed by default so it never competes with the user's own thinking.
- **Right panel, ~58%**: the six case cards, per-case feedback, the score, and the attempt history with progress chart. Score and history are always reachable here — never a separate page.
- Desktop-first. On narrow viewports the panels stack — objective and editor first, then results — with the score summary pinned above the case list so the outcome is visible without scrolling past every card.
- The editor is a comfortable writing surface: character count, wrapping, no line-number gutter, no syntax highlighting.

**3. Export**
- A single action producing the report described in step 11. No wizard, no account, no share link.

## Look and Feel

Product identity: **Brilliant × Elevate** — the clarity of an interactive learning exercise with the polish and satisfying progression of a brain-training game. Original, not a copy of either. Explicitly not a chatbot, not a developer dashboard, not a test-results console.

- **Theme:** light-first. Warm off-white background, clean white cards, restrained accents.
- **Palette (starting point, refined where it earns it):** background `#F7F4EB` · cards `#FFFFFF` · primary deep navy `#21396A` · interactive accent warm orange `#F8AB51` · success muted green `#64BFA4` · failure soft coral `#E87474` · text charcoal `#252936`.
- **Typography:** a friendly contemporary sans-serif for the interface; monospace reserved for prompts, JSON output and technical detail. Clear hierarchy, comfortable measure.
- **Surfaces:** rounded cards, subtle borders, soft depth, generous whitespace, strong contrast.
- **Motion:** restrained and purposeful — cases resolving, score changing, feedback expanding, regression appearing. Nothing decorative.
- **Personality:** curious, encouraging, intelligent, rewarding without being childish.
- **Avoid:** generic purple AI gradients, glow effects, glassmorphism, heavy shadows, chatbot framing, cluttered dashboards.

## Features and Behavior

Each behavior below is paired with **acceptance criteria** written as checkboxes — every one is verifiable during the build by looking at the screen, the output, or the exported file. Headings are stable so `4-spec` and `5-build` can cite them directly.

### Challenge packs

Three packs, each with six cases:

1. **Structured Extraction — flagship.** Turn a messy real-world input into strict JSON.
2. **Following Rules.** Handle customer requests while obeying stated policy — including requests that must be refused or escalated.
3. **Rewrite Without Losing Meaning.** Rewrite text to a constraint while preserving every fact that matters.

Each pack states, on arrival: the objective in one sentence, what success looks like, the six evaluation criteria, and one example of a strong prompt. Cases within a pack are **diverse but consistently specified** — plain, honest tests of generalisation, never contradictory requirements and never a hidden gotcha.

- [ ] Selecting a pack opens the workspace with its objective, criteria and example visible.
- [ ] Every pack has exactly six cases, each mapped to a named criterion.
- [ ] No case's requirement contradicts another case in the same pack.

#### Flagship case design — proposed, confirm before build

The six criteria the flagship is judged against:

| # | Criterion |
|---|---|
| C1 | Output always parses as valid JSON |
| C2 | Exactly the four required fields, correct types |
| C3 | Missing values marked unknown — never invented |
| C4 | Amounts preserved exactly, as numbers |
| C5 | Ambiguous references handled without fabrication |
| C6 | Two requests in one message both captured |

The six cases, one per criterion, each a realistic situation rather than a puzzle:

| # | Case | Criterion | Decided by |
|---|---|---|---|
| 1 | Straightforward refund, every field present | C1, C2 | Deterministic |
| 2 | Message contains no order identifier at all | C3 | Deterministic (fabrication check) |
| 3 | Delivery fee *and* refund amount in one message | C4 | Deterministic (amount in acceptable set) |
| 4 | "the usual one" — a reference that can't be resolved | C5 | Deterministic fabrication check, then constrained judge; may legitimately resolve to *uncertain* |
| 5 | Two products, two requests, one message | C6 | Deterministic (request count) |
| 6 | No amount stated; a non-USD currency mentioned | C3, C4 | Deterministic |

**Fair-edge rules:** ambiguity must be resolvable by a careful prompt rather than by trivia; missing data must be flaggable rather than guessable; competing numbers must be distinguishable by what they *mean*, not by where they appear. No case contradicts another, and no case is designed to catch a specific phrase the user might write.

### Arrival and orientation

- [ ] A first-time visitor can state what the product does after ten seconds, without scrolling past the fold.
- [ ] Each challenge card shows objective, difficulty and skill practised.
- [ ] The workspace shows objective, criteria and example before the first run.
- [ ] No prior prompt-engineering knowledge is required to begin.

### The editor and Run Tests

- As a first-time user, I want to edit and rerun without losing my previous attempt so that I can compare where I went wrong.

- [ ] Run Tests is disabled until the editor contains non-whitespace text, and says why it's disabled.
- [ ] While a run is in progress, the button shows a running state and cannot be double-triggered.
- [ ] Rerunning preserves the previous attempt in history; the editor keeps the current prompt.
- [ ] Attempts are numbered and timestamped within the session.
- [ ] The editor never loses content on a failed or errored run.

### Test execution

- [ ] All six cases run against the real model. No case's outcome is pre-determined, cached from another user, or fabricated.
- [ ] Results appear progressively as each case resolves — not one blocking wait for all six.
- [ ] Model and settings are identical across every attempt within a session, so a score change reflects the prompt.
- [ ] A case made intentionally testable by a deterministic check (JSON validity, schema shape, forbidden content, numeric preservation) is judged deterministically, with no model judgement involved.
- [ ] Where a constrained model judge is genuinely required, its criterion is stated on the case and its verdict is reproducible enough to trust.
- [ ] Exactly one of four states is shown per case: Passed, Failed, Regressed, Evaluation uncertain.

### Scan, focus, and comparing attempts

The six cases have to be readable at a glance and inspectable one at a time.

- A **compact row** per case: state chip, case name, criterion ID, one-line verdict. Six rows fit one screen-height region on desktop.
- Any row **expands in place** to full detail — no navigation, no page change.
- **Focus mode** opens a single failed case into a larger reading view with the score and the current prompt still visible behind it.
- A **Changes since attempt N** panel names what the edit added, removed or altered in the user's own prompt, and every case whose state changed, in both directions.

Failed case detail, in this order: state → criterion violated → observed behaviour in one plain sentence → **the validator that decided it** → a constructive hint naming the behaviour to define, never the answer → expandable raw model response.

Passing case detail: state → what worked, briefly → expandable raw model response.

- [ ] All six case rows fit within one screen-height region on desktop at default text size.
- [ ] A row expands to its detail using the keyboard alone, and Escape collapses it.
- [ ] Focus mode never hides the current prompt or the score.
- [ ] "Changes since attempt N" appears whenever a previous attempt exists, and lists every case whose state changed.
- [ ] A failed case never reads as a generic judgement ("your prompt could be clearer"); it names an observable consequence.
- [ ] The hint describes the behaviour to consider, and never supplies a full prompt or a copy-ready instruction.
- [ ] "Evaluation uncertain" is its own state, explained in place, and is never counted as a failure and never scored as a pass.
- [ ] Result state is conveyed by label and icon, not colour alone.

### Regression detection — the signature moment

When a previously passing case now fails, the app separates **what it observed** from **what it infers**, and never skips the first for the second.

**Observed — always shown:**

- [ ] The specific case that flipped, visually distinct from an ordinary failure.
- [ ] Both verdicts with their attempt numbers.
- [ ] The difference in what the model actually did, described as behaviour.
- [ ] The prompt text that changed between the two attempts.

**Inferred — labelled as inference:**

- [ ] A possible explanation (added specificity, a narrower rule, an assumption about wording) introduced in language that marks it as a hypothesis.
- [ ] Offered only when the evidence supports it.
- [ ] The app **never asserts that overfitting caused the failure**. With one run per attempt and six cases, causation isn't established — the wording states what changed and what it plausibly cost.
- [ ] When the evidence is thin, only the observation is shown and no cause is proposed at all.

- [ ] Never fires unless a real case genuinely flipped between two real runs.
- [ ] Reads as a discovery, not a penalty; the case stays visible afterwards rather than being dismissed.

### Score, history and the lesson

- As a learner, I want to see my trajectory across attempts so that I can tell improvement from luck.

- [ ] Score out of six, plus the delta from the previous attempt, visible without leaving the workspace.
- [ ] A simple progress chart across attempts in the session.
- [ ] Best attempt, marked as such.
- [ ] Per-attempt summary of which cases improved and which regressed.
- [ ] A concise statement of the prompting lesson demonstrated so far — from the criteria actually met, not a canned line.

### Export

- [ ] One action produces a clean report containing: the final prompt, per-case results, attempt history, the lesson summary, and the pack name.
- [ ] The report includes a timestamp and an explicit note that results came from real evaluations.
- [ ] The report says which model and fixed settings produced the results, and names the validator behind each case verdict.
- [ ] The report distinguishes scored, uncertain and errored cases exactly as the screen does.
- [ ] The report contains no hidden test inputs, no expected values, and nothing that was withheld on screen.
- [ ] The report is human-readable Markdown by default, with the same content available as structured JSON.

## Trustworthy Scoring

Credibility is the most fragile asset this product has, so the scoring path is defined rather than implied.

**What a case is made of.** A hidden input, one named criterion, an acceptable-answer definition, and a validator. Criteria, case names and validator type are public. Inputs and acceptable answers are never public.

**Two validator tiers, and nothing else.**

- **Tier A — deterministic.** JSON parses; schema and field types; required fields present; no output value that appears nowhere in the input (fabrication check); amounts belong to an acceptable set; request counts. Stable verdicts, preferred whenever a criterion allows.
- **Tier B — constrained judgement.** Only where a criterion is inherently interpretive. The judge receives the criterion, the input and the response — never the user's prompt — and returns `pass | fail | uncertain` with a short reason against a fixed rubric, at the same fixed settings as the model under test.

**Score arithmetic.**

- A case is **scored** (pass or fail), **unscored** (uncertain), or **unresolved** (API errored).
- The headline reads `passed / scored` with the counts beside it: *4 of 5 scored · 1 uncertain · 0 errors*.
- Uncertain and errored cases are **excluded from the denominator**. A technical error can never reduce the score, and neither can an evaluation the app isn't confident about.
- Delta compares two attempts only when their scored counts match. Otherwise it is labelled **not directly comparable** rather than implying a change that wasn't measured.
- Best attempt is the highest `passed / scored`, always shown with its scored count beside it.

**Consistency.** Model ID, temperature, max tokens and prompt-wrapper version are fixed for the session and recorded per attempt. Deterministic checks don't drift; judge verdicts are the only moving part, and every case displays which validator decided it.

**Transparency.** The export states the model, the settings, the run timestamp and the known limits: a judge can be inconsistent, a provider can vary output between identical runs, and uncertainty is reported rather than quietly resolved.

- [ ] Every case names its criterion and shows whether Tier A or Tier B decided it.
- [ ] No API error, timeout or uncertainty ever lowers the score or renders as a failure.
- [ ] Delta and best attempt are suppressed or labelled non-comparable when scored counts differ.
- [ ] Model ID and fixed settings appear on every attempt and in the export.
- [ ] A run containing errors is marked incomplete and cannot silently become the best attempt.
- [ ] The UI states plainly that results come from a real model run and that judge-based verdicts carry more variance than rule-based ones.

### Keeping the hidden tests hidden

The raw model response is shown because it is the evidence — which makes it the most likely leak channel, so it is handled deliberately.

- [ ] Responses are length-capped and rendered as inert text, never as a formatted view that could reconstruct the input.
- [ ] Every case is reviewed during build for **echo risk**. If a response would reproduce the input or disclose an acceptable answer, that case shows a redacted response reading *"response withheld to protect this case"* alongside the behavioural description.
- [ ] Expected values are never printed in feedback, hints, diffs, tooltips or the export. Feedback describes behaviour — *"the amount didn't match the refund in the message"* — not the answer.
- [ ] Attempt comparison shows changes to the **user's prompt** and which cases flipped, never hidden inputs or expected values.
- [ ] The export contains only what the user already saw on screen.
- [ ] Case rows, URLs, HTML attributes and page source carry no hidden input text.

## States and Boundaries

- **First use** — landing page as described; workspace empty state reads *No runs yet — write a prompt and hit Run Tests*, with objective, criteria and example already on screen.
- **In progress** — cases resolving one at a time; previously resolved cases stay visible; the score area reads as pending rather than showing a fake provisional number.
- **Run completed** — score, delta, per-case states, regression flags.
- **Model error** — a failed or timed-out call is shown as a run-level error with a retry, is not counted as a failed case, and never moves the score. The prompt is never lost.
- **Evaluation uncertain** — surfaced as its own state, with the reason stated; excluded from the pass count and labelled so in the score line.
- **Empty / no history** — progress chart area shows an intentional empty state, not a broken chart.
- **Persistence** — history lives for the session and in the export. Closing or reloading the tab loses it; there are no accounts and no server-side storage of prompts.
- **Responsive** — desktop is the design target; on narrow viewports the panels stack with the score summary pinned above the case list, case rows go full width, detail expands inline, body text stays at 16px or above and tap targets are at least 44px. No horizontal scrolling at 360px wide.
- **Accessibility** — full keyboard operation with visible focus and a logical tab order; result states differentiated by label, icon and border treatment, never colour alone; text contrast of at least 4.5:1; `prefers-reduced-motion` honoured; run progress and each resolved case announced through a polite live region.

## Product Decisions

- **Brilliant × Elevate as the identity** — her reason: a premium interactive learning game, explicitly not a chatbot or a developer evaluation tool.
- **Light-first with a warm off-white canvas** — chosen over a dark technical theme to keep the product approachable.
- **42/58 workspace split, editor left, results right** — writing on the left, judging on the right, score always visible.
- **Editor as a writing surface, not an IDE** — no gutter or syntax highlighting; monospace reserved for prompts and JSON.
- **Four case states, with "uncertain" as a first-class outcome** — transparency over a clean-looking score.
- **Regression detection as a named feature with its own visual treatment** — it's the differentiator, so it gets the interaction budget.
- **Structured Extraction is the flagship pack** — the others may be simpler, but this one sets the demo.
- **Export is Markdown by default, JSON available** — she asked for "clean Markdown or JSON"; Markdown is the readable default.
- **No leaderboards, XP, badges, accounts or social features** — motivation comes from understanding your own mistakes.
- **Deployment is a first-class deliverable** — her instruction, 17 Oct: *"I want a usable public deployment if feasible... Do not treat deployment as inherently less important than presentation."*
- **Observed before inferred in regression detection** — she required that the app distinguish what it observed from what it infers, and never claim overfitting caused a failure without evidence.
- **Deterministic validators preferred; constrained judging only where unavoidable; errors and uncertainty never touch the score** — credibility over a tidy number.
- **Hidden-test protection extended to raw responses** — she asked directly whether model responses could leak test data. They can, so echo-risk review and redaction are specified rather than assumed away.
- **Scannable cases, focused inspection, immediate attempt diffs** — her experience requirements, promoted from polish to acceptance criteria.
- **Six flagship cases designed around fair edge conditions** — realistic situations, no trivia, no contradictory cases.
- **Assumption (agent, not the learner):** the specific six cases, criteria wording, and the export layout above. Drafted for review before `4-spec` builds against them.
- **Assumption (agent):** the good-prompt example is collapsed by default so it can't be copied instead of understood. Reversible if it makes first use feel too bare.

## What We're Building

The landing page with three challenge cards; the flagship Structured Extraction pack fully realised, plus Following Rules and Rewrite Without Losing Meaning at a simpler but polished standard; six genuinely evaluated cases per pack; the split workspace with editor, progressive results, four case states and actionable feedback; regression detection with attempt comparison; score, delta, progress chart and best attempt; the lesson summary; Markdown and JSON export.

A **usable public deployment** is part of the deliverable rather than an afterthought: the same app served from a public URL, with the model key held server-side and never exposed to the browser, and a per-session run cap so one visitor can't drain the API budget. If deployment proves impossible in the time available, that is reported as a limitation rather than quietly dropped — a working product and a real deployment rank equally, so both get scheduled.

Depth over breadth stands: if a pack can't be made trustworthy, one exceptional pack plus two simpler polished ones beats three unreliable experiences.

## Deferred From the POC

- **The hint coach** — the constructive hint ships; an adaptive coach that responds to the whole attempt does not. Reason: evaluation reliability is the riskier half.
- **More packs and difficulty tiers** — three packs prove the loop.
- **Personal best across sessions, iteration statistics** — needs storage that accounts would require.
- **Public deployment** — moved into scope on the learner's instruction ("do not treat deployment as inherently less important than presentation"); no longer deferred.

## Possible Later Enhancements

An adaptive coach that reads the attempt and nudges toward the missing behaviour. More packs, including a deliberately ambiguous one. Per-criterion mastery across packs. A shareable challenge link.

## Non-Goals

- Being a chatbot, a playground, or a general prompt IDE — the loop is challenge, evaluate, learn.
- Teaching prompt engineering through prose — the lessons come from the user's own runs.
- Flexible prompt scoring the user can argue with — criteria are fixed per pack so attempts are comparable.
- Multiplayer, leaderboards, social comparison — named and cut, twice.
- Storing user prompts server-side — no accounts, no database, no prompt data leaving the machine beyond the model call.

## Open Questions

1. **Which model API, and whose key** — blocks `4-spec`: latency, cost and reproducibility all follow from it.
2. **Judge calibration** — which Tier B verdicts are stable enough to ship, and the threshold at which a judge should return *uncertain* instead of guessing. Partly answerable at `4-spec`, fully settled in `5-build` by repeated runs.
3. **Where it deploys, and how the key is held** — a server-side route is required so the key never reaches the browser; the host and the per-session run cap are `4-spec` decisions.
4. **Export file delivery** (clipboard, download, or both) — can wait for `4-spec`; both is acceptable.
5. **Whether a real, unassisted regression appears with these six cases** — verified during `5-build` by running the demo prompts for real. Never engineered to appear.
6. **Whether judge-based verdicts hold up under repetition** — to be measured during `5-build` by rerunning identical prompts and comparing verdicts.
