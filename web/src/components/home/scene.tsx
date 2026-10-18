'use client';

import { Box, Grid, Heading, Text } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { Fog, fogMask } from '@/components/fog';
import { TickRow } from '@/components/my-road/tick-row';
import { PageWidth } from '@/components/site-frame';
import { mulberry32 } from '@/lib/map/contours';
import { studioRoad } from '@/lib/studio/roads';
import { withMark, type Mark, type Marks } from '@/lib/walk/walk';

// The one authored moment (DESIGN.md, Motion): a pinned scene where fifty chores drift in the fog
// behind "Retail is loud." When the player scrolls on, the chores sink, the fog pulls back to the
// right, "Walk one road." appears and the road draws itself through three stones beside three
// steps; scrolling back up brings the fog and the chores back (the owner, 2026-10-18). Each way
// has its own timing, so the two never overlap. With reduced motion every transition is cut to
// nothing, so it is an instant swap. The steps are the first stage of The Long Season, and they
// tick like My road's.

const CHORES = [
  'World quests',
  'Weekly quest',
  'World boss',
  'Delves',
  'Upgrade crests',
  'Renown',
  'Catalyst charges',
  'Timewalking',
  'Profession knowledge',
  'Crafting orders',
  'Great Vault',
  'Mythic+ keys',
  'Conquest cap',
  'Honor',
  'Rated battlegrounds',
  'Solo Shuffle',
  'Raid lockouts',
  'Trading Post',
  'Darkmoon Faire',
  'Pet battles',
  'Housing decor',
  'Holiday event',
  'Reputations',
  'Transmog',
  'Mounts',
  'Achievements',
  'Talent builds',
  'Addon updates',
  'Weekly cache',
  'Bonus event',
  'Rares',
  'Treasures',
  'Campaign chapter',
  'Side stories',
  'Gearing guide',
  'Best-in-slot lists',
  'Tier set',
  'Embellishments',
  'Gems and enchants',
  'Consumables',
  'Group finder',
  'Key levels',
  'Prey hunts',
  'Alts',
  'Collections',
  'Patch notes',
  'Spec tier lists',
  'Weekly event',
  'Gold making',
  'Special assignments',
];

// Seeded, so the server and the browser place every chore in the same spot. Chores that would sit
// behind the text on the left move to the right half, and the ones left there are fainter.
const PLACED = (() => {
  const random = mulberry32(42);
  return CHORES.map((label, index) => {
    let x = 3 + random() * 88;
    const y = 7 + random() * 84;
    if (x > 8 && x < 46 && y > 24 && y < 86) x = 47 + random() * 46;
    const opacity = x < 46 ? 0.16 + random() * 0.1 : 0.28 + random() * 0.32;
    const size = 0.85 + random() * 0.45;
    const duration = 12 + random() * 10;
    const delay = random() * 10;
    return { label, index, x, y, opacity, size, duration, delay };
  });
})();

const ROAD = studioRoad('sr-the-long-season');
const STEPS = ROAD?.stages[0]?.steps.slice(0, 3) ?? [];

function Chores({ lifted }: { lifted: boolean }) {
  return (
    <Box position="absolute" inset="0" aria-hidden>
      {PLACED.map((chore) => (
        <Box
          as="span"
          key={chore.label}
          position="absolute"
          left={`${chore.x.toFixed(1)}%`}
          top={`${chore.y.toFixed(1)}%`}
          display={{ base: chore.index % 2 === 1 ? 'none' : 'inline', md: 'inline' }}
          whiteSpace="nowrap"
          color="fog"
          css={{ 'html.light &': { color: 'textMuted' } }}
          fontSize={`${chore.size.toFixed(2)}rem`}
          opacity={lifted ? 0 : { base: chore.opacity * 0.55, sm: chore.opacity }}
          transform={lifted ? 'translateY(26px)' : undefined}
          filter={lifted ? 'blur(3px)' : undefined}
          animation={`drift ${chore.duration.toFixed(1)}s ease-in-out -${chore.delay.toFixed(1)}s infinite alternate`}
          transition={
            lifted
              ? 'opacity 500ms ease-in, transform 600ms ease-in, filter 600ms ease-in'
              : 'opacity 600ms ease-out, transform 600ms ease-out, filter 600ms ease-out'
          }
          transitionDelay={`${lifted ? chore.index * 9 : 300 + chore.index * 6}ms`}
        >
          {chore.label}
        </Box>
      ))}
    </Box>
  );
}

// The trail beside the three steps, drawn from the top when the fog lifts.
const TRAIL = 'M15 0 C 6 20, 24 40, 15 60 S 6 100, 15 120 S 24 160, 15 180 S 8 215, 15 230';

function Trail({ lifted }: { lifted: boolean }) {
  return (
    <Box asChild position="absolute" left="0" top="0" w="30px" h="100%" overflow="visible">
      <svg viewBox="0 0 30 230" preserveAspectRatio="none" aria-hidden>
        <defs>
          <mask id="scene-trail" maskUnits="userSpaceOnUse" x="-20" y="-20" width="70" height="280">
            <Box
              asChild
              strokeDasharray="1"
              strokeDashoffset={lifted ? 0 : 1}
              transition={
                lifted
                  ? 'stroke-dashoffset 600ms ease-out 800ms'
                  : 'stroke-dashoffset 250ms ease-in'
              }
            >
              <path d={TRAIL} pathLength={1} fill="none" stroke="#fff" strokeWidth="10" />
            </Box>
          </mask>
        </defs>
        <path
          d={TRAIL}
          fill="none"
          stroke="var(--chakra-colors-accent)"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          mask="url(#scene-trail)"
        />
      </svg>
    </Box>
  );
}

export function Scene() {
  const [lifted, setLifted] = useState(false);
  const [marks, setMarks] = useState<Marks>({});
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  // Lifted while the line a little into the scene is in view or above it; back above that line,
  // the fog returns.
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !('IntersectionObserver' in window)) {
      setLifted(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setLifted(entry.isIntersecting || entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function mark(id: string, state: Mark['state'] | null) {
    setMarks((current) => withMark(current, id, state, Date.now()));
    setCelebrate(state === 'done' ? id : null);
  }

  const firstOpen = STEPS.find((step) => !marks[step.id])?.id;

  return (
    <Box as="section" position="relative" h="230vh" aria-label="Retail is loud. Walk one road.">
      <Box position="sticky" top="0" h="100vh" overflow="hidden">
        <Fog
          css={{
            opacity: lifted ? 0.25 : 0.7,
            transform: lifted ? 'translateX(55%)' : 'none',
            transition: lifted
              ? 'transform 800ms ease-in-out 350ms, opacity 800ms ease-in-out 350ms'
              : 'transform 700ms ease-in-out, opacity 700ms ease-in-out',
            willChange: 'transform',
            ...fogMask(
              'linear-gradient(to right, transparent 0, #000 18%, #000 100%)',
              'linear-gradient(to bottom, transparent 0, #000 16%, #000 84%, transparent 100%)',
            ),
          }}
        />
        <Chores lifted={lifted} />
        <PageWidth>
          <Grid h="100vh" alignItems="center" position="relative">
            <Box
              gridArea="1 / 1"
              maxW="580px"
              opacity={lifted ? 0 : 1}
              transform={lifted ? 'translateY(-12px)' : 'none'}
              pointerEvents={lifted ? 'none' : 'auto'}
              transition={
                lifted
                  ? 'opacity 350ms ease-in, transform 350ms ease-in'
                  : 'opacity 400ms ease-out 350ms, transform 400ms ease-out 350ms'
              }
            >
              <Heading
                as="h2"
                fontFamily="display"
                fontWeight="600"
                fontSize="clamp(2.5rem, 5vw, 4rem)"
                lineHeight="1.05"
              >
                Retail is loud.
              </Heading>
              <Text mt="20px" fontSize={{ base: '1.125rem', md: '1.3125rem' }} maxW="36ch">
                Log in and the game hands you fifty things at once. None of them says which one
                matters this week, so most evenings end with a few world quests and the feeling of
                running in place.
              </Text>
              <Box
                mt="28px"
                px="22px"
                py="18px"
                bg="background"
                borderWidth="1px"
                borderColor="line"
                maxW="44ch"
              >
                <Text fontSize={{ base: '1.125rem', md: '1.3125rem' }} fontStyle="italic">
                  &ldquo;I feel dumb in retail. I don&apos;t see goals, only grinding.&rdquo;
                </Text>
                <Text mt="8px" fontSize="1rem" color="textMuted">
                  A returning player, October 2026
                </Text>
              </Box>
              <Text mt="18px" fontSize="1.0625rem" color="textMuted" maxW="44ch">
                In August 2026 a thread on r/wow about not knowing what to do drew 613 upvotes and
                308 comments.
              </Text>
            </Box>

            <Box
              gridArea="1 / 1"
              maxW="720px"
              opacity={lifted ? 1 : 0}
              transform={lifted ? 'none' : 'translateY(12px)'}
              pointerEvents={lifted ? 'auto' : 'none'}
              transition={
                lifted
                  ? 'opacity 450ms ease-out 750ms, transform 450ms ease-out 750ms'
                  : 'opacity 250ms ease-in, transform 250ms ease-in'
              }
            >
              <Heading
                as="h2"
                fontFamily="display"
                fontWeight="600"
                fontSize="clamp(2.5rem, 5vw, 4rem)"
                lineHeight="1.05"
              >
                Walk one road.
              </Heading>
              <Text mt="20px" fontSize={{ base: '1.125rem', md: '1.3125rem' }} maxW="40ch">
                Slow Road shows your character the next three steps of one road. Nothing else is on
                the screen.
              </Text>
              <Box position="relative" mt="30px" pl="44px">
                <Trail lifted={lifted} />
                <Box as="ul" listStyleType="none" m="0" p="0" display="grid" gap="10px">
                  {STEPS.map((step, index) => {
                    const stepMark = marks[step.id] ?? null;
                    const current = step.id === firstOpen;
                    // The stones appear one by one as the road reaches them.
                    const appear = lifted ? 950 + index * 150 : 0;
                    return (
                      <TickRow
                        key={step.id}
                        row={{ step, mark: stepMark, current }}
                        celebrate={celebrate === step.id}
                        marker={
                          <Box
                            aria-hidden
                            position="absolute"
                            left="-37px"
                            top="50%"
                            w="14px"
                            h="14px"
                            mt="-7px"
                            borderWidth="2px"
                            borderColor={current ? 'primary' : 'accent'}
                            bg={
                              current
                                ? 'primary'
                                : stepMark?.state === 'done'
                                  ? 'accent'
                                  : 'background'
                            }
                            opacity={lifted ? 1 : 0}
                            transform={
                              lifted ? 'rotate(45deg) scale(1)' : 'rotate(45deg) scale(0.5)'
                            }
                            transition={`opacity 150ms ease-out ${appear}ms, transform 200ms ease-out ${appear}ms, background-color 150ms ease-out, border-color 150ms ease-out`}
                          />
                        }
                        onTick={() => mark(step.id, stepMark?.state === 'done' ? null : 'done')}
                        onSkip={() =>
                          mark(step.id, stepMark?.state === 'skipped' ? null : 'skipped')
                        }
                      />
                    );
                  })}
                </Box>
              </Box>
              <Text mt="18px" fontSize="1.125rem" color="textMuted" maxW="44ch">
                Finish all three and you make camp. The next stage opens at the weekly reset.
              </Text>
            </Box>
          </Grid>
        </PageWidth>
      </Box>
      <Box ref={sentinel} aria-hidden position="absolute" left="0" top="58%" h="1px" w="100%" />
    </Box>
  );
}
