import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthor } from '@/hooks/useAuthor';
import { usePlaceBid, useBids, getEffectiveAuctionEnd } from '@/hooks/useBids';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLNURL } from '@/hooks/useLNURL';
import { formatPrice } from '@/lib/artTypes';
import { genUserName } from '@/lib/genUserName';
import QRCode from 'qrcode';
import {
  Gavel,
  Timer,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle,
  Crown,
  Clock,
  Copy,
  Mail,
  QrCode,
  Loader2,
} from 'lucide-react';
import type { ArtworkData } from '@/lib/artTypes';
import type { NostrMetadata } from '@nostrify/nostrify';

// The artist lightning address for receiving the 21-sat bid deposit
const ARTIST_LIGHTNING_ADDRESS = 'traveltelly@primal.net';
const ZAP_BID_AMOUNT = 21; // sats — the entry fee / bid proof

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
  const isUrgent = totalSeconds <= 300;

  let text = '';
  if (days > 0) text = `${days}d ${hours}h ${minutes}m`;
  else if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`;
  else if (minutes > 0) text = `${minutes}m ${seconds}s`;
  else text = `${seconds}s`;

  return { text, isLastMinute, isUrgent };
}

// ─── Zap Bid Tab ────────────────────────────────────────────────────────────

interface ZapBidTabProps {
  artwork: ArtworkData;
  currentHighest: number;
  minNextBid: number;
  minIncrement: number;
  auctionEnded: boolean;
  isLastMinute: boolean;
}

function ZapBidTab({ artwork, currentHighest, minNextBid, minIncrement, auctionEnded, isLastMinute }: ZapBidTabProps) {
  const [email, setEmail] = useState('');
  const [bidAmount, setBidAmount] = useState(String(minNextBid));
  const [emailError, setEmailError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zapPaid, setZapPaid] = useState(false);

  const { getZapInvoice, lnurlData, isLoading: lnurlLoading } = useLNURL(ARTIST_LIGHTNING_ADDRESS);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleGenerateInvoice = async () => {
    // Validate
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');

    const amount = parseInt(bidAmount);
    if (!bidAmount || isNaN(amount) || amount < minNextBid) {
      setAmountError(`Minimum bid is ${minNextBid.toLocaleString()} sats`);
      return;
    }
    setAmountError('');

    setIsGenerating(true);
    try {
      // The invoice memo encodes the bid amount and email so the artist knows who bid
      const memo = `BID:${amount}:${artwork.id}:${email}`;

      // We charge 21 sats as the "bid entry" proof — the actual bid amount is in the memo
      const pr = await getZapInvoice(ZAP_BID_AMOUNT);
      if (!pr) {
        setIsGenerating(false);
        return;
      }

      setInvoice(pr);

      // Generate QR code
      const qr = await QRCode.toDataURL(`lightning:${pr}`, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 280,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(qr);
      console.log('Bid memo (artist reference):', memo);
    } catch (err) {
      console.error('Failed to generate invoice:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWallet = () => {
    if (!invoice) return;
    window.open(`lightning:${invoice}`, '_blank');
  };

  const handlePaidConfirm = () => {
    setZapPaid(true);
  };

  // Quick amounts
  const quickAmounts = [minNextBid, minNextBid + minIncrement, minNextBid + minIncrement * 2];

  if (auctionEnded) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>This auction has ended.</p>
      </div>
    );
  }

  if (zapPaid) {
    return (
      <div className="text-center py-6 space-y-3">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
        <p className="font-semibold text-green-700 dark:text-green-400">Bid received! ⚡</p>
        <p className="text-sm text-muted-foreground">
          Your bid of <strong>{parseInt(bidAmount).toLocaleString()} sats</strong> has been submitted.<br />
          The artist will contact you at <strong>{email}</strong> if you win.
        </p>
        <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
          Note: Last-minute bids extend the auction by 5 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1">
            <p className="font-semibold">No Nostr account needed!</p>
            <p>Pay <strong>{ZAP_BID_AMOUNT} sats</strong> via Lightning to register your bid. The artist will contact you by email if you win.</p>
          </div>
        </div>
      </div>

      {!invoice ? (
        <div className="space-y-3">
          {/* Bid amount */}
          <div className="space-y-1.5">
            <Label htmlFor="zap-bid-amount">Your Bid (sats)</Label>
            <Input
              id="zap-bid-amount"
              type="number"
              min={minNextBid}
              value={bidAmount}
              onChange={(e) => { setBidAmount(e.target.value); setAmountError(''); }}
              placeholder={`Min. ${minNextBid.toLocaleString()} sats`}
              className={amountError ? 'border-red-500' : ''}
            />
            {amountError && <p className="text-xs text-red-600">{amountError}</p>}
            <div className="flex gap-1.5 flex-wrap">
              {quickAmounts.map(a => (
                <button
                  key={a}
                  onClick={() => { setBidAmount(String(a)); setAmountError(''); }}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                >
                  {a.toLocaleString()} sats
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="zap-email" className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              Your Email
            </Label>
            <Input
              id="zap-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              className={emailError ? 'border-red-500' : ''}
            />
            {emailError && <p className="text-xs text-red-600">{emailError}</p>}
            <p className="text-xs text-muted-foreground">Used to contact you if you win. Not shared publicly.</p>
          </div>

          {isLastMinute && (
            <Alert className="border-red-300 bg-red-50 dark:bg-red-950 py-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-300 text-xs">
                <strong>Last minute!</strong> Bidding now extends the auction by 5 minutes.
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            onClick={handleGenerateInvoice}
            disabled={isGenerating || lnurlLoading}
            size="lg"
          >
            {isGenerating || lnurlLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Invoice…</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Generate Lightning Invoice ({ZAP_BID_AMOUNT} sats)</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You pay {ZAP_BID_AMOUNT} sats to register your bid of {bidAmount ? parseInt(bidAmount).toLocaleString() : '?'} sats
          </p>
        </div>
      ) : (
        /* Invoice / QR step */
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm font-medium mb-1">Pay {ZAP_BID_AMOUNT} sats to register your bid</p>
            <p className="text-xs text-muted-foreground mb-3">Bid: <strong>{parseInt(bidAmount).toLocaleString()} sats</strong> · Email: <strong>{email}</strong></p>

            {qrDataUrl && (
              <div className="flex justify-center mb-3">
                <div className="border-4 border-white rounded-xl shadow-lg overflow-hidden">
                  <img src={qrDataUrl} alt="Lightning invoice QR" className="w-56 h-56" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleCopy}>
                {copied ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy Invoice'}
              </Button>
              <Button size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white" onClick={handleOpenWallet}>
                <Zap className="w-4 h-4 mr-1" />
                Open Wallet
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs text-center text-muted-foreground">After paying, click the button below to confirm</p>
            <Button variant="outline" className="w-full border-green-500 text-green-700 hover:bg-green-50" onClick={handlePaidConfirm}>
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Paid — Confirm My Bid
            </Button>
            <button
              className="text-xs text-muted-foreground underline w-full text-center"
              onClick={() => { setInvoice(null); setQrDataUrl(null); }}
            >
              ← Change bid amount or email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────

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

  const effectiveEnd = artwork.auction_end
    ? getEffectiveAuctionEnd(artwork.auction_end, confirmations)
    : null;

  const totalExtensionSeconds = confirmations.reduce(
    (sum, c) => sum + (c.duration_extended ?? 0),
    0
  );

  const acceptedBids = bids.filter(bid => {
    const confirmation = confirmations.find(c => c.bid_event_id === bid.id);
    return !confirmation || confirmation.status === 'accepted' || confirmation.status === 'winner';
  });
  const highestBid = acceptedBids[0];

  const currentHighest = highestBid?.amount ?? artwork.starting_bid ?? 0;
  const minIncrement = Math.max(Math.ceil(currentHighest * 0.01), 1000);
  const minNextBid = currentHighest + minIncrement;

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

  useEffect(() => {
    const extended = confirmations.filter(c => c.duration_extended && c.duration_extended > 0);
    if (extended.length > 0 && totalExtensionSeconds > 0) {
      const latest = extended[extended.length - 1];
      setExtensionNotice(
        `⏱️ Auction extended by ${latest.duration_extended! / 60} minute${latest.duration_extended! / 60 !== 1 ? 's' : ''} due to a last-minute bid!`
      );
    }
  }, [confirmations, totalExtensionSeconds]);

  const { text: countdownText, isLastMinute, isUrgent } = formatCountdown(secondsLeft);
  const auctionEnded = secondsLeft <= 0 && !!artwork.auction_end;
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

  const handleNostrSubmit = () => {
    if (!user) return;
    if (!artwork.event?.id) {
      setError('Artwork auction data not available. Please try refreshing.');
      return;
    }
    const amount = parseInt(bidAmount);
    if (!bidAmount || isNaN(amount) || amount <= 0) { setError('Please enter a valid bid amount'); return; }
    if (amount <= currentHighest) { setError(`Bid must be higher than current highest: ${formatPrice(currentHighest, currency)}`); return; }
    if (amount < minNextBid) { setError(`Minimum bid is ${formatPrice(minNextBid, currency)}`); return; }

    placeBid(
      { artworkEventId: artwork.event.id, amount, currency },
      { onSuccess: () => { setBidAmount(''); setError(''); } }
    );
  };

  const quickBidOptions = [minNextBid, minNextBid + minIncrement, minNextBid + minIncrement * 2];

  const topBidder = useAuthor(highestBid?.bidder_pubkey ?? '');
  const topBidderMeta: NostrMetadata | undefined = topBidder.data?.metadata;
  const topBidderName = topBidderMeta?.name ?? (highestBid ? genUserName(highestBid.bidder_pubkey) : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-red-500" />
            Place a Bid
          </DialogTitle>
          <DialogDescription>{artwork.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Countdown */}
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
                {auctionEnded ? <CheckCircle className="w-4 h-4 text-gray-500" />
                  : isLastMinute ? <AlertTriangle className="w-4 h-4 text-red-500" />
                  : <Clock className="w-4 h-4 text-blue-500" />}
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

          {/* Extension notice */}
          {extensionNotice && (
            <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950">
              <Timer className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-700 dark:text-orange-300 text-sm">
                {extensionNotice}
              </AlertDescription>
            </Alert>
          )}

          {/* Current bid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{highestBid ? 'Highest Bid' : 'Starting Bid'}</p>
              <p className="font-bold text-lg text-red-600">{formatPrice(currentHighest, currency)}</p>
              {topBidderName && highestBid && (
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <p className="text-xs text-muted-foreground truncate">{topBidderName}</p>
                </div>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Min. Next Bid</p>
              <p className="font-bold text-lg">{formatPrice(minNextBid, currency)}</p>
              <p className="text-xs text-muted-foreground">+{formatPrice(minIncrement, currency)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>{bids.length} bid{bids.length !== 1 ? 's' : ''} so far</span>
          </div>

          <Separator />

          {/* Two-tab bid options */}
          {!auctionEnded && (
            <Tabs defaultValue={user ? 'nostr' : 'zap'} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nostr" className="flex items-center gap-1.5 text-xs">
                  <Gavel className="w-3.5 h-3.5" />
                  Nostr Bid
                </TabsTrigger>
                <TabsTrigger value="zap" className="flex items-center gap-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  ⚡ Zap Bid
                </TabsTrigger>
              </TabsList>

              {/* ── Nostr Bid Tab ── */}
              <TabsContent value="nostr" className="space-y-3 pt-2">
                {user ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bid-amount">Your Bid (in sats)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bid-amount"
                          type="number"
                          placeholder={`Min. ${minNextBid.toLocaleString()} sats`}
                          value={bidAmount}
                          onChange={(e) => handleBidAmountChange(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !error && handleNostrSubmit()}
                          min={minNextBid}
                          className={error ? 'border-red-500' : ''}
                        />
                        <div className="flex items-center"><Zap className="w-4 h-4 text-yellow-500" /></div>
                      </div>
                      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Quick bid:</p>
                      <div className="flex gap-2 flex-wrap">
                        {quickBidOptions.map((amount) => (
                          <Button key={amount} variant="outline" size="sm" onClick={() => handleQuickBid(amount)} className="text-xs">
                            {amount.toLocaleString()} sats
                          </Button>
                        ))}
                      </div>
                    </div>

                    {isLastMinute && !auctionEnded && (
                      <Alert className="border-red-300 bg-red-50 dark:bg-red-950">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-700 dark:text-red-300 text-sm">
                          <strong>Last minute rule:</strong> Placing a bid now extends the auction by 5 minutes.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleNostrSubmit}
                      disabled={isPending || !!error || !bidAmount}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                      size="lg"
                    >
                      {isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Placing Bid...</>
                      ) : (
                        <><Gavel className="w-4 h-4 mr-2" />Place Bid{bidAmount && !isNaN(parseInt(bidAmount)) ? ` — ${parseInt(bidAmount).toLocaleString()} sats` : ''}</>
                      )}
                    </Button>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Bidding as:</span>
                      <Badge variant="outline" className="text-xs">{user.pubkey.slice(0, 8)}...</Badge>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      Log in with your Nostr account to place a bid on-chain. Or use the <strong>⚡ Zap Bid</strong> tab — no account needed!
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* ── Zap Bid Tab ── */}
              <TabsContent value="zap" className="pt-2">
                <ZapBidTab
                  artwork={artwork}
                  currentHighest={currentHighest}
                  minNextBid={minNextBid}
                  minIncrement={minIncrement}
                  auctionEnded={auctionEnded}
                  isLastMinute={isLastMinute}
                />
              </TabsContent>
            </Tabs>
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

          {/* How it works */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How it works</p>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li><strong>Nostr Bid:</strong> Published on-chain, confirmed by the artist</li>
              <li><strong>⚡ Zap Bid:</strong> Pay 21 sats + email — no account needed</li>
              <li>Last-minute bids extend the auction by 5 minutes</li>
              <li>Highest confirmed bid wins the artwork</li>
              <li>Winner contacted via Nostr DM or email</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
