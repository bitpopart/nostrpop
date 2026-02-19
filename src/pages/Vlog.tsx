import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RelaySelector } from '@/components/RelaySelector';
import { CreateVlogForm } from '@/components/vlog/CreateVlogForm';
import { VideoPlayerDialog } from '@/components/vlog/VideoPlayerDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import {
  Video,
  Calendar,
  Plus,
  List,
  Play,
  Share2,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import { useToast } from '@/hooks/useToast';
import type { NostrEvent } from '@nostrify/nostrify';

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

  const title = vlog.tags.find(([name]) => name === 'title')?.[1] || 'Untitled Vlog';
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
  
  // Fallback to legacy tags if imeta not present
  if (!videoUrl) {
    videoUrl = vlog.tags.find(([name]) => name === 'url')?.[1] || '';
  }
  if (!thumb) {
    thumb = vlog.tags.find(([name]) => name === 'thumb')?.[1] || '';
  }
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
    
    const naddr = nip19.naddrEncode({
      kind: vlog.kind,
      pubkey: vlog.pubkey,
      identifier,
    });
    
    const devineUrl = `https://www.devine.video/v/nostr:${naddr}`;
    window.open(devineUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: 'Opening divine.video',
      description: 'Share your video to divine.video',
    });
  };

  const topicTags = vlog.tags
    .filter(([name]) => name === 't')
    .map(([, value]) => value)
    .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0 && !['earth-journey', 'vlog'].includes(tag))
    .slice(0, 3);

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={() => setDialogOpen(true)}
      >
        {thumb && (
          <div className="relative aspect-video overflow-hidden bg-black">
            <img
              src={thumb}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
              </div>
            </div>
            {duration && (
              <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {duration}
              </div>
            )}
            
            <button
              onClick={handleShareToDevine}
              className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              title="Share to divine.video"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">divine</span>
            </button>
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profileImage} alt={displayName} />
                <AvatarFallback>
                  {displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{displayName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(vlog.created_at * 1000), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            {summary && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{summary}</p>
            )}
          </div>

          {topicTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {topicTags.map(tag => (
                <Badge key={tag} variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

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
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
    </Card>
  );
}

function useVlogs() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['earth-journey-vlogs'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query video vlogs (NIP-71: kind 34235 landscape + kind 34236 portrait)
      const events = await nostr.query([
        {
          kinds: [34235, 34236],
          '#t': ['earth-journey'],
          limit: 100,
        }
      ], { signal });

      return events.sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export default function Vlog() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('browse');
  const { data: vlogs, isLoading, error } = useVlogs();

  useSeoMeta({
    title: 'eARTh Journey Vlog - BitPopArt',
    description: 'Share 6-second video moments from your journey around the eARTh',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-green-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-orange-500/20">
              <Globe className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-header-text">eARTh Journey Vlog</h1>
              <p className="text-muted-foreground">6-second video moments from around the world</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Share your short video clips and discover them later on{' '}
            <a 
              href="https://divine.video" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              divine.video
            </a>
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mb-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                Browse Vlogs
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Vlog
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className="mt-0">
              {error ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <p className="text-muted-foreground">
                        Failed to load vlogs. Try another relay?
                      </p>
                      <RelaySelector className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <VlogSkeleton key={i} />
                  ))}
                </div>
              ) : !vlogs || vlogs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <Video className="w-16 h-16 mx-auto text-orange-500" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">No vlogs found</h3>
                        <p className="text-muted-foreground mb-4">
                          No vlogs are available yet. Be the first to create one!
                        </p>
                      </div>
                      <RelaySelector className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {vlogs.map((vlog) => (
                    <VlogCard key={vlog.id} vlog={vlog} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Create Tab */}
            <TabsContent value="create" className="mt-0">
              {!user ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <Video className="w-16 h-16 mx-auto text-orange-500" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Login Required</h3>
                        <p className="text-muted-foreground mb-4">
                          Please log in to create vlogs
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <CreateVlogForm />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>eARTh Journey Vlog - BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
