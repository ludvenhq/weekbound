import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckRequest } from './character.ts';

// The facts fetcher against a stubbed Blizzard: no network. Each test loads the modules fresh, so
// the token and the caches start empty.

type Route = { status: number; body?: unknown };

function stubBlizzard(routes: Record<string, Route | (() => Route)>) {
  const calls: string[] = [];
  const fetchStub = vi.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    if (url.hostname === 'oauth.battle.net') {
      return Response.json({ access_token: 'token', token_type: 'bearer', expires_in: 86_399 });
    }
    const route = routes[url.pathname];
    const found = typeof route === 'function' ? route() : route;
    if (!found) return new Response('{}', { status: 404 });
    return Response.json(found.body ?? {}, { status: found.status });
  });
  vi.stubGlobal('fetch', fetchStub);
  return calls;
}

async function load() {
  vi.resetModules();
  return import('./facts.ts');
}

const BASE = '/profile/wow/character/silvermoon/ilvaeth';
const request: CheckRequest = {
  region: 'eu',
  realm: 'silvermoon',
  name: 'Ilvaeth',
  kinds: ['summary', 'mythic', 'pvp', 'achievements', 'reputations', 'mounts'],
};

beforeEach(() => {
  vi.stubEnv('BLIZZARD_CLIENT_ID', 'id');
  vi.stubEnv('BLIZZARD_CLIENT_SECRET', 'secret');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('reading a character', () => {
  it('reads each kind of fact, and counts a missing bracket or season as none', async () => {
    const calls = stubBlizzard({
      [BASE]: {
        status: 200,
        body: {
          name: 'Ilvaeth',
          level: 90,
          equipped_item_level: 271,
          last_login_timestamp: 1_760_000_000_000,
          realm: { name: 'Silvermoon', slug: 'silvermoon' },
        },
      },
      [`${BASE}/mythic-keystone-profile`]: {
        status: 200,
        body: { current_mythic_rating: { rating: 1234.5 } },
      },
      [`${BASE}/pvp-bracket/2v2`]: { status: 200, body: { rating: 1480 } },
      [`${BASE}/achievements`]: {
        status: 200,
        body: {
          achievements: [{ id: 41802, completed_timestamp: 1_750_000_000_000 }, { id: 42045 }],
        },
      },
      [`${BASE}/reputations`]: {
        status: 200,
        body: {
          reputations: [
            { faction: { id: 2710 }, standing: { tier: 0, renown_level: 7, name: 'Renown 7' } },
            { faction: { id: 2696 }, standing: { tier: 1, name: 'Renown 12' } },
            { faction: { id: 72 }, standing: { tier: 7, name: 'Exalted' } },
          ],
        },
      },
      [`${BASE}/collections/mounts`]: {
        status: 200,
        body: { mounts: [{ mount: { id: 3043 } }, { mount: { id: 6 } }] },
      },
    });
    const { characterFacts } = await load();
    const reply = await characterFacts(request);
    expect(reply).toEqual({
      ok: true,
      character: { name: 'Ilvaeth', realm: 'Silvermoon', level: 90, lastLogout: 1_760_000_000_000 },
      facts: {
        itemLevel: 271,
        mythicRating: 1234.5,
        pvp: { '2v2': 1480, '3v3': 0, rbg: 0 },
        achievements: [41802],
        quests: [],
        renown: { '2710': 7, '2696': 12, '72': 7 },
        mounts: [3043, 6],
        titles: [],
      },
    });
    // One token for every call, and nothing the road did not ask for.
    expect(calls.filter((path) => path === '/token')).toHaveLength(1);
    expect(calls).not.toContain(`${BASE}/titles`);
  });

  it('says a character it cannot see is not found', async () => {
    stubBlizzard({});
    const { characterFacts } = await load();
    expect(await characterFacts({ ...request, kinds: ['summary'] })).toEqual({
      ok: false,
      error: 'not-found',
    });
  });

  it('retries a busy Blizzard once, then says busy', async () => {
    let tries = 0;
    stubBlizzard({
      [BASE]: () => {
        tries++;
        return { status: 503 };
      },
    });
    const { characterFacts } = await load();
    expect(await characterFacts({ ...request, kinds: ['summary'] })).toEqual({
      ok: false,
      error: 'busy',
    });
    expect(tries).toBe(2);
  });

  it('keeps a character in memory, so a second check asks Blizzard nothing', async () => {
    const calls = stubBlizzard({ [BASE]: { status: 200, body: { equipped_item_level: 250 } } });
    const { characterFacts } = await load();
    await characterFacts({ ...request, kinds: ['summary'] });
    const before = calls.length;
    await characterFacts({ ...request, kinds: ['summary'] });
    expect(calls.length).toBe(before);
  });

  it('says not configured without a client', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('BLIZZARD_CLIENT_ID', '');
    stubBlizzard({});
    const { blizzardGet } = await import('./client.ts');
    expect(await blizzardGet('eu', BASE, 'profile')).toEqual({ status: 'not-configured' });
  });
});
