import { Container } from '@chakra-ui/react';
import type { Metadata } from 'next';
import { MyRoad } from '@/components/my-road/my-road';

export const metadata: Metadata = {
  title: 'My road',
  description: 'Your road, its next three steps, and when the next stage opens.',
};

// The page players use every week: one centred column (DESIGN.md, Layout).
export default function MyRoadPage() {
  return (
    <Container maxW="680px" px={{ base: '16px', sm: '24px' }} pt="24px" pb="72px">
      <MyRoad />
    </Container>
  );
}
