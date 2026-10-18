'use client';

import { Box, chakra, Flex, Text } from '@chakra-ui/react';
import { useId, useState, type FormEvent } from 'react';
import { primaryButton, secondaryButton } from '@/components/buttons';
import { DECODE_MESSAGES, decodeRoad } from '@/lib/road/code';
import type { Road } from '@/lib/road/schema';

export const codeInput = {
  w: '100%',
  fontFamily: 'mono',
  fontSize: '0.875rem',
  color: 'text',
  bg: 'background',
  borderWidth: '1px',
  borderColor: 'lineStrong',
  borderRadius: '2px',
  px: '14px',
  py: '12px',
  _placeholder: { color: 'textMuted' },
  _focus: { borderColor: 'accent', outline: 'none' },
  _focusVisible: { outline: '2px solid {colors.text}', outlineOffset: '3px' },
} as const;

// A field for one code and the button that opens it. Errors are plain sentences under the field.
export function CodeField({
  id,
  label,
  placeholder,
  action,
  primary,
  check,
}: {
  id?: string;
  label: string;
  placeholder: string;
  action: string;
  primary: boolean;
  // Returns an error sentence, or null when the code was taken.
  check: (code: string) => string | null;
}) {
  const fallbackId = useId();
  const fieldId = id ?? fallbackId;
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const problem = check(value);
    setError(problem);
    if (problem === null) setValue('');
  }

  return (
    <chakra.form onSubmit={submit} display="flex" flexWrap="wrap" gap="12px" maxW="620px">
      <Box flex="1 1 280px" display="grid" gap="6px">
        <chakra.label htmlFor={fieldId} fontSize="0.9375rem" color="textMuted">
          {label}
        </chakra.label>
        <chakra.input
          id={fieldId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          css={codeInput}
          borderColor={error ? 'error' : 'lineStrong'}
        />
        {error && (
          <Text id={`${fieldId}-error`} fontSize="0.9375rem" color="error">
            {error}
          </Text>
        )}
      </Box>
      <Flex align="flex-end">
        <chakra.button type="submit" css={primary ? primaryButton : secondaryButton}>
          {action}
        </chakra.button>
      </Flex>
    </chakra.form>
  );
}

export function PasteRoad({ primary, onRoad }: { primary: boolean; onRoad: (road: Road) => void }) {
  return (
    <CodeField
      id="paste"
      label="Paste a road code"
      placeholder="SR1!..."
      action="Start this road"
      primary={primary}
      check={(code) => {
        const result = decodeRoad(code);
        if (!result.ok) return DECODE_MESSAGES[result.error];
        onRoad(result.road);
        return null;
      }}
    />
  );
}
