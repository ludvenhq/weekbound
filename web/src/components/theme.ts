// Dusk (dark) is the default; dawn (light) comes from the player's choice or, without one, from
// the system setting (DESIGN.md, Colors). The choice lives in localStorage under this key, and the
// script below applies it before the first paint, so the page never flashes the wrong theme.

export const THEME_KEY = 'slow-road:theme';
export type Theme = 'dusk' | 'dawn';

export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_KEY}');var d=c?c==='dusk':!matchMedia('(prefers-color-scheme: light)').matches;var e=document.documentElement;e.classList.toggle('dark',d);e.classList.toggle('light',!d);}catch(x){}})();`;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dusk');
  root.classList.toggle('light', theme === 'dawn');
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts until the page closes.
  }
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains('light') ? 'dawn' : 'dusk';
}
