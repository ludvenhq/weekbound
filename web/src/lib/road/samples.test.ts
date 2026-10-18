import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DECODE_ERRORS, decodeRoad, encodeRoad } from './code.ts';

// The shared samples (samples/README.md). The addon's busted suite will run the same files, and
// both sides must give the same result for every one.
const root = resolve(import.meta.dirname, '../../../../samples');

const validSample = z.strictObject({
  about: z.string(),
  canonical: z.boolean(),
  code: z.string(),
  road: z.unknown(),
});
const invalidSample = z.strictObject({
  about: z.string(),
  code: z.string(),
  error: z.enum(DECODE_ERRORS),
});

function load<T>(folder: string, schema: z.ZodType<T>): [string, T][] {
  return readdirSync(resolve(root, folder))
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => [
      file,
      schema.parse(JSON.parse(readFileSync(resolve(root, folder, file), 'utf8'))),
    ]);
}

const valid = load('valid', validSample);
const invalid = load('invalid', invalidSample);

describe('valid samples', () => {
  it.each(valid)('%s decodes to its road', (_file, sample) => {
    expect(decodeRoad(sample.code)).toStrictEqual({ ok: true, road: sample.road });
  });

  it.each(valid)('%s round-trips through the encoder', (_file, sample) => {
    const encoded = encodeRoad(sample.road);
    if (!encoded.ok) throw new Error(encoded.detail);
    // A canonical sample is the encoder's own output, so the encoder must still give that code.
    if (sample.canonical) expect(encoded.code).toBe(sample.code);
    expect(decodeRoad(encoded.code)).toStrictEqual({ ok: true, road: sample.road });
  });
});

describe('invalid samples', () => {
  it.each(invalid)('%s is refused with its error', (_file, sample) => {
    expect(decodeRoad(sample.code)).toMatchObject({ ok: false, error: sample.error });
  });

  it('cover every decode error', () => {
    const covered = new Set(invalid.map(([, sample]) => sample.error));
    expect(DECODE_ERRORS.filter((error) => !covered.has(error))).toEqual([]);
  });
});
