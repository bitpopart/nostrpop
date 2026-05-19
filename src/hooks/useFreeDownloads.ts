import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface FreeDownload {
  id: string;
  event: NostrEvent;
  title: string;
  image_url: string;
  created_at: string;
}

/**
 * Fetch all free download images published by the admin.
 * Uses kind 34019 (addressable) with tag t:free-download.
 */
export function useFreeDownloads() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['free-downloads'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      const allEvents = await nostr.query([
        {
          kinds: [34019],
          authors: [adminPubkey],
          '#t': ['free-download'],
          limit: 200,
        },
        {
          kinds: [5],
          authors: [adminPubkey],
          limit: 500,
        },
      ], { signal });

      const downloadEvents = allEvents.filter(e => e.kind === 34019);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      // Build deletion set
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

      const downloads = downloadEvents
        .map((event): FreeDownload | null => {
          try {
            const dTag = event.tags.find(([n]) => n === 'd')?.[1];
            if (!dTag) return null;

            const address = `34019:${event.pubkey}:${dTag}`;
            if (deletedAddresses.has(address)) return null;

            const titleTag = event.tags.find(([n]) => n === 'title')?.[1];
            const imageTag = event.tags.find(([n]) => n === 'image')?.[1];

            if (!imageTag) return null;

            return {
              id: dTag,
              event,
              title: titleTag || 'Untitled',
              image_url: imageTag,
              created_at: new Date(event.created_at * 1000).toISOString(),
            };
          } catch {
            return null;
          }
        })
        .filter((d): d is FreeDownload => d !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return downloads;
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

/**
 * Publish a new free download image (admin only).
 */
export function useCreateFreeDownload() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, imageUrl }: { title: string; imageUrl: string }) => {
      if (!user) throw new Error('Must be logged in');

      const dTag = `free-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const event = {
        kind: 34019,
        content: '',
        tags: [
          ['d', dTag],
          ['title', title],
          ['image', imageUrl],
          ['t', 'free-download'],
          ['alt', `Free download: ${title}`],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });

      return { id: dTag, title, imageUrl };
    },
    onSuccess: (data) => {
      toast({ title: 'Image Added', description: `"${data.title}" is now available for download.` });
      queryClient.invalidateQueries({ queryKey: ['free-downloads'] });
    },
    onError: (error) => {
      console.error('Failed to create free download:', error);
      toast({ title: 'Upload Failed', description: 'Could not publish the download. Please try again.', variant: 'destructive' });
    },
  });
}

/**
 * Delete a free download image (admin only).
 */
export function useDeleteFreeDownload() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (downloadId: string) => {
      if (!user) throw new Error('Must be logged in');

      const address = `34019:${user.pubkey}:${downloadId}`;

      const event = {
        kind: 5,
        content: 'Free download deleted',
        tags: [['a', address]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });

      return { downloadId, address };
    },
    onSuccess: (data) => {
      toast({ title: 'Deleted', description: 'The download has been removed.' });
      queryClient.setQueriesData(
        { queryKey: ['free-downloads'] },
        (old: FreeDownload[] | undefined) => old?.filter(d => d.id !== data.downloadId) ?? [],
      );
    },
    onError: (error) => {
      console.error('Failed to delete free download:', error);
      toast({ title: 'Delete Failed', description: 'Could not delete. Please try again.', variant: 'destructive' });
    },
  });
}
