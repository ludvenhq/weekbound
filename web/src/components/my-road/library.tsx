'use client';

import { Box, chakra, Flex, Stack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { secondaryButton, textButton } from '@/components/buttons';
import { CodeBox } from '@/components/code-box';
import { Fold } from '@/components/fold';
import { Message } from '@/components/message';
import { BACKUP_MESSAGES, decodeBackup, encodeBackup } from '@/lib/walk/backup';
import type { Region } from '@/lib/walk/reset';
import { marksOf, type Saved } from '@/lib/walk/saved';
import { position } from '@/lib/walk/walk';
import { CodeField } from './paste-road';

export function YourRoads({
  saved,
  region,
  now,
  onWalk,
  onRemove,
}: {
  saved: Saved;
  region: Region;
  now: number;
  onWalk: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Fold summary={`Your roads (${saved.library.length})`}>
      <chakra.ul listStyleType="none" m="0" p="0" display="grid" gap="8px">
        {saved.library.map((road) => {
          const where = position(road, marksOf(saved, road.id), region, now);
          const status =
            where.kind === 'complete'
              ? 'complete'
              : where.kind === 'camp'
                ? `camp after stage ${where.stage + 1}`
                : `stage ${where.stage + 1} of ${road.stages.length}`;
          const active = road.id === saved.active;
          return (
            <Flex
              as="li"
              key={road.id}
              justify="space-between"
              align="center"
              wrap="wrap"
              gap="8px 20px"
              px="16px"
              py="12px"
              bg="surface"
              borderWidth="1px"
              borderColor="line"
            >
              <Box minW="0">
                <Text fontFamily="display" fontWeight="600" fontSize="1.375rem" lineHeight="1.15">
                  {road.title}
                </Text>
                <Text fontSize="0.9375rem" color="textMuted">
                  by {road.author}, version {road.rev}, {status}
                  {active && ', your road now'}
                </Text>
              </Box>
              <Flex gap="18px" fontSize="1rem">
                {!active && (
                  <chakra.button type="button" css={textButton} onClick={() => onWalk(road.id)}>
                    Walk this road
                  </chakra.button>
                )}
                <chakra.button
                  type="button"
                  css={textButton}
                  color="textMuted"
                  onClick={() => onRemove(road.id)}
                >
                  Remove
                </chakra.button>
              </Flex>
            </Flex>
          );
        })}
      </chakra.ul>
    </Fold>
  );
}

// The backup code for this browser, and the box that restores one from another browser.
export function Backup({ saved, onRestore }: { saved: Saved; onRestore: (next: Saved) => void }) {
  const [pending, setPending] = useState<Saved | null>(null);
  const hasRoads = saved.library.length > 0;
  const encoded = hasRoads ? encodeBackup(saved) : null;

  return (
    <Fold
      summary={
        hasRoads
          ? 'Backup code: move your progress to another browser'
          : 'Restore from a backup code'
      }
    >
      <Stack gap="16px">
        <Message tone="info">
          Your progress lives in this browser only. A backup code moves it to another one.
        </Message>
        {encoded?.ok && <CodeBox code={encoded.code} label="Your backup code" />}
        {encoded && !encoded.ok && (
          <Message tone="warning">Your roads are too big for one backup code.</Message>
        )}
        {pending ? (
          <Message tone="warning">
            <Text>
              This replaces the roads and progress in this browser with the backup&apos;s.
            </Text>
            <Flex mt="12px" gap="18px" align="center" wrap="wrap">
              <chakra.button
                type="button"
                css={secondaryButton}
                onClick={() => {
                  onRestore(pending);
                  setPending(null);
                }}
              >
                Replace with the backup
              </chakra.button>
              <chakra.button type="button" css={textButton} onClick={() => setPending(null)}>
                Cancel
              </chakra.button>
            </Flex>
          </Message>
        ) : (
          <CodeField
            label="Paste a backup code"
            placeholder="SRB1!..."
            action="Restore"
            primary={false}
            check={(code) => {
              const result = decodeBackup(code);
              if (!result.ok) return BACKUP_MESSAGES[result.error];
              if (hasRoads) setPending(result.saved);
              else onRestore(result.saved);
              return null;
            }}
          />
        )}
      </Stack>
    </Fold>
  );
}
