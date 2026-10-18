import { Box, Flex, Heading, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { primaryButton } from '@/components/buttons';
import { PageWidth } from '@/components/site-frame';

// A holding page: the landing with the road drawing and the fog comes with the first roads. It is
// a server component, where chakra.x factories are undefined, so it uses Box with as or asChild.
export default function Home() {
  return (
    <PageWidth>
      <Box as="section" py={{ base: '80px', md: '120px' }}>
        <Heading
          as="h1"
          fontFamily="display"
          fontWeight="600"
          fontSize="clamp(2.75rem, 6vw, 4.5rem)"
          lineHeight="1.05"
          maxW="14ch"
        >
          Know what this week is for.
        </Heading>
        <Text mt="24px" fontSize="1.3125rem" lineHeight="1.5" maxW="30ch">
          Retail hands you fifty chores. Slow Road gives your character one road: the next three
          steps, and a new stage at each weekly reset.
        </Text>
        <Flex mt="36px" wrap="wrap" align="center" gap="22px">
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
        <Text mt="22px" fontSize="0.9375rem" color="textMuted">
          Free, no login, saved in your browser. The studio&apos;s first roads come soon.
        </Text>
      </Box>
    </PageWidth>
  );
}
