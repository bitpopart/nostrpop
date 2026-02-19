import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook to fetch Nostr posts with #bitpopart hashtag
 */
export function useBitPopArtPosts() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['bitpopart-posts'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Query for kind 1 notes with #bitpopart tag
      const events = await nostr.query(
        [{
          kinds: [1],
          '#t': ['bitpopart'],
          limit: 100,
        }],
        { signal }
      );

      // Sort by created_at descending (newest first)
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useFeaturedBitPopArtPosts() {
  const { data: allPosts } = useBitPopArtPosts();
  
  return useQuery({
    queryKey: ['featured-bitpopart-posts'],
    queryFn: () => {
      // Get featured posts from localStorage
      const stored = localStorage.getItem('featured-bitpopart-posts');
      if (!stored) return [];
      
      try {
        const featuredIds: string[] = JSON.parse(stored);
        if (!allPosts) return [];
        
        // Filter and return only posts that are in the featured list
        // Maintain the order from the featured list
        return featuredIds
          .map(id => allPosts.find(post => post.id === id))
          .filter((post): post is NostrEvent => post !== undefined);
      } catch {
        return [];
      }
    },
    enabled: !!allPosts,
    staleTime: Infinity, // Don't refetch, rely on localStorage
  });
}
