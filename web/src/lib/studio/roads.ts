import { z } from 'zod';
import collectors from '../../../../roads/sr-collectors-mile.json' with { type: 'json' };
import firstSteps from '../../../../roads/sr-first-steps-in-rated-pvp.json' with { type: 'json' };
import returning from '../../../../roads/sr-returning-player.json' with { type: 'json' };
import ladder from '../../../../roads/sr-season-pve-ladder.json' with { type: 'json' };
import longSeason from '../../../../roads/sr-the-long-season.json' with { type: 'json' };
import { roadSchema, STUDIO_PREFIX, type Road } from '../road/schema.ts';

// The studio's roads, one file each in roads/ (roads/README.md). They ship with the site: players
// walk them by id, a pasted code may not carry their reserved `sr-` ids, and they are never stored
// with the player's own roads. Every file is checked when the site loads it, so a broken road
// fails the build and the tests, never a player.

export const studioFileSchema = z.strictObject({
  summary: z.string().min(1).max(80),
  about: z.string().min(1).max(600),
  season: z.string().min(1).max(80),
  checked: z.iso.date(),
  road: roadSchema.refine(
    (road) => road.id.startsWith(STUDIO_PREFIX),
    'a studio road id starts with sr-',
  ),
});

export type StudioRoad = z.infer<typeof studioFileSchema> & {
  // The road page's address, /roads/<slug>: the id without its prefix.
  slug: string;
};

// The gallery's order.
const FILES: readonly unknown[] = [returning, longSeason, firstSteps, ladder, collectors];

export const STUDIO_ROADS: readonly StudioRoad[] = FILES.map((file) => {
  const parsed = studioFileSchema.parse(file);
  return { ...parsed, slug: parsed.road.id.slice(STUDIO_PREFIX.length) };
});

export function studioRoad(id: string): Road | undefined {
  return STUDIO_ROADS.find((studio) => studio.road.id === id)?.road;
}

export function studioBySlug(slug: string): StudioRoad | undefined {
  return STUDIO_ROADS.find((studio) => studio.slug === slug);
}

export function isStudioId(id: string): boolean {
  return id.startsWith(STUDIO_PREFIX);
}

// A studio road's page, or undefined for a road made in the editor, which has none.
export function roadPage(id: string): string | undefined {
  const studio = STUDIO_ROADS.find((each) => each.road.id === id);
  return studio && `/roads/${studio.slug}`;
}
