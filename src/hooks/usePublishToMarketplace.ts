import { useState } from 'react';
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
      'wss://relay.damus.io',
      'wss://relay.primal.net',
      'wss://relay.nostr.band',
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
    description: 'Self-sovereign marketplace. NIP-99 & NIP-15. V4V, P2P, Bitcoin only.',
    logo: '⚡',
    relays: [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.primal.net',
      'wss://nostr.mom',
      'wss://adre.su',
    ],
    formats: ['nip15', 'nip99'],
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
      'wss://relay.damus.io',
      'wss://relay.nostr.band',
      'wss://purplepag.es',
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
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.primal.net',
      'wss://relay.nostr.band',
    ],
    formats: ['nip99', 'nip15'],
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

/** Build a NIP-99 (kind 30402) classified listing from a product */
export function buildNip99Event(product: MarketplaceProduct, userPubkey: string) {
  const dTag = `bitpopart-${product.id}`;
  const now = Math.floor(Date.now() / 1000);

  const imageTags = product.images.map((url) => ['image', url]);

  const tags: string[][] = [
    ['d', dTag],
    ['title', product.name],
    ['summary', product.description.slice(0, 200)],
    ['published_at', now.toString()],
    ['price', product.price.toString(), product.currency.toUpperCase()],
    ['t', product.category.toLowerCase()],
    ['t', product.type],
    ['t', 'bitpopart'],
    ['t', 'bitcoin-art'],
    ['status', 'active'],
    ...imageTags,
  ];

  if (product.type === 'physical' && product.contact_url) {
    tags.push(['r', product.contact_url]);
  }

  const specsSection =
    product.specs && product.specs.length > 0
      ? `\n\n**Specs:**\n${product.specs.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
      : '';

  const content = `## ${product.name}

${product.description}

**Price:** ${product.price} ${product.currency}
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
}

export interface PublishStatus {
  productId: string;
  results: PublishResult[];
  isPublishing: boolean;
}

/** Publish a signed event to a relay via a plain WebSocket */
async function publishToRelay(
  signedEvent: Record<string, unknown>,
  relayUrl: string,
  timeoutMs = 8000
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    let ws: WebSocket | null = null;
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws?.close();
        resolve({ success: false, error: 'Timeout' });
      }
    }, timeoutMs);

    try {
      ws = new WebSocket(relayUrl);

      ws.onopen = () => {
        ws!.send(JSON.stringify(['EVENT', signedEvent]));
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data as string) as unknown[];
          if (Array.isArray(data) && data[0] === 'OK') {
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              ws?.close();
              const accepted = data[2] as boolean;
              if (accepted) {
                resolve({ success: true });
              } else {
                resolve({ success: false, error: (data[3] as string) || 'Relay rejected' });
              }
            }
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve({ success: false, error: 'WebSocket error' });
        }
      };

      ws.onclose = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          resolve({ success: false, error: 'Connection closed' });
        }
      };
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        resolve({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  });
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

    // Collect unique relays per format
    const nip99RelayMap = new Map<string, string>(); // relay -> marketplaceId
    const nip15RelayMap = new Map<string, string>();

    for (const marketplace of targetMarketplaces) {
      for (const relay of marketplace.relays) {
        if (marketplace.formats.includes('nip99') && !nip99RelayMap.has(relay)) {
          nip99RelayMap.set(relay, marketplace.id);
        }
        if (marketplace.formats.includes('nip15') && !nip15RelayMap.has(relay)) {
          nip15RelayMap.set(relay, marketplace.id);
        }
      }
    }

    // Sign and publish NIP-99
    if (nip99RelayMap.size > 0) {
      try {
        const unsigned = buildNip99Event(product, user.pubkey);
        const signed = await user.signer.signEvent(unsigned);
        for (const [relay, mId] of nip99RelayMap) {
          const result = await publishToRelay(signed as Record<string, unknown>, relay);
          allResults.push({ marketplaceId: mId, relay, ...result });
        }
      } catch (err) {
        for (const [relay, mId] of nip99RelayMap) {
          allResults.push({
            marketplaceId: mId,
            relay,
            success: false,
            error: err instanceof Error ? err.message : 'Signing failed',
          });
        }
      }
    }

    // Sign and publish NIP-15
    if (nip15RelayMap.size > 0) {
      try {
        const unsigned = buildNip15Event(product);
        const signed = await user.signer.signEvent(unsigned);
        for (const [relay, mId] of nip15RelayMap) {
          const result = await publishToRelay(signed as Record<string, unknown>, relay);
          allResults.push({ marketplaceId: mId, relay, ...result });
        }
      } catch (err) {
        for (const [relay, mId] of nip15RelayMap) {
          allResults.push({
            marketplaceId: mId,
            relay,
            success: false,
            error: err instanceof Error ? err.message : 'Signing failed',
          });
        }
      }
    }

    const successCount = allResults.filter((r) => r.success).length;
    const failCount = allResults.filter((r) => !r.success).length;

    // Persist publish history
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
        description: `${successCount} relay${successCount !== 1 ? 's' : ''} accepted your listing.${failCount > 0 ? ` ${failCount} failed.` : ''}`,
      });
    } else {
      toast({
        title: 'Publish Failed',
        description: 'All relays rejected or timed out. Check your connection and try again.',
        variant: 'destructive',
      });
    }

    return allResults;
  };

  return { publishProduct, publishStatuses };
}
