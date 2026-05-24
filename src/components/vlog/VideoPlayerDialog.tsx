import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Calendar, Share2, Link2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';

interface VideoPlayerDialogProps {
  video: NostrEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerDialog({ video, open, onOpenChange }: VideoPlayerDialogProps) {
  const author = useAuthor(video.pubkey);
  const metadata = author.data?.metadata;
  const { toast } = useToast();

  const displayName = metadata?.name || genUserName(video.pubkey);
  const profileImage = metadata?.picture;

  const title = video.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Vlog';
  const summary = video.tags.find(([name]) => name === 'summary')?.[1];

  // Parse imeta tag for video metadata (NIP-71)
  const imetaTag = video.tags.find(([name]) => name === 'imeta');
  let videoUrl = '';
  let duration = '';

  if (imetaTag) {
    for (let i = 1; i < imetaTag.length; i++) {
      const part = imetaTag[i];
      if (part.startsWith('url ')) {
        videoUrl = part.substring(4);
      } else if (part.startsWith('duration ')) {
        const durationSec = parseFloat(part.substring(9));
        const minutes = Math.floor(durationSec / 60);
        const seconds = Math.floor(durationSec % 60);
        duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }

  // Fallback to legacy tags
  if (!videoUrl) {
    videoUrl = video.tags.find(([name]) => name === 'url')?.[1] || '';
  }

  const topicTags = video.tags
    .filter(([name]) => name === 't')
    .map(([, value]) => value)
    .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0 && !['earth-journey', 'vlog', 'bitpopart'].includes(tag))
    .slice(0, 5);

  const handleShareToDevine = () => {
    const identifier = video.tags.find(([name]) => name === 'd')?.[1];
    if (!identifier) return;

    const naddr = nip19.naddrEncode({
      kind: video.kind,
      pubkey: video.pubkey,
      identifier,
    });

    window.open(`https://www.devine.video/v/nostr:${naddr}`, '_blank', 'noopener,noreferrer');
    toast({ title: 'Opening divine.video', description: 'Viewing on divine.video' });
  };

  const handleCopyLink = () => {
    const identifier = video.tags.find(([name]) => name === 'd')?.[1];
    if (!identifier) return;

    const naddr = nip19.naddrEncode({
      kind: video.kind,
      pubkey: video.pubkey,
      identifier,
    });

    const url = `${window.location.origin}/vlog?v=${naddr}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied', description: 'Video link copied to clipboard' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Narrow, tall dialog — portrait-first */}
      <DialogContent className="max-w-sm w-full p-0 overflow-hidden rounded-2xl bg-black border-0 gap-0">

        {/* Video — no fixed aspect ratio, just fills naturally */}
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            className="w-full block"
            style={{ maxHeight: '75vh', background: '#000' }}
          />
        )}

        {/* Info panel below the video */}
        <div className="bg-background px-4 pt-3 pb-4 space-y-3">

          {/* Author + duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback className="text-xs">{displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold leading-tight">{displayName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(video.created_at * 1000), { addSuffix: true })}
                </p>
              </div>
            </div>
            {duration && (
              <Badge variant="outline" className="text-xs">{duration}</Badge>
            )}
          </div>

          {/* Title */}
          <div>
            <h2 className="font-bold text-base leading-tight">{title}</h2>
            {summary && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{summary}</p>
            )}
          </div>

          {/* Tags */}
          {topicTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topicTags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleShareToDevine}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              divine.video
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
