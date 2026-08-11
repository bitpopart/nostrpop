import { useQuery } from '@tanstack/react-query';

/**
 * Image posts mirrored from the "Schedule POP posts" Buzz channel.
 * Data is produced by `scripts/poppost-sync.mjs` into public/poppost/posts.json
 * and deployed with the site. The admin scheduler imports these as drafts.
 */
export interface ChannelImage {
  src: string;
  alt?: string;
}

export interface ChannelPost {
  eventId: string;
  author?: string;
  createdAt: number;
  caption?: string;
  hashtags?: string[];
  images: ChannelImage[];
}

interface ChannelFeedData {
  generatedAt?: number;
  posts: ChannelPost[];
}

export function useChannelPosts(enabled = true) {
  return useQuery({
    queryKey: ['channel-posts'],
    enabled,
    queryFn: async ({ signal }): Promise<ChannelPost[]> => {
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
        throw new Error(`channel feed unavailable (HTTP ${res.status})`);
      }
      const data = (await res.json()) as ChannelFeedData;
      return Array.isArray(data.posts) ? data.posts : [];
    },
    staleTime: 60_000,
    refetchInterval: 120_000, // refresh every 2 min — picks up new channel posts after deploys
    retry: 1,
  });
}
