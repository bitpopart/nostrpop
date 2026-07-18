/**
 * useFeaturedProducts
 *
 * Stores featured product IDs in Nostr (kind 30078, d-tag "featured-products")
 * so they are visible everywhere — no localStorage, no iframe isolation issues.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const D_TAG = 'featured-products';

export function useFeaturedProducts() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  const query = useQuery({
    queryKey: ['featured-products', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(6000)]);
      try {
        const events = await nostr.query([{
          kinds: [30078],
          authors: [adminPubkey],
          '#d': [D_TAG],
          limit: 1,
        }], { signal });

        if (events.length > 0 && events[0].content) {
          const parsed = JSON.parse(events[0].content);
          return Array.isArray(parsed) ? (parsed as string[]) : [];
        }
      } catch { /* fall through */ }
      return [] as string[];
    },
    enabled: !!adminPubkey,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  return {
    featuredIds: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useUpdateFeaturedProducts() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 30078,
        content: JSON.stringify(ids),
        tags: [
          ['d', D_TAG],
          ['alt', 'BitPopArt featured products list'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return ids;
    },
    onSuccess: (ids) => {
      queryClient.setQueryData(['featured-products', getAdminPubkeyHex()], ids);
      toast({ title: `${ids.length} featured product${ids.length !== 1 ? 's' : ''} saved` });
    },
    onError: () => {
      toast({ title: 'Failed to save featured products', variant: 'destructive' });
    },
  });
}
