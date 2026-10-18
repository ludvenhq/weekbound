'use client';

import { Box, chakra, Text } from '@chakra-ui/react';
import { useEffect, useId, useState } from 'react';
import { codeInput } from '@/components/my-road/paste-road';
import { useBlizzard } from '@/components/use-blizzard';
import type { SearchKind } from '@/lib/blizzard/search';
import type { ParamKey } from '@/lib/editor/draft';

// Search by name beside an id field (design doc, Editor): the author types part of a name and
// picks the match, and the id field fills. It shows only when the server has a Blizzard client;
// otherwise the id or a Wowhead link is typed as before.

export const SEARCHABLE: Partial<Record<ParamKey, SearchKind>> = {
  achievementId: 'achievement',
  mountId: 'mount',
  titleId: 'title',
  factionId: 'faction',
};

const NOUNS: Record<SearchKind, string> = {
  achievement: 'achievements',
  mount: 'mounts',
  title: 'titles',
  faction: 'factions',
};

type Found = { id: number; name: string };

export function GameSearch({ kind, onPick }: { kind: SearchKind; onPick: (id: number) => void }) {
  const enabled = useBlizzard();
  const id = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Found[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  // A quarter of a second after the author stops typing.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults(null);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      fetch(`/api/search?kind=${kind}&q=${encodeURIComponent(text)}`)
        .then((response) => response.json())
        .then((data: { results?: Found[] }) => live && setResults(data.results ?? []))
        .catch(() => live && setResults([]));
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, kind]);

  if (!enabled) return null;

  return (
    <Box flex="1 1 260px" display="grid" gap="6px" position="relative">
      <chakra.label htmlFor={id} fontSize="0.9375rem" color="textMuted">
        Or search {NOUNS[kind]} by name
      </chakra.label>
      <chakra.input
        id={id}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setPicked(null);
        }}
        placeholder="Ahead of the Curve"
        autoComplete="off"
        css={{ ...codeInput, fontFamily: 'body', fontSize: '1rem' }}
      />
      {picked && (
        <Text fontSize="0.9375rem" color="accent">
          Picked: {picked}
        </Text>
      )}
      {results && !picked && (
        <chakra.ul
          listStyleType="none"
          m="0"
          p="4px 0"
          bg="background"
          borderWidth="1px"
          borderColor="lineStrong"
          maxH="260px"
          overflowY="auto"
        >
          {results.length === 0 && (
            <chakra.li px="12px" py="8px" color="textMuted" fontSize="0.9375rem">
              Nothing by that name.
            </chakra.li>
          )}
          {results.map((found) => (
            <li key={found.id}>
              <chakra.button
                type="button"
                w="100%"
                textAlign="left"
                px="12px"
                py="8px"
                bg="none"
                border="0"
                color="text"
                font="inherit"
                fontSize="1rem"
                cursor="pointer"
                _hover={{ bg: 'surfaceHover' }}
                _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '-2px' }}
                onClick={() => {
                  onPick(found.id);
                  setPicked(found.name);
                  setResults(null);
                }}
              >
                {found.name}{' '}
                <chakra.span color="textMuted" fontSize="0.875rem">
                  {found.id}
                </chakra.span>
              </chakra.button>
            </li>
          ))}
        </chakra.ul>
      )}
    </Box>
  );
}
