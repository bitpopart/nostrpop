/**
 * useMediaGenerator
 *
 * Nostr-backed hook for the Media Generator feature.
 * Stores per-page configuration (which buttons are enabled + their content)
 * as addressable events (kind 30078) under the admin pubkey.
 *
 * D-tag format: `bitpop-media-gen:<pageSlug>`
 *
 * Config JSON (stored in content field):
 * {
 *   merch: { enabled: boolean; productIds: string[] },
 *   download: { enabled: boolean; items: DownloadItem[] },
 *   create: { enabled: boolean; templateIds: string[] },
 *   zap: { enabled: boolean },
 * }
 */

import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

export const MEDIA_GEN_KIND = 30078;
export const MEDIA_GEN_D_PREFIX = 'bitpop-media-gen:';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DownloadItem {
  id: string;
  label: string;
  url: string;
  /** gif | wallpaper | desktop | coloring | other */
  type: string;
  thumb?: string;
}

export interface MediaGenPageConfig {
  merch: {
    enabled: boolean;
    /** Product d-tag IDs from the shop */
    productIds: string[];
  };
  download: {
    enabled: boolean;
    items: DownloadItem[];
  };
  create: {
    enabled: boolean;
    /** Card template IDs */
    templateIds: string[];
  };
  zap: {
    enabled: boolean;
  };
}

export const DEFAULT_PAGE_CONFIG: MediaGenPageConfig = {
  merch: { enabled: false, productIds: [] },
  download: { enabled: false, items: [] },
  create: { enabled: false, templateIds: [] },
  zap: { enabled: false },
};

// List of all app pages with their route slugs
export const ALL_PAGES: { slug: string; label: string }[] = [
  { slug: '/', label: 'Home' },
  { slug: '/art', label: 'Art' },
  { slug: '/shop', label: 'Shop' },
  { slug: '/cards', label: 'Cards' },
  { slug: '/blog', label: 'Blog' },
  { slug: '/popup', label: 'Pop-Up Events' },
  { slug: '/artist', label: 'Artist' },
  { slug: '/projects', label: 'Projects' },
  { slug: '/fundraising', label: 'Fundraising' },
  { slug: '/vlog', label: 'Vlog' },
  { slug: '/wall', label: 'Wall' },
  { slug: '/wallpapers', label: 'Wallpapers' },
  { slug: '/gifs', label: 'Gifs' },
  { slug: '/avatars', label: 'Avatars' },
  { slug: '/banners', label: 'Banners' },
  { slug: '/coloring-pages', label: 'Coloring Pages' },
  { slug: '/desktop-wallpapers', label: 'Desktop Wallpapers' },
  { slug: '/free', label: 'Free Gallery' },
  { slug: '/animations', label: 'Animations' },
  { slug: '/studio', label: 'Studio' },
  { slug: '/badges', label: 'Badges' },
  { slug: '/feed', label: 'Feed' },
  { slug: '/community', label: 'Community' },
  { slug: '/print', label: 'Print' },
  { slug: '/NFT', label: 'NFT' },
  { slug: '/21k-art', label: '21K Art' },
  { slug: '/canvas', label: 'Canvas' },
  { slug: '/games', label: 'Games' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugToD(slug: string): string {
  // Replace leading slash with empty, then replace inner slashes
  const clean = slug.replace(/^\//, '') || 'home';
  return `${MEDIA_GEN_D_PREFIX}${clean}`;
}

// ─── Hook: read all page configs ──────────────────────────────────────────────

export function useAllMediaGenConfigs() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['media-gen-configs', adminPubkey],
    queryFn: async (c) => {
      if (!adminPubkey) return {} as Record<string, MediaGenPageConfig>;
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const events = await nostr.query(
        [
          {
            kinds: [MEDIA_GEN_KIND],
            authors: [adminPubkey],
            '#d': ALL_PAGES.map((p) => slugToD(p.slug)),
            limit: 200,
          },
        ],
        { signal }
      );

      const configMap: Record<string, MediaGenPageConfig> = {};
      for (const event of events) {
        const dTag = event.tags.find(([n]) => n === 'd')?.[1];
        if (!dTag || !dTag.startsWith(MEDIA_GEN_D_PREFIX)) continue;
        const slug = '/' + dTag.replace(MEDIA_GEN_D_PREFIX, '');
        const normalizedSlug = slug === '/home' ? '/' : slug;
        try {
          const parsed = JSON.parse(event.content || '{}') as Partial<MediaGenPageConfig>;
          configMap[normalizedSlug] = {
            merch: { enabled: false, productIds: [], ...parsed.merch },
            download: { enabled: false, items: [], ...parsed.download },
            create: { enabled: false, templateIds: [], ...parsed.create },
            zap: { enabled: false, ...parsed.zap },
          };
        } catch {
          // ignore bad JSON
        }
      }
      return configMap;
    },
    staleTime: 30_000,
    enabled: !!adminPubkey,
  });
}

// ─── Hook: read single page config ────────────────────────────────────────────

export function useMediaGenConfig(pageSlug: string) {
  const { data: allConfigs, isLoading } = useAllMediaGenConfigs();
  const config = allConfigs?.[pageSlug] ?? DEFAULT_PAGE_CONFIG;
  return { config, isLoading };
}

// ─── Hook: save a page config ─────────────────────────────────────────────────

export function useSaveMediaGenConfig() {
  const { mutate: createEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const save = (
    pageSlug: string,
    config: MediaGenPageConfig,
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    const dTag = slugToD(pageSlug);

    createEvent(
      {
        kind: MEDIA_GEN_KIND,
        content: JSON.stringify(config),
        tags: [
          ['d', dTag],
          ['alt', `BitPop Media Generator config for page: ${pageSlug}`],
          ['t', 'media-generator'],
        ],
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['media-gen-configs'] });
          options?.onSuccess?.();
        },
        onError: (err: Error) => {
          options?.onError?.(err);
        },
      }
    );
  };

  return { save, isPending };
}
