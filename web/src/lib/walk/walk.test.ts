import { describe, expect, it } from 'vitest';
import type { Road } from '../road/schema.ts';
import { guessRegion, lastReset, nextReset, WEEK } from './reset.ts';
import { position, recap, stageView, withMark, type Marks } from './walk.ts';

const at = (iso: string) => Date.parse(iso);

// Three stages; the middle one has five steps, so two of them wait in the fog.
const road: Road = {
  v: 1,
  id: 'p-test-k3x9qa',
  rev: 1,
  title: 'Test road',
  pace: 'weekly',
  author: 'Test',
  license: 'CC-BY-4.0',
  stages: [
    {
      name: 'One',
      steps: [
        { id: 'a', type: 'manual', label: 'A' },
        { id: 'b', type: 'manual', label: 'B' },
      ],
    },
    {
      name: 'Two',
      steps: ['c', 'd', 'e', 'f', 'g'].map((id) => ({
        id,
        type: 'manual' as const,
        label: id.toUpperCase(),
      })),
    },
    { name: 'Three', steps: [{ id: 'h', type: 'manual', label: 'H' }] },
  ],
};

function marked(ids: string[], iso: string, state: 'done' | 'skipped' = 'done'): Marks {
  return ids.reduce<Marks>((marks, id) => withMark(marks, id, state, at(iso)), {});
}

describe('resets', () => {
  it('EU resets on Wednesday at 04:00 UTC, in summer time and in winter', () => {
    // 2026-10-18 is a Sunday; 2026-10-25 ends European summer time.
    expect(nextReset(at('2026-10-18T12:00:00Z'), 'eu')).toBe(at('2026-10-21T04:00:00Z'));
    expect(nextReset(at('2026-10-21T04:00:00Z'), 'eu')).toBe(at('2026-10-28T04:00:00Z'));
    expect(nextReset(at('2026-12-02T03:59:59Z'), 'eu')).toBe(at('2026-12-02T04:00:00Z'));
  });

  it('US resets on Tuesday at 15:00 UTC', () => {
    expect(nextReset(at('2026-10-18T12:00:00Z'), 'us')).toBe(at('2026-10-20T15:00:00Z'));
    expect(nextReset(at('2026-10-20T15:00:01Z'), 'us')).toBe(at('2026-10-27T15:00:00Z'));
  });

  it('a reset instant starts its own week', () => {
    expect(lastReset(at('2026-10-21T04:00:00Z'), 'eu')).toBe(at('2026-10-21T04:00:00Z'));
    expect(lastReset(at('2026-10-21T03:59:00Z'), 'eu')).toBe(at('2026-10-14T04:00:00Z'));
  });

  it('guesses the region from the time zone', () => {
    expect(guessRegion('Europe/Warsaw')).toBe('eu');
    expect(guessRegion('America/Los_Angeles')).toBe('us');
    expect(guessRegion('Australia/Sydney')).toBe('us');
    expect(guessRegion(undefined)).toBe('eu');
  });
});

describe('position', () => {
  const now = at('2026-10-19T20:00:00Z');

  it('starts at the first stage, open at once', () => {
    expect(position(road, {}, 'eu', now)).toEqual({ kind: 'walking', stage: 0, openedAt: null });
  });

  it('makes camp until the reset after the stage was finished', () => {
    const marks = marked(['a', 'b'], '2026-10-19T19:00:00Z');
    expect(position(road, marks, 'eu', now)).toEqual({
      kind: 'camp',
      stage: 0,
      opensAt: at('2026-10-21T04:00:00Z'),
    });
    expect(position(road, marks, 'eu', at('2026-10-21T04:00:00Z'))).toEqual({
      kind: 'walking',
      stage: 1,
      openedAt: at('2026-10-21T04:00:00Z'),
    });
  });

  it('counts skipped steps as finished', () => {
    const marks = {
      ...marked(['a'], '2026-10-19T19:00:00Z'),
      ...marked(['b'], '2026-10-19T19:00:00Z', 'skipped'),
    };
    expect(position(road, marks, 'eu', now).kind).toBe('camp');
  });

  it('opens the next stage at once at free pace', () => {
    const free = { ...road, pace: 'free' as const };
    const marks = marked(['a', 'b'], '2026-10-19T19:00:00Z');
    expect(position(free, marks, 'eu', now)).toEqual({
      kind: 'walking',
      stage: 1,
      openedAt: at('2026-10-19T19:00:00Z'),
    });
  });

  it('is complete when the last stage is finished', () => {
    const marks = {
      ...marked(['a', 'b'], '2026-10-01T10:00:00Z'),
      ...marked(['c', 'd', 'e', 'f', 'g'], '2026-10-08T10:00:00Z'),
      ...marked(['h'], '2026-10-15T10:00:00Z'),
    };
    expect(position(road, marks, 'eu', now)).toEqual({
      kind: 'complete',
      finishedAt: at('2026-10-15T10:00:00Z'),
    });
  });

  it('keeps the weekly lock when a newer rev adds a step to a finished stage', () => {
    // Stage one finished Monday; rev 2 adds a step to it on Tuesday. Ticking that step still
    // opens stage two at the same Wednesday reset, never earlier.
    const marks = marked(['a', 'b'], '2026-10-19T10:00:00Z');
    const rev2: Road = {
      ...road,
      rev: 2,
      stages: [
        {
          ...road.stages[0]!,
          steps: [...road.stages[0]!.steps, { id: 'new', type: 'manual', label: 'New' }],
        },
        ...road.stages.slice(1),
      ],
    };
    const tuesday = at('2026-10-20T10:00:00Z');
    expect(position(rev2, marks, 'eu', tuesday)).toEqual({
      kind: 'walking',
      stage: 0,
      openedAt: null,
    });
    const ticked = withMark(marks, 'new', 'done', tuesday);
    expect(position(rev2, ticked, 'eu', tuesday)).toMatchObject({
      kind: 'camp',
      opensAt: at('2026-10-21T04:00:00Z'),
    });
  });
});

describe('stageView', () => {
  const stage = road.stages[1]!;
  const weekStart = at('2026-10-21T04:00:00Z');

  it('shows the next three open steps, the first one current', () => {
    const view = stageView(stage, {}, weekStart);
    expect(view.rows.map((row) => row.step.id)).toEqual(['c', 'd', 'e']);
    expect(view.rows.map((row) => row.current)).toEqual([true, false, false]);
    expect(view).toMatchObject({ earlier: 0, fogged: 2 });
  });

  it("keeps this week's marked steps and folds earlier weeks away", () => {
    const marks = {
      ...marked(['c'], '2026-10-20T10:00:00Z'), // last week
      ...marked(['d'], '2026-10-22T10:00:00Z'), // this week
    };
    const view = stageView(stage, marks, weekStart);
    expect(view.rows.map((row) => row.step.id)).toEqual(['d', 'e', 'f', 'g']);
    expect(view.rows.find((row) => row.current)?.step.id).toBe('e');
    expect(view).toMatchObject({ earlier: 1, fogged: 0 });
  });
});

describe('recap', () => {
  const now = at('2026-10-22T09:00:00Z'); // after the 2026-10-21 EU reset

  it('says nothing on a first visit or within the same week', () => {
    expect(recap(road, {}, 'eu', undefined, now)).toBeNull();
    expect(
      recap(road, marked(['a'], '2026-10-21T08:00:00Z'), 'eu', at('2026-10-21T08:00:00Z'), now),
    ).toBeNull();
  });

  it("lists last week's done steps, never the skipped ones, and the stage that opened", () => {
    const marks = {
      ...marked(['a'], '2026-10-19T19:00:00Z'),
      ...marked(['b'], '2026-10-19T19:05:00Z', 'skipped'),
    };
    expect(recap(road, marks, 'eu', at('2026-10-19T19:05:00Z'), now)).toEqual({
      span: 'last-week',
      done: [road.stages[0]!.steps[0]],
      opened: { index: 1, name: 'Two' },
    });
  });

  it('covers every week since a visit several weeks ago', () => {
    const marks = marked(['a'], '2026-10-05T19:00:00Z');
    expect(recap(road, marks, 'eu', at('2026-10-05T19:00:00Z'), now)).toMatchObject({
      span: 'since-last-visit',
      done: [{ id: 'a' }],
      opened: null,
    });
  });

  it('says nothing when nothing was done and no stage opened', () => {
    expect(recap(road, {}, 'eu', at('2026-10-19T19:00:00Z'), now)).toBeNull();
  });

  it('measures weeks by resets', () => {
    expect(nextReset(now, 'eu') - lastReset(now, 'eu')).toBe(WEEK);
  });
});
