import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { PageData, SocialMediaLink } from '@/lib/pageTypes';

const ADMIN_PUBKEY = '7d33ba57d8a6e8869a1f1d5215254597594ac0dbfeb01b690def8c461b82db35';

/**
 * Fetch all pages
 */
export function usePages() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['pages'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38175], authors: [ADMIN_PUBKEY], limit: 50 }],
        { signal }
      );

      const pages: PageData[] = events
        .map((event): PageData | null => {
          try {
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const title = event.tags.find(t => t[0] === 'title')?.[1];
            const headerImage = event.tags.find(t => t[0] === 'header')?.[1];
            const externalUrl = event.tags.find(t => t[0] === 'r')?.[1];
            const showInFooter = event.tags.find(t => t[0] === 'footer')?.[1] === 'true';
            const order = event.tags.find(t => t[0] === 'order')?.[1];
            
            if (!id || !title) return null;

            // Get all gallery images from tags
            const galleryImages = event.tags.filter(t => t[0] === 'image').map(t => t[1]);

            return {
              id,
              event,
              title,
              description: event.content, // Store as-is (could be JSON with blocks or plain text)
              header_image: headerImage,
              gallery_images: galleryImages,
              external_url: externalUrl,
              author_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              show_in_footer: showInFooter,
              order: order ? parseInt(order) : undefined,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is PageData => p !== null)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      return pages;
    },
  });
}

/**
 * Fetch footer pages only
 */
export function useFooterPages() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['footer-pages'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38175], authors: [ADMIN_PUBKEY], '#footer': ['true'], limit: 20 }],
        { signal }
      );

      const pages: PageData[] = events
        .map((event): PageData | null => {
          try {
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const title = event.tags.find(t => t[0] === 'title')?.[1];
            const order = event.tags.find(t => t[0] === 'order')?.[1];
            
            if (!id || !title) return null;

            // Get all gallery images from tags
            const galleryImages = event.tags.filter(t => t[0] === 'image').map(t => t[1]);

            return {
              id,
              event,
              title,
              description: event.content, // Store as-is (could be JSON with blocks or plain text)
              header_image: event.tags.find(t => t[0] === 'header')?.[1],
              gallery_images: galleryImages,
              external_url: event.tags.find(t => t[0] === 'r')?.[1],
              author_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              show_in_footer: true,
              order: order ? parseInt(order) : undefined,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is PageData => p !== null)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      return pages;
    },
  });
}

/**
 * Fetch a single page by slug
 */
export function usePage(slug: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['page', slug],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38175], authors: [ADMIN_PUBKEY], '#d': [slug], limit: 1 }],
        { signal }
      );

      if (events.length === 0) return null;

      const event = events[0];
      try {
        const id = event.tags.find(t => t[0] === 'd')?.[1];
        const title = event.tags.find(t => t[0] === 'title')?.[1];

        if (!id || !title) return null;

        // Get all gallery images from tags
        const galleryImages = event.tags.filter(t => t[0] === 'image').map(t => t[1]);

        return {
          id,
          event,
          title,
          description: event.content, // Store as-is (could be JSON with blocks or plain text)
          header_image: event.tags.find(t => t[0] === 'header')?.[1],
          gallery_images: galleryImages,
          external_url: event.tags.find(t => t[0] === 'r')?.[1],
          author_pubkey: event.pubkey,
          created_at: new Date(event.created_at * 1000).toISOString(),
          show_in_footer: event.tags.find(t => t[0] === 'footer')?.[1] === 'true',
        } as PageData;
      } catch {
        return null;
      }
    },
  });
}

/**
 * Fetch social media links
 */
export function useSocialMediaLinks() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['social-media-links'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [38176], authors: [ADMIN_PUBKEY], '#t': ['social-media'], limit: 20 }],
        { signal }
      );

      const links: SocialMediaLink[] = events
        .map((event): SocialMediaLink | null => {
          try {
            const content = JSON.parse(event.content);
            // Skip deleted items
            if (content.deleted) return null;
            
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const platform = event.tags.find(t => t[0] === 'platform')?.[1];
            const icon = event.tags.find(t => t[0] === 'icon')?.[1];
            const url = event.tags.find(t => t[0] === 'r')?.[1];
            const order = event.tags.find(t => t[0] === 'order')?.[1];
            
            if (!id || !platform || !url) return null;

            return {
              id,
              event,
              platform,
              icon: icon || '',
              url,
              author_pubkey: event.pubkey,
              order: order ? parseInt(order) : undefined,
            };
          } catch {
            return null;
          }
        })
        .filter((l): l is SocialMediaLink => l !== null)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      return links;
    },
    staleTime: 10000,
  });
}
