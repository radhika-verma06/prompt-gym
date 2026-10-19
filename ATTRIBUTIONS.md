# Attributions

## Design and review skills (installed in `.agents/skills/`)

| Skill | Source | Licence |
| --- | --- | --- |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) | Terms in the skill's `LICENSE.txt` |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT |

Installed with `npx skills add <repo> --skill <name> --yes`.

## Components

`components/ui/SpotlightCard.tsx` is adapted from the SpotlightCard component in
[DavidHDev/react-bits](https://github.com/DavidHDev/react-bits), MIT + Commons Clause,
copyright David Haz. The pointer loop was replaced with two CSS custom properties, so
the card ships no animation dependency. It is used as part of this application, not
redistributed as a component library.

`components/ui/Tally.tsx` takes its behaviour (animate a number when it changes) from
react-bits' Counter, rewritten without dependencies to keep the bundle small.

## Typefaces

Bricolage Grotesque and Nunito Sans, served from Google Fonts under the SIL Open Font
License.
