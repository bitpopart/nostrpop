import { useState, useMemo } from 'react';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Edit,
  Save,
  Loader2,
  Layers,
  X,
} from 'lucide-react';
import type { MarketplaceProduct } from '@/lib/sampleProducts';
import { formatCurrency } from '@/hooks/usePayment';

// ── Stock status helpers ────────────────────────────────────────────────────

type StockStatus = 'in_stock' | 'low' | 'out_of_stock' | 'unlimited';

function getStockStatus(product: MarketplaceProduct): StockStatus {
  if (product.type === 'digital') return 'unlimited';
  if (product.quantity === undefined || product.quantity === null) return 'unlimited';
  if (product.quantity <= 0) return 'out_of_stock';
  if (product.quantity <= 3) return 'low';
  return 'in_stock';
}

const STOCK_CONFIG: Record<StockStatus, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  dot: string;
}> = {
  in_stock: {
    label: 'In Stock',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    icon: CheckCircle2,
    dot: 'bg-green-500',
  },
  low: {
    label: 'Low on Stock',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    dot: 'bg-amber-500',
  },
  out_of_stock: {
    label: 'Out of Stock',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    icon: XCircle,
    dot: 'bg-red-500',
  },
  unlimited: {
    label: 'Unlimited',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    icon: Download,
    dot: 'bg-blue-400',
  },
};

function StockBadge({ product }: { product: MarketplaceProduct }) {
  const status = getStockStatus(product);
  const cfg = STOCK_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      <Icon className="h-3 w-3 flex-shrink-0" />
      {status === 'unlimited'
        ? 'Unlimited'
        : product.quantity !== undefined
        ? `${product.quantity} · ${cfg.label}`
        : cfg.label}
    </span>
  );
}

// ── Inline stock number editor for a single product ─────────────────────────

function InlineStockEditor({
  product,
  onSave,
  isSaving,
}: {
  product: MarketplaceProduct;
  onSave: (product: MarketplaceProduct, newQty: number | undefined) => void;
  isSaving: boolean;
}) {
  const isDigital = product.type === 'digital';
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(
    product.quantity !== undefined ? String(product.quantity) : ''
  );

  if (isDigital) {
    return (
      <span className="text-xs text-muted-foreground italic">Digital — ∞</span>
    );
  }

  if (!editing) {
    return (
      <button
        className="flex items-center gap-1 text-sm font-semibold hover:underline focus:outline-none"
        onClick={() => setEditing(true)}
        title="Click to edit stock"
      >
        {product.quantity !== undefined ? product.quantity : '—'}
        <Edit className="h-3 w-3 text-muted-foreground opacity-60" />
      </button>
    );
  }

  const handleSave = () => {
    const trimmed = value.trim();
    const num = trimmed === '' ? undefined : parseInt(trimmed, 10);
    onSave(product, isNaN(num as number) ? undefined : num);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min="0"
        className="h-7 w-20 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setEditing(false);
        }}
        autoFocus
        disabled={isSaving}
      />
      <Button
        size="sm"
        className="h-7 w-7 p-0"
        onClick={handleSave}
        disabled={isSaving}
        title="Save"
      >
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Save className="h-3 w-3" />
        )}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => setEditing(false)}
        disabled={isSaving}
        title="Cancel"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ── Bulk edit dialog ─────────────────────────────────────────────────────────

function BulkEditDialog({
  products,
  onClose,
  onSave,
  isSaving,
}: {
  products: MarketplaceProduct[];
  onClose: () => void;
  onSave: (updates: Array<{ product: MarketplaceProduct; qty: number | undefined }>) => void;
  isSaving: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    products.forEach((p) => {
      init[p.id] = p.quantity !== undefined ? String(p.quantity) : '';
    });
    return init;
  });

  const handleSave = () => {
    const updates = products
      .filter((p) => p.type !== 'digital')
      .map((p) => {
        const raw = values[p.id]?.trim();
        const qty = raw === '' ? undefined : parseInt(raw, 10);
        return {
          product: p,
          qty: isNaN(qty as number) ? undefined : qty,
        };
      });
    onSave(updates);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-orange-500" />
            Bulk Edit Stock — {products.length} product{products.length !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {products.map((product) => {
            const isDigital = product.type === 'digital';
            const status = getStockStatus(product);
            const cfg = STOCK_CONFIG[status];

            return (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border"
              >
                {/* Thumb */}
                <div className="h-10 w-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800 border">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{product.name}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium ${cfg.color}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Input */}
                {isDigital ? (
                  <span className="text-xs text-muted-foreground italic w-20 text-right">
                    Digital ∞
                  </span>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    className="h-8 w-24 text-sm"
                    value={values[product.id] ?? ''}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [product.id]: e.target.value }))
                    }
                    placeholder="qty"
                  />
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Stock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main StockManagement component ──────────────────────────────────────────

export function StockManagement() {
  const { data: products, isLoading, refetch } = useMarketplaceProducts();
  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StockStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Filter + sort
  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        filterStatus === 'all' || getStockStatus(p) === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [products, searchQuery, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const all = products ?? [];
    return {
      total: all.length,
      inStock: all.filter((p) => getStockStatus(p) === 'in_stock').length,
      low: all.filter((p) => getStockStatus(p) === 'low').length,
      outOfStock: all.filter((p) => getStockStatus(p) === 'out_of_stock').length,
      unlimited: all.filter((p) => getStockStatus(p) === 'unlimited').length,
    };
  }, [products]);

  // Selection helpers
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () =>
    setSelectedIds(new Set(filtered.map((p) => p.id)));

  const clearSelection = () => setSelectedIds(new Set());

  // Publish a single stock update
  const saveStock = (product: MarketplaceProduct, newQty: number | undefined) => {
    if (!user) return;
    setSavingId(product.id);

    const tags: string[][] = [
      ['d', product.id],
      ['title', product.name],
      ['t', product.category.toLowerCase()],
      ['t', product.type],
      ['price', String(product.price)],
      ['currency', product.currency],
    ];
    if (product.discount && product.discount > 0) {
      tags.push(['discount', String(product.discount)]);
    }
    if (newQty !== undefined) {
      tags.push(['quantity', String(newQty)]);
    }

    const content = {
      name: product.name,
      description: product.description,
      images: product.images,
      price: product.price,
      currency: product.currency,
      discount: product.discount,
      quantity: newQty,
      specs: product.specs,
      shipping: product.shipping,
      contact_url: product.contact_url,
      stall_id: product.stall_id,
      digital_files: product.digital_files,
      digital_file_names: product.digital_file_names,
    };

    publishEvent(
      { kind: 30018, content: JSON.stringify(content), tags },
      {
        onSuccess: () => {
          toast({
            title: 'Stock Updated',
            description: `"${product.name}" stock set to ${newQty ?? 'unset'}.`,
          });
          queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
          setSavingId(null);
        },
        onError: () => {
          toast({
            title: 'Update Failed',
            description: 'Could not save stock. Please try again.',
            variant: 'destructive',
          });
          setSavingId(null);
        },
      }
    );
  };

  // Bulk save
  const handleBulkSave = async (
    updates: Array<{ product: MarketplaceProduct; qty: number | undefined }>
  ) => {
    setIsBulkSaving(true);
    let done = 0;

    for (const { product, qty } of updates) {
      await new Promise<void>((resolve) => {
        const tags: string[][] = [
          ['d', product.id],
          ['title', product.name],
          ['t', product.category.toLowerCase()],
          ['t', product.type],
          ['price', String(product.price)],
          ['currency', product.currency],
        ];
        if (product.discount && product.discount > 0)
          tags.push(['discount', String(product.discount)]);
        if (qty !== undefined) tags.push(['quantity', String(qty)]);

        const content = {
          name: product.name,
          description: product.description,
          images: product.images,
          price: product.price,
          currency: product.currency,
          discount: product.discount,
          quantity: qty,
          specs: product.specs,
          shipping: product.shipping,
          contact_url: product.contact_url,
          stall_id: product.stall_id,
          digital_files: product.digital_files,
          digital_file_names: product.digital_file_names,
        };

        publishEvent(
          { kind: 30018, content: JSON.stringify(content), tags },
          {
            onSuccess: () => { done++; resolve(); },
            onError: () => { resolve(); },
          }
        );
      });
    }

    toast({
      title: 'Bulk Stock Updated',
      description: `Updated ${done} of ${updates.length} products.`,
    });

    queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
    setIsBulkSaving(false);
    setBulkOpen(false);
    clearSelection();
  };

  // Products for bulk edit
  const selectedProducts = (products ?? []).filter((p) => selectedIds.has(p.id));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { status: 'all', label: 'All Products', value: stats.total, color: 'text-foreground', bg: 'bg-muted/40', icon: Package },
            { status: 'in_stock', label: 'In Stock', value: stats.inStock, color: STOCK_CONFIG.in_stock.color, bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
            { status: 'low', label: 'Low on Stock', value: stats.low, color: STOCK_CONFIG.low.color, bg: 'bg-amber-50 dark:bg-amber-900/20', icon: AlertTriangle },
            { status: 'out_of_stock', label: 'Out of Stock', value: stats.outOfStock, color: STOCK_CONFIG.out_of_stock.color, bg: 'bg-red-50 dark:bg-red-900/20', icon: XCircle },
          ] as const
        ).map(({ status, label, value, color, bg, icon: Icon }) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-sm text-left transition-all hover:shadow-md ${bg} ${
              filterStatus === status ? 'ring-2 ring-orange-400' : ''
            }`}
          >
            <Icon className={`h-6 w-6 flex-shrink-0 ${color}`} />
            <div>
              <p className={`text-2xl font-black leading-tight ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkOpen(true)}
              className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Layers className="h-4 w-4" />
              Edit {selectedIds.size} selected
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={filtered.length === 0}
          >
            Select All
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {filterStatus !== 'all' && (
            <> · filtered by <strong>{STOCK_CONFIG[filterStatus].label}</strong></>
          )}
        </p>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-3">
            <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
            <p className="font-semibold text-muted-foreground">No products found</p>
            {filterStatus !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setFilterStatus('all')}>
                Clear filter
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product thumb grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((product) => {
            const status = getStockStatus(product);
            const cfg = STOCK_CONFIG[status];
            const isSelected = selectedIds.has(product.id);
            const isSavingThis = savingId === product.id;

            return (
              <div
                key={product.id}
                className={`relative group rounded-xl overflow-hidden border bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-orange-400' : ''
                }`}
              >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(product.id)}
                    className="h-4 w-4 bg-white/90 dark:bg-gray-900/90 border-gray-300 shadow"
                    aria-label={`Select ${product.name}`}
                  />
                </div>

                {/* Stock dot top-right */}
                <div className="absolute top-2 right-2 z-10">
                  <span
                    className={`h-3 w-3 rounded-full block ${cfg.dot} ring-2 ring-white dark:ring-gray-900`}
                    title={cfg.label}
                  />
                </div>

                {/* Product image */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      {product.type === 'digital' ? (
                        <Download className="h-8 w-8 text-gray-400" />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="p-2.5 space-y-1.5">
                  <p className="text-[11px] font-semibold truncate leading-tight" title={product.name}>
                    {product.name}
                  </p>

                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[11px] font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(product.price, product.currency)}
                    </span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                      {product.category}
                    </Badge>
                  </div>

                  {/* Stock status pill */}
                  <StockBadge product={product} />

                  {/* Inline stock editor */}
                  <div className="pt-0.5">
                    <InlineStockEditor
                      product={product}
                      onSave={saveStock}
                      isSaving={isSavingThis || isPublishing}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk edit dialog */}
      {bulkOpen && (
        <BulkEditDialog
          products={selectedProducts}
          onClose={() => setBulkOpen(false)}
          onSave={handleBulkSave}
          isSaving={isBulkSaving}
        />
      )}
    </div>
  );
}
