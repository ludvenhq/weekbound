import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildRoad, remixDraft } from '../editor/draft.ts';
import { decodeRoad, encodeRoad, MAX_CODE_BYTES } from '../road/code.ts';
import { EMPTY, activate, findRoad, markStep, savedSchema, yourRoads } from '../walk/saved.ts';
import { position } from '../walk/walk.ts';
import { roadPage, STUDIO_ROADS, studioBySlug, studioFileSchema, studioRoad } from './roads.ts';

const folder = resolve(import.meta.dirname, '../../../../roads');
const files = readdirSync(folder)
  .filter((file) => file.endsWith('.json'))
  .sort();

describe('the studio road files', () => {
  it('are all on the site, each named after its id', () => {
    expect(STUDIO_ROADS.map((studio) => `${studio.road.id}.json`).sort()).toEqual(files);
  });

  it.each(files)('%s passes the schema with an sr- id', (file) => {
    const parsed = studioFileSchema.safeParse(
      JSON.parse(readFileSync(resolve(folder, file), 'utf8')),
    );
    expect(parsed.success && parsed.data.road.id).toBe(file.replace(/\.json$/, ''));
  });

  // Review concern R3-36: the addon's import box takes 24 KB, so every studio road must fit one
  // code, even though a studio road travels by id rather than by code.
  it.each(STUDIO_ROADS.map((studio) => [studio.road.id, studio] as const))(
    "%s's code fits the 24 KB cap",
    (_id, studio) => {
      const encoded = encodeRoad(studio.road);
      expect(encoded.ok).toBe(true);
      if (encoded.ok) expect(encoded.code.length).toBeLessThanOrEqual(MAX_CODE_BYTES);
    },
  );

  it('have unique ids and page addresses', () => {
    expect(new Set(STUDIO_ROADS.map((studio) => studio.road.id)).size).toBe(STUDIO_ROADS.length);
    expect(new Set(STUDIO_ROADS.map((studio) => studio.slug)).size).toBe(STUDIO_ROADS.length);
  });

  it('cannot be pasted as a code', () => {
    for (const studio of STUDIO_ROADS) {
      const encoded = encodeRoad(studio.road);
      expect(encoded.ok && decodeRoad(encoded.code)).toMatchObject({
        ok: false,
        error: 'reserved-id',
      });
    }
  });

  it('are found by id and by page address', () => {
    const first = STUDIO_ROADS[0]!;
    expect(studioRoad(first.road.id)).toBe(first.road);
    expect(studioBySlug(first.slug)).toBe(first);
    expect(roadPage(first.road.id)).toBe(`/roads/${first.slug}`);
    expect(studioRoad('sr-no-such-road')).toBeUndefined();
    expect(roadPage('p-a-road-abc123')).toBeUndefined();
  });
});

describe('walking a studio road', () => {
  const studio = STUDIO_ROADS[0]!.road;
  const firstStep = studio.stages[0]!.steps[0]!.id;

  it('makes it the active road without storing it', () => {
    const saved = activate(EMPTY, studio.id);
    expect(saved.active).toBe(studio.id);
    expect(saved.library).toEqual([]);
    expect(findRoad(saved, studio.id)).toBe(studio);
    expect(savedSchema.safeParse(saved).success).toBe(true);
  });

  it('lists it under your roads while active or once a step is marked', () => {
    expect(yourRoads(EMPTY)).toEqual([]);
    expect(yourRoads(activate(EMPTY, studio.id))).toEqual([studio]);
    const ticked = markStep(EMPTY, studio.id, firstStep, 'done', 1);
    expect(yourRoads(ticked)).toEqual([studio]);
    expect(position(studio, ticked.progress[studio.id]!, 'eu', 2).kind).not.toBe('complete');
  });

  it('remixes into a road of its own that names the studio road', () => {
    const road = buildRoad(remixDraft(studio, 'A player'));
    expect(road.id).toMatch(/^p-/);
    expect(road.basedOn).toEqual({ id: studio.id, rev: studio.rev, author: studio.author });
    const encoded = encodeRoad(road);
    expect(encoded.ok && decodeRoad(encoded.code).ok).toBe(true);
  });
});
