import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { primaryButton } from '@/components/buttons';
import { Columns } from '@/components/page';
import { Signpost } from '@/components/signpost';
import { PageWidth } from '@/components/site-frame';
import { TextLink } from '@/components/text-link';
import { STUDIO_ROADS } from '@/lib/studio/roads';

// A holding page until the landing with the road drawing and the fog: the promise, the one
// action, and the studio's roads on a signpost (the approved preview's roads section). It is a
// server component, where chakra.x factories are undefined, so it uses Box with as or asChild.
export default function Home() {
  return (
    <PageWidth>
      <Box as="section" pt={{ base: '72px', md: '120px' }} pb={{ base: '80px', md: '120px' }}>
        <Heading
          as="h1"
          fontFamily="display"
          fontWeight="600"
          fontSize="clamp(2.75rem, 7vw, 5.25rem)"
          lineHeight="1.02"
          maxW="14ch"
        >
          Know what this week is for.
        </Heading>
        <Text mt="28px" fontSize={{ base: '1.3125rem', md: '1.5rem' }} lineHeight="1.5" maxW="34ch">
          Retail hands you fifty chores. Slow Road gives your character one road: the next three
          steps, and a new stage at each weekly reset.
        </Text>
        <Flex mt="40px" wrap="wrap" align="center" gap="22px">
          <Box asChild css={primaryButton}>
            <NextLink href="/my-road">Show my next three steps</NextLink>
          </Box>
          <Link
            asChild
            textDecoration="underline"
            textUnderlineOffset="4px"
            textDecorationColor="lineStrong"
            _hover={{ textDecorationColor: 'text' }}
          >
            <NextLink href="/my-road#paste">Paste a road code</NextLink>
          </Link>
        </Flex>
        <Text mt="22px" fontSize="1rem" color="textMuted">
          Free, no login, saved in your browser.
        </Text>
      </Box>

      <Box
        as="section"
        aria-labelledby="roads-heading"
        borderTopWidth="1px"
        borderColor="line"
        pt={{ base: '72px', md: '96px' }}
        pb={{ base: '80px', md: '120px' }}
      >
        <Columns template="minmax(0, 400px) minmax(0, 1fr)" gap={{ base: '48px', lg: '96px' }}>
          <Box>
            <Heading
              as="h2"
              id="roads-heading"
              fontFamily="display"
              fontWeight="600"
              fontSize="clamp(2.25rem, 4vw, 3rem)"
              lineHeight="1.05"
            >
              Pick a road.
            </Heading>
            <Text mt="18px" fontSize="1.25rem" lineHeight="1.5" color="textMuted">
              Players who know the game write roads for players who are lost. These are the
              studio&apos;s, and <TextLink href="/editor">the editor</TextLink> makes your own.
            </Text>
          </Box>
          <Signpost
            arms={STUDIO_ROADS.map((studio) => ({
              road: studio.road,
              summary: studio.summary,
              href: `/roads/${studio.slug}`,
            }))}
          />
        </Columns>
      </Box>
    </PageWidth>
  );
}
