/**
 * useProjectPages
 *
 * Fetches all dynamic pages from Nostr and combines with built-in pages
 * so the Media Generator admin has a complete, always-up-to-date list.
 *
 * Sources:
 *  - kind 38175  → Custom pages (/:slug) — /sneek, /bitcoinfriesland, /gamestr, etc.
 *  - kind 36171 frl → /frl/:id
 *  - kind 38171  → /nostr-projects/:id
 *  - BUILTIN_PROJECT_PAGES → hardcoded routes
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export interface ProjectPage {
  slug: string;
  label: string;
  thumbnail?: string;
  source: 'builtin' | 'custom-page' | 'nostr-collab' | 'nostr-frl';
}

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

// Same admin pubkey used in usePages.tsx
const PAGES_ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

function getThumb(event: { tags: string[][]; content: string }): string | undefined {
  try {
    const content = JSON.parse(event.content || '{}');
    return (
      event.tags.find((t) => t[0] === 'image')?.[1] ||
      event.tags.find((t) => t[0] === 'header')?.[1] ||
      event.tags.find((t) => t[0] === 'header-image')?.[1] ||
      event.tags.find((t) => t[0] === 'thumb')?.[1] ||
      content.thumbnail ||
      (Array.isArray(content.images) && typeof content.images[0] === 'string'
        ? content.images[0]
        : undefined) ||
      undefined
    );
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
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      const [
        customPageEvents,
        portfolioEvents,
        nostrProjectEvents,
        deletionEvents,
      ] = await Promise.all([
        // kind 38175 — custom pages (/:slug): Sneek, Bitcoinfriesland, gamestr, etc.
        nostr.query(
          [{ kinds: [38175], authors: [PAGES_ADMIN_PUBKEY], limit: 100 }],
          { signal }
        ),
        // kind 36171 — portfolio / frl projects
        nostr.query(
          [{ kinds: [36171], authors: [adminPubkey], '#t': ['bitpopart-project'], limit: 100 }],
          { signal }
        ),
        // kind 38171 — Nostr collaborative projects
        nostr.query(
          [{ kinds: [38171], authors: [adminPubkey], limit: 100 }],
          { signal }
        ),
        // kind 5 — deletion events (cover all authors)
        nostr.query(
          [{ kinds: [5], authors: [adminPubkey, PAGES_ADMIN_PUBKEY], limit: 400 }],
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

      const isDeleted = (kind: number, pubkey: string, dTag: string | undefined, eventId: string) => {
        return (
          deletedAddresses.has(`${kind}:${pubkey}:${dTag}`) ||
          deletedAddresses.has(eventId)
        );
      };

      // ── Custom pages (kind 38175) → /:slug ──────────────────────────────
      const customPages: ProjectPage[] = customPageEvents
        .filter((e) => {
          const id = e.tags.find((t) => t[0] === 'd')?.[1];
          return id && !isDeleted(38175, e.pubkey, id, e.id);
        })
        .map((event): ProjectPage | null => {
          const id = event.tags.find((t) => t[0] === 'd')?.[1];
          const title = event.tags.find((t) => t[0] === 'title')?.[1];
          if (!id || !title) return null;
          return {
            slug: `/${id}`,
            label: title,
            thumbnail: getThumb(event),
            source: 'custom-page',
          };
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      // ── FRL projects → /frl/:id ─────────────────────────────────────────
      const frlPages: ProjectPage[] = portfolioEvents
        .filter((e) => {
          const id = e.tags.find((t) => t[0] === 'd')?.[1];
          const category = e.tags.find((t) => t[0] === 'category')?.[1];
          return category === 'frl' && id && !isDeleted(36171, e.pubkey, id, e.id);
        })
        .map((event): ProjectPage | null => {
          try {
            const content = JSON.parse(event.content || '{}');
            const id = event.tags.find((t) => t[0] === 'd')?.[1];
            const name = event.tags.find((t) => t[0] === 'name')?.[1] || content.name || id;
            if (!id || !name) return null;
            return { slug: `/frl/${id}`, label: name, thumbnail: getThumb(event), source: 'nostr-frl' };
          } catch { return null; }
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      // ── Nostr collab projects → /nostr-projects/:id ─────────────────────
      // Deduplicate by title (keep newest per title)
      const liveCollab = nostrProjectEvents.filter((e) => {
        const id = e.tags.find((t) => t[0] === 'd')?.[1];
        return id && !isDeleted(38171, e.pubkey, id, e.id);
      });
      const titleGroups = liveCollab.reduce<Record<string, typeof liveCollab>>((acc, e) => {
        const title = e.tags.find((t) => t[0] === 'title')?.[1] || '';
        if (!acc[title]) acc[title] = [];
        acc[title].push(e);
        return acc;
      }, {});
      const dedupedCollab = Object.values(titleGroups).map((g) =>
        g.sort((a, b) => b.created_at - a.created_at)[0]
      );

      const collabPages: ProjectPage[] = dedupedCollab
        .map((event): ProjectPage | null => {
          try {
            const content = JSON.parse(event.content || '{}');
            const id = event.tags.find((t) => t[0] === 'd')?.[1];
            const title = event.tags.find((t) => t[0] === 'title')?.[1] || content.title || id;
            if (!id || !title) return null;
            return { slug: `/nostr-projects/${id}`, label: title, thumbnail: getThumb(event), source: 'nostr-collab' };
          } catch { return null; }
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        customPages,   // kind 38175 — /:slug (Sneek, Bitcoinfriesland, gamestr, etc.)
        frl: frlPages, // kind 36171 frl — /frl/:id
        collab: collabPages, // kind 38171 — /nostr-projects/:id
        builtin: BUILTIN_PROJECT_PAGES,
        dynamic: [...customPages, ...frlPages, ...collabPages],
      };
    },
    staleTime: 30_000,
    enabled: !!adminPubkey,
  });
}
