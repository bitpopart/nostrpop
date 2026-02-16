import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { nip19 } from 'nostr-tools';


const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';

// Convert npub to hex
const ADMIN_HEX = nip19.decode(ADMIN_NPUB).data as string;

export function useAdminNotes(limit: number = 10) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['admin-notes', ADMIN_HEX, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Fetch more events than needed to account for filtering out replies
      const events = await nostr.query([
        {
          kinds: [1], // Text notes
          authors: [ADMIN_HEX],
          limit: limit * 3 // Fetch 3x more to ensure we have enough after filtering
        }
      ], { signal });

      // Filter out reply notes (notes with 'e' tags indicating they're replies)
      // This ensures we only show original posts from the admin, not replies to other notes
      const nonReplyNotes = events.filter(event => {
        // Check if the event has any 'e' tags (event references)
        // Notes with 'e' tags are typically replies to other events
        const hasEventReferences = event.tags.some(tag => tag[0] === 'e');

        // Return true for notes WITHOUT event references (original posts)
        return !hasEventReferences;
      });

      // Sort by created_at descending (newest first) and limit to requested amount
      return nonReplyNotes
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit);
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
    retry: 3, // Retry failed requests up to 3 times
  });
}

export function useLatestAdminNotes(limit: number = 3) {
  return useAdminNotes(limit);
}

// Hook to fetch latest blog posts (kind 30023)
export function useLatestBlogPosts(limit: number = 3) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['latest-blog-posts', ADMIN_HEX, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      console.log('🔍 [useLatestBlogPosts] Fetching blog posts...');
      const events = await nostr.query([
        {
          kinds: [30023], // Long-form articles
          authors: [ADMIN_HEX],
          '#t': ['blog'], // Only fetch events tagged with 'blog'
          limit: limit * 2 // Fetch extra to account for filtering
        }
      ], { signal });

      console.log('📥 [useLatestBlogPosts] Received', events.length, 'events');

      // Filter out artist-page events (but keep blog posts even if they have artwork tag)
      const filteredEvents = events.filter(e => {
        const dTag = e.tags.find(t => t[0] === 'd')?.[1];
        return dTag !== 'artist-page';
      });

      console.log('✅ [useLatestBlogPosts] After filtering:', filteredEvents.length, 'blog posts');

      // Sort by published_at tag if it exists, otherwise by created_at (newest first)
      const sorted = filteredEvents
        .sort((a, b) => {
          const aPublished = a.tags.find(t => t[0] === 'published_at')?.[1];
          const bPublished = b.tags.find(t => t[0] === 'published_at')?.[1];
          
          const aDate = aPublished ? parseInt(aPublished) : a.created_at;
          const bDate = bPublished ? parseInt(bPublished) : b.created_at;
          
          return bDate - aDate; // Newest first
        })
        .slice(0, limit);

      console.log('📊 [useLatestBlogPosts] Returning', sorted.length, 'posts');
      return sorted;
    },
    staleTime: 0, // Always refetch to get latest
    refetchInterval: 120000, // Refetch every 2 minutes
    retry: 3, // Retry failed requests up to 3 times
  });
}