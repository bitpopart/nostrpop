import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Share2, Loader2, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { NostrEventDebugger } from './NostrEventDebugger';
import type { NostrEvent } from '@nostrify/nostrify';

interface CardData {
  title: string;
  description: string;
  category: string;
  pricing: string;
  images: string[];
  created_at: string;
}

interface ShareToNostrDialogProps {
  cardEvent: NostrEvent;
  cardData: CardData;
  children: React.ReactNode;
}

export function ShareToNostrDialog({ cardEvent, cardData, children }: ShareToNostrDialogProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Generate card URL
  const getCardUrl = () => {
    const dTag = cardEvent.tags.find(([name]) => name === 'd')?.[1];
    if (dTag) {
      try {
        const naddr = nip19.naddrEncode({
          identifier: dTag,
          pubkey: cardEvent.pubkey,
          kind: cardEvent.kind,
        });
        return `${window.location.origin}/card/${naddr}`;
      } catch (error) {
        console.error('Error generating naddr:', error);
        return `${window.location.origin}/card/${dTag}`;
      }
    }
    return `${window.location.origin}/card/${cardEvent.id}`;
  };

  const cardUrl = getCardUrl();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setLinkCopied(true);
      toast({
        title: "Link Copied! 📋",
        description: "Card link has been copied to your clipboard.",
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
      let shareContent = `${cardData.title}\n\n${cardUrl}`;

      // Add the blossom image link after the text content
      if (cardData.images && cardData.images.length > 0) {
        shareContent = `${cardData.title}\n\n${cardUrl}\n\n${cardData.images[0]}`;
      }

      // Add hashtags at the end
      const categoryTag = cardData.category.toLowerCase().replace(/[^a-z0-9]/g, '');
      shareContent += `\n\n#ecard #${categoryTag}`;

      // Prepare tags array
      const tags = [
        ['t', 'ecard'],
        ['t', cardData.category.toLowerCase().replace(/[^a-z0-9]/g, '')],
        ['e', cardEvent.id, '', 'mention'], // Reference the card event
      ];

      // Add the d-tag reference if available
      const dTag = cardEvent.tags.find(([name]) => name === 'd')?.[1];
      if (dTag) {
        tags.push(['a', `${cardEvent.kind}:${cardEvent.pubkey}:${dTag}`, '', 'mention']);
      }

      // Add multiple approaches for maximum compatibility
      if (cardData.images && cardData.images.length > 0) {
        const imageUrl = cardData.images[0];

        // Method 1: Simple image tag (widely supported)
        tags.push(['image', imageUrl]);

        // Method 2: NIP-92 imeta tag (newer clients)
        tags.push([
          'imeta',
          `url ${imageUrl}`,
          'm image/jpeg',
          `alt Preview image for "${cardData.title}" ecard`,
          `fallback ${cardUrl}`
        ]);

        // Method 3: Add r tag for reference (some clients use this)
        tags.push(['r', imageUrl]);

        // Method 4: Add url tag (alternative approach some clients check)
        tags.push(['url', imageUrl]);
      }

      // Create kind 1 note to share the card
      createEvent({
        kind: 1,
        content: shareContent,
        tags
      }, {
        onSuccess: () => {
          toast({
            title: "Posted to Nostr! 📢",
            description: "Your card has been shared with the Nostr community.",
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
            Preview and share "{cardData.title}" with the Nostr community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Card Preview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Card Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Card Image Preview */}
              {cardData.images && cardData.images.length > 0 ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                  <img
                    src={cardData.images[0]}
                    alt={cardData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      if (target.parentElement) {
                        target.parentElement.innerHTML = '<div class="text-center"><div class="text-4xl mb-2">🎨</div><p class="text-muted-foreground">Beautiful Card Art</p></div>';
                      }
                    }}
                  />
                  {cardData.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      +{cardData.images.length - 1} more
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <p className="text-muted-foreground">Beautiful Card Art</p>
                  </div>
                </div>
              )}

              {/* Card Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{cardData.title}</h3>
                <p className="text-muted-foreground text-sm">{cardData.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                    {cardData.category}
                  </span>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                    Free
                  </span>
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
                Copy this link to share the card anywhere.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={cardUrl}
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
                <div className="font-medium">{cardData.title}</div>
                <div className="text-blue-600 dark:text-blue-400 text-sm break-all">{cardUrl}</div>
                {cardData.images && cardData.images.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 dark:text-blue-400 text-sm break-all flex-1">
                        {cardData.images[0]}
                      </div>
                      <div className="shrink-0">
                        <img
                          src={cardData.images[0]}
                          alt={cardData.title}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded border flex items-center justify-center text-xs text-muted-foreground';
                            placeholder.textContent = '🖼️';
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
                  #ecard #{cardData.category.toLowerCase().replace(/[^a-z0-9]/g, '')}
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

          {/* Debug Info - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <NostrEventDebugger cardEvent={cardEvent} cardData={cardData} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}