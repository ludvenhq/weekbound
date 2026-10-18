import { z } from 'zod';
import { blizzardGet } from './client.ts';
import { Cache } from './limits.ts';

// Search by name over Blizzard's game data indexes. Each index is fetched once a day into memory,
// never written to disk or to the repository (the Blizzard data stays Blizzard's, review concerns
// R3-27 and R3-38). Names are English.

export const SEARCH_KINDS = ['achievement', 'mount', 'title', 'faction'] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];
export type Found = { id: number; name: string };

const INDEXES: Record<SearchKind, { path: string; list: string }> = {
  achievement: { path: '/data/wow/achievement/index', list: 'achievements' },
  mount: { path: '/data/wow/mount/index', list: 'mounts' },
  title: { path: '/data/wow/title/index', list: 'titles' },
  faction: { path: '/data/wow/reputation-faction/index', list: 'factions' },
};

const entrySchema = z.object({
  id: z.number(),
  name: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
});

const cache = new Cache<Found[]>(SEARCH_KINDS.length, 24 * 3_600_000);
const loading = new Map<SearchKind, Promise<Found[] | null>>();

function nameOf(name: z.infer<typeof entrySchema>['name']): string | null {
  if (typeof name === 'string') return name;
  return name?.en_GB ?? name?.en_US ?? null;
}

async function load(kind: SearchKind): Promise<Found[] | null> {
  const { path, list } = INDEXES[kind];
  const reply = await blizzardGet<Record<string, unknown>>('eu', path, 'static');
  if (reply.status !== 'ok') return null;
  const parsed = z.array(entrySchema).safeParse(reply.data[list]);
  if (!parsed.success) return null;
  return parsed.data.flatMap((entry) => {
    const name = nameOf(entry.name);
    return name ? [{ id: entry.id, name }] : [];
  });
}

async function index(kind: SearchKind): Promise<Found[] | null> {
  const now = Date.now();
  const hit = cache.get(kind, now);
  if (hit) return hit;
  let pending = loading.get(kind);
  if (!pending) {
    pending = load(kind).finally(() => loading.delete(kind));
    loading.set(kind, pending);
  }
  const loaded = await pending;
  if (loaded) cache.set(kind, loaded, Date.now());
  return loaded;
}

const fold = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

// Up to `limit` entries whose name holds every word of the query; names that start with it first,
// then shorter names. Null when the index cannot be had (no Blizzard client, or Blizzard busy).
export function rank(entries: readonly Found[], query: string, limit = 12): Found[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const whole = fold(query).trim();
  return entries
    .map((entry) => ({ entry, name: fold(entry.name) }))
    .filter(({ name }) => words.every((word) => name.includes(word)))
    .sort(
      (a, b) =>
        Number(b.name.startsWith(whole)) - Number(a.name.startsWith(whole)) ||
        a.name.length - b.name.length ||
        b.entry.id - a.entry.id,
    )
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export async function searchGame(kind: SearchKind, query: string): Promise<Found[] | null> {
  const entries = await index(kind);
  return entries ? rank(entries, query) : null;
}
