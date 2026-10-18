import { z } from 'zod';
import { REGIONS } from '../walk/reset.ts';
import { FACT_KINDS } from '../check/check.ts';

// The character a visitor asks Road Check about. Every field is checked before anything reaches
// Blizzard: a fixed list of regions, a realm slug of plain letters, digits and hyphens, and a
// character name of 2 to 12 letters in any alphabet, as the game allows.

// "Aggra (Português)" is aggra-portugues, "Kel'Thas" is kelthas, "Twisting Nether" is
// twisting-nether: the slugs Blizzard's API uses.
export function realmSlug(realm: string): string {
  return realm
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const characterSchema = z.object({
  region: z.enum(REGIONS),
  realm: z
    .string()
    .max(60)
    .transform(realmSlug)
    .pipe(
      z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(40),
    ),
  name: z
    .string()
    .trim()
    .regex(/^\p{L}{2,12}$/u, 'a character name is 2 to 12 letters'),
});
export type Character = z.infer<typeof characterSchema>;

export const checkRequestSchema = characterSchema.extend({
  kinds: z.array(z.enum(FACT_KINDS)).min(1).max(FACT_KINDS.length),
});
export type CheckRequest = z.infer<typeof checkRequestSchema>;

// The path segment for a character: lowercase, and percent-encoded for names outside ASCII.
export function characterPath(character: Character): string {
  return `/profile/wow/character/${character.realm}/${encodeURIComponent(character.name.toLocaleLowerCase())}`;
}

export function characterKey(character: Character): string {
  return `${character.region}:${character.realm}:${character.name.toLocaleLowerCase()}`;
}
