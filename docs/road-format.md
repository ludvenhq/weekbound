# The road format

The contract between the website (`web/`) and the addon (`addon/`, later). Both read the same road
codes and must give the same result for every code.

- **The shape** lives in one place: the Zod schema in `web/src/lib/road/schema.ts`.
- **The behaviour** is pinned by the shared samples in `samples/`: the website's Vitest suite runs
  them now, and the addon's busted suite will run the same files on Lua 5.1.
- This page writes both out for the addon's author. If the page and a sample disagree, the sample
  wins and the page is fixed.

## A code

A code is `SR1!` followed by base64url (RFC 4648 section 5, no `=` padding) of the road's JSON in
UTF-8. Codes are not compressed, so the cost of opening one grows only with its length.

- **Two version marks, two meanings.** The digit after `SR` is the **encoding** version: a later
  encoding (a compressed one, say) would be `SR2!`. The road's `v` field is the **schema** version:
  a new field that older readers can drop stays in the same `v`; a change older readers would get
  wrong raises `v`.
- **Backup codes** (progress, not a road; build step 2) start with `SRB1!`, so a paste box can tell
  the two apart.
- **One road, one code.** The encoder writes keys in the schema's order (for a step: `id`, `type`,
  `label`, then its parameters), so the same road always gives the same code.
- **The encoder refuses a code over the cap.** The schema allows roads too big for one code (20
  stages of 20 long steps); the editor shows the size and never hands such a code out.

## Opening a code

Every pasted code is hostile. The checks run in this order, and the first that fails gives the
error. The addon runs the same checks in the same order.

| # | Check | Error |
|---|---|---|
| 1 | The paste, as given, is at most 24,576 bytes in UTF-8. Nothing else runs before this. | `too-long` |
| 2 | Spaces, tabs, CR and LF are removed everywhere. Something is left. | `empty` |
| 3 | It does not start with `SRB`, a whole number from 1, and `!`. | `backup-code` |
| 4 | It starts with `SR`, a whole number from 1 with no leading zero, and `!`. | `not-a-road-code` |
| 5 | That number is 1. | `newer-encoding` |
| 6 | The rest is canonical base64url: not empty; only `A-Z a-z 0-9 - _`; the length divided by 4 does not leave 1; the unused bits after the last whole byte are zero. | `bad-base64` |
| 7 | The bytes are valid UTF-8: no overlong forms, no surrogates, nothing above U+10FFFF. A byte order mark is kept (and then fails as JSON). | `bad-text` |
| 8 | Objects and arrays nest at most 16 deep, counted on the text before parsing: `{` and `[` add one, `}` and `]` take one away, outside strings; a string runs from `"` to the next `"` that no `\` escapes. | `too-deep` |
| 9 | It is strict JSON (RFC 8259): no comments, trailing commas, single quotes or `NaN`. A key given twice: the last one wins. | `bad-json` |
| 10 | It is a JSON object. | `invalid` |
| 11 | `v` is not a whole number above 1. | `newer-version` |
| 12 | It passes the schema below. | `invalid` |
| 13 | Its `id` does not start with `sr-`: studio roads ship built in, so a code may not carry one. | `reserved-id` |

A road nests five deep; the cap of 16 leaves room for newer fields and stops a deep code before
any parser recurses into it. The website's messages for each error are `DECODE_MESSAGES` in
`web/src/lib/road/code.ts`.

## The road, `v` 1

**Text** (title, author, stage names, labels): its length counts Unicode code points, not bytes or
UTF-16 units; it must hold a character other than a space; it must not hold control characters
(U+0000 to U+001F, U+007F to U+009F) or bidi embeddings, overrides and isolates (U+202A to U+202E,
U+2066 to U+2069). Text is always shown as plain text: the website never renders it as HTML, and
the addon escapes every `|`, so WoW escape sequences in a road stay visible as typed.

**Numbers** are JSON numbers with whole values. Game ids (achievement, quest, faction, mount,
title, currency, spec) run from 1 to 2,147,483,647.

**Unknown fields** are dropped at every level, so a road from a newer website still opens.

| Field | Rule |
|---|---|
| `v` | `1` |
| `id` | `sr-` (studio roads, reserved) or `p-` (made in the editor), then lowercase words joined by hyphens; at most 64 characters |
| `rev` | 1 to 1,000,000; a new road starts at 1 |
| `title` | text, at most 80 |
| `pace` | `weekly` or `free` |
| `author` | text, at most 40 |
| `license` | exactly `CC-BY-4.0`: every road is CC BY 4.0, and a code that says anything else does not open |
| `basedOn` | optional: `id`, `rev` and `author` of the road this one was remixed from (it may be an `sr-` id) |
| `stages` | 1 to 20 stages |

**A stage** has a `name` (text, at most 60) and `steps` (1 to 20).

**A step** has an `id` (lowercase words joined by hyphens, at most 32, unique across the whole
road, since progress is kept by road id and step id), a `type`, a `label` (text, at most 140), and
its type's parameters:

| `type` | Parameters |
|---|---|
| `item-level` | `n` 1 to 1,000 |
| `mythic-plus-rating` | `n` 1 to 5,000 |
| `pvp-rating` | `bracket` (`2v2`, `3v3`, `rbg`, `shuffle`, `blitz`), `n` 1 to 4,000, and `specId`: required for `shuffle` and `blitz`, not allowed for the others |
| `vault` | `row` (`raid`, `dungeon`, `world`), `n` 1 to 3 slots |
| `achievement` | `achievementId` |
| `quest` | `questId` |
| `reputation` | `factionId`, `n` 1 to 100 (the renown level of a major faction, or the standing of an older one) |
| `mount` | `mountId` |
| `title` | `titleId` |
| `currency` | `currencyId`, `n` 1 to 1,000,000 |
| `manual` | none |

**A type this version does not know** (lowercase words joined by hyphens, at most 32) keeps the
road: the step keeps only its `id`, `type` and `label` and shows as a step the player ticks by
hand. A known type with a wrong parameter is `invalid`.

When each step type counts as done, and the import and unlock rule, are in the studio's design doc
(the step table); they become shared check fixtures when the checks are built.

## Samples

`samples/valid/` holds codes that open, as `{ "about", "canonical", "code", "road" }`: the code
must decode to exactly that road. A canonical sample is the encoder's own output, so encoding the
road must give the same code back; the others are hand-made (keys in another order, extra fields,
whitespace) and must still decode.

`samples/invalid/` holds codes that do not open, as `{ "about", "code", "error" }`. Together they
cover every error above.

`npm run samples` in `web/` writes the samples that are missing and never rewrites one, so the
codes of every past version stay as they were. Never edit or delete a sample; a new rule gets new
samples. Game ids in the samples are placeholders: they test the format, not game data.

## Decided while building (2026-10-18, build step 1)

The design doc left these open; each can be changed while no code is public.

- base64url without padding, so a code can also travel in a link.
- The 24 KB cap is 24,576 bytes of UTF-8, measured on the paste as given.
- Spaces, tabs and line breaks anywhere in a code are ignored (codes get wrapped when pasted).
- The check order above, the depth cap of 16, and the text rules and limits.
- `license` must be `CC-BY-4.0`; any other value refuses the code.
- Step ids are unique across the whole road, not only inside a stage.
- The prefix digit is the encoding version and `v` the schema version.
- Renown and reputation share one step type, `reputation`.
