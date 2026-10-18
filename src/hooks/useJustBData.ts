import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import {
  JUSTB_KIND,
  JUSTB_D_TAG,
  DEFAULT_JUSTB,
  sanitizeJustB,
} from '@/lib/justb';
import { PAGE_OWNER_PUBKEYS } from '@/lib/adminUtils';

/**
 * Reads the owner-managed Just B config from the relays.
 *
 * The config is a Nostr kind-30078 settings event (d-tag
 * com.bitpopart.justb) published from /admin → Just B. Until the owner
 * publishes, the static seed config is returned so the page always has
 * content. Relays may disagree on which event is newest (each honours
 * limit:1 with its own copy), so pick the newest by created_at.
 */
export function useJustBData() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['justb-data'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      try {
        const events = await nostr.query(
          [{
            kinds: [JUSTB_KIND],
            authors: PAGE_OWNER_PUBKEYS,
            '#d': [JUSTB_D_TAG],
            limit: 1,
          }],
          { signal },
        );
        if (events.length > 0) {
          const newest = [...events].sort((a, b) => b.created_at - a.created_at)[0];
          if (newest && newest.content) {
            const sanitized = sanitizeJustB(JSON.parse(newest.content));
            if (sanitized) return sanitized;
          }
        }
      } catch (e) {
        console.error('Failed to load Just B data from Nostr:', e);
      }
      return DEFAULT_JUSTB;
    },
    staleTime: 30_000, // the page refreshes on demand via the iframe's request
  });
}

/** Published config + a memoized refresh trigger for the Just B page. */
export function useJustBDataSource() {
  const query = useJustBData();
  const refresh = useCallback(() => query.refetch(), [query]);
  return { data: query.data, refresh };
}
