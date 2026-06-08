import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { PageData, SocialMediaLink } from '@/lib/pageTypes';

const ADMIN_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';
const PAGES_STORAGE_KEY = 'bitpopart:pages';

/** Key for per-page body content (description / blocks JSON) */
function pageBodyKey(slug: string) {
  return `bitpopart:page-body:${slug}`;
}

/** Key for per-page brand-site HTML */
function pageSrcdocKey(slug: string) {
  return `bitpopart:page-srcdoc:${slug}`;
}

/**
 * Read the lightweight page index from localStorage.
 * Heavy fields (description, brand_site HTML) are stored separately.
 */
export function loadPagesFromStorage(): PageData[] {
  try {
    const raw = localStorage.getItem(PAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Re-hydrate heavy fields from their own keys
    return parsed.map((p: PageData) => {
      const body = localStorage.getItem(pageBodyKey(p.id));
      if (body !== null) p.description = body;

      if (p.brand_site_is_srcdoc) {
        const srcdoc = localStorage.getItem(pageSrcdocKey(p.id));
        if (srcdoc !== null) p.brand_site = srcdoc;
      }
      return p;
    });
  } catch { return []; }
}

/**
 * Persist pages locally.
 * Heavy fields are stored under separate keys to avoid hitting the quota.
 */
export function savePagesToStorage(pages: PageData[]): void {
  // Build lightweight index (strip heavy fields)
  const index = pages.map(p => {
    const { description: _desc, ...rest } = p;
    // Also strip brand_site HTML from index if it's srcdoc
    if (rest.brand_site_is_srcdoc) {
      return { ...rest, brand_site: undefined };
    }
    return rest;
  });

  // Save each page's heavy content separately
  pages.forEach(p => {
    try {
      localStorage.setItem(pageBodyKey(p.id), p.description ?? '');
    } catch { /* ignore individual failures */ }

    if (p.brand_site_is_srcdoc && p.brand_site) {
      try {
        localStorage.setItem(pageSrcdocKey(p.id), p.brand_site);
      } catch { /* ignore */ }
    }
  });

  // Remove orphaned body/srcdoc keys for deleted pages
  const currentIds = new Set(pages.map(p => p.id));
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('bitpopart:page-body:') || key.startsWith('bitpopart:page-srcdoc:')) {
      const slug = key.split(':').slice(2).join(':');
      if (!currentIds.has(slug)) {
        localStorage.removeItem(key);
        i--; // key removed, adjust index
      }
    }
  }

  localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(index));
}

/** Convert a Nostr kind-38175 event into a PageData object */
function eventToPageData(event: { id: string; pubkey: string; kind: number; content: string; tags: string[][]; created_at: number }): PageData | null {
  try {
    const id = event.tags.find(t => t[0] === 'd')?.[1];
    const title = event.tags.find(t => t[0] === 'title')?.[1];
    if (!id || !title) return null;

    const brandSiteTag = event.tags.find(t => t[0] === 'brand-site')?.[1];
    let resolvedBrandSite: string | undefined;
    let brandSiteIsHtmlSrcdoc = false;

    if (brandSiteTag === '__html__') {
      try {
        const parsed = JSON.parse(event.content);
        if (parsed.brand_site_html) {
          resolvedBrandSite = parsed.brand_site_html;
          brandSiteIsHtmlSrcdoc = true;
        }
      } catch { /* ignore */ }
    } else if (brandSiteTag?.startsWith('__local__:')) {
      // Legacy: HTML was stored in localStorage under this key
      const localHtml = localStorage.getItem(`page-html:${brandSiteTag.slice('__local__:'.length)}`);
      if (localHtml) { resolvedBrandSite = localHtml; brandSiteIsHtmlSrcdoc = true; }
    } else if (brandSiteTag && !brandSiteTag.startsWith('__')) {
      resolvedBrandSite = brandSiteTag;
    }

    const order = event.tags.find(t => t[0] === 'order')?.[1];

    return {
      id,
      title,
      description: event.content,
      header_image: event.tags.find(t => t[0] === 'header')?.[1],
      gallery_images: event.tags.filter(t => t[0] === 'image').map(t => t[1]),
      external_url: event.tags.find(t => t[0] === 'r')?.[1],
      brand_site: resolvedBrandSite,
      brand_site_inline: event.tags.find(t => t[0] === 'brand-site-inline')?.[1] === 'true',
      brand_site_is_srcdoc: brandSiteIsHtmlSrcdoc,
      author_pubkey: event.pubkey,
      created_at: new Date(event.created_at * 1000).toISOString(),
      show_in_footer: event.tags.find(t => t[0] === 'footer')?.[1] === 'true',
      order: order ? parseInt(order) : undefined,
      show_zap_button: event.tags.find(t => t[0] === 'zap-button')?.[1] === 'true',
      buy_me_coffee_url: event.tags.find(t => t[0] === 'buy-me-coffee')?.[1],
    };
  } catch { return null; }
}

/**
 * Fetch all pages — Nostr is source of truth for visitors,
 * localStorage fills in pages not yet synced or on admin's own browser.
 */
export function usePages() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['pages'],
    staleTime: 0,
    gcTime: 30000,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(4000)]);

      // Fetch from Nostr
      let nostrPages: PageData[] = [];
      try {
        const events = await nostr.query(
          [{ kinds: [38175], authors: [ADMIN_PUBKEY], limit: 50 }],
          { signal }
        );
        nostrPages = events
          .map(eventToPageData)
          .filter((p): p is PageData => p !== null);
      } catch { /* relay unavailable — fall back to localStorage */ }

      // Merge: localStorage pages fill in any that haven't reached the relay yet
      const localPages = loadPagesFromStorage();
      const nostrIds = new Set(nostrPages.map(p => p.id));
      const localOnly = localPages.filter(p => !nostrIds.has(p.id));

      return [...nostrPages, ...localOnly]
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
  });
}

/** Footer pages */
export function useFooterPages() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['footer-pages'],
    staleTime: 0,
    gcTime: 30000,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(4000)]);

      let nostrPages: PageData[] = [];
      try {
        const events = await nostr.query(
          [{ kinds: [38175], authors: [ADMIN_PUBKEY], '#footer': ['true'], limit: 20 }],
          { signal }
        );
        nostrPages = events
          .map(eventToPageData)
          .filter((p): p is PageData => p !== null);
      } catch { /* ignore */ }

      const localPages = loadPagesFromStorage().filter(p => p.show_in_footer);
      const nostrIds = new Set(nostrPages.map(p => p.id));
      const localOnly = localPages.filter(p => !nostrIds.has(p.id));

      return [...nostrPages, ...localOnly]
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    },
  });
}

/** Single page by slug */
export function usePage(slug: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['page', slug],
    staleTime: 0,
    gcTime: 30000,
    refetchOnMount: true,
    enabled: !!slug,
    // Return localStorage immediately as initial data so the page never shows
    // "not found" while waiting for the relay
    initialData: () => loadPagesFromStorage().find(p => p.id === slug) ?? undefined,
    initialDataUpdatedAt: 0, // treat as immediately stale so Nostr is still queried
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Try Nostr — it is the source of truth for all visitors
      try {
        const events = await nostr.query(
          [{ kinds: [38175], authors: [ADMIN_PUBKEY], '#d': [slug], limit: 1 }],
          { signal }
        );
        if (events.length > 0) {
          const page = eventToPageData(events[0]);
          if (page) return page;
        }
      } catch { /* relay unavailable */ }

      // Fall back to localStorage (works for admin's own browser)
      return loadPagesFromStorage().find(p => p.id === slug) ?? null;
    },
  });
}

/** Social media links — Nostr only */
export function useSocialMediaLinks() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['social-media-links'],
    staleTime: 10000,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [38176], authors: [ADMIN_PUBKEY], '#t': ['social-media'], limit: 20 }],
        { signal }
      );

      const links: SocialMediaLink[] = events
        .map((event): SocialMediaLink | null => {
          try {
            const content = JSON.parse(event.content);
            if (content.deleted) return null;
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const platform = event.tags.find(t => t[0] === 'platform')?.[1];
            const icon = event.tags.find(t => t[0] === 'icon')?.[1];
            const url = event.tags.find(t => t[0] === 'r')?.[1];
            const order = event.tags.find(t => t[0] === 'order')?.[1];
            if (!id || !platform || !url) return null;
            return { id, event, platform, icon: icon || '', url, author_pubkey: event.pubkey, order: order ? parseInt(order) : undefined };
          } catch { return null; }
        })
        .filter((l): l is SocialMediaLink => l !== null)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

      return links;
    },
  });
}
