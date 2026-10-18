import { z } from 'zod';
import { REGIONS } from '../walk/reset.ts';
import { FACT_KINDS } from '../check/check.ts';

// The character a visitor asks Road Check about. Every field is checked before anything reaches
// Blizzard: a fixed list of regions, a realm slug of letters, digits and hyphens, and a character
// name of 2 to 12 letters in any alphabet, as the game allows.

// The slug Blizzard's API uses for a realm name: lowercase, apostrophes and brackets dropped,
// spaces as hyphens, accents kept ("Aggra (Português)" is aggra-português, "Kel'Thas" is
// kelthas, "Twisting Nether" is twisting-nether; checked 2026-10-18 against the realm list).
// Realms whose slug differs from their name are matched through the realm list (realms.ts).
export function realmSlug(realm: string): string {
  return realm
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/['’()]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

export const characterSchema = z.object({
  region: z.enum(REGIONS),
  realm: z.string().max(60).transform(realmSlug).pipe(z.string().regex(SLUG).max(40)),
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

// The path for a character: the name in lowercase, and both parts percent-encoded as UTF-8 for
// letters outside ASCII.
export function characterPath(character: Character): string {
  return `/profile/wow/character/${encodeURIComponent(character.realm)}/${encodeURIComponent(character.name.toLowerCase())}`;
}

export function characterKey(character: Character): string {
  return `${character.region}:${character.realm}:${character.name.toLowerCase()}`;
}
