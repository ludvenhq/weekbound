import { STEP_TYPES, type StepType } from '../road/schema.ts';
import type { ParamKey } from './draft.ts';

// The words the editor shows, kept apart from the components so they read as copy.

export const TYPE_NAMES: Record<StepType, string> = {
  manual: 'Anything (ticked by hand)',
  'item-level': 'Item level',
  'mythic-plus-rating': 'Mythic+ rating',
  'pvp-rating': 'PvP rating',
  vault: 'Great Vault slots',
  achievement: 'Achievement',
  quest: 'Quest',
  reputation: 'Renown or reputation',
  mount: 'Mount',
  title: 'Title',
  currency: 'Currency',
};

// The order of the type picker: the free-form step first, then gear, ratings and collections.
export const TYPE_ORDER: readonly StepType[] = [
  'manual',
  ...STEP_TYPES.filter((type) => type !== 'manual'),
];

export const TYPE_HELP: Record<StepType, string> = {
  manual: 'Anything a player can do and tick. Slow Road never checks it.',
  'item-level': 'The equipped item level, as the character sheet shows it.',
  'mythic-plus-rating': "This season's Mythic+ rating.",
  'pvp-rating': "This season's rating in one bracket. Solo Shuffle and Blitz count one spec.",
  vault: 'Slots unlocked in one row of the Great Vault, in the week the stage is open.',
  achievement: "The achievement's id: paste its Wowhead link, or the number in it.",
  quest: "The quest's id: paste its Wowhead link, or the number in it.",
  reputation: "The faction's id (its Wowhead link works) and the renown level to reach.",
  mount: "The mount's id in the game's Mount Journal, not its spell or item id.",
  title: "The title's id in the game, which is not the number on Wowhead's title page.",
  currency: "The currency's id (its Wowhead link works) and how much to hold.",
};

export const LABEL_EXAMPLES: Record<StepType, string> = {
  manual: 'Run one dungeon with friends',
  'item-level': 'Reach item level 240',
  'mythic-plus-rating': 'Reach a Mythic+ rating of 1,500',
  'pvp-rating': 'Reach 1,400 in 2v2',
  vault: 'Fill a dungeon slot in the Great Vault',
  achievement: 'Earn Ahead of the Curve',
  quest: 'Finish the next campaign chapter',
  reputation: 'Reach renown 10 with the zone faction',
  mount: 'Collect the raid mount',
  title: 'Earn a title from rated PvP',
  currency: 'Save up for the next upgrade',
};

// A parameter's name, which depends on the step type for the threshold.
export function paramName(type: string, key: ParamKey | 'specOther'): string {
  switch (key) {
    case 'n':
      return type === 'item-level'
        ? 'Item level'
        : type === 'vault'
          ? 'Slots'
          : type === 'reputation'
            ? 'Renown level'
            : type === 'currency'
              ? 'Amount'
              : 'Rating';
    case 'bracket':
      return 'Bracket';
    case 'specId':
    case 'specOther':
      return 'Spec';
    case 'row':
      return 'Row';
    case 'achievementId':
      return 'Achievement id';
    case 'questId':
      return 'Quest id';
    case 'factionId':
      return 'Faction id';
    case 'mountId':
      return 'Mount id';
    case 'titleId':
      return 'Title id';
    case 'currencyId':
      return 'Currency id';
  }
}

export const BRACKET_NAMES = {
  '2v2': '2v2 arena',
  '3v3': '3v3 arena',
  rbg: 'Rated battleground',
  shuffle: 'Solo Shuffle',
  blitz: 'Battleground Blitz',
} as const;

export const ROW_NAMES = { raid: 'Raid', dungeon: 'Dungeons', world: 'World' } as const;

// "2.3 KB"
export function kilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}
