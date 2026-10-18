'use client';

import { Box, chakra, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import type { Road } from '@/lib/road/schema';
import { lastReset, RESETS, type Region } from '@/lib/walk/reset';
import { position, stageView, type Mark, type Marks } from '@/lib/walk/walk';
import { localTime, n, stepCount } from '@/lib/walk/words';
import { Camp } from './camp';
import { StageStrip } from './stage-strip';
import { TickRow } from './tick-row';

const display = { fontFamily: 'display', fontWeight: '600' } as const;

function RegionSelect({ region, onChange }: { region: Region; onChange: (r: Region) => void }) {
  return (
    <chakra.label display="inline-flex" alignItems="center" gap="8px">
      resets
      <chakra.select
        value={region}
        onChange={(event) => onChange(event.target.value as Region)}
        bg="background"
        color="text"
        borderWidth="1px"
        borderColor="lineStrong"
        borderRadius="2px"
        px="6px"
        py="2px"
        fontSize="0.9375rem"
        cursor="pointer"
        _focusVisible={{ outline: '2px solid {colors.text}', outlineOffset: '3px' }}
      >
        <option value="eu">EU, Wednesday</option>
        <option value="us">US, Tuesday</option>
      </chakra.select>
    </chakra.label>
  );
}

// One road: its name, where the player stands, and the next three steps of the current stage,
// or camp while the next stage waits for the reset, or the end of the road.
export function RoadView({
  road,
  marks,
  region,
  now,
  celebrate,
  onMark,
  onRegion,
}: {
  road: Road;
  marks: Marks;
  region: Region;
  now: number;
  celebrate: string | null;
  onMark: (stepId: string, state: Mark['state'] | null) => void;
  onRegion: (region: Region) => void;
}) {
  const where = position(road, marks, region, now);
  const count = road.stages.length;
  const stageIndex = where.kind === 'complete' ? count - 1 : where.stage;
  const stage = road.stages[stageIndex]!;
  const view = stageView(stage, marks, lastReset(now, region));
  const done =
    where.kind === 'walking' ? where.stage : where.kind === 'camp' ? where.stage + 1 : count;

  return (
    <Box>
      <Flex justify="space-between" align="flex-end" wrap="wrap" gap="12px 16px">
        <Box minW="0">
          <Heading
            as="h1"
            {...display}
            fontSize={{ base: '2rem', md: '2.5rem' }}
            lineHeight="1.05"
            overflowWrap="anywhere"
          >
            {road.title}
          </Heading>
          <Text mt="6px" fontSize="1.1875rem">
            {where.kind === 'complete' ? (
              'Road complete.'
            ) : (
              <>
                Stage {stageIndex + 1} of {count}:{' '}
                <chakra.span {...display} fontSize="1.3rem">
                  {stage.name}
                </chakra.span>
              </>
            )}
          </Text>
        </Box>
        <Stack
          gap="2px"
          fontSize="0.9375rem"
          color="textMuted"
          textAlign={{ base: 'left', md: 'right' }}
        >
          <Text>
            by {road.author}, {road.pace === 'weekly' ? 'weekly pace' : 'free pace'}
          </Text>
          <RegionSelect region={region} onChange={onRegion} />
        </Stack>
      </Flex>

      <StageStrip
        count={count}
        done={done}
        current={where.kind === 'walking' ? where.stage : null}
      />

      {where.kind !== 'complete' && view.rows.length > 0 && (
        <chakra.ul listStyleType="none" m="0" p="0" mt="26px" display="grid" gap="8px">
          {view.rows.map((row) => (
            <TickRow
              key={row.step.id}
              row={row}
              celebrate={celebrate === row.step.id}
              onTick={() => onMark(row.step.id, row.mark?.state === 'done' ? null : 'done')}
              onSkip={() => onMark(row.step.id, row.mark?.state === 'skipped' ? null : 'skipped')}
            />
          ))}
        </chakra.ul>
      )}

      {where.kind === 'walking' && (view.fogged > 0 || view.earlier > 0) && (
        <Stack gap="2px" mt="14px" fontSize="1rem" color="textMuted">
          {view.fogged > 0 && (
            <Text>
              {view.fogged === 1 ? 'One more step' : `${n(view.fogged)} more steps`} in this stage,
              still in the fog.
            </Text>
          )}
          {view.earlier > 0 && (
            <Text>
              {view.earlier === 1 ? 'One step' : `${n(view.earlier)} steps`} of this stage done in
              earlier weeks.
            </Text>
          )}
        </Stack>
      )}

      {where.kind === 'camp' && (
        <Camp title="Make camp.">
          <Text mt="6px" fontSize="1.0625rem">
            The road opens on {RESETS[region].day}, at the {RESETS[region].name} reset.
          </Text>
          <Text mt="6px" fontSize="0.9375rem" color="textMuted">
            Stage {where.stage + 2}, {road.stages[where.stage + 1]?.name}:{' '}
            {stepCount(road.stages[where.stage + 1]?.steps.length ?? 0)} waiting.{' '}
            {localTime(where.opensAt)}, your time.
          </Text>
        </Camp>
      )}

      {where.kind === 'complete' && (
        <Camp title="You walked the whole road.">
          <Text mt="6px" fontSize="1.0625rem">
            {count === 1 ? 'Its one stage' : count === 2 ? 'Both stages' : `All ${n(count)} stages`}{' '}
            of {road.title}, done.
          </Text>
          <Text mt="6px" fontSize="0.9375rem" color="textMuted">
            Pick your next road: paste its code below.
          </Text>
        </Camp>
      )}
    </Box>
  );
}
