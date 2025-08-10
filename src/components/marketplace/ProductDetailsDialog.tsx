import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/hooks/usePayment';
import { PaymentDialog } from './PaymentDialog';
import {
  ShoppingCart,
  Package,
  Download,
  Truck,
  Calendar,
  User,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MarketplaceProduct {
  id: string;
  event?: unknown; // NostrEvent - optional for sample data
  name: string;
  description: string;
  images: string[];
  currency: string;
  price: number;
  quantity?: number;
  category: string;
  type: 'physical' | 'digital';
  specs?: Array<[string, string]>;
  shipping?: Array<{ id: string; cost: number }>;
  digital_files?: string[];
  stall_id: string;
  created_at: string;
}

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MarketplaceProduct;
}

export function ProductDetailsDialog({ open, onOpenChange, product }: ProductDetailsDialogProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;
  const hasShipping = product.shipping && product.shipping.length > 0;
  const shippingCost = hasShipping ? product.shipping![0].cost : 0;
  const createdDate = new Date(product.created_at);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleBuyNow = () => {
    setPaymentDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {product.type === 'digital' ? (
                <Download className="w-5 h-5" />
              ) : (
                <Package className="w-5 h-5" />
              )}
              <span>{product.name}</span>
            </DialogTitle>
            <DialogDescription>
              {product.category} • Listed on {createdDate.toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Images */}
            <div className="space-y-4">
              {product.images.length > 0 ? (
                <div className="space-y-4">
                  <div
                    className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer group"
                    onClick={() => {
                      if (product.type === 'digital') {
                        setPaymentDialogOpen(true);
                      }
                    }}
                  >
                    <img
                      src={product.images[selectedImage]}
                      alt={`${product.name} - Image ${selectedImage + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />

                    {/* Click to buy overlay for digital products */}
                    {product.type === 'digital' && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg">
                          <span className="text-sm font-medium">Click to Buy</span>
                        </div>
                      </div>
                    )}

                    {/* Navigation arrows */}
                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Image counter */}
                    {product.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {selectedImage + 1} / {product.images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {product.images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                            index === selectedImage
                              ? 'border-purple-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                  {product.type === 'digital' ? (
                    <div className="text-center">
                      <Download className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Digital Product</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Physical Product</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={product.type === 'digital' ? 'default' : 'secondary'}>
                    {product.type === 'digital' ? (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        Digital
                      </>
                    ) : (
                      <>
                        <Package className="w-3 h-3 mr-1" />
                        Physical
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">{product.category}</Badge>
                  {isOutOfStock && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>

                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(product.price, product.currency)}
                </div>

                {product.type === 'physical' && hasShipping && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Truck className="w-4 h-4 mr-1" />
                    <span>+ {formatCurrency(shippingCost, product.currency)} shipping</span>
                  </div>
                )}

                {product.quantity !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    {product.quantity} available
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.specs && product.specs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Specifications</h3>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {product.specs.map(([key, value], index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Digital Files Info */}
              {product.type === 'digital' && product.digital_files && product.digital_files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Included Files
                  </h3>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">
                        {product.digital_files.length} downloadable file{product.digital_files.length !== 1 ? 's' : ''} included
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Seller Info */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Seller
                </h3>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Stall:</span>
                        <span className="font-mono text-xs">{product.stall_id}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground text-xs">
                          Listed {createdDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Purchase Button */}
              <Button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : `Buy Now - ${formatCurrency(product.price + (product.type === 'physical' ? shippingCost : 0), product.currency)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        product={product}
      />
    </>
  );
}