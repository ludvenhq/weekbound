'use client';

import { Box } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { contourSegments } from '@/lib/map/contours';

// The night survey map behind every page (DESIGN.md, Overview): thin contour lines in the
// `contour` colour, from the same seeded noise every visit, so the map never changes under the
// player. It is redrawn when the window is resized or the theme changes, never animated.

const STEP = 9;

export function ContourMap() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context) return;

    function draw() {
      if (!element || !context) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = getComputedStyle(element).color;
      context.lineJoin = 'round';
      context.globalAlpha = 0.6;
      for (const level of contourSegments(width, height, STEP)) {
        context.beginPath();
        context.lineWidth = level.major ? 1.4 : 0.9;
        for (const [x1, y1, x2, y2] of level.segments) {
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
        }
        context.stroke();
      }
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(draw, 150);
    };
    // The theme toggle swaps a class on <html>; the line colour follows it.
    const theme = new MutationObserver(draw);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', onResize);
    draw();
    return () => {
      clearTimeout(timer);
      theme.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <Box
      asChild
      position="fixed"
      inset="0"
      w="100vw"
      h="100vh"
      zIndex="0"
      pointerEvents="none"
      color="contour"
    >
      <canvas ref={canvas} aria-hidden />
    </Box>
  );
}
