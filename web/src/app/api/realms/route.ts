import { z } from 'zod';
import { blizzardGet } from '@/lib/blizzard/client';
import { Cache } from '@/lib/blizzard/limits';
import { REGIONS } from '@/lib/walk/reset';

// The realms of a region, for Road Check's realm field: names and slugs from the Game Data API,
// kept in memory for a day.

export const dynamic = 'force-dynamic';

const cache = new Cache<{ name: string; slug: string }[]>(4, 24 * 3_600_000);

const indexSchema = z.object({
  realms: z.array(
    z.object({
      slug: z.string(),
      name: z.union([z.string(), z.record(z.string(), z.string())]),
    }),
  ),
});

export async function GET(request: Request) {
  const region = z.enum(REGIONS).safeParse(new URL(request.url).searchParams.get('region'));
  if (!region.success) return Response.json({ realms: [] }, { status: 400 });
  const now = Date.now();
  let realms = cache.get(region.data, now);
  if (!realms) {
    const reply = await blizzardGet(region.data, '/data/wow/realm/index', 'dynamic');
    const parsed = reply.status === 'ok' ? indexSchema.safeParse(reply.data) : null;
    if (!parsed?.success) return Response.json({ realms: [] });
    realms = parsed.data.realms
      .map((realm) => ({
        slug: realm.slug,
        name:
          typeof realm.name === 'string'
            ? realm.name
            : (realm.name.en_GB ?? realm.name.en_US ?? realm.slug),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    cache.set(region.data, realms, now);
  }
  return Response.json({ realms }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
