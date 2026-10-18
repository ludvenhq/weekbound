'use client';

import { Box, chakra, Flex, Link, Text } from '@chakra-ui/react';
import { memo } from 'react';
import { textButton } from '@/components/buttons';
import { isPerSpec, PARAMS, withType, type DraftStep, type ParamKey } from '@/lib/editor/draft';
import { idFromLink, KNOWN_SPEC_IDS, LOOKUP, SPECS, takesLink } from '@/lib/editor/game';
import {
  BRACKET_NAMES,
  LABEL_EXAMPLES,
  paramName,
  ROW_NAMES,
  TYPE_HELP,
  TYPE_NAMES,
  TYPE_ORDER,
} from '@/lib/editor/words';
import { isKnownStepType, MAX_LENGTH, PVP_BRACKETS, VAULT_ROWS } from '@/lib/road/schema';
import { SelectField, Tag, TextField } from './fields';
import { GameSearch, SEARCHABLE } from './game-search';

export type FieldProps = {
  // The message for a field, once the author has left it.
  error: (field: string) => string | null;
  onTouch: (field: string) => void;
};

export const quietAction = {
  fontSize: '0.9375rem',
  color: 'textMuted',
  _hover: { color: 'text', textDecorationColor: '{colors.text}' },
  _disabled: { opacity: 0.4, cursor: 'default', _hover: { color: 'textMuted' } },
} as const;

function Params({
  step,
  error,
  onTouch,
  onParams,
}: FieldProps & { step: DraftStep; onParams: (params: DraftStep['params']) => void }) {
  if (!isKnownStepType(step.type)) return null;
  const { params } = step;
  const set = (key: ParamKey, value: string) => onParams({ ...params, [key]: value });
  const key = (param: string) => `step.${step.id}.${param}`;

  return PARAMS[step.type].map((param) => {
    const field = key(param);
    const label = paramName(step.type, param);
    const common = { field, label, error: error(field), onBlur: () => onTouch(field) };
    switch (param) {
      case 'bracket':
        return (
          <SelectField
            key={param}
            {...common}
            width="200px"
            value={params.bracket ?? ''}
            onChange={(v) => set('bracket', v)}
          >
            {PVP_BRACKETS.map((bracket) => (
              <option key={bracket} value={bracket}>
                {BRACKET_NAMES[bracket]}
              </option>
            ))}
          </SelectField>
        );
      case 'row':
        return (
          <SelectField
            key={param}
            {...common}
            width="160px"
            value={params.row ?? ''}
            onChange={(v) => set('row', v)}
          >
            {VAULT_ROWS.map((row) => (
              <option key={row} value={row}>
                {ROW_NAMES[row]}
              </option>
            ))}
          </SelectField>
        );
      case 'specId': {
        if (!isPerSpec(params.bracket)) return null;
        const other =
          params.specOther === '1' || (!!params.specId && !KNOWN_SPEC_IDS.has(params.specId));
        return (
          <Flex key={param} flex="1 1 100%" wrap="wrap" gap="12px 16px">
            <SelectField
              {...common}
              field={other ? key('specChoice') : field}
              error={other ? null : common.error}
              width="240px"
              value={other ? 'other' : (params.specId ?? '')}
              onChange={(value) =>
                onParams(
                  value === 'other'
                    ? { ...params, specId: '', specOther: '1' }
                    : { ...params, specId: value, specOther: '' },
                )
              }
            >
              <option value="">Pick a spec</option>
              {SPECS.map((group) => (
                <optgroup key={group.class} label={group.class}>
                  {group.specs.map(([id, name]) => (
                    <option key={id} value={String(id)}>
                      {name} {group.class}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="other">Another spec, by its id</option>
            </SelectField>
            {other && (
              <TextField
                {...common}
                label="Spec id"
                width="140px"
                numeric
                value={params.specId ?? ''}
                onChange={(v) => set('specId', v)}
              />
            )}
          </Flex>
        );
      }
      case 'n':
        if (step.type === 'vault') {
          return (
            <SelectField
              key={param}
              {...common}
              width="120px"
              value={params.n ?? ''}
              onChange={(v) => set('n', v)}
            >
              {['1', '2', '3'].map((slots) => (
                <option key={slots} value={slots}>
                  {slots}
                </option>
              ))}
            </SelectField>
          );
        }
        return (
          <TextField
            key={param}
            {...common}
            width="140px"
            numeric
            value={params.n ?? ''}
            onChange={(v) => set('n', v)}
          />
        );
      default: {
        const searchable = SEARCHABLE[param];
        const idField = (
          <TextField
            key={param}
            {...common}
            width="180px"
            numeric={!takesLink(param)}
            placeholder={takesLink(param) ? 'A number or a link' : undefined}
            value={params[param] ?? ''}
            onChange={(v) => set(param, idFromLink(v, param))}
          />
        );
        if (!searchable) return idField;
        return (
          <Flex key={param} flex="1 1 100%" wrap="wrap" gap="12px 16px" align="flex-start">
            {idField}
            <GameSearch kind={searchable} onPick={(found) => set(param, String(found))} />
          </Flex>
        );
      }
    }
  });
}

// What a step row can do to the draft. The editor makes these once, so they never change.
export type StepActions = {
  touch: (field: string) => void;
  change: (step: DraftStep) => void;
  move: (id: string, by: -1 | 1) => void;
  remove: (step: DraftStep, stageKey: string, index: number) => void;
};

type StepRowProps = {
  step: DraftStep;
  stageKey: string;
  number: number;
  canUp: boolean;
  canDown: boolean;
  // The messages for this step's fields that the author has left.
  errors: Readonly<Record<string, string>>;
  actions: StepActions;
};

function sameErrors(a: StepRowProps['errors'], b: StepRowProps['errors']) {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

// One step being made: what the player does, the kind of step and its parameters. The row is a
// surface like My road's tick rows, so the two read as the same thing. It draws again only when
// its own step, place or messages change, so a long road stays quick to type in.
export const StepRow = memo(
  function StepRow({ step, stageKey, number, canUp, canDown, errors, actions }: StepRowProps) {
    const error = (field: string) => errors[field] ?? null;
    const onTouch = actions.touch;
    const onChange = actions.change;
    const onMove = (by: -1 | 1) => actions.move(step.id, by);
    const onRemove = () => actions.remove(step, stageKey, number - 1);
    // Null for a type from a newer Weekbound.
    const known = isKnownStepType(step.type) ? step.type : null;
    const label = `step.${step.id}.label`;
    const lookup = known
      ? PARAMS[known].map((param) => LOOKUP[param]).find((url) => url !== undefined)
      : undefined;

    return (
      <Box
        as="li"
        bg="surface"
        borderWidth="1px"
        borderColor="line"
        px={{ base: '14px', sm: '18px' }}
        py="14px"
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap="4px 16px" mb="10px">
          <Tag>Step {number}</Tag>
          <Flex gap="16px">
            <chakra.button
              type="button"
              css={textButton}
              {...quietAction}
              disabled={!canUp}
              onClick={() => onMove(-1)}
              aria-label={`Move step ${number} up`}
            >
              Up
            </chakra.button>
            <chakra.button
              type="button"
              css={textButton}
              {...quietAction}
              disabled={!canDown}
              onClick={() => onMove(1)}
              aria-label={`Move step ${number} down`}
            >
              Down
            </chakra.button>
            <chakra.button
              type="button"
              css={textButton}
              {...quietAction}
              onClick={onRemove}
              aria-label={`Remove step ${number}`}
            >
              Remove
            </chakra.button>
          </Flex>
        </Flex>

        <TextField
          field={label}
          label="What the player does"
          placeholder={known ? LABEL_EXAMPLES[known] : undefined}
          max={MAX_LENGTH.label}
          error={error(label)}
          onBlur={() => onTouch(label)}
          value={step.label}
          onChange={(value) => onChange({ ...step, label: value })}
        />

        <Flex mt="12px" wrap="wrap" gap="12px 16px">
          <SelectField
            field={`step.${step.id}.type`}
            label="Kind of step"
            width="240px"
            value={step.type}
            onChange={(type) => onChange(withType(step, type))}
          >
            {TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {TYPE_NAMES[type]}
              </option>
            ))}
            {!known && <option value={step.type}>{step.type} (from a newer Weekbound)</option>}
          </SelectField>
          <Params
            step={step}
            error={error}
            onTouch={onTouch}
            onParams={(params) => onChange({ ...step, params })}
          />
        </Flex>

        <Text mt="10px" fontSize="0.9375rem" color="textMuted">
          {known
            ? TYPE_HELP[known]
            : 'A kind of step from a newer Weekbound. It stays as it is, and players tick it by hand.'}
          {lookup && (
            <>
              {' '}
              <Link
                href={lookup}
                target="_blank"
                rel="noopener noreferrer"
                color="text"
                textDecoration="underline"
                textUnderlineOffset="4px"
                textDecorationColor="lineStrong"
                _hover={{ textDecorationColor: 'text' }}
              >
                Find it on Wowhead
              </Link>
            </>
          )}
        </Text>
      </Box>
    );
  },
  (a, b) =>
    a.step === b.step &&
    a.stageKey === b.stageKey &&
    a.number === b.number &&
    a.canUp === b.canUp &&
    a.canDown === b.canDown &&
    a.actions === b.actions &&
    sameErrors(a.errors, b.errors),
);
