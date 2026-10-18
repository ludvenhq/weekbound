import type { z } from 'zod';
import { fromBase64Url, toBase64Url } from './base64url.ts';
import { roadSchema, SCHEMA_VERSION, STUDIO_PREFIX, type Road } from './schema.ts';

// Road codes: `SR1!` and base64url of the road's JSON in UTF-8, with no compression, so the cost
// of opening a code grows only with its length. The digit in the prefix is the encoding's version;
// the road's own `v` is the schema's. Every pasted code is hostile: the checks run in the order
// docs/road-format.md lists, and the addon runs the same ones in the same order.

export const CODE_PREFIX = 'SR1!';
// Backup codes (progress, not a road) have their own prefix, so the paste box can tell them apart.
export const BACKUP_PREFIX = 'SRB1!';
// The addon's import box takes about this much (design doc, "Caps before decoding" [est]).
export const MAX_CODE_BYTES = 24 * 1024;
// A road nests five deep; the cap leaves room for newer fields and stops a deep code before any
// parser recurses into it.
export const MAX_DEPTH = 16;

export const DECODE_ERRORS = [
  'too-long',
  'empty',
  'backup-code',
  'not-a-road-code',
  'newer-encoding',
  'bad-base64',
  'bad-text',
  'too-deep',
  'bad-json',
  'newer-version',
  'invalid',
  'reserved-id',
] as const;
export type DecodeError = (typeof DECODE_ERRORS)[number];

export type DecodeResult =
  { ok: true; road: Road } | { ok: false; error: DecodeError; detail?: string };

export type EncodeResult =
  { ok: true; code: string } | { ok: false; error: 'invalid' | 'too-long'; detail: string };

const WHITESPACE = /[ \t\r\n]/g;
const ROAD_PREFIX = /^SR([1-9][0-9]*)!/;
const ANY_BACKUP_PREFIX = /^SRB[1-9][0-9]*!/;

function formatPath(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '';
  const parts = path.map((key, i) =>
    typeof key === 'number' ? `[${key}]` : `${i > 0 ? '.' : ''}${String(key)}`,
  );
  return `at ${parts.join('')}: `;
}

// z.prettifyError says only "Invalid input" for a step that fails both as its own type and as an
// unknown type. This opens such a union and keeps the branch that does not reject the step's
// type, so a road author reads "at stages[0].steps[1].n: Too small: expected number to be >=1".
export function describeIssues(
  issues: readonly z.core.$ZodIssue[],
  base: readonly PropertyKey[] = [],
): string[] {
  return issues.flatMap((issue) => {
    const path = [...base, ...issue.path];
    if (issue.code === 'invalid_union' && issue.errors.length > 0) {
      const fits = issue.errors.find(
        (branch) => !branch.some((i) => i.path.length === 1 && i.path[0] === 'type'),
      );
      return describeIssues(fits ?? issue.errors[0] ?? [], path);
    }
    return [`${formatPath(path)}${issue.message}`];
  });
}

const describe = (error: z.ZodError) => describeIssues(error.issues).join('\n');

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

// The deepest nesting of objects and arrays, counted on the text before parsing. Only the ASCII
// characters " \ { } [ ] matter, and they mean the same in UTF-16 and in UTF-8 bytes.
export function nestingDepth(json: string, stopAbove = Infinity): number {
  let depth = 0;
  let deepest = 0;
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (inString) {
      if (char === '\\') i++;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === '{' || char === '[') {
      depth++;
      if (depth > deepest) deepest = depth;
      if (deepest > stopAbove) return deepest;
    } else if (char === '}' || char === ']') {
      depth--;
    }
  }
  return deepest;
}

export function decodeRoad(input: string): DecodeResult {
  // A paste of any size is measured before anything else touches it; a valid code is ASCII, so
  // the character count is a quick first bound.
  if (input.length > MAX_CODE_BYTES || utf8Bytes(input) > MAX_CODE_BYTES) {
    return { ok: false, error: 'too-long' };
  }
  const code = input.replace(WHITESPACE, '');
  if (code === '') return { ok: false, error: 'empty' };
  if (ANY_BACKUP_PREFIX.test(code)) return { ok: false, error: 'backup-code' };
  const prefix = ROAD_PREFIX.exec(code);
  if (!prefix) return { ok: false, error: 'not-a-road-code' };
  if (prefix[1] !== '1') return { ok: false, error: 'newer-encoding' };

  const body = code.slice(prefix[0].length);
  const bytes = body === '' ? null : fromBase64Url(body);
  if (!bytes) return { ok: false, error: 'bad-base64' };

  let json: string;
  try {
    // A byte order mark stays in the text and fails as JSON, as it does in the addon.
    json = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    return { ok: false, error: 'bad-text' };
  }
  if (nestingDepth(json, MAX_DEPTH) > MAX_DEPTH) return { ok: false, error: 'too-deep' };

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'bad-json' };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'invalid', detail: 'a road is a JSON object' };
  }
  const v = (data as { v?: unknown }).v;
  if (typeof v === 'number' && Number.isInteger(v) && v > SCHEMA_VERSION) {
    return { ok: false, error: 'newer-version' };
  }

  const parsed = roadSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: 'invalid', detail: describe(parsed.error) };
  if (parsed.data.id.startsWith(STUDIO_PREFIX)) return { ok: false, error: 'reserved-id' };
  return { ok: true, road: parsed.data };
}

// The code for a road, with its keys in the schema's order, so one road always gives one code.
// It refuses a road the addon could not import, so the editor never hands out such a code.
export function encodeRoad(road: unknown): EncodeResult {
  const parsed = roadSchema.safeParse(road);
  if (!parsed.success) {
    return { ok: false, error: 'invalid', detail: describe(parsed.error) };
  }
  const code = CODE_PREFIX + toBase64Url(new TextEncoder().encode(JSON.stringify(parsed.data)));
  if (code.length > MAX_CODE_BYTES) {
    return {
      ok: false,
      error: 'too-long',
      detail: `the code is ${code.length} bytes; the limit is ${MAX_CODE_BYTES}`,
    };
  }
  return { ok: true, code };
}

// What the paste box says, in the product's words (DESIGN.md, Components).
export const DECODE_MESSAGES: Record<DecodeError, string> = {
  'too-long': "This code is longer than 24 KB, so we didn't open it.",
  empty: 'Paste a road code first.',
  'not-a-road-code': "That isn't a road code. Road codes start with SR1!",
  'backup-code': "That's a backup code, not a road. It goes in the backup box on My road.",
  'newer-encoding': 'This road is from a newer version of Slow Road. Reload the page to open it.',
  'bad-base64': 'This code is broken. Copy it again from where you found it.',
  'bad-text': 'This code is broken. Copy it again from where you found it.',
  'too-deep': 'This code is broken. Copy it again from where you found it.',
  'bad-json': 'This code is broken. Copy it again from where you found it.',
  'newer-version': 'This road is from a newer version of Slow Road. Reload the page to open it.',
  invalid: 'This code is broken. Copy it again from where you found it.',
  'reserved-id': 'This road comes with Slow Road. Pick it from the roads instead.',
};
