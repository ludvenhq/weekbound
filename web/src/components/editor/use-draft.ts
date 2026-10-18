'use client';

import { useSyncExternalStore } from 'react';
import { draftSchema, newDraft, type Draft } from '@/lib/editor/draft';

// The road being made, kept in localStorage so a reload or a closed tab loses nothing, and in
// step with other tabs. When the browser refuses storage, the draft lasts for the open tab.

const KEY = 'slow-road:editor';

let fallback: string | null | undefined;
let cache: { raw: string | null; draft: Draft } | undefined;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  if (fallback !== undefined) return fallback;
  try {
    return localStorage.getItem(KEY);
  } catch {
    fallback = null;
    return null;
  }
}

function snapshot(): Draft {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.draft;
  let draft: Draft | undefined;
  if (raw !== null) {
    try {
      const parsed = draftSchema.safeParse(JSON.parse(raw));
      if (parsed.success) draft = parsed.data;
    } catch {
      // A broken save starts a new road.
    }
  }
  cache = { raw, draft: draft ?? newDraft() };
  return cache.draft;
}

// The draft as it is now, for an action that runs before the page has drawn the last change.
export function currentDraft(): Draft {
  return snapshot();
}

export function updateDraft(change: (draft: Draft) => Draft) {
  const draft = change(snapshot());
  const next = JSON.stringify(draft);
  // The page keeps the object it made rather than reading it back, so steps that did not change
  // stay the same objects and their rows are not drawn again.
  cache = { raw: next, draft };
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

// Null while the server renders and during hydration: the draft exists only in the browser.
export function useDraft(): Draft | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
