import { describe, expect, it } from 'vitest';
import { encodeRoad } from '../road/code.ts';
import type { Road } from '../road/schema.ts';
import { BACKUP_PREFIX, decodeBackup, encodeBackup } from './backup.ts';
import { EMPTY, importRoad, markStep, removeRoad, replaceRoad, type Saved } from './saved.ts';

const road: Road = {
  v: 1,
  id: 'p-test-k3x9qa',
  rev: 2,
  title: 'Test road',
  pace: 'weekly',
  author: 'Test',
  license: 'CC-BY-4.0',
  stages: [{ name: 'One', steps: [{ id: 'a', type: 'manual', label: 'A' }] }],
};
const other: Road = { ...road, id: 'p-other-m2q7zd', title: 'Other road' };

function withRoad(saved: Saved, added: Road): Saved {
  const outcome = importRoad(saved, added);
  if (outcome.kind !== 'added') throw new Error(outcome.kind);
  return outcome.saved;
}

describe('the road library', () => {
  it('adds a new road as the active one and keeps the old road progress on switching', () => {
    const first = markStep(withRoad(EMPTY, road), road.id, 'a', 'done', 1);
    const second = withRoad(first, other);
    expect(second.active).toBe(other.id);
    expect(second.progress[road.id]).toEqual({ a: { state: 'done', at: 1 } });
  });

  it('asks before a newer rev and refuses the same or an older one', () => {
    const saved = withRoad(EMPTY, road);
    expect(importRoad(saved, { ...road, rev: 3 })).toMatchObject({ kind: 'newer' });
    expect(importRoad(saved, road)).toMatchObject({ kind: 'same' });
    expect(importRoad(saved, { ...road, rev: 1 })).toMatchObject({ kind: 'older' });
  });

  it('keeps progress through a newer rev and through removing and importing again', () => {
    const saved = markStep(withRoad(EMPTY, road), road.id, 'a', 'done', 1);
    const replaced = replaceRoad(saved, { ...road, rev: 3 });
    expect(replaced.library[0]?.rev).toBe(3);
    expect(replaced.progress[road.id]?.a?.state).toBe('done');

    const removed = removeRoad(replaced, road.id);
    expect(removed.active).toBeUndefined();
    expect(withRoad(removed, road).progress[road.id]?.a?.state).toBe('done');
  });
});

describe('backup codes', () => {
  const saved: Saved = {
    ...markStep(withRoad(EMPTY, road), road.id, 'a', 'skipped', 5),
    region: 'us',
    lastVisit: 9,
  };

  it('round-trip everything but the last visit', () => {
    const encoded = encodeBackup(saved);
    if (!encoded.ok) throw new Error('too long');
    expect(encoded.code.startsWith(BACKUP_PREFIX)).toBe(true);
    const decoded = decodeBackup(` ${encoded.code}\n`);
    expect(decoded).toEqual({ ok: true, saved: { ...saved, lastVisit: undefined } });
    expect(decoded.ok && 'lastVisit' in decoded.saved).toBe(false);
  });

  it('tell a road code apart and refuse what they cannot read', () => {
    const roadCode = encodeRoad(road);
    if (!roadCode.ok) throw new Error(roadCode.detail);
    expect(decodeBackup(roadCode.code)).toEqual({ ok: false, error: 'road-code' });
    expect(decodeBackup('hello')).toEqual({ ok: false, error: 'not-a-backup-code' });
    expect(decodeBackup('SRB2!e30')).toEqual({ ok: false, error: 'newer-encoding' });
    expect(decodeBackup('SRB1!e30')).toEqual({ ok: false, error: 'broken' });
    expect(decodeBackup('SRB1!' + 'A'.repeat(30_000))).toEqual({ ok: false, error: 'too-long' });
  });

  it('refuse a studio road smuggled into the library', () => {
    const smuggled = { ...saved, library: [{ ...road, id: 'sr-returning-player' }] };
    const encoded = encodeBackup(smuggled);
    if (!encoded.ok) throw new Error('too long');
    expect(decodeBackup(encoded.code)).toEqual({ ok: false, error: 'broken' });
  });
});
