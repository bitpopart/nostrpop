import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

/**
 * Kind 36201 – NFT Character (Nostr Fungible Token character)
 *
 * Addressable event storing a cartoon character with layered images.
 *
 * Tags:
 *   d          – unique slug for the character
 *   title      – character display name
 *   t          – "nft-character" (system tag)
 *   t          – category (e.g. "travel", "crypto", …)
 *   layer      – <index>:<label>:<url> for each layer image (multiple)
 *   image      – preview image URL (first layer or manually set)
 *   alt        – NIP-31 human-readable description
 */

export const NFT_CHARACTER_KIND = 36201;

export interface NFTLayer {
  index: number;
  label: string;
  url: string;
}

export interface NFTCharacter {
  id: string; // d-tag value
  event: NostrEvent;
  title: string;
  category: string;
  layers: NFTLayer[];
  previewUrl: string;
  created_at: string;
}

function parseCharacter(event: NostrEvent): NFTCharacter | null {
  try {
    const dTag = event.tags.find(([n]) => n === 'd')?.[1];
    if (!dTag) return null;

    const title = event.tags.find(([n]) => n === 'title')?.[1] || 'Unnamed';
    const category = event.tags
      .filter(([n, v]) => n === 't' && v && v !== 'nft-character')
      .map(([, v]) => v)[0] || '';

    const layers: NFTLayer[] = event.tags
      .filter(([n]) => n === 'layer')
      .map(([, value]) => {
        // format: "<index>:<label>:<url>"
        const firstColon = value.indexOf(':');
        const secondColon = value.indexOf(':', firstColon + 1);
        if (firstColon === -1 || secondColon === -1) return null;
        const index = parseInt(value.slice(0, firstColon));
        const label = value.slice(firstColon + 1, secondColon);
        const url = value.slice(secondColon + 1);
        if (isNaN(index) || !url) return null;
        return { index, label, url };
      })
      .filter((l): l is NFTLayer => l !== null)
      .sort((a, b) => a.index - b.index);

    const previewUrl = event.tags.find(([n]) => n === 'image')?.[1]
      || layers[0]?.url
      || '';

    return {
      id: dTag,
      event,
      title,
      category,
      layers,
      previewUrl,
      created_at: new Date(event.created_at * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

/** Fetch all NFT characters published by the admin. */
export function useNFTCharacters() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['nft-characters'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      const allEvents = await nostr.query([
        {
          kinds: [NFT_CHARACTER_KIND],
          authors: [adminPubkey],
          '#t': ['nft-character'],
          limit: 200,
        },
        // Fetch deletion events so we can filter deleted characters
        {
          kinds: [5],
          authors: [adminPubkey],
          limit: 500,
        },
      ], { signal });

      const characterEvents = allEvents.filter(e => e.kind === NFT_CHARACTER_KIND);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      // Collect deleted addresses
      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(del => {
        del.tags
          .filter(([n]) => n === 'a')
          .forEach(([, addr]) => {
            if (addr?.startsWith(`${NFT_CHARACTER_KIND}:`)) {
              deletedAddresses.add(addr);
            }
          });
      });

      return characterEvents
        .filter(e => {
          const d = e.tags.find(([n]) => n === 'd')?.[1];
          return d && !deletedAddresses.has(`${NFT_CHARACTER_KIND}:${e.pubkey}:${d}`);
        })
        .map(parseCharacter)
        .filter((c): c is NFTCharacter => c !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

export interface PublishNFTCharacterInput {
  title: string;
  category: string;
  layers: { label: string; url: string }[];
  /** If updating, pass the existing d-tag */
  existingId?: string;
}

/** Publish (create or update) an NFT character. */
export function usePublishNFTCharacter() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishNFTCharacterInput) => {
      if (!user) throw new Error('Must be logged in');

      const dTag = input.existingId || `nft-char-${Date.now()}`;
      const previewUrl = input.layers[0]?.url || '';

      const tags: string[][] = [
        ['d', dTag],
        ['title', input.title],
        ['t', 'nft-character'],
        ['alt', `Nostr Fungible Token character: ${input.title}`],
      ];

      if (input.category) tags.push(['t', input.category]);
      if (previewUrl) tags.push(['image', previewUrl]);

      input.layers.forEach((layer, i) => {
        tags.push(['layer', `${i}:${layer.label}:${layer.url}`]);
      });

      const event = {
        kind: NFT_CHARACTER_KIND,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { id: dTag };
    },
    onSuccess: () => {
      toast({ title: 'Character saved!' });
      queryClient.invalidateQueries({ queryKey: ['nft-characters'] });
    },
    onError: (err) => {
      toast({
        title: 'Failed to save character',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/** Delete an NFT character via a kind-5 deletion event. */
export function useDeleteNFTCharacter() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ characterId, pubkey }: { characterId: string; pubkey: string }) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 5,
        content: 'Deleting NFT character',
        tags: [
          ['a', `${NFT_CHARACTER_KIND}:${pubkey}:${characterId}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
    },
    onSuccess: () => {
      toast({ title: 'Character deleted' });
      queryClient.invalidateQueries({ queryKey: ['nft-characters'] });
    },
    onError: () => {
      toast({ title: 'Failed to delete character', variant: 'destructive' });
    },
  });
}
