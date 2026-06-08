import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useArtworks } from '@/hooks/useArtworks';
import { useBids, getEffectiveAuctionEnd } from '@/hooks/useBids';
import { useAuctionBannerSettings } from '@/hooks/useAuctionBannerSettings';
import { isAuctionActive, formatPrice } from '@/lib/artTypes';
import { Gavel, ChevronRight, Zap } from 'lucide-react';
import type { ArtworkData } from '@/lib/artTypes';

// ─── Per-auction countdown cell ───────────────────────────────────────────────

function AuctionCountdown({ artwork }: { artwork: ArtworkData }) {
  // Build stable a-tag so bids against old event versions are included
  const aTag = artwork.event && artwork.artist_pubkey
    ? `${artwork.event.kind ?? 39239}:${artwork.artist_pubkey}:${artwork.id}`
    : undefined;

  const { data: bidsData } = useBids(artwork.event?.id, aTag);
  const confirmations = bidsData?.confirmations ?? [];
  const bids = bidsData?.bids ?? [];

  const effectiveEnd = artwork.auction_end
    ? getEffectiveAuctionEnd(artwork.auction_end, confirmations)
    : null;

  const [secondsLeft, setSecondsLeft] = useState(0);

  const update = useCallback(() => {
    if (!effectiveEnd) return;
    setSecondsLeft(Math.max(0, Math.floor((effectiveEnd.getTime() - Date.now()) / 1000)));
  }, [effectiveEnd]);

  useEffect(() => {
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [update]);

  // Highest accepted bid
  const acceptedBids = bids.filter(bid => {
    const c = confirmations.find(c => c.bid_event_id === bid.id);
    return !c || c.status === 'accepted' || c.status === 'winner';
  });
  const highestBid = acceptedBids[0];
  const currentPrice = highestBid?.amount ?? artwork.starting_bid;

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const isLastMinute = secondsLeft <= 60 && secondsLeft > 0;
  const isUrgent = secondsLeft <= 300 && secondsLeft > 0;

  let timeStr = '';
  if (days > 0) timeStr = `${days}d ${hours}h`;
  else if (hours > 0) timeStr = `${hours}h ${minutes}m`;
  else if (minutes > 0) timeStr = `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  else if (secondsLeft > 0) timeStr = `${secondsLeft}s`;
  else timeStr = 'Ended';

  const timeColor = isLastMinute
    ? 'text-red-300 animate-pulse'
    : isUrgent
    ? 'text-orange-300'
    : 'text-yellow-300';

  return (
    <Link
      to={`/art/${artwork.id}`}
      className="flex items-center gap-3 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group flex-shrink-0"
    >
      {/* Thumbnail */}
      {artwork.images?.[0] && (
        <img
          src={artwork.images[0]}
          alt={artwork.title}
          className="w-8 h-8 rounded object-cover flex-shrink-0 border border-white/20"
        />
      )}

      {/* Info */}
      <div className="min-w-0">
        <p className="text-white text-xs font-semibold truncate max-w-[120px]">{artwork.title}</p>
        {currentPrice && artwork.currency && (
          <p className="text-white/70 text-xs">{formatPrice(currentPrice, artwork.currency)}</p>
        )}
      </div>

      {/* Timer */}
      <div className={`font-mono text-sm font-bold ${timeColor} flex-shrink-0`}>
        {timeStr}
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-white/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
    </Link>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────

export function AuctionBanner() {
  const { data: artworks, isLoading } = useArtworks('auction');
  const { data: bannerSettings } = useAuctionBannerSettings();

  // If admin has disabled the banner, don't show it
  if (bannerSettings && !bannerSettings.enabled) return null;

  // Filter only currently active auctions
  const liveAuctions = (artworks ?? []).filter(a => isAuctionActive(a));

  // Don't render anything while loading or if no live auctions
  if (isLoading || liveAuctions.length === 0) return null;

  const single = liveAuctions.length === 1;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 shadow-md z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 py-2 overflow-x-auto scrollbar-none">

          {/* Label */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
            <Gavel className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              {single ? 'Live Auction' : `${liveAuctions.length} Live Auctions`}
            </span>
          </div>

          <div className="h-4 w-px bg-white/30 flex-shrink-0" />

          {/* One entry per active auction */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
            {liveAuctions.map(artwork => (
              <AuctionCountdown key={artwork.id} artwork={artwork} />
            ))}
          </div>

          {/* Zap prompt on the right */}
          <div className="flex items-center gap-1 flex-shrink-0 text-white/80 text-xs whitespace-nowrap hidden sm:flex">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Bid with Lightning — no account needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
