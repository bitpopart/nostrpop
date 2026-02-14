import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface HomepageSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: 'nostr-projects',
    title: 'Nostr Projects',
    subtitle: 'Join collaborative art - Select an image & pay in sats',
    icon: 'Users',
    enabled: true,
    order: 0,
  },
  {
    id: 'projects',
    title: 'Projects',
    subtitle: 'By BitPopArt',
    icon: 'FolderKanban',
    enabled: true,
    order: 1,
  },
  {
    id: 'art',
    title: 'Art',
    subtitle: 'Browse artwork gallery',
    icon: 'Palette',
    enabled: true,
    order: 2,
  },
  {
    id: 'cards',
    title: 'Cards',
    subtitle: 'Send a positive vibe to someone',
    icon: 'CreditCard',
    enabled: true,
    order: 3,
  },
  {
    id: 'news',
    title: 'Nostr News',
    subtitle: 'Latest updates and articles',
    icon: 'Rss',
    enabled: true,
    order: 4,
  },
];

export function useHomepageSettings() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['homepage-settings-public', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      try {
        const events = await nostr.query([{
          kinds: [30078],
          authors: [adminPubkey],
          '#d': ['com.bitpopart.homepage-settings'],
          limit: 1,
        }], { signal });

        if (events.length > 0 && events[0].content) {
          try {
            const parsed = JSON.parse(events[0].content) as HomepageSection[];
            // Sort by order and filter enabled
            return parsed.sort((a, b) => a.order - b.order);
          } catch (e) {
            console.error('[useHomepageSettings] Failed to parse settings from Nostr:', e);
          }
        }
      } catch (error) {
        console.error('[useHomepageSettings] Failed to fetch settings:', error);
      }
      
      return DEFAULT_SECTIONS.sort((a, b) => a.order - b.order);
    },
    enabled: !!adminPubkey,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
