'use client';

import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { secondaryButton, textButton } from '@/components/buttons';
import type { DraftStage } from '@/lib/editor/draft';
import { MAX_LENGTH, MAX_STEPS_PER_STAGE } from '@/lib/road/schema';
import { fieldId, Tag, TextField } from './fields';
import { quietAction, type FieldProps } from './step-row';

const STAGE_EXAMPLES = ['Find your feet', 'Into rated play', 'A season at your pace'];

// One stage: a section with its name and its steps as rows, never a card around cards.
export function StageBlock({
  stage,
  number,
  count,
  error,
  onTouch,
  onName,
  onMove,
  onRemove,
  onAddStep,
  children,
}: FieldProps & {
  stage: DraftStage;
  number: number;
  count: number;
  onName: (name: string) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
  onAddStep: () => void;
  children: ReactNode;
}) {
  const name = `stage.${stage.key}.name`;
  const stepsError = error(`stage.${stage.key}.steps`);
  const full = stage.steps.length >= MAX_STEPS_PER_STAGE;

  return (
    <Box
      as="section"
      aria-label={`Stage ${number}`}
      borderTopWidth="1px"
      borderColor="line"
      pt="28px"
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap="4px 16px" mb="10px">
        <Flex align="center" gap="10px">
          <Box
            aria-hidden
            w="12px"
            h="12px"
            transform="rotate(45deg)"
            borderWidth="2px"
            borderColor="accent"
            bg="background"
          />
          <Tag>Stage {number}</Tag>
        </Flex>
        <Flex gap="16px">
          <chakra.button
            type="button"
            css={textButton}
            {...quietAction}
            disabled={number === 1}
            onClick={() => onMove(-1)}
            aria-label={`Move stage ${number} up`}
          >
            Up
          </chakra.button>
          <chakra.button
            type="button"
            css={textButton}
            {...quietAction}
            disabled={number === count}
            onClick={() => onMove(1)}
            aria-label={`Move stage ${number} down`}
          >
            Down
          </chakra.button>
          <chakra.button
            type="button"
            css={textButton}
            {...quietAction}
            onClick={onRemove}
            aria-label={`Remove stage ${number}`}
          >
            Remove stage
          </chakra.button>
        </Flex>
      </Flex>

      <TextField
        field={name}
        label="Stage name"
        display="stage"
        max={MAX_LENGTH.stageName}
        placeholder={STAGE_EXAMPLES[(number - 1) % STAGE_EXAMPLES.length]}
        error={error(name)}
        onBlur={() => onTouch(name)}
        value={stage.name}
        onChange={onName}
      />

      <chakra.ol listStyleType="none" m="0" p="0" mt="18px" display="grid" gap="8px">
        {children}
      </chakra.ol>
      {stepsError && (
        <Text mt="8px" fontSize="0.9375rem" color="error">
          {stepsError}
        </Text>
      )}

      <Flex mt="12px" align="center" wrap="wrap" gap="8px 18px">
        {/* "Add a step" stands for the stage's steps, so a to-do about them leads here. */}
        <chakra.button
          id={fieldId(`stage.${stage.key}.steps`)}
          type="button"
          css={secondaryButton}
          disabled={full}
          _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          onClick={onAddStep}
        >
          Add a step
        </chakra.button>
        {stage.steps.length >= MAX_STEPS_PER_STAGE - 5 && (
          <Text fontSize="0.9375rem" color="textMuted">
            {stage.steps.length} of {MAX_STEPS_PER_STAGE} steps
          </Text>
        )}
      </Flex>
    </Box>
  );
}
