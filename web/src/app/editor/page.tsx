import { Container } from '@chakra-ui/react';
import type { Metadata } from 'next';
import { Editor } from '@/components/editor/editor';

export const metadata: Metadata = {
  title: 'Make a road',
  description: 'Build a road in stages and steps, and share it as one line of text.',
};

// One centred column, like My road (DESIGN.md, Layout).
export default function EditorPage() {
  return (
    <Container maxW="680px" px={{ base: '16px', sm: '24px' }} pt="24px" pb="72px">
      <Editor />
    </Container>
  );
}
