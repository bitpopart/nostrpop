import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrProjectData, NostrProjectParticipant } from '@/lib/nostrProjectTypes';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const ADMIN_PUBKEY = getAdminPubkeyHex();

/**
 * Fetch all active Nostr projects
 */
export function useNostrProjects() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr-projects'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38171], authors: [ADMIN_PUBKEY], limit: 50 }],
        { signal }
      );

      console.log(`[useNostrProjects] Fetched ${events.length} events from relay`);
      console.log('[useNostrProjects] Raw events:', events.map(e => ({
        id: e.id.substring(0, 8),
        dTag: e.tags.find(t => t[0] === 'd')?.[1],
        title: e.tags.find(t => t[0] === 'title')?.[1],
        created_at: e.created_at,
        tags: e.tags.length
      })));

      // Group by title to find duplicate projects (created multiple times with different d-tags)
      const titleGroups = events.reduce((acc, event) => {
        const title = event.tags.find(t => t[0] === 'title')?.[1];
        if (!title) return acc;
        
        if (!acc[title]) {
          acc[title] = [];
        }
        acc[title].push(event);
        return acc;
      }, {} as Record<string, typeof events>);

      // For each title group, keep only the newest event
      const deduplicatedEvents = Object.values(titleGroups).flatMap(group => {
        if (group.length === 1) return group;
        
        // Sort by created_at descending (newest first)
        const sorted = group.sort((a, b) => b.created_at - a.created_at);
        const newest = sorted[0];
        const title = newest.tags.find(t => t[0] === 'title')?.[1];
        
        console.log(`[useNostrProjects] Found ${group.length} versions of "${title}", keeping newest (${newest.tags.find(t => t[0] === 'd')?.[1]?.substring(0, 8)}...)`);
        
        return [newest];
      });

      console.log(`[useNostrProjects] After deduplication: ${deduplicatedEvents.length} events (from ${events.length} total)`);

      const projects: NostrProjectData[] = deduplicatedEvents
        .map((event): NostrProjectData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const title = event.tags.find(t => t[0] === 'title')?.[1];
            const status = event.tags.find(t => t[0] === 'status')?.[1] as 'active' | 'completed' | 'archived' || 'active';
            const price = event.tags.find(t => t[0] === 'price')?.[1];
            const authorHandle = event.tags.find(t => t[0] === 'author-handle')?.[1];
            const headerImage = event.tags.find(t => t[0] === 'header-image')?.[1];
            const featured = event.tags.find(t => t[0] === 'featured')?.[1] === 'true';
            const comingSoon = event.tags.find(t => t[0] === 'coming-soon')?.[1] === 'true';
            const badgeNaddr = event.tags.find(t => t[0] === 'badge-naddr')?.[1];
            const badgeImage = event.tags.find(t => t[0] === 'badge-image')?.[1];
            
            console.log(`[useNostrProjects] Processing event: ${title}, status: ${status}, id: ${id}, badge: ${badgeNaddr}`);
            
            if (!id || !title) {
              console.warn(`[useNostrProjects] Skipping event - missing id or title:`, { id, title });
              return null;
            }

            return {
              id,
              event,
              title,
              description: content.description || '',
              header_image: headerImage,
              images: content.images || [],
              price_sats: price ? parseInt(price) : 0,
              author_pubkey: event.pubkey,
              author_handle: authorHandle,
              created_at: new Date(event.created_at * 1000).toISOString(),
              status,
              featured,
              coming_soon: comingSoon,
              badge_naddr: badgeNaddr,
              badge_image: badgeImage,
            };
          } catch (error) {
            console.error(`[useNostrProjects] Error parsing event:`, error);
            return null;
          }
        })
        .filter((p): p is NostrProjectData => p !== null && p.status === 'active')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`[useNostrProjects] Returning ${projects.length} active projects:`, projects.map(p => p.title));

      return projects;
    },
  });
}

/**
 * Fetch featured Nostr projects for homepage
 */
export function useFeaturedNostrProjects() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['featured-nostr-projects'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38171], authors: [ADMIN_PUBKEY], '#featured': ['true'], limit: 10 }],
        { signal }
      );

      // Group by title to find duplicate projects
      const titleGroups = events.reduce((acc, event) => {
        const title = event.tags.find(t => t[0] === 'title')?.[1];
        if (!title) return acc;
        if (!acc[title]) acc[title] = [];
        acc[title].push(event);
        return acc;
      }, {} as Record<string, typeof events>);

      // Keep only the newest event for each title
      const deduplicatedEvents = Object.values(titleGroups).flatMap(group => {
        if (group.length === 1) return group;
        const sorted = group.sort((a, b) => b.created_at - a.created_at);
        return [sorted[0]];
      });

      const projects: NostrProjectData[] = deduplicatedEvents
        .map((event): NostrProjectData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const title = event.tags.find(t => t[0] === 'title')?.[1];
            const status = event.tags.find(t => t[0] === 'status')?.[1] as 'active' | 'completed' | 'archived' || 'active';
            const price = event.tags.find(t => t[0] === 'price')?.[1];
            const authorHandle = event.tags.find(t => t[0] === 'author-handle')?.[1];
            const headerImage = event.tags.find(t => t[0] === 'header-image')?.[1];
            const comingSoon = event.tags.find(t => t[0] === 'coming-soon')?.[1] === 'true';
            const badgeNaddr = event.tags.find(t => t[0] === 'badge-naddr')?.[1];
            const badgeImage = event.tags.find(t => t[0] === 'badge-image')?.[1];
            
            if (!id || !title || status !== 'active') return null;

            return {
              id,
              event,
              title,
              description: content.description || '',
              header_image: headerImage,
              images: content.images || [],
              price_sats: price ? parseInt(price) : 0,
              author_pubkey: event.pubkey,
              author_handle: authorHandle,
              created_at: new Date(event.created_at * 1000).toISOString(),
              status,
              featured: true,
              coming_soon: comingSoon,
              badge_naddr: badgeNaddr,
              badge_image: badgeImage,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is NostrProjectData => p !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return projects;
    },
  });
}

/**
 * Fetch a single Nostr project by ID
 */
export function useNostrProject(projectId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr-project', projectId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38171], authors: [ADMIN_PUBKEY], '#d': [projectId], limit: 1 }],
        { signal }
      );

      if (events.length === 0) return null;

      const event = events[0];
      try {
        const content = JSON.parse(event.content);
        const id = event.tags.find(t => t[0] === 'd')?.[1];
        const title = event.tags.find(t => t[0] === 'title')?.[1];
        const status = event.tags.find(t => t[0] === 'status')?.[1] as 'active' | 'completed' | 'archived' || 'active';
        const price = event.tags.find(t => t[0] === 'price')?.[1];
        const authorHandle = event.tags.find(t => t[0] === 'author-handle')?.[1];
        const headerImage = event.tags.find(t => t[0] === 'header-image')?.[1];
        const comingSoon = event.tags.find(t => t[0] === 'coming-soon')?.[1] === 'true';
        const badgeNaddr = event.tags.find(t => t[0] === 'badge-naddr')?.[1];
        const badgeImage = event.tags.find(t => t[0] === 'badge-image')?.[1];

        if (!id || !title) return null;

        return {
          id,
          event,
          title,
          description: content.description || '',
          header_image: headerImage,
          images: content.images || [],
          price_sats: price ? parseInt(price) : 0,
          author_pubkey: event.pubkey,
          author_handle: authorHandle,
          created_at: new Date(event.created_at * 1000).toISOString(),
          status,
          coming_soon: comingSoon,
          badge_naddr: badgeNaddr,
          badge_image: badgeImage,
        } as NostrProjectData;
      } catch {
        return null;
      }
    },
  });
}

/**
 * Fetch participants for a project
 */
export function useNostrProjectParticipants(projectId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr-project-participants', projectId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38172], '#p': [projectId], limit: 500 }],
        { signal }
      );

      const participants: NostrProjectParticipant[] = events
        .map((event): NostrProjectParticipant | null => {
          try {
            const content = JSON.parse(event.content);
            const projectIdTag = event.tags.find(t => t[0] === 'p')?.[1];
            const npub = event.tags.find(t => t[0] === 'npub')?.[1];
            const handle = event.tags.find(t => t[0] === 'handle')?.[1];
            const imageUrl = event.tags.find(t => t[0] === 'image')?.[1];

            if (!projectIdTag || !npub || !imageUrl) return null;

            return {
              project_id: projectIdTag,
              participant_npub: npub,
              participant_handle: handle,
              selected_image_url: imageUrl,
              payment_proof: content.payment_proof,
              joined_at: new Date(event.created_at * 1000).toISOString(),
              event,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is NostrProjectParticipant => p !== null)
        .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());

      return participants;
    },
  });
}
