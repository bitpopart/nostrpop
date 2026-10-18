import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import {
  ZAPWALL_CHANNELS_KIND,
  ZAPWALL_CHANNELS_D_TAG,
  DEFAULT_ZAPWALL_CHANNELS,
  sanitizeZapwallChannels,
} from '@/lib/zapwall';
import { PAGE_OWNER_PUBKEYS } from '@/lib/adminUtils';

/**
 * Reads the owner-managed Zapwall channels/events from the relays.
 *
 * The list is a Nostr kind-30078 settings event (d-tag
 * com.bitpopart.zapwall-channels) published from /admin → Zapwall. Until the
 * owner publishes, the static seed list is returned so the dashboard always
 * has content. Relays may disagree on which event is newest (each honours
 * limit:1 with its own copy), so pick the newest by created_at.
 */
export function useZapwallChannels() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['zapwall-channels'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      try {
        const events = await nostr.query(
          [{
            kinds: [ZAPWALL_CHANNELS_KIND],
            authors: PAGE_OWNER_PUBKEYS,
            '#d': [ZAPWALL_CHANNELS_D_TAG],
            limit: 1,
          }],
          { signal },
        );
        if (events.length > 0) {
          const newest = [...events].sort((a, b) => b.created_at - a.created_at)[0];
          if (newest && newest.content) {
            const sanitized = sanitizeZapwallChannels(JSON.parse(newest.content));
            if (sanitized) return sanitized;
          }
        }
      } catch (e) {
        console.error('Failed to load Zapwall channels from Nostr:', e);
      }
      return DEFAULT_ZAPWALL_CHANNELS;
    },
    staleTime: 30_000, // the dashboard refreshes on demand via the iframe's refresh button
  });
}

/** Published list + a memoized refresh trigger for the Zapwall page. */
export function useZapwallChannelsSource() {
  const query = useZapwallChannels();
  const refresh = useCallback(() => query.refetch(), [query]);
  return { channels: query.data, refresh };
}
