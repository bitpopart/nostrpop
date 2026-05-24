import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RelaySelector } from '@/components/RelaySelector';
import { CreateVlogForm } from '@/components/vlog/CreateVlogForm';
import { VideoPlayerDialog } from '@/components/vlog/VideoPlayerDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import {
  Video,
  Plus,
  List,
  Play,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';

// BitPopArt's pubkey (npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz)
const BITPOPART_PUBKEY = '43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c';

interface VlogCardProps {
  vlog: NostrEvent;
}

function VlogCard({ vlog }: VlogCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const author = useAuthor(vlog.pubkey);
  const metadata = author.data?.metadata;
  const { toast } = useToast();

  const displayName = metadata?.name || genUserName(vlog.pubkey);
  const profileImage = metadata?.picture;

  const title = vlog.tags.find(([name]) => name === 'title')?.[1] || 'Untitled';
  const summary = vlog.tags.find(([name]) => name === 'summary')?.[1];

  // Parse imeta tag for video metadata (NIP-71)
  const imetaTag = vlog.tags.find(([name]) => name === 'imeta');
  let thumb = '';
  let duration = '';
  let videoUrl = '';

  if (imetaTag) {
    for (let i = 1; i < imetaTag.length; i++) {
      const part = imetaTag[i];
      if (part.startsWith('url ')) {
        videoUrl = part.substring(4);
      } else if (part.startsWith('image ')) {
        thumb = part.substring(6);
      } else if (part.startsWith('duration ')) {
        const durationSec = parseFloat(part.substring(9));
        const minutes = Math.floor(durationSec / 60);
        const seconds = Math.floor(durationSec % 60);
        duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }

  // Fallback to legacy tags
  if (!videoUrl) videoUrl = vlog.tags.find(([name]) => name === 'url')?.[1] || '';
  if (!thumb) thumb = vlog.tags.find(([name]) => name === 'thumb')?.[1] || '';
  if (!duration) {
    const durationTag = vlog.tags.find(([name]) => name === 'duration')?.[1];
    if (durationTag) {
      const durationSec = parseFloat(durationTag);
      const minutes = Math.floor(durationSec / 60);
      const seconds = Math.floor(durationSec % 60);
      duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  const handleShareToDevine = (e: React.MouseEvent) => {
    e.stopPropagation();
    const identifier = vlog.tags.find(([name]) => name === 'd')?.[1];
    if (!identifier) return;
    const naddr = nip19.naddrEncode({ kind: vlog.kind, pubkey: vlog.pubkey, identifier });
    window.open(`https://www.devine.video/v/nostr:${naddr}`, '_blank', 'noopener,noreferrer');
    toast({ title: 'Opening divine.video', description: 'Viewing on divine.video' });
  };

  const topicTags = vlog.tags
    .filter(([name]) => name === 't')
    .map(([, value]) => value)
    .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0 && !['bitpopart', 'vlog', 'earth-journey'].includes(tag))
    .slice(0, 3);

  return (
    <>
      <div
        className="group cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-md group-hover:shadow-xl transition-all duration-300">
          {thumb ? (
            <img
              src={thumb}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-900 to-gray-900 flex items-center justify-center">
              <Video className="w-12 h-12 text-orange-400 opacity-50" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
              <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-medium px-2 py-0.5 rounded-md">
              {duration}
            </div>
          )}

          {/* Divine.video share button */}
          <button
            onClick={handleShareToDevine}
            className="absolute bottom-2 right-2 bg-purple-600/90 hover:bg-purple-600 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
            title="View on divine.video"
          >
            <ExternalLink className="w-3 h-3" />
            <span>divine</span>
          </button>
        </div>

        {/* Video Info */}
        <div className="mt-3 space-y-1.5">
          {/* Author row */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback className="text-xs">{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground font-medium truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
              {formatDistanceToNow(new Date(vlog.created_at * 1000), { addSuffix: true })}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {title}
          </h3>

          {/* Summary */}
          {summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">{summary}</p>
          )}

          {/* Tags */}
          {topicTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {topicTags.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-1.5 py-0 h-5 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <VideoPlayerDialog
        video={vlog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

function VlogSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

function useVlogs() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['bitpopart-vlogs', BITPOPART_PUBKEY],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query NIP-71 video events (landscape + portrait) by BitPopArt
      const events = await nostr.query([
        {
          kinds: [34235, 34236],
          authors: [BITPOPART_PUBKEY],
          limit: 100,
        }
      ], { signal });

      return events.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

function BitPopArtHeader() {
  const author = useAuthor(BITPOPART_PUBKEY);
  const metadata = author.data?.metadata;

  const name = metadata?.name || 'BitPopArt';
  const about = metadata?.about || '';
  const picture = metadata?.picture || '';
  const banner = metadata?.banner || '';

  return (
    <div className="relative mb-8 rounded-2xl overflow-hidden shadow-lg">
      {/* Banner */}
      <div className="h-40 md:h-56 relative">
        {banner ? (
          <img
            src={banner}
            alt="BitPopArt Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600" />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Profile info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
        <div className="flex items-end gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 border-3 border-white shadow-xl flex-shrink-0">
            <AvatarImage src={picture} alt={name} />
            <AvatarFallback className="text-2xl font-bold bg-orange-500 text-white">
              {name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{name}</h1>
            {about && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2 drop-shadow">{about}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 text-xs">
                <Video className="w-3 h-3 mr-1" />
                Vlog
              </Badge>
              <a
                href="https://www.devine.video"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Share2 className="w-3 h-3" />
                Watch on divine.video
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Vlog() {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const [activeTab, setActiveTab] = useState('browse');
  const { data: vlogs, isLoading, error } = useVlogs();

  useSeoMeta({
    title: 'Vlog - BitPopArt',
    description: 'Bitcoin PopArt short video moments by world traveler Johannes Oppewal',
  });

  const BrowseGrid = () => (
    <>
      {error ? (
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <p className="text-muted-foreground">Failed to load videos. Try another relay?</p>
              <RelaySelector className="w-full" />
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <VlogSkeleton key={i} />
          ))}
        </div>
      ) : !vlogs || vlogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Video className="w-10 h-10 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">No videos found</h3>
                <p className="text-muted-foreground text-sm">
                  No vlogs from BitPopArt yet on this relay. Try switching relays to find content.
                </p>
              </div>
              <RelaySelector className="w-full" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Video count */}
          <p className="text-sm text-muted-foreground mb-4">
            {vlogs.length} {vlogs.length === 1 ? 'video' : 'videos'}
          </p>
          <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vlogs.map((vlog) => (
              <VlogCard key={vlog.id} vlog={vlog} />
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* BitPopArt Profile Header */}
        <BitPopArtHeader />

        {/* Content */}
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Browse Videos
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Upload Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-0">
              <BrowseGrid />
            </TabsContent>

            <TabsContent value="create" className="mt-0">
              <div className="max-w-2xl">
                <CreateVlogForm />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <BrowseGrid />
        )}

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t text-xs text-muted-foreground space-y-1">
          <p>
            Videos by{' '}
            <a
              href="https://primal.net/p/npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              BitPopArt
            </a>
            {' '}· Watch on{' '}
            <a
              href="https://www.devine.video"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:text-purple-600 font-medium"
            >
              divine.video
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
