import { Box, Heading, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Fog, fogMask } from '@/components/fog';
import { Columns } from '@/components/page';
import { Signpost } from '@/components/signpost';
import { PageWidth } from '@/components/site-frame';
import { TextLink } from '@/components/text-link';
import { STUDIO_ROADS } from '@/lib/studio/roads';
import { HomePaste } from './home-paste';

// The home page's sections after the moment (DESIGN.md, Layout): the words in a narrow column on
// the left, the thing itself on the right. Server components, so Box with as, never chakra.x.

function Band({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <Box as="section" id={id} position="relative" py={{ base: '80px', md: '120px' }}>
      <PageWidth>{children}</PageWidth>
    </Box>
  );
}

function BandText({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Heading
        as="h2"
        fontFamily="display"
        fontWeight="600"
        fontSize="clamp(2.25rem, 4vw, 3.25rem)"
        lineHeight="1.05"
      >
        {title}
      </Heading>
      <Text mt="18px" fontSize="1.25rem" lineHeight="1.5" color="textMuted" maxW="36ch">
        {children}
      </Text>
    </Box>
  );
}

const TWO = 'minmax(0, 440px) minmax(0, 1fr)';

function Did({ children }: { children: ReactNode }) {
  return (
    <Box as="b" fontWeight="500" color="accent">
      {children}
    </Box>
  );
}

export function RecapBand() {
  return (
    <Band>
      <Columns template={TWO} gap={{ base: '32px', lg: '96px' }}>
        <BandText title="Every week starts with what you did.">
          On your first visit after a reset, Slow Road shows a short recap. It never lists what you
          missed.
        </BandText>
        <Box
          bg="surface"
          borderWidth="1px"
          borderColor="line"
          px={{ base: '22px', md: '34px' }}
          py={{ base: '22px', md: '30px' }}
          maxW="640px"
        >
          <Text fontSize="1rem" color="textMuted">
            Wednesday, after the reset
          </Text>
          <Text mt="10px" fontSize={{ base: '1.3125rem', md: '1.5rem' }} lineHeight="1.45">
            Last week on The Long Season you <Did>reached item level 266</Did>,{' '}
            <Did>filled a Great Vault slot</Did> and <Did>played five battlegrounds</Did>.
          </Text>
          <Text mt="14px" fontSize="1.125rem">
            Stage 2,{' '}
            <Box as="span" fontFamily="display" fontWeight="600" fontSize="1.375rem">
              Heroics, like the old days
            </Box>
            , is open. Three steps are waiting.
          </Text>
        </Box>
      </Columns>
    </Band>
  );
}

export function RoadsBand() {
  return (
    <Band>
      <Columns template={TWO} gap={{ base: '40px', lg: '96px' }}>
        <BandText title="Pick a road.">
          Players who know the game write roads for players who are lost. These are the
          studio&apos;s, and <TextLink href="/editor">the editor</TextLink> makes your own.
        </BandText>
        <Signpost
          arms={STUDIO_ROADS.map((studio) => ({
            road: studio.road,
            summary: studio.summary,
            href: `/roads/${studio.slug}`,
          }))}
        />
      </Columns>
    </Band>
  );
}

const AHEAD = [
  { when: 'Now', what: 'Tick your steps by hand, saved in your browser.' },
  { when: 'Later', what: 'Road Check reads your character and ticks steps for you.' },
  { when: 'After that', what: 'The addon puts your road inside the game.' },
] as const;

// What comes next, as a road running into the fog: the first stone gold, the rest ahead.
function Ahead() {
  return (
    <Box
      position="relative"
      mt={{ base: '56px', md: '72px' }}
      overflow="hidden"
      pt="30px"
      pb="10px"
    >
      <Fog
        css={fogMask(
          'linear-gradient(to right, transparent 35%, #000 90%)',
          'linear-gradient(to bottom, transparent 0, #000 30%, #000 70%, transparent 100%)',
        )}
      />
      <Box
        as="ol"
        position="relative"
        listStyleType="none"
        m="0"
        p="0"
        display="grid"
        gridTemplateColumns={{ base: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' }}
        gap={{ base: '26px', md: '0' }}
        _before={{
          content: '""',
          position: 'absolute',
          left: '6px',
          right: { base: 'auto', md: '0' },
          top: { base: '8px', md: '7px' },
          bottom: { base: '8px', md: 'auto' },
          borderTop: { base: '0', md: '2px dashed {colors.accent}' },
          borderLeft: { base: '2px dashed {colors.accent}', md: '0' },
          opacity: 0.8,
        }}
      >
        {AHEAD.map((item, index) => (
          <Box
            as="li"
            key={item.when}
            position="relative"
            pt={{ base: '0', md: '34px' }}
            pl={{ base: '34px', md: '0' }}
            pr={{ md: '24px' }}
            color={index === 0 ? 'text' : 'textMuted'}
            _before={{
              content: '""',
              position: 'absolute',
              left: '0',
              top: '0',
              w: '14px',
              h: '14px',
              transform: 'rotate(45deg)',
              borderWidth: '2px',
              borderColor: index === 0 ? 'primary' : 'accent',
              bg: index === 0 ? 'primary' : 'background',
            }}
          >
            <Text
              fontFamily="smallCaps"
              fontWeight="500"
              fontSize="0.9375rem"
              letterSpacing="0.04em"
              color="textMuted"
            >
              {item.when}
            </Text>
            <Text mt="4px" fontSize="1.25rem" maxW="26ch">
              {item.what}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function CodesBand() {
  return (
    <Band id="codes">
      <Columns template={TWO} gap={{ base: '32px', lg: '96px' }}>
        <BandText title="A road is one line of text.">
          Build a road in the editor and share it the way you share a WeakAuras string. Paste one
          here to start walking it.
        </BandText>
        <Box pt={{ lg: '10px' }}>
          <HomePaste />
          <Text mt="16px" color="textMuted">
            No code yet? <TextLink href="/editor">Make a road</TextLink>, or start with one of the
            studio&apos;s above.
          </Text>
        </Box>
      </Columns>
      <Ahead />
    </Band>
  );
}
