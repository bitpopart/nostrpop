import { useQuery } from '@tanstack/react-query';

/**
 * Feed of POP posts mirrored from the "Schedule POP posts" Buzz channel.
 * Data is produced by `scripts/poppost-sync.mjs` into public/poppost/posts.json
 * and deployed with the site (GitHub Pages).
 */
export interface PoppostImage {
  src: string;
  alt?: string;
}

export interface PoppostEntry {
  eventId: string;
  author?: string;
  createdAt: number;
  caption?: string;
  hashtags?: string[];
  images: PoppostImage[];
}

interface PoppostFeedData {
  generatedAt?: number;
  posts: PoppostEntry[];
}

export function usePoppostFeed(enabled = true) {
  return useQuery({
    queryKey: ['poppost-feed'],
    enabled,
    queryFn: async ({ signal }): Promise<PoppostEntry[]> => {
      // ts=<now> busts any stale cache after a deploy
      const res = await fetch(`/poppost/posts.json?ts=${Date.now()}`, {
        signal,
        cache: 'no-store',
      });
      if (res.status === 404) {
        // no feed published yet — treat as empty
        return [];
      }
      if (!res.ok) {
        throw new Error(`poppost feed unavailable (HTTP ${res.status})`);
      }
      const data = (await res.json()) as PoppostFeedData;
      return Array.isArray(data.posts) ? data.posts : [];
    },
    staleTime: 60_000,
    refetchInterval: 120_000, // refresh every 2 min — picks up new channel posts after deploys
    retry: 1,
  });
}
