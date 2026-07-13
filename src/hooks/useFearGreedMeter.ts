/**
 * Fear & Greed Meter Images (Kind 38190)
 *
 * Addressable event storing custom emoji/image URLs for each of the 5 Fear & Greed states.
 * Published by the admin; read publicly.
 *
 * Tag format:
 *   d          – "fear-greed-meter" (singleton)
 *   t          – "fear-greed-meter"
 *   state      – "<state-slug>:<image-url>"  (one per state)
 *   alt        – NIP-31 human-readable description
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import type { FearGreedState } from './useFearGreedIndex';

export const FEAR_GREED_METER_KIND = 38190;
export const FEAR_GREED_METER_D = 'fear-greed-meter';

export type MeterImages = Partial<Record<FearGreedState, string>>;

function parseMeterEvent(event: NostrEvent): MeterImages {
  const images: MeterImages = {};
  event.tags
    .filter(([n]) => n === 'state')
    .forEach(([, value]) => {
      const sep = value.indexOf(':');
      if (sep === -1) return;
      const state = value.slice(0, sep) as FearGreedState;
      const url = value.slice(sep + 1);
      if (state && url) images[state] = url;
    });
  return images;
}

/** Fetch admin-uploaded meter images from Nostr */
export function useFearGreedMeterImages() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery<MeterImages>({
    queryKey: ['fear-greed-meter-images'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      const events = await nostr.query([
        {
          kinds: [FEAR_GREED_METER_KIND],
          authors: [adminPubkey],
          '#d': [FEAR_GREED_METER_D],
          limit: 1,
        },
      ], { signal });

      if (events.length === 0) return {};
      return parseMeterEvent(events[0]);
    },
    enabled: !!adminPubkey,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });
}

/** Publish or update admin meter images */
export function usePublishFearGreedMeterImages() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (images: MeterImages) => {
      if (!user) throw new Error('Must be logged in');

      const tags: string[][] = [
        ['d', FEAR_GREED_METER_D],
        ['t', 'fear-greed-meter'],
        ['alt', 'Bitcoin Fear & Greed Meter images (BitPopArt)'],
      ];

      Object.entries(images).forEach(([state, url]) => {
        if (url) tags.push(['state', `${state}:${url}`]);
      });

      const event = {
        kind: FEAR_GREED_METER_KIND,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
    },
    onSuccess: () => {
      toast({ title: 'Meter images saved! 🎯' });
      queryClient.invalidateQueries({ queryKey: ['fear-greed-meter-images'] });
    },
    onError: (err) => {
      toast({
        title: 'Failed to save meter images',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
