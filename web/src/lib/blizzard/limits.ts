// The guards around Blizzard's API (design doc, Server; review concern R3-17). Blizzard allows an
// app 100 requests a second and 36,000 an hour; Road Check stays well under both for the whole
// site, so a spike from a clip or a Reddit post shows "Blizzard is busy" instead of breaking the
// client. Each visitor also gets a few checks a minute. Everything lives in the server's memory:
// one container, nothing stored.

// At most `limit` events in any `windowMs`, counted in fixed slices of the window.
export class Window {
  private stamps: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  fits(now: number, count = 1): boolean {
    const from = now - this.windowMs;
    while (this.stamps.length > 0 && this.stamps[0]! <= from) this.stamps.shift();
    return this.stamps.length + count <= this.limit;
  }

  // Takes `count` events now if they fit; false (and nothing taken) when they do not.
  take(now: number, count = 1): boolean {
    if (!this.fits(now, count)) return false;
    for (let i = 0; i < count; i++) this.stamps.push(now);
    return true;
  }
}

// For the whole site: 40 requests a second and 30,000 an hour.
export class AppLimit {
  private readonly second = new Window(40, 1_000);
  private readonly hour = new Window(30_000, 3_600_000);

  take(now: number, count: number): boolean {
    if (!this.second.fits(now, count) || !this.hour.fits(now, count)) return false;
    this.second.take(now, count);
    this.hour.take(now, count);
    return true;
  }
}

// For each visitor: `limit` checks a minute, keyed by address, with old keys dropped.
export class VisitorLimit {
  private readonly windows = new Map<string, Window>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(limit = 6, windowMs = 60_000, maxKeys = 5_000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  take(key: string, now: number): boolean {
    let window = this.windows.get(key);
    if (!window) {
      if (this.windows.size >= this.maxKeys) this.windows.clear();
      window = new Window(this.limit, this.windowMs);
      this.windows.set(key, window);
    }
    return window.take(now);
  }
}

// A small cache that forgets: at most `max` entries, each for `ttlMs`, the oldest dropped first.
export class Cache<T> {
  private readonly entries = new Map<string, { value: T; until: number }>();
  private readonly max: number;
  private readonly ttlMs: number;

  constructor(max: number, ttlMs: number) {
    this.max = max;
    this.ttlMs = ttlMs;
  }

  get(key: string, now: number): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.until <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, now: number) {
    this.entries.delete(key);
    if (this.entries.size >= this.max) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, until: now + this.ttlMs });
  }
}
