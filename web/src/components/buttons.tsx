import type { SystemStyleObject } from '@chakra-ui/react';

// DESIGN.md, Components. One primary (gold) action per screen.

const focus: SystemStyleObject = {
  _focusVisible: { outline: '2px solid {colors.text}', outlineOffset: '3px' },
};

// Two cut corners, drawn with gradients rather than clip-path, so the focus outline still shows.
export const primaryButton: SystemStyleObject = {
  ...focus,
  '--fill': '{colors.primary}',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  border: 0,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '1.0625rem',
  lineHeight: 1.3,
  color: 'onPrimary',
  px: '24px',
  py: '14px',
  textDecoration: 'none',
  background:
    'linear-gradient(135deg, transparent 8px, var(--fill) 8px) top / 100% 51% no-repeat, linear-gradient(315deg, transparent 8px, var(--fill) 8px) bottom / 100% 51% no-repeat',
  _hover: { '--fill': '{colors.primaryHover}' },
  _active: { transform: 'translateY(1px)' },
  _disabled: { '--fill': '{colors.surfaceHover}', color: 'textMuted', cursor: 'not-allowed' },
};

export const secondaryButton: SystemStyleObject = {
  ...focus,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 500,
  fontSize: '1.0625rem',
  lineHeight: 1.3,
  px: '22px',
  py: '13px',
  border: '1px solid {colors.lineStrong}',
  borderRadius: '2px',
  bg: 'transparent',
  color: 'text',
  cursor: 'pointer',
  textDecoration: 'none',
  _hover: { bg: 'surface' },
};

// A quiet action that reads as a link: Dismiss, Remove, Undo.
export const textButton: SystemStyleObject = {
  ...focus,
  bg: 'none',
  border: 0,
  p: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '4px',
  textDecorationColor: '{colors.lineStrong}',
  _hover: { textDecorationColor: '{colors.text}' },
};
