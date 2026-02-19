import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

interface CardData {
  id: string;
  title: string;
  description: string;
  category: string;
  images?: string[];
  created_at: string;
  event: NostrEvent;
}

// Card event kind - check what kind is used for cards in this project
const CARD_KIND = 30402; // Using NIP-99 classified listings for cards

export function useLatestCards(limit: number = 3, options?: { enabled?: boolean }) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['latest-cards', limit],
    enabled: options?.enabled !== false,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      const events = await nostr.query([
        {
          kinds: [CARD_KIND],
          '#t': ['ecard'], // Filter for ecard-tagged events
          limit: 50 // Get enough events to filter from
        }
      ], { signal });

      // Process events similar to CardList
      const processedCards = events
        .map(event => {
          try {
            const content = JSON.parse(event.content);
            const dTag = event.tags.find(([name]) => name === 'd')?.[1];
            const titleTag = event.tags.find(([name]) => name === 'title')?.[1];

            // Basic validation
            if (!dTag || !titleTag || !content.title || !content.category) {
              return null;
            }

            return {
              id: dTag,
              event,
              ...content
            } as CardData;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as CardData[];

      // Sort by created_at descending (newest first) and limit
      return processedCards
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

