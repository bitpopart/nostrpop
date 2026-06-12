import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface PostEngagement {
  eventId: string;
  likes: number;
  zaps: number;
  zapAmount: number; // total sats
  reposts: number;
  replies: number;
}

/**
 * Fetch engagement metrics (reactions, zaps, reposts, replies) for a list of event IDs.
 */
export function usePostEngagement(eventIds: string[]) {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['post-engagement', eventIds],
    queryFn: async (c) => {
      if (eventIds.length === 0) return {} as Record<string, PostEngagement>;

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      const events = await nostr.query([
        {
          kinds: [7, 9735, 6, 1],
          '#e': eventIds,
          limit: 500,
        },
      ], { signal });

      const result: Record<string, PostEngagement> = {};

      // Initialize
      for (const id of eventIds) {
        result[id] = { eventId: id, likes: 0, zaps: 0, zapAmount: 0, reposts: 0, replies: 0 };
      }

      for (const event of events) {
        const eTag = event.tags.find(([name]) => name === 'e')?.[1];
        if (!eTag || !result[eTag]) continue;

        if (event.kind === 7) {
          result[eTag].likes += 1;
        } else if (event.kind === 9735) {
          result[eTag].zaps += 1;
          // Try to parse bolt11 amount from zap receipt
          try {
            const bolt11 = event.tags.find(([name]) => name === 'bolt11')?.[1];
            if (bolt11) {
              // Extract amount from bolt11 (in millisats)
              const match = bolt11.match(/lnbc(\d+)([munp]?)/i);
              if (match) {
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                let sats = 0;
                if (unit === 'm') sats = value * 100000;
                else if (unit === 'u') sats = value * 100;
                else if (unit === 'n') sats = value / 10;
                else if (unit === 'p') sats = value / 10000;
                else sats = value * 100000000; // BTC
                result[eTag].zapAmount += Math.round(sats);
              }
            }
          } catch {
            // ignore parse errors
          }
        } else if (event.kind === 6) {
          result[eTag].reposts += 1;
        } else if (event.kind === 1) {
          // Only count as reply if it has a p tag pointing to admin
          const pTag = event.tags.find(([name]) => name === 'p')?.[1];
          if (pTag === adminPubkey) {
            result[eTag].replies += 1;
          }
        }
      }

      return result;
    },
    enabled: eventIds.length > 0,
    staleTime: 60000,
    retry: 2,
  });
}

/**
 * Fetch the admin's recent Nostr posts (kind 1) to populate the analytics view.
 */
export function useAdminRecentPosts(limit = 50) {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['admin-recent-posts', limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      const events = await nostr.query([
        {
          kinds: [1],
          authors: [adminPubkey],
          limit,
        },
      ], { signal });

      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!adminPubkey,
    staleTime: 60000,
    retry: 2,
  });
}
