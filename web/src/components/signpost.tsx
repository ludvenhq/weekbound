'use client';

import { Box, chakra, Text, VisuallyHidden, type SystemStyleObject } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { Road } from '@/lib/road/schema';
import { n } from '@/lib/walk/words';

// The roads as a signpost: arrow-shaped arms on one post, alternating right and left (DESIGN.md,
// Shapes). The arm's shape is drawn behind it, not clipped, so the focus outline still shows.

const RIGHT = 'polygon(0 0, calc(100% - 26px) 0, 100% 50%, calc(100% - 26px) 100%, 0 100%)';
const LEFT = 'polygon(26px 0, 100% 0, 100% 100%, 26px 100%, 0 50%)';

function armCss(left: boolean): SystemStyleObject {
  return {
    position: 'relative',
    isolation: 'isolate',
    display: 'block',
    w: '100%',
    maxW: left ? '620px' : '660px',
    ml: left ? '0' : '12px',
    py: { base: '18px', md: '24px' },
    pl: left ? { base: '52px', md: '60px' } : { base: '22px', md: '30px' },
    pr: left ? { base: '22px', md: '30px' } : { base: '64px', md: '72px' },
    bg: 'none',
    border: 0,
    font: 'inherit',
    color: 'text',
    textAlign: 'left',
    textDecoration: 'none',
    cursor: 'pointer',
    _before: {
      content: '""',
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      bg: 'surface',
      clipPath: left ? LEFT : RIGHT,
      transition: 'background-color 150ms ease-out',
    },
    _hover: { _before: { bg: 'surfaceHover' } },
    _focusVisible: { outline: '2px solid {colors.text}', outlineOffset: '3px' },
  };
}

export type Arm = {
  road: Road;
  summary: string;
  // A road page to read, or an action such as starting the road.
  href?: string;
  onPick?: () => void;
  // Heard before the name by screen readers, when the arm does more than open a page: "Walk".
  action?: string;
};

export function armMeta(road: Road, summary: string): string {
  const stages = road.stages.length === 1 ? 'One stage' : `${n(road.stages.length)} stages`;
  return `${stages}, ${road.pace === 'weekly' ? 'weekly' : 'free pace'}. ${summary}`;
}

export function Signpost({ arms }: { arms: readonly Arm[] }) {
  return (
    <Box
      position="relative"
      py="8px"
      _before={{
        content: '""',
        position: 'absolute',
        left: '34px',
        top: '-16px',
        bottom: '-28px',
        w: '10px',
        bg: 'contour',
      }}
    >
      <chakra.ul listStyleType="none" m="0" p="0" display="grid" gap="18px" position="relative">
        {arms.map((arm, index) => {
          const left = index % 2 === 1;
          const body = (
            <>
              {arm.action && <VisuallyHidden>{arm.action}: </VisuallyHidden>}
              <Text
                as="span"
                display="block"
                fontFamily="display"
                fontWeight="600"
                fontSize={{ base: '1.75rem', md: '2.125rem' }}
                lineHeight="1.1"
              >
                {arm.road.title}
              </Text>
              <Text
                as="span"
                display="block"
                mt="4px"
                fontSize={{ base: '1rem', md: '1.125rem' }}
                color="textMuted"
              >
                {armMeta(arm.road, arm.summary)}
              </Text>
            </>
          );
          return (
            <li key={arm.road.id}>
              {arm.href ? (
                <chakra.a asChild css={armCss(left)}>
                  <NextLink href={arm.href}>{body}</NextLink>
                </chakra.a>
              ) : (
                <chakra.button type="button" css={armCss(left)} onClick={arm.onPick}>
                  {body}
                </chakra.button>
              )}
            </li>
          );
        })}
      </chakra.ul>
    </Box>
  );
}
