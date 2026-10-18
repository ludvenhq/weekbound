import type { z } from 'zod';
import { CODE_PREFIX, encodeRoad, flattenIssues, writeBody } from '../road/code.ts';
import { isKnownStepType, roadSchema, type Road } from '../road/schema.ts';
import { n } from '../walk/words.ts';
import { buildRoad, isPerSpec, PARAMS, readWhole, type Draft } from './draft.ts';
import { paramName } from './words.ts';

// What stands between a draft and its code, as one plain sentence per field, in the order the
// fields appear. The road schema stays the judge: the editor's own checks only put the blank and
// half-typed fields into words before the schema's limits are shown.

// Fields are named by stable keys, not by position, so moving a step keeps its messages:
// `title`, `author`, `stage.<key>.name`, `stage.<key>.steps`, `step.<id>.label`,
// `step.<id>.<param>` and `step.<id>` for the step as a whole.
export type Problem = { field: string; where: string; message: string };

export type Made =
  | { ok: true; road: Road; code: string; size: number }
  | { ok: false; problems: Problem[]; size: number; tooLong: boolean };

const BLANK = /^ *$/;

function sentence(text: string): string {
  const trimmed = text.trim();
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}${/[.!?]$/.test(trimmed) ? '' : '.'}`;
}

function messageFor(issue: z.core.$ZodIssue): string {
  switch (issue.code) {
    case 'too_small':
      return issue.origin === 'array'
        ? 'Add at least one.'
        : `At least ${n(Number(issue.minimum))}.`;
    case 'too_big':
      return issue.origin === 'array' ? 'Too many.' : `At most ${n(Number(issue.maximum))}.`;
    case 'custom':
      return sentence(issue.message);
    default:
      return 'Fill this in.';
  }
}

// The fields of a draft in the order the page shows them, with the words for where each is.
function fieldsOf(draft: Draft): Map<string, string> {
  const fields = new Map<string, string>([
    ['title', 'Road name'],
    ['author', 'Your name'],
    ['stages', 'Stages'],
  ]);
  draft.stages.forEach((stage, s) => {
    fields.set(`stage.${stage.key}.name`, `Stage ${s + 1} name`);
    fields.set(`stage.${stage.key}.steps`, `Stage ${s + 1}`);
    stage.steps.forEach((step, i) => {
      const where = `Stage ${s + 1}, step ${i + 1}`;
      fields.set(`step.${step.id}`, where);
      fields.set(`step.${step.id}.label`, where);
      const params = isKnownStepType(step.type) ? PARAMS[step.type] : [];
      for (const key of params) {
        fields.set(
          `step.${step.id}.${key}`,
          `${where}, ${paramName(step.type, key).toLowerCase()}`,
        );
      }
    });
  });
  return fields;
}

// The key of the field a schema issue is about.
function fieldOf(draft: Draft, path: readonly PropertyKey[]): string {
  const [top, s, inner, i, param] = path;
  if (top !== 'stages' || typeof s !== 'number') return String(top ?? 'stages');
  const stage = draft.stages[s];
  if (!stage) return 'stages';
  if (inner === 'name') return `stage.${stage.key}.name`;
  if (inner !== 'steps') return `stage.${stage.key}.steps`;
  const step = typeof i === 'number' ? stage.steps[i] : undefined;
  if (!step) return `stage.${stage.key}.steps`;
  if (param === undefined) return `step.${step.id}`;
  return `step.${step.id}.${String(param)}`;
}

// The blank and half-typed fields, which the schema would only call "invalid input".
function ownChecks(draft: Draft): [string, string][] {
  const found: [string, string][] = [];
  if (BLANK.test(draft.title)) found.push(['title', 'Fill this in.']);
  if (BLANK.test(draft.author)) found.push(['author', 'Fill this in. A nickname is fine.']);
  if (draft.stages.length === 0) found.push(['stages', 'Add a stage.']);
  for (const stage of draft.stages) {
    if (BLANK.test(stage.name)) found.push([`stage.${stage.key}.name`, 'Fill this in.']);
    if (stage.steps.length === 0) {
      found.push([`stage.${stage.key}.steps`, 'Add a step, or remove this stage.']);
    }
    for (const step of stage.steps) {
      if (BLANK.test(step.label))
        found.push([`step.${step.id}.label`, 'Write what the player does.']);
      if (!isKnownStepType(step.type)) continue;
      for (const key of PARAMS[step.type]) {
        if (key === 'bracket' || key === 'row') continue;
        if (key === 'specId' && !isPerSpec(step.params.bracket)) continue;
        const value = readWhole(step.params[key] ?? '');
        const field = `step.${step.id}.${key}`;
        if (value === undefined) {
          found.push([field, key === 'specId' ? 'Pick a spec.' : 'Fill this in.']);
        } else if (typeof value === 'string') {
          found.push([field, 'Write a whole number, like 1500.']);
        }
      }
    }
  }
  return found;
}

function problemsOf(draft: Draft, issues: readonly z.core.$ZodIssue[]): Problem[] {
  const messages = new Map<string, string>();
  for (const [field, message] of ownChecks(draft)) {
    if (!messages.has(field)) messages.set(field, message);
  }
  for (const { path, issue } of flattenIssues(issues)) {
    const field = fieldOf(draft, path);
    // A rule about the whole step (a spec for Solo Shuffle) is already said at its own field.
    const saidInside = [...messages.keys()].some((key) => key.startsWith(`${field}.`));
    if (!messages.has(field) && !(field.startsWith('step.') && saidInside)) {
      messages.set(field, messageFor(issue));
    }
  }
  const fields = fieldsOf(draft);
  const order = [...fields.keys()];
  const rank = (field: string) => {
    const at = order.indexOf(field);
    return at < 0 ? order.length : at;
  };
  return [...messages]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([field, message]) => ({
      field,
      where: fields.get(field) ?? (field === 'rev' ? 'Version' : 'The road'),
      message,
    }));
}

// The code for a draft, or what to fix first. `size` is the code's length either way, so the
// editor can show how close a road is to the cap before it is finished.
export function makeCode(draft: Draft): Made {
  const built = buildRoad(draft);
  const size = writeBody(CODE_PREFIX, built).length;
  const parsed = roadSchema.safeParse(built);
  if (!parsed.success) {
    return { ok: false, problems: problemsOf(draft, parsed.error.issues), size, tooLong: false };
  }
  const encoded = encodeRoad(parsed.data);
  if (!encoded.ok) return { ok: false, problems: [], size, tooLong: true };
  return { ok: true, road: parsed.data, code: encoded.code, size: encoded.code.length };
}
