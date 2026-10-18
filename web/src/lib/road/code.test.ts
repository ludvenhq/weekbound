import { describe, expect, it } from 'vitest';
import { fromBase64Url, toBase64Url } from './base64url.ts';
import { CODE_PREFIX, decodeRoad, encodeRoad, MAX_CODE_BYTES } from './code.ts';
import { MAX_STAGES, MAX_STEPS_PER_STAGE, type Road } from './schema.ts';

const road: Road = {
  v: 1,
  id: 'p-test-road-a1b2c3',
  rev: 1,
  title: 'Test road',
  pace: 'weekly',
  author: 'Test',
  license: 'CC-BY-4.0',
  stages: [{ name: 'One', steps: [{ id: 'a', type: 'manual', label: 'Do a thing' }] }],
};

// Deterministic bytes, so a failure names the same case every run.
function bytes(length: number, seed: number): Uint8Array {
  let state = seed;
  return Uint8Array.from({ length }, () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state & 255;
  });
}

describe('base64url', () => {
  it('matches Node for every length up to 64', () => {
    for (let length = 0; length <= 64; length++) {
      const data = bytes(length, length + 1);
      const text = toBase64Url(data);
      expect(text).toBe(Buffer.from(data).toString('base64url'));
      expect(fromBase64Url(text)).toEqual(data);
    }
  });
});

describe('encodeRoad', () => {
  it('names the field that is wrong', () => {
    const broken = {
      ...road,
      stages: [{ name: 'One', steps: [{ id: 'a', type: 'item-level', label: 'Gear', n: 0 }] }],
    };
    expect(encodeRoad(broken)).toMatchObject({
      ok: false,
      error: 'invalid',
      detail: expect.stringContaining('at stages[0].steps[0].n:'),
    });
  });

  it('refuses a road whose code the addon could not import', () => {
    // The schema allows more than one code can carry; the editor shows the size instead.
    const huge: Road = {
      ...road,
      stages: Array.from({ length: MAX_STAGES }, (_, s) => ({
        name: `Stage ${s + 1}`,
        steps: Array.from({ length: MAX_STEPS_PER_STAGE }, (_, i) => ({
          id: `s${s}-${i}`,
          type: 'manual' as const,
          label: 'A long label that says a lot about what to do in this step of the road',
        })),
      })),
    };
    expect(encodeRoad(huge)).toMatchObject({ ok: false, error: 'too-long' });
  });
});

describe('decodeRoad', () => {
  it('never throws on random bytes behind the prefix', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const code = CODE_PREFIX + toBase64Url(bytes(seed % 97, seed));
      expect(decodeRoad(code).ok).toBe(false);
    }
  });

  it('never throws on random text', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const text = String.fromCharCode(...bytes(seed % 131, seed));
      expect(() => decodeRoad(text)).not.toThrow();
    }
  });

  it('measures a huge paste before touching it', () => {
    expect(decodeRoad('A'.repeat(MAX_CODE_BYTES * 400))).toEqual({ ok: false, error: 'too-long' });
  });
});
