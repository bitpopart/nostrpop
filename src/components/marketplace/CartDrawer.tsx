import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/hooks/useCart';
import { useShippingConfig, getShippingFee, DEFAULT_SHIPPING_CONFIG } from '@/hooks/useShippingConfig';
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
  Globe,
} from 'lucide-react';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'cart' | 'address' | 'payment' | 'done';

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const navigate = useNavigate();
  const {
    items, address, updateQty, removeItem, clearCart,
    updateAddress, subtotal, currency, totalItems,
  } = useCart();

  const [step, setStep] = useState<Step>('cart');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const { createInvoice, invoice, isLoading: lightningLoading, clearInvoice, lightningAddress } = useLightningPayment();
  const { isDetecting, startDetection, stopDetection, payWithWebLN, openLightningWallet } = useEnhancedPaymentDetection();
  const { toast } = useToast();

  // Load global shipping zones from Nostr (admin-configured)
  const { data: shippingConfig } = useShippingConfig();
  const config = shippingConfig ?? DEFAULT_SHIPPING_CONFIG;

  const hasPhysical = items.some(i => i.type === 'physical');
  const countrySelected = address.country.trim().length > 0;

  // Calculate shipping fee from Global Shipping Zones
  const shippingCost = useMemo(() => {
    if (!hasPhysical || !countrySelected) return 0;
    return getShippingFee(config, address.country) ?? 0;
  }, [hasPhysical, countrySelected, config, address.country]);

  const total = subtotal + shippingCost;

  // Find the matched zone name for display
  const matchedZone = useMemo(() => {
    if (!countrySelected) return undefined;
    return config.zones.find(zone => {
      if (zone.countries.length === 0) return false; // skip catch-all for display
      return zone.countries.some(
        c => c.name.toLowerCase() === address.country.toLowerCase() ||
             c.code.toLowerCase() === address.country.toLowerCase()
      );
    }) ?? config.zones.find(z => z.countries.length === 0); // catch-all
  }, [config, address.country, countrySelected]);

  // Build flat sorted country list grouped by zone for the Select.
  // Zones with countries get listed normally; the catch-all zone (empty countries)
  // appears last as a single "Rest of World" selectable entry.
  const countryOptions = useMemo(() => {
    const regular = config.zones
      .filter(z => z.countries.length > 0)
      .map(zone => ({
        zoneId: zone.id,
        zoneName: zone.name,
        zoneFee: zone.fee,
        currency: zone.currency,
        countries: [...zone.countries].sort((a, b) => a.name.localeCompare(b.name)),
        isCatchAll: false,
      }));

    // Add catch-all zone as a special selectable group
    const catchAll = config.zones.find(z => z.countries.length === 0);
    if (catchAll) {
      regular.push({
        zoneId: catchAll.id,
        zoneName: catchAll.name,
        zoneFee: catchAll.fee,
        currency: catchAll.currency,
        // The value stored will be the zone name itself so getShippingFee can match via catch-all
        countries: [{ code: '__catchall__', name: catchAll.name }],
        isCatchAll: true,
      });
    }

    return regular;
  }, [config]);

  const shippingResolved = !hasPhysical || !countrySelected || shippingCost >= 0;

  // Reset on close — do NOT clear address (user might re-open)
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
        toast({ title: 'Missing address', description: 'Please fill in your complete shipping address and select a country.', variant: 'destructive' });
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
        amount: total,
        currency,
        description: `BitPopArt order — ${items.length} item${items.length > 1 ? 's' : ''}${shippingCost > 0 ? ' + shipping' : ''}`,
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

    // Build proper per-item list for the order record
    const orderItems = items.map(i => ({
      product_id: i.id,
      product_name: i.name,
      quantity: i.quantity,
      price: (i.discount && i.discount > 0 ? i.price * (1 - i.discount / 100) : i.price) * i.quantity,
      currency: i.currency,
      type: i.type,
      image: i.images?.[0],
    }));

    // Add shipping as a line item if applicable
    if (hasPhysical && shippingCost > 0) {
      orderItems.push({
        product_id: 'shipping',
        product_name: `Shipping to ${address.country}`,
        quantity: 1,
        price: shippingCost,
        currency,
        type: 'physical',
        image: undefined,
      });
    }

    const savedOrder = createCheckoutOrder({
      productId: 'cart',
      productName: `Order — ${items.map(i => i.name).join(', ')}`,
      productType: hasPhysical ? 'physical' : 'digital',
      productImage: items[0]?.images?.[0],
      price: total,
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
      items: orderItems,
      // createCheckoutOrder will auto-send the shop email
    });

    toast({ title: 'Payment confirmed! ⚡', description: 'Thank you for your order.' });
    setStep('done');

    setTimeout(() => {
      clearCart();
      onOpenChange(false);
      navigate(`/order-confirmation?product=cart&type=${hasPhysical ? 'physical' : 'digital'}`, {
        state: {
          buyerInfo: { name: address.name, email: address.email, address },
          totalPrice: total,
          orderNumber: savedOrder.order_number,
        },
      });
    }, 2000);
  }, [stopDetection, items, subtotal, shippingCost, total, currency, address, hasPhysical, clearCart, onOpenChange, navigate, toast]);


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
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {items.map(item => {
                    const effectivePrice = item.discount && item.discount > 0
                      ? item.price * (1 - item.discount / 100)
                      : item.price;
                    return (
                      <div key={item.id} className="flex gap-3 items-start">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative">
                          {item.images[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-300 m-auto mt-4" />
                          )}
                          {item.discount && item.discount > 0 && (
                            <span className="absolute top-0.5 right-0.5 text-[9px] font-bold bg-orange-500 text-white px-1 rounded-full leading-4">
                              -{item.discount}%
                            </span>
                          )}
                        </div>

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
                              {item.type === 'physical'
                                ? <><Truck className="w-2.5 h-2.5 mr-0.5" />Ship</>
                                : <><Package className="w-2.5 h-2.5 mr-0.5" />Digital</>}
                            </Badge>
                          </div>

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

                  {hasPhysical && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                      <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Shipping fee added at checkout based on your country — one flat rate for the whole order.</span>
                    </div>
                  )}
                </div>

                <div className="border-t px-4 py-3 space-y-3 bg-white dark:bg-gray-950 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(subtotal, currency)}
                    </span>
                  </div>
                  {hasPhysical && (
                    <p className="text-xs text-muted-foreground text-right -mt-1 flex items-center justify-end gap-1">
                      <Truck className="w-3 h-3" /> + shipping at next step
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

              {/* Shipping address */}
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
                        <Label className="text-xs flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Country *
                        </Label>
                        <Select
                          value={address.country}
                          onValueChange={val => updateAddress({ country: val })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select country…" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {countryOptions.map(group => (
                              <SelectGroup key={group.zoneId}>
                                <SelectLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 py-1.5">
                                  <Truck className="w-3 h-3" />
                                  {group.zoneName} — {formatCurrency(group.zoneFee, group.currency)}
                                </SelectLabel>
                                {group.isCatchAll ? (
                                  <SelectItem value={group.countries[0].name} className="text-sm pl-5 italic text-muted-foreground">
                                    🌐 {group.zoneName} (any other country)
                                  </SelectItem>
                                ) : (
                                  group.countries.map(c => (
                                    <SelectItem key={c.code} value={c.name} className="text-sm pl-5">
                                      {c.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Live shipping cost feedback from Global Shipping Zones */}
                    {hasPhysical && countrySelected && matchedZone && (
                      <div className="rounded-lg px-3 py-2.5 text-sm border mt-1 space-y-1.5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                          <Truck className="w-4 h-4" />
                          Shipping to {address.country}
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1 border-green-300 text-green-700 dark:text-green-300">
                            {matchedZone.name}
                          </Badge>
                        </p>
                        <div className="flex justify-between text-xs font-bold text-green-800 dark:text-green-200 pt-0.5 border-t border-green-200 dark:border-green-700">
                          <span>Flat shipping rate</span>
                          <span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost, currency)}</span>
                        </div>
                      </div>
                    )}

                    {hasPhysical && !countrySelected && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                        <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        Select your country to see the shipping cost
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order summary */}
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
                </div>
                {hasPhysical && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping</span>
                    <span className="font-medium">
                      {!countrySelected
                        ? <span className="text-muted-foreground italic text-xs">select country</span>
                        : shippingCost === 0
                          ? 'Free'
                          : formatCurrency(shippingCost, currency)
                      }
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-green-600">
                    {(!hasPhysical || countrySelected)
                      ? formatCurrency(total, currency)
                      : <span className="text-muted-foreground">—</span>
                    }
                  </span>
                </div>
                {currency !== 'SAT' && (!hasPhysical || countrySelected) && (
                  <p className="text-xs text-muted-foreground text-right">
                    ≈ {Math.round(convertCurrency(total, currency, 'SAT')).toLocaleString()} sats
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3 bg-white dark:bg-gray-950 flex-shrink-0 space-y-2">
              {hasPhysical && countrySelected && shippingCost > 0 && (
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Truck className="w-3 h-3" />
                  Includes {formatCurrency(shippingCost, currency)} shipping to {address.country}
                </p>
              )}
              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 disabled:opacity-50"
                onClick={handleProceedToPayment}
                disabled={lightningLoading || (hasPhysical && !countrySelected)}
              >
                {lightningLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating invoice…</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />
                    Pay {(!hasPhysical || countrySelected) ? formatCurrency(total, currency) : '…'} with Lightning
                  </>
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
                  {/* Amount breakdown */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800 space-y-2">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center justify-center gap-1.5">
                      <Zap className="w-4 h-4" /> Lightning payment to {lightningAddress}
                    </p>
                    {shippingCost > 0 && (
                      <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300 border-t border-yellow-200 dark:border-yellow-700 pt-2 mt-1">
                        <div className="flex justify-between">
                          <span>Products</span>
                          <span>{formatCurrency(subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping</span>
                          <span>{formatCurrency(shippingCost, currency)}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 text-center">
                      {invoice.amount_sats.toLocaleString()} sats
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 text-center">
                      {formatCurrency(total, currency)}
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

                  <div className="flex gap-2">
                    <Input value={invoice.payment_request} readOnly className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={copyInvoice}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Expires in ~{Math.max(0, Math.round((invoice.expires_at - Date.now()) / 60000))} min
                  </p>

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
