import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { getStoredOrders } from '@/hooks/useOrders';
import { useShippingConfig, DEFAULT_SHIPPING_CONFIG, getShippingFee } from '@/hooks/useShippingConfig';
import { formatCurrency } from '@/hooks/usePayment';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Truck,
  Package,
  Globe,
  ArrowLeft,
  ShoppingCart,
  Mail,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Clock,
  RefreshCw,
  Copy,
  CheckCheck,
  Zap,
  Search,
} from 'lucide-react';

// ─── Shipping Zone Debug ───────────────────────────────────────────────────────

function ShippingZoneDebug() {
  const { data: shippingConfig, isLoading, refetch } = useShippingConfig();
  const config = shippingConfig ?? DEFAULT_SHIPPING_CONFIG;
  const [testCountry, setTestCountry] = useState('');

  const testFee = testCountry.trim() ? getShippingFee(config, testCountry.trim()) : undefined;
  const testZone = testCountry.trim()
    ? config.zones.find(z => {
        if (z.countries.length === 0) return false;
        const n = testCountry.trim().toLowerCase();
        return z.countries.some(c => c.name.toLowerCase() === n || c.code.toLowerCase() === n);
      }) ?? config.zones.find(z => z.countries.length === 0)
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-500" />
          Global Shipping Zones
          {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
        <CardDescription>
          Loaded from Nostr (kind 30078). Source: {shippingConfig ? 'Nostr relay' : 'DEFAULT (no Nostr config found)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test a country */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Test country (e.g. Germany, US, Netherlands…)"
              value={testCountry}
              onChange={e => setTestCountry(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload
          </Button>
        </div>

        {testCountry.trim() && (
          <div className={`rounded-lg px-4 py-3 border text-sm space-y-1 ${
            testFee !== undefined
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}>
            <p className="font-semibold flex items-center gap-1.5">
              <Globe className="h-4 w-4" /> Result for "{testCountry}"
            </p>
            {testZone ? (
              <>
                <p>Zone: <strong>{testZone.name}</strong></p>
                <p>Fee: <strong className="text-green-700 dark:text-green-300">{formatCurrency(testFee ?? 0, config.currency)}</strong></p>
                {testZone.countries.length === 0 && (
                  <Badge variant="outline" className="text-xs">Catch-all / Rest of World</Badge>
                )}
              </>
            ) : (
              <p className="text-amber-700 dark:text-amber-300">No zone matched — would use defaultFee: {config.defaultFee ?? 0}</p>
            )}
          </div>
        )}

        {/* Zone list */}
        <div className="space-y-3">
          {config.zones.map(zone => (
            <div key={zone.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-semibold text-sm">{zone.name}</span>
                  {zone.countries.length === 0 && (
                    <Badge variant="outline" className="text-[10px] py-0">Catch-all</Badge>
                  )}
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300">
                  {formatCurrency(zone.fee, zone.currency)}
                </Badge>
              </div>
              {zone.countries.length > 0 && (
                <div className="px-4 py-2 flex flex-wrap gap-1">
                  {zone.countries.map(c => (
                    <span key={c.code} className="text-xs bg-background border rounded px-1.5 py-0.5 text-muted-foreground">
                      {c.name} ({c.code})
                    </span>
                  ))}
                </div>
              )}
              {zone.countries.length === 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground italic">
                  Matches any country not listed in other zones
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Order Debug ───────────────────────────────────────────────────────────────

function OrderDebug() {
  const orders = getStoredOrders();
  const [copied, setCopied] = useState(false);

  const json = JSON.stringify(orders, null, 2);
  const copy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_price, 0);
  const currency = orders[0]?.currency ?? 'USD';
  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          Order Store (localStorage)
        </CardTitle>
        <CardDescription>
          {orders.length} orders stored locally · key: nostrpop_orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {['pending','paid','processing','shipped','completed','cancelled'].map(s => (
            <div key={s} className="text-center bg-muted/40 rounded-lg p-2">
              <p className="text-lg font-bold">{byStatus[s] ?? 0}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{s}</p>
            </div>
          ))}
        </div>
        <div className="text-sm font-semibold text-green-600">
          Total revenue (non-cancelled): {formatCurrency(totalRevenue, currency)}
        </div>

        {/* Raw JSON */}
        <div className="relative">
          <Button size="sm" variant="outline" className="absolute top-2 right-2 z-10 h-7" onClick={copy}>
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <pre className="bg-muted/60 rounded-lg p-4 text-xs overflow-auto max-h-72 font-mono leading-relaxed">
            {json || '[]'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Email Test ────────────────────────────────────────────────────────────────

function EmailTestPanel() {
  const orders = getStoredOrders();
  const latestOrder = orders[0];

  const buildEmailBody = (order: ReturnType<typeof getStoredOrders>[0]) => {
    const hasPhysical = order.items.some(i => i.type === 'physical');
    return [
      `NEW ORDER — BitPopArt`,
      ``,
      `Order Number: ${order.order_number}`,
      `Date: ${new Date(order.created_at).toLocaleString()}`,
      `Status: ${order.status.toUpperCase()}`,
      ``,
      `ITEMS:`,
      ...order.items.map(i => `  • ${i.product_name}  ×${i.quantity}  ${formatCurrency(i.price, i.currency)}`),
      ``,
      `TOTAL: ${formatCurrency(order.total_price, order.currency)}`,
      `Payment: ${order.payment_method ?? 'Lightning Network ⚡'}`,
      ``,
      order.buyer_name ? `Buyer: ${order.buyer_name}` : '',
      order.buyer_email ? `Email: ${order.buyer_email}` : '',
      ``,
      hasPhysical && order.shipping_address ? [
        `SHIP TO:`,
        order.shipping_address.line1,
        order.shipping_address.line2 ?? '',
        `${order.shipping_address.city}${order.shipping_address.state ? ', ' + order.shipping_address.state : ''} ${order.shipping_address.postal_code}`,
        order.shipping_address.country,
      ].filter(Boolean).join('\n') : '',
      order.tracking_number ? `Tracking: ${order.tracking_number}` : '',
    ].filter(l => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  const openTestEmail = () => {
    if (!latestOrder) return;
    const subject = encodeURIComponent(`NEW ORDER ${latestOrder.order_number} — BitPopArt`);
    const body = encodeURIComponent(buildEmailBody(latestOrder));
    window.open(`mailto:shop@bitpopart.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-500" />
          Email Notification Test
        </CardTitle>
        <CardDescription>
          Test the email that gets sent to shop@bitpopart.com on every sale.
          Uses the most recent order in localStorage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestOrder ? (
          <>
            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Using order:</span> <strong>{latestOrder.order_number}</strong></p>
              <p><span className="text-muted-foreground">Buyer:</span> {latestOrder.buyer_name ?? '—'} / {latestOrder.buyer_email ?? '—'}</p>
              <p><span className="text-muted-foreground">Total:</span> {formatCurrency(latestOrder.total_price, latestOrder.currency)}</p>
            </div>
            <Button onClick={openTestEmail} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
              <Mail className="h-4 w-4" />
              Open Test Email → shop@bitpopart.com
            </Button>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {buildEmailBody(latestOrder)}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No orders in store yet. Complete a purchase first.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cart Debug ────────────────────────────────────────────────────────────────

function CartDebug() {
  const [copied, setCopied] = useState(false);
  const raw = localStorage.getItem('nostrpop_cart') ?? '[]';
  const address = localStorage.getItem('nostrpop_cart_address') ?? '{}';

  const copy = () => {
    navigator.clipboard.writeText(JSON.stringify({ cart: JSON.parse(raw), address: JSON.parse(address) }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearCart = () => {
    localStorage.removeItem('nostrpop_cart');
    localStorage.removeItem('nostrpop_cart_address');
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-indigo-500" />
          Cart State (localStorage)
        </CardTitle>
        <CardDescription>
          Current cart items and saved address — key: nostrpop_cart
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
            {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </Button>
          <Button size="sm" variant="outline" onClick={clearCart} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
            Clear Cart
          </Button>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Cart Items</p>
          <pre className="bg-muted/60 rounded-lg p-3 text-xs overflow-auto max-h-40 font-mono">{JSON.stringify(JSON.parse(raw), null, 2)}</pre>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Saved Address</p>
          <pre className="bg-muted/60 rounded-lg p-3 text-xs overflow-auto max-h-32 font-mono">{JSON.stringify(JSON.parse(address), null, 2)}</pre>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Debug Page ───────────────────────────────────────────────────────────

export default function ShopDebugPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();

  useSeoMeta({
    title: 'Shop Debug — BitPopArt',
    robots: 'noindex, nofollow',
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle>Admin Login Required</CardTitle>
          </CardHeader>
          <CardContent><LoginArea className="w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Only shop@bitpopart.com admin can view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/shop')}>← Back to Shop</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-background to-indigo-50/30 dark:from-gray-900 dark:via-background dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Admin
              </Button>
            </div>
            <h1 className="text-3xl font-black flex items-center gap-2">
              <Zap className="h-7 w-7 text-yellow-500" />
              Shop Debug
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Internal tool for shop@bitpopart.com · order data, shipping zones, email tests
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/orders')}>
              <Package className="h-4 w-4 mr-1.5" /> Orders
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/shop')}>
              <ShoppingCart className="h-4 w-4 mr-1.5" /> Shop
            </Button>
          </div>
        </div>

        {/* Info bar */}
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              This page is only visible to the admin. It shows raw order data, shipping configuration from Nostr, and lets you test email notifications.
            </p>
          </CardContent>
        </Card>

        <ShippingZoneDebug />
        <EmailTestPanel />
        <OrderDebug />
        <CartDebug />
      </div>
    </div>
  );
}
