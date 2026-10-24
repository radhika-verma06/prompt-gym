# Build checklist — Prompt Gym

Status: **built and deployed; submission blockers are the video and the written form, both learner-owned.**

This file is the record of what was built, what was actually verified, and what is still open. It was
reconstructed on 2026-10-24 from the tracked repository, the git history, the test suite and a fresh
run against the deployed build — not from memory. Anything the learner did not do is marked as not
done, rather than filled in.

## Slices

| # | Slice | Where | Done |
|---|---|---|---|
| 1 | Landing page: headline, demo board, three challenge cards, how-it-works, first-run intro | `app/page.tsx`, `components/landing/` | ✅ |
| 2 | Arena: mission card, objective + six criteria, prompt editor, run button | `components/workspace/Workspace.tsx`, `MissionCard.tsx`, `PromptEditor.tsx` | ✅ |
| 3 | Real evaluation server route: fixtures, limits, three-way concurrency, streamed NDJSON | `app/api/run/route.ts`, `lib/run.ts`, `lib/limits.ts` | ✅ |
| 4 | Rule-based validators (Tier A) and the constrained judge (Tier B) | `lib/validators/` | ✅ |
| 5 | Score, uncertainty, unresolved, and the honest denominator | `lib/scoring.ts` | ✅ |
| 6 | Regression panel: observed flip, comparability guard, hypothesis only when isolated | `lib/regression.ts`, `components/workspace/RegressionMoment.tsx` | ✅ |
| 7 | Prompt diff, lesson, attempt history | `lib/prompt-diff.ts`, `lib/lesson.ts`, `components/workspace/ScoreHistory.tsx` | ✅ |
| 8 | Markdown export, built from browser state only | `lib/export/markdown.ts`, `components/workspace/ExportMenu.tsx` | ✅ |
| 9 | Redaction of echoed hidden input, with rewrite opt-out | `lib/redact.ts` | ✅ |
| 10 | Private production fixtures (flagship) injected as a sensitive env var | `lib/fixtures/load.ts`, Vercel env | ✅ |
| 11 | Deployment on Vercel, no sign-up, no key in the client | Vercel project `prompt-gym` | ✅ |
| 12 | Presentation pass: illustrated cards, score count-up, motion, mobile layout | `components/`, `app/globals.css` | ✅ |

## Verification actually run

| Check | Result | Date |
|---|---|---|
| `npm test` | 145 tests in 15 files, all passing | 2026-10-24 |
| `npx tsc --noEmit` | clean | 2026-10-24 |
| `npm run build` | production build succeeds; `/` static, `/workspace/[packId]` and `/api/run` dynamic | 2026-10-24 |
| Live deployed run (`POST /api/run`, strong prompt, production fixtures) | `200`, six cases, complete in 2.45 s, no error events | 2026-10-24 |
| Live page | `200` from `https://prompt-gym-three.vercel.app` | 2026-10-24 |
| Repo visibility and licence | public, MIT detected by GitHub | 2026-10-24 |
| Secret scan | `git log -p` across all history: no key material; `.env*` and `.fixtures/` untracked | 2026-10-24 |
| Personal-data scan of tracked markdown | no personal context outside `devpost/learner-profile.md`, which is untracked | 2026-10-24 |
| Mobile and desktop layout, focus outlines, contrast | measured during the 2026-10-19 pass: no horizontal overflow at 390/768/1440, actions 44–46 px, contrast 5.07–13.72:1 | 2026-10-19 |

Re-run the first three before submitting; they take under a minute.

## Final review

Honest state of the promises the interface makes:

- **"Six real model runs"** — true; the live run above made six provider calls.
- **"Hidden cases"** — true for all three packs: `se-prod-v1`, `fr-prod-v1` and `rw-prod-v1` are
  server-only, and each pack shows the **Production cases** badge. A clone without the env var falls back
  to the labelled sample set and says so.
- **"Uncertain and unresolved are real states"** — covered by unit tests and reached in live runs.
- **"No prompt wording can reach the judge"** — true by construction: the judge call receives the
  criterion, the hidden message and the response only.
- **"Regressions are observed, explanations are hypotheses"** — true; an unisolated cause is withheld.

Not verified, and not claimed anywhere: measured learning gains, judge agreement with expert grading,
a globally shared rate-limit budget (no Upstash configured), and a human aesthetic review on real devices.

## Code tour and app map

The code tour is the request path at the top of [`app-map.html`](app-map.html): browser → `/api/run` →
fixtures → model → validators → stream → regression. The same file maps every module and component to
the promise it keeps, and records where the secrets do and do not live.

## What is left, and who owns it

Learner-owned, because the hackathon requires their own words and their own recording:

- [ ] Record the demo (under 3:00) using [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md), show a real 6/6 and a real
      5/6 regression on the deployed URL, and upload it publicly.
- [ ] Write the project name, short description, text description and exit-survey answers.
- [ ] Submit on Devpost with the video URL and the repository URL.

Optional, in value order:

- [ ] Configure Upstash Redis so the rate limit and daily budget are shared across instances.
- [ ] Calibrate the judge against repeated identical calls before any accuracy claim.
