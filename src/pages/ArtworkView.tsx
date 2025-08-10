import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useArtwork } from '@/hooks/useArtworks';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';
import { formatPrice, isAuctionActive, getTimeRemaining } from '@/lib/artTypes';
import { ImageGallery } from '@/components/marketplace/ImageGallery';
import { EditArtworkForm } from '@/components/art/EditArtworkForm';
import { PaymentDialog } from '@/components/marketplace/PaymentDialog';
import { ShareArtworkToNostrDialog } from '@/components/art/ShareArtworkToNostrDialog';
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
  Share2
} from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';
import type { ArtworkData } from '@/lib/artTypes';

const ArtworkView = () => {
  const { naddr } = useParams<{ naddr: string }>();
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [artworkId, setArtworkId] = useState<string>('');
  const [artistPubkey, setArtistPubkey] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Decode naddr to get artwork ID and artist pubkey
  useEffect(() => {
    if (naddr) {
      try {
        const decoded = nip19.decode(naddr);
        if (decoded.type === 'naddr') {
          setArtworkId(decoded.data.identifier);
          setArtistPubkey(decoded.data.pubkey);
        }
      } catch (error) {
        console.error('Failed to decode naddr:', error);
      }
    }
  }, [naddr]);

  const { data: artwork, isLoading, error } = useArtwork(artworkId);
  const author = useAuthor(artistPubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const artistName = metadata?.name ?? genUserName(artistPubkey);
  const artistImage = metadata?.picture;

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

    // TODO: Implement bidding flow
    toast({
      title: "Bidding Feature",
      description: "Bidding functionality will be implemented soon.",
    });
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

  // Convert artwork to marketplace product format for payment
  const convertArtworkToProduct = (artwork: ArtworkData) => {
    return {
      id: artwork.id,
      name: artwork.title,
      description: artwork.description,
      images: artwork.images || [],
      currency: artwork.currency || 'SAT',
      price: artwork.price || 0,
      category: 'Artwork',
      type: 'digital' as const, // Artworks are treated as digital products
      stall_id: 'art-gallery',
      created_at: artwork.created_at,
      digital_files: artwork.images || [], // Use artwork images as digital files
      digital_file_names: artwork.images?.map((_, index) => `${artwork.title}_${index + 1}.jpg`) || []
    };
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <CardContent className="py-12 px-8 text-center">
                <Palette className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <CardTitle className="text-red-600 dark:text-red-400 mb-2">
                  Artwork Not Found
                </CardTitle>
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
            {/* Back Button Skeleton */}
            <div className="mb-6">
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Skeleton */}
              <div className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-lg" />
              </div>

              {/* Info Skeleton */}
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

  if (!artwork) {
    return null;
  }

  const isAuction = artwork.sale_type === 'auction';
  const isForSale = artwork.sale_type === 'fixed';
  const isSold = artwork.sale_type === 'sold';
  const auctionActive = isAuction && isAuctionActive(artwork);
  const createdAt = new Date(artwork.created_at);

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
                          <img
                            src={artistImage}
                            alt={artistName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
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
                      {/* Edit Button for Admins */}
                      {user && isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEdit}
                          className="flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </Button>
                      )}

                      {/* Sale Status Badge */}
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
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {artwork.description}
                  </p>
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
                    {/* Price Information */}
                    {isForSale && artwork.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="text-2xl font-bold">
                          {formatPrice(artwork.price, artwork.currency)}
                        </span>
                      </div>
                    )}

                    {isAuction && (
                      <div className="space-y-3">
                        {artwork.current_bid && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Current bid:</span>
                            <span className="text-2xl font-bold text-red-600">
                              {formatPrice(artwork.current_bid, artwork.currency)}
                            </span>
                          </div>
                        )}
                        {artwork.starting_bid && !artwork.current_bid && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Starting bid:</span>
                            <span className="text-2xl font-bold">
                              {formatPrice(artwork.starting_bid, artwork.currency)}
                            </span>
                          </div>
                        )}

                        {auctionActive && artwork.auction_end && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Time remaining:</span>
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <Timer className="w-3 h-3" />
                              <span>{getTimeRemaining(artwork.auction_end)}</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {isSold && artwork.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sold for:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatPrice(artwork.price, artwork.currency)}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4">
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
                          Place Bid
                        </Button>
                      )}

                      {!user && (isForSale || (isAuction && auctionActive)) && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Please log in to {isForSale ? 'purchase' : 'bid on'} this artwork
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Share to Nostr */}
              {artwork.event && (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Share Artwork</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ShareArtworkToNostrDialog
                      artworkEvent={artwork.event}
                      artworkData={artwork}
                    >
                      <Button
                        variant="outline"
                        className="w-full bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                      >
                        <Share2 className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Share to Nostr Community
                      </Button>
                    </ShareArtworkToNostrDialog>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Share this artwork with the Nostr community
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
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
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
    </div>
  );
};

export default ArtworkView;