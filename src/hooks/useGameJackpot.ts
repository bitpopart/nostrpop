import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { nip19 } from 'nostr-tools';

// Kind 30762 — Gamestr standard game score event (addressable)
// See: https://gamestr.io/developers
// d-tag format: <game-id>:<player-pubkey>
// Scores are published to the app's write relays (Ditto/Dreamith included)
// and read back from the app's read relays — one game id per game, everywhere.

export const GAMESTR_RELAY = 'wss://main.relay.gamestr.io';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

export const JACKPOT_GOAL = 2100; // sats
export const JACKPOT_CUT = 0.21; // 21% of every deposit feeds the jackpot
export const ROUND_MS = 21 * 60 * 60 * 1000; // 21 hours in ms
export const MIN_SATS = 21; // minimum deposit

export interface GameScore {
  pubkey: string;
  npub: string;
  name: string;
  score: number;
  game: string;
  sats_deposited: number;
  /** true when the score event carries a paid deposit (sats tag > 0) */
  paid: boolean;
  created_at: number;
  event_id?: string;
}

export interface JackpotState {
  /** Shared pot in sats — derived from paid score events on Nostr (+ admin snapshot). */
  total: number;
  /** Epoch **ms** when the 21h battle started (null until the pot reaches the goal). */
  countdown_start: number | null;
  round_high: { pubkey: string; npub: string; name: string; score: number } | null;
  last_winner: { npub: string; name: string; sats: number; when: number } | null;
}

const EMPTY_JACKPOT: JackpotState = { total: 0, countdown_start: null, round_high: null, last_winner: null };

function getLastWinnerCache(game: string): JackpotState['last_winner'] {
  try {
    const raw = localStorage.getItem(`bitpopart-jackpot-lastwinner-${game}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

// Parse a kind 30762 event into a GameScore
function parseGameScore(event: { id: string; pubkey: string; kind: number; tags: string[][]; created_at: number }): GameScore | null {
  try {
    const gameTag = event.tags.find(t => t[0] === 'game')?.[1];
    const scoreTag = event.tags.find(t => t[0] === 'score')?.[1];
    if (!gameTag || !scoreTag) return null;

    const nameTag = event.tags.find(t => t[0] === 'name')?.[1] ?? '???';
    const npubTag = event.tags.find(t => t[0] === 'npub')?.[1];
    const satsTag = event.tags.find(t => t[0] === 'sats')?.[1];
    // p tag holds player pubkey (Gamestr standard)
    const pTag = event.tags.find(t => t[0] === 'p')?.[1];
    const pubkey = pTag ?? event.pubkey;
    const sats = satsTag ? parseInt(satsTag) : 0;

    return {
      pubkey,
      npub: npubTag ?? nip19.npubEncode(pubkey),
      name: nameTag,
      score: parseInt(scoreTag),
      game: gameTag,
      sats_deposited: Number.isFinite(sats) && sats > 0 ? sats : 0,
      paid: Number.isFinite(sats) && sats > 0,
      created_at: event.created_at,
      event_id: event.id,
    };
  } catch {
    return null;
  }
}

// Fetch the raw kind 30762 events for a game from the app's read relays
async function fetchGameScoreEvents(
  nostr: { query: (filters: unknown[], opts?: { signal?: AbortSignal }) => Promise<Array<{ id: string; pubkey: string; kind: number; tags: string[][]; created_at: number }>> },
  game: string,
  signal?: AbortSignal,
) {
  const events = await nostr.query(
    [{ kinds: [30762], '#game': [game], limit: 300 }],
    { signal }
  );
  const parsed: GameScore[] = [];
  for (const e of events) {
    const p = parseGameScore(e);
    if (p) parsed.push(p);
  }
  return parsed;
}

/**
 * Derive the SHARED jackpot state from paid score events on Nostr.
 * Counts each player's latest paid entry (21% of their deposit), arms the
 * 21h battle when the pot reaches the goal, resolves the winner when the
 * window closes, and rolls the remainder into the next round.
 * Deterministic — every visitor computes the same numbers from the same events.
 */
interface JackpotDerivation {
  total: number;
  countdown_start: number | null;
  round_high: JackpotState['round_high'];
  last_winner: JackpotState['last_winner'];
}

function cutOf(e: GameScore): number {
  return Math.round(e.sats_deposited * JACKPOT_CUT);
}

function bestScoreInWindow(events: GameScore[], startMs: number, endMs: number): GameScore | undefined {
  return events
    .filter(e => e.paid && e.created_at * 1000 >= startMs && e.created_at * 1000 <= endMs)
    .sort((a, b) => b.score - a.score)[0];
}

function solveRound(deposits: GameScore[], events: GameScore[], base: number): JackpotDerivation {
  const now = Date.now();

  // Find when the pot crosses the goal (21% per latest paid entry per player).
  let total = base;
  let start: number | null = null;
  let potAtStart = base;
  for (const d of deposits) {
    total += cutOf(d);
    if (start === null && total >= JACKPOT_GOAL) {
      start = d.created_at * 1000;
      potAtStart = total;
    }
  }

  if (start === null) {
    return { total, countdown_start: null, round_high: null, last_winner: null };
  }

  const end = start + ROUND_MS;
  if (now <= end) {
    // Round is LIVE — pot keeps growing; someone is leading.
    const leader = bestScoreInWindow(events, start, end);
    return {
      total,
      countdown_start: start,
      round_high: leader ? { pubkey: leader.pubkey, npub: leader.npub, name: leader.name, score: leader.score } : null,
      last_winner: null,
    };
  }

  // Round CONCLUDED — the high score in the window wins the pot.
  const winner = bestScoreInWindow(events, start, end);
  const potAtEnd = potAtStart + deposits
    .filter(d => d.created_at * 1000 > start && d.created_at * 1000 <= end)
    .reduce((sum, d) => sum + cutOf(d), 0);

  const remainder = deposits.filter(d => d.created_at * 1000 > end);
  const next = solveRound(remainder, events, base);
  return {
    ...next,
    last_winner: next.last_winner ?? (winner
      ? { npub: winner.npub, name: winner.name, sats: potAtEnd, when: end }
      : null),
  };
}

export function deriveJackpot(events: GameScore[], trustedBase = 0, game = ''): JackpotState {
  // Deposit math: each player's most recent paid entry counts once.
  const byPubkey = new Map<string, GameScore>();
  for (const e of events) {
    if (e.sats_deposited <= 0) continue;
    const existing = byPubkey.get(e.pubkey);
    if (!existing || e.created_at > existing.created_at) byPubkey.set(e.pubkey, e);
  }
  const deposits = [...byPubkey.values()].sort((a, b) => a.created_at - b.created_at);

  const solved = solveRound(deposits, events, Math.max(0, Math.floor(trustedBase)));
  const last_winner = solved.last_winner ?? getLastWinnerCache(game);
  if (solved.last_winner && game) {
    try {
      localStorage.setItem(`bitpopart-jackpot-lastwinner-${game}`, JSON.stringify(solved.last_winner));
    } catch { /* ignore */ }
  }
  return {
    total: solved.total,
    countdown_start: solved.countdown_start,
    round_high: solved.round_high,
    last_winner,
  };
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
      created_at: Math.floor(Date.now() / 1000),
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
        // BitPopArt extensions — the leaderboard + jackpot read these
        ['name', name.toUpperCase().slice(0, 12)],
        ['sats', String(satsDeposited)],
        ['paid', satsDeposited > 0 ? 'true' : 'false'],
        ...(playerNpub ? [['npub', playerNpub]] : []),
      ],
    });

    queryClient.invalidateQueries({ queryKey: ['game-leaderboard', game] });
    queryClient.invalidateQueries({ queryKey: ['game-jackpot', game] });
    return event;
  };

  return { publishScore, isPending };
}

// Hook: fetch the leaderboard for a game (kind 30762) — free AND paid entries.
// Paid entries carry their deposit; free entries are flagged paid=false so the
// board no longer silently drops players who haven't deposited.
export function useGameLeaderboard(game: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['game-leaderboard', game],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await fetchGameScoreEvents(nostr, game, signal);

      // Keep only the highest score per pubkey
      const byPubkey = new Map<string, GameScore>();
      events.forEach((parsed) => {
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

// Hook: fetch the shared jackpot state for a game.
// Source of truth = paid score events on the read relays (see deriveJackpot).
// An admin-published snapshot (kind 30762, #game: "jackpot-<game>") is honored
// as a trusted base/override — e.g. to seed the pot manually.
export function useJackpotState(game: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['game-jackpot', game],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const [events, adminEvents] = await Promise.all([
        fetchGameScoreEvents(nostr, game, signal),
        nostr.query(
          [{ kinds: [30762], authors: [ADMIN_PUBKEY], '#game': [`jackpot-${game}`], limit: 1 }],
          { signal }
        ),
      ]);

      let trustedBase = 0;
      let state = deriveJackpot(events, trustedBase, game);

      const admin = adminEvents[0];
      if (admin) {
        try {
          const content = JSON.parse(admin.content);
          if (typeof content.total === 'number') {
            trustedBase = Math.max(0, Math.floor(content.total));
            state = deriveJackpot(events, trustedBase, game);
            if (typeof content.countdown_start === 'number') {
              state = { ...state, countdown_start: content.countdown_start };
            }
            if (content.last_winner) {
              state = { ...state, last_winner: content.last_winner };
            }
          }
        } catch { /* malformed admin event — ignore, keep derived state */ }
      }

      return state;
    },
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });
}

// Kept for legacy callers: normalizes a JackpotState (no source-of-truth logic anymore)
export function resolveJackpot(j: JackpotState): JackpotState {
  return j && typeof j.total === 'number' ? j : EMPTY_JACKPOT;
}

export function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export { ADMIN_PUBKEY };
