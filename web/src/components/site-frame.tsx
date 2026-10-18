import { Box, Container, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { NavLink } from './nav-link';
import { ThemeToggle } from './theme-toggle';

export function PageWidth({ children }: { children: ReactNode }) {
  return (
    <Container maxW="1120px" px={{ base: '16px', sm: '24px' }}>
      {children}
    </Container>
  );
}

export function SiteHeader() {
  return (
    <Box as="header">
      <PageWidth>
        {/* On a phone the links wrap under the name as whole words. */}
        <Flex
          align="center"
          justify="space-between"
          wrap="wrap"
          gap="6px 24px"
          py="22px"
          whiteSpace="nowrap"
        >
          <Flex
            asChild
            align="center"
            gap="10px"
            fontFamily="display"
            fontWeight="600"
            fontSize="1.75rem"
            textDecoration="none"
            _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
          >
            <NextLink href="/">
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
            </NextLink>
          </Flex>
          <Flex
            as="nav"
            aria-label="Main"
            align="center"
            gap={{ base: '22px', sm: '28px' }}
            fontSize="1.0625rem"
          >
            <NavLink href="/my-road">My road</NavLink>
            <NavLink href="/editor">Make a road</NavLink>
            <ThemeToggle />
          </Flex>
        </Flex>
      </PageWidth>
    </Box>
  );
}

export function SiteFooter() {
  return (
    <Box as="footer" borderTopWidth="1px" borderColor="line" pt="56px" pb="80px">
      <PageWidth>
        <Flex
          wrap="wrap"
          gap="12px 40px"
          justify="space-between"
          fontSize="0.9375rem"
          color="textMuted"
        >
          <Text>Slow Road, made by Ludven, a small studio. Code MIT, roads CC BY 4.0.</Text>
          <Text>
            Fan tool. Not affiliated with Blizzard Entertainment. World of Warcraft is a trademark
            of Blizzard Entertainment, Inc.
          </Text>
        </Flex>
      </PageWidth>
    </Box>
  );
}
