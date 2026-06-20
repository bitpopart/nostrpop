/**
 * useProjectPages
 *
 * Fetches all project pages from Nostr and returns them grouped by type.
 * Used by the Media Generator admin to show a live list of all pages
 * that can have floating buttons configured.
 *
 * Page → URL mapping:
 *  - Portfolio projects (kind 36171, general)    → /projects  (they all live on the one page)
 *  - FRL projects       (kind 36171, frl)         → /frl/:id
 *  - Nostr collab       (kind 38171)              → /nostr-projects/:id
 *  - Built-in project pages                       → /21k-art, /canvas, /cards, etc.
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface ProjectPage {
  /** Full pathname used as the page slug in Media Generator config */
  slug: string;
  /** Human-readable label */
  label: string;
  /** Optional thumbnail URL */
  thumbnail?: string;
  /** Source category */
  source: 'builtin' | 'nostr-collab' | 'nostr-frl';
}

/** Static project pages that always exist (routes in AppRouter.tsx) */
const BUILTIN_PROJECT_PAGES: ProjectPage[] = [
  { slug: '/21k-art',            label: '21K Art',            source: 'builtin' },
  { slug: '/canvas',             label: '100M Canvas',        source: 'builtin' },
  { slug: '/cards',              label: 'POP Cards',          source: 'builtin' },
  { slug: '/free',               label: 'Free Downloads',     source: 'builtin' },
  { slug: '/games',              label: 'Games',              source: 'builtin' },
  { slug: '/animations',         label: 'Animations',         source: 'builtin' },
  { slug: '/studio',             label: 'Pop Art Studio',     source: 'builtin' },
  { slug: '/print',              label: 'Print Shop',         source: 'builtin' },
  { slug: '/NFT',                label: 'NFT Generator',      source: 'builtin' },
  { slug: '/wallpapers',         label: 'Wallpapers',         source: 'builtin' },
  { slug: '/gifs',               label: 'GIFs',               source: 'builtin' },
  { slug: '/avatars',            label: 'Avatars',            source: 'builtin' },
  { slug: '/banners',            label: 'Banners',            source: 'builtin' },
  { slug: '/coloring-pages',     label: 'Coloring Pages',     source: 'builtin' },
  { slug: '/desktop-wallpapers', label: 'Desktop Wallpapers', source: 'builtin' },
];

function getThumbFromEvent(event: { tags: string[][]; content: string }): string | undefined {
  try {
    const content = JSON.parse(event.content || '{}');
    const thumb =
      event.tags.find((t) => t[0] === 'image')?.[1] ||
      event.tags.find((t) => t[0] === 'header-image')?.[1] ||
      event.tags.find((t) => t[0] === 'thumb')?.[1] ||
      content.thumbnail ||
      (Array.isArray(content.images) && typeof content.images[0] === 'string'
        ? content.images[0]
        : undefined);
    return thumb || undefined;
  } catch {
    return undefined;
  }
}

export function useProjectPages() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['project-pages', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(6000)]);

      const [portfolioEvents, nostrProjectEvents, deletionEvents] = await Promise.all([
        nostr.query(
          [{ kinds: [36171], authors: [adminPubkey], '#t': ['bitpopart-project'], limit: 100 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [38171], authors: [adminPubkey], limit: 100 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [adminPubkey], limit: 300 }],
          { signal }
        ),
      ]);

      // Build deleted set
      const deletedAddresses = new Set<string>();
      deletionEvents.forEach((del) => {
        del.tags.forEach((tag) => {
          if (tag[0] === 'a') deletedAddresses.add(tag[1]);
          if (tag[0] === 'e') deletedAddresses.add(tag[1]);
        });
      });

      const isDeleted36171 = (event: { pubkey: string; id: string; tags: string[][] }) => {
        const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
        return (
          deletedAddresses.has(`36171:${event.pubkey}:${dTag}`) ||
          deletedAddresses.has(event.id)
        );
      };

      const isDeleted38171 = (event: { pubkey: string; id: string; tags: string[][] }) => {
        const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
        return (
          deletedAddresses.has(`38171:${event.pubkey}:${dTag}`) ||
          deletedAddresses.has(event.id)
        );
      };

      // ── FRL projects → /frl/:id ──────────────────────────────────────────
      const frlPages: ProjectPage[] = portfolioEvents
        .filter((e) => {
          const category = e.tags.find((t) => t[0] === 'category')?.[1];
          return !isDeleted36171(e) && category === 'frl';
        })
        .map((event): ProjectPage | null => {
          try {
            const content = JSON.parse(event.content || '{}');
            const id = event.tags.find((t) => t[0] === 'd')?.[1];
            const name = event.tags.find((t) => t[0] === 'name')?.[1] || content.name || id;
            if (!id || !name) return null;
            return { slug: `/frl/${id}`, label: name, thumbnail: getThumbFromEvent(event), source: 'nostr-frl' };
          } catch { return null; }
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      // ── Nostr collab projects → /nostr-projects/:id ──────────────────────
      // Deduplicate by title (keep newest per title, same logic as useNostrProjects)
      const liveCollabEvents = nostrProjectEvents.filter((e) => !isDeleted38171(e));
      const titleGroups = liveCollabEvents.reduce<Record<string, typeof liveCollabEvents>>((acc, e) => {
        const title = e.tags.find((t) => t[0] === 'title')?.[1] || '';
        if (!acc[title]) acc[title] = [];
        acc[title].push(e);
        return acc;
      }, {});
      const dedupedCollab = Object.values(titleGroups).map((group) =>
        group.sort((a, b) => b.created_at - a.created_at)[0]
      );

      const collabPages: ProjectPage[] = dedupedCollab
        .map((event): ProjectPage | null => {
          try {
            const content = JSON.parse(event.content || '{}');
            const id = event.tags.find((t) => t[0] === 'd')?.[1];
            const title = event.tags.find((t) => t[0] === 'title')?.[1] || content.title || id;
            if (!id || !title) return null;
            return { slug: `/nostr-projects/${id}`, label: title, thumbnail: getThumbFromEvent(event), source: 'nostr-collab' };
          } catch { return null; }
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        builtin: BUILTIN_PROJECT_PAGES,
        frl: frlPages,
        collab: collabPages,
        // all dynamic pages combined (for other consumers)
        dynamic: [...frlPages, ...collabPages],
      };
    },
    staleTime: 30_000,
    enabled: !!adminPubkey,
  });
}
