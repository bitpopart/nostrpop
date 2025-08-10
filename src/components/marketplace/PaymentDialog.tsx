import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLightningPayment, formatCurrency, convertCurrency } from '@/hooks/usePayment';
import { useToast } from '@/hooks/useToast';
import { useEnhancedPaymentDetection } from '@/hooks/usePaymentDetection';
import { DigitalDownload } from './DigitalDownload';
import QRCode from 'qrcode';
import {
  Zap,
  Copy,
  QrCode,
  CheckCircle,
  Loader2,
  Package,
  Download,
  Truck,
  Mail,
  MapPin
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
  digital_file_names?: string[];
  product_url?: string;
  stall_id: string;
  created_at: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: MarketplaceProduct;
}

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

export function PaymentDialog({ open, onOpenChange, product }: PaymentDialogProps) {
  const navigate = useNavigate();
  const [paymentMethod] = useState<'lightning' | 'stripe'>('lightning');
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    email: '',
    name: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const { createInvoice, invoice, isLoading: lightningLoading, clearInvoice, lightningAddress } = useLightningPayment();

  const { isDetecting: isDetectingPayment, startDetection, stopDetection, payWithWebLN, openLightningWallet } = useEnhancedPaymentDetection();
  const { toast } = useToast();

  const hasShipping = product.shipping && product.shipping.length > 0;
  const shippingCost = hasShipping ? product.shipping![0].cost : 0;
  const totalPrice = product.price + (product.type === 'physical' ? shippingCost : 0);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPaymentCompleted(false);
      setIsProcessing(false);
      stopDetection();
      clearInvoice();
      setBuyerInfo({
        email: '',
        name: '',
        address: {
          line1: '',
          line2: '',
          city: '',
          state: '',
          postal_code: '',
          country: ''
        }
      });
    }
  }, [open, clearInvoice, stopDetection]);

  // Handle payment confirmation
  const confirmPayment = useCallback(() => {
    stopDetection();
    setPaymentCompleted(true);

    toast({
      title: "Payment Confirmed! ⚡",
      description: "Thank you for your purchase. Redirecting to order confirmation...",
    });

    // Navigate to order confirmation page after a short delay
    setTimeout(() => {
      onOpenChange(false);
      navigate(`/order-confirmation?product=${product.id}&type=${product.type}`, {
        state: {
          product,
          buyerInfo,
          totalPrice,
          paymentMethod
        }
      });
    }, 2000);
  }, [stopDetection, onOpenChange, navigate, product, buyerInfo, totalPrice, paymentMethod, toast]);

  const handleBuyerInfoChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setBuyerInfo(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setBuyerInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateBuyerInfo = (): boolean => {
    if (!buyerInfo.email || !buyerInfo.name) {
      toast({
        title: "Missing Information",
        description: "Please provide your email and name.",
        variant: "destructive"
      });
      return false;
    }

    if (product.type === 'physical') {
      const { line1, city, postal_code, country } = buyerInfo.address;
      if (!line1 || !city || !postal_code || !country) {
        toast({
          title: "Missing Address",
          description: "Please provide a complete shipping address for physical products.",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleLightningPayment = async () => {
    if (!validateBuyerInfo()) return;

    setIsProcessing(true);
    try {
      await createInvoice({
        amount: totalPrice,
        currency: product.currency,
        description: `${product.name} - ${product.category}`,
        productId: product.id,
        buyerInfo
      });
    } catch (error) {
      console.error('Lightning payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Payment request copied to clipboard.",
    });
  };

  // Start automatic payment detection
  const startPaymentDetection = useCallback(async () => {
    if (!invoice) return;

    startDetection({
      paymentHash: invoice.payment_hash,
      expiresAt: invoice.expires_at,
      onPaymentDetected: confirmPayment,
      onPaymentExpired: () => {
        toast({
          title: "Invoice Expired",
          description: "The payment invoice has expired. Please generate a new one.",
          variant: "destructive"
        });
      },
      pollInterval: 1500 // Check every 1.5 seconds
    });
  }, [invoice, startDetection, confirmPayment, toast]);

  // Generate QR code when invoice is created
  useEffect(() => {
    if (invoice) {
      // Generate QR code
      QRCode.toDataURL(invoice.payment_request, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [invoice]);

  if (paymentCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="text-center flex-shrink-0 pb-4">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl">Payment Successful!</DialogTitle>
            <DialogDescription>
              Your payment has been confirmed. You will receive a confirmation email shortly.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center space-y-2">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalPrice, product.currency)}
                  </p>
                  {product.type === 'digital' ? (
                    <p className="text-sm text-muted-foreground">
                      Your digital files are ready for download below
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your order will be shipped to the provided address
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Digital Download Component for Digital Products */}
            {product.type === 'digital' && (
              <div className="space-y-4">
                <DigitalDownload
                  product={product}
                  paymentConfirmed={paymentCompleted}
                  onDownloadComplete={() => {
                    toast({
                      title: "Download Complete",
                      description: "Thank you for your purchase!",
                    });
                  }}
                />
              </div>
            )}

            {/* Order Details for Physical Products */}
            {product.type === 'physical' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{formatCurrency(product.price, product.currency)}</span>
                  </div>
                  {hasShipping && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span className="font-medium">{formatCurrency(shippingCost, product.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(totalPrice, product.currency)}</span>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Shipping Address:</strong><br />
                      {buyerInfo.name}<br />
                      {buyerInfo.address.line1}<br />
                      {buyerInfo.address.line2 && `${buyerInfo.address.line2}\n`}
                      {buyerInfo.address.city}, {buyerInfo.address.state} {buyerInfo.address.postal_code}<br />
                      {buyerInfo.address.country}
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Next Steps:</strong><br />
                      • You will receive an order confirmation email at {buyerInfo.email}<br />
                      • Your order will be processed within 1-2 business days<br />
                      • Tracking information will be sent once shipped<br />
                      • Estimated delivery: 5-7 business days
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 pt-4 border-t">
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {product.type === 'digital' ? (
              <Download className="w-5 h-5" />
            ) : (
              <Package className="w-5 h-5" />
            )}
            <span>Purchase {product.name}</span>
          </DialogTitle>
          <DialogDescription>
            Complete your purchase using Lightning Network or credit card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>{product.name}</span>
                <span>{formatCurrency(product.price, product.currency)}</span>
              </div>

              {product.type === 'physical' && hasShipping && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Truck className="w-4 h-4 mr-1" />
                    Shipping
                  </span>
                  <span>{formatCurrency(shippingCost, product.currency)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">
                  {formatCurrency(totalPrice, product.currency)}
                </span>
              </div>

              {product.currency !== 'SAT' && (
                <div className="text-sm text-muted-foreground text-right">
                  ≈ {Math.round(convertCurrency(totalPrice, product.currency, 'SAT')).toLocaleString()} sats
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={buyerInfo.email}
                    onChange={(e) => handleBuyerInfoChange('email', e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={buyerInfo.name}
                    onChange={(e) => handleBuyerInfoChange('name', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Shipping Address for Physical Products */}
              {product.type === 'physical' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pt-4">
                    <MapPin className="w-5 h-5" />
                    <Label className="text-base font-medium">Shipping Address *</Label>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address-line1">Address Line 1 *</Label>
                      <Input
                        id="address-line1"
                        value={buyerInfo.address.line1}
                        onChange={(e) => handleBuyerInfoChange('address.line1', e.target.value)}
                        placeholder="123 Main Street"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address-line2">Address Line 2</Label>
                      <Input
                        id="address-line2"
                        value={buyerInfo.address.line2}
                        onChange={(e) => handleBuyerInfoChange('address.line2', e.target.value)}
                        placeholder="Apartment, suite, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={buyerInfo.address.city}
                          onChange={(e) => handleBuyerInfoChange('address.city', e.target.value)}
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          value={buyerInfo.address.state}
                          onChange={(e) => handleBuyerInfoChange('address.state', e.target.value)}
                          placeholder="NY"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postal-code">Postal Code *</Label>
                        <Input
                          id="postal-code"
                          value={buyerInfo.address.postal_code}
                          onChange={(e) => handleBuyerInfoChange('address.postal_code', e.target.value)}
                          placeholder="10001"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={buyerInfo.address.country}
                          onChange={(e) => handleBuyerInfoChange('address.country', e.target.value)}
                          placeholder="United States"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value="lightning">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="lightning" className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Lightning Payment</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="lightning" className="mt-6">
                  {invoice ? (
                    <div className="space-y-6">
                      {/* Payment Info */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">
                            Lightning Payment to {lightningAddress}
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Amount: <strong>{invoice.amount_sats.toLocaleString()} sats</strong>
                        </p>
                      </div>

                      {/* QR Code */}
                      <div className="text-center">
                        <div className="bg-white p-4 rounded-lg inline-block mb-4 shadow-sm">
                          {qrCodeDataUrl ? (
                            <img
                              src={qrCodeDataUrl}
                              alt="Lightning Invoice QR Code"
                              className="w-48 h-48"
                            />
                          ) : (
                            <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <QrCode className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Scan with your Lightning wallet or copy the invoice below
                        </p>
                      </div>

                      {/* Invoice String */}
                      <div className="space-y-2">
                        <Label>Lightning Invoice</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={invoice.payment_request}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(invoice.payment_request)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Payment Actions */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <Badge variant="outline" className="mb-4">
                            {Math.round((invoice.expires_at - Date.now()) / 1000 / 60)} minutes remaining
                          </Badge>
                        </div>

                        {/* WebLN Payment Button */}
                        <Button
                          onClick={() => {
                            payWithWebLN(
                              invoice.payment_request,
                              confirmPayment, // Success callback
                              () => {
                                // Fallback callback - open wallet and start detection
                                openLightningWallet(invoice.payment_request);
                                startPaymentDetection();
                              }
                            );
                          }}
                          disabled={isDetectingPayment}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          {window.webln ? 'Pay with WebLN' : 'Open Lightning Wallet & Start Detection'}
                        </Button>

                        {/* Payment Detection Status */}
                        <div className="border-t pt-4">
                          {isDetectingPayment ? (
                            <div className="text-center space-y-3">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                  Detecting Payment...
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Checking every 1.5 seconds - payment will be confirmed automatically
                              </p>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={confirmPayment}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs flex-1"
                                >
                                  Payment Complete? Click Here
                                </Button>
                                <Button
                                  onClick={stopDetection}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  Stop Detection
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-3">
                              <p className="text-sm text-muted-foreground mb-2">
                                💡 Click the button above to pay and start automatic detection
                              </p>
                              <p className="text-xs text-muted-foreground mb-3">
                                Or scan the QR code with your Lightning wallet and click below to start monitoring
                              </p>
                              <Button
                                onClick={startPaymentDetection}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                🔍 Start Payment Detection
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Zap className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">
                            Lightning Payment
                          </span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Pay instantly with Bitcoin Lightning Network
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Payments go to: {lightningAddress}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={handleLightningPayment}
                          disabled={isProcessing || lightningLoading}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
                        >
                          {isProcessing || lightningLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating Invoice...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Generate Lightning Invoice
                            </>
                          )}
                        </Button>


                      </div>
                    </div>
                  )}
                </TabsContent>


              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}