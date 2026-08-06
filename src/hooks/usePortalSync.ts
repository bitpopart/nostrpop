/**
 * usePortalSync — sync the Client Portal config to/from Nostr.
 *
 * The portal config (pages, codes, npubs) is stored as a plaintext
 * addressable Nostr event (kind 31989) published by the admin.
 *
 * Admin: auto-called after every create/update/delete in the portal admin.
 * Client: fetched directly from the relay on the login page before any
 *         code or npub check — so codes work from any device/browser.
 *
 * Direct fetch strategy: we query the relay directly via WebSocket rather
 * than through the NPool, so we get an independent timeout and don't
 * depend on pool state or eoseTimeout settings.
 */

import { useNostr } from '@nostrify/react';
import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import {
  exportPortalConfig,
  importPortalConfig,
  PORTAL_CONFIG_KIND,
  PORTAL_CONFIG_D_TAG,
} from '@/lib/clientPortal';

/** The admin's Nostr hex pubkey — hardcoded so clients can fetch without auth. */
export const ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

/** Relays to query for portal config (must be publicly readable). */
const SYNC_RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.dreamith.to',
  'wss://relay.nostr.band',
];

// ─── Admin: publish config to Nostr ───────────────────────────────────────────

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

      await nostr.event(event, { signal: AbortSignal.timeout(10000) });
      return event;
    },
  });
}

// ─── Client: fetch config directly from relay ─────────────────────────────────

/**
 * Fetch the portal config event directly from a relay via WebSocket.
 * Returns the event content string or null if not found.
 * Tries each relay in SYNC_RELAYS until one succeeds.
 */
export async function fetchPortalConfigFromRelay(timeoutMs = 8000): Promise<string | null> {
  for (const relayUrl of SYNC_RELAYS) {
    try {
      const result = await fetchFromRelay(relayUrl, timeoutMs);
      if (result !== null) {
        return result;
      }
    } catch {
      // try next relay
    }
  }
  return null;
}

function fetchFromRelay(relayUrl: string, timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    let done = false;
    const subId = 'portal-cfg-' + Math.random().toString(36).slice(2, 8);

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        try { ws.close(); } catch { /* ignore */ }
        resolve(null);
      }
    }, timeoutMs);

    const ws = new WebSocket(relayUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify([
        'REQ',
        subId,
        {
          kinds: [PORTAL_CONFIG_KIND],
          authors: [ADMIN_PUBKEY],
          '#d': [PORTAL_CONFIG_D_TAG],
          limit: 1,
        },
      ]));
    };

    ws.onmessage = (e) => {
      if (done) return;
      try {
        const msg = JSON.parse(e.data as string) as unknown[];
        const [type, sid] = msg as [string, string];

        if (type === 'EVENT' && sid === subId) {
          const event = msg[2] as { content?: string };
          if (event?.content) {
            done = true;
            clearTimeout(timer);
            try { ws.close(); } catch { /* ignore */ }
            resolve(event.content);
          }
        } else if (type === 'EOSE' && sid === subId) {
          // End of stored events — nothing found on this relay
          done = true;
          clearTimeout(timer);
          try { ws.close(); } catch { /* ignore */ }
          resolve(null);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    ws.onclose = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(null);
      }
    };
  });
}

/**
 * Load portal config from relay and merge into localStorage.
 * Returns true if config was found and loaded, false otherwise.
 */
export async function loadPortalConfig(): Promise<boolean> {
  const content = await fetchPortalConfigFromRelay();
  if (!content) return false;
  importPortalConfig(content);
  return true;
}
