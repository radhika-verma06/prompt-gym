---
doc: scope
status: approved
doc-status-note: Approved 2026-10-17 with eight refinements: first-run guidance, hidden-inputs-with-explanatory-feedback, regression detection as a first-class feature, evaluation reliability as a priority, the demo journey as illustrative rather than hardcoded, MVP protection (one exceptional pack plus two simpler ones), the overfitting trap emerging from diverse cases rather than rigged scoring, and deployment as a stretch goal.
---

# Prompt Gym

A practice gym for writing prompts — pick a challenge, write a prompt, run it against hidden test cases, and watch your score rise or fall.

## The Unique Kernel

**The intentional overfitting trap.** You fix one failing case with an overly specific instruction, and a case that used to pass now breaks. The app shows the regression and explains that you optimised for one scenario instead of writing something that generalises.

That "wait, my score actually went down?" moment is the product. Everything else — the editor, the tests, the history — exists to make that moment visible and explainable.

**The trap must be honest.** It emerges from test cases that are diverse but consistently specified, not from contradictory requirements, hidden gotchas, or scoring that changes to manufacture a lesson. A user who writes a genuinely general prompt reaches 6/6.

## Who It's For

Someone who already uses ChatGPT daily and privately believes prompting is just talking to it. Students, beginners learning AI, and developers who want to know *why* one prompt holds up and another doesn't.

Today they either read long prompt-engineering guides (and retain nothing) or assume they're already good. Prompt Gym assumes neither: they should understand what to do within ten seconds of landing, knowing nothing about prompt engineering.

## The Core Loop

1. Land on a minimal page — headline **"Think your prompt is good? Let's test it."** — and pick one of three challenge packs.
2. Read a short, realistic objective with a clear definition of success.
3. See the challenge objective stated plainly, the criteria each case is judged against, and a short example of a good prompt — so a first-timer with no prompt-engineering vocabulary knows what "good" means here before writing anything. No prior knowledge required.
4. Write a first prompt in the editor and hit **Run Tests**.
5. Six predefined but initially hidden scenarios execute. Results appear progressively — each case turning green or red — ending in something like **4/6 passed**.
6. Read *why* each failure happened in specific terms: "the model added information that wasn't in the original input", "the required JSON format was broken", "the model failed to handle an ambiguous request." They see the actual model response and the observed behaviour, but not the full hidden inputs, so answers can't be memorised. The feedback names the failing behaviour precisely enough to reason about a fix — revealing inputs would remove the skill, so the explanation has to carry the learning.
7. Edit and rerun. Score history makes the trajectory visible: 2/6 → 4/6 → 5/6. Sometimes 5/6 → 4/6, and that's the lesson.

**Regression detection is a first-class feature, not a side effect.** When a previously passing case fails, the app highlights it, shows what changed between the two attempts, and explains the likely overfitting — naming the trade rather than scolding.

They come back because the next attempt is a hypothesis, not a repeat.

## Inspiration & Identity

**Duolingo meets LeetCode, for prompting.** Explicitly *not* another AI chatbot, and *not* a developer evaluation tool.

- One main workspace, not a page-per-page flow: challenge description and prompt editor on the left, testing area with the six cases, results and feedback on the right. Score and a small performance history chart always visible.
- Polished, modern, responsive. Subtle animation (results landing case by case), clean typography, restrained palette.
- A serious AI product that is still approachable and slightly addictive — not a toy, not an IDE.
- Feedback tone: never "your prompt could be clearer." Always the observable consequence — and never so cryptic that a beginner can't act on it.
- Scoring criteria are visible before the run, not inferred afterwards. The challenge objective, what each case checks, and how the score is computed are all on screen.
- No citations supplied yet; visual references would help `3-prd`'s Look and Feel beat.

## Why This Matters to the Learner

Her stated goal: *"master a structured, AI-assisted development workflow, going from a clear scope and PRD to a tested, polished product without unnecessary feature creep."*

Prompt Gym is the practice ground for exactly that discipline — and topically, it teaches people to use AI better rather than using AI to do another everyday task. It's also a real skill gap she can point at, not a demo prop.

## What "Working" Looks Like

One complete, honest journey, understandable in under three minutes:

Start from a deliberately weak prompt → **3/6**. Improve it → **5/6**. Make one overly specific change → **4/6**, with the regressed case highlighted, the change shown, and the overfitting explained. Revise toward something general → **6/6**. Export the final prompt, results, history and a short summary of the principles demonstrated.

**That trajectory is illustrative, not hardcoded.** The numbers describe the demo we expect to record; the build produces whatever the prompts actually earn. Nothing in the scoring path may be tuned to reproduce 3/6 → 5/6 → 4/6 → 6/6.

**Non-negotiable: it must not be a scripted demo.** The challenges and their cases are predefined, but the user's actual prompt genuinely executes against the test inputs, and every result and piece of feedback comes from a real evaluation. If the results are fake, the central promise is meaningless.

**Evaluation reliability outranks visual polish.** Deterministic checks wherever the criterion allows; fixed model configuration and temperature across runs so a score change means the prompt changed; constrained AI judging only where no deterministic check is possible. When an evaluation is technically uncertain, the case is shown as uncertain — never silently counted as a failure, and never counted as a pass to protect a number.

## The POC Boundary

- Three challenge packs — structured extraction, following rules under customer requests, rewriting without losing information.
- **Depth over breadth:** if a pack can't be made trustworthy in the time available, one exceptional pack plus two simpler polished ones beats three unreliable experiences.
- One prompt editor, one workspace.
- Six tests per challenge, including realistic edge cases, ambiguous inputs, and cases where a bad prompt produces a superficially convincing but wrong answer.
- Per-case, actionable feedback; actual model responses visible, hidden inputs withheld.
- Visible objective, scoring criteria and a good-prompt example on first arrival.
- Regression detection: previously passing case fails → highlighted, with the change between attempts and an overfitting explanation.
- Score plus attempt history, and a comparison of what changed between attempts — which cases improved, which regressed.
- Export: clean Markdown or JSON report of prompt, results, history and lessons.

## Later

- The hint coach — small nudges like *"try defining how the model should handle missing information"*, never a finished prompt. Wanted, but it competes with evaluation reliability for the remaining hours.
- More than three packs; per-challenge difficulty tiers.
- Personal best, iteration count, summary of prompting principles demonstrated.
- **A publicly accessible deployed version** — she wants it, and it strengthens the submission, but only after the product works and the demo is excellent. Not allowed to eat build time.

## Explicitly Cut

- **Authentication and accounts** — no user identity needed to prove the loop.
- **Database** — attempt history only needs to survive the session and the export.
- **Community feed, leaderboards, XP, social profiles** — gamification she doesn't want, and none of it teaches prompting.
- **A large challenge library** — three deep packs beat fifteen shallow ones, and depth is where the overfitting trap lives.
- **Unnecessary integrations** — nothing that isn't the model call and the export.

## Open Questions for `4-spec`

- **Real execution means a real model API**: which provider and model, whose key, and what a full demo run costs. This is the biggest schedule risk in the plan.
- **Trustworthy scoring**: which checks are deterministic (JSON shape, forbidden fields, rule compliance) versus where a constrained model judge is genuinely needed, and how "evaluation uncertain" is shown honestly instead of being reported as a failure.
- **Stable comparisons**: fixed model settings and temperatures so that a score change means the prompt changed, not the dice.
- **How the overfitting trap is engineered** — diverse but consistently specified cases within each pack, so narrow instructions genuinely lose generality. Not contradictory requirements, not a rigged switch.
- **How a first-time user gets oriented in ten seconds** — the example prompt, criteria panel and objective have to fit one screen without crowding the editor.
