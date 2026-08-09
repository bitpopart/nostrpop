import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { getAdminPubkeyHex, isAdminUser } from '@/lib/adminUtils';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';

/** Wall identifiers: north, south, west, east. */
export type WallKey = 'n' | 's' | 'w' | 'e';

/**
 * Wall configuration. Each wall is either a hex color ("#f97316") or an
 * image URL (Blossom). Stored on Nostr as kind 30078 (parameterized
 * replaceable event) authored by the site admin.
 */
export type GalleryWalls = Partial<Record<WallKey, string>>;

export const DEFAULT_WALLS: Record<WallKey, string> = {
  n: '#f97316',
  s: '#ffffff',
  w: '#fff7ed',
  e: '#fff7ed',
};

const WALLS_D_TAG = 'com.bitpopart.gallery-walls';
const WALLS_KIND = 30078;

const WALL_KEYS: WallKey[] = ['n', 's', 'w', 'e'];

/** Validate/normalize a parsed walls object. */
function parseWalls(raw: unknown): GalleryWalls {
  if (!raw || typeof raw !== 'object') return {};
  const out: GalleryWalls = {};
  for (const key of WALL_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) {
      out[key] = value;
    }
  }
  return out;
}

/** Load the admin's gallery wall settings (public read). */
export function useGalleryWalls() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['gallery-walls', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      try {
        const events = await nostr.query([{
          kinds: [WALLS_KIND],
          authors: [adminPubkey],
          '#d': [WALLS_D_TAG],
          limit: 1,
        }], { signal });

        if (events.length > 0 && events[0].content) {
          try {
            return parseWalls(JSON.parse(events[0].content));
          } catch (e) {
            console.error('[useGalleryWalls] Failed to parse wall settings:', e);
          }
        }
      } catch (error) {
        console.error('[useGalleryWalls] Failed to fetch wall settings:', error);
      }
      return {} as GalleryWalls;
    },
    enabled: !!adminPubkey,
    staleTime: 60_000,
    gcTime: 600_000,
  });
}

/** Save wall settings to Nostr (admin only). */
export function useSaveGalleryWalls() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walls: Record<WallKey, string>) => {
      if (!user) {
        throw new Error('You must be logged in to change the gallery walls');
      }
      if (!isAdminUser(user.pubkey)) {
        throw new Error('Only the site admin can change the gallery walls');
      }

      const event = {
        kind: WALLS_KIND,
        content: JSON.stringify(walls),
        tags: [['d', WALLS_D_TAG]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(event);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });
      return signedEvent;
    },
    onSuccess: (_data, walls) => {
      // Update the cache immediately so the gallery repaints without waiting on the relay.
      const adminPubkey = getAdminPubkeyHex();
      queryClient.setQueryData(['gallery-walls', adminPubkey], parseWalls(walls));
      queryClient.invalidateQueries({ queryKey: ['gallery-walls'] });
      toast({
        title: 'Walls updated',
        description: 'The gallery walls have been redesigned.',
      });
    },
    onError: (error) => {
      console.error('Failed to save gallery walls:', error);
      toast({
        title: 'Wall update failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });
}
