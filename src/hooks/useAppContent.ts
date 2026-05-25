import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

// Reuse kind 34019 with distinct t-tags for each app content type.

export interface AppWelcome {
  id: string;
  event: NostrEvent;
  message: string;
  created_at: string;
}

export interface AppMedia {
  id: string;
  event: NostrEvent;
  title: string;
  image_url: string;
  created_at: string;
  hashtags: string[];
}

/**
 * Fetch the latest welcome message for the app.
 * Uses kind 34019 with t:app-welcome and d:app-welcome (replaceable per d-tag).
 */
export function useAppWelcome() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['app-welcome'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      const events = await nostr.query([
        {
          kinds: [34019],
          authors: [adminPubkey],
          '#t': ['app-welcome'],
          limit: 1,
        },
      ], { signal });

      if (events.length === 0) return null;

      const event = events[0];
      const message = event.tags.find(([n]) => n === 'summary')?.[1] || event.content || '';

      return {
        id: event.tags.find(([n]) => n === 'd')?.[1] || '',
        event,
        message,
        created_at: new Date(event.created_at * 1000).toISOString(),
      } as AppWelcome;
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    retry: 2,
  });
}

/**
 * Fetch app media items (wallpapers or gifs).
 */
export function useAppMedia(type: 'app-wallpaper' | 'app-gif') {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['app-media', type],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      const allEvents = await nostr.query([
        {
          kinds: [34019],
          authors: [adminPubkey],
          '#t': [type],
          limit: 200,
        },
        {
          kinds: [5],
          authors: [adminPubkey],
          limit: 500,
        },
      ], { signal });

      const mediaEvents = allEvents.filter(e => e.kind === 34019);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        delEvent.tags
          .filter(([name]) => name === 'a')
          .forEach(([, address]) => {
            if (address?.startsWith('34019:')) {
              deletedAddresses.add(address);
            }
          });
      });

      return mediaEvents
        .map((event): AppMedia | null => {
          try {
            const dTag = event.tags.find(([n]) => n === 'd')?.[1];
            if (!dTag) return null;
            if (deletedAddresses.has(`34019:${event.pubkey}:${dTag}`)) return null;

            const titleTag = event.tags.find(([n]) => n === 'title')?.[1];
            const imageTag = event.tags.find(([n]) => n === 'image')?.[1];
            if (!imageTag) return null;

            // Collect hashtags: all t-tags excluding system ones
            const systemTypeTags = new Set(['app-wallpaper', 'app-gif']);
            const hashtags = event.tags
              .filter(([n, v]) => n === 't' && v && !systemTypeTags.has(v))
              .map(([, v]) => v);

            return {
              id: dTag,
              event,
              title: titleTag || 'Untitled',
              image_url: imageTag,
              created_at: new Date(event.created_at * 1000).toISOString(),
              hashtags,
            };
          } catch {
            return null;
          }
        })
        .filter((d): d is AppMedia => d !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

// ── Mutations ──────────────────────────────────────────────

export function usePublishAppWelcome() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Must be logged in');

      const event = {
        kind: 34019,
        content: message,
        tags: [
          ['d', 'app-welcome'],
          ['summary', message],
          ['t', 'app-welcome'],
          ['alt', 'BitPopArt App welcome message'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { message };
    },
    onSuccess: () => {
      toast({ title: 'Welcome Message Saved' });
      queryClient.invalidateQueries({ queryKey: ['app-welcome'] });
    },
    onError: () => {
      toast({ title: 'Failed to save', variant: 'destructive' });
    },
  });
}

export function usePublishAppMedia() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      title,
      imageUrl,
      hashtags = [],
    }: {
      type: 'app-wallpaper' | 'app-gif';
      title: string;
      imageUrl: string;
      hashtags?: string[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      const dTag = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const systemTypeTags = new Set(['app-wallpaper', 'app-gif']);
      const extraTags: string[][] = hashtags
        .filter(t => t && !systemTypeTags.has(t))
        .map(t => ['t', t]);

      const event = {
        kind: 34019,
        content: '',
        tags: [
          ['d', dTag],
          ['title', title],
          ['image', imageUrl],
          ['t', type],
          ['alt', `${type === 'app-wallpaper' ? 'Wallpaper' : 'Animated GIF'}: ${title}`],
          ...extraTags,
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { id: dTag, title, imageUrl, type, hashtags };
    },
    onSuccess: (data) => {
      toast({ title: 'Added', description: `"${data.title}" published.` });
      queryClient.invalidateQueries({ queryKey: ['app-media', data.type] });
    },
    onError: () => {
      toast({ title: 'Upload Failed', variant: 'destructive' });
    },
  });
}

export function useDeleteAppMedia() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'app-wallpaper' | 'app-gif' }) => {
      if (!user) throw new Error('Must be logged in');

      const address = `34019:${user.pubkey}:${id}`;

      const event = {
        kind: 5,
        content: 'Deleted',
        tags: [['a', address]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return { id, type };
    },
    onSuccess: (data) => {
      toast({ title: 'Deleted' });
      queryClient.setQueriesData(
        { queryKey: ['app-media', data.type] },
        (old: AppMedia[] | undefined) => old?.filter(d => d.id !== data.id) ?? [],
      );
    },
    onError: () => {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    },
  });
}
