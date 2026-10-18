# Slow Road

Clear, slow roadmaps for World of Warcraft retail: a website first, an addon later. Part of the
Ludven studio. This repo is **public** (MIT for code, roads CC BY 4.0).

- **Public repo rules:** no secrets, no server addresses or VPS config, and no personal names in
  commits, pull requests, release notes or repo content (write "the owner" or a date).
- **Branches:** all work on `dev`; `main` moves only by a pull request the owner merges.
- **Design:** read `DESIGN.md` before any UI work.
- **Plan:** the box 3 design doc lives in the studio hub (`docs/designs/2026-10-18-wow-slow-road.md`,
  Amendment 1 first: web first). Build order: (1) `web/` + CI, schema, codes, samples (done
  2026-10-18); (2) My road with localStorage, the weekly lock, the recap and the backup code
  (done 2026-10-18; its paste box came early); (3) the editor (done 2026-10-18; ids, versions and
  inputs in `docs/road-format.md`); (4) gallery and the first roads (done 2026-10-18: `/roads`,
  `/roads/<name>`, three studio roads in `roads/` reviewed by the owner, wider two-column pages,
  and the landing from the approved preview: the contour map, the fog and the one moment);
  (5) the owner plays a week; (6) deploy at the owner's word (the build reads `roads/` next to
  `web/`, so the Docker build context is the repo root; `Dockerfile` and `/api/health` exist).
  Version 1.1 came early (2026-10-18): Road Check on My road and search by name in the editor,
  switched on by `BLIZZARD_CLIENT_ID` and `BLIZZARD_CLIENT_SECRET` (`docs/road-check.md`); not
  yet run against the live API.
- **Studio roads:** files in `roads/` (CC BY 4.0, `roads/README.md`); the owner reviews every road
  and every change to one before it is committed. Game ids are checked on the web; an uncertain one
  becomes a `manual` step.
- **Gate:** `cd web && npm run verify` (lint, type-check, Vitest with the shared samples, build),
  the same as CI. Node 24; TypeScript stays on 6.0 until typescript-eslint supports 7.
- **Road format:** `docs/road-format.md` is the contract for the website and the addon; the Zod
  schema in `web/src/lib/road/schema.ts` is the single source of the shape. Never edit or delete
  a file in `samples/`; add new ones with `npm run samples`.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. Route only to skills in the session's available-skills list; answer directly for quick questions or small scoped edits.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

## Design System
Read DESIGN.md before visual or UI work: it defines the fonts, colors, spacing, and
aesthetic direction. Ask the user before departing from it. When reviewing or QA-ing
UI, flag code that doesn't match DESIGN.md. The approved preview is `docs/design/preview.html`.
