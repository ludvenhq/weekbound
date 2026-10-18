import { Box, chakra } from '@chakra-ui/react';
import type { ReactNode } from 'react';

// A folded section, so the one thing a page is for stays the only thing on the screen.
export function Fold({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <chakra.details borderTopWidth="1px" borderColor="line" py="14px">
      <chakra.summary
        cursor="pointer"
        color="textMuted"
        fontSize="1rem"
        _hover={{ color: 'text' }}
        _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
      >
        {summary}
      </chakra.summary>
      <Box mt="16px">{children}</Box>
    </chakra.details>
  );
}
