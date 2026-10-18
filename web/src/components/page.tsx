import { Box, Grid, Heading, type GridProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { PageWidth } from './site-frame';

// The parts every page is made of (DESIGN.md, Layout): the site's width, two columns from 1024px
// that stack on smaller screens, and titled sections for a side column. Server components can use
// them: none uses a chakra.x factory.

// A page's own title, at the headline size.
export const pageTitle = {
  fontFamily: 'display',
  fontWeight: '600',
  fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)',
  lineHeight: '1.05',
} as const;

export function AppPage({ children }: { children: ReactNode }) {
  return (
    <PageWidth>
      <Box pt={{ base: '24px', lg: '40px' }} pb="96px">
        {children}
      </Box>
    </PageWidth>
  );
}

// `template` sets the two columns' widths from 1024px; below that the children stack in order.
export function Columns({
  template,
  children,
  ...rest
}: { template: string; children: ReactNode } & Omit<GridProps, 'templateColumns'>) {
  return (
    <Grid
      templateColumns={{ base: 'minmax(0, 1fr)', lg: template }}
      gap={{ base: '56px', lg: '72px' }}
      alignItems="start"
      {...rest}
    >
      {children}
    </Grid>
  );
}

// A column that stays in view while the other one scrolls, on wide screens only.
export const stickyColumn = {
  position: { lg: 'sticky' },
  top: { lg: '32px' },
  maxH: { lg: 'calc(100dvh - 64px)' },
  overflowY: { lg: 'auto' },
} as const;

// One titled part of a side column: a small-caps name over a line.
export function SideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box as="section" borderTopWidth="1px" borderColor="line" pt="16px">
      <Heading
        as="h2"
        fontFamily="smallCaps"
        fontWeight="500"
        fontSize="0.9375rem"
        letterSpacing="0.04em"
        color="textMuted"
      >
        {title}
      </Heading>
      <Box mt="14px">{children}</Box>
    </Box>
  );
}
