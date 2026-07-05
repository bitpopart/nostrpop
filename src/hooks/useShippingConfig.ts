import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShippingCountry {
  code: string;   // ISO-2 code, e.g. "NL"
  name: string;   // Display name, e.g. "Netherlands"
}

export interface ShippingZone {
  id: string;           // e.g. "zone-europe"
  name: string;         // e.g. "Europe"
  fee: number;          // in the store currency (USD by default)
  currency: string;     // e.g. "USD"
  countries: ShippingCountry[];
}

export interface ShippingConfig {
  zones: ShippingZone[];
  /** Default fee for countries not in any zone (0 = not available) */
  defaultFee?: number;
  /** Currency used for all fees */
  currency: string;
}

// ─── Default starter config ───────────────────────────────────────────────────

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  currency: 'USD',
  defaultFee: 0,
  zones: [
    {
      id: 'zone-netherlands',
      name: 'Netherlands',
      fee: 5,
      currency: 'USD',
      countries: [
        { code: 'NL', name: 'Netherlands' },
      ],
    },
    {
      id: 'zone-europe',
      name: 'Europe',
      fee: 10,
      currency: 'USD',
      countries: [
        { code: 'AT', name: 'Austria' },
        { code: 'BE', name: 'Belgium' },
        { code: 'BG', name: 'Bulgaria' },
        { code: 'HR', name: 'Croatia' },
        { code: 'CY', name: 'Cyprus' },
        { code: 'CZ', name: 'Czech Republic' },
        { code: 'DK', name: 'Denmark' },
        { code: 'EE', name: 'Estonia' },
        { code: 'FI', name: 'Finland' },
        { code: 'FR', name: 'France' },
        { code: 'DE', name: 'Germany' },
        { code: 'GR', name: 'Greece' },
        { code: 'HU', name: 'Hungary' },
        { code: 'IE', name: 'Ireland' },
        { code: 'IT', name: 'Italy' },
        { code: 'LV', name: 'Latvia' },
        { code: 'LT', name: 'Lithuania' },
        { code: 'LU', name: 'Luxembourg' },
        { code: 'MT', name: 'Malta' },
        { code: 'PL', name: 'Poland' },
        { code: 'PT', name: 'Portugal' },
        { code: 'RO', name: 'Romania' },
        { code: 'SK', name: 'Slovakia' },
        { code: 'SI', name: 'Slovenia' },
        { code: 'ES', name: 'Spain' },
        { code: 'SE', name: 'Sweden' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'NO', name: 'Norway' },
        { code: 'CH', name: 'Switzerland' },
      ],
    },
    {
      id: 'zone-north-america',
      name: 'North America',
      fee: 18,
      currency: 'USD',
      countries: [
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'MX', name: 'Mexico' },
      ],
    },
    {
      id: 'zone-rest-world',
      name: 'Rest of World',
      fee: 25,
      currency: 'USD',
      countries: [],  // catch-all — matches anything not in another zone
    },
  ],
};

const D_TAG = 'com.bitpopart.shipping-config';

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/**
 * Find the shipping zone for a given country input (name or ISO-2 code).
 * Falls back to a catch-all zone (empty countries list) if no match.
 */
export function findZoneForCountry(
  config: ShippingConfig,
  country: string,
): ShippingZone | undefined {
  if (!country.trim()) return undefined;
  const needle = country.trim().toLowerCase();

  // Sort zones so catch-all (empty countries) is checked last
  const ordered = [...config.zones].sort((a, b) =>
    a.countries.length === 0 ? 1 : b.countries.length === 0 ? -1 : 0
  );

  return ordered.find(zone => {
    if (zone.countries.length === 0) return true; // catch-all
    return zone.countries.some(
      c =>
        c.code.toLowerCase() === needle ||
        c.name.toLowerCase() === needle ||
        c.name.toLowerCase().includes(needle) ||
        needle.includes(c.name.toLowerCase())
    );
  });
}

/**
 * Get the shipping fee for a country.
 * Returns undefined if country is empty, 0 if not available.
 */
export function getShippingFee(
  config: ShippingConfig | undefined,
  country: string,
): number | undefined {
  if (!config || !country.trim()) return undefined;
  const zone = findZoneForCountry(config, country);
  if (!zone) return config.defaultFee ?? 0;
  return zone.fee;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useShippingConfig() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  const query = useQuery({
    queryKey: ['shipping-config', adminPubkey],
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
          const parsed = JSON.parse(events[0].content) as ShippingConfig;
          return parsed;
        }
      } catch { /* fall through to default */ }
      return DEFAULT_SHIPPING_CONFIG;
    },
    enabled: !!adminPubkey,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  return query;
}

// ─── Save hook (admin only) ────────────────────────────────────────────────────

export function useSaveShippingConfig() {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async (config: ShippingConfig) => {
      if (!user) throw new Error('Not logged in');
      createEvent({
        kind: 30078,
        content: JSON.stringify(config),
        tags: [
          ['d', D_TAG],
          ['title', 'BitPopArt Shipping Configuration'],
        ],
      });
      return config;
    },
    onSuccess: (config) => {
      queryClient.setQueryData(['shipping-config', adminPubkey], config);
      window.dispatchEvent(new CustomEvent('shipping-config-updated'));
    },
  });
}
