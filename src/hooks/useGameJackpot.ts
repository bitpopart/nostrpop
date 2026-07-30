import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { nip19 } from 'nostr-tools';

// Kind 3767 — BitPopArt Game Score / Jackpot Record
// Stored permanently on relay; queryable per game

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
  // Start countdown when goal reached
  if (j.total >= JACKPOT_GOAL && !j.countdown_start) {
    j = { ...j, countdown_start: Date.now(), round_high: null };
  }
  // Round ended: mark winner, reset
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

// Hook: fetch scores for a given game from Nostr (kind 3767)
export function useGameScores(game: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['game-scores', game],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [3767], '#g': [game], limit: 100 }],
        { signal }
      );

      const scores: GameScore[] = events
        .map((event): GameScore | null => {
          try {
            const nameTag = event.tags.find(t => t[0] === 'name')?.[1] ?? '???';
            const scoreTag = event.tags.find(t => t[0] === 'score')?.[1];
            const npubTag = event.tags.find(t => t[0] === 'npub')?.[1];
            const satsTag = event.tags.find(t => t[0] === 'sats')?.[1];
            const gameTag = event.tags.find(t => t[0] === 'g')?.[1];

            if (!scoreTag || !gameTag) return null;

            return {
              pubkey: event.pubkey,
              npub: npubTag ?? nip19.npubEncode(event.pubkey),
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
        })
        .filter((s): s is GameScore => s !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return scores;
    },
    staleTime: 60 * 1000,
  });
}

// Hook: publish a score to Nostr (kind 3767)
export function usePublishGameScore() {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const publishScore = (
    game: string,
    name: string,
    score: number,
    satsDeposited: number,
    npub?: string,
    onSuccess?: () => void
  ) => {
    createEvent(
      {
        kind: 3767,
        content: '',
        tags: [
          ['g', game],
          ['name', name.toUpperCase().slice(0, 12)],
          ['score', String(score)],
          ['sats', String(satsDeposited)],
          ['t', 'bitpopart-game'],
          ['t', game],
          ...(npub ? [['npub', npub]] : []),
          ['alt', `BitPopArt game score: ${score} points in ${game} by ${name}`],
        ],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['game-scores', game] });
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  return { publishScore, isPending };
}

// Hook: fetch all-time leaderboard for a game (from Nostr, any pubkey)
export function useGameLeaderboard(game: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['game-leaderboard', game],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(4000)]);
      const events = await nostr.query(
        [{ kinds: [3767], '#g': [game], limit: 200 }],
        { signal }
      );

      // Keep only highest score per pubkey
      const byPubkey = new Map<string, GameScore>();
      events.forEach((event) => {
        try {
          const nameTag = event.tags.find(t => t[0] === 'name')?.[1] ?? '???';
          const scoreTag = event.tags.find(t => t[0] === 'score')?.[1];
          const npubTag = event.tags.find(t => t[0] === 'npub')?.[1];
          const satsTag = event.tags.find(t => t[0] === 'sats')?.[1];
          const gameTag = event.tags.find(t => t[0] === 'g')?.[1];
          if (!scoreTag || !gameTag) return;

          const score = parseInt(scoreTag);
          const existing = byPubkey.get(event.pubkey);
          if (!existing || score > existing.score) {
            byPubkey.set(event.pubkey, {
              pubkey: event.pubkey,
              npub: npubTag ?? nip19.npubEncode(event.pubkey),
              name: nameTag,
              score,
              game: gameTag,
              sats_deposited: satsTag ? parseInt(satsTag) : 0,
              created_at: event.created_at,
              event_id: event.id,
            });
          }
        } catch { /* ignore */ }
      });

      return Array.from(byPubkey.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Hook: fetch jackpot state (admin posts kind 3767 with d=jackpot-<game>)
// For now, jackpot is local-first (localStorage) and synced via admin publishing
export function useJackpotState(game: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['game-jackpot', game],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Try to fetch admin-published jackpot state (addressable kind 33767 is unavailable,
      // so admin posts regular kind 3767 with special jackpot tag)
      const events = await nostr.query(
        [{ kinds: [3767], authors: [ADMIN_PUBKEY], '#g': [`jackpot-${game}`], limit: 1 }],
        { signal }
      );

      // If admin published a jackpot state, use it as the authoritative base
      if (events.length > 0) {
        const event = events[0];
        try {
          const content = JSON.parse(event.content);
          if (typeof content.total === 'number') {
            // Merge with local and resolve
            const local = getLocalJackpot(game);
            // Use whichever has higher total (to not go backwards if admin just reset)
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

      // Fallback: local only
      const local = resolveJackpot(getLocalJackpot(game));
      setLocalJackpot(game, local);
      return local;
    },
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });
}

export { JACKPOT_GOAL, JACKPOT_CUT, ROUND_MS, MIN_SATS, ADMIN_PUBKEY };
