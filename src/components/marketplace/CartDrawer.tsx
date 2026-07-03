import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useLightningPayment, formatCurrency, convertCurrency } from '@/hooks/usePayment';
import { useToast } from '@/hooks/useToast';
import { useEnhancedPaymentDetection } from '@/hooks/usePaymentDetection';
import { createCheckoutOrder } from '@/hooks/useOrders';
import QRCode from 'qrcode';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Truck,
  MapPin,
  Zap,
  ArrowLeft,
  CheckCircle,
  Copy,
  QrCode,
  Loader2,
  Package,
} from 'lucide-react';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'cart' | 'address' | 'payment' | 'done';

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const navigate = useNavigate();
  const { items, address, updateQty, removeItem, clearCart, updateAddress, subtotal, currency, totalItems } = useCart();
  const [step, setStep] = useState<Step>('cart');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const { createInvoice, invoice, isLoading: lightningLoading, clearInvoice, lightningAddress } = useLightningPayment();
  const { isDetecting, startDetection, stopDetection, payWithWebLN, openLightningWallet } = useEnhancedPaymentDetection();
  const { toast } = useToast();

  const hasPhysical = items.some(i => i.type === 'physical');

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('cart');
      clearInvoice();
      stopDetection();
      setQrCodeDataUrl('');
    }
  }, [open, clearInvoice, stopDetection]);

  // Generate QR code
  useEffect(() => {
    if (invoice) {
      QRCode.toDataURL(invoice.payment_request, { width: 220, margin: 2 })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [invoice]);

  const validateAddress = (): boolean => {
    if (!address.email || !address.name) {
      toast({ title: 'Missing info', description: 'Please fill in your name and email.', variant: 'destructive' });
      return false;
    }
    if (hasPhysical) {
      if (!address.line1 || !address.city || !address.postal_code || !address.country) {
        toast({ title: 'Missing address', description: 'Please fill in your complete shipping address.', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    if (!validateAddress()) return;
    setStep('payment');
    try {
      await createInvoice({
        amount: subtotal,
        currency,
        description: `BitPopArt order — ${items.length} item${items.length > 1 ? 's' : ''}`,
        productId: 'cart',
        buyerInfo: {
          email: address.email,
          name: address.name,
          address: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
          },
        },
      });
    } catch (e) {
      console.error('Invoice creation failed', e);
      setStep('address');
    }
  };

  const confirmPayment = useCallback(() => {
    stopDetection();

    // Save order
    const savedOrder = createCheckoutOrder({
      productId: 'cart',
      productName: `Order — ${items.map(i => i.name).join(', ')}`,
      productType: hasPhysical ? 'physical' : 'digital',
      productImage: items[0]?.images?.[0],
      price: subtotal,
      currency,
      buyerName: address.name || undefined,
      buyerEmail: address.email || undefined,
      shippingAddress: hasPhysical && address.line1 ? {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state || undefined,
        postal_code: address.postal_code,
        country: address.country,
      } : undefined,
      paymentMethod: 'Lightning',
    });

    // Send email for physical orders
    if (hasPhysical && address.name) {
      const itemLines = items.map(i => `  • ${i.name} ×${i.quantity}`).join('\n');
      const subject = encodeURIComponent(`Order ${savedOrder.order_number} — BitPopArt`);
      const body = encodeURIComponent(
        `Hello,\n\nI just placed an order on BitPopArt.\n\n` +
        `Order: ${savedOrder.order_number}\n\nItems:\n${itemLines}\n\n` +
        `Total: ${subtotal.toFixed(2)} ${currency}\n\n` +
        `Name: ${address.name}\nEmail: ${address.email}\n` +
        (address.line1
          ? `\nShip to:\n${address.line1}\n${address.line2 ? address.line2 + '\n' : ''}` +
            `${address.city}, ${address.state} ${address.postal_code}\n${address.country}\n`
          : '') +
        `\nPayment: Lightning Network\nThank you!`
      );
      try { window.open(`mailto:shop@bitpopart.com?subject=${subject}&body=${body}`, '_blank'); } catch { /* ignore */ }
    }

    toast({ title: 'Payment confirmed! ⚡', description: 'Thank you for your order.' });
    setStep('done');

    setTimeout(() => {
      clearCart();
      onOpenChange(false);
      navigate(`/order-confirmation?product=cart&type=${hasPhysical ? 'physical' : 'digital'}`, {
        state: { buyerInfo: { name: address.name, email: address.email, address }, totalPrice: subtotal, orderNumber: savedOrder.order_number },
      });
    }, 2000);
  }, [stopDetection, items, subtotal, currency, address, hasPhysical, clearCart, onOpenChange, navigate, toast]);

  const handleStartDetection = useCallback(() => {
    if (!invoice) return;
    startDetection({
      paymentHash: invoice.payment_hash,
      expiresAt: invoice.expires_at,
      onPaymentDetected: confirmPayment,
      onPaymentExpired: () => toast({ title: 'Invoice expired', description: 'Please generate a new invoice.', variant: 'destructive' }),
      pollInterval: 1500,
    });
  }, [invoice, startDetection, confirmPayment, toast]);

  const copyInvoice = () => {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice.payment_request);
    toast({ title: 'Copied!', description: 'Lightning invoice copied.' });
  };

  // ── DONE ──────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Payment confirmed!</h2>
            <p className="text-muted-foreground text-sm">Redirecting to your order confirmation…</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            {step !== 'cart' && (
              <button
                type="button"
                onClick={() => setStep(step === 'payment' ? 'address' : 'cart')}
                className="mr-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <ShoppingCart className="w-5 h-5" />
            {step === 'cart' && `Cart ${totalItems > 0 ? `(${totalItems})` : ''}`}
            {step === 'address' && 'Shipping & Contact'}
            {step === 'payment' && 'Pay with Lightning ⚡'}
          </SheetTitle>
        </SheetHeader>

        {/* ── CART STEP ── */}
        {step === 'cart' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-6 text-center">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p className="text-sm">Your cart is empty.</p>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Keep Shopping</Button>
              </div>
            ) : (
              <>
                {/* Items list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {items.map(item => {
                    const effectivePrice = item.discount && item.discount > 0
                      ? item.price * (1 - item.discount / 100)
                      : item.price;
                    return (
                      <div key={item.id} className="flex gap-3 items-start">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative">
                          {item.images[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-300 m-auto" />
                          )}
                          {item.discount && item.discount > 0 && (
                            <span className="absolute top-0.5 right-0.5 text-[9px] font-bold bg-orange-500 text-white px-1 rounded-full leading-4">
                              -{item.discount}%
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {item.discount && item.discount > 0 && (
                              <span className="text-xs line-through text-muted-foreground">
                                {formatCurrency(item.price, item.currency)}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(effectivePrice, item.currency)}
                            </span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {item.type === 'physical' ? <><Truck className="w-2.5 h-2.5 mr-0.5" />Ship</> : <><Package className="w-2.5 h-2.5 mr-0.5" />Digital</>}
                            </Badge>
                          </div>

                          {/* Qty controls */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="text-xs text-muted-foreground ml-1">
                              = {formatCurrency(effectivePrice * item.quantity, item.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Shipping note */}
                  {hasPhysical && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                      <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>One flat shipping rate calculated at checkout — regardless of how many physical items you order.</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-3 space-y-3 bg-white dark:bg-gray-950 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(subtotal, currency)}
                    </span>
                  </div>
                  {currency !== 'SAT' && (
                    <p className="text-xs text-muted-foreground text-right -mt-1">
                      ≈ {Math.round(convertCurrency(subtotal, currency, 'SAT')).toLocaleString()} sats
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
                      Keep Shopping
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                      onClick={() => setStep('address')}
                    >
                      Checkout →
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ADDRESS STEP ── */}
        {step === 'address' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Contact */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  Contact Info
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Full Name *</Label>
                    <Input
                      value={address.name}
                      onChange={e => updateAddress({ name: e.target.value })}
                      placeholder="Johannes Oppewal"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      value={address.email}
                      onChange={e => updateAddress({ email: e.target.value })}
                      placeholder="you@email.com"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping address (only for physical products) */}
              {hasPhysical && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold">Shipping Address</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Address Line 1 *</Label>
                      <Input
                        value={address.line1}
                        onChange={e => updateAddress({ line1: e.target.value })}
                        placeholder="123 Main Street"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Address Line 2</Label>
                      <Input
                        value={address.line2}
                        onChange={e => updateAddress({ line2: e.target.value })}
                        placeholder="Apartment, suite, etc."
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">City *</Label>
                        <Input
                          value={address.city}
                          onChange={e => updateAddress({ city: e.target.value })}
                          placeholder="Amsterdam"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">State / Province</Label>
                        <Input
                          value={address.state}
                          onChange={e => updateAddress({ state: e.target.value })}
                          placeholder="NH"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Postal Code *</Label>
                        <Input
                          value={address.postal_code}
                          onChange={e => updateAddress({ postal_code: e.target.value })}
                          placeholder="1234 AB"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Country *</Label>
                        <Input
                          value={address.country}
                          onChange={e => updateAddress({ country: e.target.value })}
                          placeholder="Netherlands"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order summary mini */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your order</p>
                {items.map(item => {
                  const ep = item.discount && item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate flex-1 mr-2">{item.name} ×{item.quantity}</span>
                      <span className="font-medium flex-shrink-0">{formatCurrency(ep * item.quantity, item.currency)}</span>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Subtotal</span>
                  <span className="text-green-600">{formatCurrency(subtotal, currency)}</span>
                </div>
                {hasPhysical && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Shipping added after address
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3 bg-white dark:bg-gray-950 flex-shrink-0">
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
                onClick={handleProceedToPayment}
                disabled={lightningLoading}
              >
                {lightningLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating invoice…</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Pay {formatCurrency(subtotal, currency)} with Lightning</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── PAYMENT STEP ── */}
        {step === 'payment' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {!invoice ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                </div>
              ) : (
                <>
                  {/* Amount */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800 text-center space-y-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center justify-center gap-1.5">
                      <Zap className="w-4 h-4" /> Lightning payment to {lightningAddress}
                    </p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {invoice.amount_sats.toLocaleString()} sats
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {formatCurrency(subtotal, currency)}
                    </p>
                  </div>

                  {/* QR */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-sm inline-block">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="Lightning QR" className="w-44 h-44" />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center">
                          <QrCode className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Scan with your Lightning wallet, or copy the invoice below
                  </p>

                  {/* Copy invoice */}
                  <div className="flex gap-2">
                    <Input value={invoice.payment_request} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={copyInvoice}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Expires */}
                  <p className="text-xs text-center text-muted-foreground">
                    Expires in ~{Math.max(0, Math.round((invoice.expires_at - Date.now()) / 60000))} min
                  </p>

                  {/* Pay buttons */}
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0"
                    onClick={() => payWithWebLN(invoice.payment_request, confirmPayment, () => {
                      openLightningWallet(invoice.payment_request);
                      handleStartDetection();
                    })}
                    disabled={isDetecting}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {window.webln ? 'Pay with WebLN' : 'Open Lightning Wallet'}
                  </Button>

                  {isDetecting ? (
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                        Waiting for payment…
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={confirmPayment}>
                          Payment done? Confirm
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={stopDetection}>
                          Stop
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleStartDetection}>
                      🔍 Start payment detection
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
