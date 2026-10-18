import { z } from 'zod';
import {
  roadIdSchema,
  roadSchema,
  stepIdSchema,
  STUDIO_PREFIX,
  type Road,
} from '../road/schema.ts';
import { isStudioId, STUDIO_ROADS, studioRoad } from '../studio/roads.ts';
import { REGIONS, type Region } from './reset.ts';
import { withMark, type Mark, type Marks } from './walk.ts';

// What the website keeps in the browser (design doc, Amendment 1): the roads the player imported,
// the active one, progress by road id and step id, the region, and the last visit for the recap.
// Studio roads ship with the site and are never stored.

const markSchema = z.object({ state: z.enum(['done', 'skipped']), at: z.int().min(0) });

export const SAVED_VERSION = 1;

export const savedSchema = z
  .object({
    v: z.literal(SAVED_VERSION),
    region: z.enum(REGIONS).optional(),
    active: roadIdSchema.optional(),
    library: z.array(roadSchema).max(50),
    progress: z.record(roadIdSchema, z.record(stepIdSchema, markSchema)),
    lastVisit: z.int().min(0).optional(),
  })
  .refine(
    (saved) => new Set(saved.library.map((road) => road.id)).size === saved.library.length,
    'a road is in the library once',
  )
  .refine(
    (saved) => saved.library.every((road) => !road.id.startsWith(STUDIO_PREFIX)),
    'studio roads are never stored',
  );
export type Saved = z.infer<typeof savedSchema>;

export const EMPTY: Saved = { v: SAVED_VERSION, library: [], progress: {} };

// A studio road by its id, or one of the player's own roads.
export function findRoad(saved: Saved, id: string | undefined): Road | undefined {
  if (id === undefined) return undefined;
  return isStudioId(id) ? studioRoad(id) : saved.library.find((road) => road.id === id);
}

// The roads the player has: the studio roads they walk or have ticked a step of, then their own.
export function yourRoads(saved: Saved): Road[] {
  const started = STUDIO_ROADS.map((studio) => studio.road).filter(
    (road) => road.id === saved.active || Object.keys(saved.progress[road.id] ?? {}).length > 0,
  );
  return [...started, ...saved.library];
}

export function marksOf(saved: Saved, id: string): Marks {
  return saved.progress[id] ?? {};
}

export type ImportOutcome =
  | { kind: 'added'; saved: Saved }
  // The same road at a higher rev: the player confirms, then `replaceRoad`.
  | { kind: 'newer'; current: Road }
  | { kind: 'same'; saved: Saved }
  | { kind: 'older'; current: Road };

// Importing makes a road the active one. Switching never touches another road's progress, so its
// weekly lock stays as it was.
export function importRoad(saved: Saved, road: Road): ImportOutcome {
  const current = findRoad(saved, road.id);
  if (!current) {
    return {
      kind: 'added',
      saved: { ...saved, library: [...saved.library, road], active: road.id },
    };
  }
  if (road.rev > current.rev) return { kind: 'newer', current };
  if (road.rev === current.rev) return { kind: 'same', saved: { ...saved, active: road.id } };
  return { kind: 'older', current };
}

// A newer rev replaces the road and keeps every mark: steps that still exist keep their progress,
// and the stage lock follows from the kept marks, so re-importing cannot skip a weekly lock.
export function replaceRoad(saved: Saved, road: Road): Saved {
  return {
    ...saved,
    library: saved.library.map((old) => (old.id === road.id ? road : old)),
    active: road.id,
  };
}

export function activate(saved: Saved, id: string): Saved {
  return findRoad(saved, id) ? { ...saved, active: id } : saved;
}

// Removing keeps the road's progress, so pasting its code again continues where it stopped.
export function removeRoad(saved: Saved, id: string): Saved {
  return {
    ...saved,
    library: saved.library.filter((road) => road.id !== id),
    active: saved.active === id ? undefined : saved.active,
  };
}

export function markStep(
  saved: Saved,
  roadId: string,
  stepId: string,
  state: Mark['state'] | null,
  now: number,
): Saved {
  const marks = withMark(marksOf(saved, roadId), stepId, state, now);
  return { ...saved, progress: { ...saved.progress, [roadId]: marks } };
}

export function setRegion(saved: Saved, region: Region): Saved {
  return { ...saved, region };
}
