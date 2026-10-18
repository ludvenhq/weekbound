import { z } from 'zod';
import {
  basedOnSchema,
  isKnownStep,
  isKnownStepType,
  LICENSE,
  MAX_STAGES,
  MAX_STEPS_PER_STAGE,
  PER_SPEC_BRACKETS,
  PLAYER_PREFIX,
  roadSchema,
  SCHEMA_VERSION,
  stepIdSchema,
  type BasedOn,
  type PvpBracket,
  type Road,
  type Step,
  type StepType,
} from '../road/schema.ts';

// The road the editor is making (design doc, "The website", Editor). Numbers and game ids stay
// text while the author types them, so a half-typed field is never lost; the road is built from
// the draft on every change and only a road that passes the schema gets a code.
//
// Versions (review concerns R3-3 and R3-4): a new road starts at rev 1 with an id made from its
// title, `p-` and a random suffix, so the editor never makes a reserved `sr-` id. Once a code is
// handed out (copied, or walked on My road) it becomes the draft's `base`: the id stays, and any
// change after that is the next rev, so players who have the old code can take the new one.
// Opening a code as a new version makes it the base the same way. Steps keep their ids while they
// are edited; a new step gets a new random id.

export const DRAFT_VERSION = 1;

export type ParamKey =
  | 'n'
  | 'bracket'
  | 'specId'
  | 'row'
  | 'achievementId'
  | 'questId'
  | 'factionId'
  | 'mountId'
  | 'titleId'
  | 'currencyId';

// Each type's parameters, in the schema's order.
export const PARAMS: Record<StepType, readonly ParamKey[]> = {
  'item-level': ['n'],
  'mythic-plus-rating': ['n'],
  'pvp-rating': ['bracket', 'n', 'specId'],
  vault: ['row', 'n'],
  achievement: ['achievementId'],
  quest: ['questId'],
  reputation: ['factionId', 'n'],
  mount: ['mountId'],
  title: ['titleId'],
  currency: ['currencyId', 'n'],
  manual: [],
};

const CHOICE_PARAMS: readonly ParamKey[] = ['bracket', 'row'];

// What a new step of a type starts with: the choices filled, every number empty.
const DEFAULTS: Partial<Record<StepType, Record<string, string>>> = {
  'pvp-rating': { bracket: '2v2' },
  vault: { row: 'dungeon', n: '1' },
};

// Draft text is held to a generous size so a pasted essay cannot fill the browser's storage; the
// schema's own limits are checked on the built road and shown to the author.
const draftText = z.string().max(4000);

const KEY = /^[a-z0-9]{6}$/;

const draftStepSchema = z.object({
  id: stepIdSchema,
  type: z.string().max(32),
  label: draftText,
  // Parameter text by name, plus `specOther` while the author types a spec id by hand.
  params: z.record(z.string().max(32), z.string().max(400)),
});
export type DraftStep = z.infer<typeof draftStepSchema>;

const draftStageSchema = z.object({
  // Stages have no id in a road; this one only keeps React's rows in place.
  key: z.string().regex(KEY),
  name: draftText,
  steps: z.array(draftStepSchema).max(MAX_STEPS_PER_STAGE),
});
export type DraftStage = z.infer<typeof draftStageSchema>;

export const draftSchema = z.object({
  v: z.literal(DRAFT_VERSION),
  title: draftText,
  author: draftText,
  pace: z.enum(['weekly', 'free']),
  // The random end of a new road's id, fixed when the draft starts so the id does not change.
  suffix: z.string().regex(KEY),
  basedOn: basedOnSchema.optional(),
  // The version last handed out, or opened to make a new version of.
  base: roadSchema.optional(),
  stages: z.array(draftStageSchema).max(MAX_STAGES),
});
export type Draft = z.infer<typeof draftSchema>;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

function stepIds(draft: Pick<Draft, 'stages'>): Set<string> {
  return new Set(draft.stages.flatMap((stage) => stage.steps.map((step) => step.id)));
}

function freshStepId(used: Set<string>): string {
  let id = randomKey();
  while (used.has(id)) id = randomKey();
  used.add(id);
  return id;
}

export function newStep(used: Set<string>, type: StepType = 'manual'): DraftStep {
  return { id: freshStepId(used), type, label: '', params: { ...DEFAULTS[type] } };
}

export function newStage(used: Set<string>): DraftStage {
  return { key: randomKey(), name: '', steps: [newStep(used)] };
}

export function newDraft(author = ''): Draft {
  return {
    v: DRAFT_VERSION,
    title: '',
    author,
    pace: 'weekly',
    suffix: randomKey(),
    stages: [newStage(new Set())],
  };
}

// True while the draft holds nothing the author typed, so starting over loses nothing.
export function isBlank(draft: Draft): boolean {
  return (
    !draft.base &&
    !draft.basedOn &&
    draft.title.trim() === '' &&
    draft.stages.every(
      (stage) =>
        stage.name.trim() === '' &&
        stage.steps.every(
          (step) =>
            step.label.trim() === '' &&
            Object.entries(step.params).every(
              ([key, value]) => value === '' || DEFAULTS[step.type as StepType]?.[key] === value,
            ),
        ),
    )
  );
}

function paramsOf(step: Step): Record<string, string> {
  if (!isKnownStep(step)) return {};
  const params: Record<string, string> = {};
  for (const key of PARAMS[step.type]) {
    const value = (step as Record<string, unknown>)[key];
    if (value !== undefined) params[key] = String(value);
  }
  return params;
}

function stagesOf(road: Road): DraftStage[] {
  return road.stages.map((stage) => ({
    key: randomKey(),
    name: stage.name,
    steps: stage.steps.map((step) => ({
      id: step.id,
      type: step.type,
      label: step.label,
      params: paramsOf(step),
    })),
  }));
}

// The next version of a road: same id, and the next rev once anything changes.
export function versionDraft(road: Road): Draft {
  return {
    v: DRAFT_VERSION,
    title: road.title,
    author: road.author,
    pace: road.pace,
    suffix: randomKey(),
    ...(road.basedOn ? { basedOn: road.basedOn } : {}),
    base: road,
    stages: stagesOf(road),
  };
}

// A new road made from another one, which it names as its source. It gets its own id at rev 1;
// the author is whoever is using the editor.
export function remixDraft(road: Road, author: string): Draft {
  const basedOn: BasedOn = { id: road.id, rev: road.rev, author: road.author };
  return {
    v: DRAFT_VERSION,
    title: road.title,
    author,
    pace: road.pace,
    suffix: randomKey(),
    basedOn,
    stages: stagesOf(road),
  };
}

// The id part made from a title: lowercase ASCII words joined by dashes, cut at a word.
export function slugify(text: string, max = 40): string {
  const ascii = text
    .toLowerCase()
    .replace(
      /[ßæøłđþœ]/g,
      (char) => ({ ß: 'ss', æ: 'ae', ø: 'o', ł: 'l', đ: 'd', þ: 'th', œ: 'oe' })[char] ?? '',
    )
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
  const words = ascii.split(/[^a-z0-9]+/).filter(Boolean);
  let slug = '';
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word;
    if (next.length > max) break;
    slug = next;
  }
  if (slug === '' && words[0]) slug = words[0].slice(0, max);
  return slug;
}

// Every editor id starts with `p-`, so a title such as "SR healer" makes `p-sr-healer-…`.
export function roadIdFor(title: string, suffix: string): string {
  return `${PLAYER_PREFIX}${slugify(title) || 'road'}-${suffix}`;
}

// A whole number as authors type it: "1,500" and "1 500" are 1500. Undefined when empty, the
// text itself when it is not a whole number, so the schema refuses it.
export function readWhole(raw: string): number | string | undefined {
  const clean = raw.replace(/[\s,'’_]/g, '');
  if (clean === '') return undefined;
  return /^\d+$/.test(clean) ? Number(clean) : raw;
}

export function isPerSpec(bracket: string | undefined): boolean {
  return PER_SPEC_BRACKETS.includes(bracket as PvpBracket);
}

function buildStep(step: DraftStep): Record<string, unknown> {
  const built: Record<string, unknown> = { id: step.id, type: step.type, label: step.label };
  if (!isKnownStepType(step.type)) return built;
  for (const key of PARAMS[step.type]) {
    if (key === 'specId' && !isPerSpec(step.params.bracket)) continue;
    const raw = step.params[key] ?? '';
    built[key] = CHOICE_PARAMS.includes(key) ? raw : readWhole(raw);
  }
  return built;
}

// The road as the draft stands, keys in the schema's order. It may not pass the schema yet.
export function buildRoad(draft: Draft): Record<string, unknown> {
  const { base } = draft;
  const road: Record<string, unknown> = {
    v: SCHEMA_VERSION,
    id: base?.id ?? roadIdFor(draft.title, draft.suffix),
    rev: base?.rev ?? 1,
    title: draft.title,
    pace: draft.pace,
    author: draft.author,
    license: LICENSE,
    ...(draft.basedOn ? { basedOn: draft.basedOn } : {}),
    stages: draft.stages.map((stage) => ({ name: stage.name, steps: stage.steps.map(buildStep) })),
  };
  if (base && !sameAs(road, base)) road.rev = base.rev + 1;
  return road;
}

function sameAs(road: Record<string, unknown>, base: Road): boolean {
  const parsed = roadSchema.safeParse(road);
  return parsed.success && JSON.stringify(parsed.data) === JSON.stringify(base);
}

// A code left the editor: this version is now out, and the next change makes the next one.
export function handOut(draft: Draft, road: Road): Draft {
  return draft.base && JSON.stringify(draft.base) === JSON.stringify(road)
    ? draft
    : { ...draft, base: road };
}

// Edits. Each returns a new draft.

export function setStage(draft: Draft, key: string, change: Partial<DraftStage>): Draft {
  return {
    ...draft,
    stages: draft.stages.map((stage) => (stage.key === key ? { ...stage, ...change } : stage)),
  };
}

export function setStep(draft: Draft, id: string, change: (step: DraftStep) => DraftStep): Draft {
  return {
    ...draft,
    stages: draft.stages.map((stage) => ({
      ...stage,
      steps: stage.steps.map((step) => (step.id === id ? change(step) : step)),
    })),
  };
}

// A new type keeps the label and starts its parameters over.
export function withType(step: DraftStep, type: string): DraftStep {
  return { ...step, type, params: isKnownStepType(type) ? { ...DEFAULTS[type] } : {} };
}

export function addStage(draft: Draft): { draft: Draft; stepId: string } {
  const stage = newStage(stepIds(draft));
  return { draft: { ...draft, stages: [...draft.stages, stage] }, stepId: stage.steps[0]!.id };
}

export function addStep(draft: Draft, stageKey: string): { draft: Draft; stepId: string } {
  const step = newStep(stepIds(draft));
  const next = setStage(draft, stageKey, {
    steps: [...(draft.stages.find((stage) => stage.key === stageKey)?.steps ?? []), step],
  });
  return { draft: next, stepId: step.id };
}

export function removeStage(draft: Draft, key: string): Draft {
  return { ...draft, stages: draft.stages.filter((stage) => stage.key !== key) };
}

export function removeStep(draft: Draft, id: string): Draft {
  return {
    ...draft,
    stages: draft.stages.map((stage) => ({
      ...stage,
      steps: stage.steps.filter((step) => step.id !== id),
    })),
  };
}

export function moveStage(draft: Draft, key: string, by: -1 | 1): Draft {
  const from = draft.stages.findIndex((stage) => stage.key === key);
  const to = from + by;
  if (from < 0 || to < 0 || to >= draft.stages.length) return draft;
  const stages = [...draft.stages];
  [stages[from], stages[to]] = [stages[to]!, stages[from]!];
  return { ...draft, stages };
}

// Up from a stage's first place moves the step to the end of the stage before; down from the
// last place moves it to the start of the stage after.
export function moveStep(draft: Draft, id: string, by: -1 | 1): Draft {
  const s = draft.stages.findIndex((stage) => stage.steps.some((step) => step.id === id));
  const stage = draft.stages[s];
  if (!stage) return draft;
  const i = stage.steps.findIndex((step) => step.id === id);
  const step = stage.steps[i]!;
  const stages = draft.stages.map((each) => ({ ...each, steps: [...each.steps] }));
  const here = stages[s]!.steps;
  const to = i + by;
  if (to >= 0 && to < here.length) {
    [here[i], here[to]] = [here[to]!, here[i]!];
    return { ...draft, stages };
  }
  const other = stages[s + by];
  if (!other || other.steps.length >= MAX_STEPS_PER_STAGE) return draft;
  here.splice(i, 1);
  if (by < 0) other.steps.push(step);
  else other.steps.unshift(step);
  return { ...draft, stages };
}
