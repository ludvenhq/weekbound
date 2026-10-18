import { describe, expect, it } from 'vitest';
import { LICENSE, roadSchema, type Road } from '../road/schema.ts';
import { lastReset, nextReset } from '../walk/reset.ts';
import { position, type Marks } from '../walk/walk.ts';
import { checkStep, kindsFor, planTicks, type Facts } from './check.ts';

const NONE: Facts = {
  itemLevel: 250,
  mythicRating: 0,
  pvp: { '2v2': 0, '3v3': 0, rbg: 0 },
  achievements: [],
  quests: [],
  renown: {},
  mounts: [],
  titles: [],
};

const road: Road = roadSchema.parse({
  v: 1,
  id: 'p-test-road-abc123',
  rev: 1,
  title: 'Test road',
  pace: 'weekly',
  author: 'Tester',
  license: LICENSE,
  stages: [
    {
      name: 'One',
      steps: [
        { id: 'ilvl', type: 'item-level', label: 'Item level 266', n: 266 },
        { id: 'campaign', type: 'achievement', label: 'Campaign', achievementId: 100 },
      ],
    },
    {
      name: 'Two',
      steps: [
        { id: 'renown', type: 'reputation', label: 'Renown 5', factionId: 2710, n: 5 },
        { id: 'vault', type: 'vault', label: 'Vault', row: 'world', n: 1 },
      ],
    },
    {
      name: 'Three',
      steps: [{ id: 'mount', type: 'mount', label: 'Mount', mountId: 3043 }],
    },
  ],
});

const steps = road.stages.flatMap((stage) => stage.steps);
const step = (id: string) => steps.find((each) => each.id === id)!;

// Thursday 22 October 2026, noon UTC: the day after an EU reset.
const NOW = Date.UTC(2026, 9, 22, 12);

describe('checking a step', () => {
  it('follows the step table', () => {
    const facts: Facts = {
      ...NONE,
      itemLevel: 270,
      achievements: [100],
      renown: { '2710': 6 },
      mounts: [3043],
    };
    expect(checkStep(step('ilvl'), facts)).toBe('met');
    expect(checkStep(step('ilvl'), NONE)).toBe('not-met');
    expect(checkStep(step('campaign'), facts)).toBe('met');
    expect(checkStep(step('renown'), facts)).toBe('met');
    expect(checkStep(step('renown'), { ...NONE, renown: { '2710': 4 } })).toBe('not-met');
    // Blizzard leaves some renown factions out: unknown, not renown 0.
    expect(checkStep(step('renown'), NONE)).toBe('in-game');
    expect(checkStep(step('mount'), facts)).toBe('met');
  });

  it('leaves the vault, hand steps and per-spec ratings to the game', () => {
    expect(checkStep(step('vault'), NONE)).toBe('in-game');
    expect(
      checkStep(
        {
          id: 'shuffle',
          type: 'pvp-rating',
          label: 'Shuffle',
          bracket: 'shuffle',
          n: 1400,
          specId: 65,
        },
        NONE,
      ),
    ).toBe('in-game');
    expect(checkStep({ id: 'hand', type: 'manual', label: 'Hand' }, NONE)).toBe('in-game');
    expect(checkStep({ id: 'new', type: 'housing-decor', label: 'Newer type' }, NONE)).toBe(
      'in-game',
    );
    expect(checkStep(step('ilvl'), { ...NONE, itemLevel: null })).toBe('in-game');
  });

  it('asks Blizzard only for what the road needs', () => {
    expect(kindsFor(road)).toEqual(['summary', 'achievements', 'reputations', 'mounts']);
  });
});

describe('planning the ticks', () => {
  const allDone: Facts = {
    ...NONE,
    itemLevel: 280,
    achievements: [100],
    renown: { '2710': 9 },
    mounts: [3043],
  };

  it('on a fresh road, counts done stages as done before this week, so the next opens now', () => {
    const plan = planTicks(road, {}, allDone, 'eu', NOW);
    const before = lastReset(NOW, 'eu') - 1;
    // Stage one is all done; stage two has the vault, which the check cannot see.
    expect(plan.ticks).toEqual([
      { stepId: 'ilvl', at: before },
      { stepId: 'campaign', at: before },
      { stepId: 'renown', at: NOW },
    ]);
    expect(plan.later).toBe(1);
    const marks: Marks = Object.fromEntries(
      plan.ticks.map((tick) => [tick.stepId, { state: 'done' as const, at: tick.at }]),
    );
    expect(position(road, marks, 'eu', NOW)).toMatchObject({ kind: 'walking', stage: 1 });
  });

  it('on a road in progress, ticks only the open stage', () => {
    const marks: Marks = { ilvl: { state: 'done', at: NOW - 1000 } };
    const plan = planTicks(road, marks, allDone, 'eu', NOW);
    expect(plan.ticks).toEqual([{ stepId: 'campaign', at: NOW }]);
    expect(plan.later).toBe(2);
  });

  it('never opens a locked stage', () => {
    const marks: Marks = {
      ilvl: { state: 'done', at: NOW - 1000 },
      campaign: { state: 'done', at: NOW - 500 },
    };
    expect(position(road, marks, 'eu', NOW)).toMatchObject({
      kind: 'camp',
      opensAt: nextReset(NOW - 500, 'eu'),
    });
    const plan = planTicks(road, marks, allDone, 'eu', NOW);
    expect(plan.ticks).toEqual([]);
    expect(plan.later).toBe(2);
  });

  it('keeps the marks the player made', () => {
    const marks: Marks = { campaign: { state: 'skipped', at: NOW - 1000 } };
    const plan = planTicks(road, marks, allDone, 'eu', NOW);
    expect(plan.ticks).toEqual([{ stepId: 'ilvl', at: NOW }]);
  });

  it('ticks nothing the game does not confirm', () => {
    expect(planTicks(road, {}, NONE, 'eu', NOW)).toEqual({ ticks: [], later: 0 });
  });
});
