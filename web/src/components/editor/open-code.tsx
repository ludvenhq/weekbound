'use client';

import { chakra, Flex, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { secondaryButton, textButton } from '@/components/buttons';
import { Message } from '@/components/message';
import { CodeField } from '@/components/my-road/paste-road';
import { DECODE_MESSAGES, decodeRoad } from '@/lib/road/code';
import type { Road } from '@/lib/road/schema';

export type OpenMode = 'version' | 'remix';

// A pasted code goes through the same cap and checks as on My road (review concern R3-15), then
// the author picks: the next version of their own road, or a remix that names its source.
export function OpenCode({ onOpen }: { onOpen: (road: Road, mode: OpenMode) => void }) {
  const [road, setRoad] = useState<Road | null>(null);

  if (!road) {
    return (
      <CodeField
        label="Paste a road code"
        placeholder="SR1!..."
        action="Open"
        primary={false}
        check={(code) => {
          const result = decodeRoad(code);
          if (!result.ok) return DECODE_MESSAGES[result.error];
          setRoad(result.road);
          return null;
        }}
      />
    );
  }

  const open = (mode: OpenMode) => {
    onOpen(road, mode);
    setRoad(null);
  };
  return (
    <Message tone="info">
      <Text>
        <chakra.b fontWeight="500">{road.title}</chakra.b> by {road.author}, version {road.rev}.
        This replaces the road you are making now.
      </Text>
      <Text mt="6px" fontSize="0.9375rem">
        Your own road gets a version {road.rev + 1}, and players who have it keep their ticks. Any
        other road can be remixed: a new road that names {road.author} as its source.
      </Text>
      <Flex mt="12px" gap="12px 18px" align="center" wrap="wrap">
        <chakra.button type="button" css={secondaryButton} onClick={() => open('version')}>
          Make version {road.rev + 1}
        </chakra.button>
        <chakra.button type="button" css={secondaryButton} onClick={() => open('remix')}>
          Remix it
        </chakra.button>
        <chakra.button type="button" css={textButton} onClick={() => setRoad(null)}>
          Cancel
        </chakra.button>
      </Flex>
    </Message>
  );
}
