import { describe, expect, it } from 'vitest';
import { rank } from './search.ts';

const ENTRIES = [
  { id: 61624, name: 'Ahead of the Curve: Crown of the Cosmos' },
  { id: 63650, name: "Ahead of the Curve: Ula'tek" },
  { id: 41802, name: 'Eversong In Reprise' },
  { id: 61855, name: 'Explore Eversong Woods' },
];

describe('search by name', () => {
  it('matches every word, names that start with the query first, then shorter ones', () => {
    expect(rank(ENTRIES, 'eversong').map((e) => e.id)).toEqual([41802, 61855]);
    expect(rank(ENTRIES, 'curve ula').map((e) => e.id)).toEqual([63650]);
    expect(rank(ENTRIES, 'ahead of the').map((e) => e.id)).toEqual([63650, 61624]);
  });

  it('ignores case and accents, and gives nothing for an empty query', () => {
    expect(rank(ENTRIES, 'ÉVERSONG IN').map((e) => e.id)).toEqual([41802]);
    expect(rank(ENTRIES, '   ')).toEqual([]);
  });
});
