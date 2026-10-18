'use client';

import { Box } from '@chakra-ui/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// The header stays at the top while the page scrolls (the owner, 2026-10-18). Once the page has
// moved, it settles into a compact bar on the page colour with a line under it, and the mark's
// diamond fills green: one small state change of about 200 ms (DESIGN.md, Motion), instant with
// reduced motion. No shadow and no blur; the fog is the only translucent layer.
//
// The parts inside react to `data-stuck` on this element ('[data-stuck] &' selectors), so they
// can stay server-rendered.
export function StickyHeader({ children }: { children: ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry?.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* A line at the very top: once it leaves the screen, the page has scrolled. */}
      <Box ref={sentinel} aria-hidden h="1px" mb="-1px" />
      <Box
        as="header"
        data-stuck={stuck ? '' : undefined}
        position="sticky"
        top="0"
        zIndex="20"
        bg={stuck ? 'background' : 'transparent'}
        borderBottomWidth="1px"
        borderColor={stuck ? 'line' : 'transparent'}
        transition="background-color 200ms ease-out, border-color 200ms ease-out"
      >
        {children}
      </Box>
    </>
  );
}
