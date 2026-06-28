import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export type PosterFormat = 'A3' | 'A4' | 'A5' | 'A6' | '50x70';

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
  previewUrl: string;
  formats: PosterFormatPrice[];
  category: string;   // primary category
  tags: string[];     // extra t-tags (excluding 'print-poster' and the category)
  created_at: string;
}

// ─── Default poster categories ────────────────────────────────────────────────
export const POSTER_CATEGORIES = [
  'Art',
  'Bitcoin',
  'Pop Art',
  'Travel',
  'Photography',
  'Abstract',
  'Typography',
  'Nature',
  'City',
  'Music',
  'Sport',
  'Motivational',
  'Humor',
  'Holiday',
  'Animals',
  'Other',
] as const;

export type PosterCategory = typeof POSTER_CATEGORIES[number];

// ─── Default prices ────────────────────────────────────────────────────────────
export const DEFAULT_FORMAT_PRICES: PosterFormatPrice[] = [
  { format: 'A3', priceUsd: 4.99, priceEur: 4.59, priceSats: 7500 },
  { format: 'A4', priceUsd: 2.99, priceEur: 2.75, priceSats: 4500 },
  { format: 'A5', priceUsd: 1.99, priceEur: 1.85, priceSats: 3000 },
  { format: 'A6', priceUsd: 0.99, priceEur: 0.90, priceSats: 1500 },
];

// Art-specific default prices (includes 50x70 format)
export const DEFAULT_ART_FORMAT_PRICES: PosterFormatPrice[] = [
  { format: 'A6', priceUsd: 2.99, priceEur: 2.75, priceSats: 4500 },
  { format: 'A5', priceUsd: 4.99, priceEur: 4.59, priceSats: 7500 },
  { format: 'A4', priceUsd: 7.99, priceEur: 7.49, priceSats: 12000 },
  { format: 'A3', priceUsd: 12.99, priceEur: 11.99, priceSats: 19000 },
  { format: '50x70', priceUsd: 24.99, priceEur: 22.99, priceSats: 37000 },
];

/**
 * Parse format prices from Nostr event tags.
 * Tags look like: ["price_a3_usd", "4.99"], ["price_a3_eur", "4.59"], ["price_a3_sats", "7500"]
 * For 50x70: ["price_50x70_usd", ...], etc.
 */
function parseFormatPrices(tags: string[][], isArtCategory = false): PosterFormatPrice[] {
  const standardFormats: PosterFormat[] = ['A3', 'A4', 'A5', 'A6'];
  const allDefaults = isArtCategory ? DEFAULT_ART_FORMAT_PRICES : DEFAULT_FORMAT_PRICES;

  // Determine which formats to parse based on tags present
  const formats: PosterFormat[] = [...standardFormats];
  // Include 50x70 if there are price tags for it OR if it's an Art category
  const has50x70Tag = tags.some(([n]) => n === 'price_50x70_usd' || n === 'price_50x70_eur' || n === 'price_50x70_sats');
  if (has50x70Tag || isArtCategory) {
    formats.push('50x70');
  }

  return formats.map((format) => {
    const key = format.toLowerCase().replace('x', 'x'); // e.g. '50x70' stays '50x70'
    const usdTag = tags.find(([n]) => n === `price_${key}_usd`)?.[1];
    const eurTag = tags.find(([n]) => n === `price_${key}_eur`)?.[1];
    const satsTag = tags.find(([n]) => n === `price_${key}_sats`)?.[1];

    const defaultPrice = allDefaults.find(p => p.format === format) ??
      DEFAULT_FORMAT_PRICES.find(p => p.format === format) ??
      { format, priceUsd: 9.99, priceEur: 9.49, priceSats: 15000 };

    return {
      format,
      priceUsd: usdTag ? parseFloat(usdTag) : defaultPrice.priceUsd,
      priceEur: eurTag ? parseFloat(eurTag) : defaultPrice.priceEur,
      priceSats: satsTag ? parseInt(satsTag) : defaultPrice.priceSats,
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
            const categoryTag = event.tags.find(([n]) => n === 'category')?.[1];

            // Need at least one of svg or image
            const svgUrl = svgTag || imageTag;
            if (!svgUrl) return null;

            // Collect extra t-tags (excluding the system tag 'print-poster')
            const tTags = event.tags
              .filter(([n, v]) => n === 't' && v && v !== 'print-poster')
              .map(([, v]) => v);

            const isArtCategory = (categoryTag || '').toLowerCase() === 'art';
            const formats = parseFormatPrices(event.tags, isArtCategory);

            return {
              id: dTag,
              event,
              title: titleTag || 'Untitled Poster',
              description: descTag || '',
              svgUrl,
              previewUrl: imageTag || svgUrl,
              formats,
              category: categoryTag || 'Other',
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

/**
 * Derive the sorted list of unique categories from a poster list.
 */
export function getPosterCategories(posters: PrintPoster[]): string[] {
  const cats = new Set<string>();
  posters.forEach(p => { if (p.category) cats.add(p.category); });
  return Array.from(cats).sort((a, b) => a.localeCompare(b));
}

export interface CreatePrintPosterInput {
  title: string;
  description: string;
  svgUrl: string;
  previewUrl: string;
  formats: PosterFormatPrice[];
  category: string;
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
        // Use lowercase key; '50x70' stays as '50x70'
        const key = fp.format.toLowerCase();
        priceTags.push([`price_${key}_usd`, fp.priceUsd.toString()]);
        priceTags.push([`price_${key}_eur`, fp.priceEur.toString()]);
        priceTags.push([`price_${key}_sats`, fp.priceSats.toString()]);
      }

      const extraTTags = (input.extraTags ?? []).map(t => ['t', t]);
      const category = input.category.trim() || 'Other';

      const event = {
        kind: 34021,
        content: input.description,
        tags: [
          ['d', dTag],
          ['title', input.title],
          ['description', input.description],
          ['svg', input.svgUrl],
          ['image', input.previewUrl],
          ['category', category],
          ['t', 'print-poster'],
          ['t', category.toLowerCase().replace(/\s+/g, '-')],
          ...extraTTags,
          ...priceTags,
          ['alt', `Print poster: ${input.title}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });

      return { id: dTag, title: input.title, category };
    },
    onSuccess: (data) => {
      toast({ title: 'Poster Published', description: `"${data.title}" added to "${data.category}" category.` });
      queryClient.invalidateQueries({ queryKey: ['print-posters'] });
    },
    onError: (error) => {
      console.error('Failed to create print poster:', error);
      toast({ title: 'Upload Failed', description: 'Could not publish the poster. Please try again.', variant: 'destructive' });
    },
  });
}

export interface UpdatePrintPosterInput extends CreatePrintPosterInput {
  posterId: string; // the existing d-tag — re-publishing replaces the addressable event
}

/**
 * Update an existing print poster (admin only).
 * Addressable events (kind 34021) are replaced when the same d-tag is re-published.
 */
export function useUpdatePrintPoster() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePrintPosterInput) => {
      if (!user) throw new Error('Must be logged in');

      const priceTags: string[][] = [];
      for (const fp of input.formats) {
        const key = fp.format.toLowerCase();
        priceTags.push([`price_${key}_usd`, fp.priceUsd.toString()]);
        priceTags.push([`price_${key}_eur`, fp.priceEur.toString()]);
        priceTags.push([`price_${key}_sats`, fp.priceSats.toString()]);
      }

      const extraTTags = (input.extraTags ?? []).map(t => ['t', t]);
      const category = input.category.trim() || 'Other';

      const event = {
        kind: 34021,
        content: input.description,
        tags: [
          ['d', input.posterId],
          ['title', input.title],
          ['description', input.description],
          ['svg', input.svgUrl],
          ['image', input.previewUrl],
          ['category', category],
          ['t', 'print-poster'],
          ['t', category.toLowerCase().replace(/\s+/g, '-')],
          ...extraTTags,
          ...priceTags,
          ['alt', `Print poster: ${input.title}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });

      return { id: input.posterId, title: input.title, category };
    },
    onSuccess: (data) => {
      toast({ title: 'Poster Updated', description: `"${data.title}" has been saved.` });
      queryClient.invalidateQueries({ queryKey: ['print-posters'] });
    },
    onError: (error) => {
      console.error('Failed to update print poster:', error);
      toast({ title: 'Update Failed', description: 'Could not save changes. Please try again.', variant: 'destructive' });
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

/**
 * Fetch live BTC/EUR rate from CoinGecko (refreshes every 5 min).
 * Returns sats per 1 EUR, e.g. 1500.
 */
export function useBtcEurRate() {
  return useQuery({
    queryKey: ['btc-eur-rate'],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd',
        { signal }
      );
      const data = await res.json();
      const eurPerBtc: number = data?.bitcoin?.eur;
      const usdPerBtc: number = data?.bitcoin?.usd;
      if (!eurPerBtc || !usdPerBtc) return null;
      return {
        eurPerBtc,
        usdPerBtc,
        satsPerEur: Math.round(100_000_000 / eurPerBtc),
        satsPerUsd: Math.round(100_000_000 / usdPerBtc),
      };
    },
    staleTime: 5 * 60 * 1000,      // 5 minutes
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    retry: 2,
  });
}

/**
 * Convert a EUR price to live sats using the BTC/EUR rate.
 * Falls back to the stored priceSats if no rate available.
 */
export function eurToLiveSats(priceEur: number, rate: ReturnType<typeof useBtcEurRate>['data']): number {
  if (!rate) return 0;
  return Math.round(priceEur * rate.satsPerEur);
}
