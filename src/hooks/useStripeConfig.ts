/**
 * useStripeConfig
 *
 * Stores and reads Stripe configuration from Nostr (kind 30078, d-tag "stripe-config").
 * This makes the config available everywhere — no localStorage, no iframe issues.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const D_TAG = 'stripe-config';

export interface StripeConfig {
  paymentLinkUrl: string;
  publishableKey: string;
  currency: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: StripeConfig = {
  paymentLinkUrl: '',
  publishableKey: '',
  currency: 'eur',
  enabled: false,
};

export function useStripeConfig() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['stripe-config', adminPubkey],
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
          return { ...DEFAULT_CONFIG, ...JSON.parse(events[0].content) } as StripeConfig;
        }
      } catch { /* fall through */ }
      return DEFAULT_CONFIG;
    },
    enabled: !!adminPubkey,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useSaveStripeConfig() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfig) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 30078,
        content: JSON.stringify(config),
        tags: [
          ['d', D_TAG],
          ['alt', 'BitPopArt Stripe payment configuration'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return config;
    },
    onSuccess: (config) => {
      toast({ title: 'Stripe settings saved', description: config.paymentLinkUrl ? 'Payment Link is live.' : 'Settings saved.' });
      queryClient.invalidateQueries({ queryKey: ['stripe-config'] });
    },
    onError: () => {
      toast({ title: 'Failed to save Stripe settings', variant: 'destructive' });
    },
  });
}
