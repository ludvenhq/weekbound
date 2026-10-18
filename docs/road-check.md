# Road Check and the editor's search

Version 1.1 of the website (design doc, Amendment 1): a small server that reads Blizzard's public
API, so My road can tick the steps a character has already done, and the editor can find
achievements, mounts, titles and factions by name. Built on 2026-10-18; it switches on when the
server has a Blizzard API client.

## Switching it on

The server reads two environment variables. Locally they go in `web/.env.local` (git ignores it;
`web/.env.example` names them); on the server they are environment variables of the running
container. They are never in the repository, the image or a build argument.

```
BLIZZARD_CLIENT_ID=
BLIZZARD_CLIENT_SECRET=
```

Without them, `GET /api/check` answers `{ "enabled": false }` and the page shows neither Road
Check nor the search; everything else works as before.

## The routes

| Route | What it does |
|---|---|
| `GET /api/check` | `{ enabled }`: whether the server has a Blizzard client. |
| `POST /api/check` | Takes `{ region, realm, name, kinds }` and answers the character's facts (`web/src/lib/check/api.ts`). |
| `GET /api/realms?region=eu` | The region's realms, names and slugs, for the realm field. |
| `GET /api/search?kind=achievement&q=curve` | Up to 12 matches by name; `kind` is `achievement`, `mount`, `title` or `faction`. |
| `GET /api/health` | `{ ok: true }`, for the container's health check. |

## What a check reads

Only what the road needs (`kindsFor` in `web/src/lib/check/check.ts`), each from one Profile API
endpoint under `/profile/wow/character/{realm}/{name}`: the summary (item level, and whether the
character can be seen at all), `mythic-keystone-profile`, `pvp-bracket/2v2`, `3v3` and `rbg`,
`achievements`, `quests/completed`, `reputations`, `collections/mounts` and `titles`.

- **Done when:** the step table in the design doc. The Great Vault, currencies, Solo Shuffle and
  Blitz ratings and hand steps are "check in game" and count as not done (R3-33).
- **No data is not an error:** a 404 for Mythic+ or a PvP bracket means no runs or games this
  season. A 404 (or 403) for the summary means the character cannot be seen: a typo, a character
  not played for years, or a player who turned off sharing game data.
- **PvP ratings count only this season's:** a bracket last played in an earlier season still
  answers with that season's rating, so each bracket's season is compared with the current one
  (`/data/wow/pvp-season/index`); when that cannot be had, no rating counts.
- **Renown** is the standing's `renown_level` (renown factions have it in place of `tier`); the
  standing's name is never parsed. Blizzard leaves some renown factions out of its answer, so a
  missing faction is "check in game", never renown 0.
- **Titles** are matched by the game's title id, which the API also uses (`docs/road-format.md`).
- **Realms:** a typed name becomes a slug the way Blizzard makes them (lowercase, apostrophes and
  brackets dropped, spaces as hyphens, accents kept: `aggra-português`), and is matched against
  the region's realm list, which knows the slugs that differ from the name.
- **Data as of the last logout:** the API updates when a character logs out.

## What a check ticks

`planTicks` (the design doc's import and unlock rule):

- **A road the player has not marked anything on:** every stage whose steps are all done already
  counts as done before this game week, so the first stage with an open step opens at once; its
  done steps tick now.
- **A road in progress:** only the open stage's steps tick. A locked stage is never touched, so a
  check can never skip a weekly lock. Steps done further on are counted ("check again when their
  stage opens").
- A step the player marked (done or skipped) keeps its mark. Nothing is ever unticked.

## Guards (R3-17)

- Inputs are checked before anything reaches Blizzard: a region from a fixed list, a realm slug
  of letters, digits and hyphens, a character name of 2 to 12 letters.
- Site-wide: at most 40 requests a second and 30,000 an hour to Blizzard (it allows 100 and
  36,000). Each visitor: 6 checks and 60 searches a minute. Over a limit, the page says Blizzard is
  busy or asks to wait a minute; it never retries in a loop. The server retries a busy or failed
  call once, after a pause.
- The app token is kept in memory and renewed a few minutes before it expires.
- Facts are cached in memory for 15 minutes per character and kind (at most 2,000 entries); the
  search indexes and realm lists for a day, the PvP season for an hour. Nothing is written to disk;
  game data is never committed to the repository (R3-27, R3-38).
- **Blizzard's Developer API terms** (checked 2026-10-18): data is kept at most 30 days (we keep
  it at most a day), never handed on to anyone else, and Blizzard is named as its source (Road
  Check's result and the About page say so). The site has no paid tier.

## Not checked against the live API yet

The response shapes follow recorded responses from 2025 and 2026 and Blizzard's documentation
(checked 2026-10-18), read loosely: a missing field counts as "none". Still to confirm with a live
client: what Mythic+ answers for a character with no runs this season (404 or a missing rating;
both read as 0), and the exact Blitz bracket ids (`blitz-{class}-{spec}`; Blitz is "check in game"
anyway).
