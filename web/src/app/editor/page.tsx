import type { Metadata } from 'next';
import { Editor } from '@/components/editor/editor';
import { AppPage } from '@/components/page';

export const metadata: Metadata = {
  title: 'Make a road',
  description: 'Build a road in stages and steps, and share it as one line of text.',
};

// The road being made in the main column, its code beside it (DESIGN.md, Layout).
export default function EditorPage() {
  return (
    <AppPage>
      <Editor />
    </AppPage>
  );
}
