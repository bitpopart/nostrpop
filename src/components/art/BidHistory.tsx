import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useConfirmBid, useBids, getEffectiveAuctionEnd, type BidData, type BidConfirmation } from '@/hooks/useBids';
import { formatPrice } from '@/lib/artTypes';
import { genUserName } from '@/lib/genUserName';
import {
  Gavel,
  Crown,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';

interface BidRowProps {
  bid: BidData;
  currency: string;
  confirmation?: BidConfirmation;
  rank: number;
  isAdmin: boolean;
  artworkEventId: string;
  /** Effective auction end time for last-minute detection */
  effectiveEnd?: Date;
  /** All existing confirmations to calc extensions */
  confirmations: BidConfirmation[];
}

function BidRow({ bid, currency, confirmation, rank, isAdmin, artworkEventId, effectiveEnd, confirmations }: BidRowProps) {
  const author = useAuthor(bid.bidder_pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;
  const displayName = metadata?.name ?? genUserName(bid.bidder_pubkey);
  const { mutate: confirmBid, isPending } = useConfirmBid();

  // Was this bid placed in the last minute of the auction? If so, confirming it extends by 5 min.
  const wasLastMinuteBid = effectiveEnd
    ? (effectiveEnd.getTime() - bid.timestamp * 1000) <= 60000
    : false;

  const isWinner = confirmation?.status === 'winner';
  const isAccepted = confirmation?.status === 'accepted';
  const isRejected = confirmation?.status === 'rejected';
  const isPendingStatus = confirmation?.status === 'pending';
  const isUnconfirmed = !confirmation;

  const bidTime = new Date(bid.timestamp * 1000);

  const getStatusBadge = () => {
    if (isWinner) {
      return (
        <Badge className="bg-yellow-500 text-white flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          Winner
        </Badge>
      );
    }
    if (isAccepted) {
      return (
        <Badge className="bg-green-500 text-white flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Accepted
        </Badge>
      );
    }
    if (isRejected) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    }
    if (isPendingStatus) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    }
    // Unconfirmed
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
        <Clock className="w-3 h-3" />
        Awaiting
      </Badge>
    );
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
      isWinner
        ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700'
        : rank === 1
        ? 'bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
        : 'bg-muted/30 border-transparent'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Rank */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          rank === 1
            ? 'bg-red-500 text-white'
            : rank === 2
            ? 'bg-gray-400 text-white'
            : rank === 3
            ? 'bg-amber-600 text-white'
            : 'bg-muted text-muted-foreground'
        }`}>
          {rank}
        </div>

        {/* Bidder info */}
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            {rank === 1 && <Crown className="w-3 h-3 text-red-500 flex-shrink-0" />}
            <p className="text-sm font-medium truncate">{displayName}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {bidTime.toLocaleDateString()} {bidTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Amount */}
        <span className={`font-bold text-sm ${rank === 1 ? 'text-red-600 text-base' : ''}`}>
          {formatPrice(bid.amount, currency)}
        </span>

        {/* Status */}
        {getStatusBadge()}

        {/* Admin confirmation controls */}
        {isAdmin && isUnconfirmed && !isPending && (
          <TooltipProvider>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-6 px-2 text-xs border-green-500 text-green-600 hover:bg-green-50 ${wasLastMinuteBid ? 'ring-1 ring-orange-400' : ''}`}
                    onClick={() => confirmBid({
                      bidEventId: bid.id,
                      auctionEventId: artworkEventId,
                      status: 'accepted',
                      // Auto-extend by 5 minutes if this was a last-minute bid
                      durationExtended: wasLastMinuteBid ? 300 : undefined,
                    })}
                    disabled={isPending}
                  >
                    {wasLastMinuteBid ? <><Zap className="w-2 h-2 mr-0.5" />✓</> : '✓'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {wasLastMinuteBid
                    ? 'Accept bid & extend auction by 5 minutes (last-minute bid)'
                    : 'Accept bid'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => confirmBid({
                      bidEventId: bid.id,
                      auctionEventId: artworkEventId,
                      status: 'rejected',
                    })}
                    disabled={isPending}
                  >
                    ✗
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject bid</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    onClick={() => confirmBid({
                      bidEventId: bid.id,
                      auctionEventId: artworkEventId,
                      status: 'winner',
                    })}
                    disabled={isPending}
                  >
                    🏆
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark as winner</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        {/* Admin can mark accepted bid as winner */}
        {isAdmin && isAccepted && rank === 1 && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            onClick={() => confirmBid({
              bidEventId: bid.id,
              auctionEventId: artworkEventId,
              status: 'winner',
            })}
            disabled={isPending}
          >
            🏆 Win
          </Button>
        )}
      </div>
    </div>
  );
}

interface BidHistoryProps {
  artwork: { id: string; event?: { id: string; kind?: number; pubkey?: string }; starting_bid?: number; currency?: string; auction_end?: string; artist_pubkey?: string };
  className?: string;
}

export function BidHistory({ artwork, className }: BidHistoryProps) {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();

  // Build stable addressable coordinate so we catch bids on old event versions too
  const eventKind = artwork.event?.kind ?? 39239;
  const pubkey = artwork.event?.pubkey ?? artwork.artist_pubkey ?? '';
  const aTag = pubkey ? `${eventKind}:${pubkey}:${artwork.id}` : undefined;

  const { data: bidsData, isLoading } = useBids(artwork.event?.id, aTag);

  const bids = bidsData?.bids ?? [];
  const confirmations = bidsData?.confirmations ?? [];
  const currency = artwork.currency ?? 'SAT';

  // Compute effective auction end (base + all extensions)
  const effectiveEnd = artwork.auction_end
    ? getEffectiveAuctionEnd(artwork.auction_end, confirmations)
    : undefined;

  const getConfirmation = (bidId: string): BidConfirmation | undefined =>
    confirmations.find(c => c.bid_event_id === bidId);

  // Sort: winners first, then accepted, then by amount desc
  const sortedBids = [...bids].sort((a, b) => {
    const ca = getConfirmation(a.id);
    const cb = getConfirmation(b.id);
    if (ca?.status === 'winner') return -1;
    if (cb?.status === 'winner') return 1;
    return b.amount - a.amount;
  });

  if (isLoading) {
    return (
      <Card className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gavel className="w-5 h-5 text-red-500" />
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-red-500" />
            Bid History
          </div>
          {bids.length > 0 && (
            <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              {bids.length} bid{bids.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bids.length === 0 ? (
          <div className="text-center py-6">
            <Gavel className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-muted-foreground text-sm">No bids yet. Be the first to bid!</p>
            {artwork.starting_bid && (
              <p className="text-xs text-muted-foreground mt-1">
                Starting bid: <strong>{formatPrice(artwork.starting_bid, currency)}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedBids.map((bid, index) => (
              <BidRow
                key={bid.id}
                bid={bid}
                currency={currency}
                confirmation={getConfirmation(bid.id)}
                rank={index + 1}
                isAdmin={!!user && isAdmin}
                artworkEventId={artwork.event?.id ?? ''}
                effectiveEnd={effectiveEnd}
                confirmations={confirmations}
              />
            ))}
          </div>
        )}

        {isAdmin && bids.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Admin: Use ✓ / ✗ to accept or reject bids, 🏆 to mark the winner
          </p>
        )}
      </CardContent>
    </Card>
  );
}
