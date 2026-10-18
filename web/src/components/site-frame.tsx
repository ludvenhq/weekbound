import { Box, Container, Flex, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import { NavLink } from './nav-link';
import { StickyHeader } from './sticky-header';
import { TextLink } from './text-link';
import { ThemeToggle } from './theme-toggle';

export function PageWidth({ children }: { children: ReactNode }) {
  return (
    <Container maxW="1280px" px={{ base: '16px', sm: '24px' }}>
      {children}
    </Container>
  );
}

// Settled: what the header's parts become once the page has scrolled (StickyHeader).
const settled = (css: Record<string, string>) => ({ '[data-stuck] &': css });

export function SiteHeader() {
  return (
    <StickyHeader>
      <PageWidth>
        {/* On a phone the links wrap under the name as whole words. */}
        <Flex
          align="center"
          justify="space-between"
          wrap="wrap"
          gap="6px 24px"
          py="22px"
          whiteSpace="nowrap"
          transition="padding 200ms ease-out"
          css={settled({ paddingBlock: '12px' })}
        >
          <Flex
            asChild
            align="center"
            gap="10px"
            fontFamily="display"
            fontWeight="600"
            fontSize="2rem"
            textDecoration="none"
            transition="font-size 200ms ease-out"
            css={settled({ fontSize: '1.625rem' })}
            _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
          >
            <NextLink href="/">
              <Box
                aria-hidden
                w="14px"
                h="14px"
                transform="rotate(45deg)"
                borderWidth="2px"
                borderColor="accent"
                bg="background"
                transition="background-color 200ms ease-out"
                css={settled({ backgroundColor: 'var(--chakra-colors-accent)' })}
              />
              Weekbound
              {/* In alpha since the launch on 2026-10-18 (the owner's call); a quiet tag, not gold. */}
              <Box
                as="span"
                alignSelf="center"
                fontFamily="smallCaps"
                fontWeight="500"
                fontSize="0.8125rem"
                letterSpacing="0.04em"
                lineHeight="1"
                color="textMuted"
                borderWidth="1px"
                borderColor="lineStrong"
                borderRadius="2px"
                px="6px"
                py="3px"
              >
                Alpha
              </Box>
            </NextLink>
          </Flex>
          <Flex
            as="nav"
            aria-label="Main"
            align="center"
            gap={{ base: '22px', sm: '28px' }}
            fontSize="1.125rem"
          >
            <NavLink href="/my-road">My road</NavLink>
            <NavLink href="/roads">Roads</NavLink>
            <NavLink href="/editor">Make a road</NavLink>
            <ThemeToggle />
          </Flex>
        </Flex>
      </PageWidth>
    </StickyHeader>
  );
}

export function SiteFooter() {
  return (
    <Box as="footer" borderTopWidth="1px" borderColor="line" pt="56px" pb="80px">
      <PageWidth>
        <Flex wrap="wrap" gap="12px 40px" justify="space-between" fontSize="1rem" color="textMuted">
          <Text>
            Weekbound, made by Ludven, a small studio. Code MIT, roads CC BY 4.0.{' '}
            <TextLink href="/about">About and privacy</TextLink>
          </Text>
          <Text>
            Fan tool. Not affiliated with Blizzard Entertainment. World of Warcraft is a trademark
            of Blizzard Entertainment, Inc.
          </Text>
        </Flex>
      </PageWidth>
    </Box>
  );
}
