import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import NextLink from 'next/link';
import { primaryButton } from '@/components/buttons';
import { AppPage, pageTitle } from '@/components/page';
import { TextLink } from '@/components/text-link';

// A page that does not exist, in the site's own words. A server component.
export default function NotFound() {
  return (
    <AppPage>
      <Box maxW="640px" py={{ base: '40px', md: '80px' }}>
        <Heading as="h1" {...pageTitle}>
          This road goes nowhere.
        </Heading>
        <Text mt="16px" fontSize="1.25rem" color="textMuted">
          There is no page here. The link may be old, or a letter may be missing.
        </Text>
        <Flex mt="32px" wrap="wrap" align="center" gap="22px">
          <Box asChild css={primaryButton}>
            <NextLink href="/my-road">Show my next three steps</NextLink>
          </Box>
          <TextLink href="/roads">See the roads</TextLink>
        </Flex>
      </Box>
    </AppPage>
  );
}
