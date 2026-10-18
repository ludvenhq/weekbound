import { Box, Heading, Text } from '@chakra-ui/react';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppPage, Columns, pageTitle } from '@/components/page';
import { TextLink } from '@/components/text-link';

export const metadata: Metadata = {
  title: 'About and privacy',
  description: 'What Slow Road is, what it keeps about you (nearly nothing), and who made it.',
};

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box as="section">
      <Heading as="h2" fontFamily="display" fontWeight="600" fontSize="2rem" lineHeight="1.15">
        {title}
      </Heading>
      <Box mt="12px" display="grid" gap="12px" fontSize="1.125rem" maxW="64ch">
        {children}
      </Box>
    </Box>
  );
}

// What the site is, what it keeps, and the licences, in plain words. A server component.
export default function AboutPage() {
  return (
    <AppPage>
      <Columns template="minmax(0, 400px) minmax(0, 1fr)" gap={{ base: '48px', lg: '96px' }}>
        <Box>
          <Heading as="h1" {...pageTitle}>
            About Slow Road.
          </Heading>
          <Text mt="18px" fontSize="1.25rem" lineHeight="1.5">
            One road for your World of Warcraft character: the next three steps, and a new stage at
            each weekly reset. Free, no login.
          </Text>
          <Text mt="14px" color="textMuted">
            Made by{' '}
            <TextLink href="https://ludven.com" external>
              Ludven
            </TextLink>
            , a small studio.
          </Text>
        </Box>
        <Box display="grid" gap="48px">
          <Part title="What we keep about you">
            <Text>
              Nearly nothing. Your roads and your ticks live in your own browser. There are no
              accounts and no database. A backup code carries your progress to another browser; it
              goes from you to you, and we never see it.
            </Text>
            <Text>
              When you use Road Check, your region, realm and character name go to our server, which
              asks Blizzard&apos;s public character profile for the facts your road needs: item
              level, ratings, achievements, quests, renown, mounts and titles. The answer is kept in
              the server&apos;s memory for 15 minutes so a second check is quick, and is not saved
              anywhere. The character name you typed stays in your browser for next time.
            </Text>
            <Text>No ads, no tracking cookies, and nothing is sold.</Text>
          </Part>
          <Part title="Licences">
            <Text>
              Every road is{' '}
              <TextLink href="https://creativecommons.org/licenses/by/4.0/" external>
                CC BY 4.0
              </TextLink>
              : share it and change it, and name its author. The code is MIT and public on{' '}
              <TextLink href="https://github.com/ludvenhq/slow-road" external>
                GitHub
              </TextLink>
              . The fonts are Grenze Gotisch, Alegreya Sans and JetBrains Mono, under the SIL Open
              Font License.
            </Text>
          </Part>
          <Part title="Not Blizzard">
            <Text>
              Slow Road is a fan tool, not affiliated with or endorsed by Blizzard Entertainment.
              World of Warcraft and Blizzard Entertainment are trademarks or registered trademarks
              of Blizzard Entertainment, Inc. Game data comes from Blizzard&apos;s public API.
            </Text>
          </Part>
        </Box>
      </Columns>
    </AppPage>
  );
}
