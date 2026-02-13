import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const ARTIST_PUBKEY = '7d33ba57d8a6e8869a1f1d5215254597594ac0dbfeb01b690def8c461b82db35'; // traveltelly's pubkey

// Content block types
interface ContentBlock {
  id: string;
  type: 'markdown' | 'gallery';
  content: string;
  images: string[];
}

export default function Artist() {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useSeoMeta({
    title: 'Artist - BitPopArt',
    description: 'Learn about the artist behind BitPopArt - Johannes Oppewal, world traveler and Bitcoin PopArt creator',
  });

  // Fetch artist page content (kind 30024 with artist identifier)
  const { data: artistContent, isLoading } = useQuery({
    queryKey: ['artist-page'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      console.log('[Artist] Fetching artist page from pubkey:', ARTIST_PUBKEY);
      
      const events = await nostr.query(
        [{ kinds: [30024], authors: [ARTIST_PUBKEY], '#d': ['artist-page'], limit: 1 }],
        { signal }
      );

      console.log('[Artist] Found events:', events.length);
      
      if (events.length > 0) {
        const event = events[0];
        console.log('[Artist] Event found:', {
          id: event.id.substring(0, 8),
          title: event.tags.find(t => t[0] === 'title')?.[1],
          hasImage: !!event.tags.find(t => t[0] === 'image'),
          contentLength: event.content.length,
          externalUrl: event.tags.find(t => t[0] === 'r')?.[1],
          timestamp: new Date(event.created_at * 1000).toISOString()
        });
        return event;
      }

      console.log('[Artist] No events found, using default content');
      return null;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache old data
  });

  const getContentBlocks = (): ContentBlock[] => {
    if (!artistContent) {
      // Default content
      return [{
        id: '1',
        type: 'markdown',
        content: `# My Story

I have been drawing since childhood, like many of us, and I have never stopped drawing because it is what I love to do most in my life. I mostly drew cartoon designs, and when I completed 8 years of art school (4 years in graphic/media design and 4 years in animation and film), you can still see that illustration style in my work, whether it's in graphic designs or animations.

Creating vector designs and using Adobe Illustrator is the foundation of most of my work. I have been sketching on the iPad (using Procreate) in recent years, but of course, I still use old-school pencil and paper.

Around 2020, I wanted to draw more than just cartoons and tell stories through my art. I began drawing simpler human-like figures. A friend of mine had a sticker machine to print outlines, which allowed me to bring my art to life. During this time, my art style evolved more and more toward this pop art style, and I named it **BitPopArt**.

People often associate the cartoons and, more specifically, the simple figures with the artist Keith Haring. While I use what we call outline figures (consisting of only lines and colors), my intention was never to reference him. As an artist, one's work will always remind others of something, and that is perfectly fine. This is the style that makes me happy.

For me, this style allows me to tell more art stories without losing my cartoon side, and these outline figures were a convenient way to put them on bags, T-shirts, and my camper van, where I conducted my first Art Tour in 2022/23. In 2023, I began developing this style even further.

## Bitcoin

The 'Bit' in BitPopArt stands for Bitcoin. I have been a supporter of Bitcoin since I studied and learned what Bitcoin is. For me it stands for **Freedom**.

## Travel

I get inspiration from around the world. I have traveled to **88 countries** in my life, and many of them more than once. I can say that I've experienced a wide range of cultures. Humans, in general, serve as a significant source of inspiration for me. It's fascinating to observe how we behave, how we perceive the world, and how unique and unpredictable humans can be.

## Nostr

Nostr is a simple, open protocol that enables global, decentralized, and censorship-resistant social media.

Follow me at BitPopArt:  
**npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz**`,
        images: []
      }];
    }

    try {
      const parsed = JSON.parse(artistContent.content);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        return parsed.blocks;
      }
    } catch {
      // If not JSON or doesn't have blocks, treat as legacy single content block
      return [{
        id: '1',
        type: 'markdown',
        content: artistContent.content,
        images: []
      }];
    }

    // Fallback
    return [{
      id: '1',
      type: 'markdown',
      content: artistContent.content,
      images: []
    }];
  };

  const getTitle = (): string => {
    if (artistContent) {
      return artistContent.tags.find(t => t[0] === 'title')?.[1] || 'My Story';
    }
    return 'My Story';
  };

  const getHeaderImage = (): string | null => {
    if (artistContent) {
      return artistContent.tags.find(t => t[0] === 'image')?.[1] || null;
    }
    return null;
  };

  const getExternalUrl = (): string | null => {
    if (artistContent) {
      return artistContent.tags.find(t => t[0] === 'r')?.[1] || null;
    }
    return null;
  };

  const headerImage = getHeaderImage();
  const externalUrl = getExternalUrl();
  const contentBlocks = getContentBlocks();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['artist-page'] });
      await queryClient.refetchQueries({ queryKey: ['artist-page'] });
      toast.success('Page refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh:', error);
      toast.error('Failed to refresh page');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      {/* Header Image */}
      {headerImage && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={headerImage}
            alt="Artist Header"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            {getTitle()}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            {externalUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit External Site
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {contentBlocks.map((block) => (
              <div key={block.id}>
                {/* Markdown Content Block */}
                {block.type === 'markdown' && block.content.trim() && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="prose prose-lg dark:prose-invert max-w-none">
                        <ReactMarkdown>{block.content}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gallery Block */}
                {block.type === 'gallery' && block.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center">
                        <ImageIcon className="h-6 w-6 mr-2" />
                        Gallery
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {block.images.map((imgUrl, index) => (
                          <div
                            key={index}
                            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                            onClick={() => setSelectedImage(imgUrl)}
                          >
                            <img
                              src={imgUrl}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Image Lightbox */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Gallery"
                className="w-full h-auto"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
