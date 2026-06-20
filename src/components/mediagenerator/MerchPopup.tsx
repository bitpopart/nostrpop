/**
 * MerchPopup
 * Shows selected Shop products in a popup modal.
 * Products are pulled from Nostr (same as the /shop page).
 */

import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { useFiatToSats } from '@/hooks/useFiatToSats';
import { formatCurrency } from '@/hooks/usePayment';
import { ShoppingBag, ExternalLink, Zap } from 'lucide-react';

interface MerchPopupProps {
  open: boolean;
  onClose: () => void;
  productIds: string[];
}

function MerchProductCard({
  product,
  onClose,
}: {
  product: {
    id: string;
    name: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    category: string;
    type: 'physical' | 'digital';
    product_url?: string;
    contact_url?: string;
  };
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: satsConversion } = useFiatToSats(product.price, 'USD');

  const handleClick = () => {
    onClose();
    navigate(`/shop/${product.id}`);
  };

  const externalUrl = product.product_url || product.contact_url;

  return (
    <div className="flex gap-3 p-3 rounded-xl border border-border hover:border-purple-300 hover:shadow-sm transition-all bg-background group">
      {/* Image */}
      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-sm font-bold text-green-600">
              {formatCurrency(product.price, 'USD')}
            </p>
            {satsConversion && (
              <p className="text-xs text-orange-600 flex items-center gap-0.5">
                <Zap className="w-3 h-3" />
                {satsConversion.toLocaleString()} sats
              </p>
            )}
          </div>

          <div className="flex gap-1.5">
            {externalUrl ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-2"
                onClick={() => window.open(externalUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleClick}
              >
                <ShoppingBag className="w-3 h-3 mr-1" />
                Shop
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MerchPopup({ open, onClose, productIds }: MerchPopupProps) {
  const { data: allProducts, isLoading } = useMarketplaceProducts();

  // Filter to only selected products (keep original order from productIds)
  const products =
    productIds.length > 0
      ? productIds
          .map((id) => allProducts?.find((p) => p.id === id))
          .filter(Boolean)
      : allProducts ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <span className="text-2xl">👕</span>
            Merch Store
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? 'Loading products…'
              : `${products.length} item${products.length !== 1 ? 's' : ''} available`}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No products configured</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back soon for new merchandise!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(
                (p) =>
                  p && (
                    <MerchProductCard
                      key={p.id}
                      product={p}
                      onClose={onClose}
                    />
                  )
              )}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t shrink-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose();
              window.location.href = '/shop';
            }}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            View Full Shop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
