import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export type PosterFormat = 'A3' | 'A4' | 'A5' | 'A6';

export interface PosterFormatPrice {
  format: PosterFormat;
  priceUsd: number;  // price in USD (e.g. 4.99)
  priceEur: number;  // price in EUR
  priceSats: number; // price in sats
}

export interface PrintPoster {
  id: string;
  event: NostrEvent;
  title: string;
  description: string;
  svgUrl: string;
  previewUrl: string; // same SVG used for preview
  formats: PosterFormatPrice[];
  tags: string[];
  created_at: string;
}

const DEFAULT_FORMAT_PRICES: PosterFormatPrice[] = [
  { format: 'A3', priceUsd: 4.99, priceEur: 4.59, priceSats: 7500 },
  { format: 'A4', priceUsd: 2.99, priceEur: 2.75, priceSats: 4500 },
  { format: 'A5', priceUsd: 1.99, priceEur: 1.85, priceSats: 3000 },
  { format: 'A6', priceUsd: 0.99, priceEur: 0.90, priceSats: 1500 },
];

export { DEFAULT_FORMAT_PRICES };

/**
 * Parse format prices from Nostr event tags.
 * Tags look like: ["price_a3_usd", "4.99"], ["price_a3_eur", "4.59"], ["price_a3_sats", "7500"]
 */
function parseFormatPrices(tags: string[][]): PosterFormatPrice[] {
  const formats: PosterFormat[] = ['A3', 'A4', 'A5', 'A6'];
  return formats.map((format) => {
    const key = format.toLowerCase();
    const usdTag = tags.find(([n]) => n === `price_${key}_usd`)?.[1];
    const eurTag = tags.find(([n]) => n === `price_${key}_eur`)?.[1];
    const satsTag = tags.find(([n]) => n === `price_${key}_sats`)?.[1];

    const defaults = DEFAULT_FORMAT_PRICES.find(p => p.format === format)!;
    return {
      format,
      priceUsd: usdTag ? parseFloat(usdTag) : defaults.priceUsd,
      priceEur: eurTag ? parseFloat(eurTag) : defaults.priceEur,
      priceSats: satsTag ? parseInt(satsTag) : defaults.priceSats,
    };
  });
}

/**
 * Fetch all print posters published by the admin.
 * Uses kind 34021 (addressable) with tag t:print-poster.
 */
export function usePrintPosters() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['print-posters'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      const allEvents = await nostr.query([
        {
          kinds: [34021],
          authors: [adminPubkey],
          '#t': ['print-poster'],
          limit: 200,
        },
        {
          kinds: [5],
          authors: [adminPubkey],
          limit: 500,
        },
      ], { signal });

      const posterEvents = allEvents.filter(e => e.kind === 34021);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      // Build deletion set
      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        delEvent.tags
          .filter(([name]) => name === 'a')
          .forEach(([, address]) => {
            if (address?.startsWith('34021:')) {
              deletedAddresses.add(address);
            }
          });
      });

      const posters = posterEvents
        .map((event): PrintPoster | null => {
          try {
            const dTag = event.tags.find(([n]) => n === 'd')?.[1];
            if (!dTag) return null;

            const address = `34021:${event.pubkey}:${dTag}`;
            if (deletedAddresses.has(address)) return null;

            const titleTag = event.tags.find(([n]) => n === 'title')?.[1];
            const descTag = event.tags.find(([n]) => n === 'description')?.[1];
            const svgTag = event.tags.find(([n]) => n === 'svg')?.[1];
            const imageTag = event.tags.find(([n]) => n === 'image')?.[1];

            // Need at least one of svg or image
            const svgUrl = svgTag || imageTag;
            if (!svgUrl) return null;

            const tTags = event.tags
              .filter(([n]) => n === 't' && ![  'print-poster'].includes)
              .filter(([, v]) => v && v !== 'print-poster')
              .map(([, v]) => v);

            const formats = parseFormatPrices(event.tags);

            return {
              id: dTag,
              event,
              title: titleTag || 'Untitled Poster',
              description: descTag || '',
              svgUrl,
              previewUrl: imageTag || svgUrl,
              formats,
              tags: tTags,
              created_at: new Date(event.created_at * 1000).toISOString(),
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is PrintPoster => p !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return posters;
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

export interface CreatePrintPosterInput {
  title: string;
  description: string;
  svgUrl: string;
  previewUrl: string;
  formats: PosterFormatPrice[];
  extraTags?: string[];
}

/**
 * Publish a new print poster (admin only).
 */
export function useCreatePrintPoster() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePrintPosterInput) => {
      if (!user) throw new Error('Must be logged in');

      const dTag = `poster-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const priceTags: string[][] = [];
      for (const fp of input.formats) {
        const key = fp.format.toLowerCase();
        priceTags.push([`price_${key}_usd`, fp.priceUsd.toString()]);
        priceTags.push([`price_${key}_eur`, fp.priceEur.toString()]);
        priceTags.push([`price_${key}_sats`, fp.priceSats.toString()]);
      }

      const extraTTags = (input.extraTags ?? []).map(t => ['t', t]);

      const event = {
        kind: 34021,
        content: input.description,
        tags: [
          ['d', dTag],
          ['title', input.title],
          ['description', input.description],
          ['svg', input.svgUrl],
          ['image', input.previewUrl],
          ['t', 'print-poster'],
          ...extraTTags,
          ...priceTags,
          ['alt', `Print poster: ${input.title}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });

      return { id: dTag, title: input.title };
    },
    onSuccess: (data) => {
      toast({ title: 'Poster Published', description: `"${data.title}" is now available in the Print Shop.` });
      queryClient.invalidateQueries({ queryKey: ['print-posters'] });
    },
    onError: (error) => {
      console.error('Failed to create print poster:', error);
      toast({ title: 'Upload Failed', description: 'Could not publish the poster. Please try again.', variant: 'destructive' });
    },
  });
}

/**
 * Delete a print poster (admin only).
 */
export function useDeletePrintPoster() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (posterId: string) => {
      if (!user) throw new Error('Must be logged in');

      const address = `34021:${user.pubkey}:${posterId}`;

      const event = {
        kind: 5,
        content: 'Print poster deleted',
        tags: [['a', address]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });

      return { posterId, address };
    },
    onSuccess: (data) => {
      toast({ title: 'Deleted', description: 'The poster has been removed.' });
      queryClient.setQueriesData(
        { queryKey: ['print-posters'] },
        (old: PrintPoster[] | undefined) => old?.filter(p => p.id !== data.posterId) ?? [],
      );
    },
    onError: (error) => {
      console.error('Failed to delete print poster:', error);
      toast({ title: 'Delete Failed', description: 'Could not delete. Please try again.', variant: 'destructive' });
    },
  });
}
