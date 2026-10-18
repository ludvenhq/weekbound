'use client';

import { Box, chakra, Flex, Heading, Stack, Text, VisuallyHidden } from '@chakra-ui/react';
import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import { secondaryButton, textButton } from '@/components/buttons';
import { Message, type Tone } from '@/components/message';
import { Columns, pageTitle, SideSection } from '@/components/page';
import { Signpost } from '@/components/signpost';
import { TextLink } from '@/components/text-link';
import { DECODE_MESSAGES, decodeRoad } from '@/lib/road/code';
import { codeFromHash, walkFromHash } from '@/lib/road/link';
import type { Road } from '@/lib/road/schema';
import { roadPage, STUDIO_ROADS, studioRoad } from '@/lib/studio/roads';
import { guessRegion, type Region } from '@/lib/walk/reset';
import {
  activate,
  findRoad,
  importRoad,
  markStep,
  markSteps,
  marksOf,
  removeRoad,
  replaceRoad,
  setRegion,
  yourRoads,
  type Saved,
} from '@/lib/walk/saved';
import { position, recap, withMark, type Mark, type Recap } from '@/lib/walk/walk';
import { Backup, YourRoads } from './library';
import { PasteRoad } from './paste-road';
import { RoadCheckSection } from './road-check';
import { RoadView } from './road-view';
import { currentSaved, updateSaved, useNow, useSaved } from './use-saved';

type Notice = { tone: Tone; text: ReactNode };

function regionOf(saved: Saved): Region {
  return saved.region ?? guessRegion(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

function toTop() {
  window.scrollTo({ top: 0 });
}

// "A, B and C", each thing in the road's green.
function Things({ items }: { items: string[] }) {
  return items.map((item, index) => (
    <Fragment key={index}>
      {index > 0 && (index === items.length - 1 ? ' and ' : ', ')}
      <chakra.b fontWeight="500" color="accent">
        {item}
      </chakra.b>
    </Fragment>
  ));
}

// The first visit after a reset opens with what the player did. Never what they missed.
function RecapNote({ recap, onDismiss }: { recap: Recap; onDismiss: () => void }) {
  const labels = recap.done.map((step) => step.label);
  const shown = labels.length > 4 ? labels.slice(0, 3) : labels;
  const more = labels.length - shown.length;
  return (
    <Flex
      justify="space-between"
      align="flex-start"
      gap="18px"
      px="18px"
      py="16px"
      bg="color-mix(in srgb, {colors.accent} 12%, {colors.surface})"
      animation="arrive 250ms ease-out"
    >
      <Text fontSize="1.0625rem">
        Welcome back.{' '}
        {shown.length > 0 && (
          <>
            {recap.span === 'last-week' ? 'Last week' : 'Since your last visit'} you finished{' '}
            <Things items={more > 0 ? [...shown, `${more} more`] : shown} />.{' '}
          </>
        )}
        {recap.opened && `Stage ${recap.opened.index + 1}, ${recap.opened.name}, is open.`}
      </Text>
      <chakra.button type="button" css={textButton} color="textMuted" onClick={onDismiss}>
        Dismiss
      </chakra.button>
    </Flex>
  );
}

function Loading() {
  return (
    <Columns template="minmax(0, 1fr) 360px" gap={{ base: '56px', lg: '88px' }}>
      <Box aria-busy="true" aria-label="Loading your road">
        <Box h="52px" w="60%" bg="surface" />
        <Box mt="12px" h="26px" w="40%" bg="surface" />
        <Box mt="22px" h="14px" w="220px" bg="surface" />
        <Stack mt="30px" gap="10px">
          {[0, 1, 2].map((row) => (
            <Box key={row} h="76px" bg="surface" />
          ))}
        </Stack>
      </Box>
      <Stack gap="40px">
        <Box h="140px" bg="surface" />
        <Box h="100px" bg="surface" />
      </Stack>
    </Columns>
  );
}

export function MyRoad() {
  const snapshot = useSaved();
  const [now, setNow] = useNow();
  const [recapNote, setRecapNote] = useState<Recap | null | undefined>(undefined);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [newer, setNewer] = useState<{ incoming: Road; current: Road } | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Once per page load: work out the recap from the last visit, then record this visit.
  useEffect(() => {
    if (!snapshot || recapNote !== undefined) return;
    const { saved } = snapshot;
    const road = findRoad(saved, saved.active);
    const at = Date.now();
    setRecapNote(
      road ? recap(road, marksOf(saved, road.id), regionOf(saved), saved.lastVisit, at) : null,
    );
    updateSaved((current) => ({ ...current, lastVisit: at }));
  }, [snapshot, recapNote]);

  // From the paste box or a link. It reads the saved state as it is now, because a link is
  // opened in the same moment as the visit is recorded.
  const startRoad = useCallback((incoming: Road) => {
    setNewer(null);
    setRecapNote(null);
    const outcome = importRoad(currentSaved(), incoming);
    switch (outcome.kind) {
      case 'added':
        updateSaved(() => outcome.saved);
        setNotice({ tone: 'success', text: `${incoming.title} is your road now.` });
        break;
      case 'same':
        updateSaved(() => outcome.saved);
        setNotice({
          tone: 'info',
          text: `You already have this version of ${incoming.title}. It's your road now.`,
        });
        break;
      case 'older':
        setNotice({
          tone: 'info',
          text: `You already have a newer version of ${incoming.title} (version ${outcome.current.rev}).`,
        });
        break;
      case 'newer':
        setNotice(null);
        setNewer({ incoming, current: outcome.current });
        break;
    }
    toTop();
  }, []);

  // A studio road ships with the site, so starting it only makes it the active road. Its
  // progress, if the player walked it before, is where they left it.
  const walkStudio = useCallback((id: string) => {
    setNewer(null);
    setRecapNote(null);
    const road = studioRoad(id);
    if (!road) {
      setNotice({ tone: 'error', text: "We don't know that road. Pick one from the roads." });
    } else if (currentSaved().active === id) {
      setNotice({ tone: 'info', text: `${road.title} is your road already.` });
    } else {
      updateSaved((current) => activate(current, id));
      setNotice({ tone: 'success', text: `${road.title} is your road now.` });
    }
    toTop();
  }, []);

  // A road handed over in a link is started like a pasted one, then the link leaves the address
  // bar: a code (/my-road#road=SR1!…, from the editor or another player) or a studio road
  // (/my-road#walk=sr-…, from its page).
  useEffect(() => {
    if (!snapshot) return;
    const { hash } = window.location;
    const code = codeFromHash(hash);
    const walk = walkFromHash(hash);
    if (code === null && walk === null) return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (walk !== null) {
      walkStudio(walk);
    } else if (code !== null) {
      const result = decodeRoad(code);
      if (result.ok) startRoad(result.road);
      else setNotice({ tone: 'error', text: DECODE_MESSAGES[result.error] });
    }
  }, [snapshot, startRoad, walkStudio]);

  if (!snapshot) return <Loading />;
  const { saved, stored } = snapshot;
  const region = regionOf(saved);
  const road = findRoad(saved, saved.active);
  const roads = yourRoads(saved);

  function mark(target: Road, stepId: string, state: Mark['state'] | null) {
    const at = Date.now();
    const marks = marksOf(saved, target.id);
    const before = position(target, marks, region, at);
    const after = position(target, withMark(marks, stepId, state, at), region, at);
    updateSaved((current) => markStep(current, target.id, stepId, state, at));
    setNow(at);
    setCelebrate(state === 'done' ? stepId : null);
    setNotice(null);

    const label = target.stages.flatMap((stage) => stage.steps).find((s) => s.id === stepId)?.label;
    let said =
      state === 'done'
        ? `Done: ${label}.`
        : state === 'skipped'
          ? `Skipped: ${label}.`
          : `Undone: ${label}.`;
    if (after.kind === 'camp' && before.kind === 'walking') said += ' Stage done. Make camp.';
    if (after.kind === 'complete' && before.kind !== 'complete') said += ' Road complete.';
    if (after.kind === 'walking' && before.kind === 'walking' && after.stage > before.stage) {
      const name = target.stages[after.stage]?.name;
      said += ` Stage ${after.stage + 1} is open.`;
      setNotice({
        tone: 'success',
        text: `Stage ${before.stage + 1} done. Stage ${after.stage + 1}, ${name}, is open.`,
      });
    }
    setAnnouncement(said);
  }

  return (
    <Columns template="minmax(0, 1fr) 360px" gap={{ base: '56px', lg: '88px' }}>
      <Stack gap="20px">
        <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>

        {!stored && (
          <Message tone="warning">
            This browser isn&apos;t saving your progress (a private window, or blocked site data).
            It lasts until you close this tab; a backup code keeps it.
          </Message>
        )}
        {recapNote && road && <RecapNote recap={recapNote} onDismiss={() => setRecapNote(null)} />}
        {notice && (
          <Box animation="arrive 250ms ease-out">
            <Message tone={notice.tone}>{notice.text}</Message>
          </Box>
        )}
        {newer && (
          <Message tone="info">
            <Text>
              You have version {newer.current.rev} of {newer.current.title} by{' '}
              {newer.current.author}. Replace it with version {newer.incoming.rev}? Your progress
              stays.
            </Text>
            <Flex mt="12px" gap="18px" align="center" wrap="wrap">
              <chakra.button
                type="button"
                css={secondaryButton}
                onClick={() => {
                  updateSaved((current) => replaceRoad(current, newer.incoming));
                  setNotice({
                    tone: 'success',
                    text: `${newer.incoming.title} is now version ${newer.incoming.rev}. Your progress stayed.`,
                  });
                  setNewer(null);
                }}
              >
                Replace with version {newer.incoming.rev}
              </chakra.button>
              <chakra.button type="button" css={textButton} onClick={() => setNewer(null)}>
                Keep version {newer.current.rev}
              </chakra.button>
            </Flex>
          </Message>
        )}

        <Box>
          {road ? (
            <RoadView
              road={road}
              marks={marksOf(saved, road.id)}
              region={region}
              now={now}
              celebrate={celebrate}
              page={roadPage(road.id)}
              onMark={(stepId, state) => mark(road, stepId, state)}
              onRegion={(next) => updateSaved((current) => setRegion(current, next))}
            />
          ) : (
            <Box>
              <Heading as="h1" {...pageTitle}>
                No road yet.
              </Heading>
              <Text mt="14px" mb="36px" fontSize="1.25rem" color="textMuted" maxW="44ch">
                Pick one of the studio&apos;s roads and see its first three steps, or paste a road
                code.
              </Text>
              <Signpost
                arms={STUDIO_ROADS.map((studio) => ({
                  road: studio.road,
                  summary: studio.summary,
                  action: 'Walk',
                  onPick: () => walkStudio(studio.road.id),
                }))}
              />
              <Box mt="56px">
                <PasteRoad primary onRoad={startRoad} />
              </Box>
            </Box>
          )}
        </Box>
      </Stack>

      <Stack as="aside" aria-label="Your roads and backup" gap="40px">
        {road && (
          <RoadCheckSection
            road={road}
            marks={marksOf(saved, road.id)}
            region={region}
            onTicks={(ticks) => {
              const at = Date.now();
              updateSaved((current) => markSteps(current, road.id, ticks));
              setNow(at);
              setRecapNote(null);
              setNotice({
                tone: 'success',
                text: `Road Check ticked ${ticks.length === 1 ? 'one step' : `${ticks.length} steps`} the game says are done.`,
              });
              setAnnouncement(`Road Check ticked ${ticks.length} steps.`);
              toTop();
            }}
          />
        )}
        {roads.length > 0 && (
          <SideSection title="Your roads">
            <YourRoads
              roads={roads}
              saved={saved}
              region={region}
              now={now}
              onWalk={(id) => {
                updateSaved((current) => activate(current, id));
                setNotice(null);
                setRecapNote(null);
                toTop();
              }}
              onRemove={(id) => {
                const title = findRoad(saved, id)?.title;
                updateSaved((current) => removeRoad(current, id));
                setRecapNote(null);
                setNotice({
                  tone: 'info',
                  text: `Removed ${title}. Its progress stays in this browser: paste its code again to continue where you stopped.`,
                });
                toTop();
              }}
            />
          </SideSection>
        )}
        {road && (
          <SideSection title="Start another road">
            <Stack gap="20px">
              <Text color="textMuted">
                Your ticks on this road stay, and so does its weekly lock. Pick one of{' '}
                <TextLink href="/roads">the studio&apos;s roads</TextLink>, or paste a code.
              </Text>
              <PasteRoad primary={false} onRoad={startRoad} />
            </Stack>
          </SideSection>
        )}
        <Box borderBottomWidth="1px" borderColor="line">
          <Backup
            saved={saved}
            onRestore={(next) => {
              updateSaved((current) => ({ ...next, lastVisit: current.lastVisit }));
              setRecapNote(null);
              setNotice({
                tone: 'success',
                text: 'Restored. The roads and progress from the backup are here now.',
              });
              toTop();
            }}
          />
        </Box>
      </Stack>
    </Columns>
  );
}
