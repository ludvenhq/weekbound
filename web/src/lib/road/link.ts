// A road code in a link, /my-road#road=SR1!…: the editor hands a road to My road this way, and a
// code can travel as a link. The part after # never reaches a server.

const PREFIX = '#road=';

export function roadLink(code: string): string {
  return `/my-road${PREFIX}${code}`;
}

// The code in a page's hash, or null when there is none.
export function codeFromHash(hash: string): string | null {
  if (!hash.startsWith(PREFIX)) return null;
  const code = hash.slice(PREFIX.length);
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}
