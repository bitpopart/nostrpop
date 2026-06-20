/**
 * Avatar Generator — admin config + public hook.
 *
 * The admin picks which NFT characters (kind 36201) should appear
 * in the Avatar Generator.  The selection is stored as a kind-34019
 * addressable event with t:avatar-generator-config, containing the
 * selected NFT character d-tags as ["nft-char", "<d-tag>"] tags.
 *
 * Public readers fetch:
 *  1. The config event to get the list of chosen d-tags.
 *  2. The actual NFT character events for those d-tags.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { parseNFTCharacter, NFT_CHARACTER_KIND, type NFTCharacter } from './useNFTCharacters';

const CONFIG_KIND = 34019;
const CONFIG_D_TAG = 'avatar-generator-config';
const CONFIG_T_TAG = 'avatar-generator-config';

// ── Read admin's selection ─────────────────────────────────────────────────────

/** Returns the list of NFT character d-tags selected by the admin for the Avatar Generator. */
export function useAvatarGeneratorConfig() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['avatar-generator-config'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      const events = await nostr.query([
        {
          kinds: [CONFIG_KIND],
          authors: [adminPubkey],
          '#t': [CONFIG_T_TAG],
          limit: 1,
        },
      ], { signal });

      if (events.length === 0) return [];

      const event = events[0];
      return event.tags
        .filter(([n]) => n === 'nft-char')
        .map(([, d]) => d)
        .filter(Boolean);
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    retry: 2,
  });
}

/** Returns only the NFT characters that the admin has selected for the Avatar Generator. */
export function useAvatarGeneratorNFTs() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();
  const { data: selectedIds = [], isLoading: configLoading } = useAvatarGeneratorConfig();

  return useQuery({
    queryKey: ['avatar-generator-nfts', selectedIds],
    queryFn: async (c) => {
      if (selectedIds.length === 0) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      const events = await nostr.query([
        {
          kinds: [NFT_CHARACTER_KIND],
          authors: [adminPubkey],
          '#d': selectedIds,
          limit: 100,
        },
      ], { signal });

      return events
        .map(parseNFTCharacter)
        .filter((c): c is NFTCharacter => c !== null)
        .filter(c => selectedIds.includes(c.id))
        // preserve the order chosen by admin
        .sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));
    },
    enabled: !configLoading && selectedIds.length > 0,
    staleTime: 30000,
    retry: 2,
  });
}

// ── Admin mutation ─────────────────────────────────────────────────────────────

/** Save (replace) the list of NFT character d-tags selected for the Avatar Generator. */
export function useSaveAvatarGeneratorConfig() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selectedDTags: string[]) => {
      if (!user) throw new Error('Must be logged in');

      const nftCharTags: string[][] = selectedDTags.map(d => ['nft-char', d]);

      const event = {
        kind: CONFIG_KIND,
        content: '',
        tags: [
          ['d', CONFIG_D_TAG],
          ['t', CONFIG_T_TAG],
          ['alt', 'BitPopArt Avatar Generator — selected NFT characters'],
          ...nftCharTags,
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return selectedDTags;
    },
    onSuccess: () => {
      toast({ title: 'Avatar Generator updated!' });
      queryClient.invalidateQueries({ queryKey: ['avatar-generator-config'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-generator-nfts'] });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Failed to save',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
