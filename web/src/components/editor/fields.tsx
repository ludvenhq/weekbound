'use client';

import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { codePoints } from '@/lib/road/schema';

// The editor's form fields (DESIGN.md, Inputs): a `background` fill, a 1px border that turns
// green on focus, and an error as a plain sentence under the field. Every field is named by the
// draft's stable key (lib/editor/check.ts), which also gives its element id.

export const fieldId = (key: string) => `f-${key.replace(/\./g, '-')}`;

const control = {
  w: '100%',
  minW: '0',
  fontFamily: 'body',
  fontSize: '1.0625rem',
  lineHeight: '1.4',
  color: 'text',
  bg: 'background',
  borderWidth: '1px',
  borderColor: 'lineStrong',
  borderRadius: '2px',
  px: '12px',
  py: '10px',
  // Faded, so an example never reads as something already typed.
  _placeholder: { color: 'textMuted', opacity: 0.6 },
  _focus: { borderColor: 'accent', outline: 'none' },
  _focusVisible: { outline: '2px solid {colors.text}', outlineOffset: '3px' },
} as const;

type Frame = {
  field: string;
  label: string;
  // Shown only once the author has left the field, so a new road is not a wall of red.
  error?: string | null;
  help?: ReactNode;
  // How wide the field wants to be in a row of fields; without it, the whole row.
  width?: string;
};

function describedBy(id: string, error: unknown, help: unknown) {
  return (
    [error ? `${id}-error` : null, help ? `${id}-help` : null].filter(Boolean).join(' ') ||
    undefined
  );
}

function FieldFrame({
  field,
  label,
  error,
  help,
  width,
  side,
  children,
}: Frame & { side?: ReactNode; children: ReactNode }) {
  const id = fieldId(field);
  return (
    <Box
      display="grid"
      gap="6px"
      alignContent="start"
      flex={width ? `0 1 ${width}` : '1 1 100%'}
      minW="0"
    >
      <Flex justify="space-between" align="baseline" gap="12px">
        <chakra.label htmlFor={id} fontSize="0.9375rem" color="textMuted">
          {label}
        </chakra.label>
        {side}
      </Flex>
      {children}
      {error && (
        <Text id={`${id}-error`} fontSize="0.9375rem" color="error">
          {error}
        </Text>
      )}
      {help && (
        <Text id={`${id}-help`} fontSize="0.9375rem" color="textMuted">
          {help}
        </Text>
      )}
    </Box>
  );
}

export function TextField({
  value,
  onChange,
  onBlur,
  max,
  placeholder,
  display,
  numeric,
  ...frame
}: Frame & {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  // Shows a count of characters as the text nears the road format's limit.
  max?: number;
  placeholder?: string;
  // Road and stage names are typed in the face they are shown in.
  display?: 'title' | 'stage';
  numeric?: boolean;
}) {
  const id = fieldId(frame.field);
  const count = max === undefined ? 0 : codePoints(value);
  const near = max !== undefined && count > max - 20;
  return (
    <FieldFrame
      {...frame}
      side={
        near && (
          <Text
            fontSize="0.875rem"
            color={count > max! ? 'error' : 'textMuted'}
            fontVariantNumeric="tabular-nums"
            aria-live="polite"
          >
            {count} of {max}
          </Text>
        )
      }
    >
      <chakra.input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={!numeric}
        inputMode={numeric ? 'numeric' : undefined}
        maxLength={1000}
        aria-invalid={frame.error ? true : undefined}
        aria-describedby={describedBy(id, frame.error, frame.help)}
        css={control}
        borderColor={frame.error ? 'error' : 'lineStrong'}
        {...(display && {
          fontFamily: 'display',
          fontWeight: '600',
          fontSize: display === 'title' ? '1.625rem' : '1.375rem',
          lineHeight: '1.15',
          py: '8px',
        })}
      />
    </FieldFrame>
  );
}

export function SelectField({
  value,
  onChange,
  onBlur,
  children,
  ...frame
}: Frame & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  children: ReactNode;
}) {
  const id = fieldId(frame.field);
  return (
    <FieldFrame {...frame}>
      <chakra.select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={frame.error ? true : undefined}
        aria-describedby={describedBy(id, frame.error, frame.help)}
        css={control}
        borderColor={frame.error ? 'error' : 'lineStrong'}
        cursor="pointer"
      >
        {children}
      </chakra.select>
    </FieldFrame>
  );
}

// "Stage 2" and "Step 3": the small-caps tags of the editor.
export function Tag({ children }: { children: ReactNode }) {
  return (
    <Text
      as="span"
      fontFamily="smallCaps"
      fontWeight="500"
      fontSize="0.875rem"
      letterSpacing="0.04em"
      color="textMuted"
    >
      {children}
    </Text>
  );
}
