import { useState } from 'react';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import type { MarketplaceProduct } from '@/lib/sampleProducts';

export interface NostrMarketplace {
  id: string;
  name: string;
  url: string;
  description: string;
  logo: string;
  relays: string[];
  /** Which NIP format this marketplace prefers */
  formats: ('nip15' | 'nip99')[];
  color: string;
}

export const NOSTR_MARKETPLACES: NostrMarketplace[] = [
  {
    id: 'shopstr',
    name: 'Shopstr',
    url: 'https://shopstr.market',
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
  },
  {
    id: 'plebeian',
    name: 'Plebeian Market',
    url: 'https://plebeian.market',
    description: 'Self-sovereign marketplace. NIP-15 stalls & products. V4V, P2P, Bitcoin only.',
    logo: '⚡',
    relays: [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.primal.net',
      'wss://nostr.mom',
      'wss://adre.su',
    ],
    formats: ['nip15'],
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'conduit',
    name: 'Conduit Market',
    url: 'https://conduit.market',
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
  },
  {
    id: 'cypher',
    name: 'Cypher Space',
    url: 'https://cypher.space',
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
  },
];

/** Build a NIP-99 (kind 30402) classified listing from a product */
function buildNip99Event(product: MarketplaceProduct, userPubkey: string) {
  const dTag = `bitpopart-${product.id}`;
  const now = Math.floor(Date.now() / 1000);

  // Build image tags  
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

  // Content is markdown description for NIP-99
  const content = [
    `## ${product.name}`,
    '',
    product.description,
    '',
    `**Price:** ${product.price} ${product.currency}`,
    `**Category:** ${product.category}`,
    `**Type:** ${product.type === 'digital' ? 'Digital Download' : 'Physical Product'}`,
    '',
    product.specs && product.specs.length > 0
      ? `**Specs:**\n${product.specs.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
      : '',
    '',
    `*Listed by [BitPopArt](https://bitpopart.com) — Nostr pubkey: ${userPubkey.slice(0, 16)}...*`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  return {
    kind: 30402,
    content,
    tags,
    created_at: now,
  };
}

/** Build a NIP-15 (kind 30018) product event from a product */
function buildNip15Event(product: MarketplaceProduct) {
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
          } else if (Array.isArray(data) && data[0] === 'NOTICE') {
            // Just a notice, wait for OK
          }
        } catch {
          // Ignore parse errors
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

    // Set publishing state
    setPublishStatuses((prev) => ({
      ...prev,
      [product.id]: { productId: product.id, results: [], isPublishing: true },
    }));

    const allResults: PublishResult[] = [];

    // Collect unique relays per format needed
    const nip99Relays = new Set<string>();
    const nip15Relays = new Set<string>();

    for (const marketplace of targetMarketplaces) {
      for (const relay of marketplace.relays) {
        if (marketplace.formats.includes('nip99')) nip99Relays.add(relay);
        if (marketplace.formats.includes('nip15')) nip15Relays.add(relay);
      }
    }

    // Sign and publish NIP-99 event if needed
    if (nip99Relays.size > 0) {
      try {
        const nip99Unsigned = buildNip99Event(product, user.pubkey);
        const nip99Signed = await user.signer.signEvent(nip99Unsigned);

        for (const relay of nip99Relays) {
          const marketplace = targetMarketplaces.find((m) =>
            m.relays.includes(relay) && m.formats.includes('nip99')
          );
          const result = await publishToRelay(nip99Signed as Record<string, unknown>, relay);
          allResults.push({
            marketplaceId: marketplace?.id ?? 'unknown',
            relay,
            success: result.success,
            error: result.error,
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Signing failed';
        for (const relay of nip99Relays) {
          allResults.push({
            marketplaceId: 'unknown',
            relay,
            success: false,
            error: errMsg,
          });
        }
      }
    }

    // Sign and publish NIP-15 event if needed
    if (nip15Relays.size > 0) {
      try {
        const nip15Unsigned = buildNip15Event(product);
        const nip15Signed = await user.signer.signEvent(nip15Unsigned);

        for (const relay of nip15Relays) {
          const marketplace = targetMarketplaces.find((m) =>
            m.relays.includes(relay) && m.formats.includes('nip15')
          );
          const result = await publishToRelay(nip15Signed as Record<string, unknown>, relay);
          allResults.push({
            marketplaceId: marketplace?.id ?? 'unknown',
            relay,
            success: result.success,
            error: result.error,
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Signing failed';
        for (const relay of nip15Relays) {
          allResults.push({
            marketplaceId: 'unknown',
            relay,
            success: false,
            error: errMsg,
          });
        }
      }
    }

    const successCount = allResults.filter((r) => r.success).length;
    const failCount = allResults.filter((r) => !r.success).length;

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
