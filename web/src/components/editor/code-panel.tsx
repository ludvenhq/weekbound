'use client';

import { Box, chakra, Flex, Heading, Text } from '@chakra-ui/react';
import { secondaryButton, textButton } from '@/components/buttons';
import { CodeBox } from '@/components/code-box';
import { Message } from '@/components/message';
import type { Made } from '@/lib/editor/check';
import type { Draft } from '@/lib/editor/draft';
import { kilobytes } from '@/lib/editor/words';
import { MAX_CODE_BYTES } from '@/lib/road/code';
import type { Road } from '@/lib/road/schema';

const SHOWN_PROBLEMS = 8;

function versionLine(draft: Draft, rev: number): string {
  const { base, basedOn } = draft;
  if (!base) {
    return basedOn ? `Version 1, a remix of a road by ${basedOn.author}` : 'Version 1, a new road';
  }
  if (rev === base.rev) return `Version ${rev}, unchanged`;
  return `Version ${rev}. Players with version ${base.rev} can take it and keep their ticks on the steps you kept`;
}

// The road's code: its size against the cap at every keystroke (review concern R3-36), the code
// once the road is ready, and until then what is left to do, each item a way to its field.
export function CodePanel({
  draft,
  made,
  rev,
  onCopy,
  onWalk,
  onProblem,
}: {
  draft: Draft;
  made: Made;
  rev: number;
  onCopy: (road: Road) => void;
  onWalk: (road: Road, code: string) => void;
  onProblem: (field: string) => void;
}) {
  const size = `${kilobytes(made.size)} of ${kilobytes(MAX_CODE_BYTES)}`;
  const problems = made.ok ? [] : made.problems;

  return (
    <Box
      as="section"
      aria-labelledby="code-heading"
      borderTopWidth="1px"
      borderColor="line"
      pt="32px"
    >
      <Heading
        as="h2"
        id="code-heading"
        fontFamily="display"
        fontWeight="600"
        fontSize="1.625rem"
        lineHeight="1.15"
      >
        Your code
      </Heading>
      <Text
        mt="4px"
        fontSize="0.9375rem"
        color="textMuted"
        fontVariantNumeric="lining-nums tabular-nums"
      >
        {versionLine(draft, rev)} · {size}
      </Text>

      <Box mt="18px">
        {made.ok ? (
          <>
            <CodeBox code={made.code} label="Your road code" onCopy={() => onCopy(made.road)} />
            <Text mt="10px" fontSize="0.9375rem" color="textMuted" maxW="60ch">
              Every road is CC BY 4.0: anyone may share and change it, as long as they name you.
            </Text>
            <Flex mt="20px" align="center" wrap="wrap" gap="10px 18px">
              <chakra.button
                type="button"
                css={secondaryButton}
                onClick={() => onWalk(made.road, made.code)}
              >
                Walk this road
              </chakra.button>
              <Text fontSize="0.9375rem" color="textMuted">
                Opens it on My road, as a player sees it.
              </Text>
            </Flex>
          </>
        ) : made.tooLong ? (
          <Message tone="error">
            This road is too long for one code: {size}. Shorten some labels, or make it two roads.
          </Message>
        ) : (
          <>
            <Text>The code appears here once these are done:</Text>
            <chakra.ul m="0" mt="8px" pl="20px" display="grid" gap="4px">
              {problems.slice(0, SHOWN_PROBLEMS).map((problem) => (
                <chakra.li key={problem.field} color="textMuted">
                  <chakra.button
                    type="button"
                    css={textButton}
                    color="text"
                    onClick={() => onProblem(problem.field)}
                  >
                    {problem.where}
                  </chakra.button>
                  : {problem.message}
                </chakra.li>
              ))}
              {problems.length > SHOWN_PROBLEMS && (
                <chakra.li color="textMuted">and {problems.length - SHOWN_PROBLEMS} more</chakra.li>
              )}
            </chakra.ul>
          </>
        )}
      </Box>
    </Box>
  );
}
