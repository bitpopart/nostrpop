import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatPrice, isAuctionActive, getTimeRemaining, type ArtworkData } from '@/lib/artTypes';
import {
  Gavel,
  ShoppingCart,
  CheckCircle,
  Eye,
  Timer,
  Edit,
  Trash2
} from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';

interface ArtworkThumbnailProps {
  artwork: ArtworkData;
  onViewDetails: (artwork: ArtworkData) => void;
  onBuy?: (artwork: ArtworkData) => void;
  onBid?: (artwork: ArtworkData) => void;
  onEdit?: (artwork: ArtworkData) => void;
  onDelete?: (artwork: ArtworkData) => void;
}

export function ArtworkThumbnail({ artwork, onViewDetails, onBuy, onBid, onEdit, onDelete }: ArtworkThumbnailProps) {
  const author = useAuthor(artwork.artist_pubkey);
  const metadata: NostrMetadata | undefined = author.data?.metadata;

  const artistName = metadata?.name ?? genUserName(artwork.artist_pubkey);
  const isAuction = artwork.sale_type === 'auction';
  const isForSale = artwork.sale_type === 'fixed';
  const isSold = artwork.sale_type === 'sold';
  const auctionActive = isAuction && isAuctionActive(artwork);

  const getSaleTypeInfo = () => {
    if (isSold) {
      return {
        label: 'Sold',
        variant: 'secondary' as const,
        icon: CheckCircle,
        color: 'text-green-600'
      };
    }

    if (isForSale) {
      return {
        label: 'Buy Now',
        variant: 'default' as const,
        icon: ShoppingCart,
        color: 'text-blue-600'
      };
    }

    if (isAuction) {
      return {
        label: auctionActive ? 'Live Auction' : 'Auction Ended',
        variant: auctionActive ? 'destructive' as const : 'secondary' as const,
        icon: Gavel,
        color: auctionActive ? 'text-red-600' : 'text-gray-600'
      };
    }

    return {
      label: 'View Only',
      variant: 'outline' as const,
      icon: Eye,
      color: 'text-gray-600'
    };
  };

  const saleInfo = getSaleTypeInfo();
  const SaleIcon = saleInfo.icon;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      {/* Artwork Image */}
      <div className="aspect-square relative overflow-hidden bg-white dark:bg-gray-900">
        {artwork.images && artwork.images.length > 0 ? (
          <img
            src={artwork.images[0]}
            alt={artwork.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            style={{
              imageRendering: 'auto',
              willChange: 'transform'
            }}
            onError={(e) => {
              // Show placeholder if image fails to load
              const placeholder = e.currentTarget.parentElement!.querySelector('.image-placeholder');
              if (placeholder) {
                e.currentTarget.style.display = 'none';
                (placeholder as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : (
          <div className="image-placeholder absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No Image</p>
            </div>
          </div>
        )}

        {/* Hidden fallback placeholder for error handling */}
        <div className="image-placeholder absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 hidden items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No Image</p>
          </div>
        </div>

        {/* Sale Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={saleInfo.variant} className="flex items-center space-x-1">
            <SaleIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{saleInfo.label}</span>
          </Badge>
        </div>

        {/* Auction Timer */}
        {isAuction && auctionActive && artwork.auction_end && (
          <div className="absolute top-3 right-3">
            <Badge variant="destructive" className="flex items-center space-x-1 bg-red-500/90 backdrop-blur-sm">
              <Timer className="w-3 h-3" />
              <span className="text-xs font-medium">{getTimeRemaining(artwork.auction_end)}</span>
            </Badge>
          </div>
        )}

        {/* Edit and Delete Buttons for Admins */}
        {(onEdit || onDelete) && (
          <div className={`absolute top-3 ${isAuction && auctionActive && artwork.auction_end ? 'right-20' : 'right-3'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
            {onEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(artwork);
                }}
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-900"
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(artwork);
                }}
                className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(artwork)}
            className="bg-white/90 hover:bg-white text-gray-900"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </div>

      {/* Artwork Info */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Artist */}
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 mb-1">
              {artwork.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              by {artistName}
            </p>
          </div>

          {/* Price/Bid Info */}
          {(isForSale || isAuction || isSold) && artwork.currency && (
            <div className="space-y-1">
              {isForSale && artwork.price && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Price:</span>
                  <span className="font-semibold text-sm">
                    {formatPrice(artwork.price, artwork.currency)}
                  </span>
                </div>
              )}

              {isAuction && (
                <div className="space-y-1">
                  {artwork.current_bid && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Current bid:</span>
                      <span className="font-semibold text-sm text-red-600">
                        {formatPrice(artwork.current_bid, artwork.currency)}
                      </span>
                    </div>
                  )}
                  {artwork.starting_bid && !artwork.current_bid && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Starting bid:</span>
                      <span className="font-semibold text-sm">
                        {formatPrice(artwork.starting_bid, artwork.currency)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isSold && artwork.price && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Sold for:</span>
                  <span className="font-semibold text-sm text-green-600">
                    {formatPrice(artwork.price, artwork.currency)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            {isForSale && onBuy && (
              <Button
                size="sm"
                onClick={() => onBuy(artwork)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Buy Now
              </Button>
            )}

            {isAuction && auctionActive && onBid && (
              <Button
                size="sm"
                onClick={() => onBid(artwork)}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <Gavel className="w-3 h-3 mr-1" />
                Place Bid
              </Button>
            )}

            {(isSold || !auctionActive || artwork.sale_type === 'not_for_sale') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(artwork)}
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}