import { Box, type SystemStyleObject } from '@chakra-ui/react';

// The fog (DESIGN.md, Elevation & Depth): the one translucent layer, drawn by an SVG noise filter
// in the fog colour, dusk or dawn. The filters are defined once in the layout; every fog is an
// absolutely placed SVG that fills its parent and is shaped by a mask.

// The quest-log fog colour (#C9BBA3) as 0 to 1, for the dusk filter's colour matrix.
const DUSK = '0 0 0 0 0.788  0 0 0 0 0.733  0 0 0 0 0.639  1.5 0 0 0 -0.62';
const DAWN = '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.7 0 0 0 -0.6';

function filter(id: string, matrix: string) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.0016 0.0045"
        numOctaves={3}
        seed={11}
        result="noise"
      />
      <feColorMatrix in="noise" type="matrix" values={matrix} result="colour" />
      <feGaussianBlur in="colour" stdDeviation="14" />
    </filter>
  );
}

export function FogFilters() {
  return (
    <Box asChild position="absolute">
      <svg width="0" height="0" aria-hidden>
        <defs>
          {filter('fog-dusk', DUSK)}
          {filter('fog-dawn', DAWN)}
        </defs>
      </svg>
    </Box>
  );
}

// A mask made of gradients, written for both engines: `mask` is one or more gradients, and when
// there are two they are intersected.
export function fogMask(...gradients: string[]): SystemStyleObject {
  const image = gradients.join(', ');
  return {
    maskImage: image,
    WebkitMaskImage: image,
    ...(gradients.length > 1
      ? { maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }
      : {}),
  };
}

export function Fog({ css }: { css?: SystemStyleObject }) {
  return (
    <Box asChild position="absolute" inset="0" w="100%" h="100%" pointerEvents="none" css={css}>
      <svg aria-hidden preserveAspectRatio="none">
        <Box asChild css={{ 'html.light &': { display: 'none' } }}>
          <rect width="100%" height="100%" filter="url(#fog-dusk)" />
        </Box>
        <Box asChild display="none" css={{ 'html.light &': { display: 'inline' } }}>
          <rect width="100%" height="100%" filter="url(#fog-dawn)" />
        </Box>
      </svg>
    </Box>
  );
}
