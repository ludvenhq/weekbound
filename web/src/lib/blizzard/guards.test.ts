import { describe, expect, it } from 'vitest';
import { characterPath, characterSchema, realmSlug } from './character.ts';
import { AppLimit, Cache, VisitorLimit, Window } from './limits.ts';

describe('the character a visitor asks about', () => {
  it('turns realm names into Blizzard slugs', () => {
    expect(realmSlug('Twisting Nether')).toBe('twisting-nether');
    expect(realmSlug("Kel'Thas")).toBe('kelthas');
    expect(realmSlug('Aggra (Português)')).toBe('aggra-portugues');
    expect(realmSlug('  Silvermoon ')).toBe('silvermoon');
  });

  it('takes names of 2 to 12 letters in any alphabet, and nothing else', () => {
    const ok = (name: string) =>
      characterSchema.safeParse({ region: 'eu', realm: 'Silvermoon', name }).success;
    expect(ok('Ilvaeth')).toBe(true);
    expect(ok('Ëlyndra')).toBe(true);
    expect(ok('Тестер')).toBe(true);
    expect(ok('A')).toBe(false);
    expect(ok('Thirteenchars')).toBe(false);
    expect(ok('Bad name')).toBe(false);
    expect(ok('../../x')).toBe(false);
    expect(characterSchema.safeParse({ region: 'cn', realm: 'x', name: 'Abc' }).success).toBe(
      false,
    );
  });

  it('builds the profile path in lowercase, encoded', () => {
    const character = characterSchema.parse({ region: 'eu', realm: 'Kel’Thas', name: 'Ëlyndra' });
    expect(characterPath(character)).toBe('/profile/wow/character/kelthas/%C3%ABlyndra');
  });
});

describe('the limits', () => {
  it('lets a window fill, then frees it as time passes', () => {
    const window = new Window(2, 1_000);
    expect(window.take(0)).toBe(true);
    expect(window.take(10)).toBe(true);
    expect(window.take(20)).toBe(false);
    expect(window.take(1_001)).toBe(true);
  });

  it('charges neither window when one is full', () => {
    const limit = new AppLimit();
    expect(limit.take(0, 40)).toBe(true);
    expect(limit.take(1, 1)).toBe(false);
    expect(limit.take(1_001, 40)).toBe(true);
  });

  it('gives every visitor their own few checks a minute', () => {
    const visitors = new VisitorLimit(2, 60_000);
    expect(visitors.take('a', 0)).toBe(true);
    expect(visitors.take('a', 1)).toBe(true);
    expect(visitors.take('a', 2)).toBe(false);
    expect(visitors.take('b', 2)).toBe(true);
    expect(visitors.take('a', 60_001)).toBe(true);
  });

  it('keeps a bounded cache that forgets', () => {
    const cache = new Cache<number>(2, 100);
    cache.set('a', 1, 0);
    cache.set('b', 2, 0);
    cache.set('c', 3, 0);
    expect(cache.get('a', 1)).toBeUndefined();
    expect(cache.get('c', 1)).toBe(3);
    expect(cache.get('c', 100)).toBeUndefined();
  });
});
