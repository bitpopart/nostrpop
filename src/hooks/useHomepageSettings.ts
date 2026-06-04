import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    enabled: false, // Disabled by default
    order: 0,
  },
  {
    id: 'art',
    title: 'Art',
    subtitle: 'Browse artwork gallery',
    icon: 'Palette',
    enabled: true,
    order: 1,
  },
  {
    id: 'projects',
    title: 'Projects',
    subtitle: 'By BitPopArt',
    icon: 'FolderKanban',
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
    id: 'free-downloads',
    title: 'Free Downloads',
    subtitle: 'Wallpapers, GIFs & Animations — all free',
    icon: 'Download',
    enabled: true,
    order: 4,
  },
  {
    id: 'news',
    title: 'Nostr News',
    subtitle: 'Latest updates and articles',
    icon: 'Rss',
    enabled: true,
    order: 5,
  },
  {
    id: 'pages',
    title: 'Pages',
    subtitle: 'Explore custom content',
    icon: 'FileText',
    enabled: false,
    order: 6,
  },
];

export function useHomepageSettings() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();
  const queryClient = useQueryClient();

  const query = useQuery({
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
            console.log('[useHomepageSettings] Loaded settings from Nostr:', parsed);

            // Merge: keep saved sections, then splice in any DEFAULT sections not yet
            // saved at their intended default position (not just appended at the end).
            // This ensures newly added sections always appear in the right place even
            // when the admin hasn't re-saved homepage settings after a code update.
            const savedIds = new Set(parsed.map(s => s.id));
            const merged = [...parsed];

            for (const def of DEFAULT_SECTIONS) {
              if (savedIds.has(def.id)) continue;

              // Find the default section that should come right after this one,
              // and look for that section in the merged list to insert before it.
              const defaultOrder = DEFAULT_SECTIONS.map(s => s.id);
              const defPos = defaultOrder.indexOf(def.id);
              const followingIds = defaultOrder.slice(defPos + 1);
              const insertBeforeIdx = merged.findIndex(s => followingIds.includes(s.id));

              if (insertBeforeIdx !== -1) {
                // Give it an order value just below the section it precedes
                const beforeOrder = merged[insertBeforeIdx].order;
                const prevOrder = insertBeforeIdx > 0 ? merged[insertBeforeIdx - 1].order : beforeOrder - 2;
                merged.splice(insertBeforeIdx, 0, {
                  ...def,
                  order: (prevOrder + beforeOrder) / 2,
                });
              } else {
                // No following section found — append at end
                const maxOrder = merged.reduce((m, s) => Math.max(m, s.order), -1);
                merged.push({ ...def, order: maxOrder + 1 });
              }
            }

            return merged.sort((a, b) => a.order - b.order);
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
    staleTime: 0, // Don't cache - always fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes but allow refetching
  });

  // Listen for custom events from admin settings to refetch immediately
  useEffect(() => {
    const handleSettingsUpdate = () => {
      console.log('[useHomepageSettings] Received settings update event, invalidating cache and refetching...');
      // Invalidate the cache to force a fresh fetch
      queryClient.invalidateQueries({ queryKey: ['homepage-settings-public', adminPubkey] });
    };

    window.addEventListener('homepage-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('homepage-settings-updated', handleSettingsUpdate);
  }, [queryClient, adminPubkey]);

  return query;
}
