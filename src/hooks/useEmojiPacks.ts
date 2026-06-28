import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface EmojiItem {
  shortcode: string;
  url: string;
}

export interface EmojiPack {
  id: string;         // d-tag
  event: NostrEvent;
  name: string;
  description: string;
  picture: string;    // cover image URL
  emojis: EmojiItem[];
  created_at: string;
  pubkey: string;
}

/** Fetch all emoji packs published by the admin (kind 30030). */
export function useEmojiPacks() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['emoji-packs', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      const events = await nostr.query([
        {
          kinds: [30030],
          authors: [adminPubkey],
          limit: 200,
        },
      ], { signal });

      const packs = events
        .map((event): EmojiPack | null => {
          try {
            const dTag = event.tags.find(([n]) => n === 'd')?.[1];
            if (!dTag) return null;

            const name = event.tags.find(([n]) => n === 'name')?.[1] ?? dTag;
            const description = event.tags.find(([n]) => n === 'about')?.[1] ?? '';
            const picture = event.tags.find(([n]) => n === 'picture')?.[1] ?? '';
            const emojis: EmojiItem[] = event.tags
              .filter(([n]) => n === 'emoji')
              .map(([, shortcode, url]) => ({ shortcode, url }))
              .filter(e => e.shortcode && e.url);

            return {
              id: dTag,
              event,
              name,
              description,
              picture,
              emojis,
              created_at: new Date(event.created_at * 1000).toISOString(),
              pubkey: event.pubkey,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is EmojiPack => p !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return packs;
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

/** Create or update an emoji pack (admin only). */
export function useCreateEmojiPack() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dTag,
      name,
      description,
      picture,
      emojis,
    }: {
      dTag?: string;
      name: string;
      description: string;
      picture: string;
      emojis: EmojiItem[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      const id = dTag ?? `emoji-pack-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const tags: string[][] = [
        ['d', id],
        ['name', name],
        ['about', description],
      ];
      if (picture) tags.push(['picture', picture]);
      for (const e of emojis) {
        tags.push(['emoji', e.shortcode, e.url]);
      }
      tags.push(['alt', `Emoji pack: ${name}`]);

      const event = {
        kind: 30030,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });

      return { id, name };
    },
    onSuccess: (data) => {
      toast({ title: 'Emoji Pack Saved', description: `"${data.name}" has been published.` });
      queryClient.invalidateQueries({ queryKey: ['emoji-packs'] });
    },
    onError: (error) => {
      console.error('Failed to save emoji pack:', error);
      toast({ title: 'Save Failed', description: 'Could not publish the emoji pack. Please try again.', variant: 'destructive' });
    },
  });
}

/** Delete an emoji pack by publishing a kind 5 deletion event. */
export function useDeleteEmojiPack() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packId: string) => {
      if (!user) throw new Error('Must be logged in');

      const address = `30030:${user.pubkey}:${packId}`;

      const event = {
        kind: 5,
        content: 'Emoji pack deleted',
        tags: [['a', address]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });

      return { packId, address };
    },
    onSuccess: (data) => {
      toast({ title: 'Deleted', description: 'The emoji pack has been removed.' });
      queryClient.setQueriesData(
        { queryKey: ['emoji-packs'] },
        (old: EmojiPack[] | undefined) => old?.filter(p => p.id !== data.packId) ?? [],
      );
    },
    onError: (error) => {
      console.error('Failed to delete emoji pack:', error);
      toast({ title: 'Delete Failed', description: 'Could not delete. Please try again.', variant: 'destructive' });
    },
  });
}
