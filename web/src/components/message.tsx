import { Box, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export type Tone = 'success' | 'warning' | 'error' | 'info';

const ICONS: Record<Tone, ReactNode> = {
  success: <path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.2" />,
  warning: (
    <>
      <path
        d="M9 2.5L16.5 15.5H1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 7v4M9 12.6v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  error: (
    <>
      <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
  info: (
    <>
      <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 8v5M9 5.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
};

// An icon and a sentence on a tint of the tone, never a coloured edge (DESIGN.md, Colors).
export function Message({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <Flex
      gap="12px"
      align="flex-start"
      px="16px"
      py="12px"
      fontSize="1rem"
      lineHeight="1.45"
      bg={`color-mix(in srgb, {colors.${tone}} 15%, {colors.surface})`}
    >
      <Box flex="none" w="18px" h="18px" mt="3px" color={tone} aria-hidden>
        <svg viewBox="0 0 18 18" width="18" height="18">
          {ICONS[tone]}
        </svg>
      </Box>
      <Box flex="1">{children}</Box>
    </Flex>
  );
}
