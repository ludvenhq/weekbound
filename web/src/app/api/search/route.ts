import { z } from 'zod';
import { searchGame, SEARCH_KINDS } from '@/lib/blizzard/search';
import { visitorKey, VisitorLimit } from '@/lib/blizzard/limits';

// The editor's search by name (design doc, Editor): achievements, mounts, titles and factions
// from the Game Data API, held in the server's memory for a day rather than committed to the
// repository. Answers at most 12 matches.

export const dynamic = 'force-dynamic';

const visitors = new VisitorLimit(60, 60_000);

const querySchema = z.object({
  kind: z.enum(SEARCH_KINDS),
  q: z.string().trim().min(2).max(60),
});

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({ kind: params.get('kind'), q: params.get('q') });
  if (!parsed.success) return Response.json({ results: [] }, { status: 400 });
  const who = visitorKey(request);
  if (!visitors.take(who, Date.now())) return Response.json({ results: [] }, { status: 429 });
  const results = await searchGame(parsed.data.kind, parsed.data.q);
  return Response.json(
    { results: results ?? [], ...(results === null ? { unavailable: true } : {}) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
