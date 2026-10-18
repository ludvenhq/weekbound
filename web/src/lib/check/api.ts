import { z } from 'zod';

// What /api/check answers, shared by the route and the page, so both read the same shape.

export const factsSchema = z.object({
  itemLevel: z.number().nullable(),
  mythicRating: z.number(),
  pvp: z.object({ '2v2': z.number(), '3v3': z.number(), rbg: z.number() }),
  achievements: z.array(z.int()),
  quests: z.array(z.int()),
  renown: z.record(z.string(), z.number()),
  mounts: z.array(z.int()),
  titles: z.array(z.int()),
});

export const CHECK_ERRORS = [
  'bad-input',
  'not-found',
  'busy',
  'too-many',
  'not-configured',
] as const;
export type CheckError = (typeof CHECK_ERRORS)[number];

export const checkReplySchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    character: z.object({
      name: z.string(),
      realm: z.string(),
      level: z.number().nullable(),
      // When the character last logged out, as Blizzard has it; the data is from then.
      lastLogout: z.number().nullable(),
    }),
    facts: factsSchema,
  }),
  z.object({ ok: z.literal(false), error: z.enum(CHECK_ERRORS) }),
]);
export type CheckReply = z.infer<typeof checkReplySchema>;

export const realmsReplySchema = z.object({
  realms: z.array(z.object({ name: z.string(), slug: z.string() })),
});

export const CHECK_MESSAGES: Record<CheckError, string> = {
  'bad-input': 'Check the realm and the character name: a name is 2 to 12 letters.',
  'not-found':
    "We can't see this character. Check the realm, or log in once and log out, then try again.",
  busy: 'Blizzard is busy. Try again in a minute.',
  'too-many': 'That was a lot of checks at once. Try again in a minute.',
  'not-configured': "Road Check isn't switched on here yet.",
};
