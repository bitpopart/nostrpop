import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

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

interface NWCConfig {
  connectionString: string;
  isConnected: boolean;
}

const NWC_STORAGE_KEY = 'bitpopart:nwc_config';

export function useNWCConfig() {
  const [config, setConfig] = useState<NWCConfig>(() => {
    try {
      const stored = localStorage.getItem(NWC_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return { connectionString: '', isConnected: false };
  });

  const saveConfig = (newConfig: NWCConfig) => {
    setConfig(newConfig);
    localStorage.setItem(NWC_STORAGE_KEY, JSON.stringify(newConfig));
  };

  const disconnect = () => {
    saveConfig({ connectionString: '', isConnected: false });
  };

  return { config, saveConfig, disconnect };
}

export function useNWCTransactions(enabled: boolean = false) {
  const { config } = useNWCConfig();

  return useQuery({
    queryKey: ['nwc-transactions', config.connectionString],
    queryFn: async ({ signal }) => {
      if (!config.connectionString || !config.isConnected) {
        return [];
      }

      try {
        // Parse the NWC connection string
        const url = new URL(config.connectionString);
        const relay = url.searchParams.get('relay');
        const secret = url.searchParams.get('secret');
        const pubkey = url.host;

        if (!relay || !secret || !pubkey) {
          throw new Error('Invalid NWC connection string');
        }

        console.log('[NWC] Connecting to:', { relay, pubkey });

        // Import nostr-tools for NWC communication
        const { SimplePool, nip04, generateSecretKey, getPublicKey, finalizeEvent } = await import('nostr-tools');
        
        // Generate ephemeral keypair for this session
        const sessionSk = generateSecretKey();
        const sessionPk = getPublicKey(sessionSk);

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

        // Encrypt the request
        const encryptedContent = await nip04.encrypt(sessionSk, pubkey, JSON.stringify(request));

        // Create the NWC request event
        const requestEvent = finalizeEvent({
          kind: 23194,
          created_at: Math.floor(Date.now() / 1000),
          tags: [['p', pubkey]],
          content: encryptedContent,
        }, sessionSk);

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
                authors: [pubkey],
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
        const decryptedContent = await nip04.decrypt(sessionSk, pubkey, responseEvent.content);
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
    enabled: enabled && !!config.connectionString && config.isConnected,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
