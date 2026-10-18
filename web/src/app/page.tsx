import { CodesBand, RecapBand, RoadsBand } from '@/components/home/bands';
import { Hero } from '@/components/home/hero';
import { Scene } from '@/components/home/scene';

// The landing (DESIGN.md, Overview and Motion; the approved preview): the promise and the road
// into the fog, the moment where fifty chores become three steps, the weekly recap, the studio's
// roads, and codes with what comes next.
export default function Home() {
  return (
    <>
      <Hero />
      <Scene />
      <RecapBand />
      <RoadsBand />
      <CodesBand />
    </>
  );
}
