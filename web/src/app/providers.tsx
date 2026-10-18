'use client';

import { ChakraProvider } from '@chakra-ui/react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { system } from '@/theme/system';

// Collects the styles Emotion inserts while the server renders and flushes them into the
// streamed HTML. Without it the server HTML has no styles and hydration fails.
function EmotionRegistry({ children }: { children: ReactNode }) {
  const [registry] = useState(() => {
    const cache = createCache({ key: 'sr' });
    cache.compat = true;
    const insert = cache.insert.bind(cache);
    let pending: { name: string; isGlobal: boolean }[] = [];
    cache.insert = (...args: Parameters<typeof insert>) => {
      const [selector, serialized] = args;
      if (cache.inserted[serialized.name] === undefined) {
        pending.push({ name: serialized.name, isGlobal: !selector });
      }
      return insert(...args);
    };
    const flush = () => {
      const flushed = pending;
      pending = [];
      return flushed;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const flushed = registry.flush();
    if (flushed.length === 0) return null;
    const globals: { name: string; css: string }[] = [];
    let names = '';
    let css = '';
    for (const { name, isGlobal } of flushed) {
      const style = registry.cache.inserted[name];
      if (typeof style !== 'string') continue;
      if (isGlobal) {
        globals.push({ name, css: style });
      } else {
        names += ` ${name}`;
        css += style;
      }
    }
    return (
      <>
        {globals.map(({ name, css: globalCss }) => (
          <style
            key={name}
            data-emotion={`${registry.cache.key}-global ${name}`}
            dangerouslySetInnerHTML={{ __html: globalCss }}
          />
        ))}
        {css && (
          <style
            data-emotion={`${registry.cache.key}${names}`}
            dangerouslySetInnerHTML={{ __html: css }}
          />
        )}
      </>
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <EmotionRegistry>
      <ChakraProvider value={system}>{children}</ChakraProvider>
    </EmotionRegistry>
  );
}
