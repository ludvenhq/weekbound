import { isKnownStep, type Step } from '../road/schema.ts';
import type { ParamKey } from './draft.ts';

// Game facts the editor needs before the game data files exist. Those files (achievements,
// mounts, titles and factions, searchable by name) need the Blizzard API client, so until then
// authors type an id or paste a Wowhead link.

// Specialization ids for Solo Shuffle and Blitz steps, by class. Devourer's 1480 was checked on
// 2026-10-18 in the 12.1.5 client's ChrSpecialization table (wago.tools); any later spec is
// typed by id ("Another spec"), so no unchecked id is listed here.
export const SPECS: readonly { class: string; specs: readonly [number, string][] }[] = [
  {
    class: 'Death Knight',
    specs: [
      [250, 'Blood'],
      [251, 'Frost'],
      [252, 'Unholy'],
    ],
  },
  {
    class: 'Demon Hunter',
    specs: [
      [577, 'Havoc'],
      [581, 'Vengeance'],
      [1480, 'Devourer'],
    ],
  },
  {
    class: 'Druid',
    specs: [
      [102, 'Balance'],
      [103, 'Feral'],
      [104, 'Guardian'],
      [105, 'Restoration'],
    ],
  },
  {
    class: 'Evoker',
    specs: [
      [1467, 'Devastation'],
      [1468, 'Preservation'],
      [1473, 'Augmentation'],
    ],
  },
  {
    class: 'Hunter',
    specs: [
      [253, 'Beast Mastery'],
      [254, 'Marksmanship'],
      [255, 'Survival'],
    ],
  },
  {
    class: 'Mage',
    specs: [
      [62, 'Arcane'],
      [63, 'Fire'],
      [64, 'Frost'],
    ],
  },
  {
    class: 'Monk',
    specs: [
      [268, 'Brewmaster'],
      [270, 'Mistweaver'],
      [269, 'Windwalker'],
    ],
  },
  {
    class: 'Paladin',
    specs: [
      [65, 'Holy'],
      [66, 'Protection'],
      [70, 'Retribution'],
    ],
  },
  {
    class: 'Priest',
    specs: [
      [256, 'Discipline'],
      [257, 'Holy'],
      [258, 'Shadow'],
    ],
  },
  {
    class: 'Rogue',
    specs: [
      [259, 'Assassination'],
      [260, 'Outlaw'],
      [261, 'Subtlety'],
    ],
  },
  {
    class: 'Shaman',
    specs: [
      [262, 'Elemental'],
      [263, 'Enhancement'],
      [264, 'Restoration'],
    ],
  },
  {
    class: 'Warlock',
    specs: [
      [265, 'Affliction'],
      [266, 'Demonology'],
      [267, 'Destruction'],
    ],
  },
  {
    class: 'Warrior',
    specs: [
      [71, 'Arms'],
      [72, 'Fury'],
      [73, 'Protection'],
    ],
  },
];

export const KNOWN_SPEC_IDS: ReadonlySet<string> = new Set(
  SPECS.flatMap((group) => group.specs.map(([id]) => String(id))),
);

// Wowhead pages that carry the same id as the game: /achievement=12345 and so on. A mount's page
// is its spell or item, whose id is not the Mount Journal's, and a title's page uses the title
// table's row, not the id the game and Blizzard's API use (checked 2026-10-18: "the Seeker" is 42
// in the game and title=81 on Wowhead), so mounts and titles are searched or typed by hand.
const WOWHEAD_PAGES: Partial<Record<ParamKey, string>> = {
  achievementId: 'achievement',
  questId: 'quest',
  factionId: 'faction',
  currencyId: 'currency',
};

// The id in a pasted Wowhead link for this field, or the text as typed.
export function idFromLink(value: string, key: ParamKey): string {
  const page = WOWHEAD_PAGES[key];
  if (!page) return value;
  const match = new RegExp(`wowhead\\.com/(?:[a-z0-9-]+/)*${page}=(\\d+)`, 'i').exec(value);
  return match?.[1] ?? value;
}

export function takesLink(key: ParamKey): boolean {
  return WOWHEAD_PAGES[key] !== undefined;
}

// A step's page on Wowhead, for a reader who wants to know where the thing is; null for steps
// with no game id there (mounts, ratings, item level, the vault, manual steps).
export function wowheadUrl(step: Step): string | null {
  if (!isKnownStep(step)) return null;
  for (const [key, page] of Object.entries(WOWHEAD_PAGES)) {
    const id = (step as Record<string, unknown>)[key];
    if (typeof id === 'number') return `https://www.wowhead.com/${page}=${id}`;
  }
  return null;
}

// Where an author looks an id up.
export const LOOKUP: Partial<Record<ParamKey, string>> = {
  achievementId: 'https://www.wowhead.com/achievements',
  questId: 'https://www.wowhead.com/quests',
  factionId: 'https://www.wowhead.com/factions',
  currencyId: 'https://www.wowhead.com/currencies',
  mountId: 'https://www.wowhead.com/mounts',
};
