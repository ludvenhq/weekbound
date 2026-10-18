# Studio roads

The roads the studio writes. They ship built in: the website shows them in its gallery
(`/roads`), players walk them on My road and remix them in the editor, and the addon will carry the
same files.

**License:** every road in this folder is licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), by Ludven. The MIT license of the code
in this repository does not cover them. Share them, change them and remix them; name Ludven as the
source (the website's editor writes the source into every remix's code).

## A file

One road per file, named after its id: `sr-returning-player.json`.

| Field | What it is |
|---|---|
| `summary` | One line for the gallery, at most 80 characters. |
| `about` | A short paragraph for the road's page: who it is for and what it asks. |
| `season` | What the road was written for, e.g. "Midnight Season 1 (patch 12.0.7)". |
| `checked` | The date its game ids were last checked, `YYYY-MM-DD`. |
| `road` | The road itself, in the format of `docs/road-format.md`. |

- **Ids are reserved.** A studio road's id starts with `sr-`; a pasted code with such an id does not
  open, so a studio road reaches players only with the website (and later the addon).
- **Step ids stay.** Progress is kept by road id and step id, so a step keeps its id in every
  later version; a step that means something new gets a new id.
- **A fix is a new version.** Raise `rev` for any change. Players keep their ticks on every step
  the new version keeps.
- **Each season,** the studio checks every road against the live game, raises `rev` where a step
  changed, and updates `season` and `checked`. A road that no longer fits the game is reworked or
  removed.
- **Game ids** are checked on the web when written (Wowhead, warcraft.wiki.gg). Where an id is not
  certain, the step is a `manual` step the player ticks by hand.
- The website's tests check every file here: the format, the `sr-` id, and that the road's code
  fits the 24 KB cap.
