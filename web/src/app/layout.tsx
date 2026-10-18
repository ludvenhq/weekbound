import { Box, Flex } from '@chakra-ui/react';
import type { Metadata, Viewport } from 'next';
import { Alegreya_Sans, Alegreya_Sans_SC, Grenze_Gotisch, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { ContourMap } from '@/components/contour-map';
import { FogFilters } from '@/components/fog';
import { SiteFooter, SiteHeader } from '@/components/site-frame';
import { THEME_SCRIPT } from '@/components/theme';
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
};

const fonts = [display, body, smallCaps, mono].map((font) => font.variable).join(' ');

export default function RootLayout({ children }: { children: ReactNode }) {
  // The theme script swaps `dark` for `light` before the first paint, so the class on <html>
  // differs from the server's on purpose.
  return (
    <html lang="en" className={`${fonts} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers>
          <ContourMap />
          <FogFilters />
          {/* Above the map, which stays fixed behind every page. */}
          <Flex direction="column" minH="100dvh" position="relative" zIndex="1">
            <SiteHeader />
            <Box as="main" flex="1">
              {children}
            </Box>
            <SiteFooter />
          </Flex>
        </Providers>
      </body>
    </html>
  );
}
