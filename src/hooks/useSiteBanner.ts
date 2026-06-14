import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import type { SiteBanner } from './useHomepageSettings';

const D_TAG = 'com.bitpopart.homepage-settings';

/**
 * Reads the active site banner from Nostr homepage-settings.
 * Returns the first banner that has `enabled: true`, or null.
 */
export function useSiteBanner() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['site-banner', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query([{
        kinds: [30078],
        authors: [adminPubkey],
        '#d': [D_TAG],
        limit: 1,
      }], { signal });

      if (events.length === 0) return null;

      try {
        const parsed = JSON.parse(events[0].content);
        const banners: SiteBanner[] = parsed?.banners ?? [];
        return banners.find(b => b.enabled) ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!adminPubkey,
    staleTime: 30_000,
  });

  void queryClient; // keep reference for potential future invalidation
}
