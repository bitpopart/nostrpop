import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuthor } from '@/hooks/useAuthor';
import { usePlaceBid, useBids, getEffectiveAuctionEnd } from '@/hooks/useBids';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatPrice } from '@/lib/artTypes';
import { genUserName } from '@/lib/genUserName';
import {
  Gavel,
  Timer,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle,
  Crown,
  Clock,
} from 'lucide-react';
import type { ArtworkData } from '@/lib/artTypes';
import type { NostrMetadata } from '@nostrify/nostrify';

interface PlaceBidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artwork: ArtworkData;
}

/** Format seconds into human-readable countdown */
function formatCountdown(totalSeconds: number): { text: string; isLastMinute: boolean; isUrgent: boolean } {
  if (totalSeconds <= 0) return { text: 'Auction ended', isLastMinute: false, isUrgent: false };

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isLastMinute = totalSeconds <= 60;
  const isUrgent = totalSeconds <= 300; // 5 minutes

  let text = '';
  if (days > 0) text = `${days}d ${hours}h ${minutes}m`;
  else if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`;
  else if (minutes > 0) text = `${minutes}m ${seconds}s`;
  else text = `${seconds}s`;

  return { text, isLastMinute, isUrgent };
}

export function PlaceBidDialog({ open, onOpenChange, artwork }: PlaceBidDialogProps) {
  const { user } = useCurrentUser();
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [extensionNotice, setExtensionNotice] = useState<string | null>(null);

  const { mutate: placeBid, isPending } = usePlaceBid();
  const { data: bidsData } = useBids(artwork.event?.id);

  const bids = bidsData?.bids ?? [];
  const confirmations = bidsData?.confirmations ?? [];

  // Calculate effective auction end time (including extensions)
  const effectiveEnd = artwork.auction_end
    ? getEffectiveAuctionEnd(artwork.auction_end, confirmations)
    : null;

  // Track extension total for UI display
  const totalExtensionSeconds = confirmations.reduce(
    (sum, c) => sum + (c.duration_extended ?? 0),
    0
  );

  // Highest accepted bid
  const acceptedBids = bids.filter(bid => {
    const confirmation = confirmations.find(c => c.bid_event_id === bid.id);
    return !confirmation || confirmation.status === 'accepted' || confirmation.status === 'winner';
  });
  const highestBid = acceptedBids[0];

  // Minimum next bid (current highest + 1% or + 1000 sats, whichever is larger)
  const currentHighest = highestBid?.amount ?? artwork.starting_bid ?? 0;
  const minIncrement = Math.max(Math.ceil(currentHighest * 0.01), 1000);
  const minNextBid = currentHighest + minIncrement;

  // Countdown timer
  const updateCountdown = useCallback(() => {
    if (!effectiveEnd) return;
    const diff = Math.max(0, Math.floor((effectiveEnd.getTime() - Date.now()) / 1000));
    setSecondsLeft(diff);
  }, [effectiveEnd]);

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);

  // Detect extension notices
  useEffect(() => {
    const extended = confirmations.filter(c => c.duration_extended && c.duration_extended > 0);
    if (extended.length > 0 && totalExtensionSeconds > 0) {
      const latestExtension = extended[extended.length - 1];
      setExtensionNotice(
        `⏱️ Auction extended by ${latestExtension.duration_extended! / 60} minute${latestExtension.duration_extended! / 60 !== 1 ? 's' : ''} due to a last-minute bid!`
      );
    }
  }, [confirmations, totalExtensionSeconds]);

  const { text: countdownText, isLastMinute, isUrgent } = formatCountdown(secondsLeft);
  const auctionEnded = secondsLeft <= 0;
  const currency = artwork.currency ?? 'SAT';

  const handleBidAmountChange = (value: string) => {
    setBidAmount(value);
    setError('');
    const amount = parseInt(value);
    if (value && !isNaN(amount)) {
      if (amount <= currentHighest) {
        setError(`Bid must be higher than the current highest bid of ${formatPrice(currentHighest, currency)}`);
      } else if (amount < minNextBid) {
        setError(`Minimum bid is ${formatPrice(minNextBid, currency)} (${formatPrice(minIncrement, currency)} increment)`);
      }
    }
  };

  const handleQuickBid = (amount: number) => {
    setBidAmount(String(amount));
    setError('');
  };

  const handleSubmit = () => {
    if (!user) return;
    if (!artwork.event?.id) {
      setError('Artwork auction data not available. Please try refreshing.');
      return;
    }

    const amount = parseInt(bidAmount);
    if (!bidAmount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount');
      return;
    }
    if (amount <= currentHighest) {
      setError(`Bid must be higher than current highest: ${formatPrice(currentHighest, currency)}`);
      return;
    }
    if (amount < minNextBid) {
      setError(`Minimum bid is ${formatPrice(minNextBid, currency)}`);
      return;
    }

    placeBid(
      {
        artworkEventId: artwork.event.id,
        amount,
        currency,
      },
      {
        onSuccess: () => {
          setBidAmount('');
          setError('');
          // Don't close dialog so user can see the bid in history
        },
      }
    );
  };

  // Quick bid options
  const quickBidOptions = [
    minNextBid,
    minNextBid + minIncrement,
    minNextBid + minIncrement * 2,
  ];

  const topBidder = useAuthor(highestBid?.bidder_pubkey ?? '');
  const topBidderMeta: NostrMetadata | undefined = topBidder.data?.metadata;
  const topBidderName = topBidderMeta?.name ?? (highestBid ? genUserName(highestBid.bidder_pubkey) : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-red-500" />
            Place a Bid
          </DialogTitle>
          <DialogDescription>
            {artwork.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown Timer */}
          {artwork.auction_end && (
            <div className={`rounded-lg p-3 text-center ${
              auctionEnded
                ? 'bg-gray-100 dark:bg-gray-800'
                : isLastMinute
                ? 'bg-red-50 dark:bg-red-950 border-2 border-red-400 animate-pulse'
                : isUrgent
                ? 'bg-orange-50 dark:bg-orange-950 border border-orange-300'
                : 'bg-blue-50 dark:bg-blue-950 border border-blue-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {auctionEnded ? (
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                ) : isLastMinute ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : (
                  <Clock className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {auctionEnded ? 'Auction Ended' : isLastMinute ? 'LAST MINUTE!' : 'Time Remaining'}
                </span>
              </div>
              <div className={`text-2xl font-bold tabular-nums ${
                auctionEnded ? 'text-gray-500' : isLastMinute ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-blue-600'
              }`}>
                {auctionEnded ? 'Ended' : countdownText}
              </div>
              {isLastMinute && !auctionEnded && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  Bidding in the last minute extends the auction by 5 minutes!
                </p>
              )}
              {totalExtensionSeconds > 0 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Extended by {Math.round(totalExtensionSeconds / 60)}m total
                </p>
              )}
            </div>
          )}

          {/* Extension Notice */}
          {extensionNotice && (
            <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950">
              <Timer className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-700 dark:text-orange-300 text-sm">
                {extensionNotice}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Bid Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">
                {highestBid ? 'Highest Bid' : 'Starting Bid'}
              </p>
              <p className="font-bold text-lg text-red-600">
                {formatPrice(currentHighest, currency)}
              </p>
              {topBidderName && highestBid && (
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <p className="text-xs text-muted-foreground truncate">{topBidderName}</p>
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Min. Next Bid</p>
              <p className="font-bold text-lg">
                {formatPrice(minNextBid, currency)}
              </p>
              <p className="text-xs text-muted-foreground">+{formatPrice(minIncrement, currency)} increment</p>
            </div>
          </div>

          {/* Total bids */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{bids.length} bid{bids.length !== 1 ? 's' : ''} so far</span>
          </div>

          <Separator />

          {/* Bid Input */}
          {!auctionEnded && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="bid-amount">Your Bid (in sats)</Label>
                <div className="flex gap-2">
                  <Input
                    id="bid-amount"
                    type="number"
                    placeholder={`Min. ${minNextBid.toLocaleString()} sats`}
                    value={bidAmount}
                    onChange={(e) => handleBidAmountChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !error && handleSubmit()}
                    min={minNextBid}
                    className={error ? 'border-red-500' : ''}
                  />
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>

              {/* Quick bid buttons */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Quick bid:</p>
                <div className="flex gap-2 flex-wrap">
                  {quickBidOptions.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickBid(amount)}
                      className="text-xs"
                    >
                      {amount.toLocaleString()} sats
                    </Button>
                  ))}
                </div>
              </div>

              {!user && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    You must be logged in to place a bid.
                  </AlertDescription>
                </Alert>
              )}

              {isLastMinute && !auctionEnded && (
                <Alert className="border-red-300 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                    <strong>Last minute rule:</strong> Placing a bid now will automatically extend the auction by 5 minutes, giving everyone a fair chance to respond.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!user || isPending || !!error || !bidAmount}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                size="lg"
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Placing Bid...
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4 mr-2" />
                    Place Bid{bidAmount && !isNaN(parseInt(bidAmount)) ? ` — ${parseInt(bidAmount).toLocaleString()} sats` : ''}
                  </>
                )}
              </Button>
            </div>
          )}

          {auctionEnded && (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-muted-foreground font-medium">This auction has ended.</p>
              {highestBid && (
                <p className="text-sm text-muted-foreground mt-1">
                  Final price: <strong>{formatPrice(highestBid.amount, currency)}</strong>
                </p>
              )}
            </div>
          )}

          {/* How bidding works */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How it works</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Bids are published to the Nostr network</li>
              <li>The artist confirms bids via Nostr events</li>
              <li>Last-minute bids extend the auction by 5 minutes</li>
              <li>The highest confirmed bid wins the artwork</li>
              <li>The winner is contacted via Nostr DM</li>
            </ul>
          </div>

          {/* Bid as badge */}
          {user && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Bidding as:</span>
              <Badge variant="outline" className="text-xs">
                {user.pubkey.slice(0, 8)}...
              </Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
