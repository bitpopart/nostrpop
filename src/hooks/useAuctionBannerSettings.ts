import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNostrPublish } from './useNostrPublish';
import { useCurrentUser } from './useCurrentUser';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface AuctionBannerSettings {
  /** Whether the auction banner is shown on the homepage */
  enabled: boolean;
}

const D_TAG = 'com.bitpopart.auction-banner-settings';

export function useAuctionBannerSettings() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['auction-banner-settings', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      const events = await nostr.query([{
        kinds: [30078],
        authors: [adminPubkey],
        '#d': [D_TAG],
        limit: 1,
      }], { signal });

      if (events.length === 0) return { enabled: true } as AuctionBannerSettings;

      try {
        const parsed = JSON.parse(events[0].content) as AuctionBannerSettings;
        return parsed;
      } catch {
        return { enabled: true } as AuctionBannerSettings;
      }
    },
    enabled: !!adminPubkey,
    staleTime: 60_000,
  });
}

export function usePublishAuctionBannerSettings() {
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  const publish = (settings: AuctionBannerSettings, callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void }) => {
    if (!user) return;

    publishEvent({
      kind: 30078,
      content: JSON.stringify(settings),
      tags: [['d', D_TAG]],
    }, {
      onSuccess: () => {
        queryClient.setQueryData(['auction-banner-settings', adminPubkey], settings);
        callbacks?.onSuccess?.();
      },
      onError: (e) => callbacks?.onError?.(e as Error),
    });
  };

  return { publish, isPending };
}
