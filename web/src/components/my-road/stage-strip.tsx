import { Box, Flex } from '@chakra-ui/react';
import { Fragment } from 'react';

// Diamonds joined by short lines: done in green, the current stage in gold, the rest locked.
// `current` is null at camp and when the road is complete.
export function StageStrip({
  count,
  done,
  current,
}: {
  count: number;
  done: number;
  current: number | null;
}) {
  const label =
    current === null
      ? `${done} of ${count} stages done`
      : `Stage ${current + 1} of ${count}, ${done} done`;
  return (
    <Flex role="img" aria-label={label} align="center" mt="22px">
      {Array.from({ length: count }, (_, index) => {
        const isDone = index < done;
        const isNow = index === current;
        // The road is green up to the stage the player stands on.
        const reached = isDone || isNow;
        return (
          <Fragment key={index}>
            {index > 0 && (
              <Box
                h="2px"
                flex="1"
                maxW="72px"
                bg={reached ? 'accent' : 'locked'}
                opacity={reached ? 1 : 0.6}
              />
            )}
            <Box
              flex="none"
              w="14px"
              h="14px"
              transform="rotate(45deg)"
              borderWidth="2px"
              borderColor={isDone ? 'accent' : isNow ? 'primary' : 'locked'}
              bg={isDone ? 'accent' : isNow ? 'primary' : 'background'}
            />
          </Fragment>
        );
      })}
    </Flex>
  );
}
