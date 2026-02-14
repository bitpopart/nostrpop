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
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export function ZapAnalytics() {
  const { nostr } = useNostr();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const adminPubkey = getAdminPubkeyHex();

  const { data: zaps, isLoading } = useQuery({
    queryKey: ['zap-analytics', adminPubkey, timeRange],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);
      
      // Calculate the timestamp for the time range
      const now = Math.floor(Date.now() / 1000);
      const since = timeRange === '7d' 
        ? now - (7 * 24 * 60 * 60)
        : timeRange === '30d'
        ? now - (30 * 24 * 60 * 60)
        : 0;

      const filter: any = {
        kinds: [9735],
        '#p': [adminPubkey],
        limit: 1000,
      };

      if (since > 0) {
        filter.since = since;
      }

      const events = await nostr.query([filter], { signal });
      
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
    enabled: !!adminPubkey,
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Zap Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your lightning zaps and supporters
          </p>
        </div>
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Zaps</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalZaps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Lightning payments received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Zappers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueZappers}</div>
            <p className="text-xs text-muted-foreground">
              Different supporters
            </p>
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
            <p className="text-xs text-muted-foreground">
              Per zap payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Zaps
          </TabsTrigger>
          <TabsTrigger value="top-zappers" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Top Zappers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Zaps</CardTitle>
              <CardDescription>
                Latest lightning payments you've received
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
