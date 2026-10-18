'use client';

import { Box, chakra, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { secondaryButton, textButton } from '@/components/buttons';
import { Fold } from '@/components/fold';
import { Message } from '@/components/message';
import { Columns, pageTitle, stickyColumn } from '@/components/page';
import { makeCode } from '@/lib/editor/check';
import {
  addStage,
  addStep,
  buildRoad,
  handOut,
  isBlank,
  moveStage,
  moveStep,
  newDraft,
  remixDraft,
  removeStage,
  removeStep,
  setStage,
  setStep,
  versionDraft,
  type Draft,
} from '@/lib/editor/draft';
import { remixFromHash, roadLink } from '@/lib/road/link';
import { MAX_LENGTH, MAX_STAGES, MAX_STEPS_PER_STAGE, type Road } from '@/lib/road/schema';
import { studioRoad } from '@/lib/studio/roads';
import { CodePanel } from './code-panel';
import { fieldId, TextField } from './fields';
import { OpenCode, type OpenMode } from './open-code';
import { StageBlock } from './stage-block';
import { StepRow, type StepActions } from './step-row';
import { currentDraft, updateDraft, useDraft } from './use-draft';

// Where an undone change goes back to: the top of the page, a stage's place, or a step's place
// in its stage. Any other change ends the chance to undo.
type Undo = { at: string; text: string; before: Draft };

const PACES = [
  {
    value: 'weekly',
    name: 'Weekly',
    about:
      "The next stage opens at the first weekly reset after a stage is done. Slow Road's default.",
  },
  { value: 'free', name: 'Free', about: 'The next stage opens as soon as a stage is done.' },
] as const;

// After the page has drawn the change, so a new field exists to take the focus.
// A rule about a whole step leads to its label.
function focusSoon(field: string) {
  requestAnimationFrame(() => {
    const element =
      document.getElementById(fieldId(field)) ?? document.getElementById(fieldId(`${field}.label`));
    element?.focus();
    element?.scrollIntoView({ block: 'center' });
  });
}

function UndoNote({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <Box as="li" listStyleType="none" animation="arrive 250ms ease-out">
      <Message tone="info">
        <Flex justify="space-between" gap="16px" wrap="wrap">
          <Text>{text}</Text>
          <chakra.button type="button" css={textButton} onClick={onUndo}>
            Undo
          </chakra.button>
        </Flex>
      </Message>
    </Box>
  );
}

function Loading() {
  return (
    <Columns template="minmax(0, 1fr) 400px" gap={{ base: '56px', lg: '80px' }}>
      <Box aria-busy="true" aria-label="Loading the editor">
        <Box h="52px" w="55%" bg="surface" />
        <Box mt="14px" h="26px" w="80%" bg="surface" />
        <Box mt="40px" h="56px" bg="surface" />
        <Box mt="16px" h="48px" w="50%" bg="surface" />
        <Box mt="40px" h="180px" bg="surface" />
      </Box>
      <Box h="220px" bg="surface" />
    </Columns>
  );
}

export function Editor() {
  const draft = useDraft();
  const router = useRouter();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [undo, setUndo] = useState<Undo | null>(null);

  // Every change goes through here; a removal can be undone until the next change.
  const edit = useCallback(
    (change: (current: Draft) => Draft, undoable?: { at: string; text: string }) => {
      const before = currentDraft();
      updateDraft(change);
      setUndo(undoable ? { ...undoable, before } : null);
    },
    [],
  );
  const touch = useCallback(
    (field: string) =>
      setTouched((current) => (current.has(field) ? current : new Set([...current, field]))),
    [],
  );
  const stepActions = useMemo<StepActions>(
    () => ({
      touch,
      change: (step) => edit((d) => setStep(d, step.id, () => step)),
      move: (id, by) => edit((d) => moveStep(d, id, by)),
      remove: (step, stageKey, index) =>
        edit((d) => removeStep(d, step.id), {
          at: `step:${stageKey}:${index}`,
          text: `Removed step ${index + 1}${step.label.trim() ? `: ${step.label.trim()}` : ''}.`,
        }),
    }),
    [edit, touch],
  );

  // A studio road's page starts a remix with /editor#remix=sr-…, and the link then leaves the
  // address bar. Like opening a code, it can be undone, so the road the author was making stays.
  const ready = draft !== null;
  useEffect(() => {
    if (!ready) return;
    const id = remixFromHash(window.location.hash);
    if (id === null) return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    const road = studioRoad(id);
    if (!road) return;
    edit(() => remixDraft(road, currentDraft().author), {
      at: 'top',
      text: `Started a remix of ${road.title}, by ${road.author}.`,
    });
    setTouched(new Set());
  }, [ready, edit]);

  if (!draft) return <Loading />;
  const made = makeCode(draft);
  const rev = made.ok ? made.road.rev : Number(buildRoad(draft).rev);
  const problems = new Map(made.ok ? [] : made.problems.map((p) => [p.field, p.message]));

  // Only the fields the author has left say what is wrong with them.
  const shown = new Map([...problems].filter(([field]) => touched.has(field)));
  const error = (field: string) => shown.get(field) ?? null;
  const stepErrors = (id: string) =>
    Object.fromEntries(
      [...shown].filter(([field]) => field === `step.${id}` || field.startsWith(`step.${id}.`)),
    );

  function restore() {
    if (!undo) return;
    updateDraft(() => undo.before);
    setUndo(null);
  }

  function open(road: Road, mode: OpenMode) {
    const author = draft!.author;
    edit(() => (mode === 'version' ? versionDraft(road) : remixDraft(road, author)), {
      at: 'top',
      text:
        mode === 'version'
          ? `Opened ${road.title}. Your changes make version ${road.rev + 1}.`
          : `Started a remix of ${road.title}, by ${road.author}.`,
    });
    setTouched(new Set());
  }

  function walk(road: Road, code: string) {
    updateDraft((current) => handOut(current, road));
    router.push(roadLink(code));
  }

  const undoAt = (at: string) =>
    undo?.at === at ? <UndoNote text={undo.text} onUndo={restore} /> : null;

  const stages: ReactNode[] = draft.stages.map((stage, s) => (
    <Fragment key={stage.key}>
      {undoAt(`stage:${s}`)}
      <chakra.li>
        <StageBlock
          stage={stage}
          number={s + 1}
          count={draft.stages.length}
          error={error}
          onTouch={touch}
          onName={(name) => edit((d) => setStage(d, stage.key, { name }))}
          onMove={(by) => edit((d) => moveStage(d, stage.key, by))}
          onRemove={() =>
            edit((d) => removeStage(d, stage.key), {
              at: `stage:${s}`,
              text: `Removed stage ${s + 1}${stage.name.trim() ? `, ${stage.name.trim()}` : ''}.`,
            })
          }
          onAddStep={() => {
            const added = addStep(draft, stage.key);
            edit(() => added.draft);
            focusSoon(`step.${added.stepId}.label`);
          }}
        >
          {stage.steps.map((step, i) => (
            <Fragment key={step.id}>
              {undoAt(`step:${stage.key}:${i}`)}
              <StepRow
                step={step}
                stageKey={stage.key}
                number={i + 1}
                // A step leaves its stage only into a stage with room (moveStep).
                canUp={
                  i > 0 ||
                  (draft.stages[s - 1]?.steps.length ?? MAX_STEPS_PER_STAGE) < MAX_STEPS_PER_STAGE
                }
                canDown={
                  i < stage.steps.length - 1 ||
                  (draft.stages[s + 1]?.steps.length ?? MAX_STEPS_PER_STAGE) < MAX_STEPS_PER_STAGE
                }
                errors={stepErrors(step.id)}
                actions={stepActions}
              />
            </Fragment>
          ))}
          {undoAt(`step:${stage.key}:${stage.steps.length}`)}
        </StageBlock>
      </chakra.li>
    </Fragment>
  ));

  return (
    <Columns template="minmax(0, 1fr) 400px" gap={{ base: '56px', lg: '80px' }}>
      <Stack gap="0">
        <Heading as="h1" {...pageTitle}>
          Make a road.
        </Heading>
        <Text mt="14px" fontSize="1.25rem" color="textMuted" maxW="54ch">
          A road is stages of steps. Players see three steps at a time and, at weekly pace, one
          stage a week. The code is made in your browser; nothing is sent anywhere.
        </Text>

        <Box mt="24px" borderBottomWidth="1px" borderColor="line">
          <Fold summary="Open a road code to change it or remix it">
            <OpenCode onOpen={open} />
          </Fold>
        </Box>
        {!isBlank(draft) && (
          <Flex mt="12px">
            <chakra.button
              type="button"
              css={textButton}
              color="textMuted"
              fontSize="1rem"
              onClick={() => {
                edit(() => newDraft(draft.author), { at: 'top', text: 'Started a new road.' });
                setTouched(new Set());
              }}
            >
              Start a new road
            </chakra.button>
          </Flex>
        )}
        {undo?.at === 'top' && (
          <chakra.ul m="0" p="0" mt="16px">
            {undoAt('top')}
          </chakra.ul>
        )}

        <Stack as="section" aria-label="The road" gap="18px" mt="32px">
          <TextField
            field="title"
            label="Road name"
            display="title"
            max={MAX_LENGTH.title}
            placeholder="The returning healer"
            error={error('title')}
            onBlur={() => touch('title')}
            value={draft.title}
            onChange={(title) => edit((d) => ({ ...d, title }))}
          />
          <Box maxW="360px">
            <TextField
              field="author"
              label="Your name, as players will see it"
              max={MAX_LENGTH.author}
              error={error('author')}
              onBlur={() => touch('author')}
              value={draft.author}
              onChange={(author) => edit((d) => ({ ...d, author }))}
            />
          </Box>
          {draft.basedOn && (
            <Text fontSize="0.9375rem" color="textMuted">
              A remix of a road by {draft.basedOn.author} (version {draft.basedOn.rev}). Its code
              names that road, as CC BY asks.
            </Text>
          )}
          <chakra.fieldset border="0" p="0" m="0">
            <chakra.legend fontSize="0.9375rem" color="textMuted" mb="4px">
              Pace
            </chakra.legend>
            {PACES.map((pace) => (
              <chakra.label
                key={pace.value}
                display="flex"
                gap="12px"
                alignItems="flex-start"
                py="6px"
                cursor="pointer"
              >
                <chakra.input
                  type="radio"
                  name="pace"
                  value={pace.value}
                  checked={draft.pace === pace.value}
                  onChange={() => edit((d) => ({ ...d, pace: pace.value }))}
                  flex="none"
                  w="18px"
                  h="18px"
                  mt="4px"
                  css={{ accentColor: '{colors.accent}' }}
                  _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
                />
                <Box>
                  <Text fontWeight="500">{pace.name}</Text>
                  <Text fontSize="0.9375rem" color="textMuted">
                    {pace.about}
                  </Text>
                </Box>
              </chakra.label>
            ))}
          </chakra.fieldset>
        </Stack>

        <chakra.ol listStyleType="none" m="0" p="0" mt="40px" display="grid" gap="40px">
          {stages}
          {undoAt(`stage:${draft.stages.length}`)}
        </chakra.ol>
        {draft.stages.length === 0 && (
          <Text mt="12px" color="textMuted">
            No stages yet. A road needs at least one.
          </Text>
        )}
        <Flex mt="28px" align="center" wrap="wrap" gap="8px 18px">
          <chakra.button
            id={fieldId('stages')}
            type="button"
            css={secondaryButton}
            disabled={draft.stages.length >= MAX_STAGES}
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
            onClick={() => {
              const added = addStage(draft);
              edit(() => added.draft);
              focusSoon(`stage.${added.draft.stages.at(-1)!.key}.name`);
            }}
          >
            Add a stage
          </chakra.button>
          {draft.stages.length >= MAX_STAGES - 5 && (
            <Text fontSize="0.9375rem" color="textMuted">
              {draft.stages.length} of {MAX_STAGES} stages
            </Text>
          )}
        </Flex>
      </Stack>

      <Box {...stickyColumn}>
        <CodePanel
          draft={draft}
          made={made}
          rev={rev}
          onCopy={(road) => updateDraft((current) => handOut(current, road))}
          onWalk={walk}
          onProblem={(field) => {
            touch(field);
            focusSoon(field);
          }}
        />
      </Box>
    </Columns>
  );
}
