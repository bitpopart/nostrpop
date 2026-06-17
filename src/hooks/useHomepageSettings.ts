import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export type BannerStyle = 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'dark';

export interface SiteBanner {
  id: string;
  label: string;          // display name for the admin UI
  text: string;           // message shown in the banner
  url?: string;           // optional CTA link
  urlLabel?: string;      // CTA button label
  style: BannerStyle;
  enabled: boolean;       // currently active
}

export interface HomepageButton {
  id: string;
  label: string;
  url: string;
  variant: 'primary' | 'outline' | 'accent';
  /** Lucide icon name to show on the button. Falls back to variant default when omitted. */
  icon?: string;
  /** If set, this button appears between the section with this id and the next */
  afterSectionId?: string | null;
  /** True = shown in the top hero button row */
  isHero?: boolean;
  order: number;
}

export interface HomepageSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface HomepageSettings {
  sections: HomepageSection[];
  buttons: HomepageButton[];
  banners?: SiteBanner[];
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

const DEFAULT_BUTTONS: HomepageButton[] = [
  {
    id: 'btn-start-painting',
    label: 'Start Painting',
    url: '/canvas',
    variant: 'primary',
    isHero: true,
    afterSectionId: null,
    order: 0,
  },
  {
    id: 'btn-visit-shop',
    label: 'Visit Shop',
    url: '/shop',
    variant: 'outline',
    isHero: true,
    afterSectionId: null,
    order: 1,
  },
  {
    id: 'btn-pop-tour',
    label: 'Pop Tour',
    url: '/popup',
    variant: 'accent',
    isHero: true,
    afterSectionId: null,
    order: 2,
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
            const parsed = JSON.parse(events[0].content);
            console.log('[useHomepageSettings] Loaded settings from Nostr:', parsed);

            // Handle both old format (array) and new format (object with sections + buttons)
            let sections: HomepageSection[];
            let buttons: HomepageButton[];

            if (Array.isArray(parsed)) {
              // Legacy format: just sections array
              sections = parsed as HomepageSection[];
              buttons = DEFAULT_BUTTONS;
            } else if (parsed && typeof parsed === 'object' && 'sections' in parsed) {
              sections = (parsed as HomepageSettings).sections || [];
              buttons = (parsed as HomepageSettings).buttons || DEFAULT_BUTTONS;
            } else {
              sections = DEFAULT_SECTIONS;
              buttons = DEFAULT_BUTTONS;
            }

            // Merge: keep saved sections, then splice in any DEFAULT sections not yet
            // saved at their intended default position (not just appended at the end).
            const savedIds = new Set(sections.map(s => s.id));
            const merged = [...sections];

            for (const def of DEFAULT_SECTIONS) {
              if (savedIds.has(def.id)) continue;

              const defaultOrder = DEFAULT_SECTIONS.map(s => s.id);
              const defPos = defaultOrder.indexOf(def.id);
              const followingIds = defaultOrder.slice(defPos + 1);
              const insertBeforeIdx = merged.findIndex(s => followingIds.includes(s.id));

              if (insertBeforeIdx !== -1) {
                const beforeOrder = merged[insertBeforeIdx].order;
                const prevOrder = insertBeforeIdx > 0 ? merged[insertBeforeIdx - 1].order : beforeOrder - 2;
                merged.splice(insertBeforeIdx, 0, {
                  ...def,
                  order: (prevOrder + beforeOrder) / 2,
                });
              } else {
                const maxOrder = merged.reduce((m, s) => Math.max(m, s.order), -1);
                merged.push({ ...def, order: maxOrder + 1 });
              }
            }

            return {
              sections: merged.sort((a, b) => a.order - b.order),
              buttons: buttons.sort((a, b) => a.order - b.order),
            } as HomepageSettings;
          } catch (e) {
            console.error('[useHomepageSettings] Failed to parse settings from Nostr:', e);
          }
        }
      } catch (error) {
        console.error('[useHomepageSettings] Failed to fetch settings:', error);
      }
      
      return {
        sections: DEFAULT_SECTIONS.sort((a, b) => a.order - b.order),
        buttons: DEFAULT_BUTTONS.sort((a, b) => a.order - b.order),
      } as HomepageSettings;
    },
    enabled: !!adminPubkey,
    staleTime: 0,
    gcTime: 0,
  });

  // Listen for custom events from admin settings to refetch immediately
  useEffect(() => {
    const handleSettingsUpdate = () => {
      console.log('[useHomepageSettings] Received settings update event, invalidating cache and refetching...');
      queryClient.invalidateQueries({ queryKey: ['homepage-settings-public', adminPubkey] });
    };

    window.addEventListener('homepage-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('homepage-settings-updated', handleSettingsUpdate);
  }, [queryClient, adminPubkey]);

  return query;
}
