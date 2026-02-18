import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditCardDialog } from './EditCardDialog';
import { DeleteCardDialog } from './DeleteCardDialog';
import { ShareToNostrDialog } from './ShareToNostrDialog';
import { EcashGiftDialog } from './EcashGiftDialog';
import { ZapButton } from './ZapButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { useToast } from '@/hooks/useToast';
import { Heart, Download, Calendar, Sparkles, Zap, ExternalLink, Edit, Trash2, MoreVertical, User, Share2, Loader2, Wallet } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { NostrEvent } from '@nostrify/nostrify';

interface CardData {
  title: string;
  description: string;
  category: string;
  pricing: string;
  images: string[];
  created_at: string;
}

interface CardItemProps {
  card: {
    id: string;
    event: NostrEvent;
  } & CardData;
  showAuthor?: boolean;
  onRefetch?: () => void;
}

export function CardItem({ card, showAuthor = false, onRefetch }: CardItemProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const author = useAuthor(card.event.pubkey);
  const authorName = author.data?.metadata?.name ?? genUserName(card.event.pubkey);
  const authorPicture = author.data?.metadata?.picture;

  const isOwner = user && card.event.pubkey === user.pubkey;

  // Generate naddr for addressable events (kind 30402)
  const getCardUrl = (isPreview = false) => {
    const dTag = card.event.tags.find(([name]) => name === 'd')?.[1];
    const basePath = isPreview ? '/share' : '/card';

    if (dTag) {
      try {
        const naddr = nip19.naddrEncode({
          identifier: dTag,
          pubkey: card.event.pubkey,
          kind: card.event.kind,
        });
        return `${basePath}/${naddr}`;
      } catch (error) {
        console.error('Error generating naddr:', error);
        // Fallback to d-tag
        return `${basePath}/${dTag}`;
      }
    }
    // Fallback to event ID
    return `${basePath}/${card.event.id}`;
  };

  const cardUrl = getCardUrl(false); // For viewing
  // const shareUrl = getCardUrl(true); // For sharing/preview (unused for now)

  const likeCard = async (_cardId: string) => {
    toast({
      title: "Liked! ❤️",
      description: "Card liked! (Feature coming soon)",
    });
  };

  // Helper function to get file extension from URL or content type
  const getFileExtension = (url: string, contentType?: string): string => {
    // Try to get extension from URL first
    const urlExtension = url.split('.').pop()?.toLowerCase();
    if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(urlExtension)) {
      return urlExtension === 'jpeg' ? 'jpg' : urlExtension;
    }

    // Fallback to content type
    if (contentType) {
      const typeMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg'
      };
      return typeMap[contentType.toLowerCase()] || 'jpg';
    }

    return 'jpg'; // Default fallback
  };

  const downloadCard = async (cardId: string, images: string[]) => {
    if (!images || images.length === 0) {
      toast({
        title: "No Image",
        description: "This card doesn't have any images to download.",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);

    try {
      const imageUrl = images[0];

      // Try direct download first (for same-origin or CORS-enabled images)
      try {
        const response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || blob.type;
        const extension = getFileExtension(imageUrl, contentType);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecard-${cardId}.${extension}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        toast({
          title: "Downloaded! 📥",
          description: "Card image downloaded successfully.",
        });

      } catch (fetchError) {
        // If fetch fails (likely due to CORS), try opening in new tab as fallback
        console.warn('Direct download failed, trying fallback method:', fetchError);

        // Create a temporary link to open the image in a new tab
        const link = document.createElement('a');
        link.href = imageUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = `ecard-${cardId}.${getFileExtension(imageUrl)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download Initiated 📥",
          description: "Image opened in new tab. Right-click and 'Save As' to download.",
        });
      }

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download card image. Please try right-clicking the image and selecting 'Save As'.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Card Image */}
      <div
        className="cursor-pointer"
        onClick={() => navigate(cardUrl)}
      >
        {card.images && card.images.length > 0 ? (
          <div className="aspect-video relative overflow-hidden">
            <img
              src={card.images[0]}
              alt={card.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {card.images.length > 1 && (
              <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                +{card.images.length - 1} more
              </Badge>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ExternalLink className="h-8 w-8 text-white" />
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center relative">
            <Sparkles className="h-12 w-12 text-purple-400" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ExternalLink className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className="text-lg line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors"
            onClick={() => navigate(cardUrl)}
          >
            {card.title}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {card.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {card.description}
        </CardDescription>

        {/* Author Info - only show when viewing all cards */}
        {showAuthor && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {authorPicture ? (
              <img
                src={authorPicture}
                alt={authorName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-3 w-3 text-gray-500" />
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              by <span className="font-medium">{authorName}</span>
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(card.created_at).toLocaleDateString()}
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Free
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(cardUrl)}
              className="flex-1"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </Button>

            <ShareToNostrDialog
              cardEvent={card.event}
              cardData={card}
            >
              <Button
                variant="outline"
                size="sm"
                className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800"
              >
                <Share2 className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </Button>
            </ShareToNostrDialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => likeCard(card.id)}
            >
              <Heart className="h-3 w-3" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCard(card.id, card.images)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
            </Button>

            <ZapButton
              recipientPubkey={card.event.pubkey}
              eventId={card.id}
              eventTitle={card.title}
              variant="outline"
              size="sm"
              className="bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
            >
              <Zap className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            </ZapButton>
          </div>

          {/* Share Card with Ecash Gift Button */}
          <EcashGiftDialog
            cardTitle={card.title}
            cardUrl={`${window.location.origin}${cardUrl}`}
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
            >
              <Wallet className="h-3 w-3 mr-1" />
              Share Card 🥜
            </Button>
          </EcashGiftDialog>

          {/* Owner actions dropdown - only show for card owner */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Card
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Edit and Delete Dialogs - controlled separately */}
        {isOwner && editDialogOpen && (
          <EditCardDialog
            cardEvent={card.event}
            cardData={card}
            onCardUpdated={onRefetch}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        )}

        {isOwner && deleteDialogOpen && (
          <DeleteCardDialog
            cardEvent={card.event}
            cardTitle={card.title}
            onCardDeleted={onRefetch}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}