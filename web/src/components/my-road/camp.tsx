import { Box, Flex, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

const TENT = (
  <svg viewBox="0 0 34 30" width="34" height="30" aria-hidden>
    <path
      d="M17 3 L32 27 H2 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
    <path d="M17 12 L23 27 H11 Z" fill="currentColor" />
  </svg>
);

// The slow pace shown as rest: a tent, a line in the display face, and when the road goes on.
// No countdown (DESIGN.md, Camp).
export function Camp({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Flex
      role="status"
      mt="26px"
      gap="18px"
      align="flex-start"
      p="22px"
      borderWidth="1px"
      borderColor="lineStrong"
      bg="surface"
      animation="arrive 250ms ease-out"
    >
      <Box flex="none" mt="4px" color="primary">
        {TENT}
      </Box>
      <Box>
        <Text fontFamily="display" fontWeight="600" fontSize="1.75rem" lineHeight="1.1">
          {title}
        </Text>
        {children}
      </Box>
    </Flex>
  );
}
