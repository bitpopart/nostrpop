import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/hooks/usePayment';
import { useMarketplaceProduct } from '@/hooks/useMarketplaceProducts';
import { useToast } from '@/hooks/useToast';
import { ImageGallery } from '@/components/marketplace/ImageGallery';
import { ArrowLeft, Package, Truck, Star, Shield, Heart, Share2, ExternalLink } from 'lucide-react';

export function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useMarketplaceProduct(productId || '');
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !product) {
      // Product not found, redirect to shop
      navigate('/shop');
    }
  }, [product, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null; // Will redirect in useEffect
  }

  const hasShipping = product.shipping && product.shipping.length > 0;
  const shippingCost = hasShipping && product.shipping ? product.shipping[0].cost : 0;
  const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;
  const hasContactUrl = product.contact_url && product.contact_url.trim() !== '';

  const handleContactSeller = () => {
    if (hasContactUrl) {
      window.open(product.contact_url, '_blank', 'noopener,noreferrer');
      toast({
        title: "Opening Contact Page",
        description: "Redirecting you to the seller's contact page...",
      });
    } else {
      // Fallback action when no contact URL is provided
      toast({
        title: "Contact Information Unavailable",
        description: "This seller hasn't provided contact information. Please check the product description for alternative contact methods.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="mb-6 hover:bg-purple-100 dark:hover:bg-purple-900/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>

          {/* Product Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Package className="w-3 h-3 mr-1" />
                Physical Product
              </Badge>
              {isOutOfStock && (
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {product.name}
            </h1>

            <div className="flex items-center space-x-4 mb-4">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(product.price, product.currency)}
              </div>
              {hasShipping && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Truck className="w-4 h-4 mr-1" />
                  <span>+ {formatCurrency(shippingCost, product.currency)} shipping</span>
                </div>
              )}
            </div>

            {product.quantity !== undefined && (
              <div className="text-sm text-muted-foreground mb-6">
                {product.quantity > 0 ? (
                  <span>{product.quantity} available</span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </div>
            )}
          </div>



          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Product Images */}
            <div className="space-y-4">
              <ImageGallery
                images={product.images}
                productName={product.name}
                showThumbnails={true}
                aspectRatio="square"
                className="border rounded-lg bg-white dark:bg-gray-800"
              />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Specifications */}
              {product.specs && product.specs.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Specifications</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {product.specs.map(([key, value], index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                          <span className="font-medium text-gray-600 dark:text-gray-400">{key}:</span>
                          <span className="text-gray-900 dark:text-gray-100">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <Button
                    size="lg"
                    disabled={isOutOfStock}
                    onClick={handleContactSeller}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    {hasContactUrl ? (
                      <>
                        <ExternalLink className="w-5 h-5 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Contact Seller'}
                      </>
                    ) : (
                      <>
                        <Package className="w-5 h-5 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Contact Seller'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="lg">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-green-600">
                    <Shield className="w-4 h-4" />
                    <span>Secure Purchase</span>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Star className="w-4 h-4" />
                    <span>Quality Guaranteed</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              {hasShipping && (
                <>
                  <Separator />
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Shipping Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Standard Shipping:</span>
                          <span className="font-medium">{formatCurrency(shippingCost, product.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Delivery:</span>
                          <span className="font-medium">5-7 business days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}