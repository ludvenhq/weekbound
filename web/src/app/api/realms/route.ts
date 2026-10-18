import { z } from 'zod';
import { realmList } from '@/lib/blizzard/realms';
import { REGIONS } from '@/lib/walk/reset';

// The realms of a region, for Road Check's realm field (lib/blizzard/realms.ts).

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const region = z.enum(REGIONS).safeParse(new URL(request.url).searchParams.get('region'));
  if (!region.success) return Response.json({ realms: [] }, { status: 400 });
  const realms = await realmList(region.data);
  return Response.json(
    { realms: realms ?? [] },
    { headers: { 'Cache-Control': realms ? 'public, max-age=3600' : 'no-store' } },
  );
}
