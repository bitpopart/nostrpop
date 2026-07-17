/**
 * FeaturedProductsAdmin
 *
 * Admin panel to pick and reorder which product thumbnails appear first
 * when the /shop page is opened. Pinned products are shown at the top of the
 * product grid; the rest follow in their default Nostr order.
 */

import { useMemo } from 'react';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star,
  StarOff,
  ChevronUp,
  ChevronDown,
  Package,
  Download,
  Trash2,
  LayoutGrid,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/hooks/usePayment';
import type { MarketplaceProduct } from '@/lib/sampleProducts';

export function FeaturedProductsAdmin() {
  const { data: allProducts, isLoading } = useMarketplaceProducts();
  const {
    featuredIds,
    toggleFeatured,
    moveUp,
    moveDown,
    clearFeatured,
  } = useFeaturedProducts();

  // Products currently featured, in the admin-chosen order
  const featuredProducts = useMemo(() => {
    if (!allProducts) return [];
    return featuredIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is MarketplaceProduct => p !== undefined);
  }, [allProducts, featuredIds]);

  // Products NOT yet featured
  const unfeaturedProducts = useMemo(() => {
    if (!allProducts) return [];
    const featuredSet = new Set(featuredIds);
    return allProducts.filter(p => !featuredSet.has(p.id));
  }, [allProducts, featuredIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white flex-shrink-0">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-orange-700 dark:text-orange-300 text-lg leading-tight">
                Featured Products — Shop Homepage Thumbnails
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Pin the products you want visitors to see <strong>first</strong> when opening the{' '}
                <code className="text-xs bg-orange-100 dark:bg-orange-900/30 px-1 py-0.5 rounded">/shop</code> page.
                Pinned products appear at the top of the grid, in the order you set here.
                All other products follow below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Badge className="bg-orange-500 text-white border-0">
              <Star className="h-3 w-3 mr-1" />
              {featuredIds.length} pinned
            </Badge>
            <Badge variant="outline">
              {(allProducts?.length ?? 0) - featuredIds.length} unpinned
            </Badge>
            {featuredIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive gap-1 ml-auto"
                onClick={clearFeatured}
              >
                <Trash2 className="h-3 w-3" />
                Clear all pins
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── PINNED (featured) section ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
              <h3 className="font-semibold text-sm">
                Pinned — Shown First on /shop
                {featuredProducts.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (left to right, then top to bottom)
                  </span>
                )}
              </h3>
            </div>

            {featuredProducts.length === 0 ? (
              <Card className="border-dashed border-orange-200 dark:border-orange-800">
                <CardContent className="py-8 text-center">
                  <Star className="h-10 w-10 mx-auto text-orange-300 mb-3" />
                  <p className="text-sm text-muted-foreground">No products pinned yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click the <Star className="h-3 w-3 inline" /> icon on any product below to feature it at the top.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {featuredProducts.map((product, idx) => (
                  <FeaturedProductTile
                    key={product.id}
                    product={product}
                    position={idx + 1}
                    isFeatured={true}
                    onToggleFeatured={() => toggleFeatured(product.id)}
                    onMoveUp={idx > 0 ? () => moveUp(product.id) : undefined}
                    onMoveDown={idx < featuredProducts.length - 1 ? () => moveDown(product.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          {featuredProducts.length > 0 && unfeaturedProducts.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-muted-foreground/30" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground flex items-center gap-1.5">
                  <LayoutGrid className="h-3 w-3" />
                  Unpinned products — shown below the pinned ones
                </span>
              </div>
            </div>
          )}

          {/* ── UN-PINNED section ── */}
          {unfeaturedProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StarOff className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Not Pinned — Shown After Pinned Products
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {unfeaturedProducts.map(product => (
                  <FeaturedProductTile
                    key={product.id}
                    product={product}
                    position={null}
                    isFeatured={false}
                    onToggleFeatured={() => toggleFeatured(product.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!isLoading && (allProducts?.length ?? 0) === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Package className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-muted-foreground">No products found. Create products first.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Info box */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>How it works:</strong> Pinned products are stored locally in this browser.
              They are applied on top of the relay query result — pinned products always come first, in the order you set here.
            </p>
            <p>
              Use the <strong>↑ / ↓</strong> arrows to reorder. Click the star to pin or unpin.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tile component ──────────────────────────────────────────────────────────

interface FeaturedProductTileProps {
  product: MarketplaceProduct;
  position: number | null;
  isFeatured: boolean;
  onToggleFeatured: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function FeaturedProductTile({
  product,
  position,
  isFeatured,
  onToggleFeatured,
  onMoveUp,
  onMoveDown,
}: FeaturedProductTileProps) {
  return (
    <div className={`group relative rounded-xl border overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-shadow hover:shadow-md ${
      isFeatured ? 'ring-2 ring-orange-400 ring-offset-1' : ''
    }`}>
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {product.type === 'digital' ? (
              <Download className="h-8 w-8 text-gray-300" />
            ) : (
              <Package className="h-8 w-8 text-gray-300" />
            )}
          </div>
        )}

        {/* Position badge */}
        {isFeatured && position !== null && (
          <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow">
            {position}
          </div>
        )}

        {/* Reorder controls (only for pinned) */}
        {isFeatured && (onMoveUp || onMoveDown) && (
          <div className="absolute bottom-1 right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className="w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center"
                title="Move earlier"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className="w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center"
                title="Move later"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Star / Unstar overlay button */}
        <button
          type="button"
          onClick={onToggleFeatured}
          title={isFeatured ? 'Unpin from top' : 'Pin to top of shop'}
          className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow
            ${isFeatured
              ? 'bg-orange-500 text-white hover:bg-red-500'
              : 'bg-white/70 text-gray-500 hover:bg-orange-50 hover:text-orange-500 opacity-0 group-hover:opacity-100'
            }`}
        >
          {isFeatured
            ? <Star className="h-3.5 w-3.5 fill-white" />
            : <Star className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-semibold leading-tight line-clamp-2">{product.name}</p>
        <p className="text-xs text-green-600 font-medium mt-0.5">
          {formatCurrency(product.price, product.currency)}
        </p>
      </div>
    </div>
  );
}
