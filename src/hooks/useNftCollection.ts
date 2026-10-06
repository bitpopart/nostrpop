import { useEffect, useState } from 'react';

/**
 * useNftCollection — BitPopArt's Nonfungible.cash collection.
 *
 * The nonfungible.cash API has no CORS headers, and this site is a static
 * GitHub Pages SPA, so browsers cannot fetch it cross-origin directly.
 * Strategy:
 *  1. Same-origin build-time snapshot (public/nfts/collection.json, synced by
 *     scripts/sync-nfcs.mjs on every deploy) renders instantly — no network
 *     dependency, never blocked by CORS.
 *  2. Simultaneously a live refresh through the site's existing CORS proxy
 *     (proxy.shakespeare.diy, same one Fear & Greed / LNURL use). When it
 *     succeeds it replaces the snapshot, so newly minted NFTs appear without
 *     a redeploy. Proxy failures keep the snapshot silently.
 */
export interface NfcCard {
  title: string;
  h: string;
  created: number;
  status: string;
  image: string;
}

export interface NfcCollection {
  pubkey: string;
  name: string;
  profile_url: string;
  updated_at: number; // unix seconds
  total: number;
  cards: NfcCard[];
}

const PROFILE_PUBKEY = 'e85ccdd15333f88c34fbd63d5a352fc37d959c1b68157e519e655705c337a3b0';
const SNAPSHOT_URL = `${import.meta.env.BASE_URL || '/'}nfts/collection.json`;
const LIVE_API = `https://nonfungible.cash/api/profiles/${PROFILE_PUBKEY}`;
const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

/** Shape-check a parsed API response into a collection (or null). */
function normalize(raw: unknown): NfcCollection | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (!Array.isArray(d.cards) || d.cards.length === 0) return null;
  const cards = (d.cards as Record<string, unknown>[])
    .map((c) => {
      const h = typeof c.h === 'string' ? c.h : typeof c.id === 'string' ? c.id : '';
      return {
        title: typeof c.title === 'string' ? c.title : 'Untitled',
        h,
        created: typeof c.created === 'number' ? c.created : 0,
        status: typeof c.status === 'string' ? c.status : 'owned',
        image: h ? `https://nonfungible.cash/api/images/${h}` : '',
      };
    })
    .filter((c) => c.h && c.image)
    .sort((a, b) => b.created - a.created); // newest first
  if (cards.length === 0) return null;
  return {
    pubkey: typeof d.pubkey === 'string' ? d.pubkey : PROFILE_PUBKEY,
    name: typeof d.name === 'string' ? d.name : 'BitPopArt',
    profile_url:
      typeof d.profile_url === 'string'
        ? d.profile_url
        : `https://nonfungible.cash/p/${PROFILE_PUBKEY}`,
    updated_at: typeof d.updated_at === 'number' ? d.updated_at : Math.floor(Date.now() / 1000),
    total: cards.length,
    cards,
  };
}

export type NfcSource = 'loading' | 'snapshot' | 'live';

export function useNftCollection(): {
  collection: NfcCollection | null;
  source: NfcSource;
  error: boolean;
} {
  const [collection, setCollection] = useState<NfcCollection | null>(null);
  const [source, setSource] = useState<NfcSource>('loading');
  const [snapshotFailed, setSnapshotFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 1. Same-origin snapshot — instant, CORS-safe.
    fetch(SNAPSHOT_URL, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`snapshot HTTP ${r.status}`))))
      .then((raw) => normalize(raw))
      .then((c) => {
        if (cancelled) return;
        if (c) {
          setCollection(c);
          setSource('snapshot');
        } else {
          setSnapshotFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSnapshotFailed(true);
      });

    // 2. Live refresh via the site's CORS proxy. Non-blocking.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    fetch(CORS_PROXY + encodeURIComponent(LIVE_API), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`live HTTP ${r.status}`))))
      .then((raw) => normalize(raw))
      .then((c) => {
        if (cancelled || !c) return;
        setCollection((prev) => (prev && prev.updated_at > c.updated_at ? prev : c));
        setSource('live');
        setSnapshotFailed(false);
      })
      .catch(() => {
        /* proxy/API hiccup — keep snapshot */
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  // 'loading' only while nothing has arrived yet; if the snapshot itself
  // failed and live hasn't landed, surface it so the UI can show a fallback.
  const sourceOut: NfcSource =
    source === 'loading' && snapshotFailed ? 'snapshot' : source;

  return { collection, source: sourceOut, error: snapshotFailed && !collection };
}
