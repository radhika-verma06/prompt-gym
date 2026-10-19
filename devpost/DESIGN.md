# Prompt Gym: the redesign

Prompt Gym is a practice game, not a dashboard. The redesign keeps every part of the
evaluation pipeline and rebuilds the interface around the six cases: one prompt goes in,
six hidden cases push back, and the interface makes the trade visible when an edit fixes
one behaviour and breaks another.

## Skills and references used

Installed into `.agents/skills/` with `npx skills add <repo> --skill <name> --yes`:

- `anthropics/skills` → `frontend-design`
- `nextlevelbuilder/ui-ux-pro-max-skill` → `ui-ux-pro-max`
- `vercel-labs/agent-skills` → `web-design-guidelines`

From `DavidHDev/react-bits`, `SpotlightCard` was ported (dependency-free, pointer
position written to two CSS custom properties) and the behaviour of `Counter` was
reimplemented as `components/ui/Tally.tsx`. Components that needed GSAP, three.js or the
Motion runtime were rejected to keep the bundle and first paint small. Licences and
attribution are recorded in `ATTRIBUTIONS.md`.

## Direction

|Token|Value|
|---|---|
|Canvas|`#F6F0E4` warm paper|
|Surface|`#FFFDF8`|
|Ink|`#17233F` navy-black|
|Primary|`#23396B`|
|Accent|`#F49B42` orange|
|Success|`#56C3A4` mint|
|Failure|`#EF6F62` coral|

Display type is Bricolage Grotesque, body type Nunito Sans, prompts and case IDs use the
monospace stack. Each challenge owns one accent so the cards read apart before any copy
is scanned. The interface's bold gesture is the six-tile arena; everything else stays
quiet around it.

## What is interactive

Every control changes state the user can see.

- **Hero board**: six demo cases with a moving highlight, pause/play and click-to-select.
  The board is labelled as a demo, because the real inputs are hidden.
- **First-run tour**: three steps, with a tile you can tap and a before/after score. It
  remembers being dismissed and traps focus while open.
- **Challenge cards**: spotlight follows the pointer, cover art lifts, each Play button
  goes to that pack. Difficulty shows both bars and a word.
- **Starter prompt**: fills an incomplete scaffold. If the editor already has text, it
  asks before replacing it. The scaffold leaves the hard behaviours undefined.
- **Run / Run again**: the label changes when the current text matches the last attempt.
  Command or Control plus Enter runs from the editor.
- **Six-case arena**: locked tiles become live tiles as results stream, then each tile
  expands in place to show the deciding check, the full observation, an optional hint and
  the raw response.
- **Score ring**: an SVG dial that re-settles with a count-up, plus delta, best attempt,
  uncertainty and non-comparable warnings.
- **Regression moment**: only appears when a case genuinely passed and then failed. The
  score before and after, a six-dot strip, the exact lines that changed and a separately
  framed hypothesis.
- **Prompt comparison**: unified diff of the two prompts, with fixed and broken cases as
  links that scroll to the matching tile. The copy states that a changed line is not
  proof of a cause.
- **Learning summary**: collapsed headline with expandable criterion states.

## Screenshot evidence

`devpost/screenshots/` is generated from the running interface. Workspace and regression
shots come from `scripts/live-check.mjs` using the real provider (`openai/gpt-oss-20b`), so
the arena, ring and regression are captured from real evaluation output rather than mocked
markup. Landing and tour shots were captured from the deployed build on 2026-10-19.

|File|What it shows|
|---|---|
|`landing-desktop.png`|Landing, 1440 wide|
|`landing-mobile.png`|Landing, 390 wide|
|`intro-desktop.png`|First-run tour, step two|
|`workspace-desktop.png`|Arena after the 6/6 strong-prompt attempt (production cases)|
|`results-expanded-desktop.png`|A case tile expanded to its check trail; the raw response stays collapsed so private case text is not in the image|
|`results-expanded-mobile.png`|The same expanded check trail at 390 wide|
|`regression-desktop.png`|Regression panel after the edit that drops the score to 5/6|
|`workspace-mobile.png`|Workspace, 390 wide, 6/6 attempt||

## Verified

- 145 unit tests pass, including prompt-diff coverage and provider-failure classification/retry.
- 3 Playwright flows pass against the stub provider: the full run/export/regression loop,
  the broad-rewrite flow that must not invent a cause, and a mobile pass that uses the
  starter prompt, expands a tile and asserts no horizontal overflow.
- Typecheck and production build are clean.
- Contrast checked for the working palette: ink on canvas 13.7:1, subtle on paper 6.2:1,
  white on navy 11.2:1, deep accents on paper at or above 5:1.
- Primary actions are at least 44px high; focus rings are visible (3px) and never removed.

## Limits

- Typefaces load from Google Fonts. If that request fails the system sans is used and the
  layout still holds, but the display face is part of the intended look.
- The screenshot checks cover layout, overflow, contrast and interaction. They are not a
  substitute for a human aesthetic review.
- The regression moment depends on the same attempt comparison as before; it still never
  fabricates a flip.
