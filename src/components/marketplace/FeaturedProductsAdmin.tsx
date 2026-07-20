/**
 * FeaturedProductsAdmin
 *
 * Admin panel to pick and reorder which product thumbnails appear first
 * on the /shop page. Saved to Nostr so it works on every device.
 * Pinned products can be reordered by dragging.
 */

import { useMemo, useRef, useState, useCallback } from 'react';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useFeaturedProducts, useUpdateFeaturedProducts } from '@/hooks/useFeaturedProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star,
  StarOff,
  GripVertical,
  Package,
  Download,
  Trash2,
  LayoutGrid,
  Info,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/hooks/usePayment';
import type { MarketplaceProduct } from '@/lib/sampleProducts';

export function FeaturedProductsAdmin() {
  const { data: allProducts, isLoading: productsLoading } = useMarketplaceProducts();
  const { featuredIds, isLoading: featuredLoading } = useFeaturedProducts();
  const { mutate: updateFeatured, isPending: isSaving } = useUpdateFeaturedProducts();

  const isLoading = productsLoading || featuredLoading;

  // Local drag state — track which id is being dragged and which slot is hovered
  const dragSrcId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const toggle = (id: string) => {
    const next = featuredIds.includes(id)
      ? featuredIds.filter(x => x !== id)
      : [...featuredIds, id];
    updateFeatured(next);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    dragSrcId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image: use the element itself (default behaviour is fine)
  }, []);

  const handleDragEnter = useCallback((id: string) => {
    if (dragSrcId.current && dragSrcId.current !== id) {
      setDragOverId(id);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      const srcId = dragSrcId.current;
      if (!srcId || srcId === targetId) return;

      const next = [...featuredIds];
      const fromIdx = next.indexOf(srcId);
      const toIdx = next.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return;

      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, srcId);
      updateFeatured(next);

      dragSrcId.current = null;
      setDragOverId(null);
    },
    [featuredIds, updateFeatured],
  );

  const handleDragEnd = useCallback(() => {
    dragSrcId.current = null;
    setDragOverId(null);
  }, []);

  // ── Derived lists ─────────────────────────────────────────────────────────────

  const featuredProducts = useMemo(() => {
    if (!allProducts) return [];
    return featuredIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is MarketplaceProduct => p !== undefined);
  }, [allProducts, featuredIds]);

  const unfeaturedProducts = useMemo(() => {
    if (!allProducts) return [];
    const set = new Set(featuredIds);
    return allProducts.filter(p => !set.has(p.id));
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
            <div className="flex-1">
              <h2 className="font-bold text-orange-700 dark:text-orange-300 text-lg leading-tight">
                Featured Products — Shop Homepage Order
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Pin products to the <strong>top of /shop</strong> in the order you choose.
                Saved to Nostr — visible to everyone instantly.
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge className="bg-orange-500 text-white border-0">
                  <Star className="h-3 w-3 mr-1 fill-white" />
                  {featuredIds.length} pinned
                </Badge>
                <Badge variant="outline">{(allProducts?.length ?? 0) - featuredIds.length} unpinned</Badge>
                {isSaving && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />Saving to Nostr…
                  </span>
                )}
                {featuredIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive gap-1 ml-auto"
                    onClick={() => updateFeatured([])}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-3 w-3" />Clear all
                  </Button>
                )}
              </div>
            </div>
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
          {/* Pinned */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
              <h3 className="font-semibold text-sm">
                Pinned — shown first on /shop
                {featuredProducts.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(drag to reorder)</span>
                )}
              </h3>
            </div>

            {featuredProducts.length === 0 ? (
              <Card className="border-dashed border-orange-200 dark:border-orange-800">
                <CardContent className="py-8 text-center">
                  <Star className="h-10 w-10 mx-auto text-orange-300 mb-3" />
                  <p className="text-sm text-muted-foreground">No products pinned yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click ★ on any product below to feature it at the top.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {featuredProducts.map((product, idx) => (
                  <DraggableTile
                    key={product.id}
                    product={product}
                    position={idx + 1}
                    isDragOver={dragOverId === product.id}
                    onToggle={() => toggle(product.id)}
                    onDragStart={(e) => handleDragStart(product.id, e)}
                    onDragEnter={() => handleDragEnter(product.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(product.id)}
                    onDragEnd={handleDragEnd}
                    disabled={isSaving}
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
                  Unpinned — shown after pinned products
                </span>
              </div>
            </div>
          )}

          {/* Unpinned */}
          {unfeaturedProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StarOff className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-muted-foreground">Not Pinned</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {unfeaturedProducts.map(product => (
                  <StaticTile
                    key={product.id}
                    product={product}
                    onToggle={() => toggle(product.id)}
                    disabled={isSaving}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Changes are saved to Nostr instantly and visible to all visitors on every device.
            Drag pinned products to reorder them.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── DraggableTile (pinned products) ──────────────────────────────────────────

interface DraggableTileProps {
  product: MarketplaceProduct;
  position: number;
  isDragOver: boolean;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  disabled?: boolean;
}

function DraggableTile({
  product,
  position,
  isDragOver,
  onToggle,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  disabled,
}: DraggableTileProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all
        ring-2 ring-orange-400 ring-offset-1 cursor-grab active:cursor-grabbing select-none
        ${isDragOver ? 'scale-105 ring-orange-600 shadow-lg opacity-80' : 'hover:shadow-md'}
        ${disabled ? 'opacity-60 pointer-events-none' : ''}
      `}
    >
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover pointer-events-none" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {product.type === 'digital' ? <Download className="h-8 w-8 text-gray-300" /> : <Package className="h-8 w-8 text-gray-300" />}
          </div>
        )}

        {/* Position badge */}
        <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow">
          {position}
        </div>

        {/* Drag handle — visible on hover */}
        <div className="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 rounded p-0.5 text-white">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        {/* Star toggle (unpin) */}
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          title="Unpin"
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow bg-orange-500 text-white hover:bg-red-500"
        >
          <Star className="h-3.5 w-3.5 fill-white" />
        </button>
      </div>

      <div className="p-2">
        <p className="text-xs font-semibold leading-tight line-clamp-2">{product.name}</p>
        <p className="text-xs text-green-600 font-medium mt-0.5">{formatCurrency(product.price, product.currency)}</p>
      </div>
    </div>
  );
}

// ── StaticTile (unpinned products) ───────────────────────────────────────────

interface StaticTileProps {
  product: MarketplaceProduct;
  onToggle: () => void;
  disabled?: boolean;
}

function StaticTile({ product, onToggle, disabled }: StaticTileProps) {
  return (
    <div className={`group relative rounded-xl border overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {product.type === 'digital' ? <Download className="h-8 w-8 text-gray-300" /> : <Package className="h-8 w-8 text-gray-300" />}
          </div>
        )}

        {/* Star toggle (pin) */}
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          title="Pin to top"
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow bg-white/70 text-gray-500 hover:bg-orange-50 hover:text-orange-500 opacity-0 group-hover:opacity-100"
        >
          <Star className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-2">
        <p className="text-xs font-semibold leading-tight line-clamp-2">{product.name}</p>
        <p className="text-xs text-green-600 font-medium mt-0.5">{formatCurrency(product.price, product.currency)}</p>
      </div>
    </div>
  );
}
