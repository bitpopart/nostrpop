import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NostrEvent } from '@nostrify/nostrify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RelaySelector } from '@/components/RelaySelector';
import { NWCSetup } from './NWCSetup';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { useNWCDiscovery, useNWCTransactions } from '@/hooks/useNWC';
import { getStoredOrders, type Order, type OrderSourcePage } from '@/hooks/useOrders';
import { formatCurrency } from '@/hooks/usePayment';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet,
  ShoppingBag,
  Download,
  ShoppingCart,
  Package,
  Globe,
  CreditCard,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ZapData {
  event: NostrEvent;
  amount: number;
  senderPubkey?: string;
  message?: string;
  timestamp: number;
  bolt11?: string;
}

interface ZapStats {
  totalZaps: number;
  totalAmount: number;
  uniqueZappers: number;
  topZapper: { pubkey: string; amount: number } | null;
  averageZap: number;
  recentTrend: 'up' | 'down' | 'stable';
}

// ── Source Page helpers ───────────────────────────────────────────────────────

const SOURCE_PAGE_META: Record<OrderSourcePage | 'other', { label: string; icon: React.ReactNode; color: string }> = {
  shop:           { label: 'Shop',         icon: <ShoppingBag className="h-4 w-4" />,   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  cart:           { label: 'Cart',         icon: <ShoppingCart className="h-4 w-4" />,  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  downloads:      { label: 'Downloads',   icon: <Download className="h-4 w-4" />,       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  'product-page': { label: 'Product Page', icon: <Package className="h-4 w-4" />,       color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  other:          { label: 'Site',         icon: <Globe className="h-4 w-4" />,          color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

function SourcePageBadge({ sourcePage }: { sourcePage?: OrderSourcePage }) {
  const key = sourcePage ?? 'other';
  const meta = SOURCE_PAGE_META[key] ?? SOURCE_PAGE_META.other;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

// ── Site Payment Row ──────────────────────────────────────────────────────────

function SitePaymentRow({ order }: { order: Order }) {
  const productName = order.items?.[0]?.product_name ?? order.order_number;
  const truncated = productName.length > 40 ? productName.slice(0, 40) + '…' : productName;
  const date = new Date(order.created_at);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <SourcePageBadge sourcePage={order.source_page} />
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium text-sm">{truncated}</div>
          <div className="text-xs text-muted-foreground">#{order.order_number}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {order.buyer_name && <div className="font-medium">{order.buyer_name}</div>}
          {order.buyer_email && <div className="text-xs text-muted-foreground">{order.buyer_email}</div>}
          {!order.buyer_name && !order.buyer_email && (
            <span className="text-xs text-muted-foreground italic">Anonymous</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-mono font-semibold text-sm">
            {formatCurrency(order.total_price, order.currency)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground">
        <div>{format(date, 'MMM d, yyyy')}</div>
        <div className="text-xs opacity-70">{formatDistanceToNow(date, { addSuffix: true })}</div>
      </TableCell>
    </TableRow>
  );
}

// ── Zapper Row ────────────────────────────────────────────────────────────────

function ZapperRow({ pubkey, amount, zapCount }: { pubkey: string; amount: number; zapCount: number }) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || genUserName(pubkey);
  const profileImage = metadata?.picture;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{displayName}</div>
            <div className="text-xs text-muted-foreground">
              {pubkey.slice(0, 8)}...{pubkey.slice(-8)}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono">{zapCount}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-mono font-semibold">
            {(amount / 1000).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">sats</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Recent Zap Row ────────────────────────────────────────────────────────────

function RecentZapRow({ zap }: { zap: ZapData }) {
  const author = useAuthor(zap.senderPubkey || '');
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || genUserName(zap.senderPubkey || 'anonymous');
  const profileImage = metadata?.picture;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profileImage} alt={displayName} />
            <AvatarFallback>{displayName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{displayName}</div>
            {zap.message && (
              <div className="text-sm text-muted-foreground max-w-md truncate">
                {zap.message}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-mono font-semibold">
            {(zap.amount / 1000).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">sats</span>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(zap.timestamp * 1000), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
}

// ── Main ZapAnalytics ─────────────────────────────────────────────────────────

export function ZapAnalytics() {
  const { nostr } = useNostr();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [dataSource, setDataSource] = useState<'relay' | 'nwc'>('relay');
  const adminPubkey = getAdminPubkeyHex();

  // Auto-discover NWC info from relays
  const { data: nwcInfo } = useNWCDiscovery();

  // Fetch NWC transactions
  const { data: nwcTransactions, isLoading: nwcLoading, error: nwcError } = useNWCTransactions(
    nwcInfo,
    dataSource === 'nwc'
  );

  // Fetch relay-based zaps
  const { data: relayZaps, isLoading: relayLoading, error: relayError } = useQuery({
    queryKey: ['zap-analytics', adminPubkey, timeRange],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(15000)]);
      
      console.log('[ZapAnalytics] Querying zaps for pubkey:', adminPubkey);
      
      // Calculate the timestamp for the time range
      const now = Math.floor(Date.now() / 1000);
      const since = timeRange === '7d' 
        ? now - (7 * 24 * 60 * 60)
        : timeRange === '30d'
        ? now - (30 * 24 * 60 * 60)
        : 0;

      const filter: Record<string, unknown> = {
        kinds: [9735],
        '#p': [adminPubkey],
        limit: 1000,
      };

      if (since > 0) {
        filter.since = since;
      }

      console.log('[ZapAnalytics] Query filter:', filter);

      const events = await nostr.query([filter], { signal });
      
      console.log('[ZapAnalytics] Found events:', events.length);
      
      // Parse zap events
      const zapData: ZapData[] = events
        .map((event) => {
          // Get amount from tags
          const amountTag = event.tags.find(([name]) => name === 'amount');
          const amount = amountTag ? parseInt(amountTag[1]) : 0;
          
          // Get sender pubkey from description (zap request)
          const descriptionTag = event.tags.find(([name]) => name === 'description');
          let senderPubkey: string | undefined;
          let message: string | undefined;
          
          if (descriptionTag && descriptionTag[1]) {
            try {
              const zapRequest = JSON.parse(descriptionTag[1]);
              senderPubkey = zapRequest.pubkey;
              message = zapRequest.content;
            } catch (e) {
              // Invalid JSON in description
            }
          }

          // Get bolt11 invoice
          const bolt11Tag = event.tags.find(([name]) => name === 'bolt11');
          const bolt11 = bolt11Tag?.[1];

          return {
            event,
            amount,
            senderPubkey,
            message,
            timestamp: event.created_at,
            bolt11,
          };
        })
        .filter((zap) => zap.amount > 0) // Only include zaps with valid amounts
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent

      return zapData;
    },
    enabled: !!adminPubkey && dataSource === 'relay',
  });

  // Convert NWC transactions to ZapData format
  const nwcZaps = useMemo(() => {
    if (!nwcTransactions || dataSource !== 'nwc') return [];

    // Apply time filter
    const now = Math.floor(Date.now() / 1000);
    const since = timeRange === '7d' 
      ? now - (7 * 24 * 60 * 60)
      : timeRange === '30d'
      ? now - (30 * 24 * 60 * 60)
      : 0;

    return nwcTransactions
      .filter(tx => tx.settled_at && (since === 0 || tx.settled_at >= since))
      .map(tx => ({
        event: {} as NostrEvent, // NWC transactions don't have associated events
        amount: tx.amount,
        senderPubkey: undefined, // NWC doesn't provide sender info
        message: tx.description,
        timestamp: tx.settled_at || tx.created_at,
        bolt11: tx.invoice,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [nwcTransactions, timeRange, dataSource]);

  // Use the appropriate data source
  const zaps = dataSource === 'nwc' ? nwcZaps : relayZaps;
  const isLoading = dataSource === 'nwc' ? nwcLoading : relayLoading;
  const error = dataSource === 'nwc' ? nwcError : relayError;

  // ── Site payments from localStorage orders ──────────────────────────────────
  const sitePayments = useMemo(() => {
    const orders = getStoredOrders();
    const now = Date.now();
    const sinceMs = timeRange === '7d'
      ? now - 7 * 24 * 60 * 60 * 1000
      : timeRange === '30d'
      ? now - 30 * 24 * 60 * 60 * 1000
      : 0;

    return orders
      .filter(o => o.source === 'checkout' && (sinceMs === 0 || new Date(o.created_at).getTime() >= sinceMs))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [timeRange]);

  const sitePaymentStats = useMemo(() => {
    const totalOrders = sitePayments.length;
    // Sum in sats — convert from their currency if SAT, otherwise show as-is
    const totalRevenue = sitePayments.reduce((sum, o) => {
      if (o.currency === 'SAT' || o.currency === 'sats') return sum + o.total_price;
      return sum; // Skip non-sat amounts from sum for simplicity
    }, 0);

    const byPage = sitePayments.reduce<Record<string, number>>((acc, o) => {
      const key = o.source_page ?? 'other';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return { totalOrders, totalRevenue, byPage };
  }, [sitePayments]);

  const stats: ZapStats = useMemo(() => {
    if (!zaps || zaps.length === 0) {
      return {
        totalZaps: 0,
        totalAmount: 0,
        uniqueZappers: 0,
        topZapper: null,
        averageZap: 0,
        recentTrend: 'stable',
      };
    }

    const totalZaps = zaps.length;
    const totalAmount = zaps.reduce((sum, zap) => sum + zap.amount, 0);
    
    // Count unique zappers
    const zapperSet = new Set(zaps.map((z) => z.senderPubkey).filter(Boolean));
    const uniqueZappers = zapperSet.size;

    // Find top zapper
    const zapperTotals = new Map<string, number>();
    zaps.forEach((zap) => {
      if (zap.senderPubkey) {
        const current = zapperTotals.get(zap.senderPubkey) || 0;
        zapperTotals.set(zap.senderPubkey, current + zap.amount);
      }
    });

    let topZapper: { pubkey: string; amount: number } | null = null;
    zapperTotals.forEach((amount, pubkey) => {
      if (!topZapper || amount > topZapper.amount) {
        topZapper = { pubkey, amount };
      }
    });

    const averageZap = totalZaps > 0 ? totalAmount / totalZaps : 0;

    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(zaps.length / 2);
    const firstHalf = zaps.slice(midpoint);
    const secondHalf = zaps.slice(0, midpoint);
    
    const firstHalfTotal = firstHalf.reduce((sum, z) => sum + z.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, z) => sum + z.amount, 0);
    
    const recentTrend = secondHalfTotal > firstHalfTotal * 1.1 
      ? 'up' 
      : secondHalfTotal < firstHalfTotal * 0.9 
      ? 'down' 
      : 'stable';

    return {
      totalZaps,
      totalAmount,
      uniqueZappers,
      topZapper,
      averageZap,
      recentTrend,
    };
  }, [zaps]);

  const topZappers = useMemo(() => {
    if (!zaps) return [];

    const zapperData = new Map<string, { amount: number; count: number }>();
    
    zaps.forEach((zap) => {
      if (zap.senderPubkey) {
        const current = zapperData.get(zap.senderPubkey) || { amount: 0, count: 0 };
        zapperData.set(zap.senderPubkey, {
          amount: current.amount + zap.amount,
          count: current.count + 1,
        });
      }
    });

    return Array.from(zapperData.entries())
      .map(([pubkey, data]) => ({ pubkey, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [zaps]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Zap Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Track lightning payments from <strong>bitpopart@walletofsatoshi.com</strong> — Nostr zaps &amp; site purchases
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex gap-2">
            <Badge
              variant={timeRange === '7d' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </Badge>
            <Badge
              variant={timeRange === '30d' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </Badge>
            <Badge
              variant={timeRange === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTimeRange('all')}
            >
              All Time
            </Badge>
          </div>
          <RelaySelector className="w-[200px]" />
        </div>
      </div>

      {/* NWC Setup Card */}
      <NWCSetup />

      {/* Data Source Selector */}
      {nwcInfo && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Data Source
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Choose where to fetch analytics data from
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={dataSource === 'relay' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setDataSource('relay')}
                >
                  Nostr Relays
                </Badge>
                <Badge
                  variant={dataSource === 'nwc' ? 'default' : 'outline'}
                  className="cursor-pointer bg-green-500 hover:bg-green-600"
                  onClick={() => setDataSource('nwc')}
                >
                  <Wallet className="h-3 w-3 mr-1" />
                  NWC Wallet
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Site Payments Summary ────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Site Payments count */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sitePaymentStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Paid orders via Lightning
            </p>
          </CardContent>
        </Card>

        {/* Site revenue in sats */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Revenue (sats)</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sitePaymentStats.totalRevenue.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">sats</span>
            </div>
            <p className="text-xs text-muted-foreground">SAT-denominated orders only</p>
          </CardContent>
        </Card>

        {/* Nostr Zaps total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nostr Zaps</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalZaps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Via Nostr relay (kind 9735)
            </p>
          </CardContent>
        </Card>

        {/* Total zapped amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zapped Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalAmount / 1000).toLocaleString()} 
              <span className="text-sm font-normal text-muted-foreground ml-1">sats</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats.recentTrend === 'up' && (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Trending up</span>
                </>
              )}
              {stats.recentTrend === 'down' && (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">Trending down</span>
                </>
              )}
              {stats.recentTrend === 'stable' && (
                <span>Stable trend</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Source Page Breakdown ────────────────────────────────────────────── */}
      {sitePayments.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              Payments by Page
            </CardTitle>
            <CardDescription>
              Where on the site did the lightning payments come from?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(sitePaymentStats.byPage) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([page, count]) => {
                  const key = page as OrderSourcePage;
                  const meta = SOURCE_PAGE_META[key] ?? SOURCE_PAGE_META.other;
                  return (
                    <div
                      key={page}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${meta.color} border-current/20`}
                    >
                      {meta.icon}
                      <div>
                        <div className="font-semibold text-sm">{meta.label}</div>
                        <div className="text-xs opacity-80">{count} payment{count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Alert when no zap data */}
      {(!zaps || zaps.length === 0) && !isLoading && (
        <div className="space-y-4">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              No Nostr zaps found on this relay. Try switching to a different relay above. 
              Relays like <strong>Primal</strong> or <strong>Damus</strong> typically store zap data well.
            </AlertDescription>
          </Alert>
          
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <Zap className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <div className="space-y-2">
                <p className="font-semibold">How Zap Analytics Works</p>
                <p className="text-sm">
                  This page queries Nostr relays for zap receipts (kind 9735 events). If you don't see data here:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 ml-2">
                  <li>Try switching to different relays (Primal, Damus, Nostr.Band)</li>
                  <li>Zap receipts might not be published to all relays</li>
                  <li>For comprehensive analytics based on your actual wallet payments, use{' '}
                    <a 
                      href="https://zaplytics.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:no-underline"
                    >
                      zaplytics.app
                    </a>
                    {' '}which connects to your NWC (Nostr Wallet Connect) provider
                  </li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── Main Tabs ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="site-payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="site-payments" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Site Payments
            {sitePayments.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{sitePayments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Nostr Zaps
          </TabsTrigger>
          <TabsTrigger value="top-zappers" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Top Zappers
          </TabsTrigger>
        </TabsList>

        {/* ── Site Payments Tab ──────────────────────────────────────────────── */}
        <TabsContent value="site-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                Lightning Payments via Site
              </CardTitle>
              <CardDescription>
                Payments made to <strong>bitpopart@walletofsatoshi.com</strong> via the Shop, Cart, or Downloads pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sitePayments.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">No site payments found for this time period</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When customers pay via the Shop or Downloads pages, they'll appear here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Page</TableHead>
                      <TableHead>Product / Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sitePayments.map((order) => (
                      <SitePaymentRow key={order.id} order={order} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Recent Nostr Zaps Tab ─────────────────────────────────────────── */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Nostr Zaps</CardTitle>
              <CardDescription>
                Latest lightning zaps received via Nostr (kind 9735)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!zaps || zaps.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No zaps found for this time period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zapper</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zaps.slice(0, 20).map((zap, index) => (
                      <RecentZapRow key={index} zap={zap} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Top Zappers Tab ───────────────────────────────────────────────── */}
        <TabsContent value="top-zappers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Zappers</CardTitle>
              <CardDescription>
                Your biggest supporters by total amount zapped
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topZappers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No zappers found for this time period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zapper</TableHead>
                      <TableHead className="text-right">Zaps</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topZappers.map((zapper, index) => (
                      <ZapperRow
                        key={index}
                        pubkey={zapper.pubkey}
                        amount={zapper.amount}
                        zapCount={zapper.count}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Additional stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Zappers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueZappers}</div>
                <p className="text-xs text-muted-foreground">Different supporters</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Zap</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.averageZap / 1000).toLocaleString()} 
                  <span className="text-sm font-normal text-muted-foreground ml-1">sats</span>
                </div>
                <p className="text-xs text-muted-foreground">Per zap payment</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
