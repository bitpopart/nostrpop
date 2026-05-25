import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface AnimationItem {
  id: string;          // d-tag
  event: NostrEvent;
  title: string;
  description: string;
  video_url: string;
  thumb_url: string;
  duration: string;    // formatted "m:ss"
  created_at: string;
  hashtags: string[];  // t-tags (excluding system tags)
}

/** Parse duration seconds → "m:ss" */
function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Fetch all animations published by BitPopArt admin.
 * Uses NIP-71 kind 34235 (landscape video) with t:bitpopart-animation.
 */
export function useAnimations() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['bitpopart-animations'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      const allEvents = await nostr.query([
        {
          kinds: [34235, 34236],
          authors: [adminPubkey],
          '#t': ['bitpopart-animation'],
          limit: 200,
        },
        {
          kinds: [5],
          authors: [adminPubkey],
          limit: 500,
        },
      ], { signal });

      const videoEvents = allEvents.filter(e => e.kind === 34235 || e.kind === 34236);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        delEvent.tags
          .filter(([name]) => name === 'a')
          .forEach(([, address]) => {
            if (address) deletedAddresses.add(address);
          });
      });

      return videoEvents
        .map((event): AnimationItem | null => {
          try {
            const dTag = event.tags.find(([n]) => n === 'd')?.[1];
            if (!dTag) return null;

            const address = `${event.kind}:${event.pubkey}:${dTag}`;
            if (deletedAddresses.has(address)) return null;

            const title = event.tags.find(([n]) => n === 'title')?.[1] || 'Untitled';
            const summary = event.tags.find(([n]) => n === 'summary')?.[1] || '';

            // Parse imeta tag (NIP-71)
            const imetaTag = event.tags.find(([n]) => n === 'imeta');
            let videoUrl = '';
            let thumbUrl = '';
            let duration = '';

            if (imetaTag) {
              for (let i = 1; i < imetaTag.length; i++) {
                const part = imetaTag[i];
                if (part.startsWith('url ')) videoUrl = part.substring(4);
                else if (part.startsWith('image ')) thumbUrl = part.substring(6);
                else if (part.startsWith('duration ')) {
                  duration = formatDuration(parseFloat(part.substring(9)));
                }
              }
            }

            // Fallback to legacy tags
            if (!videoUrl) videoUrl = event.tags.find(([n]) => n === 'url')?.[1] || '';
            if (!thumbUrl) thumbUrl = event.tags.find(([n]) => n === 'thumb')?.[1] || '';
            if (!duration) {
              const d = event.tags.find(([n]) => n === 'duration')?.[1];
              if (d) duration = formatDuration(parseFloat(d));
            }

            if (!videoUrl) return null;

            // Collect hashtags: all t-tags excluding system ones
            const systemTags = new Set(['bitpopart-animation', 'bitpopart']);
            const hashtags = event.tags
              .filter(([n, v]) => n === 't' && v && !systemTags.has(v))
              .map(([, v]) => v);

            return {
              id: dTag,
              event,
              title,
              description: summary,
              video_url: videoUrl,
              thumb_url: thumbUrl,
              duration,
              created_at: new Date(event.created_at * 1000).toISOString(),
              hashtags,
            };
          } catch {
            return null;
          }
        })
        .filter((a): a is AnimationItem => a !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });
}

/**
 * Publish a new animation (admin only).
 * Publishes a NIP-71 kind 34235 event tagged with t:bitpopart-animation.
 */
export function usePublishAnimation() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      videoUrl,
      thumbUrl,
      duration,
      mimeType,
      fileSize,
      hashtags = [],
    }: {
      title: string;
      description: string;
      videoUrl: string;
      thumbUrl: string;
      duration: number;
      mimeType: string;
      fileSize: number;
      hashtags?: string[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      const dTag = `animation-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const imetaParts = [
        `url ${videoUrl}`,
        `m ${mimeType}`,
        `size ${fileSize}`,
        `duration ${duration.toFixed(2)}`,
      ];
      if (thumbUrl) imetaParts.push(`image ${thumbUrl}`);

      const tags: string[][] = [
        ['d', dTag],
        ['title', title],
        ['t', 'bitpopart-animation'],
        ['t', 'bitpopart'],
        ['alt', `BitPopArt animation: ${title}`],
        ['imeta', ...imetaParts],
      ];

      // Add user-defined hashtags (skip system tags already added above)
      const systemTags = new Set(['bitpopart-animation', 'bitpopart']);
      for (const tag of hashtags) {
        if (tag && !systemTags.has(tag)) {
          tags.push(['t', tag]);
        }
      }

      if (description.trim()) tags.push(['summary', description.trim()]);
      if (thumbUrl) tags.push(['thumb', thumbUrl]);

      const event = {
        kind: 34235, // NIP-71 horizontal video
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { id: dTag, title };
    },
    onSuccess: (data) => {
      toast({ title: 'Animation published!', description: `"${data.title}" is now live.` });
      queryClient.invalidateQueries({ queryKey: ['bitpopart-animations'] });
    },
    onError: () => {
      toast({ title: 'Publish failed', variant: 'destructive' });
    },
  });
}

/**
 * Update an existing animation (republish with same d-tag, updated fields).
 * Since kind 34235 is addressable, publishing with the same d-tag replaces the old event.
 */
export function useUpdateAnimation() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dTag,
      kind,
      title,
      description,
      videoUrl,
      thumbUrl,
      duration,
      mimeType,
      fileSize,
      hashtags = [],
    }: {
      dTag: string;
      kind: number;
      title: string;
      description: string;
      videoUrl: string;
      thumbUrl: string;
      duration: number;
      mimeType: string;
      fileSize: number;
      hashtags?: string[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      const imetaParts = [
        `url ${videoUrl}`,
        `m ${mimeType}`,
        `size ${fileSize}`,
        `duration ${duration.toFixed(2)}`,
      ];
      if (thumbUrl) imetaParts.push(`image ${thumbUrl}`);

      const tags: string[][] = [
        ['d', dTag],
        ['title', title],
        ['t', 'bitpopart-animation'],
        ['t', 'bitpopart'],
        ['alt', `BitPopArt animation: ${title}`],
        ['imeta', ...imetaParts],
      ];

      // Add user-defined hashtags (skip system tags already added above)
      const systemTags = new Set(['bitpopart-animation', 'bitpopart']);
      for (const tag of hashtags) {
        if (tag && !systemTags.has(tag)) {
          tags.push(['t', tag]);
        }
      }

      if (description.trim()) tags.push(['summary', description.trim()]);
      if (thumbUrl) tags.push(['thumb', thumbUrl]);

      const event = {
        kind,
        content: '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(10000) });
      return { dTag, title };
    },
    onSuccess: (data) => {
      toast({ title: 'Animation updated!', description: `"${data.title}" has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['bitpopart-animations'] });
    },
    onError: () => {
      toast({ title: 'Update failed', variant: 'destructive' });
    },
  });
}

/** Delete an animation (admin only, NIP-09 deletion). */
export function useDeleteAnimation() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: number }) => {
      if (!user) throw new Error('Must be logged in');

      const address = `${kind}:${user.pubkey}:${id}`;
      const event = {
        kind: 5,
        content: 'Deleted animation',
        tags: [['a', address]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signed = await user.signer.signEvent(event);
      await nostr.event(signed, { signal: AbortSignal.timeout(5000) });
      return { id };
    },
    onSuccess: (data) => {
      toast({ title: 'Deleted' });
      queryClient.setQueriesData(
        { queryKey: ['bitpopart-animations'] },
        (old: AnimationItem[] | undefined) => old?.filter(a => a.id !== data.id) ?? [],
      );
    },
    onError: () => {
      toast({ title: 'Delete failed', variant: 'destructive' });
    },
  });
}
