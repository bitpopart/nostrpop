import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/hooks/usePayment';
import { useMarketplaceProduct } from '@/hooks/useMarketplaceProducts';
import { useLivePrice } from '@/hooks/useLivePrice';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { ImageGallery } from '@/components/marketplace/ImageGallery';
import { ArrowLeft, Package, Truck, Star, Shield, Heart, Share2, ExternalLink, Zap, ShoppingCart } from 'lucide-react';

export function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useMarketplaceProduct(productId || '');
  const { toast } = useToast();

  // Fetch live price from source URL
  const { data: livePrice } = useLivePrice(
    product?.contact_url || product?.product_url,
    product?.price,
    product?.currency
  );

  // Always use USD as display currency
  const displayPrice = livePrice?.price ?? product?.price ?? 0;
  const sourceCurrency = livePrice?.currency ?? product?.currency ?? 'USD';
  const displayCurrency = 'USD';

  // Convert to USD if needed
  const [priceInUSD, setPriceInUSD] = useState<number>(displayPrice);

  // Fetch BTC price and calculate sats
  const { data: btcPrice } = useQuery({
    queryKey: ['btc-price-usd'],
    queryFn: async ({ signal }) => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
          { signal }
        );
        const data = await response.json();
        return data?.bitcoin?.usd || null;
      } catch (error) {
        console.warn('Failed to fetch BTC price:', error);
        return null;
      }
    },
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
  });

  // Calculate price in sats
  const displayPriceInSats = btcPrice && priceInUSD > 0 
    ? Math.round((priceInUSD / btcPrice) * 100000000)
    : livePrice?.priceInSats;

  // Convert source currency to USD if needed
  useEffect(() => {
    const convertToUSD = async () => {
      if (sourceCurrency === 'USD') {
        setPriceInUSD(displayPrice);
        return;
      }

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,${sourceCurrency.toLowerCase()}`
        );
        const data = await response.json();
        const usdRate = data?.bitcoin?.usd;
        const sourceRate = data?.bitcoin?.[sourceCurrency.toLowerCase()];

        if (usdRate && sourceRate) {
          // Convert through BTC as intermediate
          const priceInBTC = displayPrice / sourceRate;
          const converted = priceInBTC * usdRate;
          setPriceInUSD(converted);
        } else {
          setPriceInUSD(displayPrice);
        }
      } catch (error) {
        console.warn('Currency conversion failed:', error);
        setPriceInUSD(displayPrice);
      }
    };

    if (displayPrice > 0) {
      convertToUSD();
    }
  }, [displayPrice, sourceCurrency]);

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
  const hasBuyUrl = product.contact_url && product.contact_url.trim() !== '';

  const handleBuyProduct = () => {
    if (hasBuyUrl) {
      window.open(product.contact_url, '_blank', 'noopener,noreferrer');
      toast({
        title: "Redirecting to Store",
        description: "Opening product page on storeofvalue.eu...",
      });
    } else {
      // Fallback action when no contact URL is provided
      toast({
        title: "Purchase Link Unavailable",
        description: "This product doesn't have a purchase link. Please check the product description.",
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
                {product.type === 'digital' ? 'Digital Product' : 'Physical Product'}
              </Badge>
              {isOutOfStock && (
                <Badge variant="destructive" className="text-xs">
                  Out of Stock
                </Badge>
              )}
              {hasBuyUrl && (
                <Badge variant="default" className="text-xs bg-blue-500">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  External Product
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-xl text-muted-foreground mb-4">{product.description}</p>

            <div className="flex items-baseline flex-wrap gap-4 mb-4">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(priceInUSD, displayCurrency)}
              </div>
              {displayPriceInSats && (
                <div className="flex items-center text-xl text-orange-600">
                  <Zap className="w-5 h-5 mr-1" />
                  <span className="font-semibold">{displayPriceInSats.toLocaleString()} sats</span>
                </div>
              )}
            </div>
            {hasBuyUrl && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground italic">
                  * Price available at reseller's site (prices may vary)
                </p>
              </div>
            )}
            {hasShipping && shippingCost > 0 && (
              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Truck className="w-4 h-4 mr-1" />
                <span>+ {formatCurrency(shippingCost, displayCurrency)} shipping</span>
              </div>
            )}

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
                    onClick={handleBuyProduct}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    {hasBuyUrl ? (
                      <>
                        <ExternalLink className="w-5 h-5 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
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

              {/* Product Details */}
              {product.specs && product.specs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Product Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {product.specs.map(([key, value], index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Info */}
              {hasShipping && shippingCost > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      Shipping
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Standard shipping: {formatCurrency(shippingCost, displayCurrency)}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Source Link */}
              {hasBuyUrl && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-blue-700 dark:text-blue-300">
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href={product.contact_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {product.contact_url}
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">
                      Live prices fetched from source
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}