import React, { useEffect, useMemo, useRef } from 'react';
import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { NUser, useNostrLogin } from '@nostrify/react/login';
import type { NostrSigner } from '@nostrify/types';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';

interface NostrProviderProps {
  children: React.ReactNode;
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config, presetRelays } = useAppContext();
  const { logins } = useNostrLogin();

  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Use refs so the pool always has the latest data
  const relayUrl = useRef<string>(config.relayUrl);

  // Stable ref to the current user's signer for NIP-42 AUTH.
  // The `open()` callback reads from this ref when a relay sends an AUTH
  // challenge, so it always uses the latest signer without recreating the pool.
  const signerRef = useRef<NostrSigner | undefined>(undefined);

  // Derive the current signer from the active login. This mirrors the
  // logic in useCurrentUser but avoids a circular dependency (useCurrentUser
  // depends on NostrContext which we are providing here).
  const currentLogin = logins[0];
  const currentSigner = useMemo(() => {
    if (!currentLogin) return undefined;
    try {
      switch (currentLogin.type) {
        case 'nsec':
          return NUser.fromNsecLogin(currentLogin).signer;
        case 'bunker':
          return NUser.fromBunkerLogin(currentLogin, pool.current!).signer;
        case 'extension':
          return NUser.fromExtensionLogin(currentLogin).signer;
        default:
          return undefined;
      }
    } catch {
      return undefined;
    }
  }, [currentLogin]);

  // Keep the ref in sync so the AUTH callback always sees the latest signer.
  signerRef.current = currentSigner;

  // Update refs when config changes
  useEffect(() => {
    relayUrl.current = config.relayUrl;
    // The user explicitly picked a different relay, so revalidate — but use
    // invalidateQueries (not resetQueries) so cached content stays on screen
    // while fresh data loads in the background, avoiding a disruptive blank
    // flash of the whole page.
    queryClient.invalidateQueries();
  }, [config.relayUrl, queryClient]);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url, {
          // NIP-42: Respond to relay AUTH challenges by signing a kind
          // 22242 ephemeral event with the current user's signer.
          auth: async (challenge: string) => {
            const signer = signerRef.current;
            if (!signer) {
              throw new Error('AUTH failed: no signer available (user not logged in)');
            }
            return signer.signEvent({
              kind: 22242,
              content: '',
              tags: [
                ['relay', url],
                ['challenge', challenge],
              ],
              created_at: Math.floor(Date.now() / 1000),
            });
          },
        });
      },
      reqRouter(filters) {
        // Read pool: the user-selected relay plus every preset marked
        // `read` (default true). Write-only presets are intentionally
        // excluded so a slow distribution-only relay can't gate every query.
        const readRelays = new Set<string>([relayUrl.current]);
        for (const relay of (presetRelays ?? [])) {
          if (relay.read !== false) {
            readRelays.add(relay.url);
          }
        }
        const map = new Map<string, typeof filters>();
        for (const relay of readRelays) {
          map.set(relay, filters);
        }
        return map;
      },
      eventRouter(_event: NostrEvent) {
        // Write pool: publish to the user-selected relay plus every preset
        // marked `write` (default true) for maximum distribution.
        const writeRelays = new Set<string>([relayUrl.current]);
        for (const relay of (presetRelays ?? [])) {
          if (relay.write !== false) {
            writeRelays.add(relay.url);
          }
        }
        return [...writeRelays];
      },
      // After the first relay sends EOSE, wait this many ms for the other
      // read-pool relays before resolving. Now that reads only hit the two
      // fast relays (Ditto + Dreamith) instead of all presets, this can be
      // short like Ditto (300ms). Previously 4000ms, which made the home
      // page (which fires ~10 queries) feel sluggish.
      eoseTimeout: 500,
    });
  }

  // Cleanup: Close all relay connections when the provider unmounts
  useEffect(() => {
    return () => {
      if (pool.current) {
        pool.current.close();
      }
    };
  }, []);

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;
