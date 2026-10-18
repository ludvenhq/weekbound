// Weekly resets, both fixed in UTC, so neither European nor American summer time moves them:
// EU on Wednesday at 04:00 UTC (05:00 CET, 06:00 CEST), the Americas and Oceania on Tuesday at
// 15:00 UTC. Checked 2026-10-18 against a July 2026 reset tracker and Blizzard's move of the EU
// reset; the owner confirms in game with /run print(C_DateAndTime.GetSecondsUntilWeeklyReset()).

export const REGIONS = ['eu', 'us'] as const;
export type Region = (typeof REGIONS)[number];

export const RESETS: Record<Region, { weekday: number; hour: number; day: string; name: string }> =
  {
    eu: { weekday: 3, hour: 4, day: 'Wednesday', name: 'EU' },
    us: { weekday: 2, hour: 15, day: 'Tuesday', name: 'US' },
  };

export const DAY = 86_400_000;
export const WEEK = 7 * DAY;

// The first reset strictly after `after`.
export function nextReset(after: number, region: Region): number {
  const { weekday, hour } = RESETS[region];
  const date = new Date(after);
  const sameDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour);
  const candidate = sameDay + ((weekday - date.getUTCDay() + 7) % 7) * DAY;
  return candidate > after ? candidate : candidate + WEEK;
}

// The latest reset at or before `at`: the start of the game week `at` falls in.
export function lastReset(at: number, region: Region): number {
  return nextReset(at, region) - WEEK;
}

// Americas and Oceania realms reset on Tuesday; everyone else is taken to play on EU realms.
export function guessRegion(timeZone: string | undefined): Region {
  if (!timeZone) return 'eu';
  return /^(America|US|Canada|Brazil|Chile|Mexico|Australia|Pacific)\//.test(timeZone)
    ? 'us'
    : 'eu';
}
