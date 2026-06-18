/**
 * ShareToNostrMediaDialog
 *
 * Share to Nostr dialog with a live post preview that shows exactly
 * how the note will look in Nostr clients (avatar, name, text, image).
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { genUserName } from '@/lib/genUserName';
import { Share2, Loader2, Eye, Pencil } from 'lucide-react';

interface ShareToNostrMediaDialogProps {
  title: string;
  imageUrl: string;
  hashtags?: string[];
  children?: React.ReactNode;
}

export function ShareToNostrMediaDialog({
  title,
  imageUrl,
  hashtags = [],
  children,
}: ShareToNostrMediaDialogProps) {
  const { user, metadata } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'compose' | 'preview'>('compose');
  const [customText, setCustomText] = useState('');

  // Deduplicated hashtag list
  const baseHashtags = ['bitpopart', 'bitcoin', 'art', ...hashtags].filter(
    (h, i, arr) => h && arr.indexOf(h) === i,
  );
  const hashtagLine = baseHashtags.map(h => `#${h}`).join(' ');

  // Default note — title (if any), image URL inline, hashtags
  const defaultText = [
    title && title !== 'Untitled' ? title : '',
    imageUrl,
    hashtagLine,
  ]
    .filter(Boolean)
    .join('\n\n');

  const noteText = customText || defaultText;

  // Derived for preview: split text into lines, strip the bare image URL line
  // (since we show the image separately), render the rest as the "text" part
  const previewLines = noteText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && l !== imageUrl);

  const displayName =
    metadata?.display_name || metadata?.name || (user ? genUserName(user.pubkey) : 'You');
  const avatarSrc = metadata?.picture;

  const handleOpen = (v: boolean) => {
    setIsOpen(v);
    if (!v) {
      setCustomText('');
      setTab('compose');
    }
  };

  const postToNostr = () => {
    if (!user) return;

    const tags: string[][] = [
      ['r', imageUrl],
      ['image', imageUrl],
      ['imeta', `url ${imageUrl}`, 'm image/jpeg', `alt ${title || 'BitPopArt'}`],
      ...baseHashtags.map(h => ['t', h]),
    ];

    createEvent(
      { kind: 1, content: noteText, tags },
      {
        onSuccess: () => {
          toast({
            title: 'Posted to Nostr! 🎉',
            description: 'Your post is live on the Nostr network.',
          });
          setIsOpen(false);
          setCustomText('');
          setTab('compose');
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
    <Dialog open={isOpen} onOpenChange={handleOpen}>
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

      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-purple-500" />
            Share to Nostr
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex shrink-0 border-b bg-muted/30">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors
              ${tab === 'compose'
                ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-500 bg-background'
                : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab('compose')}
          >
            <Pencil className="h-3.5 w-3.5" />
            Compose
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors
              ${tab === 'preview'
                ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-500 bg-background'
                : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTab('preview')}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── COMPOSE TAB ── */}
          {tab === 'compose' && (
            <>
              {/* Item thumbnail */}
              <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center h-36">
                <img
                  src={imageUrl}
                  alt={title}
                  className="max-w-full max-h-36 object-contain"
                />
              </div>

              {/* Editable text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Post text
                </label>
                <Textarea
                  value={noteText}
                  onChange={e => setCustomText(e.target.value)}
                  rows={6}
                  className="text-sm resize-none leading-relaxed"
                  placeholder="Write something about this artwork…"
                />
                <p className="text-[11px] text-muted-foreground">
                  The image URL is included so Nostr clients display it inline. You can remove or rewrite anything.
                </p>
              </div>

              {/* Hashtag chips */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hashtags</p>
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
              </div>

              {/* Tip to preview */}
              <button
                onClick={() => setTab('preview')}
                className="w-full text-xs text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 py-1 hover:underline"
              >
                <Eye className="h-3 w-3" />
                See preview before posting →
              </button>
            </>
          )}

          {/* ── PREVIEW TAB ── */}
          {tab === 'preview' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                This is how your post will appear in Nostr clients like Primal, Damus, or Amethyst.
              </p>

              {/* Nostr post card mockup */}
              <div className="rounded-2xl border bg-white dark:bg-gray-900 shadow-md overflow-hidden">
                {/* Post header — avatar + name + timestamp */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                  <Avatar className="h-10 w-10 shrink-0 ring-2 ring-purple-100 dark:ring-purple-900">
                    <AvatarImage src={avatarSrc} alt={displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-bold text-sm">
                      {displayName[0]?.toUpperCase() ?? 'Y'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground">just now</p>
                  </div>
                  {/* Nostr logo mark */}
                  <span className="text-[10px] font-bold text-purple-400 dark:text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                    nostr
                  </span>
                </div>

                {/* Post body — text lines (without raw image URL) */}
                <div className="px-4 pb-2 space-y-1">
                  {previewLines.map((line, i) => {
                    // Hashtag line → coloured
                    if (line.startsWith('#') || line.split(' ').every(w => w.startsWith('#'))) {
                      return (
                        <p key={i} className="text-sm text-purple-600 dark:text-purple-400 leading-relaxed">
                          {line}
                        </p>
                      );
                    }
                    // Regular text
                    return (
                      <p key={i} className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {line}
                      </p>
                    );
                  })}
                </div>

                {/* Inline image — exactly how Nostr clients render it */}
                <div className="bg-black/5 dark:bg-black/20 mx-3 mb-3 rounded-xl overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-auto block max-h-72 object-contain"
                  />
                </div>

                {/* Reaction bar mockup */}
                <div className="flex items-center gap-5 px-4 pb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">💬 Reply</span>
                  <span className="flex items-center gap-1">🔁 Repost</span>
                  <span className="flex items-center gap-1 text-orange-500">⚡ Zap</span>
                  <span className="flex items-center gap-1">❤️ Like</span>
                </div>
              </div>

              <p className="text-[11px] text-center text-muted-foreground">
                ← Go back to <button onClick={() => setTab('compose')} className="underline text-purple-600 dark:text-purple-400">Compose</button> to make changes
              </p>
            </div>
          )}
        </div>

        {/* Sticky footer — actions */}
        <div className="shrink-0 border-t px-5 py-4 bg-background">
          {!user ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">Log in to post to Nostr</p>
              <LoginArea className="mx-auto max-w-52" />
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={postToNostr}
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 font-semibold shadow"
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
