import type { Region } from '../walk/reset.ts';
import { AppLimit } from './limits.ts';

// Calls to Blizzard's API from the server only (design doc, Server). The client id and secret
// come from the environment, never from the repo, the image or the browser; the app token they
// buy is kept in memory until shortly before it expires. Every call has a timeout, goes through
// the site-wide limit, and is retried once after a pause when Blizzard is busy; the page never
// retries in a loop.

export type Reply<T> =
  | { status: 'ok'; data: T }
  | { status: 'not-found' }
  | { status: 'busy' }
  | { status: 'not-configured' };

const TOKEN_URL = 'https://oauth.battle.net/token';
const HOSTS: Record<Region, string> = {
  eu: 'https://eu.api.blizzard.com',
  us: 'https://us.api.blizzard.com',
};
const LOCALES: Record<Region, string> = { eu: 'en_GB', us: 'en_US' };
const TIMEOUT_MS = 8_000;
const RETRY_AFTER_MS = 600;

type Credentials = { id: string; secret: string };

export function credentials(): Credentials | null {
  const id = process.env.BLIZZARD_CLIENT_ID?.trim();
  const secret = process.env.BLIZZARD_CLIENT_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

const limit = new AppLimit();
let token: { value: string; until: number } | null = null;
// One token request at a time: calls that arrive while it runs wait for the same answer.
let buying: Promise<string> | null = null;

async function appToken(now: number): Promise<string | null> {
  if (token && token.until > now) return token.value;
  const creds = credentials();
  if (!creds) return null;
  buying ??= buyToken(creds, now).finally(() => {
    buying = null;
  });
  return buying;
}

async function buyToken(creds: Credentials, now: number): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`token request answered ${response.status}`);
  const data = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof data.access_token !== 'string') throw new Error('token response has no token');
  const seconds = typeof data.expires_in === 'number' ? data.expires_in : 3_600;
  // Renewed a few minutes early, so no call goes out with a token about to lapse.
  token = { value: data.access_token, until: now + Math.max(60, seconds - 300) * 1_000 };
  return token.value;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// GET a path on the region's API with a namespace such as `profile` or `static`.
export async function blizzardGet<T = unknown>(
  region: Region,
  path: string,
  namespace: 'profile' | 'static' | 'dynamic',
): Promise<Reply<T>> {
  if (!credentials()) return { status: 'not-configured' };
  const url = new URL(path, HOSTS[region]);
  url.searchParams.set('namespace', `${namespace}-${region}`);
  url.searchParams.set('locale', LOCALES[region]);

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await pause(RETRY_AFTER_MS);
    const now = Date.now();
    if (!limit.take(now, 1)) return { status: 'busy' };
    try {
      const bearer = await appToken(now);
      if (!bearer) return { status: 'not-configured' };
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${bearer}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      });
      if (response.status === 404) return { status: 'not-found' };
      if (response.status === 401) {
        // The token was revoked or has lapsed early: buy a new one on the retry.
        token = null;
        continue;
      }
      if (response.status === 429 || response.status >= 500) continue;
      if (!response.ok) return { status: 'not-found' };
      return { status: 'ok', data: (await response.json()) as T };
    } catch {
      // A timeout or a network error: one more try, then "busy".
    }
  }
  return { status: 'busy' };
}
