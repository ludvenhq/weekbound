import type { Metadata } from 'next';
import { MyRoad } from '@/components/my-road/my-road';
import { AppPage } from '@/components/page';

export const metadata: Metadata = {
  title: 'My road',
  description: 'Your road, its next three steps, and when the next stage opens.',
};

// The page players use every week: the road in the main column, their other roads and the backup
// beside it (DESIGN.md, Layout).
export default function MyRoadPage() {
  return (
    <AppPage>
      <MyRoad />
    </AppPage>
  );
}
