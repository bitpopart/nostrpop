import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface ArtBannerData {
  /** Whether the banner is visible on the /art page */
  enabled: boolean;
  /** Main message line, e.g. "Store sales available after: June 10, 2026" */
  message: string;
  /** Secondary info line, e.g. "Because of traveling for TravelTelly.com" */
  subtext: string;
}

const D_TAG = 'com.bitpopart.art-banner';

export function useArtBanner() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['art-banner', adminPubkey],
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
        return JSON.parse(events[0].content) as ArtBannerData;
      } catch {
        return null;
      }
    },
    enabled: !!adminPubkey,
    staleTime: 60000,
  });
}

export function usePublishArtBanner() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async (banner: ArtBannerData) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 30078,
        content: JSON.stringify(banner),
        tags: [
          ['d', D_TAG],
          ['t', 'art-banner'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return banner;
    },
    onSuccess: (banner) => {
      queryClient.setQueryData(['art-banner', adminPubkey], banner);
    },
  });
}
