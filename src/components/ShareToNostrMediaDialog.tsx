/**
 * ShareToNostrMediaDialog
 *
 * A reusable "Share to Nostr" dialog for free download items:
 * wallpapers, GIFs, avatars, banners, coloring pages, desktop wallpapers, free images.
 *
 * Posts a kind 1 note containing the item title, image URL (inline so clients
 * render the image), and relevant hashtags.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Share2, Loader2, Sparkles } from 'lucide-react';

interface ShareToNostrMediaDialogProps {
  /** Title of the item */
  title: string;
  /** Public image URL */
  imageUrl: string;
  /** Optional extra hashtags (without #) */
  hashtags?: string[];
  /** The trigger element — defaults to a purple Share button */
  children?: React.ReactNode;
}

export function ShareToNostrMediaDialog({
  title,
  imageUrl,
  hashtags = [],
  children,
}: ShareToNostrMediaDialogProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Build default note text — user can't edit it here but they can see what goes out
  const baseHashtags = ['bitpopart', 'bitcoin', 'art', ...hashtags].filter(
    (h, i, arr) => h && arr.indexOf(h) === i,
  );
  const hashtagLine = baseHashtags.map(h => `#${h}`).join(' ');

  const noteText = title && title !== 'Untitled'
    ? `${title}\n\n${imageUrl}\n\n${hashtagLine}`
    : `${imageUrl}\n\n${hashtagLine}`;

  const [customText, setCustomText] = useState('');
  const finalText = customText || noteText;

  const postToNostr = () => {
    if (!user) return;

    const tags: string[][] = [
      ['r', imageUrl],
      ['image', imageUrl],
      [
        'imeta',
        `url ${imageUrl}`,
        'm image/jpeg',
        `alt ${title || 'BitPopArt free download'}`,
      ],
      ...baseHashtags.map(h => ['t', h]),
    ];

    createEvent(
      { kind: 1, content: finalText, tags },
      {
        onSuccess: () => {
          toast({
            title: 'Posted to Nostr! 🎉',
            description: 'Your post has been shared with the Nostr community.',
          });
          setIsOpen(false);
          setCustomText('');
        },
        onError: () => {
          toast({
            title: 'Post Failed',
            description: 'Could not post to Nostr. Please try again.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if (!v) setCustomText(''); }}>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            size="default"
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Share to Nostr
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Image preview */}
          <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/30 flex items-center justify-center max-h-56">
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-56 object-contain"
            />
          </div>

          {/* Editable note */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Your Nostr post
            </p>
            <Textarea
              value={customText || noteText}
              onChange={e => setCustomText(e.target.value)}
              rows={5}
              className="text-sm font-mono resize-none"
            />
            <p className="text-[11px] text-muted-foreground">
              You can edit the text before posting.
            </p>
          </div>

          {/* Hashtag preview */}
          <div className="flex flex-wrap gap-1.5">
            {baseHashtags.map(h => (
              <span
                key={h}
                className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
              >
                #{h}
              </span>
            ))}
          </div>

          {/* Actions */}
          {!user ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Log in to post to Nostr
              </p>
              <LoginArea className="mx-auto max-w-52" />
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={postToNostr}
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting…
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Post to Nostr
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
