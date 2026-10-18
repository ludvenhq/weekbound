import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// DESIGN.md: "The fog lifts" in quest-log colours. Dusk (dark) is the default and dawn
// (parchment) keeps every role. Until the theme toggle lands, the html element carries `dark`.
const dusk = {
  background: '#1F1A15',
  surface: '#2A231C',
  surfaceHover: '#332B22',
  contour: '#3B3127',
  fog: '#C9BBA3',
  text: '#EFE6D2',
  textMuted: '#A99B85',
  primary: '#E8B53A',
  primaryHover: '#F0C258',
  onPrimary: '#1F1A15',
  accent: '#9DB86A',
  locked: '#6E6558',
  success: '#9DB86A',
  warning: '#E39A4C',
  error: '#D9675B',
  info: '#9FB7C4',
  line: 'rgba(239, 230, 210, 0.12)',
  lineStrong: 'rgba(239, 230, 210, 0.28)',
};
type Role = keyof typeof dusk;

const dawn: Record<Role, string> = {
  background: '#E9DFC9',
  surface: '#F3ECDC',
  surfaceHover: '#EDE3CF',
  contour: '#D3C5A8',
  fog: '#FFF9EC',
  text: '#2A2119',
  textMuted: '#6B5B47',
  primary: '#9A6B0C',
  primaryHover: '#AD7A12',
  onPrimary: '#FFF9EC',
  accent: '#557A2C',
  locked: '#8A7F70',
  success: '#557A2C',
  warning: '#9A5A16',
  error: '#A83A2F',
  info: '#3A6478',
  line: 'rgba(42, 33, 25, 0.14)',
  lineStrong: 'rgba(42, 33, 25, 0.3)',
};

const roles = Object.fromEntries(
  (Object.keys(dusk) as Role[]).map((role) => [
    role,
    { value: { _light: dawn[role], _dark: dusk[role] } },
  ]),
) as Record<Role, { value: { _light: string; _dark: string } }>;

const ref = (role: Role) => ({ value: `{colors.${role}}` });

const config = defineConfig({
  globalCss: {
    html: { colorScheme: 'dark' },
    'html.light': { colorScheme: 'light' },
    body: {
      bg: 'background',
      color: 'text',
      fontFamily: 'body',
      fontSize: '1.125rem',
      lineHeight: '1.55',
    },
    // The authored moment and every small state change become instant cuts (DESIGN.md, Motion).
    '*, *::before, *::after': {
      _motionReduce: {
        animationName: 'none !important',
        transitionDuration: '0s !important',
        transitionDelay: '0s !important',
        scrollBehavior: 'auto !important',
      },
    },
  },
  theme: {
    keyframes: {
      // The small celebration on a tick: the box fills and settles.
      tick: {
        '0%': { transform: 'scale(0.7)' },
        '60%': { transform: 'scale(1.15)' },
        '100%': { transform: 'scale(1)' },
      },
      // The chores on the home page, drifting in the fog.
      drift: {
        from: { translate: '-5px 0' },
        to: { translate: '6px -4px' },
      },
      // A message or the camp coming into view.
      arrive: {
        from: { opacity: 0, transform: 'translateY(6px)' },
        to: { opacity: 1, transform: 'none' },
      },
    },
    tokens: {
      fonts: {
        display: { value: 'var(--font-display), Georgia, serif' },
        heading: { value: 'var(--font-display), Georgia, serif' },
        body: { value: 'var(--font-body), system-ui, sans-serif' },
        smallCaps: { value: 'var(--font-small-caps), var(--font-body), sans-serif' },
        mono: { value: 'var(--font-mono), ui-monospace, monospace' },
      },
    },
    semanticTokens: {
      colors: {
        ...roles,
        // Chakra's own groups, pointed at ours, so its components read our values.
        bg: {
          DEFAULT: ref('background'),
          panel: ref('surface'),
          subtle: ref('surface'),
          muted: ref('surfaceHover'),
        },
        fg: { DEFAULT: ref('text'), muted: ref('textMuted'), subtle: ref('textMuted') },
        border: {
          DEFAULT: ref('line'),
          muted: ref('line'),
          subtle: ref('line'),
          emphasized: ref('lineStrong'),
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
