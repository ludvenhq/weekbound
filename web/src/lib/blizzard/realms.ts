import { z } from 'zod';
import type { Region } from '../walk/reset.ts';
import { realmSlug } from './character.ts';
import { blizzardGet } from './client.ts';
import { Cache } from './limits.ts';

// A region's realms from the Game Data API, held in memory for a day: names for the realm field,
// and the real slug for what a visitor typed. Blizzard's slugs are not always the name made
// lowercase (Russian realms have English slugs), so the list decides when it can be had.

export type Realm = { name: string; slug: string };

const cache = new Cache<Realm[]>(4, 24 * 3_600_000);

const indexSchema = z.object({
  realms: z.array(
    z.object({
      slug: z.string(),
      name: z.union([z.string(), z.record(z.string(), z.string())]).nullish(),
    }),
  ),
});

export async function realmList(region: Region): Promise<Realm[] | null> {
  const now = Date.now();
  const hit = cache.get(region, now);
  if (hit) return hit;
  const reply = await blizzardGet(region, '/data/wow/realm/index', 'dynamic');
  const parsed = reply.status === 'ok' ? indexSchema.safeParse(reply.data) : null;
  if (!parsed?.success) return null;
  const realms = parsed.data.realms
    .map((realm) => ({
      slug: realm.slug,
      name:
        typeof realm.name === 'string'
          ? realm.name
          : (realm.name?.en_GB ?? realm.name?.en_US ?? realm.slug),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  cache.set(region, realms, now);
  return realms;
}

// The slug for what a visitor typed, already made into a slug by `realmSlug`: the list's own slug
// when a realm's name or slug matches, otherwise the typed one as it is.
export async function resolveRealm(region: Region, typed: string): Promise<string> {
  const realms = await realmList(region);
  const found = realms?.find((realm) => realm.slug === typed || realmSlug(realm.name) === typed);
  return found?.slug ?? typed;
}
