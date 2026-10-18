import type { CheckReply } from '@/lib/check/api';
import { checkRequestSchema } from '@/lib/blizzard/character';
import { credentials } from '@/lib/blizzard/client';
import { characterFacts } from '@/lib/blizzard/facts';
import { VisitorLimit } from '@/lib/blizzard/limits';
import { resolveRealm } from '@/lib/blizzard/realms';

// Road Check's server (design doc, version 1.1). GET says whether this server has a Blizzard
// client; POST takes a region, realm, character name and the kinds of facts a road needs, and
// answers with those facts. Nothing about the visitor or the character is stored; the facts stay
// in memory for 15 minutes.

export const dynamic = 'force-dynamic';

const visitors = new VisitorLimit();

function reply(body: CheckReply, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function GET() {
  return Response.json(
    { enabled: credentials() !== null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// The visitor's address, as the web server in front passes it on.
function visitor(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'direct';
}

export async function POST(request: Request) {
  if (!credentials()) return reply({ ok: false, error: 'not-configured' }, 503);
  if (!visitors.take(visitor(request), Date.now())) {
    return reply({ ok: false, error: 'too-many' }, 429);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, error: 'bad-input' }, 400);
  }
  const parsed = checkRequestSchema.safeParse(body);
  if (!parsed.success) return reply({ ok: false, error: 'bad-input' }, 400);
  const realm = await resolveRealm(parsed.data.region, parsed.data.realm);
  const result = await characterFacts({ ...parsed.data, realm });
  return reply(result, result.ok ? 200 : result.error === 'not-found' ? 404 : 503);
}
