import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeRoad, encodeRoad, MAX_CODE_BYTES } from '../road/code.ts';
import { codeFromHash, roadLink } from '../road/link.ts';
import { MAX_LENGTH, MAX_STAGES, MAX_STEPS_PER_STAGE, type Road } from '../road/schema.ts';
import { makeCode, type Made } from './check.ts';
import {
  addStage,
  addStep,
  buildRoad,
  draftSchema,
  handOut,
  isBlank,
  moveStep,
  newDraft,
  remixDraft,
  removeStep,
  roadIdFor,
  setStage,
  setStep,
  slugify,
  versionDraft,
  withType,
  type Draft,
} from './draft.ts';
import { idFromLink } from './game.ts';

const samples = resolve(import.meta.dirname, '../../../../samples/valid');
const sampleRoads: [string, Road, string][] = readdirSync(samples)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => {
    const sample = JSON.parse(readFileSync(resolve(samples, file), 'utf8')) as {
      road: Road;
    };
    const encoded = encodeRoad(sample.road);
    if (!encoded.ok) throw new Error(file);
    return [file, sample.road, encoded.code];
  });
const sample = (file: string) => sampleRoads.find(([name]) => name === file)![1];

// A draft with everything filled: one stage of one step that ticks by hand.
function filled(title = 'My first road'): Draft {
  const draft = { ...newDraft('A player'), title };
  const stage = draft.stages[0]!;
  const step = stage.steps[0]!;
  return setStep(setStage(draft, stage.key, { name: 'Warm up' }), step.id, (s) => ({
    ...s,
    label: 'Run one dungeon with friends',
  }));
}

function ready(made: Made) {
  if (!made.ok) throw new Error(JSON.stringify(made));
  return made;
}

describe('a new road', () => {
  it('lists what is missing, in the order of the page', () => {
    const draft = newDraft();
    const made = makeCode(draft);
    expect(made.ok).toBe(false);
    if (made.ok) return;
    expect(made.problems.map((p) => p.where)).toEqual([
      'Road name',
      'Your name',
      'Stage 1 name',
      'Stage 1, step 1',
    ]);
    expect(isBlank(draft)).toBe(true);
  });

  it('gets a code that opens to the same road, at rev 1, with a p- id from its title', () => {
    const draft = filled();
    const made = ready(makeCode(draft));
    expect(made.road.rev).toBe(1);
    expect(made.road.id).toBe(`p-my-first-road-${draft.suffix}`);
    expect(made.road.license).toBe('CC-BY-4.0');
    expect(decodeRoad(made.code)).toStrictEqual({ ok: true, road: made.road });
    expect(isBlank(draft)).toBe(false);
  });

  it('never makes a reserved id, whatever the title', () => {
    for (const title of ['SR healer', 'sr-returning-player', 'SR', '---', 'Путь']) {
      const made = ready(makeCode(filled(title)));
      expect(made.road.id.startsWith('p-')).toBe(true);
      expect(decodeRoad(made.code).ok).toBe(true);
    }
    expect(roadIdFor('Путь', 'abc123')).toBe('p-road-abc123');
  });

  it('makes the slug from ASCII words, cut at a word', () => {
    expect(slugify('Łódź, Straße & Ünïcödé!')).toBe('lodz-strasse-unicode');
    expect(slugify('a very long title '.repeat(10))).toBe('a-very-long-title-a-very-long-title-a');
    expect(roadIdFor('x'.repeat(200), 'abc123')).toBe(`p-${'x'.repeat(40)}-abc123`);
  });

  it('survives a save in the browser', () => {
    const draft = filled();
    expect(draftSchema.parse(JSON.parse(JSON.stringify(draft)))).toStrictEqual(draft);
  });
});

describe('versions', () => {
  it('rebuilds every sample road unchanged, to the same code', () => {
    for (const [, road, code] of sampleRoads) {
      const made = ready(makeCode(versionDraft(road)));
      expect(made.road).toStrictEqual(road);
      expect(made.code).toBe(code);
    }
  });

  it('makes the next rev of the same road once something changes, keeping step ids', () => {
    const road = sample('first-week.json');
    const draft = versionDraft(road);
    const first = draft.stages[0]!.steps[0]!;
    const changed = setStep(draft, first.id, (s) => ({ ...s, label: 'A better label' }));
    const made = ready(makeCode(changed));
    expect(made.road.id).toBe(road.id);
    expect(made.road.rev).toBe(road.rev + 1);
    expect(made.road.stages[0]!.steps[0]!.id).toBe(first.id);

    // Changing it back is the same version again.
    const back = setStep(changed, first.id, () => first);
    expect(ready(makeCode(back)).road.rev).toBe(road.rev);
  });

  it('gives a new step an id no other step has', () => {
    const road = sample('every-step-type.json');
    const before = new Set(road.stages.flatMap((stage) => stage.steps.map((step) => step.id)));
    const opened = versionDraft(road);
    const { draft, stepId } = addStep(opened, opened.stages[0]!.key);
    expect(before.has(stepId)).toBe(false);
    expect(
      draft.stages.flatMap((stage) => stage.steps).filter((s) => s.id === stepId),
    ).toHaveLength(1);
  });

  it('starts the next version after a code is handed out', () => {
    const draft = filled();
    const first = ready(makeCode(draft)).road;
    const out = handOut(draft, first);
    expect(ready(makeCode(out)).road.rev).toBe(1);
    const edited = { ...out, title: 'My first road, fixed' };
    const second = ready(makeCode(edited)).road;
    expect(second.rev).toBe(2);
    // The id was fixed when the first code left, so a new title keeps it.
    expect(second.id).toBe(first.id);
  });

  it('keeps steps of a type from a newer Slow Road as they are', () => {
    const road = sample('unknown-step-type.json');
    expect(ready(makeCode(versionDraft(road))).road).toStrictEqual(road);
  });
});

describe('remixes', () => {
  it('get a fresh id at rev 1 and name the road they came from', () => {
    const road = sample('every-step-type.json');
    const draft = remixDraft(road, 'Someone else');
    const made = ready(makeCode(draft));
    expect(made.road.id).not.toBe(road.id);
    expect(made.road.id.startsWith('p-every-step-type-')).toBe(true);
    expect(made.road.rev).toBe(1);
    expect(made.road.author).toBe('Someone else');
    expect(made.road.basedOn).toEqual({ id: road.id, rev: road.rev, author: road.author });
  });

  it('may name a studio road as the source', () => {
    const studio: Road = { ...sample('first-week.json'), id: 'sr-returning-player', rev: 3 };
    const made = ready(makeCode(remixDraft(studio, 'A healer')));
    expect(made.road.basedOn?.id).toBe('sr-returning-player');
    expect(decodeRoad(made.code).ok).toBe(true);
  });
});

describe('fields', () => {
  function oneStep(type: string, params: Record<string, string>) {
    const draft = filled();
    const id = draft.stages[0]!.steps[0]!.id;
    const typed = setStep(draft, id, (s) => ({ ...withType(s, type), params }));
    return { made: makeCode(typed), id, draft: typed };
  }

  it('read numbers as authors type them and say what is wrong at the field', () => {
    expect(
      ready(oneStep('mythic-plus-rating', { n: '1,500' }).made).road.stages[0]!.steps[0],
    ).toMatchObject({ n: 1500 });

    const cases: [Record<string, string>, string][] = [
      [{ bracket: '2v2', n: '' }, 'Fill this in.'],
      [{ bracket: '2v2', n: '1.5' }, 'Write a whole number, like 1500.'],
      [{ bracket: '2v2', n: '5000' }, 'At most 4,000.'],
      [{ bracket: '2v2', n: '0' }, 'At least 1.'],
    ];
    for (const [params, message] of cases) {
      const { made, id } = oneStep('pvp-rating', params);
      expect(made.ok).toBe(false);
      if (made.ok) continue;
      expect(made.problems).toEqual([
        { field: `step.${id}.n`, where: 'Stage 1, step 1, rating', message },
      ]);
    }
  });

  it('ask for a spec only for Solo Shuffle and Blitz', () => {
    const shuffle = oneStep('pvp-rating', { bracket: 'shuffle', n: '1800' });
    expect(shuffle.made.ok).toBe(false);
    if (!shuffle.made.ok) {
      expect(shuffle.made.problems).toEqual([
        {
          field: `step.${shuffle.id}.specId`,
          where: 'Stage 1, step 1, spec',
          message: 'Pick a spec.',
        },
      ]);
    }
    const twos = oneStep('pvp-rating', { bracket: '2v2', n: '1800', specId: '105' });
    expect(ready(twos.made).road.stages[0]!.steps[0]).not.toHaveProperty('specId');
  });

  it('say when text is over its limit', () => {
    const draft = { ...filled(), title: 'x'.repeat(MAX_LENGTH.title + 1) };
    const made = makeCode(draft);
    expect(made.ok).toBe(false);
    if (!made.ok) {
      expect(made.problems).toEqual([
        { field: 'title', where: 'Road name', message: 'Must be at most 80 characters.' },
      ]);
    }
  });

  it('take the id from a Wowhead link of the matching kind only', () => {
    const link = 'https://www.wowhead.com/achievement=40953/a-farewell-to-arms';
    expect(idFromLink(link, 'achievementId')).toBe('40953');
    expect(idFromLink('https://www.wowhead.com/de/quest=78713', 'questId')).toBe('78713');
    expect(idFromLink(link, 'questId')).toBe(link);
    expect(idFromLink('https://www.wowhead.com/spell=458', 'mountId')).toBe(
      'https://www.wowhead.com/spell=458',
    );
  });
});

describe('the size cap', () => {
  it('refuses a road too long for one code and says how long it is', () => {
    let draft = { ...filled(), stages: [] as Draft['stages'] };
    for (let s = 0; s < MAX_STAGES; s++) {
      const added = addStage(draft);
      draft = added.draft;
      const stage = draft.stages[s]!;
      draft = setStage(draft, stage.key, { name: `Stage ${s + 1}` });
      for (let i = 1; i < MAX_STEPS_PER_STAGE; i++) draft = addStep(draft, stage.key).draft;
    }
    for (const step of draft.stages.flatMap((stage) => stage.steps)) {
      draft = setStep(draft, step.id, (s) => ({ ...s, label: 'L'.repeat(MAX_LENGTH.label) }));
    }
    const made = makeCode(draft);
    expect(made).toMatchObject({ ok: false, tooLong: true, problems: [] });
    expect(made.size).toBeGreaterThan(MAX_CODE_BYTES);
  });
});

describe('moving steps', () => {
  it('moves across a stage edge into the stage next to it', () => {
    const base = addStage(filled()).draft;
    const [one, two] = base.stages;
    const top = one!.steps[0]!.id;
    const down = moveStep(base, top, 1);
    expect(down.stages[0]!.steps).toHaveLength(0);
    expect(down.stages[1]!.steps.map((s) => s.id)).toEqual([top, two!.steps[0]!.id]);
    const up = moveStep(down, top, -1);
    expect(up.stages[0]!.steps.map((s) => s.id)).toEqual([top]);
    expect(up.stages[1]!.steps.map((s) => s.id)).toEqual([two!.steps[0]!.id]);
    // The first step of the road cannot go further up.
    expect(moveStep(base, top, -1)).toBe(base);
    expect(removeStep(base, top).stages[0]!.steps).toHaveLength(0);
  });
});

describe('road links', () => {
  it('carry a code to My road and back out of the hash', () => {
    const code = ready(makeCode(filled())).code;
    const link = roadLink(code);
    expect(link.startsWith('/my-road#road=SR1!')).toBe(true);
    expect(codeFromHash(link.slice(link.indexOf('#')))).toBe(code);
    expect(codeFromHash('#other')).toBeNull();
  });

  it('build the road the draft shows', () => {
    const draft = filled();
    expect(buildRoad(draft)).toMatchObject({ title: draft.title, rev: 1 });
  });
});
