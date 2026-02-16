import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { formatPrice } from '@/lib/artTypes';
import { Share2, Loader2, Copy, Check, ExternalLink, Palette, ShoppingCart, Gavel, Eye } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ArtworkData } from '@/lib/artTypes';

interface ShareArtworkToNostrDialogProps {
  artworkEvent: NostrEvent;
  artworkData: ArtworkData;
  children: React.ReactNode;
}

export function ShareArtworkToNostrDialog({ artworkEvent, artworkData, children }: ShareArtworkToNostrDialogProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate artwork URL
  const getArtworkUrl = () => {
    const dTag = artworkEvent.tags.find(([name]) => name === 'd')?.[1];
    if (dTag) {
      try {
        const naddr = nip19.naddrEncode({
          identifier: dTag,
          pubkey: artworkEvent.pubkey,
          kind: artworkEvent.kind,
        });
        return `${window.location.origin}/art/${naddr}`;
      } catch (error) {
        console.error('Error generating naddr:', error);
        return `${window.location.origin}/art/${dTag}`;
      }
    }
    return `${window.location.origin}/art/${artworkEvent.id}`;
  };

  const artworkUrl = getArtworkUrl();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(artworkUrl);
      setLinkCopied(true);
      toast({
        title: "Link Copied! 📋",
        description: "Artwork link has been copied to your clipboard.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const getSaleStatusInfo = () => {
    switch (artworkData.sale_type) {
      case 'fixed':
        return { label: 'For Sale', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: ShoppingCart };
      case 'auction':
        return { label: 'Auction', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: Gavel };
      case 'sold':
        return { label: 'Sold', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: Check };
      default:
        return { label: 'Display Only', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300', icon: Eye };
    }
  };

  const saleInfo = getSaleStatusInfo();
  const SaleIcon = saleInfo.icon;

  const postToNostr = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post to Nostr.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create the share content with image link after text, before hashtags
      let shareContent = `${artworkData.title}\n\n${artworkUrl}`;

      // Add the artwork image link after the text content
      if (artworkData.images && artworkData.images.length > 0) {
        shareContent = `${artworkData.title}\n\n${artworkUrl}\n\n${artworkData.images[0]}`;
      }

      // Add hashtags at the end
      shareContent += `\n\n#artwork #art #nostr`;

      // Add medium-specific hashtag if available
      if (artworkData.medium) {
        const mediumTag = artworkData.medium.toLowerCase().replace(/[^a-z0-9]/g, '');
        shareContent += ` #${mediumTag}`;
      }

      // Add sale type hashtag
      if (artworkData.sale_type !== 'not_for_sale') {
        shareContent += ` #${artworkData.sale_type}`;
      }

      // Prepare tags array
      const tags = [
        ['t', 'artwork'],
        ['t', 'art'],
        ['t', 'nostr'],
        ['e', artworkEvent.id, '', 'mention'], // Reference the artwork event
      ];

      // Add medium tag if available
      if (artworkData.medium) {
        tags.push(['t', artworkData.medium.toLowerCase().replace(/[^a-z0-9]/g, '')]);
      }

      // Add sale type tag
      if (artworkData.sale_type !== 'not_for_sale') {
        tags.push(['t', artworkData.sale_type]);
      }

      // Add custom tags from artwork
      if (artworkData.tags && artworkData.tags.length > 0) {
        artworkData.tags.forEach(tag => {
          tags.push(['t', tag.toLowerCase()]);
        });
      }

      // Add the d-tag reference if available
      const dTag = artworkEvent.tags.find(([name]) => name === 'd')?.[1];
      if (dTag) {
        tags.push(['a', `${artworkEvent.kind}:${artworkEvent.pubkey}:${dTag}`, '', 'mention']);
      }

      // Add multiple approaches for maximum compatibility
      if (artworkData.images && artworkData.images.length > 0) {
        const imageUrl = artworkData.images[0];

        // Method 1: Simple image tag (widely supported)
        tags.push(['image', imageUrl]);

        // Method 2: NIP-92 imeta tag (newer clients)
        tags.push([
          'imeta',
          `url ${imageUrl}`,
          'm image/jpeg',
          `alt Preview image for "${artworkData.title}" artwork`,
          `fallback ${artworkUrl}`
        ]);

        // Method 3: Add r tag for reference (some clients use this)
        tags.push(['r', imageUrl]);

        // Method 4: Add url tag (alternative approach some clients check)
        tags.push(['url', imageUrl]);
      }

      // Create kind 1 note to share the artwork
      createEvent({
        kind: 1,
        content: shareContent,
        tags
      }, {
        onSuccess: () => {
          toast({
            title: "Posted to Nostr! 🎨",
            description: "Your artwork has been shared with the Nostr community.",
          });
          setIsOpen(false);
        },
        onError: (error) => {
          console.error('Post to Nostr error:', error);
          toast({
            title: "Post Failed",
            description: "Failed to post to Nostr. Please try again.",
            variant: "destructive"
          });
        }
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Post Failed",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share to Nostr
          </DialogTitle>
          <DialogDescription>
            Preview and share "{artworkData.title}" with the Nostr community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Artwork Preview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-orange-500" />
                Artwork Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Artwork Image Preview */}
              {artworkData.images && artworkData.images.length > 0 ? (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20">
                  <img
                    src={artworkData.images[0]}
                    alt={artworkData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<div class="text-center"><div class="text-4xl mb-2">🎨</div><p class="text-muted-foreground">Beautiful Artwork</p></div>';
                      }
                    }}
                  />
                  {artworkData.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      +{artworkData.images.length - 1} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-muted-foreground">Beautiful Artwork</p>
                  </div>
                </div>
              )}

              {/* Artwork Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{artworkData.title}</h3>
                <p className="text-muted-foreground text-sm">{artworkData.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={saleInfo.color}>
                    <SaleIcon className="w-3 h-3 mr-1" />
                    {saleInfo.label}
                  </Badge>
                  {artworkData.medium && (
                    <Badge variant="outline" className="text-xs">
                      {artworkData.medium}
                    </Badge>
                  )}
                  {artworkData.price && artworkData.currency && (
                    <Badge variant="secondary" className="text-xs">
                      {formatPrice(artworkData.price, artworkData.currency)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shareable Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-blue-500" />
                Shareable Link
              </CardTitle>
              <CardDescription>
                Copy this link to share the artwork anywhere.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={artworkUrl}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                  className="shrink-0"
                >
                  {linkCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Post Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Nostr Post Preview</CardTitle>
              <CardDescription>
                This is how your post will appear on Nostr.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                <div className="font-medium">{artworkData.title}</div>
                <div className="text-blue-600 dark:text-blue-400 text-sm break-all">{artworkUrl}</div>
                {artworkData.images && artworkData.images.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 dark:text-blue-400 text-sm break-all flex-1">
                        {artworkData.images[0]}
                      </div>
                      <div className="shrink-0">
                        <img
                          src={artworkData.images[0]}
                          alt={artworkData.title}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center text-xs text-muted-foreground';
                            placeholder.textContent = '🎨';
                            target.parentNode?.replaceChild(placeholder, target);
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      🖼️ Image link included after text, before hashtags
                    </div>
                  </div>
                )}
                <div className="text-purple-600 dark:text-purple-400 text-sm">
                  #artwork #art #nostr
                  {artworkData.medium && ` #${artworkData.medium.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                  {artworkData.sale_type !== 'not_for_sale' && ` #${artworkData.sale_type}`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 sticky bottom-0 bg-background pt-4 border-t mt-6">
            <Button
              onClick={postToNostr}
              disabled={isPending || !user}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Post to Nostr
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>

          {!user && (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please log in to post to Nostr
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}