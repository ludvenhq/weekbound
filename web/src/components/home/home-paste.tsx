'use client';

import { useRouter } from 'next/navigation';
import { CodeField } from '@/components/my-road/paste-road';
import { DECODE_MESSAGES, decodeRoad } from '@/lib/road/code';
import { roadLink } from '@/lib/road/link';

// The home page's paste box: a code that opens goes to My road in a road link, where it is
// started like a pasted one; one that does not says why here.
export function HomePaste() {
  const router = useRouter();
  return (
    <CodeField
      id="paste"
      label="Paste a road code"
      placeholder="SR1!..."
      action="Start this road"
      primary
      check={(code) => {
        const result = decodeRoad(code);
        if (!result.ok) return DECODE_MESSAGES[result.error];
        router.push(roadLink(code.replace(/[ \t\r\n]/g, '')));
        return null;
      }}
    />
  );
}
