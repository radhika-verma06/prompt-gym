# Submission checklist — Prompt Gym

Last updated: 2026-10-24.

**Reverified 2026-10-24:** 145 tests, typecheck and production build pass; a live `POST /api/run` on the
deployed URL returned six production-fixture cases in 2.45 s with no error events; the repository is
public with MIT; `git log -p` contains no key material; `devpost/learner-profile.md` and `.fixtures/`
remain untracked. The missing `devpost/checklist.md` and `devpost/app-map.html` that the other documents
referenced now exist. The repository's About section now points at the live URL.

The two hard blockers are unchanged and are yours: the **demo video** and the **written submission**.

## Live and verified

- [x] **Public repository:** https://github.com/radhika-verma06/prompt-gym (public, first commit pushed 2026-10-19, MIT licence detected by GitHub). `.env.*`, `.fixtures/`, the learner profile and the skill pack are untracked. A fresh clone with no `.env` installed, `cp .env.example .env.local` works, and 145 tests plus the production build pass.
- [x] **Public deployment:** https://prompt-gym-three.vercel.app (Vercel production, Deployment Protection disabled). Redeployed 2026-10-19 with provider-limit handling.
- [x] **Real model evaluation:** `openai/gpt-oss-20b` under test, `openai/gpt-oss-120b` judge, `temperature: 0`, `reasoning_effort: low`, 1200/800 output tokens.
- [x] **Private production fixtures for the flagship:** six `se-prod-v1` cases injected as a sensitive env var; “Production cases” badge; no hidden text in page HTML or any of the 9 deployed client scripts.
- [x] **Flagship live run:** 6/6 on production fixtures through the deployed API, all six cases complete in 1,772 ms (2,632 ms including round trip), no error events.
- [x] **Genuine regression:** strong prompt 6/6 → merge edit 5/6, only `prod-5` flipped; the UI shows the regression panel, the observation and −1 delta. A same-prompt rerun scored 6/6 in both attempts and is labelled as run-to-run variation, not progress.
- [x] **Observation vs explanation:** P1 → P4 live showed a regression *and* an improvement; the app reported the observation and declined to name a cause. Same-prompt reruns are labelled “Same prompt as previous attempt”, not progress.
- [x] **Failure handling:** a real 50-token call returned `finish_reason: length`; the case became **unresolved**, excluded from the score, with no public response. Empty content is never passed or failed. Provider failures are now classified (`rate_limited` / `unavailable` / `timeout` / `provider`), a rate-limited call is retried once within a 3-second cap, and the case copy names the provider-side cause (rate limit, outage, or timeout) rather than implying the prompt broke.
- [x] **Provider-limit behavior:** back-to-back runs reproduced intermittent `unresolved` cases; the account's measured free-tier window is 8,000 tokens/minute. With 30-second spacing, the full validation produced 0 unresolved and 0 genuinely blank responses. Rate-limit classification and the single bounded retry have unit coverage; a shared free key can still run out mid-burst.
- [x] **Proportional redaction:** correct JSON answers stay visible; rewrite cases only withhold verbatim whole-input copies (two of six live rewrites).
- [x] **Exports:** deployed Markdown download contains the prompt, results, history, lesson, timestamp and real-run note; contains no hidden message text.
- [x] **Redesign:** illustrated challenge cards, a six-tile arena, circular score with count-up, regression moment, prompt diff and a three-step first-run tour. Screenshots are generated from real runs by `scripts/live-check.mjs`; `scripts/capture-screens.mjs` remains the deterministic stub-based layout pass.
- [x] **Mobile and layout:** no horizontal overflow at 390/768/1440; primary actions are 44–46 px high; the run button sits above the fold at 390 px; visible focus outlines.
- [x] **Contrast:** key text pairs measured 5.07–13.72:1 in the redesigned palette; deep accents on paper stay at or above 5:1.
- [x] **Server protection:** 40–4,000 character bounds, 16 KB body cap, 20 s/45 s timeouts, 3-way concurrency, 6/min + 40/hour per IP, 900 counted calls/day (a retry may add one uncounted request, so the hard worst case is 1,800); live HTTP checks returned 422/413/503/429 as specified.
- [x] **Unit and browser suites:** 145 Vitest tests and 3 Playwright flows pass (including a mobile starter-prompt flow and a prompt-diff unit suite); typecheck and production build clean.
- [x] **Documentation:** README includes measured latency, rate limits, reasoning-token diagnosis and the live evaluation record.
- [x] **Submission hygiene:** an automated scan of every staged text file against the production fixture bundle found no hidden inputs, order IDs or amounts; the remaining explicit values were removed from tests and comments. Expanded-result screenshots show the check trail only, with raw responses collapsed, so private case text is not in the images.
- [x] **Submission copy:** the AI-drafted description was removed. `devpost/SUBMISSION_FIELDS.md` lists required fields and evidence only; the name, descriptions and exit-survey answers must be learner-written.

## Stub-verified only (must not be presented as live)

- [x] Playwright suite runs against `tests/support/fake-provider.mjs` to prove progressive rendering, export contents and the regression panel deterministically.
- [ ] Do not cite stub scores as model results.

## Remaining before submission

- [ ] **Record the demo (under 3:00; target 2:45)** using `devpost/DEMO_SCRIPT.md` and the deployed URL. Upload it publicly to YouTube or Vimeo.
- [ ] **Devpost form:** write the name, short description, text description and exit-survey answers yourself. `devpost/SUBMISSION_FIELDS.md` lists the required fields and the evidence to point at; it intentionally contains no draft copy. The repository URL is ready; still needs the video URL and thumbnail through the form (thumbnail: `devpost/screenshots/readme/hero.png`).
- [ ] **Keep the public deployment within the free-tier budget while judges test it.** The daily budget resets at midnight UTC; a burst can exhaust the 8,000-token/minute window and leave a case unresolved (labelled, not blamed on the prompt).
- [x] **Private fixture sets for Following Rules and Rewrite.** Authored as `fr-prod-v1` and `rw-prod-v1`, merged with the flagship into one `PACK_FIXTURES_JSON_B64` bundle, and served live with the **Production cases** badge. Verified 2026-10-24: Following Rules 6/6 with a strong prompt (4/6 with the starter prompt), Rewrite 5/6 with one labelled `unresolved` case that completed and passed on rerun.
- [ ] **Upstash Redis (recommended security upgrade).** Without it, rate limits and the daily budget are per serverless instance, not globally shared. Provision it through the Vercel Marketplace and set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
- [ ] **Judge calibration pass.** The judge passed a vague case-4 response in every live run; record agreement across repeated identical calls before making any accuracy claim.
- [ ] **Independent mobile/desktop visual review.** Automated layout, focus and contrast checks pass; screenshots are in `devpost/screenshots/` (landing desktop/mobile, intro, workspace desktop/mobile, expanded results desktop/mobile, regression). A human aesthetic review on real devices is still outstanding.
- [ ] **Learning-outcome evidence.** The mechanism is verified — specific observed failures, criteria-derived lesson, hypotheses kept separate — but no user study measures whether learners actually improve. Do not claim measured learning gains.
- [ ] **Optional:** connect the Vercel project to the public GitHub repo so deployments follow pushes instead of CLI uploads.

## Honest claims

Use these, and only these:

- “Six real model runs per attempt, streamed as they resolve.”
- “Five of six criteria are decided by deterministic rules; one uses a constrained judge that never sees your prompt.”
- “Hidden inputs and the API key stay on the server; the deployed client bundles contain neither.”
- “Uncertain and unresolved outcomes are excluded from the score, not counted as failures.”
- “Regressions are observed from real attempt pairs; explanations are labelled hypotheses and suppressed when the evidence can't isolate a cause.”

Avoid:

- Any claim that the app is fully deterministic (a reasoning model and a judge remain variable).
- Any claim of a globally shared budget until Redis is configured.
- Any score taken from the stub provider.
