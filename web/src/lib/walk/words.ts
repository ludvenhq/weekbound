import { isKnownStep, type PvpBracket, type Step } from '../road/schema.ts';
import { RESETS, type Region } from './reset.ts';

// The words My road shows around a road, kept apart from the components so they read as copy.

const number = new Intl.NumberFormat('en-GB');
export const n = (value: number) => number.format(value);

const BRACKETS: Record<PvpBracket, string> = {
  '2v2': '2v2',
  '3v3': '3v3',
  rbg: 'Rated battleground',
  shuffle: 'Solo Shuffle',
  blitz: 'Blitz',
};

const VAULT_ROWS = { raid: 'raid', dungeon: 'dungeon', world: 'world' } as const;

// The threshold under a step's label: on the website every step is ticked by hand, so this says
// what "done" means. Manual steps and types this version does not know have none.
export function stepTarget(step: Step): string | null {
  if (!isKnownStep(step)) return null;
  switch (step.type) {
    case 'item-level':
      return `Item level ${n(step.n)}`;
    case 'mythic-plus-rating':
      return `Mythic+ rating ${n(step.n)}`;
    case 'pvp-rating':
      return `${BRACKETS[step.bracket]} rating ${n(step.n)}${step.specId ? ', on one spec' : ''}`;
    case 'vault':
      return `Great Vault: ${step.n} ${VAULT_ROWS[step.row]} ${step.n === 1 ? 'slot' : 'slots'}, this week`;
    case 'achievement':
      return 'Achievement';
    case 'quest':
      return 'Quest';
    case 'reputation':
      return `Renown ${n(step.n)}`;
    case 'mount':
      return 'Mount';
    case 'title':
      return 'Title';
    case 'currency':
      return `${n(step.n)} of the currency`;
    case 'manual':
      return null;
  }
}

export function stepCount(count: number): string {
  return `${count === 1 ? 'one step' : count === 2 ? 'two steps' : count === 3 ? 'three steps' : `${n(count)} steps`}`;
}

// "A, B and C"
export function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

export function resetName(region: Region): string {
  return `the ${RESETS[region].name} reset`;
}

// "Wednesday 21 October, 06:00", in the player's own time zone.
export function localTime(at: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
}
