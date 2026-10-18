'use client';

import { useEffect, useState } from 'react';

// Whether this server has a Blizzard client, so Road Check and the editor's search can show.
// Asked once per page load; until the answer comes, and when it fails, they stay hidden.
let known: Promise<boolean> | null = null;

function ask(): Promise<boolean> {
  known ??= fetch('/api/check')
    .then((response) => response.json())
    .then((data: { enabled?: unknown }) => data.enabled === true)
    .catch(() => false);
  return known;
}

export function useBlizzard(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let live = true;
    void ask().then((value) => live && setEnabled(value));
    return () => {
      live = false;
    };
  }, []);
  return enabled;
}
