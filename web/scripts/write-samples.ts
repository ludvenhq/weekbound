// `npm run samples`: writes the shared samples in samples/ that do not exist yet. It never rewrites
// a file, so the codes of every past version stay exactly as they were (docs/road-format.md,
// "Samples"). Each sample says what it pins; the website's tests and, later, the addon's run them
// all. Ids of achievements, quests and the like are placeholders: these samples test the format,
// not game data.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { toBase64Url } from '../src/lib/road/base64url.ts';
import { CODE_PREFIX, encodeRoad, MAX_CODE_BYTES, type DecodeError } from '../src/lib/road/code.ts';
import type { Road } from '../src/lib/road/schema.ts';

const root = resolve(import.meta.dirname, '../../samples');

const fromText = (json: string) => CODE_PREFIX + toBase64Url(new TextEncoder().encode(json));
const fromBytes = (bytes: number[]) => CODE_PREFIX + toBase64Url(Uint8Array.from(bytes));

function canonical(road: Road): string {
  const result = encodeRoad(road);
  if (!result.ok) throw new Error(`sample road does not encode: ${result.detail}`);
  return result.code;
}

const firstWeek: Road = {
  v: 1,
  id: 'p-first-week-back-k3x9qa',
  rev: 1,
  title: 'My first week back',
  pace: 'weekly',
  author: 'A returning player',
  license: 'CC-BY-4.0',
  stages: [
    {
      name: 'Find your feet',
      steps: [{ id: 'welcome', type: 'manual', label: 'Finish the welcome-back quest' }],
    },
  ],
};

const everyStepType: Road = {
  v: 1,
  id: 'p-every-step-type-a1b2c3',
  rev: 4,
  title: 'Every step type',
  pace: 'weekly',
  author: 'Format sample',
  license: 'CC-BY-4.0',
  stages: [
    {
      name: 'Gear and keys',
      steps: [
        { id: 'ilvl', type: 'item-level', label: 'Reach item level 240', n: 240 },
        {
          id: 'keys',
          type: 'mythic-plus-rating',
          label: 'Reach a Mythic+ rating of 1,500',
          n: 1500,
        },
        { id: 'vault-raid', type: 'vault', label: 'Fill a raid slot', row: 'raid', n: 1 },
        {
          id: 'vault-dungeon',
          type: 'vault',
          label: 'Fill two dungeon slots',
          row: 'dungeon',
          n: 2,
        },
        { id: 'vault-world', type: 'vault', label: 'Fill all world slots', row: 'world', n: 3 },
        {
          id: 'dungeon-feat',
          type: 'achievement',
          label: 'Earn the sample achievement',
          achievementId: 12345,
        },
      ],
    },
    {
      name: 'Rated play',
      steps: [
        { id: 'twos', type: 'pvp-rating', label: 'Reach 1,400 in 2v2', bracket: '2v2', n: 1400 },
        {
          id: 'threes',
          type: 'pvp-rating',
          label: 'Reach 1,600 in 3v3',
          bracket: '3v3',
          n: 1600,
        },
        { id: 'rbg', type: 'pvp-rating', label: 'Reach 1,500 in RBG', bracket: 'rbg', n: 1500 },
        {
          id: 'shuffle',
          type: 'pvp-rating',
          label: 'Reach 1,800 in Solo Shuffle as a healer',
          bracket: 'shuffle',
          n: 1800,
          specId: 105,
        },
        {
          id: 'blitz',
          type: 'pvp-rating',
          label: 'Reach 1,700 in Blitz',
          bracket: 'blitz',
          n: 1700,
          specId: 105,
        },
        { id: 'pvp-title', type: 'title', label: 'Earn the sample title', titleId: 42 },
      ],
    },
    {
      name: 'Around the world',
      steps: [
        { id: 'campaign', type: 'quest', label: 'Finish the sample quest', questId: 67890 },
        {
          id: 'renown',
          type: 'reputation',
          label: 'Reach renown 10 with the sample faction',
          factionId: 2600,
          n: 10,
        },
        { id: 'mount', type: 'mount', label: 'Collect the sample mount', mountId: 1500 },
        {
          id: 'crests',
          type: 'currency',
          label: 'Save 90 of the sample currency',
          currencyId: 3000,
          n: 90,
        },
        { id: 'friends', type: 'manual', label: 'Run one dungeon with friends' },
      ],
    },
  ],
};

const remix: Road = {
  v: 1,
  id: 'p-returning-healer-q7m2zd',
  rev: 2,
  title: 'Returning healer',
  pace: 'free',
  author: 'A healer',
  license: 'CC-BY-4.0',
  basedOn: { id: 'sr-returning-player', rev: 3, author: 'Ludven' },
  stages: [
    {
      name: 'Warm up',
      steps: [
        { id: 'heal-keys', type: 'mythic-plus-rating', label: 'Heal to 1,000 rating', n: 1000 },
      ],
    },
    {
      name: 'Arena',
      steps: [
        {
          id: 'heal-shuffle',
          type: 'pvp-rating',
          label: 'Reach 1,400 in Solo Shuffle',
          bracket: 'shuffle',
          n: 1400,
          specId: 264,
        },
      ],
    },
  ],
};

const unicodeText: Road = {
  v: 1,
  id: 'p-homecoming-u8t3xt',
  rev: 1,
  title: 'Повернення додому 🐉',
  pace: 'weekly',
  author: 'Zażółć gęślą jaźń',
  license: 'CC-BY-4.0',
  stages: [
    {
      name: 'Erste Schritte, größer',
      steps: [
        { id: 'cjk', type: 'manual', label: '最初の一歩を踏み出す' },
        { id: 'emoji', type: 'manual', label: 'Ride a 🐎 to the 🏰 with a friend 🧝‍♀️' },
      ],
    },
  ],
};

// Every text field at its longest, in characters that take 2 to 4 bytes and 1 to 2 UTF-16 units.
const atTheLimits: Road = {
  v: 1,
  id: `p-${'a'.repeat(62)}`,
  rev: 1_000_000,
  title: '🐉'.repeat(80),
  pace: 'weekly',
  author: 'ж'.repeat(40),
  license: 'CC-BY-4.0',
  stages: [
    {
      name: '最'.repeat(60),
      steps: [{ id: 's'.repeat(32), type: 'manual', label: `${'é'.repeat(139)}🐉` }],
    },
  ],
};

const hostileText: Road = {
  v: 1,
  id: 'p-hostile-text-h0st1l',
  rev: 1,
  title: '<img src=x onerror=alert(1)>',
  pace: 'weekly',
  author: '<b>Not bold</b>',
  license: 'CC-BY-4.0',
  stages: [
    {
      name: '{{constructor.constructor("alert(1)")()}}',
      steps: [
        { id: 'script', type: 'manual', label: '<script>alert("hi")</script>' },
        { id: 'wow-color', type: 'manual', label: '|cffff0000Free gold|r' },
        { id: 'wow-link', type: 'manual', label: '|Hitem:19019::::::::|h[Thunderfury]|h|r' },
        {
          id: 'wow-texture',
          type: 'manual',
          label: '|TInterface\\Icons\\INV_Misc_QuestionMark:64|t',
        },
        { id: 'entities', type: 'manual', label: '&amp; &lt;b&gt; &#x41;' },
      ],
    },
  ],
};

// Twenty brackets in a row would be too deep if the depth count read them; it skips strings, and
// an escaped quote or a trailing backslash does not end a string early.
const bracketsInText: Road = {
  ...firstWeek,
  id: 'p-brackets-in-text-b7k2rq',
  title: `Brackets ${'['.repeat(20)} in text`,
  stages: [
    {
      name: 'Escapes',
      steps: [
        {
          id: 'quote',
          type: 'manual',
          label: `He said "${'['.repeat(20)}" and left ${'{'.repeat(20)}`,
        },
        { id: 'backslash', type: 'manual', label: 'A path that ends in a backslash \\' },
        { id: 'after', type: 'manual', label: `${'['.repeat(20)} after the backslash` },
      ],
    },
  ],
};

// A road's JSON with keys swapped in by hand, for samples whose code is not the encoder's.
const json = (extra: Record<string, unknown>) => JSON.stringify({ ...firstWeek, ...extra });
const withStep = (step: Record<string, unknown>) =>
  json({ stages: [{ name: 'Find your feet', steps: [step] }] });

type Valid = { about: string; road: Road; code?: string };
type Invalid = { about: string; code: string; error: DecodeError };

const valid: Record<string, Valid> = {
  'first-week': { about: 'The smallest road: one stage, one manual step.', road: firstWeek },
  'every-step-type': {
    about: 'One step of every type, every PvP bracket and every vault row.',
    road: everyStepType,
  },
  remix: {
    about: 'A remix of a studio road at free pace; basedOn may name a reserved id.',
    road: remix,
  },
  'unicode-text': {
    about: 'Cyrillic, Polish, German, Japanese and emoji text survives UTF-8 both ways.',
    road: unicodeText,
  },
  'at-the-limits': {
    about:
      'Every text at its longest, counted in code points (emoji, 2-byte and 3-byte letters), the longest ids and the highest rev.',
    road: atTheLimits,
  },
  'hostile-text': {
    about:
      'HTML, template syntax and WoW escape sequences are valid text; the site shows them as plain text and the addon escapes every |.',
    road: hostileText,
  },
  'brackets-in-text': {
    about:
      'Brackets inside strings do not count toward the depth cap, after escaped quotes and a trailing backslash too.',
    road: bracketsInText,
  },
  'unknown-step-type': {
    about:
      'A step type this version does not know keeps the road; the step keeps only id, type and label and shows as manual.',
    code: withStep({
      id: 'wins',
      type: 'rated-wins',
      label: 'Win 10 rated 2v2 games',
      bracket: '2v2',
      n: 10,
    }),
    road: {
      ...firstWeek,
      stages: [
        {
          name: 'Find your feet',
          steps: [{ id: 'wins', type: 'rated-wins', label: 'Win 10 rated 2v2 games' }],
        },
      ],
    },
  },
  'extra-fields': {
    about: 'Fields this version does not know are dropped, at every level.',
    code: JSON.stringify({
      summary: 'A newer field',
      ...firstWeek,
      x: { nested: [1, 2, 3] },
      stages: [
        {
          colour: 'gold',
          name: 'Find your feet',
          steps: [{ icon: 'tent', ...firstWeek.stages[0]!.steps[0] }],
        },
      ],
    }),
    road: firstWeek,
  },
  'key-order': {
    about: 'Keys may come in any order; the decoded road is the same.',
    code: JSON.stringify({
      stages: firstWeek.stages,
      license: firstWeek.license,
      author: firstWeek.author,
      pace: firstWeek.pace,
      title: firstWeek.title,
      rev: firstWeek.rev,
      id: firstWeek.id,
      v: firstWeek.v,
    }),
    road: firstWeek,
  },
  'duplicate-keys': {
    about: 'A key given twice: the last one wins, as JSON.parse does.',
    code: json({}).replace('"title":"My first week back"', '"title":"First","title":"Second"'),
    road: { ...firstWeek, title: 'Second' },
  },
  'at-the-depth-cap': {
    about: 'Nesting exactly 16 deep (the road object is level 1) still opens.',
    code: json({ x: JSON.parse(`${'['.repeat(15)}${']'.repeat(15)}`) as unknown }),
    road: firstWeek,
  },
};

// Codes that are not JSON text use the code itself; the rest go through fromText below.
const whitespace = canonical(firstWeek).replace(/(.{40})/g, '$1\r\n');
const invalidRoad = (extra: Record<string, unknown>) => fromText(json(extra));
const invalidStep = (step: Record<string, unknown>) => fromText(withStep(step));

const invalid: Record<string, Invalid> = {
  // Before decoding
  empty: { about: 'Nothing but whitespace.', code: ' \r\n\t ', error: 'empty' },
  'too-long': {
    about: 'One byte over the 24,576-byte cap, refused before anything else.',
    code: CODE_PREFIX + 'A'.repeat(MAX_CODE_BYTES - CODE_PREFIX.length + 1),
    error: 'too-long',
  },
  'too-long-in-bytes': {
    about:
      'Under the cap in UTF-16 units (12,289) but over it in UTF-8 bytes (24,578): the cap counts bytes.',
    code: 'ж'.repeat(12_289),
    error: 'too-long',
  },
  'at-the-size-cap': {
    about: 'Exactly 24,576 bytes is not too long; this one then fails as JSON (NUL bytes).',
    code: CODE_PREFIX + 'A'.repeat(MAX_CODE_BYTES - CODE_PREFIX.length),
    error: 'bad-json',
  },
  'not-a-road-code': { about: 'Plain text.', code: 'hello there', error: 'not-a-road-code' },
  'weakauras-string': {
    about: 'Another addon’s import string.',
    code: '!WA:2!S3xwZTTrs4',
    error: 'not-a-road-code',
  },
  'lowercase-prefix': {
    about: 'The prefix is case-sensitive.',
    code: 'sr1!e30',
    error: 'not-a-road-code',
  },
  'prefix-zero': {
    about: 'Encoding versions start at 1.',
    code: 'SR0!e30',
    error: 'not-a-road-code',
  },
  'backup-code': {
    about: 'A backup code is told apart from a road code.',
    code: 'SRB1!e30',
    error: 'backup-code',
  },
  'newer-encoding': {
    about: 'A later encoding (say, compressed) asks for an update.',
    code: 'SR2!e30',
    error: 'newer-encoding',
  },
  'newer-encoding-two-digits': {
    about: 'The prefix digit is a whole number.',
    code: 'SR10!e30',
    error: 'newer-encoding',
  },
  // Base64url
  'empty-body': { about: 'A prefix and nothing after it.', code: 'SR1!', error: 'bad-base64' },
  'base64-plus': {
    about: 'Standard base64’s + is outside the base64url alphabet.',
    code: 'SR1!eyJ2Ijox+',
    error: 'bad-base64',
  },
  'base64-padding': { about: 'No = padding.', code: 'SR1!e30=', error: 'bad-base64' },
  'base64-length': {
    about: 'A length that leaves one character over.',
    code: 'SR1!e30Ae',
    error: 'bad-base64',
  },
  'base64-trailing-bits': {
    about: 'Set bits after the last whole byte: only one spelling per code.',
    code: 'SR1!e31',
    error: 'bad-base64',
  },
  'base64-non-ascii': {
    about: 'A letter outside ASCII in the body.',
    code: 'SR1!e30ж',
    error: 'bad-base64',
  },
  // UTF-8
  'not-utf8': {
    about: 'A byte that is never UTF-8.',
    code: fromBytes([0x7b, 0xff, 0x7d]),
    error: 'bad-text',
  },
  'utf8-overlong': {
    about: 'An overlong spelling of "/".',
    code: fromBytes([0x7b, 0xc0, 0xaf, 0x7d]),
    error: 'bad-text',
  },
  'utf8-surrogate': {
    about: 'A UTF-16 surrogate written as UTF-8.',
    code: fromBytes([0x22, 0xed, 0xa0, 0x80, 0x22]),
    error: 'bad-text',
  },
  'utf8-bom': {
    about: 'A byte order mark is not stripped, so the JSON fails.',
    code: fromBytes([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(json({}))]),
    error: 'bad-json',
  },
  // Depth and JSON
  'too-deep': {
    about: 'Nesting 17 deep, one over the cap, inside an otherwise valid road.',
    code: fromText(json({ x: JSON.parse(`${'['.repeat(16)}${']'.repeat(16)}`) as unknown })),
    error: 'too-deep',
  },
  'too-deep-flood': {
    about: '12,000 open brackets: refused by the depth count before any parser recurses.',
    code: fromText('['.repeat(12_000)),
    error: 'too-deep',
  },
  'json-truncated': { about: 'Cut off.', code: fromText('{"v":1,'), error: 'bad-json' },
  'json-trailing-comma': {
    about: 'Strict JSON: no trailing comma.',
    code: fromText('{"v":1,}'),
    error: 'bad-json',
  },
  'json-comment': {
    about: 'Strict JSON: no comments.',
    code: fromText('{"v":1 /* hi */}'),
    error: 'bad-json',
  },
  'json-single-quotes': {
    about: 'Strict JSON: double quotes only.',
    code: fromText("{'v':1}"),
    error: 'bad-json',
  },
  'json-nan': { about: 'Strict JSON: no NaN.', code: fromText('{"v":NaN}'), error: 'bad-json' },
  'json-array': { about: 'A road is an object.', code: fromText('[1,2,3]'), error: 'invalid' },
  'json-null': { about: 'A road is an object.', code: fromText('null'), error: 'invalid' },
  // Versions
  'newer-version': {
    about: 'A higher v asks for an update before its fields are checked.',
    code: fromText('{"v":2,"roads":[]}'),
    error: 'newer-version',
  },
  'version-zero': { about: 'v starts at 1.', code: invalidRoad({ v: 0 }), error: 'invalid' },
  'version-string': {
    about: 'v is a number, so "2" is not a newer version.',
    code: invalidRoad({ v: '2' }),
    error: 'invalid',
  },
  'version-fraction': {
    about: 'v is a whole number.',
    code: invalidRoad({ v: 1.5 }),
    error: 'invalid',
  },
  // The road
  'missing-title': {
    about: 'Every road has a title.',
    code: fromText(JSON.stringify({ ...firstWeek, title: undefined })),
    error: 'invalid',
  },
  'blank-title': {
    about: 'Spaces are not a title.',
    code: invalidRoad({ title: '   ' }),
    error: 'invalid',
  },
  'title-too-long': {
    about: '81 code points.',
    code: invalidRoad({ title: '🐉'.repeat(81) }),
    error: 'invalid',
  },
  'control-character': {
    about: 'Control characters are refused in every text.',
    code: invalidRoad({ author: 'Bell\u0007' }),
    error: 'invalid',
  },
  'bidi-override': {
    about: 'Bidi overrides, which can make text read backwards, are refused.',
    code: invalidRoad({ title: '‮evil' }),
    error: 'invalid',
  },
  'unknown-pace': {
    about: 'Weekly or free.',
    code: invalidRoad({ pace: 'fast' }),
    error: 'invalid',
  },
  'wrong-license': {
    about: 'Every road is CC BY 4.0; another license does not open.',
    code: invalidRoad({ license: 'MIT' }),
    error: 'invalid',
  },
  'road-id-without-prefix': {
    about: 'Road ids start with sr- or p-.',
    code: invalidRoad({ id: 'first-week' }),
    error: 'invalid',
  },
  'road-id-uppercase': {
    about: 'Road ids are lowercase.',
    code: invalidRoad({ id: 'p-First-Week' }),
    error: 'invalid',
  },
  'rev-zero': { about: 'rev starts at 1.', code: invalidRoad({ rev: 0 }), error: 'invalid' },
  'no-stages': {
    about: 'At least one stage.',
    code: invalidRoad({ stages: [] }),
    error: 'invalid',
  },
  'too-many-stages': {
    about: 'At most 20 stages.',
    code: invalidRoad({
      stages: Array.from({ length: 21 }, (_, i) => ({
        name: `Stage ${i + 1}`,
        steps: [{ id: `s${i}`, type: 'manual', label: 'Step' }],
      })),
    }),
    error: 'invalid',
  },
  'no-steps': {
    about: 'At least one step per stage.',
    code: invalidRoad({ stages: [{ name: 'Empty', steps: [] }] }),
    error: 'invalid',
  },
  'duplicate-step-id': {
    about: 'Step ids are unique across the road, so one tick never marks two steps.',
    code: invalidRoad({
      stages: [
        { name: 'One', steps: [{ id: 'same', type: 'manual', label: 'First' }] },
        { name: 'Two', steps: [{ id: 'same', type: 'manual', label: 'Second' }] },
      ],
    }),
    error: 'invalid',
  },
  // Steps
  'missing-label': {
    about: 'Every step has a label, unknown types included.',
    code: invalidStep({ id: 'wins', type: 'rated-wins' }),
    error: 'invalid',
  },
  'label-too-long': {
    about: '141 code points.',
    code: invalidStep({ id: 'long', type: 'manual', label: 'ж'.repeat(141) }),
    error: 'invalid',
  },
  'missing-type': {
    about: 'Every step has a type.',
    code: invalidStep({ id: 'what', label: 'Something' }),
    error: 'invalid',
  },
  'threshold-zero': {
    about: 'Thresholds start at 1.',
    code: invalidStep({ id: 'ilvl', type: 'item-level', label: 'Reach item level 0', n: 0 }),
    error: 'invalid',
  },
  'threshold-fraction': {
    about: 'Thresholds are whole numbers.',
    code: invalidStep({ id: 'keys', type: 'mythic-plus-rating', label: 'Rating', n: 1500.5 }),
    error: 'invalid',
  },
  'threshold-as-text': {
    about: 'Thresholds are numbers, not text.',
    code: invalidStep({ id: 'keys', type: 'mythic-plus-rating', label: 'Rating', n: '1500' }),
    error: 'invalid',
  },
  'shuffle-without-spec': {
    about: 'Solo Shuffle and Blitz name a spec.',
    code: invalidStep({
      id: 'ss',
      type: 'pvp-rating',
      label: 'Shuffle',
      bracket: 'shuffle',
      n: 1600,
    }),
    error: 'invalid',
  },
  'spec-on-team-bracket': {
    about: '2v2, 3v3 and RBG take no spec.',
    code: invalidStep({
      id: 'tw',
      type: 'pvp-rating',
      label: '2v2',
      bracket: '2v2',
      n: 1400,
      specId: 105,
    }),
    error: 'invalid',
  },
  'unknown-bracket': {
    about: 'Brackets are 2v2, 3v3, rbg, shuffle and blitz.',
    code: invalidStep({ id: 'fives', type: 'pvp-rating', label: '5v5', bracket: '5v5', n: 1400 }),
    error: 'invalid',
  },
  'vault-four-slots': {
    about: 'A vault row has three slots.',
    code: invalidStep({ id: 'v', type: 'vault', label: 'Vault', row: 'raid', n: 4 }),
    error: 'invalid',
  },
  'missing-game-id': {
    about: 'An achievement step names its achievement.',
    code: invalidStep({ id: 'a', type: 'achievement', label: 'Something' }),
    error: 'invalid',
  },
  // Import rule
  'reserved-id': {
    about: 'Studio roads ship built in; a code may not use their sr- ids.',
    code: invalidRoad({ id: 'sr-returning-player' }),
    error: 'reserved-id',
  },
  'reserved-id-but-invalid': {
    about: 'The schema is checked before the reserved id.',
    code: invalidRoad({ id: 'sr-returning-player', pace: 'fast' }),
    error: 'invalid',
  },
};

function write(folder: string, name: string, sample: unknown) {
  const file = resolve(root, folder, `${name}.json`);
  if (existsSync(file)) return false;
  mkdirSync(resolve(root, folder), { recursive: true });
  writeFileSync(file, `${JSON.stringify(sample, null, 2)}\n`);
  return true;
}

let written = 0;
for (const [name, { about, road, code }] of Object.entries(valid)) {
  const sample = code
    ? { about, canonical: false, code: fromText(code), road }
    : { about, canonical: true, code: canonical(road), road };
  if (write('valid', name, sample)) written++;
}
const whitespaceSample = {
  about: 'Spaces, tabs and line breaks anywhere in a code are ignored.',
  canonical: false,
  code: `  ${whitespace}\n`,
  road: firstWeek,
};
if (write('valid', 'whitespace', whitespaceSample)) written++;
for (const [name, sample] of Object.entries(invalid)) {
  if (write('invalid', name, sample)) written++;
}
console.log(`samples: ${written} written, the rest already exist`);
