import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { nip19 } from 'nostr-tools';

// Kind 30762 — Gamestr standard game score event (addressable)
// See: https://gamestr.io/developers
// d-tag format: <game-id>:<player-pubkey>
// Published to both the app relay and wss://main.relay.gamestr.io

export const GAMESTR_RELAY = 'wss://main.relay.gamestr.io';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

const JACKPOT_GOAL = 2100; // sats
const JACKPOT_CUT = 0.21; // 21% goes to jackpot
const ROUND_MS = 21 * 60 * 60 * 1000; // 21 hours in ms
const MIN_SATS = 21; // minimum deposit

export interface GameScore {
  pubkey: string;
  npub: string;
  name: string;
  score: number;
  game: string;
  sats_deposited: number;
  created_at: number;
  event_id?: string;
}

export interface JackpotState {
  total: number;
  countdown_start: number | null;
  round_high: { pubkey: string; npub: string; name: string; score: number } | null;
  last_winner: { npub: string; name: string; sats: number; when: number } | null;
}

function getLocalJackpot(game: string): JackpotState {
  try {
    const raw = localStorage.getItem(`bitpopart-jackpot-${game}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { total: 0, countdown_start: null, round_high: null, last_winner: null };
}

export function setLocalJackpot(game: string, j: JackpotState): void {
  try {
    localStorage.setItem(`bitpopart-jackpot-${game}`, JSON.stringify(j));
  } catch { /* ignore */ }
}

export function resolveJackpot(j: JackpotState): JackpotState {
  if (j.total >= JACKPOT_GOAL && !j.countdown_start) {
    j = { ...j, countdown_start: Date.now(), round_high: null };
  }
  if (j.countdown_start && Date.now() > j.countdown_start + ROUND_MS) {
    const last_winner = j.round_high
      ? { npub: j.round_high.npub, name: j.round_high.name, sats: j.total, when: Date.now() }
      : null;
    j = { total: 0, countdown_start: null, round_high: null, last_winner };
  }
  return j;
}

export function addDepositToJackpot(game: string, sats: number): JackpotState {
  let j = resolveJackpot(getLocalJackpot(game));
  j = { ...j, total: j.total + Math.round(sats * JACKPOT_CUT) };
  j = resolveJackpot(j);
  setLocalJackpot(game, j);
  return j;
}

export function updateRoundHighScore(
  game: string,
  pubkey: string,
  npub: string,
  name: string,
  score: number
): void {
  let j = resolveJackpot(getLocalJackpot(game));
  if (j.countdown_start && (!j.round_high || score > j.round_high.score)) {
    j = { ...j, round_high: { pubkey, npub, name, score } };
    setLocalJackpot(game, j);
  }
}

export function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Parse a kind 30762 event into a GameScore
function parseGameScore(event: { id: string; pubkey: string; kind: number; tags: string[][]; created_at: number }): GameScore | null {
  try {
    const gameTag = event.tags.find(t => t[0] === 'game')?.[1];
    const scoreTag = event.tags.find(t => t[0] === 'score')?.[1];
    const nameTag = event.tags.find(t => t[0] === 'name')?.[1] ?? '???';
    const npubTag = event.tags.find(t => t[0] === 'npub')?.[1];
    const satsTag = event.tags.find(t => t[0] === 'sats')?.[1];
    // p tag holds player pubkey (Gamestr standard)
    const pTag = event.tags.find(t => t[0] === 'p')?.[1];

    if (!gameTag || !scoreTag) return null;

    return {
      pubkey: pTag ?? event.pubkey,
      npub: npubTag ?? nip19.npubEncode(pTag ?? event.pubkey),
      name: nameTag,
      score: parseInt(scoreTag),
      game: gameTag,
      sats_deposited: satsTag ? parseInt(satsTag) : 0,
      created_at: event.created_at,
      event_id: event.id,
    };
  } catch {
    return null;
  }
}

// Hook: publish a score to Nostr (kind 30762 — Gamestr standard)
export function usePublishGameScore() {
  const { mutateAsync, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const publishScore = async (
    game: string,
    name: string,
    score: number,
    satsDeposited: number,
    playerNpub?: string,
  ) => {
    // Decode npub to hex pubkey for the p tag
    let playerPubkey = '';
    if (playerNpub) {
      try {
        playerPubkey = nip19.decode(playerNpub).data as string;
      } catch { /* ignore */ }
    }

    const event = await mutateAsync({
      kind: 30762,
      content: `${name} scored ${score.toLocaleString()} in ${game}! ⚡`,
      tags: [
        // Gamestr standard tags
        ['d', `${game}:${playerPubkey || 'unknown'}`],
        ['game', game],
        ['score', String(score)],
        ...(playerPubkey ? [['p', playerPubkey]] : []),
        ['state', 'active'],
        ['t', 'bitcoin'],
        ['t', 'clownworld'],
        ['t', 'bitpopart'],
        // BitPopArt extensions
        ['name', name.toUpperCase().slice(0, 12)],
        ['sats', String(satsDeposited)],
        ...(playerNpub ? [['npub', playerNpub]] : []),
      ],
    });

    queryClient.invalidateQueries({ queryKey: ['game-leaderboard', game] });
    return event;
  };

  return { publishScore, isPending };
}

// Hook: fetch all-time leaderboard for a game (kind 30762)
export function useGameLeaderboard(game: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['game-leaderboard', game],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{ kinds: [30762], '#game': [game], limit: 200 }],
        { signal }
      );

      // Keep only highest score per pubkey, paid entries only
      const byPubkey = new Map<string, GameScore>();
      events.forEach((event) => {
        const parsed = parseGameScore(event);
        if (!parsed || parsed.sats_deposited === 0) return;

        const existing = byPubkey.get(parsed.pubkey);
        if (!existing || parsed.score > existing.score) {
          byPubkey.set(parsed.pubkey, parsed);
        }
      });

      return Array.from(byPubkey.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Hook: fetch jackpot state (admin posts kind 30762 with special jackpot game tag)
export function useJackpotState(game: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['game-jackpot', game],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query(
        [{ kinds: [30762], authors: [ADMIN_PUBKEY], '#game': [`jackpot-${game}`], limit: 1 }],
        { signal }
      );

      if (events.length > 0) {
        const event = events[0];
        try {
          const content = JSON.parse(event.content);
          if (typeof content.total === 'number') {
            const local = getLocalJackpot(game);
            const base: JackpotState = {
              total: Math.max(content.total, local.total),
              countdown_start: content.countdown_start ?? local.countdown_start,
              round_high: local.round_high,
              last_winner: content.last_winner ?? local.last_winner,
            };
            const resolved = resolveJackpot(base);
            setLocalJackpot(game, resolved);
            return resolved;
          }
        } catch { /* ignore */ }
      }

      const local = resolveJackpot(getLocalJackpot(game));
      setLocalJackpot(game, local);
      return local;
    },
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export { JACKPOT_GOAL, JACKPOT_CUT, ROUND_MS, MIN_SATS, ADMIN_PUBKEY };
