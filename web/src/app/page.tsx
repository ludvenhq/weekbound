import { Container, Heading, Text } from '@chakra-ui/react';

// A holding page until My road (build step 2) takes the front door.
export default function Home() {
  return (
    <Container maxW="1120px" px={{ base: '16px', sm: '24px' }} py={{ base: '80px', md: '120px' }}>
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
      <Text mt="22px" fontSize="0.9375rem" color="textMuted">
        Being built. The first roads come soon.
      </Text>
    </Container>
  );
}
