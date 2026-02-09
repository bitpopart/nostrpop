import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Zap } from 'lucide-react';

interface ShareToNostrButtonProps {
  url: string;
  title: string;
  description?: string;
  defaultContent?: string;
  image?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ShareToNostrButton({
  url,
  title,
  description,
  defaultContent,
  image,
  variant = 'outline',
  size = 'sm',
  className = '',
}: ShareToNostrButtonProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { mutate: publish, isPending } = useNostrPublish();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  // Ensure URL is absolute
  const shareUrl = url.startsWith('http') ? url : `https://bitpopart.com${url}`;

  // Generate default content
  let generatedContent = defaultContent;
  
  if (!generatedContent) {
    generatedContent = `${title}`;
    if (description) {
      generatedContent += `\n\n${description}`;
    }
    generatedContent += `\n\n🎨 bitpopart.com`;
  }

  const handleShare = () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to share on Nostr.',
        variant: 'destructive',
      });
      return;
    }

    setIsDialogOpen(true);
  };

  const handlePublish = () => {
    let content = customMessage.trim() || generatedContent;
    
    // Add shareUrl to content if not already there
    if (!content.includes(shareUrl) && !content.includes('bitpopart.com')) {
      content += `\n\n${shareUrl}`;
    }
    
    // Add image URL to content if not already there and image exists
    if (image && !content.includes(image)) {
      const lines = content.split('\n');
      const bitpopartIndex = lines.findIndex(line => line.includes('bitpopart.com'));
      
      if (bitpopartIndex !== -1) {
        lines.splice(bitpopartIndex, 0, '', image);
        content = lines.join('\n');
      } else {
        content += `\n\n${image}`;
      }
    }

    // Build tags
    const tags: string[][] = [
      ['r', shareUrl],
    ];

    // Add image tag if image is provided
    if (image) {
      tags.push(['imeta', `url ${image}`]);
    }

    publish(
      {
        kind: 1,
        content,
        tags,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Shared to Nostr!',
            description: 'Your note has been published to the Nostr network.',
          });
          setIsDialogOpen(false);
          setCustomMessage('');
        },
        onError: (error) => {
          console.error('Failed to publish to Nostr:', error);
          toast({
            title: 'Failed to share',
            description: 'Could not publish to Nostr. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleShare}
      >
        <Zap className="h-4 w-4 mr-2" />
        Share to Nostr
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Share to Nostr
            </DialogTitle>
            <DialogDescription>
              Customize your message or use the default text below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {image && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={image}
                  alt={title}
                  className="w-full max-h-48 object-cover"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Your Message</label>
              <Textarea
                placeholder={generatedContent}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Edit the message above or leave blank to use the default.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg border space-y-3">
              <p className="font-semibold text-sm">Preview:</p>
              
              <div className="space-y-2">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {customMessage.trim() || generatedContent}
                </p>
                
                {image && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">📷 Image will be attached</p>
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full max-h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setCustomMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPending || !user}
              >
                {isPending ? 'Publishing...' : 'Publish Note'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
