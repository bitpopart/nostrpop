import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Calendar, Share2 } from 'lucide-react';
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
    .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0 && !['earth-journey', 'vlog'].includes(tag))
    .slice(0, 5);

  const handleShareToDevine = () => {
    const identifier = video.tags.find(([name]) => name === 'd')?.[1];
    if (!identifier) return;

    const naddr = nip19.naddrEncode({
      kind: video.kind,
      pubkey: video.pubkey,
      identifier,
    });

    const devineUrl = `https://www.devine.video/v/nostr:${naddr}`;
    window.open(devineUrl, '_blank', 'noopener,noreferrer');

    toast({
      title: 'Opening divine.video',
      description: 'Share your video to divine.video',
    });
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

    toast({
      title: 'Link Copied',
      description: 'Video link copied to clipboard',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="space-y-4 p-6">
          {/* Video Player */}
          {videoUrl && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          )}

          {/* Author Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback>
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(video.created_at * 1000), { addSuffix: true })}
                </p>
              </div>
            </div>
            {duration && (
              <Badge variant="outline">{duration}</Badge>
            )}
          </div>

          {/* Title and Description */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            {summary && (
              <p className="text-muted-foreground">{summary}</p>
            )}
          </div>

          {/* Tags */}
          {topicTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topicTags.map(tag => (
                <Badge key={tag} variant="outline" className="bg-orange-50 dark:bg-orange-900/20">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleShareToDevine}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share to divine.video
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1"
            >
              Copy Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
