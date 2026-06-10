import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface ProjectDesign {
  id: string;
  title: string;
  thumbnail: string;
  projectUrl: string;
  order: number;
  createdAt: number;
}

/**
 * Fetch project design thumbnail entries (kind 38178).
 * These are admin-published addressable events linking a thumbnail image to a project page.
 */
export function useProjectDesigns() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['project-designs', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const [events, deletionEvents] = await Promise.all([
        nostr.query(
          [{ kinds: [38178], authors: [adminPubkey], '#t': ['project-design'], limit: 50 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [adminPubkey], limit: 200 }],
          { signal }
        ),
      ]);

      // Build set of deleted addresses from kind-5 events
      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        delEvent.tags.forEach(tag => {
          if (tag[0] === 'a') deletedAddresses.add(tag[1]);
          if (tag[0] === 'e') deletedAddresses.add(tag[1]);
        });
      });

      const liveEvents = events.filter(event => {
        const dTag = event.tags.find(t => t[0] === 'd')?.[1];
        const address = `38178:${event.pubkey}:${dTag}`;
        return !deletedAddresses.has(address) && !deletedAddresses.has(event.id);
      });

      const designs: ProjectDesign[] = liveEvents
        .map((event): ProjectDesign | null => {
          const id = event.tags.find(t => t[0] === 'd')?.[1];
          const title = event.tags.find(t => t[0] === 'title')?.[1] ?? '';
          const thumbnail = event.tags.find(t => t[0] === 'image')?.[1] ?? '';
          const projectUrl = event.tags.find(t => t[0] === 'r')?.[1] ?? '';
          const orderRaw = event.tags.find(t => t[0] === 'order')?.[1];
          const order = orderRaw ? parseInt(orderRaw, 10) : 999;

          if (!id || !thumbnail) return null;

          return { id, title, thumbnail, projectUrl, order, createdAt: event.created_at };
        })
        .filter((d): d is ProjectDesign => d !== null)
        .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);

      return designs;
    },
    enabled: !!adminPubkey,
  });
}
