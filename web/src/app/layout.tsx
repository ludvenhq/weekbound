import { Box, Container, Flex, Text } from '@chakra-ui/react';
import type { Metadata, Viewport } from 'next';
import { Alegreya_Sans, Alegreya_Sans_SC, Grenze_Gotisch, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from './providers';

// Self-hosted at build time: no visitor's browser calls Google (DESIGN.md, Typography).
const display = Grenze_Gotisch({
  subsets: ['latin', 'latin-ext'],
  weight: ['600'],
  variable: '--font-display',
  display: 'swap',
});
const body = Alegreya_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});
const smallCaps = Alegreya_Sans_SC({
  subsets: ['latin', 'latin-ext'],
  weight: ['500'],
  variable: '--font-small-caps',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Slow Road', template: '%s · Slow Road' },
  description:
    'Clear, slow roads for World of Warcraft retail: one road, the next three steps, and a new stage at each weekly reset.',
};

export const viewport: Viewport = {
  themeColor: '#1F1A15',
  colorScheme: 'dark',
};

const fonts = [display, body, smallCaps, mono].map((font) => font.variable).join(' ');

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fonts} dark`}>
      <body>
        <Providers>
          <Flex direction="column" minH="100dvh">
            <Box as="header">
              <Container maxW="1120px" px={{ base: '16px', sm: '24px' }} py="22px">
                <Flex
                  align="center"
                  gap="10px"
                  fontFamily="display"
                  fontWeight="600"
                  fontSize="1.75rem"
                >
                  <Box
                    aria-hidden
                    w="12px"
                    h="12px"
                    transform="rotate(45deg)"
                    borderWidth="2px"
                    borderColor="accent"
                    bg="background"
                  />
                  Slow Road
                </Flex>
              </Container>
            </Box>
            <Box as="main" flex="1">
              {children}
            </Box>
            <Box as="footer" borderTopWidth="1px" borderColor="line" pt="56px" pb="80px">
              <Container
                maxW="1120px"
                px={{ base: '16px', sm: '24px' }}
                display="flex"
                flexWrap="wrap"
                gap="12px 40px"
                justifyContent="space-between"
                fontSize="0.9375rem"
                color="textMuted"
              >
                <Text>Slow Road, made by Ludven, a small studio. Code MIT, roads CC BY 4.0.</Text>
                <Text>
                  Fan tool. Not affiliated with Blizzard Entertainment. World of Warcraft is a
                  trademark of Blizzard Entertainment, Inc.
                </Text>
              </Container>
            </Box>
          </Flex>
        </Providers>
      </body>
    </html>
  );
}
