'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { EMPTY, savedSchema, type Saved } from '@/lib/walk/saved';

// The player's roads and progress in localStorage, shared by every component on the page and
// kept in step with other tabs. When the browser refuses storage (a private window, blocked site
// data), everything still works for the open tab and `stored` says so.

const KEY = 'slow-road';
// A save this version cannot read is copied here once before anything overwrites it.
const UNREADABLE_KEY = 'slow-road:unreadable';

export type Snapshot = { saved: Saved; stored: boolean };

let fallback: string | null | undefined;
let cache: { raw: string | null; snapshot: Snapshot } | undefined;
const listeners = new Set<() => void>();

function readRaw(): { raw: string | null; stored: boolean } {
  if (fallback !== undefined) return { raw: fallback, stored: false };
  try {
    return { raw: localStorage.getItem(KEY), stored: true };
  } catch {
    fallback = null;
    return { raw: null, stored: false };
  }
}

function keepUnreadable(raw: string) {
  try {
    if (localStorage.getItem(UNREADABLE_KEY) === null) localStorage.setItem(UNREADABLE_KEY, raw);
  } catch {
    // Nothing more can be done without storage.
  }
}

function snapshot(): Snapshot {
  const { raw, stored } = readRaw();
  if (cache && cache.raw === raw && cache.snapshot.stored === stored) return cache.snapshot;
  let saved = EMPTY;
  if (raw !== null) {
    let data: unknown = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // Falls through to the schema, which refuses null.
    }
    const parsed = savedSchema.safeParse(data);
    if (parsed.success) saved = parsed.data;
    else keepUnreadable(raw);
  }
  cache = { raw, snapshot: { saved, stored } };
  return cache.snapshot;
}

export function updateSaved(change: (saved: Saved) => Saved) {
  const next = JSON.stringify(change(snapshot().saved));
  if (fallback === undefined) {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      fallback = next;
    }
  } else {
    fallback = next;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

// Null while the server renders and during hydration: progress exists only in the browser.
export function useSaved(): Snapshot | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

// The clock My road works from. It moves every half minute, so camp lifts at the reset without a
// reload, and jumps to the moment of every action the player takes.
export function useNow(): [number, (at: number) => void] {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return [now, setNow];
}
