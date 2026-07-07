/**
 * sampleProducts.ts
 *
 * Re-exports the canonical MarketplaceProduct type from useMarketplaceProducts
 * (now using the NIP-99 / Gamma Spec schema) and keeps legacy helpers.
 *
 * All components that previously imported MarketplaceProduct from here will
 * automatically get the upgraded Gamma-Spec-compatible type.
 */

// Re-export the canonical type so existing imports continue to work
export type { MarketplaceProduct, GammaShippingOptionRef } from '@/hooks/useMarketplaceProducts';

export interface ShippingRegion {
  id: string;
  name: string;       // e.g. "Netherlands", "Europe", "Worldwide"
  countries: string;  // comma-separated ISO codes or country names, e.g. "NL" or "NL, BE, DE"
  cost: number;       // 0 = free shipping
}

// Sample products are no longer used in production — kept for reference only.
export const sampleProducts: import('@/hooks/useMarketplaceProducts').MarketplaceProduct[] = [];

export function getProductsByCategory(
  category?: string
): import('@/hooks/useMarketplaceProducts').MarketplaceProduct[] {
  if (!category || category === 'all') return sampleProducts;
  return sampleProducts.filter(
    (product) => product.category.toLowerCase() === category.toLowerCase()
  );
}

export function getProductById(
  id: string
): import('@/hooks/useMarketplaceProducts').MarketplaceProduct | undefined {
  return sampleProducts.find((product) => product.id === id);
}
