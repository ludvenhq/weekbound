import { z } from 'zod';

// The road format, the single source for the website and (later) the addon. The rules are written
// out in docs/road-format.md; the shared samples in samples/ pin them for both sides. Objects
// strip unknown keys, so a newer road with extra fields still opens here, and nothing transforms
// a value, so the parsed road is what the code holds.

// The schema version, the road's `v` field. The digit in the code prefix is the encoding's
// version (code.ts), not this one.
export const SCHEMA_VERSION = 1;

export const STEP_TYPES = [
  'item-level',
  'mythic-plus-rating',
  'pvp-rating',
  'vault',
  'achievement',
  'quest',
  'reputation',
  'mount',
  'title',
  'currency',
  'manual',
] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const PVP_BRACKETS = ['2v2', '3v3', 'rbg', 'shuffle', 'blitz'] as const;
// Solo Shuffle and Blitz keep a rating per spec, so their steps name the spec.
export const PER_SPEC_BRACKETS: readonly PvpBracket[] = ['shuffle', 'blitz'];
export type PvpBracket = (typeof PVP_BRACKETS)[number];

export const VAULT_ROWS = ['raid', 'dungeon', 'world'] as const;

// Lengths count Unicode code points, so the addon (which sees UTF-8 bytes) counts the same.
export const MAX_LENGTH = { title: 80, author: 40, stageName: 60, label: 140 } as const;
export const MAX_STAGES = 20;
export const MAX_STEPS_PER_STAGE = 20;

// Studio roads ship built in; their ids are reserved and an imported code may not use them.
export const STUDIO_PREFIX = 'sr-';
// Every road the editor makes.
export const PLAYER_PREFIX = 'p-';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ROAD_ID = /^(?:sr|p)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
// C0 and C1 controls, DEL, and the bidi embeddings and isolates that can flip how text reads.
const FORBIDDEN_CHARS = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/;

export function codePoints(text: string): number {
  return [...text].length;
}

function text(max: number) {
  return z
    .string()
    .refine((value) => /[^ ]/.test(value), 'must not be blank')
    .refine((value) => !FORBIDDEN_CHARS.test(value), 'must not hold control characters')
    .refine((value) => codePoints(value) <= max, `must be at most ${max} characters`);
}

const whole = (max: number) => z.int().min(1).max(max);
// Blizzard's ids are 32-bit.
const gameId = whole(2_147_483_647);

export const roadIdSchema = z
  .string()
  .max(64)
  .regex(ROAD_ID, 'must be sr- or p- and lowercase words joined by hyphens');
export const stepIdSchema = z
  .string()
  .max(32)
  .regex(SLUG, 'must be lowercase words joined by hyphens');
const revSchema = whole(1_000_000);

const labelSchema = text(MAX_LENGTH.label);

// Every step is id, type, label and then its type's parameters, in that order, which is also the
// order of its keys in a code.
function step<T extends StepType, P extends z.ZodRawShape>(type: T, params: P) {
  return z.object({ id: stepIdSchema, type: z.literal(type), label: labelSchema, ...params });
}

const pvpRatingStep = step('pvp-rating', {
  bracket: z.enum(PVP_BRACKETS),
  n: whole(4000),
  specId: gameId.optional(),
}).refine(
  (s) => PER_SPEC_BRACKETS.includes(s.bracket) === (s.specId !== undefined),
  'shuffle and blitz need a specId; 2v2, 3v3 and rbg take none',
);

export const knownStepSchema = z.discriminatedUnion('type', [
  step('item-level', { n: whole(1000) }),
  step('mythic-plus-rating', { n: whole(5000) }),
  pvpRatingStep,
  step('vault', { row: z.enum(VAULT_ROWS), n: whole(3) }),
  step('achievement', { achievementId: gameId }),
  step('quest', { questId: gameId }),
  // Renown level for the major factions, standing for the older ones.
  step('reputation', { factionId: gameId, n: whole(100) }),
  step('mount', { mountId: gameId }),
  step('title', { titleId: gameId }),
  step('currency', { currencyId: gameId, n: whole(1_000_000) }),
  step('manual', {}),
]);
export type KnownStep = z.infer<typeof knownStepSchema>;

export function isKnownStepType(type: string): type is StepType {
  return (STEP_TYPES as readonly string[]).includes(type);
}

// A type from a newer road inside the same `v`: the road still opens and the step shows as one
// the player ticks by hand. Only its id, type and label are kept. The refine aborts so that a
// known step with a wrong field reports that field: Zod's union otherwise returns the one branch
// that did not abort, which would be this one.
const unknownStepSchema = z.object({
  id: stepIdSchema,
  type: z
    .string()
    .max(32)
    .regex(SLUG)
    .refine((type) => !isKnownStepType(type), { abort: true, message: 'is a known type' }),
  label: labelSchema,
});
export type UnknownStep = z.infer<typeof unknownStepSchema>;

export const stepSchema = z.union([knownStepSchema, unknownStepSchema]);
export type Step = z.infer<typeof stepSchema>;

export function isKnownStep(step: Step): step is KnownStep {
  return isKnownStepType(step.type);
}

export const stageSchema = z.object({
  name: text(MAX_LENGTH.stageName),
  steps: z.array(stepSchema).min(1).max(MAX_STEPS_PER_STAGE),
});
export type Stage = z.infer<typeof stageSchema>;

export const roadSchema = z
  .object({
    v: z.literal(SCHEMA_VERSION),
    id: roadIdSchema,
    rev: revSchema,
    title: text(MAX_LENGTH.title),
    pace: z.enum(['weekly', 'free']),
    author: text(MAX_LENGTH.author),
    // Every road is CC BY 4.0 (decided 2026-10-18); a code that says otherwise does not open.
    license: z.literal('CC-BY-4.0'),
    basedOn: z
      .object({ id: roadIdSchema, rev: revSchema, author: text(MAX_LENGTH.author) })
      .optional(),
    stages: z.array(stageSchema).min(1).max(MAX_STAGES),
  })
  .superRefine((road, ctx) => {
    // Progress is kept by road id and step id, so one tick must never mark two steps.
    const seen = new Set<string>();
    road.stages.forEach((stage, s) =>
      stage.steps.forEach((step, i) => {
        if (seen.has(step.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['stages', s, 'steps', i, 'id'],
            message: `step id "${step.id}" is used twice`,
          });
        }
        seen.add(step.id);
      }),
    );
  });
export type Road = z.infer<typeof roadSchema>;
