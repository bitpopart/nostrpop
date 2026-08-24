import type { MarketplaceProduct } from '@/lib/sampleProducts';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Template for re-publishing a product listing with leftover stock removed.
 * Used by the admin "Set digital downloads to Unlimited" one-time pass.
 */
export interface UnlimitedRepublishTemplate {
  kind: number;
  content: string;
  tags: string[][];
  /** The source listing event, so the re-publish preserves published_at. */
  prev: NostrEvent;
}

/**
 * Build a republish template that strips leftover stock from a digital product
 * listing, or null when the product is not digital or already has no stock cap
 * (nothing to change).
 *
 * NIP-99 (30402) stores stock as a Gamma `stock` tag — remove it and force the
 * status back to `active` (a digital download never sells out: unlimited).
 *
 * NIP-15 (30018) stores stock as `quantity` in the JSON content — drop the field.
 */
export function buildDigitalUnlimitedTemplate(
  product: MarketplaceProduct
): UnlimitedRepublishTemplate | null {
  if (product.type !== 'digital') return null;
  const ev = product.event;
  if (!ev) return null;

  if (product.sourceKind === 30402) {
    const hasStock = ev.tags.some(([name]) => name === 'stock');
    if (!hasStock) return null; // already unlimited

    // Drop the stock tag and force status back to active (a digital download
    // never sells out, so any leftover 'sold'/finite-cap state is wrong).
    const tags: string[][] = ev.tags
      .filter(([name]) => name !== 'stock')
      .map((tag) => (tag[0] === 'status' && tag[1] === 'sold')
        ? ['status', 'active', ...tag.slice(2)]
        : tag);
    if (!tags.some(([name]) => name === 'status')) tags.push(['status', 'active']);

    return { kind: 30402, content: ev.content, tags, prev: ev };
  }

  if (product.sourceKind === 30018) {
    let contentObj: Record<string, unknown>;
    try {
      contentObj = JSON.parse(ev.content || '{}');
    } catch {
      return null; // unparseable -> leave it alone
    }
    if (typeof contentObj !== 'object' || contentObj === null || !('quantity' in contentObj)) {
      return null; // no leftover quantity cap
    }
    const { quantity: _drop, ...rest } = contentObj;
    return { kind: 30018, content: JSON.stringify(rest), tags: ev.tags, prev: ev };
  }

  return null;
}

/** Count the digital products across `products` that still carry leftover stock. */
export function countDigitalWithLeftoverStock(products: MarketplaceProduct[]): number {
  return products.filter((p) => buildDigitalUnlimitedTemplate(p) !== null).length;
}
