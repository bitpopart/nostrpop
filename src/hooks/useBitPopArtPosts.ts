import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_HEX = nip19.decode(ADMIN_NPUB).data as string;

/**
 * Hook to fetch Nostr posts with #bitpopart hashtag from admin only
 */
export function useBitPopArtPosts() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['bitpopart-posts'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Query for all kind 1 notes from admin pubkey
      // We'll filter by hashtag in JavaScript to handle case variations
      const events = await nostr.query(
        [{
          kinds: [1],
          authors: [ADMIN_HEX],
          limit: 200,
        }],
        { signal }
      );

      console.log(`[BitPopArt] Fetched ${events.length} total posts from admin`);

      // Filter for posts with #bitpopart tag (case-insensitive)
      // Check both in tags and in content
      const filteredEvents = events.filter(event => {
        // Check tags
        const tags = event.tags.filter(tag => tag[0] === 't');
        const hasTagMatch = tags.some(tag => 
          tag[1]?.toLowerCase() === 'bitpopart'
        );
        
        // Also check content for #bitpopart (case-insensitive)
        const hasContentMatch = event.content.toLowerCase().includes('#bitpopart');
        
        return hasTagMatch || hasContentMatch;
      });

      console.log(`[BitPopArt] Found ${filteredEvents.length} posts with #bitpopart`);
      
      // Log details of found posts
      filteredEvents.forEach(event => {
        const tags = event.tags.filter(tag => tag[0] === 't').map(tag => tag[1]);
        console.log(`[BitPopArt] Post ${event.id.substring(0, 8)}... tags:`, tags, 'has #bitpopart in content:', event.content.toLowerCase().includes('#bitpopart'));
      });

      // Sort by created_at descending (newest first)
      return filteredEvents.sort((a, b) => b.created_at - a.created_at);
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
      if (!allPosts) return [];
      
      // Get selected posts from localStorage
      const stored = localStorage.getItem('featured-bitpopart-posts');
      
      // If nothing in localStorage, show ALL posts (default behavior)
      if (!stored) {
        console.log('[BitPopArt] No selections saved, showing all posts');
        return allPosts;
      }
      
      try {
        const selectedIds: string[] = JSON.parse(stored);
        
        // If localStorage exists but is empty array, respect that (show nothing)
        // Otherwise filter by selected IDs
        const filteredPosts = allPosts.filter(post => selectedIds.includes(post.id));
        console.log(`[BitPopArt] Showing ${filteredPosts.length} selected posts`);
        return filteredPosts;
      } catch {
        // If parsing fails, show all posts
        console.log('[BitPopArt] Error parsing selections, showing all posts');
        return allPosts;
      }
    },
    enabled: !!allPosts,
    staleTime: Infinity, // Don't refetch, rely on localStorage
  });
}
