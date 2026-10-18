# Slow Road

Clear, slow roadmaps for World of Warcraft retail: a website first, an addon later. Part of the
Ludven studio. This repo is **public** (MIT for code, roads CC BY 4.0).

- **Public repo rules:** no secrets, no server addresses or VPS config, and no personal names in
  commits, pull requests, release notes or repo content (write "the owner" or a date).
- **Branches:** all work on `dev`; `main` moves only by a pull request the owner merges.
- **Design:** read `DESIGN.md` before any UI work.

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
