import { cleanPaste, isNewerVersion, MAX_CODE_BYTES, readBody, writeBody } from '../road/code.ts';
import { savedSchema, SAVED_VERSION, type Saved } from './saved.ts';

// A backup code moves the roads and progress to another browser, with no account. It has its own
// prefix, so a paste box tells it apart from a road code, and the same size cap and checks.

export const BACKUP_PREFIX = 'SRB1!';
const ANY_BACKUP_PREFIX = /^SRB([1-9][0-9]*)!/;
const ANY_ROAD_PREFIX = /^SR[1-9][0-9]*!/;

export type BackupError =
  | 'too-long'
  | 'empty'
  | 'road-code'
  | 'not-a-backup-code'
  | 'newer-encoding'
  | 'newer-version'
  | 'broken';

export const BACKUP_MESSAGES: Record<BackupError, string> = {
  'too-long': "This code is longer than 24 KB, so we didn't open it.",
  empty: 'Paste a backup code first.',
  'road-code': "That's a road code, not a backup. Paste it in the road box instead.",
  'not-a-backup-code': "That isn't a backup code. Backup codes start with SRB1!",
  'newer-encoding':
    'This backup is from a newer version of Slow Road. Reload the page to restore it.',
  'newer-version':
    'This backup is from a newer version of Slow Road. Reload the page to restore it.',
  broken: 'This backup code is broken. Copy it again from the other browser.',
};

// Everything but the last visit, which belongs to this browser's recap.
export function encodeBackup(saved: Saved): { ok: true; code: string } | { ok: false } {
  // JSON leaves out a key whose value is undefined.
  const code = writeBody(BACKUP_PREFIX, { ...saved, lastVisit: undefined });
  return code.length > MAX_CODE_BYTES ? { ok: false } : { ok: true, code };
}

export function decodeBackup(
  input: string,
): { ok: true; saved: Saved } | { ok: false; error: BackupError } {
  const code = cleanPaste(input);
  if (code === null) return { ok: false, error: 'too-long' };
  if (code === '') return { ok: false, error: 'empty' };
  if (ANY_ROAD_PREFIX.test(code)) return { ok: false, error: 'road-code' };
  const prefix = ANY_BACKUP_PREFIX.exec(code);
  if (!prefix) return { ok: false, error: 'not-a-backup-code' };
  if (prefix[1] !== '1') return { ok: false, error: 'newer-encoding' };
  const body = readBody(code.slice(prefix[0].length));
  if (!body.ok) return { ok: false, error: 'broken' };
  if (isNewerVersion(body.data.v, SAVED_VERSION)) return { ok: false, error: 'newer-version' };
  const data = { ...body.data };
  delete data.lastVisit;
  const parsed = savedSchema.safeParse(data);
  return parsed.success ? { ok: true, saved: parsed.data } : { ok: false, error: 'broken' };
}
