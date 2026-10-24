# Devpost submission — fields to complete yourself

The submission text, project name, short description and exit-survey answers must be
written by you. This file only lists what the form asks for and where the evidence lives;
it deliberately contains no draft wording.

## Required by the hackathon page

- [ ] **Project name** — reuse the name already used throughout the project.
- [ ] **Short description** — your own words.
- [ ] **Text description** — explain what the project does and how it works, in your own words.
- [ ] **Public code repository URL** — GitHub, GitLab or Bitbucket; public, with an open-source
      licence visible in the repository's About section.
- [ ] **Demo video URL** — YouTube or Vimeo, publicly visible, **under 3 minutes**, showing the
      project working end to end.
- [ ] **Built-with tags** — choose the ones the project actually uses. From `package.json`, the
      deployed source uses: Next.js 16, React 19, TypeScript, Tailwind CSS, Zod, the OpenAI-compatible
      Groq API (`openai/gpt-oss-20b` under test, `openai/gpt-oss-120b` judge), Vercel, Vitest and Playwright.
- [ ] **Thumbnail** — use one of the screenshots in `devpost/screenshots/`.
- [ ] **Exit survey** — your own reflections.

The official rules do not require a Devpost-hosted deployment, but the live URL can be added
if the form has a field for it. A deployment does not replace the video or the repository.

## Evidence you can point to (not submission prose)

- `README.md` — setup, architecture, limits, measured live results and known limitations.
- `devpost/DEMO_SCRIPT.md` — the recording plan; use it for the video, not as form copy.
- `devpost/screenshots/` — landing, workspace, expanded results and a real regression.
- `devpost/scope.md`, `prd.md`, `spec.md` — planning documents generated during the build.
- `devpost/SUBMISSION_CHECKLIST.md` — technical launch checks and remaining blockers.

## Before you submit

- [ ] The repository is public and contains the source, assets, run instructions and the
      three planning documents.
- [ ] The licence is visible at the top of the repository page.
- [ ] The video is under 3:00 and shows a real run and a real regression.
- [ ] No `.env*`, private fixture file or `learner-profile.md` is committed.
- [ ] The description matches what the deployed build actually does.
