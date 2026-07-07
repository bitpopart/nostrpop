/**
 * useMarketplaceProducts — NIP-99 (Gamma Spec) product listing hook
 *
 * Queries kind 30402 (NIP-99 classified listings) as the primary format,
 * with kind 30018 (NIP-15) as a legacy fallback. Products from both kinds
 * are merged and deduplicated by d-tag.
 *
 * Gamma Spec tags supported:
 *   - type: ["type", "simple|variable|variation", "digital|physical"]
 *   - visibility: ["visibility", "on-sale|hidden|pre-order"]
 *   - stock: ["stock", "<integer>"]
 *   - summary: ["summary", "<short desc>"]
 *   - spec: ["spec", "<key>", "<value>"] (multi)
 *   - image: ["image", "<url>", "<dims>", "<order>"] (multi)
 *   - weight: ["weight", "<value>", "<unit>"]
 *   - dim: ["dim", "<lxwxh>", "<unit>"]
 *   - shipping_option: ["shipping_option", "30406:<pubkey>:<d>"]
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

// Local storage for deleted products (prevents them from reappearing)
const DELETED_PRODUCTS_KEY = 'nostrpop_deleted_products';

function getDeletedProducts(): Set<string> {
  try {
    const stored = localStorage.getItem(DELETED_PRODUCTS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function addDeletedProduct(productAddress: string) {
  const deleted = getDeletedProducts();
  deleted.add(productAddress);
  localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(deleted)));
  console.log(`📝 Stored deletion locally: ${productAddress}`);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GammaShippingOptionRef {
  /** Full addressable coordinate "30406:<pubkey>:<d-tag>" */
  address: string;
  /** Optional extra cost on top of the option's base price */
  extraCost?: number;
}

export interface MarketplaceProduct {
  id: string;
  event?: NostrEvent;
  /** Which Nostr kind this product came from (30402 = NIP-99, 30018 = NIP-15) */
  sourceKind: 30402 | 30018;
  name: string;
  description: string;
  /** Markdown description (NIP-99 content field) */
  markdownContent?: string;
  images: string[];
  currency: string;
  price: number;
  discount?: number;
  /** Stock quantity from ["stock", "<n>"] tag (Gamma Spec) */
  quantity?: number;
  /** Primary category (first non-type t tag) — kept for back-compat */
  category: string;
  /** All non-type t tags */
  tags: string[];
  /** Extra keyword tags beyond the primary category */
  keyword_tags: string[];
  type: 'physical' | 'digital';
  /** Gamma Spec product sub-type: "simple" | "variable" | "variation" */
  productSubtype?: 'simple' | 'variable' | 'variation';
  /** Gamma Spec visibility */
  visibility?: 'on-sale' | 'hidden' | 'pre-order';
  /** Specs as key/value pairs — from ["spec", k, v] tags (NIP-99/Gamma) or content.specs (NIP-15) */
  specs?: Array<[string, string]>;
  /** Weight tag from Gamma Spec: ["weight", value, unit] */
  weight?: { value: string; unit: string };
  /** Dimensions tag from Gamma Spec: ["dim", "lxwxh", unit] */
  dimensions?: { dims: string; unit: string };
  /** Shipping option references (Gamma Spec kind 30406 refs) */
  shippingOptionRefs?: GammaShippingOptionRef[];
  /** Legacy NIP-15 shipping (inline cost array) */
  shipping?: Array<{ id: string; cost: number }>;
  digital_files?: string[];
  digital_file_names?: string[];
  product_url?: string;
  contact_url?: string;
  stall_id: string;
  created_at: string;
}

// ─── Parsers ───────────────────────────────────────────────────────────────────

/**
 * Parse a NIP-99 (kind 30402) event into a MarketplaceProduct.
 * Returns null if the event is missing required fields.
 */
function parseNip99Event(event: NostrEvent): MarketplaceProduct | null {
  try {
    const getTag = (name: string) => event.tags.find(([t]) => t === name)?.[1];
    const getAllTags = (name: string) => event.tags.filter(([t]) => t === name);

    const dTag = getTag('d');
    const title = getTag('title');
    if (!dTag || !title) return null;

    // Price tag: ["price", "<amount>", "<currency>"]
    const priceTag = event.tags.find(([t]) => t === 'price');
    const price = priceTag ? Number(priceTag[1]) : 0;
    const currency = priceTag?.[2]?.toUpperCase() || 'USD';

    // Type tag: ["type", "simple|variable|variation", "digital|physical"]
    const typeTag = event.tags.find(([t]) => t === 'type');
    const productSubtype = (typeTag?.[1] as 'simple' | 'variable' | 'variation') || 'simple';
    const format = typeTag?.[2] || 'digital';
    const type: 'physical' | 'digital' = format === 'physical' ? 'physical' : 'digital';

    // Visibility tag
    const visibility = (getTag('visibility') as 'on-sale' | 'hidden' | 'pre-order') || 'on-sale';

    // Stock tag (Gamma Spec uses "stock", NIP-99 also allows it)
    const stockStr = getTag('stock');
    const quantity = stockStr !== undefined ? Number(stockStr) : undefined;

    // Category / keyword tags
    const tTags = getAllTags('t').map(([, v]) => v).filter(Boolean);
    const categoryTags = tTags.filter(tag => !['digital', 'physical'].includes(tag));
    const mainCategory = categoryTags[0] || 'Other';
    const keywordTags = categoryTags.slice(1);

    // Images: ["image", "<url>", "<dims>", "<order>"]
    // Sort by optional order field (3rd element), fall back to declaration order
    const imageTags = getAllTags('image')
      .map(([, url, , orderStr]) => ({ url, order: orderStr ? Number(orderStr) : Infinity }))
      .filter(({ url }) => !!url)
      .sort((a, b) => a.order - b.order)
      .map(({ url }) => url);

    // Spec tags: ["spec", "<key>", "<value>"]
    const specs: Array<[string, string]> = getAllTags('spec')
      .filter(t => t[1] && t[2])
      .map(([, k, v]) => [k, v]);

    // Weight tag: ["weight", "<value>", "<unit>"]
    const weightTag = event.tags.find(([t]) => t === 'weight');
    const weight = weightTag?.[1] && weightTag?.[2]
      ? { value: weightTag[1], unit: weightTag[2] }
      : undefined;

    // Dim tag: ["dim", "<lxwxh>", "<unit>"]
    const dimTag = event.tags.find(([t]) => t === 'dim');
    const dimensions = dimTag?.[1] && dimTag?.[2]
      ? { dims: dimTag[1], unit: dimTag[2] }
      : undefined;

    // Shipping option refs: ["shipping_option", "30406:<pubkey>:<d>", "<extra-cost>?"]
    const shippingOptionRefs: GammaShippingOptionRef[] = getAllTags('shipping_option')
      .filter(t => t[1])
      .map(([, address, extraCostStr]) => ({
        address,
        extraCost: extraCostStr ? Number(extraCostStr) : undefined,
      }));

    // Summary tag as fallback description
    const summary = getTag('summary') || '';
    const description = event.content
      ? event.content.replace(/^##.*$/m, '').replace(/\*\*.*?\*\*/g, '').trim().slice(0, 500)
      : summary;

    // Contact / product URLs
    const contactUrl = getTag('r') || getTag('contact') || undefined;

    // Status tag — map "sold" to out-of-stock
    const status = getTag('status');
    const effectiveQuantity = status === 'sold' ? 0 : quantity;

    // Discount from custom tag (not in NIP-99 spec but BitPopArt extension)
    const discountStr = getTag('discount');
    const discount = discountStr ? Number(discountStr) : undefined;

    return {
      id: dTag,
      event,
      sourceKind: 30402,
      name: title,
      description: description || summary,
      markdownContent: event.content || undefined,
      images: imageTags,
      currency,
      price,
      discount: discount && discount > 0 ? discount : undefined,
      quantity: effectiveQuantity,
      category: mainCategory,
      tags: categoryTags,
      keyword_tags: keywordTags,
      type,
      productSubtype,
      visibility,
      specs: specs.length > 0 ? specs : undefined,
      weight,
      dimensions,
      shippingOptionRefs: shippingOptionRefs.length > 0 ? shippingOptionRefs : undefined,
      shipping: [],
      digital_files: [],
      digital_file_names: [],
      contact_url: contactUrl,
      stall_id: 'default',
      created_at: new Date(event.created_at * 1000).toISOString(),
    };
  } catch (error) {
    console.warn('Failed to parse NIP-99 event:', error);
    return null;
  }
}

/**
 * Parse a NIP-15 (kind 30018) event into a MarketplaceProduct.
 * This is the legacy fallback parser.
 */
function parseNip15Event(event: NostrEvent): MarketplaceProduct | null {
  try {
    const content = JSON.parse(event.content || '{}');
    const dTag = event.tags.find(([name]) => name === 'd')?.[1] || content.id;
    const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
    const nameTag = event.tags.find(([name]) => name === 'name')?.[1];
    const priceTag = event.tags.find(([name]) => name === 'price')?.[1];
    const discountTag = event.tags.find(([name]) => name === 'discount')?.[1];
    const imageTags = event.tags
      .filter(([name]) => name === 'image' || name === 'thumb')
      .map(([, value]) => value)
      .filter(Boolean);
    const categoryTags = event.tags.filter(([name]) => name === 't').map(([, value]) => value);
    const name = content.name || titleTag || nameTag || 'Untitled product';
    const price = Number(content.price ?? priceTag ?? 0);
    const discount = content.discount !== undefined
      ? Number(content.discount)
      : discountTag ? Number(discountTag) : undefined;

    if (!dTag || !name) return null;

    const isDigital = categoryTags.includes('digital');
    const isPhysical = categoryTags.includes('physical');
    const type: 'physical' | 'digital' = isDigital ? 'digital' : isPhysical ? 'physical' : 'physical';
    const productTags = categoryTags.filter(tag => !['digital', 'physical'].includes(tag));
    const mainCategory = productTags[0] || 'Other';
    const keywordTags = productTags.slice(1);

    // Parse spec tags: ["spec", "<key>", "<value>"] (some NIP-15 events use this too)
    const specTags = event.tags.filter(([t]) => t === 'spec').filter(t => t[1] && t[2]);
    const specs: Array<[string, string]> = specTags.length > 0
      ? specTags.map(([, k, v]) => [k, v])
      : (content.specs || []);

    return {
      id: dTag,
      event,
      sourceKind: 30018,
      name,
      description: content.description || event.tags.find(([tagName]) => tagName === 'summary')?.[1] || '',
      images: Array.isArray(content.images) && content.images.length > 0 ? content.images : imageTags,
      currency: content.currency || event.tags.find(([tagName]) => tagName === 'currency')?.[1] || 'USD',
      price,
      discount: discount && discount > 0 ? discount : undefined,
      quantity: content.quantity,
      category: mainCategory,
      tags: productTags,
      keyword_tags: keywordTags,
      type,
      productSubtype: 'simple',
      visibility: 'on-sale',
      specs: specs.length > 0 ? specs : undefined,
      shipping: content.shipping || [],
      digital_files: content.digital_files || [],
      digital_file_names: content.digital_file_names || [],
      product_url: content.product_url,
      contact_url: content.contact_url,
      stall_id: content.stall_id || 'default',
      created_at: new Date(event.created_at * 1000).toISOString(),
    };
  } catch (error) {
    console.warn('Failed to parse NIP-15 event:', error);
    return null;
  }
}

// ─── Main hook ─────────────────────────────────────────────────────────────────

export function useMarketplaceProducts(category?: string) {
  const { nostr } = useNostr();
  const { user: _user } = useCurrentUser();
  const adminPubkey = getAdminPubkeyHex();

  const query = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      // Fetch NIP-99 (30402), NIP-15 (30018), and deletion events (5) in one request
      const allEvents = await nostr.query([
        {
          kinds: [30402, 30018],
          authors: [adminPubkey],
          limit: 500,
        },
        {
          kinds: [5],
          authors: [adminPubkey],
          limit: 1000,
        },
      ], { signal });

      const nip99Events = allEvents.filter(e => e.kind === 30402);
      const nip15Events = allEvents.filter(e => e.kind === 30018);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      console.log(`Found ${nip99Events.length} NIP-99 + ${nip15Events.length} NIP-15 products, ${deletionEvents.length} deletions`);

      // Build set of deleted product addresses
      const deletedAddresses = new Set<string>();
      deletionEvents.forEach(delEvent => {
        const aTags = delEvent.tags.filter(([name]) => name === 'a');
        aTags.forEach(([, address]) => {
          if (address && (address.startsWith('30402:') || address.startsWith('30018:'))) {
            deletedAddresses.add(address);
          }
        });
      });
      const locallyDeleted = getDeletedProducts();
      locallyDeleted.forEach(address => deletedAddresses.add(address));

      // Track which d-tags we've already processed (NIP-99 takes priority)
      const seenDTags = new Set<string>();
      const products: MarketplaceProduct[] = [];

      // Process NIP-99 events first (higher priority)
      for (const event of nip99Events) {
        const dTag = event.tags.find(([t]) => t === 'd')?.[1];
        if (!dTag) continue;
        const address = `30402:${event.pubkey}:${dTag}`;
        if (deletedAddresses.has(address)) continue;
        if (seenDTags.has(dTag)) continue;
        const product = parseNip99Event(event);
        if (product) {
          products.push(product);
          seenDTags.add(dTag);
        }
      }

      // Process NIP-15 events as fallback (skip if d-tag already seen from NIP-99)
      for (const event of nip15Events) {
        const dTag = event.tags.find(([t]) => t === 'd')?.[1];
        const contentId = (() => { try { return JSON.parse(event.content || '{}').id; } catch { return undefined; } })();
        const resolvedDTag = dTag || contentId;
        if (!resolvedDTag) continue;
        const address = `30018:${event.pubkey}:${resolvedDTag}`;
        if (deletedAddresses.has(address)) continue;
        if (seenDTags.has(resolvedDTag)) continue; // already have this product as NIP-99
        const product = parseNip15Event(event);
        if (product) {
          products.push(product);
          seenDTags.add(resolvedDTag);
        }
      }

      // Sort newest first
      return products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!adminPubkey,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
  });

  // Apply category filter client-side
  const filteredData = useMemo(() => {
    if (!query.data) return query.data;
    if (!category) return query.data;
    return query.data.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }, [query.data, category]);

  return { ...query, data: filteredData };
}

// ─── Single product hook ───────────────────────────────────────────────────────

export function useMarketplaceProduct(productId: string) {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['marketplace-product', productId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);

      // Fetch NIP-99 first, then NIP-15 as fallback, plus deletion events
      const allEvents = await nostr.query([
        { kinds: [30402, 30018], '#d': [productId], limit: 10 },
        { kinds: [5], authors: adminPubkey ? [adminPubkey] : undefined, limit: 500 },
      ], { signal });

      const nip99 = allEvents.filter(e => e.kind === 30402);
      const nip15 = allEvents.filter(e => e.kind === 30018);
      const deletionEvents = allEvents.filter(e => e.kind === 5);

      // Prefer NIP-99 over NIP-15
      const productEvent = nip99[0] || nip15[0];
      if (!productEvent) throw new Error('Product not found');

      // Check deletion
      const kindPrefix = productEvent.kind === 30402 ? '30402' : '30018';
      const productAddress = `${kindPrefix}:${productEvent.pubkey}:${productId}`;

      const locallyDeleted = getDeletedProducts();
      if (locallyDeleted.has(productAddress)) throw new Error('Product has been deleted');

      const isDeleted = deletionEvents.some(delEvent =>
        delEvent.tags.some(([name, value]) => name === 'a' && value === productAddress)
      );
      if (isDeleted) throw new Error('Product has been deleted');

      const product = productEvent.kind === 30402
        ? parseNip99Event(productEvent)
        : parseNip15Event(productEvent);

      if (!product) throw new Error('Failed to parse product');
      return product;
    },
    enabled: !!productId,
    staleTime: 30000,
    retry: 2,
  });
}

// ─── Delete hook ───────────────────────────────────────────────────────────────

export function useDeleteProduct() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('User must be logged in to delete products');

      // Try to delete both NIP-99 and NIP-15 versions
      const addresses = [
        `30402:${user.pubkey}:${productId}`,
        `30018:${user.pubkey}:${productId}`,
      ];

      const deletionEvent = {
        kind: 5,
        content: 'Product deleted',
        tags: addresses.map(addr => ['a', addr]),
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(deletionEvent);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      // Store both addresses locally
      addresses.forEach(addr => addDeletedProduct(addr));

      return { productId, addresses, deletionEvent: signedEvent };
    },
    onSuccess: (data) => {
      toast({
        title: 'Product Deleted',
        description: 'The product has been permanently deleted.',
      });

      queryClient.setQueriesData(
        { queryKey: ['marketplace-products'] },
        (oldData: MarketplaceProduct[] | undefined) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;
          return oldData.filter((product: MarketplaceProduct) => {
            const kindPrefix = product.sourceKind === 30402 ? '30402' : '30018';
            const addr = `${kindPrefix}:${product.event?.pubkey}:${product.id}`;
            return !data.addresses.includes(addr);
          });
        }
      );

      queryClient.removeQueries({ queryKey: ['marketplace-product', data.productId] });
      queryClient.cancelQueries({ queryKey: ['marketplace-products'] });
    },
    onError: (error) => {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the product. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
