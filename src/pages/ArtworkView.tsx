import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';

// Admin pubkey — artworks only come from this author
const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useArtwork, useDeleteArtwork } from '@/hooks/useArtworks';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/useToast';
import { useBids, getEffectiveAuctionEnd } from '@/hooks/useBids';
import { genUserName } from '@/lib/genUserName';
import { formatPrice, isAuctionActive } from '@/lib/artTypes';
import { ImageGallery } from '@/components/marketplace/ImageGallery';
import { EditArtworkForm } from '@/components/art/EditArtworkForm';
import { PaymentDialog } from '@/components/marketplace/PaymentDialog';
import { ShareArtworkToNostrDialog } from '@/components/art/ShareArtworkToNostrDialog';
import { PlaceBidDialog } from '@/components/art/PlaceBidDialog';
import { BidHistory } from '@/components/art/BidHistory';
import { ClawstrShare } from '@/components/ClawstrShare';
import { ShareDialog } from '@/components/share/ShareDialog';
import {
  ArrowLeft,
  Calendar,
  User,
  Palette,
  Ruler,
  Tag,
  ExternalLink,
  ShoppingCart,
  Gavel,
  CheckCircle,
  Eye,
  Timer,
  Award,
  Edit,
  Share2,
  Trash2,
  AlertTriangle,
  Crown,
} from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';
import type { ArtworkData } from '@/lib/artTypes';

/** Format seconds as countdown string */
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

const ArtworkView = () => {
  // Support both short slug (/art/artwork-xxx) and legacy naddr (/art/naddr1...)
  const { naddr: slug } = useParams<{ naddr: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [artworkId, setArtworkId] = useState<string>('');
  const [artistPubkey, setArtistPubkey] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Resolve artwork ID and artist pubkey from either a plain slug (d-tag) or a legacy naddr
  useEffect(() => {
    if (!slug) return;
    if (slug.startsWith('naddr1')) {
      // Legacy long naddr — decode it
      try {
        const decoded = nip19.decode(slug);
        if (decoded.type === 'naddr') {
          setArtworkId(decoded.data.identifier);
          setArtistPubkey(decoded.data.pubkey);
        }
      } catch (error) {
        console.error('Failed to decode naddr:', error);
      }
    } else {
      // Short slug — just the d-tag, always by the admin
      setArtworkId(slug);
      setArtistPubkey(ADMIN_PUBKEY);
    }
  }, [slug]);

  const { data: artwork, isLoading, error } = useArtwork(artworkId, artistPubkey);
  const { mutate: deleteArtwork } = useDeleteArtwork();
  const author = useAuthor(artistPubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const artistName = metadata?.name ?? genUserName(artistPubkey);
  const artistImage = metadata?.picture;

  // Bids data for live auction
  const { data: bidsData } = useBids(artwork?.event?.id);
  const bids = bidsData?.bids ?? [];
  const confirmations = bidsData?.confirmations ?? [];

  // Get effective auction end (base + extensions)
  const effectiveEnd = artwork?.auction_end
    ? getEffectiveAuctionEnd(artwork.auction_end, confirmations)
    : null;

  // Total extension seconds
  const totalExtensionSeconds = confirmations.reduce(
    (sum, c) => sum + (c.duration_extended ?? 0),
    0
  );

  // Live countdown
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

  // Determine highest accepted bid
  const acceptedBids = bids.filter(bid => {
    const confirmation = confirmations.find(c => c.bid_event_id === bid.id);
    return !confirmation || confirmation.status === 'accepted' || confirmation.status === 'winner';
  });
  const highestBid = acceptedBids[0];
  const currentBidAmount = highestBid?.amount ?? artwork?.starting_bid;

  useSeoMeta({
    title: artwork ? `${artwork.title} - Art Gallery` : 'Artwork - Art Gallery',
    description: artwork?.description || 'View this unique digital artwork on BitPop Cards',
  });

  const handleBuy = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to purchase artwork.",
        variant: "destructive"
      });
      return;
    }
    if (!artwork) return;
    setShowPaymentDialog(true);
  };

  const handleBid = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to place bids.",
        variant: "destructive"
      });
      return;
    }
    setShowBidDialog(true);
  };

  const handleEdit = () => {
    if (!user || !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can edit artworks.",
        variant: "destructive"
      });
      return;
    }
    setIsEditing(true);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    toast({
      title: "Artwork Updated",
      description: "Your artwork has been updated successfully.",
    });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!artwork || !user) return;
    const canDelete = isAdmin || artwork.artist_pubkey === user.pubkey;
    if (!canDelete) {
      toast({
        title: "Access Denied",
        description: "Only admins or artwork owners can delete artworks.",
        variant: "destructive"
      });
      return;
    }
    if (confirm(`Are you sure you want to delete "${artwork.title}"? This action cannot be undone.`)) {
      deleteArtwork({ artworkId: artwork.id, artistPubkey: artwork.artist_pubkey }, {
        onSuccess: () => { navigate('/art'); }
      });
    }
  };

  // Convert artwork to marketplace product format for payment
  const convertArtworkToProduct = (artwork: ArtworkData) => ({
    id: artwork.id,
    name: artwork.title,
    description: artwork.description,
    images: artwork.images || [],
    currency: artwork.currency || 'SAT',
    price: artwork.price || 0,
    category: 'Artwork',
    type: 'digital' as const,
    stall_id: 'art-gallery',
    created_at: artwork.created_at,
    digital_files: artwork.images || [],
    digital_file_names: artwork.images?.map((_, index) => `${artwork.title}_${index + 1}.jpg`) || []
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <CardContent className="py-12 px-8 text-center">
                <Palette className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <CardTitle className="text-red-600 dark:text-red-400 mb-2">Artwork Not Found</CardTitle>
                <CardDescription className="mb-6">
                  The artwork you're looking for doesn't exist or has been removed.
                </CardDescription>
                <Button asChild>
                  <Link to="/art">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Gallery
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6"><Skeleton className="h-10 w-32" /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4"><Skeleton className="aspect-square w-full rounded-lg" /></div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </div>
                <Skeleton className="h-px w-full" />
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!artwork) return null;

  const isAuction = artwork.sale_type === 'auction';
  const isForSale = artwork.sale_type === 'fixed';
  const isSold = artwork.sale_type === 'sold';

  // Auction active uses effective end (including extensions)
  const auctionActive = isAuction && (effectiveEnd ? effectiveEnd > new Date() : isAuctionActive(artwork));

  const createdAt = new Date(artwork.created_at);
  const { text: countdownText, isLastMinute, isUrgent } = formatCountdown(secondsLeft);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link to="/art">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Gallery
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Artwork Images */}
            <div className="space-y-4">
              <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  {artwork.images && artwork.images.length > 0 ? (
                    <ImageGallery images={artwork.images} productName={artwork.title} />
                  ) : (
                    <div className="aspect-square bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                      <div className="text-center">
                        <Palette className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                        <p className="text-gray-500 dark:text-gray-400">No image available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bid History below image on desktop */}
              {isAuction && artwork.event && (
                <BidHistory
                  artwork={{
                    id: artwork.id,
                    event: artwork.event,
                    starting_bid: artwork.starting_bid,
                    currency: artwork.currency,
                    auction_end: artwork.auction_end,
                  }}
                />
              )}
            </div>

            {/* Artwork Information */}
            <div className="space-y-6">
              {/* Title and Artist */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl">{artwork.title}</CardTitle>
                      <div className="flex items-center space-x-3">
                        {artistImage ? (
                          <img src={artistImage} alt={artistName} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{artistName}</p>
                          <p className="text-xs text-muted-foreground">Artist</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions and Status */}
                    <div className="flex items-center space-x-3">
                      {user && (isAdmin || artwork.artist_pubkey === user.pubkey) && (
                        <div className="flex items-center space-x-2">
                          {isAdmin && (
                            <Button variant="outline" size="sm" onClick={handleEdit} className="flex items-center space-x-2">
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </Button>
                          )}
                          <Button variant="destructive" size="sm" onClick={handleDelete} className="flex items-center space-x-2">
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      )}

                      <div>
                        {isSold && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Sold</span>
                          </Badge>
                        )}
                        {isForSale && (
                          <Badge className="flex items-center space-x-1 bg-blue-500">
                            <ShoppingCart className="w-3 h-3" />
                            <span>For Sale</span>
                          </Badge>
                        )}
                        {isAuction && (
                          <Badge
                            variant={auctionActive ? "destructive" : "secondary"}
                            className="flex items-center space-x-1"
                          >
                            <Gavel className="w-3 h-3" />
                            <span>{auctionActive ? 'Live Auction' : 'Auction Ended'}</span>
                          </Badge>
                        )}
                        {artwork.sale_type === 'not_for_sale' && (
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>Display Only</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{artwork.description}</p>
                </CardContent>
              </Card>

              {/* Pricing and Actions */}
              {(isForSale || isAuction || isSold) && artwork.currency && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isForSale && 'Purchase'}
                      {isAuction && 'Auction'}
                      {isSold && 'Sale Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* Fixed Price */}
                    {isForSale && artwork.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="text-2xl font-bold">
                          {formatPrice(artwork.price, artwork.currency)}
                        </span>
                      </div>
                    )}

                    {/* Auction Info */}
                    {isAuction && (
                      <div className="space-y-3">
                        {/* Live countdown */}
                        {artwork.auction_end && (
                          <div className={`rounded-lg p-3 text-center ${
                            !auctionActive
                              ? 'bg-gray-100 dark:bg-gray-800'
                              : isLastMinute
                              ? 'bg-red-50 dark:bg-red-950 border-2 border-red-400 animate-pulse'
                              : isUrgent
                              ? 'bg-orange-50 dark:bg-orange-950 border border-orange-300'
                              : 'bg-blue-50 dark:bg-blue-950 border border-blue-200'
                          }`}>
                            <div className="flex items-center justify-center gap-2 mb-1">
                              {!auctionActive ? (
                                <CheckCircle className="w-4 h-4 text-gray-500" />
                              ) : isLastMinute ? (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              ) : (
                                <Timer className="w-4 h-4 text-blue-500" />
                              )}
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {!auctionActive ? 'Auction Ended' : isLastMinute ? '⚡ LAST MINUTE!' : 'Time Remaining'}
                              </span>
                            </div>
                            <div className={`text-3xl font-bold tabular-nums ${
                              !auctionActive ? 'text-gray-500' : isLastMinute ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                              {auctionActive ? countdownText : 'Ended'}
                            </div>
                            {isLastMinute && auctionActive && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                A bid now extends the auction by 5 minutes!
                              </p>
                            )}
                            {totalExtensionSeconds > 0 && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                ⏱️ Extended by {Math.round(totalExtensionSeconds / 60)}m total due to last-minute bids
                              </p>
                            )}
                          </div>
                        )}

                        {/* Current Bid Display */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">
                              {highestBid ? 'Highest Bid' : 'Starting Bid'}
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                              {currentBidAmount
                                ? formatPrice(currentBidAmount, artwork.currency)
                                : '—'}
                            </p>
                            {highestBid && (
                              <div className="flex items-center gap-1 mt-1">
                                <Crown className="w-3 h-3 text-yellow-500" />
                                <p className="text-xs text-muted-foreground">Leading bidder</p>
                              </div>
                            )}
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Total Bids</p>
                            <p className="text-2xl font-bold">{bids.length}</p>
                            <p className="text-xs text-muted-foreground">participants</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sold info */}
                    {isSold && artwork.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sold for:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(artwork.price, artwork.currency)}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 space-y-2">
                      {isForSale && (
                        <Button
                          onClick={handleBuy}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                          size="lg"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now for {artwork.price && formatPrice(artwork.price, artwork.currency)}
                        </Button>
                      )}

                      {isAuction && auctionActive && (
                        <Button
                          onClick={handleBid}
                          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                          size="lg"
                        >
                          <Gavel className="w-4 h-4 mr-2" />
                          {isLastMinute ? '⚡ Place Bid (extends auction!)' : 'Place Bid'}
                        </Button>
                      )}

                      {isAuction && !auctionActive && bids.length > 0 && (
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground">
                            Auction has ended. Winner will be contacted via Nostr.
                          </p>
                        </div>
                      )}

                      {!user && (isForSale || (isAuction && auctionActive)) && (
                        <p className="text-xs text-center text-muted-foreground">
                          Please log in to {isForSale ? 'purchase' : 'bid on'} this artwork
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Share Artwork */}
              {artwork.event && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Share Artwork</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ShareDialog
                      title={artwork.title}
                      description={artwork.description}
                      url={`${window.location.origin}/art/${artworkId}`}
                      imageUrl={artwork.images[0]}
                      category={artwork.medium}
                      contentType="artwork"
                      eventRef={{
                        id: artwork.event.id,
                        kind: artwork.event.kind,
                        pubkey: artwork.event.pubkey,
                        dTag: artworkId
                      }}
                    >
                      <Button
                        variant="outline"
                        className="w-full bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800"
                      >
                        <Share2 className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Share Artwork
                      </Button>
                    </ShareDialog>
                    {isAdmin && (
                      <>
                        <ShareArtworkToNostrDialog artworkEvent={artwork.event} artworkData={artwork}>
                          <Button variant="outline" className="w-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800">
                            <Share2 className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Share to Nostr (Admin)
                          </Button>
                        </ShareArtworkToNostrDialog>
                        <ClawstrShare
                          event={artwork.event}
                          contentType="artwork"
                          trigger={
                            <Button variant="outline" className="w-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800">
                              <Share2 className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                              Share to Clawstr (Admin)
                            </Button>
                          }
                        />
                      </>
                    )}
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Share this artwork with friends and the Nostr community
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Artwork Details */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Artwork Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {artwork.medium && (
                      <div className="flex items-center space-x-2">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Medium</p>
                          <p className="text-sm font-medium">{artwork.medium}</p>
                        </div>
                      </div>
                    )}
                    {artwork.dimensions && (
                      <div className="flex items-center space-x-2">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Dimensions</p>
                          <p className="text-sm font-medium">{artwork.dimensions}</p>
                        </div>
                      </div>
                    )}
                    {artwork.year && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Year</p>
                          <p className="text-sm font-medium">{artwork.year}</p>
                        </div>
                      </div>
                    )}
                    {artwork.edition && (
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Edition</p>
                          <p className="text-sm font-medium">{artwork.edition}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">
                        {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {artwork.certificate_url && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={artwork.certificate_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Certificate
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {artwork.tags && artwork.tags.length > 0 && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {artwork.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Artwork Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Artwork</DialogTitle>
          </DialogHeader>
          {artwork && (
            <EditArtworkForm
              artwork={artwork}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {artwork && showPaymentDialog && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          product={convertArtworkToProduct(artwork)}
        />
      )}

      {/* Place Bid Dialog */}
      {artwork && showBidDialog && (
        <PlaceBidDialog
          open={showBidDialog}
          onOpenChange={setShowBidDialog}
          artwork={artwork}
        />
      )}
    </div>
  );
};

export default ArtworkView;
