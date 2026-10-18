'use client';

import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { Row } from '@/lib/walk/walk';
import { stepTarget } from '@/lib/walk/words';

const CHECK = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
    <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
  </svg>
);

// One step: the whole row ticks it, Skip sits at its end (DESIGN.md, Tick row). `celebrate` plays
// the small tick moment on the step just done; `marker` is drawn beside the row (the home page's
// road stones).
export function TickRow({
  row,
  celebrate,
  marker,
  onTick,
  onSkip,
}: {
  row: Row;
  celebrate: boolean;
  marker?: ReactNode;
  onTick: () => void;
  onSkip: () => void;
}) {
  const done = row.mark?.state === 'done';
  const skipped = row.mark?.state === 'skipped';
  const target = stepTarget(row.step);
  const status = done ? 'done' : skipped ? 'skipped' : null;
  const meta = [target, status].filter(Boolean).join(' · ');

  return (
    <Flex
      as="li"
      position="relative"
      align="stretch"
      minH="76px"
      bg="surface"
      borderWidth="1px"
      borderColor="line"
      opacity={skipped ? 0.55 : 1}
      transition="opacity 150ms ease-out"
    >
      {marker}
      <chakra.button
        type="button"
        role="checkbox"
        aria-checked={done}
        onClick={onTick}
        flex="1"
        display="flex"
        alignItems="center"
        gap={{ base: '14px', sm: '18px' }}
        px={{ base: '14px', sm: '20px' }}
        py="14px"
        bg="none"
        color="inherit"
        textAlign="left"
        cursor="pointer"
        _hover={{ bg: 'surfaceHover' }}
        _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
      >
        <Box
          flex="none"
          w={{ base: '24px', sm: '28px' }}
          h={{ base: '24px', sm: '28px' }}
          display="grid"
          placeItems="center"
          borderWidth="2px"
          borderColor={done ? 'accent' : row.current ? 'primary' : 'lineStrong'}
          bg={done ? 'accent' : 'transparent'}
          color="background"
          transition="background-color 150ms ease-out, border-color 150ms ease-out"
          animation={celebrate ? 'tick 250ms ease-out' : undefined}
        >
          {done && CHECK}
        </Box>
        <Box minW="0">
          <Text
            fontWeight="500"
            fontSize={{ base: '1.125rem', sm: '1.25rem' }}
            lineHeight="1.3"
            color={done ? 'textMuted' : 'text'}
            overflowWrap="anywhere"
          >
            {row.step.label}
          </Text>
          {meta && (
            <Text
              fontSize={{ base: '1rem', sm: '1.0625rem' }}
              color="textMuted"
              fontVariantNumeric="lining-nums tabular-nums"
            >
              {target}
              {target && status && ' · '}
              {status && <chakra.span color={done ? 'accent' : undefined}>{status}</chakra.span>}
            </Text>
          )}
        </Box>
      </chakra.button>
      {/* A done step is undone by its own tick, so only open and skipped steps carry this. */}
      <chakra.button
        type="button"
        onClick={onSkip}
        hidden={done}
        flex="none"
        borderLeftWidth="1px"
        borderColor="line"
        px={{ base: '14px', sm: '22px' }}
        bg="none"
        color="textMuted"
        fontSize="1rem"
        cursor="pointer"
        _hover={{ color: 'text', bg: 'surfaceHover' }}
        _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
        aria-label={skipped ? `Undo skipping: ${row.step.label}` : `Skip: ${row.step.label}`}
      >
        {skipped ? 'Undo' : 'Skip'}
      </chakra.button>
    </Flex>
  );
}
