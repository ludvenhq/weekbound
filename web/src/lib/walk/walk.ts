import type { Road, Stage, Step } from '../road/schema.ts';
import { lastReset, nextReset, WEEK, type Region } from './reset.ts';

// Walking a road on the website, where every step is ticked or skipped by hand. Where the player
// stands is never stored: it is worked out from the marks each time, so a newer rev of a road, a
// backup from another browser or a changed region all land on the same rule (the design's import
// and unlock rule): the first stage with an open step is the current one, and with weekly pace a
// stage opens at the first reset after the stage before it was finished.

export type Mark = { state: 'done' | 'skipped'; at: number };
// By step id. Marks of steps a newer rev removed stay stored and are ignored.
export type Marks = Record<string, Mark>;

export type Position =
  // `openedAt` is when the stage opened; null for the first stage, which opens at once.
  | { kind: 'walking'; stage: number; openedAt: number | null }
  // Every step of `stage` is done or skipped and the next stage opens at the reset.
  | { kind: 'camp'; stage: number; opensAt: number }
  | { kind: 'complete'; finishedAt: number };

// When the last step of a stage was marked, or null while one is still open.
export function stageFinishedAt(stage: Stage, marks: Marks): number | null {
  let latest = 0;
  for (const step of stage.steps) {
    const mark = marks[step.id];
    if (!mark) return null;
    latest = Math.max(latest, mark.at);
  }
  return latest;
}

export function position(road: Road, marks: Marks, region: Region, now: number): Position {
  let openedAt: number | null = null;
  const last = road.stages.length - 1;
  for (const [index, stage] of road.stages.entries()) {
    const finished = stageFinishedAt(stage, marks);
    if (finished === null) return { kind: 'walking', stage: index, openedAt };
    if (index === last) return { kind: 'complete', finishedAt: finished };
    const opens = road.pace === 'free' ? finished : nextReset(finished, region);
    if (now < opens) return { kind: 'camp', stage: index, opensAt: opens };
    openedAt = opens;
  }
  throw new Error('a road has at least one stage');
}

export type Row = { step: Step; mark: Mark | null; current: boolean };
export type StageView = {
  rows: Row[];
  // Done or skipped before this game week began, so folded away.
  earlier: number;
  // Open steps beyond the next three.
  fogged: number;
};

export const NEXT_STEPS = 3;

// What a stage shows: this week's marked steps, so they can still be undone, and the next three
// open steps, in the stage's order. The first open one is the current step.
export function stageView(stage: Stage, marks: Marks, weekStart: number): StageView {
  const open = stage.steps.filter((step) => !marks[step.id]);
  const next = new Set(open.slice(0, NEXT_STEPS).map((step) => step.id));
  let earlier = 0;
  const rows: Row[] = [];
  for (const step of stage.steps) {
    const mark = marks[step.id] ?? null;
    if (mark && mark.at < weekStart) earlier++;
    else if (mark || next.has(step.id)) rows.push({ step, mark, current: false });
  }
  const current = rows.find((row) => !row.mark);
  if (current) current.current = true;
  return { rows, earlier, fogged: open.length - next.size };
}

export function withMark(marks: Marks, stepId: string, state: Mark['state'] | null, now: number) {
  const next = { ...marks };
  if (state === null) delete next[stepId];
  else next[stepId] = { state, at: now };
  return next;
}

export type Recap = {
  // "Last week" when the last visit was in the week before this one, otherwise "since your last
  // visit".
  span: 'last-week' | 'since-last-visit';
  done: Step[];
  // The stage that opened since the last visit, if one did.
  opened: { index: number; name: string } | null;
};

// Shown on the first visit after a reset: the steps done from the start of the last visit's game
// week to this week's reset, and the stage that opened. Never what was skipped or missed; null
// when there is nothing to say.
export function recap(
  road: Road,
  marks: Marks,
  region: Region,
  lastVisit: number | undefined,
  now: number,
): Recap | null {
  if (lastVisit === undefined) return null;
  const thisWeek = lastReset(now, region);
  if (lastVisit >= thisWeek) return null;
  const from = lastReset(lastVisit, region);
  const done = road.stages
    .flatMap((stage) => stage.steps)
    .filter((step) => {
      const mark = marks[step.id];
      return mark?.state === 'done' && mark.at >= from && mark.at < thisWeek;
    });
  const where = position(road, marks, region, now);
  const opened =
    where.kind === 'walking' && where.openedAt !== null && where.openedAt > lastVisit
      ? { index: where.stage, name: road.stages[where.stage]?.name ?? '' }
      : null;
  if (done.length === 0 && !opened) return null;
  return { span: thisWeek - from === WEEK ? 'last-week' : 'since-last-visit', done, opened };
}
