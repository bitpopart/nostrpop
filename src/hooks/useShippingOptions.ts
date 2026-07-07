/**
 * useShippingOptions — Gamma Spec kind 30406 shipping option management
 *
 * Shipping options are addressable events (kind 30406) that define individual
 * shipping methods with pricing, geographic availability, and service details.
 *
 * These can be referenced from product listings (kind 30402) via:
 *   ["shipping_option", "30406:<pubkey>:<d-tag>", "<extra-cost>"]
 *
 * Gamma Spec (https://github.com/GammaMarkets/market-spec/blob/main/spec.md)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ShippingServiceType = 'standard' | 'express' | 'overnight' | 'pickup';

export interface ShippingOption {
  /** d-tag identifier */
  id: string;
  /** Display title */
  title: string;
  /** Base cost */
  price: number;
  currency: string;
  /** Service type */
  service: ShippingServiceType;
  /** ISO 3166-1 alpha-2 country codes */
  countries: string[];
  /** ISO 3166-2 region codes */
  regions?: string[];
  /** Carrier name */
  carrier?: string;
  /** Delivery window */
  duration?: {
    min: string;
    max: string;
    unit: 'H' | 'D' | 'W';
  };
  /** Pickup location */
  location?: string;
  /** Per-weight pricing */
  pricePerWeight?: { price: number; unit: string };
  /** Human-readable description */
  description?: string;
  /** Source event */
  event?: NostrEvent;
  /** Full addressable coordinate */
  address: string;
}

// ─── Parser ────────────────────────────────────────────────────────────────────

function parseShippingOptionEvent(event: NostrEvent): ShippingOption | null {
  try {
    const getTag = (name: string) => event.tags.find(([t]) => t === name)?.[1];
    const getTagAll = (name: string) => event.tags.filter(([t]) => t === name);

    const dTag = getTag('d');
    const title = getTag('title');
    const priceTag = event.tags.find(([t]) => t === 'price');
    const service = (getTag('service') as ShippingServiceType) || 'standard';

    if (!dTag || !title || !priceTag) return null;

    const price = Number(priceTag[1]) || 0;
    const currency = priceTag[2]?.toUpperCase() || 'USD';

    // Country tag: ["country", "NL", "BE", "DE", ...]
    const countryTags = getTagAll('country').flatMap(t => t.slice(1)).filter(Boolean);

    // Region tag: ["region", "US-FL", ...]
    const regionTags = getTagAll('region').flatMap(t => t.slice(1)).filter(Boolean);

    // Duration: ["duration", "24", "72", "H"]
    const durationTag = event.tags.find(([t]) => t === 'duration');
    const duration = durationTag?.[1] && durationTag?.[2] && durationTag?.[3]
      ? {
          min: durationTag[1],
          max: durationTag[2],
          unit: durationTag[3] as 'H' | 'D' | 'W',
        }
      : undefined;

    // Price-weight: ["price-weight", "<price>", "<unit>"]
    const pwTag = event.tags.find(([t]) => t === 'price-weight');
    const pricePerWeight = pwTag?.[1] && pwTag?.[2]
      ? { price: Number(pwTag[1]), unit: pwTag[2] }
      : undefined;

    return {
      id: dTag,
      title,
      price,
      currency,
      service,
      countries: countryTags,
      regions: regionTags.length > 0 ? regionTags : undefined,
      carrier: getTag('carrier'),
      duration,
      location: getTag('location'),
      pricePerWeight,
      description: event.content || undefined,
      event,
      address: `30406:${event.pubkey}:${dTag}`,
    };
  } catch {
    return null;
  }
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch all shipping options published by the admin */
export function useShippingOptions() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['shipping-options', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      const events = await nostr.query([{
        kinds: [30406],
        authors: [adminPubkey],
        limit: 200,
      }], { signal });

      const options = events
        .map(parseShippingOptionEvent)
        .filter((o): o is ShippingOption => o !== null);

      // Sort: pickup first, then alphabetically
      return options.sort((a, b) => {
        if (a.service === 'pickup' && b.service !== 'pickup') return -1;
        if (b.service === 'pickup' && a.service !== 'pickup') return 1;
        return a.title.localeCompare(b.title);
      });
    },
    enabled: !!adminPubkey,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

/** Fetch a single shipping option by d-tag */
export function useShippingOption(dTag: string) {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['shipping-option', dTag],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const events = await nostr.query([{
        kinds: [30406],
        authors: [adminPubkey],
        '#d': [dTag],
        limit: 1,
      }], { signal });

      if (events.length === 0) return null;
      return parseShippingOptionEvent(events[0]);
    },
    enabled: !!dTag && !!adminPubkey,
    staleTime: 5 * 60_000,
  });
}

/** Create or update a shipping option (publishes kind 30406) */
export function useCreateShippingOption() {
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async (option: Omit<ShippingOption, 'event' | 'address'>) => {
      const now = Math.floor(Date.now() / 1000);

      const tags: string[][] = [
        ['d', option.id],
        ['title', option.title],
        ['price', option.price.toString(), option.currency.toUpperCase()],
        ['service', option.service],
        ['country', ...option.countries],
      ];

      if (option.regions && option.regions.length > 0) {
        tags.push(['region', ...option.regions]);
      }
      if (option.carrier) {
        tags.push(['carrier', option.carrier]);
      }
      if (option.duration) {
        tags.push(['duration', option.duration.min, option.duration.max, option.duration.unit]);
      }
      if (option.location) {
        tags.push(['location', option.location]);
      }
      if (option.pricePerWeight) {
        tags.push(['price-weight', option.pricePerWeight.price.toString(), option.pricePerWeight.unit]);
      }
      tags.push(['alt', `Shipping option: ${option.title} — ${option.price} ${option.currency} (${option.service})`]);
      tags.push(['published_at', now.toString()]);

      createEvent({
        kind: 30406,
        content: option.description || '',
        tags,
      });

      return option;
    },
    onSuccess: (option) => {
      toast({
        title: 'Shipping Option Saved',
        description: `"${option.title}" has been published.`,
      });
      queryClient.invalidateQueries({ queryKey: ['shipping-options', adminPubkey] });
    },
    onError: (error) => {
      console.error('Failed to save shipping option:', error);
      toast({
        title: 'Failed to Save',
        description: 'Could not publish the shipping option. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/** Delete a shipping option (publishes kind 5 deletion event) */
export function useDeleteShippingOption() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async (optionId: string) => {
      if (!user) throw new Error('Not logged in');
      const address = `30406:${user.pubkey}:${optionId}`;
      const deletionEvent = {
        kind: 5,
        content: 'Shipping option deleted',
        tags: [['a', address]],
        created_at: Math.floor(Date.now() / 1000),
      };
      const signed = await user.signer.signEvent(deletionEvent);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return { optionId, address };
    },
    onSuccess: () => {
      toast({ title: 'Shipping Option Deleted' });
      queryClient.invalidateQueries({ queryKey: ['shipping-options', adminPubkey] });
    },
    onError: () => {
      toast({ title: 'Delete Failed', description: 'Could not delete the shipping option.', variant: 'destructive' });
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calculate the total shipping cost for a given option and extra cost.
 */
export function calcShippingTotal(basePrice: number, extraCost?: number): number {
  return basePrice + (extraCost ?? 0);
}

/**
 * Find the best shipping option for a given country code.
 */
export function findShippingOptionsForCountry(
  options: ShippingOption[],
  countryCode: string,
): ShippingOption[] {
  const code = countryCode.toUpperCase().trim();
  return options.filter(opt =>
    opt.countries.length === 0 || // universal
    opt.countries.some(c => c.toUpperCase() === code)
  );
}
