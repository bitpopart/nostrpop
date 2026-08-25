/**
 * useShopCarouselSettings
 *
 * Stores whether the sliding carousel at the top of the /shop page is
 * enabled. Stored in Nostr (kind 30078, d-tag "shop-carousel-settings")
 * so the on/off preference is visible everywhere — no localStorage, no
 * iframe isolation issues.
 *
 * Default is ENABLED: if no setting event exists (or it can't be parsed)
 * the carousel stays on.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const D_TAG = 'shop-carousel-settings';

export interface ShopCarouselSettings {
  enabled: boolean;
}

export function useShopCarouselSettings() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  const query = useQuery({
    queryKey: ['shop-carousel-settings', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(4000)]);
      try {
        const events = await nostr.query([{
          kinds: [30078],
          authors: [adminPubkey],
          '#d': [D_TAG],
          limit: 1,
        }], { signal });

        if (events.length > 0 && events[0].content) {
          const parsed = JSON.parse(events[0].content);
          if (parsed && typeof parsed.enabled === 'boolean') {
            return { enabled: parsed.enabled } as ShopCarouselSettings;
          }
        }
      } catch { /* fall through */ }
      return { enabled: true } as ShopCarouselSettings;
    },
    enabled: !!adminPubkey,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    enabled: query.data?.enabled ?? true,
    isLoading: query.isLoading,
  };
}

export function useUpdateShopCarouselSettings() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 30078,
        content: JSON.stringify({ enabled }),
        tags: [
          ['d', D_TAG],
          ['title', 'Shop carousel enabled'],
          ['alt', 'BitPopArt /shop carousel on/off setting'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { enabled };
    },
    onSuccess: ({ enabled }) => {
      queryClient.setQueryData(['shop-carousel-settings', getAdminPubkeyHex()], { enabled });
      toast({ title: enabled ? 'Shop carousel shown' : 'Shop carousel hidden' });
    },
    onError: () => {
      toast({ title: 'Failed to save carousel setting', variant: 'destructive' });
    },
  });
}
