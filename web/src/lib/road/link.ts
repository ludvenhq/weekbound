// Roads in links. A code travels as /my-road#road=SR1!…: the editor hands a road to My road this
// way, and a player can share one. A studio road travels by its id: /my-road#walk=sr-… starts it,
// and /editor#remix=sr-… opens a remix of it. The part after # never reaches a server.

const ROAD = '#road=';
const WALK = '#walk=';
const REMIX = '#remix=';

export function roadLink(code: string): string {
  return `/my-road${ROAD}${code}`;
}

export function walkLink(id: string): string {
  return `/my-road${WALK}${id}`;
}

export function remixLink(id: string): string {
  return `/editor${REMIX}${id}`;
}

function after(hash: string, prefix: string): string | null {
  if (!hash.startsWith(prefix)) return null;
  const value = hash.slice(prefix.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// The code in a page's hash, or null when there is none.
export function codeFromHash(hash: string): string | null {
  return after(hash, ROAD);
}

// The road id to walk, or null.
export function walkFromHash(hash: string): string | null {
  return after(hash, WALK);
}

// The road id to remix, or null.
export function remixFromHash(hash: string): string | null {
  return after(hash, REMIX);
}
