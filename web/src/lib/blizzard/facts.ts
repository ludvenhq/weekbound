import { z } from 'zod';
import type { CheckReply } from '../check/api.ts';
import type { FactKind, Facts } from '../check/check.ts';
import { characterKey, characterPath, type CheckRequest } from './character.ts';
import { blizzardGet, type Reply } from './client.ts';
import { Cache } from './limits.ts';

// A character's facts from the Profile API, one endpoint per kind of fact, read loosely: a
// missing field is "none", never an error, and anything Blizzard adds is ignored. Only the facts
// a check needs are kept in memory (review concern R3-17), for 15 minutes, at most 2,000 entries.

const CACHE_MS = 15 * 60_000;
const cache = new Cache<Partial<Facts> & { summary?: Summary }>(2_000, CACHE_MS);

const ids = (list: { id: number }[] | undefined) => (list ?? []).map((entry) => entry.id);
const name = z.union([z.string(), z.record(z.string(), z.string())]).optional();

const summarySchema = z.object({
  name: z.string().optional(),
  level: z.number().optional(),
  equipped_item_level: z.number().optional(),
  last_login_timestamp: z.number().optional(),
  realm: z.object({ name, slug: z.string().optional() }).optional(),
});
type Summary = { name: string; realm: string; level: number | null; lastLogout: number | null };

const mythicSchema = z.object({
  current_mythic_rating: z.object({ rating: z.number().optional() }).optional(),
});
const bracketSchema = z.object({
  rating: z.number().optional(),
  season: z.object({ id: z.number() }).optional(),
});

// The PvP season now under way, from the Game Data API, held for an hour.
const seasonCache = new Cache<number>(4, 3_600_000);
const seasonIndexSchema = z.object({ current_season: z.object({ id: z.number() }) });

async function currentPvpSeason(region: CheckRequest['region']): Promise<number | null> {
  const hit = seasonCache.get(region, Date.now());
  if (hit !== undefined) return hit;
  const reply = await blizzardGet(region, '/data/wow/pvp-season/index', 'dynamic');
  const parsed = reply.status === 'ok' ? seasonIndexSchema.safeParse(reply.data) : null;
  if (!parsed?.success) return null;
  seasonCache.set(region, parsed.data.current_season.id, Date.now());
  return parsed.data.current_season.id;
}
const achievementsSchema = z.object({
  achievements: z
    .array(z.object({ id: z.number(), completed_timestamp: z.number().optional() }))
    .optional(),
});
const questsSchema = z.object({ quests: z.array(z.object({ id: z.number() })).optional() });
const reputationsSchema = z.object({
  reputations: z
    .array(
      z.object({
        faction: z.object({ id: z.number() }),
        standing: z
          .object({
            tier: z.number().optional(),
            renown_level: z.number().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});
const mountsSchema = z.object({
  mounts: z.array(z.object({ mount: z.object({ id: z.number() }) })).optional(),
});
const titlesSchema = z.object({ titles: z.array(z.object({ id: z.number() })).optional() });

function text(value: z.infer<typeof name>): string | undefined {
  if (typeof value === 'string') return value;
  return value?.en_GB ?? value?.en_US;
}

type Standing = { tier?: number; renown_level?: number } | undefined;

// The renown level of a major faction (`renown_level`, which renown factions have in place of
// `tier`), or the standing tier of an older one. The standing's name is never parsed.
export function renownOf(standing: Standing): number {
  return standing?.renown_level ?? standing?.tier ?? 0;
}

type Got<T> = { status: 'ok'; value: T } | { status: 'none' } | { status: 'busy' | 'gone' };

// One endpoint, parsed. "none" is a 404 or a shape we cannot read; "gone" is reserved for the
// summary, where a 404 means the character cannot be seen.
async function get<T>(
  request: CheckRequest,
  suffix: string,
  schema: z.ZodType<T>,
): Promise<Got<T>> {
  const reply: Reply<unknown> = await blizzardGet(
    request.region,
    `${characterPath(request)}${suffix}`,
    'profile',
  );
  if (reply.status === 'busy' || reply.status === 'not-configured') return { status: 'busy' };
  if (reply.status === 'not-found') return { status: 'none' };
  const parsed = schema.safeParse(reply.data);
  return parsed.success ? { status: 'ok', value: parsed.data } : { status: 'none' };
}

type Part = Partial<Facts> & { summary?: Summary };

async function fetchKind(request: CheckRequest, kind: FactKind): Promise<Part | 'busy' | 'gone'> {
  switch (kind) {
    case 'summary': {
      const got = await get(request, '', summarySchema);
      if (got.status === 'busy') return 'busy';
      if (got.status !== 'ok') return 'gone';
      const data = got.value;
      return {
        itemLevel: data.equipped_item_level ?? null,
        summary: {
          name: data.name ?? request.name,
          realm: text(data.realm?.name) ?? request.realm,
          level: data.level ?? null,
          lastLogout: data.last_login_timestamp ?? null,
        },
      };
    }
    case 'mythic': {
      const got = await get(request, '/mythic-keystone-profile', mythicSchema);
      if (got.status === 'busy') return 'busy';
      return {
        mythicRating: got.status === 'ok' ? (got.value.current_mythic_rating?.rating ?? 0) : 0,
      };
    }
    case 'pvp': {
      // A bracket last played in an earlier season still answers with that season's rating, so
      // a rating counts only when its season is the current one; when the current season cannot
      // be had, no rating counts, rather than a stale one ticking a step.
      const brackets = ['2v2', '3v3', 'rbg'] as const;
      const [season, ...got] = await Promise.all([
        currentPvpSeason(request.region),
        ...brackets.map((bracket) => get(request, `/pvp-bracket/${bracket}`, bracketSchema)),
      ]);
      if (got.some((each) => each.status === 'busy')) return 'busy';
      const rating = (i: number) => {
        const each = got[i]!;
        if (each.status !== 'ok' || season === null) return 0;
        return each.value.season?.id === season ? (each.value.rating ?? 0) : 0;
      };
      return { pvp: { '2v2': rating(0), '3v3': rating(1), rbg: rating(2) } };
    }
    case 'achievements': {
      const got = await get(request, '/achievements', achievementsSchema);
      if (got.status === 'busy') return 'busy';
      const done =
        got.status === 'ok'
          ? (got.value.achievements ?? []).filter((a) => a.completed_timestamp !== undefined)
          : [];
      return { achievements: ids(done) };
    }
    case 'quests': {
      const got = await get(request, '/quests/completed', questsSchema);
      if (got.status === 'busy') return 'busy';
      return { quests: got.status === 'ok' ? ids(got.value.quests) : [] };
    }
    case 'reputations': {
      const got = await get(request, '/reputations', reputationsSchema);
      if (got.status === 'busy') return 'busy';
      const renown: Record<string, number> = {};
      if (got.status === 'ok') {
        for (const entry of got.value.reputations ?? []) {
          renown[String(entry.faction.id)] = renownOf(entry.standing);
        }
      }
      return { renown };
    }
    case 'mounts': {
      const got = await get(request, '/collections/mounts', mountsSchema);
      if (got.status === 'busy') return 'busy';
      return {
        mounts: got.status === 'ok' ? (got.value.mounts ?? []).map((m) => m.mount.id) : [],
      };
    }
    case 'titles': {
      const got = await get(request, '/titles', titlesSchema);
      if (got.status === 'busy') return 'busy';
      return { titles: got.status === 'ok' ? ids(got.value.titles) : [] };
    }
  }
}

const EMPTY: Facts = {
  itemLevel: null,
  mythicRating: 0,
  pvp: { '2v2': 0, '3v3': 0, rbg: 0 },
  achievements: [],
  quests: [],
  renown: {},
  mounts: [],
  titles: [],
};

// The facts a check asked for. The summary is always read: it says whether the character exists
// and when the data is from.
export async function characterFacts(request: CheckRequest): Promise<CheckReply> {
  const key = characterKey(request);
  const now = Date.now();
  const kinds = [...new Set<FactKind>(['summary', ...request.kinds])];
  const parts = await Promise.all(
    kinds.map(async (kind) => {
      const hit = cache.get(`${key}:${kind}`, now);
      if (hit) return hit;
      const part = await fetchKind(request, kind);
      if (typeof part === 'object') cache.set(`${key}:${kind}`, part, Date.now());
      return part;
    }),
  );
  if (parts[0] === 'gone') return { ok: false, error: 'not-found' };
  if (parts.some((part) => part === 'busy' || part === 'gone')) return { ok: false, error: 'busy' };
  const merged = Object.assign({}, ...parts) as Part;
  const { summary, ...facts } = merged;
  return {
    ok: true,
    character: summary ?? {
      name: request.name,
      realm: request.realm,
      level: null,
      lastLogout: null,
    },
    facts: { ...EMPTY, ...facts },
  };
}
