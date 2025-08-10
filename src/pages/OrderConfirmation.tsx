import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DigitalDownload } from '@/components/marketplace/DigitalDownload';
import { useMarketplaceProduct } from '@/hooks/useMarketplaceProducts';
import { formatCurrency } from '@/hooks/usePayment';
import {
  CheckCircle,
  Package,
  Download,
  Mail,
  MapPin,
  ArrowLeft,
  ShoppingCart,
  Truck,
  Clock
} from 'lucide-react';

interface BuyerInfo {
  email: string;
  name: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface MarketplaceProduct {
  id: string;
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
  digital_file_names?: string[];
  stall_id: string;
  created_at: string;
}

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber] = useState(() => `ORD-${Date.now().toString(36).toUpperCase()}`);

  // Get data from navigation state or URL params
  const stateProduct = location.state?.product as MarketplaceProduct;
  const buyerInfo = location.state?.buyerInfo as BuyerInfo;
  const totalPrice = location.state?.totalPrice as number;
  const paymentMethod = location.state?.paymentMethod as string;

  const productId = searchParams.get('product');
  const _productType = searchParams.get('type');

  // Fetch product data if not available in state
  const { data: fetchedProduct, isLoading: isLoadingProduct } = useMarketplaceProduct(
    productId || stateProduct?.id || ''
  );

  // Use state product if available, otherwise use fetched product
  const product = stateProduct || fetchedProduct;

  // Check if this is an artwork purchase
  const isArtworkPurchase = product?.category === 'Artwork' || product?.stall_id === 'art-gallery';

  useSeoMeta({
    title: 'Order Confirmation - BitPop Marketplace',
    description: 'Your order has been confirmed. Thank you for your purchase!',
  });

  // Redirect if no product data and no product ID to fetch
  useEffect(() => {
    if (!product && !productId && !stateProduct) {
      navigate('/shop');
    }
  }, [product, productId, stateProduct, navigate]);

  // Show loading state while fetching product
  if (isLoadingProduct && !stateProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Skeleton className="mx-auto mb-6 w-16 h-16 rounded-full" />
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const hasShipping = product?.shipping && product.shipping.length > 0;
  const shippingCost = hasShipping ? product.shipping![0].cost : 0;
  const finalTotalPrice = totalPrice || (product ? product.price + (product.type === 'physical' ? shippingCost : 0) : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Thank you for your purchase. Your order has been successfully processed.
          </p>
          <div className="mt-4">
            <Badge className="bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2">
              Order #{orderNumber}
            </Badge>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Order Summary */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {product?.type === 'digital' ? (
                  <Download className="w-5 h-5 text-blue-600" />
                ) : (
                  <Package className="w-5 h-5 text-purple-600" />
                )}
                <span>Order Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product && (
                <div className="flex items-start space-x-4">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                      {product.type === 'digital' ? (
                        <Download className="w-8 h-8 text-gray-400" />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{product.category}</Badge>
                      <Badge variant={product.type === 'digital' ? 'default' : 'secondary'}>
                        {product.type === 'digital' ? 'Digital' : 'Physical'}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(finalTotalPrice, product.currency)}
                    </p>
                    {product.type === 'physical' && hasShipping && (
                      <p className="text-sm text-muted-foreground">
                        (includes {formatCurrency(shippingCost, product.currency)} shipping)
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Payment Method</p>
                  <p className="capitalize">{paymentMethod || 'Lightning Network'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Order Date</p>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Status</p>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Confirmed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digital Downloads - Only for non-artwork digital products */}
          {product?.type === 'digital' && !isArtworkPurchase && (
            <DigitalDownload
              product={product}
              paymentConfirmed={true}
              onDownloadComplete={() => {
                console.log('Download completed from order confirmation page');
              }}
            />
          )}

          {/* Artwork Purchase Information */}
          {isArtworkPurchase && (
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Artwork Purchase Confirmed!</span>
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-400">
                  Your artwork purchase has been successfully processed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Next Steps for Your Artwork
                      </h4>
                      <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                        Payment confirmed! We will send you the artwork. Please send order number and shipping details to{' '}
                        <a
                          href="mailto:shop@bitpopart.com"
                          className="font-medium underline hover:no-underline"
                        >
                          shop@bitpopart.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Order Information:</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Order Number:</span> {orderNumber}
                      </div>
                      <div>
                        <span className="font-medium">Artwork:</span> {product?.name}
                      </div>
                      <div>
                        <span className="font-medium">Purchase Date:</span> {new Date().toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Total Paid:</span> {formatCurrency(finalTotalPrice, product?.currency || 'SAT')}
                      </div>
                    </div>
                  </div>
                </div>

                {buyerInfo && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Your Contact Information:</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
                      <div className="space-y-1">
                        <div><span className="font-medium">Name:</span> {buyerInfo.name}</div>
                        <div><span className="font-medium">Email:</span> {buyerInfo.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Important Instructions
                      </h4>
                      <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1">
                        <li>• Email your shipping address to shop@bitpopart.com</li>
                        <li>• Include your order number: <strong>{orderNumber}</strong></li>
                        <li>• We will arrange artwork shipping within 2-3 business days</li>
                        <li>• You will receive tracking information once shipped</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Physical Product Information */}
          {product?.type === 'physical' && (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Shipping Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {buyerInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {buyerInfo.name}</p>
                        <p><strong>Email:</strong> {buyerInfo.email}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Shipping Address
                      </h4>
                      <div className="text-sm">
                        <p>{buyerInfo.address.line1}</p>
                        {buyerInfo.address.line2 && <p>{buyerInfo.address.line2}</p>}
                        <p>{buyerInfo.address.city}, {buyerInfo.address.state} {buyerInfo.address.postal_code}</p>
                        <p>{buyerInfo.address.country}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    What happens next?
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• You will receive an order confirmation email shortly</li>
                    <li>• Your order will be processed within 1-2 business days</li>
                    <li>• Tracking information will be sent once shipped</li>
                    <li>• Estimated delivery: 5-7 business days</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                {isArtworkPurchase
                  ? "Don't forget to send your shipping details to complete your artwork order"
                  : "Here are some things you can do while you wait"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isArtworkPurchase ? (
                  <>
                    <Button
                      onClick={() => window.open('mailto:shop@bitpopart.com?subject=Artwork Order ' + orderNumber + '&body=Hello,%0D%0A%0D%0AI have purchased artwork and need to provide shipping details.%0D%0A%0D%0AOrder Number: ' + orderNumber + '%0D%0AArtwork: ' + encodeURIComponent(product?.name || '') + '%0D%0A%0D%0AShipping Address:%0D%0A[Please provide your full shipping address here]%0D%0A%0D%0AThank you!')}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email Shipping Details</span>
                    </Button>

                    <Button
                      onClick={() => navigate('/art')}
                      variant="outline"
                      className="flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Browse More Art</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => navigate('/shop')}
                      variant="outline"
                      className="flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Continue Shopping</span>
                    </Button>

                    <Button
                      onClick={() => navigate('/shop?tab=admin')}
                      variant="outline"
                      className="flex items-center justify-center space-x-2"
                    >
                      <Package className="w-4 h-4" />
                      <span>View Your Products</span>
                    </Button>
                  </>
                )}
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Need help with your order?
                </p>
                <p className="text-xs text-muted-foreground">
                  Contact {isArtworkPurchase ? 'shop@bitpopart.com' : 'support'} with your order number: <strong>{orderNumber}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back to Shop/Gallery */}
          <div className="text-center">
            <Button
              onClick={() => navigate(isArtworkPurchase ? '/art' : '/shop')}
              variant="ghost"
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isArtworkPurchase ? 'Back to Art Gallery' : 'Back to Marketplace'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Thank you for shopping with BitPop Marketplace!</p>
          <p className="mt-2">
            Vibed with <a href="https://soapbox.pub/mkstack" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">MKStack</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;