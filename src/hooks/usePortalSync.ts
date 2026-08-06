/**
 * usePortalSync — sync the Client Portal config to/from Nostr.
 *
 * Admin usage  : call `syncToNostr()` to publish a plaintext addressable event
 *                containing the full portal config (pages, codes, npubs).
 *
 * Client usage : call `fetchFromNostr()` to pull the latest config from the relay
 *                and merge it into localStorage before the login page tries to
 *                redeem a code or look up an npub.
 *
 * We use a well-known d-tag so the event is always replaced, never duplicated.
 * The admin's pubkey is hardcoded so any browser can fetch it without auth.
 */

import { useNostr } from '@nostrify/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import {
  exportPortalConfig,
  importPortalConfig,
  PORTAL_CONFIG_KIND,
  PORTAL_CONFIG_D_TAG,
} from '@/lib/clientPortal';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * The admin's Nostr hex pubkey.
 * The portal config event is always published by this key.
 */
export const ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

// ─── Admin: publish config ─────────────────────────────────────────────────────

export function useSyncPortalToNostr() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not logged in');
      if (user.pubkey !== ADMIN_PUBKEY) throw new Error('Only the admin can publish the portal config');

      const content = exportPortalConfig();
      const created_at = Math.floor(Date.now() / 1000);

      const event = await user.signer.signEvent({
        kind: PORTAL_CONFIG_KIND,
        content,
        tags: [
          ['d', PORTAL_CONFIG_D_TAG],
          ['alt', 'BitPopArt client portal config'],
        ],
        created_at,
      });

      await nostr.event(event, { signal: AbortSignal.timeout(8000) });
      return event;
    },
  });
}

// ─── Client: fetch config ──────────────────────────────────────────────────────

export function usePortalConfigQuery() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['portal-config', ADMIN_PUBKEY],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{
          kinds: [PORTAL_CONFIG_KIND],
          authors: [ADMIN_PUBKEY],
          '#d': [PORTAL_CONFIG_D_TAG],
          limit: 1,
        }],
        { signal },
      );

      const event: NostrEvent | undefined = events[0];
      if (!event) return null;

      // Merge into localStorage so the portal functions work immediately
      importPortalConfig(event.content);
      return event;
    },
    staleTime: 60_000, // re-fetch at most once per minute
    retry: 2,
  });
}
