import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';

interface NWCTransaction {
  type: string;
  invoice: string;
  description?: string;
  description_hash?: string;
  preimage: string;
  payment_hash: string;
  amount: number;
  fees_paid: number;
  created_at: number;
  expires_at?: number;
  settled_at?: number;
  metadata?: Record<string, unknown>;
}

interface NWCInfo {
  pubkey: string;
  relay: string;
  secret?: string;
  connectionString?: string;
}

// Discover NWC info from relays (kind 13194 events)
export function useNWCDiscovery() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['nwc-discovery', user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!user?.pubkey) {
        return null;
      }

      console.log('[NWC] Discovering NWC info for user:', user.pubkey);

      try {
        // Query for NWC info events (kind 13194)
        const events = await nostr.query(
          [
            {
              kinds: [13194],
              authors: [user.pubkey],
              limit: 10,
            }
          ],
          { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
        );

        console.log('[NWC] Found NWC info events:', events.length);

        if (events.length === 0) {
          return null;
        }

        // Get the most recent event
        const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];

        // Parse the event content
        const content = JSON.parse(latestEvent.content);
        
        console.log('[NWC] NWC info content:', content);

        // Extract relay and other info
        const relay = content.relay || latestEvent.tags.find(([t]) => t === 'relay')?.[1];
        const walletPubkey = content.walletPubkey || latestEvent.tags.find(([t]) => t === 'p')?.[1];

        if (!relay || !walletPubkey) {
          console.log('[NWC] Missing relay or wallet pubkey');
          return null;
        }

        // Try to get secret from the event (some wallets include it)
        const secret = content.secret;

        const nwcInfo: NWCInfo = {
          pubkey: walletPubkey,
          relay,
          secret,
        };

        // If we have the secret, construct connection string
        if (secret) {
          nwcInfo.connectionString = `nostr+walletconnect://${walletPubkey}?relay=${encodeURIComponent(relay)}&secret=${secret}`;
        }

        console.log('[NWC] Discovered NWC info:', { pubkey: walletPubkey, relay, hasSecret: !!secret });

        return nwcInfo;
      } catch (error) {
        console.error('[NWC] Discovery error:', error);
        return null;
      }
    },
    enabled: !!user?.pubkey,
    staleTime: 300000, // 5 minutes
  });
}

export function useNWCTransactions(nwcInfo: NWCInfo | null | undefined, enabled: boolean = false) {
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['nwc-transactions', nwcInfo?.pubkey, nwcInfo?.relay],
    queryFn: async ({ signal }) => {
      if (!nwcInfo || !user?.signer) {
        return [];
      }

      try {
        const { pubkey: walletPubkey, relay } = nwcInfo;

        console.log('[NWC] Fetching transactions from wallet:', { walletPubkey, relay });

        // Import nostr-tools for NWC communication
        const { SimplePool, nip04 } = await import('nostr-tools');
        
        // Create a connection to the relay
        const pool = new SimplePool();

        // Create request for list_transactions
        const request = {
          method: 'list_transactions',
          params: {
            from: 0, // Unix timestamp - get all transactions
            until: Math.floor(Date.now() / 1000),
            limit: 1000,
            offset: 0,
            unpaid: false,
            type: 'incoming' // Only incoming payments (zaps received)
          }
        };

        // Encrypt the request using user's signer
        const encryptedContent = await user.signer.nip04!.encrypt(
          walletPubkey,
          JSON.stringify(request)
        );

        // Create the NWC request event
        const requestEvent = await user.signer.signEvent({
          kind: 23194,
          created_at: Math.floor(Date.now() / 1000),
          tags: [['p', walletPubkey]],
          content: encryptedContent,
        });

        console.log('[NWC] Sending request event:', requestEvent);

        // Publish the request
        await pool.publish([relay], requestEvent);

        // Subscribe to response
        const responseEvents = await new Promise<any[]>((resolve, reject) => {
          const timeout = setTimeout(() => {
            sub.close();
            reject(new Error('NWC request timeout'));
          }, 15000); // 15 second timeout

          const events: any[] = [];

          const sub = pool.subscribeMany(
            [relay],
            [
              {
                kinds: [23195], // NWC response kind
                authors: [walletPubkey],
                '#e': [requestEvent.id],
                since: Math.floor(Date.now() / 1000) - 60,
              }
            ],
            {
              onevent(event) {
                console.log('[NWC] Received response event:', event);
                events.push(event);
              },
              oneose() {
                clearTimeout(timeout);
                sub.close();
                resolve(events);
              }
            }
          );

          // Also handle signal abort
          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              sub.close();
              reject(new Error('Request aborted'));
            });
          }
        });

        pool.close([relay]);

        if (responseEvents.length === 0) {
          console.log('[NWC] No response received');
          return [];
        }

        // Decrypt the response
        const responseEvent = responseEvents[0];
        const decryptedContent = await user.signer.nip04!.decrypt(
          walletPubkey,
          responseEvent.content
        );
        const response = JSON.parse(decryptedContent);

        console.log('[NWC] Decrypted response:', response);

        if (response.error) {
          throw new Error(response.error.message || 'NWC request failed');
        }

        // Extract transactions from response
        const transactions: NWCTransaction[] = response.result?.transactions || [];
        
        console.log(`[NWC] Retrieved ${transactions.length} transactions`);

        return transactions;
      } catch (error) {
        console.error('[NWC] Error fetching transactions:', error);
        throw error;
      }
    },
    enabled: enabled && !!nwcInfo && !!user?.signer?.nip04,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
