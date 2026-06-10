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

      const events = await nostr.query(
        [{ kinds: [38178], authors: [adminPubkey], '#t': ['project-design'], limit: 50 }],
        { signal }
      );

      const designs: ProjectDesign[] = events
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
