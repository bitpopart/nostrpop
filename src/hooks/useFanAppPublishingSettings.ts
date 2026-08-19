import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

/**
 * Fan App Publishing assets — the app icon and store screenshots the owner
 * manages from /admin → Fan App Publishing, stored as a Nostr kind 30078
 * addressable event under the admin pubkey (d-tag below). The live app
 * injects these into the web manifest at runtime so PWABuilder / stores see
 * the owner's chosen artwork.
 */

export const FAN_APP_PUBLISH_D_TAG = 'com.bitpopart.fanapp-publishing';

export interface FanAppScreenshot {
  /** Stable local id so the admin UI can add/remove without key collisions */
  id: string;
  /** Blossom CDN URL */
  url: string;
  label: string;
  /** Actual pixel dimensions (read from the uploaded file) */
  width?: number;
  height?: number;
}

export interface FanAppPublishSettings {
  /** 512x512 PNG icon URL (Blossom CDN). Falls back to site default when empty. */
  iconUrl: string;
  /** Store/listing screenshots, in display order */
  screenshots: FanAppScreenshot[];
  /** ISO timestamp of last save (informational) */
  updatedAt?: string;
}

export const DEFAULT_FAN_APP_PUBLISH: FanAppPublishSettings = {
  iconUrl: '',
  screenshots: [],
};

export function useFanAppPublishingSettings() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();
  const queryClient = useQueryClient();

  // Listen for the save broadcast so open tabs (admin + live app) refetch
  // immediately instead of waiting for staleTime.
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['fanapp-publishing-settings', adminPubkey] });
    };
    window.addEventListener('fanapp-publishing-updated', handler);
    return () => window.removeEventListener('fanapp-publishing-updated', handler);
  }, [queryClient, adminPubkey]);

  return useQuery({
    queryKey: ['fanapp-publishing-settings', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([
        {
          kinds: [30078],
          authors: [adminPubkey],
          '#d': [FAN_APP_PUBLISH_D_TAG],
          limit: 1,
        },
      ], { signal });

      if (events.length === 0) return DEFAULT_FAN_APP_PUBLISH;

      try {
        const parsed = JSON.parse(events[0].content || '{}') as Partial<FanAppPublishSettings>;
        return {
          iconUrl: parsed.iconUrl ?? '',
          screenshots: Array.isArray(parsed.screenshots) ? parsed.screenshots : [],
          updatedAt: parsed.updatedAt,
        } as FanAppPublishSettings;
      } catch {
        return DEFAULT_FAN_APP_PUBLISH;
      }
    },
    staleTime: 30_000,
  });
}

export function usePublishFanAppPublishingSettings() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const adminPubkey = getAdminPubkeyHex();

  return useMutation({
    mutationFn: async (settings: FanAppPublishSettings) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 30078,
        content: JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }),
        tags: [
          ['d', FAN_APP_PUBLISH_D_TAG],
          ['t', 'fanapp-publishing'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });

      // Broadcast so all open admin tabs / the live app pick up the change
      window.dispatchEvent(new CustomEvent('fanapp-publishing-updated'));
      return settings;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['fanapp-publishing-settings', adminPubkey], settings);
    },
  });
}
