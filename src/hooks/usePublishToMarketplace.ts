import { useState } from 'react';
import { NPool, NRelay1 } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminNpub, getAdminPubkeyHex } from '@/lib/adminUtils';
import type { MarketplaceProduct } from '@/lib/sampleProducts';

// BitPopArt admin Nostr identity — sourced from adminUtils so there's a single source of truth
export const ADMIN_NPUB = getAdminNpub();       // npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz
export const ADMIN_HEX_PUBKEY = getAdminPubkeyHex(); // 43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c

export interface NostrMarketplace {
  id: string;
  name: string;
  url: string;
  /** Direct link to the admin's shop/profile page on this marketplace */
  shopUrl: string;
  /** Optional search URL for listings by this seller */
  searchUrl?: string;
  description: string;
  logo: string;
  relays: string[];
  /** Which NIP format this marketplace prefers */
  formats: ('nip15' | 'nip99')[];
  color: string;
  colorLight: string;
}

export const NOSTR_MARKETPLACES: NostrMarketplace[] = [
  {
    id: 'shopstr',
    name: 'Shopstr',
    url: 'https://shopstr.market',
    shopUrl: `https://shopstr.market/${ADMIN_NPUB}`,
    description: 'Bitcoin-native Nostr marketplace. NIP-99 classified listings. Pay with Lightning or Cashu.',
    logo: '🛒',
    relays: [
      'wss://nos.lol',
      'wss://relay.primal.net',
      'wss://relay.damus.io',
      'wss://relay.ditto.pub',
    ],
    formats: ['nip99'],
    color: 'from-purple-500 to-violet-600',
    colorLight: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
  },
  {
    id: 'plebeian',
    name: 'Plebeian Market',
    url: 'https://plebeian.market',
    shopUrl: `https://plebeian.market/profile/${ADMIN_HEX_PUBKEY}`,
    // Plebeian Market migrated to NIP-99 in January 2026 — NIP-15 is no longer used.
    // Their own relays: relay.damus.io, nos.lol, relay.primal.net, relay.snort.social
    description: 'Self-sovereign marketplace. 100% NIP-99 (migrated Jan 2026). V4V, P2P, Bitcoin only.',
    logo: '⚡',
    relays: [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.primal.net',
      'wss://relay.snort.social',
    ],
    formats: ['nip99'],
    color: 'from-orange-500 to-amber-600',
    colorLight: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  },
  {
    id: 'conduit',
    name: 'Conduit Market',
    url: 'https://conduit.market',
    shopUrl: `https://shop.conduit.market`,
    searchUrl: `https://shop.conduit.market`,
    description: 'Decentralized marketplace on Nostr. NIP-99 listings. Zero fees, instant Bitcoin payouts.',
    logo: '🔗',
    relays: [
      'wss://relay.primal.net',
      'wss://nos.lol',
      'wss://relay.damus.io',
      'wss://relay.ditto.pub',
    ],
    formats: ['nip99'],
    color: 'from-blue-500 to-cyan-600',
    colorLight: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  },
  {
    id: 'cypher',
    name: 'Cypher Space',
    url: 'https://cypher.space',
    shopUrl: `https://cypher.space`,
    description: 'Bitcoin-only storefronts. Works with Shopstr, Plebeian, and Conduit. Publish once, appear everywhere.',
    logo: '🔐',
    relays: [
      'wss://nos.lol',
      'wss://relay.primal.net',
      'wss://relay.damus.io',
      'wss://relay.ditto.pub',
    ],
    formats: ['nip99'],
    color: 'from-green-500 to-teal-600',
    colorLight: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  },
];

// ─── Local-storage publish history ────────────────────────────────────────────
const PUBLISH_HISTORY_KEY = 'bitpopart_marketplace_publish_history';

export interface PublishHistoryEntry {
  productId: string;
  marketplaceId: string;
  publishedAt: number; // unix timestamp ms
  success: boolean;
}

export function getPublishHistory(): PublishHistoryEntry[] {
  try {
    const raw = localStorage.getItem(PUBLISH_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as PublishHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function savePublishHistory(history: PublishHistoryEntry[]) {
  localStorage.setItem(PUBLISH_HISTORY_KEY, JSON.stringify(history));
}

export function addPublishHistoryEntry(entry: PublishHistoryEntry) {
  const history = getPublishHistory();
  // Keep only the latest entry per (productId + marketplaceId)
  const filtered = history.filter(
    (h) => !(h.productId === entry.productId && h.marketplaceId === entry.marketplaceId)
  );
  filtered.push(entry);
  savePublishHistory(filtered);
}

export function getLastPublished(productId: string, marketplaceId: string): PublishHistoryEntry | undefined {
  return getPublishHistory().find(
    (h) => h.productId === productId && h.marketplaceId === marketplaceId
  );
}

// ─── Event builders ────────────────────────────────────────────────────────────

/**
 * Build a fully Gamma-Spec-compliant NIP-99 (kind 30402) classified listing.
 *
 * Tag schema (Gamma Spec):
 *   ["d", "<unique-id>"]
 *   ["title", "<name>"]
 *   ["price", "<amount>", "<ISO-4217>"]
 *   ["type", "simple|variable|variation", "digital|physical"]
 *   ["visibility", "on-sale|hidden|pre-order"]
 *   ["stock", "<integer>"]          — if quantity is known
 *   ["summary", "<short desc>"]
 *   ["published_at", "<unix-ts>"]
 *   ["image", "<url>", "", "<order>"] — repeated per image
 *   ["spec", "<key>", "<value>"]    — repeated per spec (replaces old content.specs)
 *   ["weight", "<value>", "<unit>"] — optional physical
 *   ["dim", "<lxwxh>", "<unit>"]    — optional physical
 *   ["shipping_option", "30406:<pubkey>:<d>"] — optional refs to kind 30406 events
 *   ["t", "<category>"]             — repeated
 *   ["status", "active|sold"]
 *   ["r", "<url>"]                  — contact / product URL
 *   ["alt", "<human readable>"]     — NIP-31
 */
export function buildNip99Event(product: MarketplaceProduct, userPubkey: string) {
  // Use existing event d-tag if it's already a NIP-99 event, otherwise mint a new one
  const existingDTag = (product as unknown as { sourceKind?: number }).sourceKind === 30402
    ? (product as unknown as { event?: { tags?: string[][] } }).event?.tags?.find(([t]) => t === 'd')?.[1]
    : undefined;
  const dTag = existingDTag || `bitpopart-${product.id}`;
  const now = Math.floor(Date.now() / 1000);

  const tags: string[][] = [
    ['d', dTag],
    ['title', product.name],
    ['summary', product.description.slice(0, 500)],
    ['published_at', now.toString()],
    ['price', product.price.toString(), product.currency.toUpperCase()],
    // Gamma Spec type tag: ["type", "simple|variable|variation", "digital|physical"]
    ['type', (product as unknown as { productSubtype?: string }).productSubtype || 'simple', product.type],
    // Gamma Spec visibility
    ['visibility', (product as unknown as { visibility?: string }).visibility || 'on-sale'],
    // Status (NIP-99 base)
    ['status', product.quantity === 0 ? 'sold' : 'active'],
  ];

  // Stock quantity (Gamma Spec)
  if (product.quantity !== undefined && product.quantity !== null) {
    tags.push(['stock', product.quantity.toString()]);
  }

  // Images with sort order (Gamma Spec: ["image", url, dims, order])
  product.images.forEach((url, index) => {
    tags.push(['image', url, '', index.toString()]);
  });

  // Specs as individual tags (Gamma Spec: ["spec", key, value])
  if (product.specs && product.specs.length > 0) {
    for (const [k, v] of product.specs) {
      if (k && v) tags.push(['spec', k, v]);
    }
  }

  // Physical product properties (Gamma Spec)
  const weight = (product as unknown as { weight?: { value: string; unit: string } }).weight;
  if (weight?.value && weight?.unit) {
    tags.push(['weight', weight.value, weight.unit]);
  }

  const dimensions = (product as unknown as { dimensions?: { dims: string; unit: string } }).dimensions;
  if (dimensions?.dims && dimensions?.unit) {
    tags.push(['dim', dimensions.dims, dimensions.unit]);
  }

  // Shipping option refs (Gamma Spec: ["shipping_option", "30406:<pubkey>:<d>"])
  const shippingOptionRefs = (product as unknown as { shippingOptionRefs?: Array<{ address: string; extraCost?: number }> }).shippingOptionRefs;
  if (shippingOptionRefs && shippingOptionRefs.length > 0) {
    for (const ref of shippingOptionRefs) {
      if (ref.extraCost !== undefined) {
        tags.push(['shipping_option', ref.address, ref.extraCost.toString()]);
      } else {
        tags.push(['shipping_option', ref.address]);
      }
    }
  }

  // Category / keyword tags
  tags.push(['t', product.category.toLowerCase()]);
  if (product.keyword_tags && product.keyword_tags.length > 0) {
    for (const tag of product.keyword_tags) {
      tags.push(['t', tag.toLowerCase()]);
    }
  }
  tags.push(['t', 'bitpopart']);
  tags.push(['t', 'bitcoin-art']);

  // Discount as extension tag (BitPopArt custom, NIP-99 allows extension)
  if (product.discount && product.discount > 0) {
    tags.push(['discount', product.discount.toString()]);
  }

  // Contact / product URL
  if (product.contact_url) {
    tags.push(['r', product.contact_url]);
  }

  // NIP-31 alt tag
  tags.push(['alt', `${product.type === 'digital' ? 'Digital' : 'Physical'} product: ${product.name} — ${product.price} ${product.currency}`]);

  // Markdown content (NIP-99 content field = human-readable description)
  const specsSection =
    product.specs && product.specs.length > 0
      ? `\n\n**Specs:**\n${product.specs.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
      : '';

  const content = `## ${product.name}

${product.description}

**Price:** ${product.price} ${product.currency}${product.discount ? ` ~~(-${product.discount}% off)~~` : ''}
**Category:** ${product.category}
**Type:** ${product.type === 'digital' ? 'Digital Download' : 'Physical Product'}${specsSection}

*Listed by [BitPopArt](https://bitpopart.com) — Nostr pubkey: ${userPubkey.slice(0, 16)}...*`;

  return {
    kind: 30402,
    content,
    tags,
    created_at: now,
  };
}

/** Build a NIP-15 (kind 30018) product event from a product */
export function buildNip15Event(product: MarketplaceProduct) {
  const dTag = `bitpopart-${product.id}`;
  const now = Math.floor(Date.now() / 1000);

  const productContent = {
    id: dTag,
    stall_id: 'bitpopart-stall',
    name: product.name,
    description: product.description,
    images: product.images,
    currency: product.currency,
    price: product.price,
    quantity: product.quantity ?? null,
    specs: product.specs ?? [],
    shipping:
      product.type === 'physical' && product.shipping
        ? product.shipping
        : [{ id: 'standard', cost: 0 }],
  };

  const tags: string[][] = [
    ['d', dTag],
    ['title', product.name],
    ['t', product.category.toLowerCase()],
    ['t', product.type],
    ['t', 'bitpopart'],
    ['price', product.price.toString()],
    ['currency', product.currency],
  ];

  if (product.quantity !== undefined) {
    tags.push(['quantity', product.quantity.toString()]);
  }

  for (const image of product.images) {
    tags.push(['image', image]);
  }

  return {
    kind: 30018,
    content: JSON.stringify(productContent),
    tags,
    created_at: now,
  };
}

// ─── Relay publish ──────────────────────────────────────────────────────────────

export interface PublishResult {
  marketplaceId: string;
  relay: string;
  success: boolean;
  error?: string;
  /** Raw relay response messages for debugging */
  log: string[];
}

export interface PublishStatus {
  productId: string;
  results: PublishResult[];
  isPublishing: boolean;
}

/**
 * Publish a signed event to a set of relays using a short-lived NPool.
 * The pool is created fresh, used once, then immediately closed so it
 * doesn't leak WebSocket connections into the main app pool.
 * NRelay1 inside NPool handles NIP-42 AUTH challenges automatically.
 */
async function publishViaRelays(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signedEvent: any,
  relayUrls: string[],
  signer: { signEvent: (e: object) => Promise<typeof signedEvent> },
  timeoutMs = 12000
): Promise<Array<{ relay: string; success: boolean; error?: string; log: string[] }>> {
  const results: Array<{ relay: string; success: boolean; error?: string; log: string[] }> = [];
  const relayLogs: Record<string, string[]> = {};
  for (const r of relayUrls) relayLogs[r] = [];

  let pool: NPool | null = null;
  try {
    pool = new NPool({
      open(url: string) {
        return new NRelay1(url, {
          auth: async (challenge: string) => {
            relayLogs[url]?.push(`← AUTH challenge, signing NIP-42…`);
            return signer.signEvent({
              kind: 22242,
              content: '',
              tags: [['relay', url], ['challenge', challenge]],
              created_at: Math.floor(Date.now() / 1000),
            });
          },
        });
      },
      eventRouter: (_event) => relayUrls,
      reqRouter: (filters) => {
        const map = new Map<string, typeof filters>();
        for (const r of relayUrls) map.set(r, filters);
        return map;
      },
    });

    // Publish to all relays in parallel using the pool
    const publishResults = await Promise.allSettled(
      relayUrls.map(async (relayUrl) => {
        relayLogs[relayUrl].push(`→ Sending EVENT kind:${signedEvent.kind}…`);
        try {
          await pool!.event(signedEvent, { signal: AbortSignal.timeout(timeoutMs) });
          relayLogs[relayUrl].push(`✓ Accepted`);
          return { relay: relayUrl, success: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          relayLogs[relayUrl].push(`✗ ${msg}`);
          return { relay: relayUrl, success: false, error: msg };
        }
      })
    );

    for (const r of relayUrls) {
      const settled = publishResults[relayUrls.indexOf(r)];
      if (settled.status === 'fulfilled') {
        results.push({ ...settled.value, log: relayLogs[r] });
      } else {
        const msg = settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
        results.push({ relay: r, success: false, error: msg, log: [...relayLogs[r], `✗ ${msg}`] });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    for (const r of relayUrls) {
      results.push({ relay: r, success: false, error: msg, log: [`✗ Pool error: ${msg}`] });
    }
  } finally {
    // Always close the pool to free all WebSocket connections
    try { pool?.close(); } catch { /* ignore */ }
  }

  return results;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function usePublishToMarketplace() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [publishStatuses, setPublishStatuses] = useState<Record<string, PublishStatus>>({});

  const publishProduct = async (
    product: MarketplaceProduct,
    selectedMarketplaceIds: string[]
  ) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to publish products to marketplaces.',
        variant: 'destructive',
      });
      return;
    }

    const targetMarketplaces = NOSTR_MARKETPLACES.filter((m) =>
      selectedMarketplaceIds.includes(m.id)
    );

    if (targetMarketplaces.length === 0) {
      toast({
        title: 'No Marketplaces Selected',
        description: 'Please select at least one marketplace to publish to.',
        variant: 'destructive',
      });
      return;
    }

    setPublishStatuses((prev) => ({
      ...prev,
      [product.id]: { productId: product.id, results: [], isPublishing: true },
    }));

    const allResults: PublishResult[] = [];

    // Collect unique relays for NIP-99. Map relay -> Set<marketplaceId> so a relay
    // shared by multiple marketplaces is published only once but credited to all of them.
    const nip99RelayMap = new Map<string, Set<string>>(); // relay -> Set<marketplaceId>

    for (const marketplace of targetMarketplaces) {
      if (!marketplace.formats.includes('nip99')) continue;
      for (const relay of marketplace.relays) {
        if (!nip99RelayMap.has(relay)) nip99RelayMap.set(relay, new Set());
        nip99RelayMap.get(relay)!.add(marketplace.id);
      }
    }

    // Sign NIP-99 event once, publish to all NIP-99 relays in one pool, then fan
    // out results to every marketplace that listed that relay.
    if (nip99RelayMap.size > 0) {
      try {
        const unsigned = buildNip99Event(product, user.pubkey);
        const signed = await user.signer.signEvent(unsigned);
        const relayList = Array.from(nip99RelayMap.keys());
        const relayResults = await publishViaRelays(signed, relayList, user.signer);
        for (const r of relayResults) {
          const mIds = nip99RelayMap.get(r.relay) ?? new Set(['unknown']);
          for (const mId of mIds) {
            allResults.push({ marketplaceId: mId, relay: r.relay, success: r.success, error: r.error, log: r.log });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Signing failed';
        for (const [relay, mIds] of nip99RelayMap) {
          for (const mId of mIds) {
            allResults.push({ marketplaceId: mId, relay, success: false, error: msg, log: [`✗ ${msg}`] });
          }
        }
      }
    }

    // Count unique relay successes/failures (each relay appears once per marketplace it serves,
    // so de-duplicate by relay URL for the summary message).
    const uniqueRelayResults = new Map<string, boolean>();
    for (const r of allResults) {
      // A relay is considered a success if at least one entry for it succeeded.
      uniqueRelayResults.set(r.relay, (uniqueRelayResults.get(r.relay) ?? false) || r.success);
    }
    const successCount = Array.from(uniqueRelayResults.values()).filter(Boolean).length;
    const failCount = Array.from(uniqueRelayResults.values()).filter((v) => !v).length;

    // Persist publish history — mark a marketplace as published if at least one of its
    // relays accepted the event.
    const now = Date.now();
    for (const mId of selectedMarketplaceIds) {
      const mResults = allResults.filter((r) => r.marketplaceId === mId);
      const mSuccess = mResults.some((r) => r.success);
      addPublishHistoryEntry({
        productId: product.id,
        marketplaceId: mId,
        publishedAt: now,
        success: mSuccess,
      });
    }

    setPublishStatuses((prev) => ({
      ...prev,
      [product.id]: { productId: product.id, results: allResults, isPublishing: false },
    }));

    if (successCount > 0) {
      toast({
        title: 'Published to Nostr Marketplaces!',
        description: `${successCount} relay${successCount !== 1 ? 's' : ''} accepted your listing.${failCount > 0 ? ` ${failCount} relay${failCount !== 1 ? 's' : ''} failed.` : ''}`,
      });
    } else {
      toast({
        title: 'Publish Failed',
        description: 'All relays rejected or timed out. Check connection and try again.',
        variant: 'destructive',
      });
    }

    return allResults;
  };

  return { publishProduct, publishStatuses };
}
