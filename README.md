# Slow Road

Clear, slow roadmaps for World of Warcraft retail. Pick one road; see its next three steps and
nothing else; a new stage opens at each weekly reset. Roads are shared as one line of text, a road
code, so players who know the game can write roads for players who are lost.

A website comes first; an addon that imports the same codes comes later. Made by Ludven, a small
studio.

## In this repo

- `web/`: the website (Next.js, Chakra UI, Zod). Node 24.
  - `npm ci`, then `npm run dev`. My road is at `/my-road`, the road editor at `/editor`.
  - `npm run verify` runs lint, type-check, tests and the build, as CI does.
  - `npm run code -- road.json` checks a road file and prints its code;
    `npm run code -- --decode <code>` prints the road inside a code.
- `docs/road-format.md`: the road format and how a code is opened, for both the website and the
  addon.
- `samples/`: sample codes, valid and hostile, that both sides must agree on.
- `DESIGN.md`: the design system.

## License

Code is MIT (`LICENSE`). Roads are CC BY 4.0.

Fan tool. Not affiliated with Blizzard Entertainment. World of Warcraft is a trademark of Blizzard
Entertainment, Inc.
