import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface ZapperEntry {
  pubkey: string;
  totalSats: number;
  zapCount: number;
  latestZapAt: number;
}

export interface ReactorEntry {
  pubkey: string;
  reactionCount: number;
  latestReactionAt: number;
  latestContent: string; // emoji/reaction content
}

export interface LikeEntry {
  pubkey: string;
  createdAt: number;
  content: string;
}

export interface PopFansData {
  allTimeTopZappers: ZapperEntry[];
  latestTopZappers: ZapperEntry[];
  latestTopReactors: ReactorEntry[];
  latestLikes: LikeEntry[];
}

/**
 * Parse sats from a bolt11 lightning invoice string.
 */
function parseSatsFromBolt11(bolt11: string): number {
  try {
    const match = bolt11.match(/lnbc(\d+)([munp]?)/i);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'm') return value * 100000;
    if (unit === 'u') return value * 100;
    if (unit === 'n') return Math.round(value / 10);
    if (unit === 'p') return Math.round(value / 10000);
    return value * 100000000; // no unit = BTC
  } catch {
    return 0;
  }
}

/**
 * Extract the sender pubkey from a zap receipt (kind 9735).
 * The zap request is stored in the description tag as JSON.
 */
function extractZapSenderPubkey(event: { tags: string[][] }): string | null {
  try {
    const descTag = event.tags.find(([name]) => name === 'description')?.[1];
    if (!descTag) return null;
    const zapRequest = JSON.parse(descTag);
    return zapRequest.pubkey ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch zap receipts and reactions directed at bitpopart's posts.
 */
export function usePopFans() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery<PopFansData>({
    queryKey: ['pop-fans', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      // Fetch zap receipts (9735) and reactions (7) tagged to the admin
      const [zapEvents, reactionEvents] = await Promise.all([
        nostr.query([
          {
            kinds: [9735],
            '#p': [adminPubkey],
            limit: 500,
          },
        ], { signal }),
        nostr.query([
          {
            kinds: [7],
            '#p': [adminPubkey],
            limit: 500,
          },
        ], { signal }),
      ]);

      // ---- Process Zaps ----
      const zapperMap = new Map<string, ZapperEntry>();

      for (const event of zapEvents) {
        const senderPubkey = extractZapSenderPubkey(event);
        if (!senderPubkey) continue;
        // Don't count self-zaps
        if (senderPubkey === adminPubkey) continue;

        const bolt11 = event.tags.find(([name]) => name === 'bolt11')?.[1] ?? '';
        const sats = parseSatsFromBolt11(bolt11);

        const existing = zapperMap.get(senderPubkey);
        if (existing) {
          existing.totalSats += sats;
          existing.zapCount += 1;
          if (event.created_at > existing.latestZapAt) {
            existing.latestZapAt = event.created_at;
          }
        } else {
          zapperMap.set(senderPubkey, {
            pubkey: senderPubkey,
            totalSats: sats,
            zapCount: 1,
            latestZapAt: event.created_at,
          });
        }
      }

      const allZappers = Array.from(zapperMap.values());

      // All-time top 10: sorted by total sats DESC
      const allTimeTopZappers = [...allZappers]
        .sort((a, b) => b.totalSats - a.totalSats || b.zapCount - a.zapCount)
        .slice(0, 10);

      // Latest top 5: sorted by most recent zap first
      const latestTopZappers = [...allZappers]
        .sort((a, b) => b.latestZapAt - a.latestZapAt)
        .slice(0, 5);

      // ---- Process Reactions ----
      const reactorMap = new Map<string, ReactorEntry>();

      for (const event of reactionEvents) {
        if (event.pubkey === adminPubkey) continue;

        const existing = reactorMap.get(event.pubkey);
        if (existing) {
          existing.reactionCount += 1;
          if (event.created_at > existing.latestReactionAt) {
            existing.latestReactionAt = event.created_at;
            existing.latestContent = event.content;
          }
        } else {
          reactorMap.set(event.pubkey, {
            pubkey: event.pubkey,
            reactionCount: 1,
            latestReactionAt: event.created_at,
            latestContent: event.content,
          });
        }
      }

      // Latest top 5 reactors: sorted by most recent reaction
      const latestTopReactors = Array.from(reactorMap.values())
        .sort((a, b) => b.latestReactionAt - a.latestReactionAt)
        .slice(0, 5);

      // ---- Latest Likes ('+' reactions only) ----
      const latestLikes: LikeEntry[] = reactionEvents
        .filter((e) => (e.content === '+' || e.content === '❤️' || e.content === '👍' || e.content === '🤙') && e.pubkey !== adminPubkey)
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 20)
        .map((e) => ({
          pubkey: e.pubkey,
          createdAt: e.created_at,
          content: e.content,
        }));

      return {
        allTimeTopZappers,
        latestTopZappers,
        latestTopReactors,
        latestLikes,
      };
    },
    enabled: !!adminPubkey,
    staleTime: 120000,
    retry: 2,
  });
}
