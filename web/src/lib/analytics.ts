// Anonymous counts with the studio's own Umami: no cookies, nothing personal, nothing shared. The
// tracker loads from a path on this site, which the web server in front passes on, so no page
// names another server. The path and the site id are public values in web/.env.production;
// without both no page loads the tracker and `track` does nothing.

export const analytics = {
  path: process.env.UMAMI_PATH || null,
  siteId: process.env.UMAMI_SITE_ID || null,
  // The tracker counts only on the real site, never on localhost or a preview.
  domain: 'weekbound.ludven.com',
};

// The few actions worth counting (design doc, Success Criteria: Road Check uses and code copies):
// a road started (a studio road by its id, a player's road only as "own"), a stage finished, a
// code copied, a remix opened, a check run.
export type TrackEvent = 'road-start' | 'stage-done' | 'code-copy' | 'remix-open' | 'road-check';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string | number>) => void };
  }
}

export function track(event: TrackEvent, data?: Record<string, string | number>) {
  try {
    window.umami?.track(event, data);
  } catch {
    // Counting never gets in the player's way.
  }
}

// What a road is called in the counts: a studio road by its id, any other road as "own".
export function roadLabel(id: string): string {
  return id.startsWith('sr-') ? id : 'own';
}
