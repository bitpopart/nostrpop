/**
 * useProjectPages
 *
 * Fetches all dynamic project pages from Nostr and combines them with
 * static built-in project pages so the Media Generator admin has a
 * complete, always-up-to-date list. New projects appear here automatically.
 *
 * Dynamic sources:
 *  - kind 36171 (#t=bitpopart-project, category=frl) → /frl/:id
 *  - kind 38171 (Nostr collaborative projects)       → /nostr-projects/:id
 *
 * Static sources: hardcoded BUILTIN_PROJECT_PAGES list
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
  /** Source type */
  source: 'builtin' | 'nostr-collab' | 'nostr-frl' | 'nostr-portfolio';
}

/** Static project pages that always exist (routes defined in AppRouter.tsx) */
const BUILTIN_PROJECT_PAGES: ProjectPage[] = [
  { slug: '/21k-art',            label: '21K Art',              source: 'builtin' },
  { slug: '/canvas',             label: '100M Canvas',          source: 'builtin' },
  { slug: '/cards',              label: 'POP Cards',            source: 'builtin' },
  { slug: '/free',               label: 'Free Downloads',       source: 'builtin' },
  { slug: '/games',              label: 'Games',                source: 'builtin' },
  { slug: '/animations',         label: 'Animations',           source: 'builtin' },
  { slug: '/studio',             label: 'Pop Art Studio',       source: 'builtin' },
  { slug: '/print',              label: 'Print Shop',           source: 'builtin' },
  { slug: '/NFT',                label: 'NFT Generator',        source: 'builtin' },
  { slug: '/wallpapers',         label: 'Wallpapers',           source: 'builtin' },
  { slug: '/gifs',               label: 'GIFs',                 source: 'builtin' },
  { slug: '/avatars',            label: 'Avatars',              source: 'builtin' },
  { slug: '/banners',            label: 'Banners',              source: 'builtin' },
  { slug: '/coloring-pages',     label: 'Coloring Pages',       source: 'builtin' },
  { slug: '/desktop-wallpapers', label: 'Desktop Wallpapers',   source: 'builtin' },
];

export function useProjectPages() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['project-pages', adminPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(6000)]);

      // Fetch both project kinds + deletion events in parallel
      const [portfolioEvents, nostrProjectEvents, deletionEvents] = await Promise.all([
        // kind 36171 — portfolio/frl/games projects
        nostr.query(
          [{ kinds: [36171], authors: [adminPubkey], '#t': ['bitpopart-project'], limit: 100 }],
          { signal }
        ),
        // kind 38171 — Nostr collaborative projects (/nostr-projects/:id)
        nostr.query(
          [{ kinds: [38171], authors: [adminPubkey], limit: 100 }],
          { signal }
        ),
        // kind 5 — deletion events
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

      // ── FRL projects → /frl/:id ─────────────────────────────────────────
      const frlPages: ProjectPage[] = portfolioEvents
        .filter((event) => {
          const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
          const addr = `36171:${event.pubkey}:${dTag}`;
          const category = event.tags.find((t) => t[0] === 'category')?.[1];
          return (
            !deletedAddresses.has(addr) &&
            !deletedAddresses.has(event.id) &&
            category === 'frl'
          );
        })
        .map((event) => {
          try {
            const content = JSON.parse(event.content || '{}');
            const id = event.tags.find((t) => t[0] === 'd')?.[1];
            const name =
              event.tags.find((t) => t[0] === 'name')?.[1] || content.name || id || 'FRL Project';
            const thumbnail =
              event.tags.find((t) => t[0] === 'image')?.[1] ||
              event.tags.find((t) => t[0] === 'thumb')?.[1] ||
              content.thumbnail ||
              '';
            if (!id) return null;
            return {
              slug: `/frl/${id}`,
              label: name,
              thumbnail: thumbnail || undefined,
              source: 'nostr-frl' as const,
            } satisfies ProjectPage;
          } catch {
            return null;
          }
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      // ── Portfolio projects (general category) ──────────────────────────
      // These mostly link to external URLs, but we include them with /projects#<id>
      // so the admin can optionally configure buttons for the /projects page context.
      const portfolioPages: ProjectPage[] = portfolioEvents
        .filter((event) => {
          const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
          const addr = `36171:${event.pubkey}:${dTag}`;
          const category = event.tags.find((t) => t[0] === 'category')?.[1];
          return (
            !deletedAddresses.has(addr) &&
            !deletedAddresses.has(event.id) &&
            (!category || category === 'general')
          );
        })
        .map((event) => {
          try {
            const content = JSON.parse(event.content || '{}');
            const id = event.tags.find((t) => t[0] === 'd')?.[1];
            const name =
              event.tags.find((t) => t[0] === 'name')?.[1] || content.name || id || 'Project';
            const thumbnail =
              event.tags.find((t) => t[0] === 'image')?.[1] ||
              event.tags.find((t) => t[0] === 'thumb')?.[1] ||
              content.thumbnail ||
              '';
            const externalUrl = event.tags.find((t) => t[0] === 'r')?.[1] || content.url || '';
            if (!id) return null;
            // If it has an external URL (http), there's no internal page to configure
            // so we skip it — buttons wouldn't show anyway (no internal route).
            if (externalUrl.startsWith('http')) return null;
            // Internal project link
            const internalUrl = externalUrl || `/projects/${id}`;
            return {
              slug: internalUrl,
              label: name,
              thumbnail: thumbnail || undefined,
              source: 'nostr-portfolio' as const,
            } satisfies ProjectPage;
          } catch {
            return null;
          }
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      // ── Nostr collaborative projects → /nostr-projects/:id ──────────────
      const collabPages: ProjectPage[] = nostrProjectEvents
        .filter((event) => {
          const dTag = event.tags.find((t) => t[0] === 'd')?.[1];
          const addr = `38171:${event.pubkey}:${dTag}`;
          return !deletedAddresses.has(addr) && !deletedAddresses.has(event.id);
        })
        .map((event) => {
          try {
            const content = JSON.parse(event.content || '{}');
            const id = event.tags.find((t) => t[0] === 'd')?.[1];
            const title =
              event.tags.find((t) => t[0] === 'title')?.[1] || content.title || id || 'Project';
            const thumbnail =
              event.tags.find((t) => t[0] === 'header-image')?.[1] ||
              event.tags.find((t) => t[0] === 'image')?.[1] ||
              (Array.isArray(content.images) && content.images[0]) ||
              '';
            if (!id) return null;
            return {
              slug: `/nostr-projects/${id}`,
              label: title,
              thumbnail: thumbnail || undefined,
              source: 'nostr-collab' as const,
            } satisfies ProjectPage;
          } catch {
            return null;
          }
        })
        .filter((p): p is ProjectPage => p !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        builtin: BUILTIN_PROJECT_PAGES,
        frl: frlPages,
        collab: collabPages,
        portfolio: portfolioPages,
        // Convenience: all dynamic pages combined
        dynamic: [...frlPages, ...collabPages, ...portfolioPages],
      };
    },
    staleTime: 30_000,
    enabled: !!adminPubkey,
  });
}
