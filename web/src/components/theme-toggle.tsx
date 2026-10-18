'use client';

import { chakra } from '@chakra-ui/react';
import { useSyncExternalStore } from 'react';
import { textButton } from './buttons';
import { applyTheme, currentTheme } from './theme';

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function ThemeToggle() {
  // Null while the server renders: the theme is known only in the browser.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);
  if (theme === null) return null;
  const next = theme === 'dusk' ? 'dawn' : 'dusk';
  return (
    <chakra.button
      type="button"
      css={textButton}
      color="textMuted"
      fontSize="1rem"
      _hover={{ color: 'text' }}
      aria-label={next === 'dawn' ? 'Switch to the light theme' : 'Switch to the dark theme'}
      onClick={() => {
        applyTheme(next);
        listeners.forEach((listener) => listener());
      }}
    >
      {next === 'dawn' ? 'Dawn' : 'Dusk'}
    </chakra.button>
  );
}
