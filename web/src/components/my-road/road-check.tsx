'use client';

import { Box, chakra, Flex, Stack, Text } from '@chakra-ui/react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { secondaryButton } from '@/components/buttons';
import { Message } from '@/components/message';
import { SideSection } from '@/components/page';
import { useBlizzard } from '@/components/use-blizzard';
import {
  CHECK_MESSAGES,
  checkReplySchema,
  realmsReplySchema,
  type CheckReply,
} from '@/lib/check/api';
import { kindsFor, planTicks, type TickPlan } from '@/lib/check/check';
import type { Road } from '@/lib/road/schema';
import { REGIONS, RESETS, type Region } from '@/lib/walk/reset';
import type { Marks } from '@/lib/walk/walk';
import { list, n } from '@/lib/walk/words';
import { codeInput } from './paste-road';

// Road Check on My road (design doc, version 1.1): the player names their character, Blizzard's
// profile data says which steps are done, and one click ticks them, by the import and unlock rule
// (lib/check/check.ts). It shows only when the server has a Blizzard client, and remembers the
// character in this browser.

const KEY = 'slow-road:character';
type Saved = { region: Region; realm: string; name: string };

function load(region: Region): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as Partial<Saved>) : {};
    return {
      region: REGIONS.includes(data.region as Region) ? (data.region as Region) : region,
      realm: typeof data.realm === 'string' ? data.realm : '',
      name: typeof data.name === 'string' ? data.name : '',
    };
  } catch {
    return { region, realm: '', name: '' };
  }
}

function store(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Without storage the character is typed again next time.
  }
}

const field = {
  ...codeInput,
  fontFamily: 'body',
  fontSize: '1rem',
} as const;

type Result = { reply: Extract<CheckReply, { ok: true }>; plan: TickPlan; labels: string[] };

type Props = {
  road: Road;
  marks: Marks;
  region: Region;
  onTicks: (ticks: TickPlan['ticks']) => void;
};

export function RoadCheckSection(props: Props) {
  const enabled = useBlizzard();
  if (!enabled) return null;
  return (
    <SideSection title="Check my character">
      <RoadCheck {...props} />
    </SideSection>
  );
}

function RoadCheck({ road, marks, region, onTicks }: Props) {
  const id = useId();
  const [form, setForm] = useState<Saved | null>(null);
  const [realms, setRealms] = useState<{ name: string; slug: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => setForm(load(region)), [region]);
  // A result belongs to the road it was checked against.
  useEffect(() => setResult(null), [road.id, road.rev]);

  if (!form) return null;
  const current = form;

  function loadRealms(which: Region) {
    fetch(`/api/realms?region=${which}`)
      .then((response) => response.json())
      .then((data: unknown) => {
        const parsed = realmsReplySchema.safeParse(data);
        if (parsed.success) setRealms(parsed.data.realms);
      })
      .catch(() => undefined);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    store(current);
    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, kinds: kindsFor(road) }),
      });
      const parsed = checkReplySchema.safeParse(await response.json());
      if (!parsed.success) setError(CHECK_MESSAGES.busy);
      else if (!parsed.data.ok) setError(CHECK_MESSAGES[parsed.data.error]);
      else {
        const plan = planTicks(road, marks, parsed.data.facts, region, Date.now());
        const byId = new Map(road.stages.flatMap((stage) => stage.steps).map((s) => [s.id, s]));
        const labels = plan.ticks.map((tick) => byId.get(tick.stepId)?.label ?? tick.stepId);
        setResult({ reply: parsed.data, plan, labels });
      }
    } catch {
      setError(CHECK_MESSAGES.busy);
    } finally {
      setBusy(false);
    }
  }

  const set = (change: Partial<Saved>) => setForm({ ...current, ...change });

  return (
    <Stack gap="16px">
      <Text color="textMuted">
        Blizzard&apos;s data shows which steps your character has done. Nothing is stored.
      </Text>
      <chakra.form onSubmit={submit} display="grid" gap="12px">
        <Flex gap="10px">
          <chakra.select
            aria-label="Region"
            value={current.region}
            onChange={(event) => set({ region: event.target.value as Region })}
            css={field}
            w="96px"
            flex="none"
          >
            {REGIONS.map((each) => (
              <option key={each} value={each}>
                {RESETS[each].name}
              </option>
            ))}
          </chakra.select>
          <chakra.input
            aria-label="Realm"
            placeholder="Realm"
            value={current.realm}
            list={`${id}-realms`}
            onFocus={() => realms.length === 0 && loadRealms(current.region)}
            onChange={(event) => set({ realm: event.target.value })}
            autoComplete="off"
            css={field}
          />
          <datalist id={`${id}-realms`}>
            {realms.map((realm) => (
              <option key={realm.slug} value={realm.name} />
            ))}
          </datalist>
        </Flex>
        <chakra.input
          aria-label="Character name"
          placeholder="Character name"
          value={current.name}
          onChange={(event) => set({ name: event.target.value })}
          autoComplete="off"
          spellCheck={false}
          css={field}
        />
        <Box>
          <chakra.button
            type="submit"
            css={secondaryButton}
            disabled={busy || current.realm.trim() === '' || current.name.trim() === ''}
            _disabled={{ opacity: 0.5, cursor: 'not-allowed' }}
          >
            {busy ? 'Checking...' : 'Check my character'}
          </chakra.button>
        </Box>
      </chakra.form>

      {error && <Message tone="error">{error}</Message>}

      {result && (
        <Stack gap="12px" animation="arrive 250ms ease-out">
          <Text fontSize="0.9375rem" color="textMuted">
            {result.reply.character.name} on {result.reply.character.realm}
            {result.reply.character.level !== null && `, level ${result.reply.character.level}`}.
            Data as of the last logout.
          </Text>
          {result.plan.ticks.length > 0 ? (
            <Message tone="success">
              <Text>
                The game says {result.plan.ticks.length === 1 ? 'this is' : 'these are'} done:{' '}
                {list(result.labels)}.
              </Text>
              <Box mt="12px">
                <chakra.button
                  type="button"
                  css={secondaryButton}
                  onClick={() => {
                    onTicks(result.plan.ticks);
                    setResult(null);
                  }}
                >
                  Tick{' '}
                  {result.plan.ticks.length === 1 ? 'it' : `all ${n(result.plan.ticks.length)}`}
                </chakra.button>
              </Box>
            </Message>
          ) : (
            <Message tone="info">Nothing new to tick on this road yet.</Message>
          )}
          {result.plan.later > 0 && (
            <Text fontSize="0.9375rem" color="textMuted">
              {result.plan.later === 1 ? 'One step' : `${n(result.plan.later)} steps`} further on
              {result.plan.later === 1 ? ' is' : ' are'} done already. Check again when their stage
              opens.
            </Text>
          )}
          <Text fontSize="0.9375rem" color="textMuted">
            The Great Vault, currencies, Solo Shuffle and Blitz ratings and hand steps are yours to
            tick in game.
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
