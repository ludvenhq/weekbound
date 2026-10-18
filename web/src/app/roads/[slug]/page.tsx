import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import type { Metadata } from 'next';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { primaryButton, secondaryButton } from '@/components/buttons';
import { AppPage, Columns, pageTitle, stickyColumn } from '@/components/page';
import { TextLink } from '@/components/text-link';
import { wowheadUrl } from '@/lib/editor/game';
import { remixLink, walkLink } from '@/lib/road/link';
import type { Step } from '@/lib/road/schema';
import { STUDIO_ROADS, studioBySlug } from '@/lib/studio/roads';
import { n, stepTarget } from '@/lib/walk/words';

// A studio road's page (design doc, "The website"): on the left, what the road is and two ways
// on, walk it on My road or remix it in the editor, staying in view; on the right, the whole road
// to read. It is a server component, where chakra.x factories are undefined, so it uses Box with
// as or asChild.

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return STUDIO_ROADS.map((studio) => ({ slug: studio.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const studio = studioBySlug((await params).slug);
  return studio ? { title: studio.road.title, description: studio.summary } : {};
}

const checkedDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function StepLine({ step }: { step: Step }) {
  const target = stepTarget(step);
  const link = wowheadUrl(step);
  return (
    <Flex
      as="li"
      gap="16px"
      align="flex-start"
      px="20px"
      py="16px"
      bg="surface"
      borderWidth="1px"
      borderColor="line"
    >
      <Box
        aria-hidden
        flex="none"
        mt="9px"
        w="11px"
        h="11px"
        transform="rotate(45deg)"
        borderWidth="2px"
        borderColor="accent"
      />
      <Box minW="0">
        <Text fontWeight="500" fontSize="1.1875rem" lineHeight="1.35" overflowWrap="anywhere">
          {step.label}
        </Text>
        {(target || link) && (
          <Text
            mt="2px"
            fontSize="1rem"
            color="textMuted"
            fontVariantNumeric="lining-nums tabular-nums"
          >
            {target}
            {target && link && ' · '}
            {link && (
              <TextLink href={link} external>
                Wowhead
              </TextLink>
            )}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

export default async function RoadPage({ params }: Params) {
  const studio = studioBySlug((await params).slug);
  if (!studio) notFound();
  const { road } = studio;
  const steps = road.stages.reduce((sum, stage) => sum + stage.steps.length, 0);
  const weekly = road.pace === 'weekly';

  return (
    <AppPage>
      <Columns template="minmax(0, 420px) minmax(0, 1fr)" gap={{ base: '56px', lg: '88px' }}>
        <Box {...stickyColumn}>
          <Text fontSize="1rem" color="textMuted">
            <TextLink href="/roads">The roads</TextLink>
          </Text>
          <Heading as="h1" mt="18px" {...pageTitle}>
            {road.title}
          </Heading>
          <Text mt="12px" color="textMuted" fontVariantNumeric="lining-nums tabular-nums">
            By {road.author}. Version {road.rev}, {weekly ? 'weekly pace' : 'free pace'},{' '}
            {n(road.stages.length)} stages, {n(steps)} steps.
          </Text>
          <Text mt="22px" fontSize="1.25rem" lineHeight="1.5">
            {studio.about}
          </Text>
          <Flex mt="32px" wrap="wrap" align="center" gap="14px 18px">
            <Box asChild css={primaryButton}>
              <NextLink href={walkLink(road.id)}>Walk this road</NextLink>
            </Box>
            <Box asChild css={secondaryButton}>
              <NextLink href={remixLink(road.id)}>Remix it</NextLink>
            </Box>
          </Flex>
          <Text mt="18px" fontSize="1rem" color="textMuted">
            {weekly
              ? 'You see three steps at a time. When a stage is done, the next one opens at the next weekly reset.'
              : 'You see three steps at a time. When a stage is done, the next one opens at once.'}{' '}
            For now you tick each step by hand; your progress stays in your browser.
          </Text>
        </Box>

        <Box>
          <Box as="ol" listStyleType="none" m="0" p="0" display="grid" gap="48px">
            {road.stages.map((stage, index) => (
              <Box as="li" key={index}>
                <Text
                  fontFamily="smallCaps"
                  fontWeight="500"
                  fontSize="0.9375rem"
                  letterSpacing="0.04em"
                  color="textMuted"
                >
                  Stage {index + 1}
                </Text>
                <Heading
                  as="h2"
                  fontFamily="display"
                  fontWeight="600"
                  fontSize="2rem"
                  lineHeight="1.15"
                >
                  {stage.name}
                </Heading>
                <Box as="ul" listStyleType="none" m="0" p="0" mt="14px" display="grid" gap="8px">
                  {stage.steps.map((step) => (
                    <StepLine key={step.id} step={step} />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          <Box mt="56px" pt="24px" borderTopWidth="1px" borderColor="line">
            <Text fontSize="1rem" color="textMuted" maxW="70ch">
              Written for {studio.season}; its game ids were checked on{' '}
              {checkedDate.format(new Date(studio.checked))}. This road is{' '}
              <TextLink href="https://creativecommons.org/licenses/by/4.0/" external>
                CC BY 4.0
              </TextLink>{' '}
              by {road.author}: walk it, share it and change it. A remix names {road.author} as its
              source, and the editor does that for you.
            </Text>
          </Box>
        </Box>
      </Columns>
    </AppPage>
  );
}
