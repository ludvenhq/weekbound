import { Box, Flex, Grid, Heading, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { primaryButton } from '@/components/buttons';
import { Fog, fogMask } from '@/components/fog';
import { PageWidth } from '@/components/site-frame';

// The home page's first screen (DESIGN.md, Layout): the promise and the one action on the left,
// and on the right a road running up into the fog through three stones, the first one gold. A
// server component, so it uses Box with as or asChild, never a chakra.x factory.

// The first stage of The Long Season, shortened to fit beside the stones.
const WAYPOINTS = [
  { what: 'Reach item level 266', meta: 'for Heroic dungeons', left: '35%', top: '73.8%' },
  { what: 'Fill a Great Vault slot', meta: 'this week', left: '56.6%', top: '52.3%' },
  { what: 'Play five battlegrounds', meta: 'PvP, any kind', left: '78.3%', top: '29.2%' },
] as const;

const STONES = [
  { x: 210, y: 384 },
  { x: 340, y: 272 },
  { x: 470, y: 152 },
] as const;

function HeroRoad() {
  return (
    <Box
      position="relative"
      w="100%"
      maxW={{ base: 'none', sm: '460px', md: 'none' }}
      aspectRatio={{ base: 'auto', sm: '600 / 520' }}
      display={{ base: 'grid', sm: 'block' }}
      gap="14px"
    >
      <Box
        asChild
        position={{ base: 'relative', sm: 'absolute' }}
        inset={{ sm: '0' }}
        w="100%"
        h={{ base: '200px', sm: '100%' }}
        overflow="visible"
      >
        <svg viewBox="0 0 600 520" aria-hidden>
          <defs>
            <linearGradient id="hero-road-fade" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="1" />
              <stop offset="0.72" stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="hero-road-mask">
              <rect width="600" height="520" fill="url(#hero-road-fade)" />
            </mask>
          </defs>
          <path
            d="M-10 512 C 90 486, 130 410, 210 384 S 320 330, 340 272 S 410 176, 470 152 S 560 82, 640 20"
            fill="none"
            stroke="var(--chakra-colors-accent)"
            strokeWidth="2.5"
            strokeDasharray="7 9"
            strokeLinecap="round"
            mask="url(#hero-road-mask)"
          />
          {STONES.map((stone, index) => (
            <rect
              key={index}
              x={stone.x - 9}
              y={stone.y - 9}
              width="18"
              height="18"
              transform={`rotate(45 ${stone.x} ${stone.y})`}
              fill={
                index === 0 ? 'var(--chakra-colors-primary)' : 'var(--chakra-colors-background)'
              }
              stroke={index === 0 ? 'var(--chakra-colors-primary)' : 'var(--chakra-colors-accent)'}
              strokeWidth="2"
            />
          ))}
        </svg>
      </Box>
      {WAYPOINTS.map((point, index) => (
        <Flex
          key={point.what}
          position={{ base: 'static', sm: 'absolute' }}
          left={{ sm: point.left }}
          top={{ sm: point.top }}
          transform={{ sm: 'translate(18px, -50%)' }}
          maxW={{ base: 'none', sm: '150px', md: '220px' }}
          direction={{ base: 'row', sm: 'column' }}
          align={{ base: 'baseline', sm: 'flex-start' }}
          gap={{ base: '12px', sm: '0' }}
          _before={{
            content: '""',
            display: { base: 'block', sm: 'none' },
            flex: 'none',
            w: '10px',
            h: '10px',
            transform: 'rotate(45deg) translateY(-2px)',
            borderWidth: '2px',
            borderColor: index === 0 ? 'primary' : 'accent',
            bg: index === 0 ? 'primary' : 'transparent',
          }}
        >
          <Text
            fontWeight="500"
            fontSize={{ base: '1.0625rem', sm: '0.9375rem', md: '1.125rem' }}
            lineHeight="1.3"
          >
            {point.what}
          </Text>
          <Text
            ml={{ base: 'auto', sm: '0' }}
            whiteSpace={{ base: 'nowrap', sm: 'normal' }}
            fontSize={{ base: '0.9375rem', sm: '0.8125rem', md: '1rem' }}
            color="textMuted"
          >
            {point.meta}
          </Text>
        </Flex>
      ))}
    </Box>
  );
}

export function Hero() {
  return (
    <Box as="section" position="relative" overflow="hidden" minH={{ md: 'min(860px, 100vh)' }}>
      <Fog
        css={{
          opacity: 0.75,
          ...fogMask(
            'linear-gradient(to left, #000 0%, #000 12%, transparent 48%)',
            'linear-gradient(to bottom, transparent 0, #000 22%, #000 78%, transparent 100%)',
          ),
        }}
      />
      <PageWidth>
        <Grid
          position="relative"
          templateColumns={{ base: 'minmax(0, 1fr)', md: 'minmax(0, 560px) minmax(0, 1fr)' }}
          gap={{ base: '28px', md: '40px' }}
          alignItems="center"
          minH={{ md: 'min(760px, 88vh)' }}
          pt={{ base: '40px', md: '0' }}
          pb={{ base: '56px', md: '0' }}
        >
          <Box>
            <Heading
              as="h1"
              fontFamily="display"
              fontWeight="600"
              fontSize="clamp(2.75rem, 6.5vw, 5.25rem)"
              lineHeight="1.02"
              maxW="14ch"
            >
              Know what this week is for.
            </Heading>
            <Text
              mt="28px"
              fontSize={{ base: '1.3125rem', md: '1.5rem' }}
              lineHeight="1.5"
              maxW="32ch"
            >
              Retail hands you fifty chores. Weekbound gives your character one road: the next three
              steps, and a new stage at each weekly reset.
            </Text>
            <Flex mt="40px" wrap="wrap" align="center" gap="22px">
              <Box asChild css={primaryButton}>
                <NextLink href="/my-road">Show my next three steps</NextLink>
              </Box>
              <Link
                href="#codes"
                textDecoration="underline"
                textUnderlineOffset="4px"
                textDecorationColor="lineStrong"
                _hover={{ textDecorationColor: 'text' }}
                _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
              >
                Paste a road code
              </Link>
            </Flex>
            <Text mt="22px" fontSize="1rem" color="textMuted">
              Free, no login, saved in your browser.
            </Text>
          </Box>
          <HeroRoad />
        </Grid>
      </PageWidth>
    </Box>
  );
}
