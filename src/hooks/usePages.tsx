import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PageData, SocialMediaLink } from '@/lib/pageTypes';
import { useNostr } from '@nostrify/react';

const PAGES_KEY = 'bitpopart:pages';

/** Read all pages from localStorage */
export function loadPagesFromStorage(): PageData[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Write all pages to localStorage and return the new list */
export function savePagesToStorage(pages: PageData[]): void {
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
}

/**
 * Fetch all pages from localStorage
 */
export function usePages() {
  return useQuery({
    queryKey: ['pages'],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      return loadPagesFromStorage().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
  });
}

/**
 * Fetch footer pages only
 */
export function useFooterPages() {
  return useQuery({
    queryKey: ['footer-pages'],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      return loadPagesFromStorage()
        .filter(p => p.show_in_footer)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
  });
}

/**
 * Fetch a single page by slug
 */
export function usePage(slug: string) {
  return useQuery({
    queryKey: ['page', slug],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    queryFn: () => {
      return loadPagesFromStorage().find(p => p.id === slug) ?? null;
    },
    enabled: !!slug,
  });
}

/**
 * Fetch social media links — still from Nostr (unchanged)
 */
const ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

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
