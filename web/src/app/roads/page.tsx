import { Box, Heading, Text } from '@chakra-ui/react';
import type { Metadata } from 'next';
import { AppPage, Columns, pageTitle } from '@/components/page';
import { Signpost } from '@/components/signpost';
import { TextLink } from '@/components/text-link';
import { STUDIO_ROADS } from '@/lib/studio/roads';

export const metadata: Metadata = {
  title: 'The roads',
  description:
    "The studio's roads for World of Warcraft retail: for returning players, for a slow season of PvE and PvP, and for your first rated PvP.",
};

// The gallery (design doc, "The website"): what a road is on the left, the studio's roads on a
// signpost on the right, each arm to its page.
export default function RoadsPage() {
  return (
    <AppPage>
      <Columns template="minmax(0, 400px) minmax(0, 1fr)" gap={{ base: '48px', lg: '96px' }}>
        <Box>
          <Heading as="h1" {...pageTitle}>
            Pick a road.
          </Heading>
          <Text mt="18px" fontSize="1.25rem" lineHeight="1.5">
            Players who know the game write roads for players who are lost. These are the
            studio&apos;s.
          </Text>
          <Text mt="14px" fontSize="1.125rem" color="textMuted">
            Each one shows you three steps at a time and opens one stage a week, at the reset. Read
            a road first, or start walking it from its page.
          </Text>
          <Text mt="32px" color="textMuted">
            Have a code from another player? Paste it on{' '}
            <TextLink href="/my-road">My road</TextLink>. Or{' '}
            <TextLink href="/editor">make your own road</TextLink>.
          </Text>
        </Box>
        <Box pt={{ lg: '12px' }}>
          <Signpost
            arms={STUDIO_ROADS.map((studio) => ({
              road: studio.road,
              summary: studio.summary,
              href: `/roads/${studio.slug}`,
            }))}
          />
        </Box>
      </Columns>
    </AppPage>
  );
}
