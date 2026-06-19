import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useFreeDownloads } from './useFreeDownloads';
import { useAppMedia } from './useAppContent';
import { useAnimations } from './useAnimations';
import { useMarketplaceProducts } from './useMarketplaceProducts';
import { usePrintPosters } from './usePrintPosters';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

/**
 * Fetch the total count of blog posts published by the admin.
 */
function useBlogPostCount() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['blog-posts-count'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      const [events, deletionEvents] = await Promise.all([
        nostr.query(
          [{ kinds: [30023], authors: [adminPubkey], '#t': ['blog'], limit: 200 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [adminPubkey], limit: 500 }],
          { signal }
        ),
      ]);

      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        delEvent.tags.forEach(tag => {
          if (tag[0] === 'a') deletedAddresses.add(tag[1]);
        });
      });

      const filtered = events.filter(e => {
        const dTag = e.tags.find(t => t[0] === 'd')?.[1];
        if (dTag === 'artist-page') return false;
        const address = `30023:${e.pubkey}:${dTag}`;
        return !deletedAddresses.has(address);
      });

      return filtered.length;
    },
    enabled: !!adminPubkey,
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
  });
}

/**
 * Fetch the total count of Nostr projects published by the admin.
 */
function useProjectsCount() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['nostr-projects-count'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);

      const [events, deletionEvents] = await Promise.all([
        nostr.query(
          [{ kinds: [38171], authors: [adminPubkey], limit: 200 }],
          { signal }
        ),
        nostr.query(
          [{ kinds: [5], authors: [adminPubkey], limit: 500 }],
          { signal }
        ),
      ]);

      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        delEvent.tags.forEach(tag => {
          if (tag[0] === 'a' || tag[0] === 'e') deletedAddresses.add(tag[1]);
        });
      });

      const filtered = events.filter(e => {
        const dTag = e.tags.find(t => t[0] === 'd')?.[1];
        const address = `38171:${e.pubkey}:${dTag}`;
        return !deletedAddresses.has(address);
      });

      return filtered.length;
    },
    enabled: !!adminPubkey,
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
  });
}

/**
 * Fetch artwork count from BitPopArt admin.
 */
function useArtworksCount() {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['artworks-count'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      const allEvents = await nostr.query([
        { kinds: [39239, 30023], authors: [adminPubkey], limit: 300 },
        { kinds: [5], authors: [adminPubkey], limit: 500 },
      ], { signal });

      const artworkEvents = allEvents.filter(e => e.kind === 39239 || e.kind === 30023);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        delEvent.tags
          .filter(([n]) => n === 'a')
          .forEach(([, address]) => {
            if (address && (address.startsWith('39239:') || address.startsWith('30023:'))) {
              deletedAddresses.add(address);
            }
          });
      });

      const active = artworkEvents.filter(e => {
        const dTag = e.tags.find(([n]) => n === 'd')?.[1];
        const address = `${e.kind}:${e.pubkey}:${dTag}`;
        return !deletedAddresses.has(address);
      });

      return active.length;
    },
    enabled: !!adminPubkey,
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 2,
  });
}

/**
 * Aggregated content overview — item counts per section.
 * Each field is either a number (loaded) or undefined (loading).
 */
export interface ContentOverviewData {
  freeImages: number | undefined;
  gifs: number | undefined;
  wallpapers: number | undefined;
  desktopWallpapers: number | undefined;
  animations: number | undefined;
  news: number | undefined;
  projects: number | undefined;
  art: number | undefined;
  shop: number | undefined;
  print: number | undefined;
}

export function useContentOverview(): ContentOverviewData {
  const { data: freeDownloads } = useFreeDownloads();
  const { data: gifs } = useAppMedia('app-gif');
  const { data: wallpapers } = useAppMedia('app-wallpaper');
  const { data: desktopWallpapers } = useAppMedia('app-desktop-wallpaper');
  const { data: animations } = useAnimations();
  const { data: products } = useMarketplaceProducts();
  const { data: posters } = usePrintPosters();
  const { data: blogCount } = useBlogPostCount();
  const { data: projectsCount } = useProjectsCount();
  const { data: artworksCount } = useArtworksCount();

  return {
    freeImages: freeDownloads?.length,
    gifs: gifs?.length,
    wallpapers: wallpapers?.length,
    desktopWallpapers: desktopWallpapers?.length,
    animations: animations?.length,
    news: blogCount,
    projects: projectsCount,
    art: artworksCount,
    shop: products?.length,
    print: posters?.length,
  };
}
