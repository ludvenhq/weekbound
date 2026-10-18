'use client';

import { chakra, Flex } from '@chakra-ui/react';
import { useRef, useState } from 'react';

// A code in mono, cut with an ellipsis, and a Copy button that says "Copied" for 1.4 s. `onCopy`
// hears both the button and a copy of the selected text.
export function CodeBox({
  code,
  label,
  onCopy,
}: {
  code: string;
  label: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy() {
    let result: 'yes' | 'failed' = 'yes';
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      result = 'failed';
    }
    setCopied(result);
    if (result === 'yes') onCopy?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 1400);
  }

  return (
    <Flex align="stretch" borderWidth="1px" borderColor="lineStrong" bg="surface" maxW="620px">
      <chakra.code
        flex="1"
        minW="0"
        fontFamily="mono"
        fontSize="0.875rem"
        px="16px"
        py="14px"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        color="text"
        aria-label={label}
        onCopy={onCopy}
      >
        {code}
      </chakra.code>
      <chakra.button
        type="button"
        onClick={copy}
        flex="none"
        borderLeftWidth="1px"
        borderColor="lineStrong"
        bg="none"
        color="text"
        fontWeight="500"
        px="18px"
        cursor="pointer"
        _hover={{ bg: 'surfaceHover' }}
        _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
      >
        <span aria-live="polite">
          {copied === 'yes' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy'}
        </span>
      </chakra.button>
    </Flex>
  );
}
