import { isKnownStep, type Road, type Step } from '../road/schema.ts';
import { lastReset, type Region } from '../walk/reset.ts';
import { position, type Marks } from '../walk/walk.ts';

// Road Check (design doc, "The website", version 1.1): what Blizzard's profile data says about a
// character, and which steps of a road it shows as done. The data is as of the character's last
// logout. Steps the API cannot see (the Great Vault, currencies, Solo Shuffle and Blitz ratings,
// hand steps) are "check in game" and count as not done (review concern R3-33).

// What Road Check knows about one character. A list or rating the API had no answer for (no
// Mythic+ runs this season, no rated games) is empty, not an error.
export type Facts = {
  itemLevel: number | null;
  mythicRating: number;
  pvp: { '2v2': number; '3v3': number; rbg: number };
  achievements: number[];
  quests: number[];
  // Renown level of a major faction, or the standing tier of an older one, by faction id.
  renown: Record<string, number>;
  mounts: number[];
  titles: number[];
};

// The parts of Facts a road needs, so a check asks Blizzard only for those.
export const FACT_KINDS = [
  'summary',
  'mythic',
  'pvp',
  'achievements',
  'quests',
  'reputations',
  'mounts',
  'titles',
] as const;
export type FactKind = (typeof FACT_KINDS)[number];

export type CheckResult = 'met' | 'not-met' | 'in-game';

export function kindFor(step: Step): FactKind | null {
  if (!isKnownStep(step)) return null;
  switch (step.type) {
    case 'item-level':
      return 'summary';
    case 'mythic-plus-rating':
      return 'mythic';
    case 'pvp-rating':
      return step.bracket === 'shuffle' || step.bracket === 'blitz' ? null : 'pvp';
    case 'achievement':
      return 'achievements';
    case 'quest':
      return 'quests';
    case 'reputation':
      return 'reputations';
    case 'mount':
      return 'mounts';
    case 'title':
      return 'titles';
    case 'vault':
    case 'currency':
    case 'manual':
      return null;
  }
}

// Every kind of fact the road's steps need.
export function kindsFor(road: Road): FactKind[] {
  const kinds = new Set<FactKind>();
  for (const stage of road.stages) {
    for (const step of stage.steps) {
      const kind = kindFor(step);
      if (kind) kinds.add(kind);
    }
  }
  return FACT_KINDS.filter((kind) => kinds.has(kind));
}

// The step table: when a step counts as done.
export function checkStep(step: Step, facts: Facts): CheckResult {
  if (!isKnownStep(step) || kindFor(step) === null) return 'in-game';
  const met = (yes: boolean): CheckResult => (yes ? 'met' : 'not-met');
  switch (step.type) {
    case 'item-level':
      return facts.itemLevel === null ? 'in-game' : met(facts.itemLevel >= step.n);
    case 'mythic-plus-rating':
      return met(facts.mythicRating >= step.n);
    case 'pvp-rating':
      return step.bracket === 'shuffle' || step.bracket === 'blitz'
        ? 'in-game'
        : met(facts.pvp[step.bracket] >= step.n);
    case 'achievement':
      return met(facts.achievements.includes(step.achievementId));
    case 'quest':
      return met(facts.quests.includes(step.questId));
    case 'reputation':
      return met((facts.renown[String(step.factionId)] ?? 0) >= step.n);
    case 'mount':
      return met(facts.mounts.includes(step.mountId));
    case 'title':
      return met(facts.titles.includes(step.titleId));
    default:
      return 'in-game';
  }
}

export type TickPlan = {
  // Steps to mark done, each with the moment its mark carries.
  ticks: { stepId: string; at: number }[];
  // Done in the game but in a stage that is not open yet: they tick when it opens and the player
  // checks again.
  later: number;
};

// Which steps a check ticks (design doc, the import and unlock rule). On a road the player has
// not marked anything on yet, every stage whose steps are all done already counts as done before
// this game week, so the first stage with an open step opens at once; its done steps tick now. On
// a road in progress only the open stage's steps tick, so a check can never skip a weekly lock.
// A step the player already marked (done or skipped) keeps its mark.
export function planTicks(
  road: Road,
  marks: Marks,
  facts: Facts,
  region: Region,
  now: number,
): TickPlan {
  const met = (step: Step) => !marks[step.id] && checkStep(step, facts) === 'met';
  const metFrom = (from: number) =>
    road.stages.slice(from).reduce((sum, stage) => sum + stage.steps.filter(met).length, 0);
  const fresh = road.stages.every((stage) => stage.steps.every((step) => !marks[step.id]));
  const ticks: TickPlan['ticks'] = [];
  let open: number;

  if (fresh) {
    // The first stage with a step the check cannot confirm; -1 when the whole road is done.
    open = road.stages.findIndex((stage) => !stage.steps.every(met));
    const before = lastReset(now, region) - 1;
    for (const stage of road.stages.slice(0, open === -1 ? undefined : open)) {
      for (const step of stage.steps) ticks.push({ stepId: step.id, at: before });
    }
    if (open === -1) return { ticks, later: 0 };
  } else {
    const where = position(road, marks, region, now);
    if (where.kind === 'complete') return { ticks, later: 0 };
    if (where.kind === 'camp') return { ticks, later: metFrom(where.stage + 1) };
    open = where.stage;
  }

  for (const step of road.stages[open]!.steps) {
    if (met(step)) ticks.push({ stepId: step.id, at: now });
  }
  return { ticks, later: metFrom(open + 1) };
}
