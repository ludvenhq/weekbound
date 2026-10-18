# Road code samples

Shared test samples for the road format (`docs/road-format.md`). The website's tests run every file
here, and the addon's tests will run the same files; both must give the same result for each.

- `valid/`: codes that open, with the road each must decode to.
- `invalid/`: codes that do not open, with the error each must give.

Write new ones with `npm run samples` in `web/`, which adds missing files and never rewrites one.
Never edit or delete a sample: the codes of every past version must keep decoding as they did.
Game ids in these samples are placeholders.
