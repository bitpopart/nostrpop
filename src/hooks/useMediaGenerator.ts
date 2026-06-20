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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a page slug (e.g. "/projects/my-id") to a Nostr d-tag.
 * Leading slash is stripped; "/" becomes "home".
 * Inner slashes are preserved as-is (relay d-tag is just a string).
 */
export function slugToD(slug: string): string {
  const clean = slug.replace(/^\//, '') || 'home';
  return `${MEDIA_GEN_D_PREFIX}${clean}`;
}

/**
 * Convert a d-tag back to a page slug.
 */
export function dToSlug(dTag: string): string {
  const clean = dTag.replace(MEDIA_GEN_D_PREFIX, '');
  const slug = '/' + clean;
  return slug === '/home' ? '/' : slug;
}

// ─── Hook: read ALL page configs (no fixed list — fetches everything) ─────────

export function useAllMediaGenConfigs() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['media-gen-configs', adminPubkey],
    queryFn: async (c) => {
      if (!adminPubkey) return {} as Record<string, MediaGenPageConfig>;
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      // Query by t-tag 'media-generator' so we pick up any slug — including
      // dynamic project pages — without maintaining a fixed list.
      const events = await nostr.query(
        [
          {
            kinds: [MEDIA_GEN_KIND],
            authors: [adminPubkey],
            '#t': ['media-generator'],
            limit: 500,
          },
        ],
        { signal }
      );

      const configMap: Record<string, MediaGenPageConfig> = {};
      for (const event of events) {
        const dTag = event.tags.find(([n]) => n === 'd')?.[1];
        if (!dTag || !dTag.startsWith(MEDIA_GEN_D_PREFIX)) continue;
        const slug = dToSlug(dTag);
        try {
          const parsed = JSON.parse(event.content || '{}') as Partial<MediaGenPageConfig>;
          configMap[slug] = {
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
